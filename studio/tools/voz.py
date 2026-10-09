"""Locuciones con la API de OpenAI, sin silencios muertos.

Para cada frase del guion:
  1. genera la voz con OpenAI TTS (gpt-4o-mini-tts, con indicaciones de actuación),
  2. recorta el aire: las pausas largas dentro de la frase se acortan a un respiro,
  3. la "escucha" con Whisper: comprueba que dijo lo que dice el guion (si no, la
     vuelve a generar) y obtiene el tiempo real de cada palabra,
y luego une las frases casi pegadas, para que el video vaya de corrido.

Salida (misma forma que tools/tts.py, así sirve a todos los componentes):
  public/voz/<nombre>.wav   — locución completa (24 kHz, mono)
  public/voz/<nombre>.json  — tiempos por frase y por palabra (subtítulos y cortes)

Formato del guion (scripts/voz/*.json):
{
  "name": "fresca",
  "lead": 0.05,          # aire antes de la primera palabra (s)
  "gap": 0.06,           # aire entre frases (s); cada línea puede tener el suyo
  "pause_max": 0.14,     # una pausa interna más larga que esto se acorta…
  "pause_keep": 0.06,    # …a esta duración
  "voices": {"voz": {"voice": "coral", "speed": 1.1, "instructions": "…"}},
  "lines": [{"voice": "voz", "text": "¿Tu jugo de caja es puro azúcar?", "gap": 0.12}]
}

Uso:  python3 tools/voz.py scripts/voz/fresca.json [más guiones…] [--force] [--escuchar]
      --force     ignora la caché y vuelve a generar (cada toma de TTS es distinta)
      --escuchar  transcribe la locución final y la imprime, para revisarla de oído
Requiere OPENAI_API_KEY. Modelos configurables con OPENAI_TTS_MODEL y OPENAI_STT_MODEL.
"""
from __future__ import annotations

import difflib
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
CACHE = os.path.join(ROOT, ".cache", "voz")
SR = 24000  # frecuencia nativa de OpenAI TTS (formato pcm)
TTS_MODEL = os.environ.get("OPENAI_TTS_MODEL", "gpt-4o-mini-tts-2025-12-15")
STT_MODEL = os.environ.get("OPENAI_STT_MODEL", "whisper-1")
MIN_MATCH = 0.82  # parecido mínimo entre lo que se escucha y el guion
DEFAULT_STYLE = (
    "Habla en español latinoamericano neutro, con energía y ritmo ágil, como un locutor de reels. "
    "No hagas pausas largas entre frases."
)

_client = None


def client():
    global _client
    if _client is None:
        from openai import OpenAI

        _client = OpenAI(max_retries=4, timeout=120)
    return _client


# ---------------------------------------------------------------- texto
def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ]", "", w)


def letters(text: str) -> str:
    return "".join(norm(w) for w in text.split())


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, letters(a), letters(b)).ratio()


# ---------------------------------------------------------------- audio
def pcm_to_float(raw: bytes) -> np.ndarray:
    return np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0


def to_wav_bytes(x: np.ndarray) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    return buf.getvalue()


def rms_frames(x: np.ndarray, hop: int) -> np.ndarray:
    n = len(x) // hop
    if n == 0:
        return np.zeros(0)
    return np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)


def silent_mask(x: np.ndarray, hop: int, db=-30.0, bridge=0.05) -> np.ndarray:
    """Marca como "aire" lo que está 30 dB por debajo de las vocales: silencio y respiraciones.

    Los chispazos cortos (< `bridge` s) entre dos tramos de aire también cuentan como aire,
    para que una respiración entrecortada no impida recortar la pausa completa.
    """
    r = rms_frames(x, hop)
    if not len(r):
        return r.astype(bool)
    ref = np.percentile(r, 95)  # nivel de las vocales, sin que un pico aislado lo distorsione
    m = r < ref * 10 ** (db / 20)
    max_blip = int(bridge * SR / hop)
    i = 0
    while i < len(m):
        if not m[i]:
            j = i
            while j < len(m) and not m[j]:
                j += 1
            if i > 0 and j < len(m) and j - i <= max_blip:
                m[i:j] = True
            i = j
        else:
            i += 1
    return m


def tighten(x: np.ndarray, pause_max=0.14, pause_keep=0.06, edge=0.03):
    """Recorta el silencio del principio y del final y acorta las pausas internas.

    Devuelve el audio nuevo y un mapa de tiempos (original → recortado) para
    poder trasladar marcas de tiempo si hiciera falta.
    """
    hop = int(SR * 0.01)
    silent = silent_mask(x, hop)
    voiced = np.where(~silent)[0]
    if not len(voiced):
        return x, [(0.0, 0.0)]
    a = max(0, voiced[0] * hop - int(edge * SR))
    b = min(len(x), (voiced[-1] + 1) * hop + int(edge * SR))
    # tramos silenciosos internos más largos que pause_max
    cuts = []
    i = voiced[0]
    end = voiced[-1]
    while i < end:
        if silent[i]:
            j = i
            while j < end and silent[j]:
                j += 1
            if (j - i) * hop / SR > pause_max:
                cuts.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    keep = int(pause_keep * SR)
    fade = int(0.008 * SR)
    pieces, tmap, pos, out_len = [], [], a, 0
    for s, e in cuts:
        # conserva la mitad del respiro a cada lado del corte
        left_end = s + keep // 2
        right_start = e - keep // 2
        pieces.append(x[pos:left_end].copy())
        tmap.append((pos / SR, out_len / SR))
        out_len += left_end - pos
        pos = right_start
    pieces.append(x[pos:b].copy())
    tmap.append((pos / SR, out_len / SR))
    # micro-fundidos en cada unión para que no haya clics
    ramp = np.linspace(0, 1, fade)
    for k in range(len(pieces)):
        p = pieces[k]
        if len(p) > 2 * fade:
            if k > 0:
                p[:fade] *= ramp
            if k < len(pieces) - 1:
                p[-fade:] *= ramp[::-1]
    return np.concatenate(pieces), tmap


def stretch(x: np.ndarray, factor: float) -> np.ndarray:
    """Acelera sin cambiar el tono (atempo de FFmpeg)."""
    if abs(factor - 1) < 1e-3:
        return x
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
         "-af", f"atempo={factor}", "-f", "s16le", "-ar", str(SR), "-ac", "1", "pipe:1"],
        input=(np.clip(x, -1, 1) * 32767).astype("<i2").tobytes(),
        capture_output=True,
        check=True,
    )
    return pcm_to_float(p.stdout)


# ---------------------------------------------------------------- OpenAI
def cache_path(kind: str, key: dict, ext: str) -> str:
    h = hashlib.sha1(json.dumps(key, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
    os.makedirs(os.path.join(CACHE, kind), exist_ok=True)
    return os.path.join(CACHE, kind, f"{h}.{ext}")


def tts(text: str, v: dict, take: int, force: bool) -> np.ndarray:
    key = {"m": v.get("model", TTS_MODEL), "v": v["voice"], "i": v.get("instructions", DEFAULT_STYLE), "s": v.get("api_speed"), "t": text, "take": take}
    path = cache_path("tts", key, "pcm")
    if force or not os.path.exists(path):
        args = dict(model=key["m"], voice=key["v"], input=text, response_format="pcm")
        if key["m"] not in ("tts-1", "tts-1-hd"):
            args["instructions"] = key["i"]
        if key["s"]:
            args["speed"] = key["s"]
        with client().audio.speech.with_streaming_response.create(**args) as r:
            r.stream_to_file(path)
    with open(path, "rb") as f:
        return pcm_to_float(f.read())


PAD = 0.3  # silencio que se añade antes de transcribir: Whisper suele perder la primera palabra si el audio arranca de golpe


def transcribe(x: np.ndarray, prompt: str, force: bool) -> dict:
    pad = np.zeros(int(PAD * SR))
    data = to_wav_bytes(np.concatenate([pad, x, pad]))
    path = cache_path("stt", {"a": hashlib.sha1(data).hexdigest(), "m": STT_MODEL, "p": prompt}, "json")
    if force or not os.path.exists(path):
        for attempt in range(4):
            try:
                r = client().audio.transcriptions.create(
                    model=STT_MODEL,
                    file=("frase.wav", data, "audio/wav"),
                    language="es",
                    prompt=prompt,
                    response_format="verbose_json",
                    timestamp_granularities=["word"],
                )
                break
            except Exception as e:  # red inestable: reintenta con espera creciente
                if attempt == 3:
                    raise
                print(f"  ! Whisper falló ({e}); reintento…", file=sys.stderr)
                time.sleep(2 ** (attempt + 1))
        res = r.model_dump() if hasattr(r, "model_dump") else dict(r)
        with open(path, "w", encoding="utf-8") as f:
            words = [{"word": w["word"], "start": max(0.0, w["start"] - PAD), "end": max(0.0, w["end"] - PAD)} for w in res.get("words") or []]
            json.dump({"text": res.get("text", ""), "words": words}, f, ensure_ascii=False)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------- alineación
def align(script_words: list[str], heard: list[dict], dur: float) -> list[dict]:
    """Asigna a cada palabra del guion el tiempo en que Whisper la escuchó.

    Alineación global (tipo Needleman-Wunsch) por parecido de letras: tolera palabras
    que Whisper no oyó, que oyó de más o que escribió distinto ("48" por "cuarenta y ocho").
    Las que no tienen pareja reciben un tramo interpolado entre sus vecinas.
    """
    s_norm = [norm(w) for w in script_words]
    h_norm = [norm(w["word"]) for w in heard]
    n, m = len(s_norm), len(h_norm)
    GAP = 0.7
    sim = lambda a, b: 1.0 if a == b else difflib.SequenceMatcher(None, a, b).ratio()
    cost = np.zeros((n + 1, m + 1))
    cost[:, 0] = np.arange(n + 1) * GAP
    cost[0, :] = np.arange(m + 1) * GAP
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost[i, j] = min(cost[i - 1, j - 1] + (1 - sim(s_norm[i - 1], h_norm[j - 1])) * 1.4, cost[i - 1, j] + GAP, cost[i, j - 1] + GAP)
    times: list[tuple[float, float] | None] = [None] * n
    i, j = n, m
    while i > 0 and j > 0:
        diag = cost[i - 1, j - 1] + (1 - sim(s_norm[i - 1], h_norm[j - 1])) * 1.4
        if abs(cost[i, j] - diag) < 1e-9:
            if sim(s_norm[i - 1], h_norm[j - 1]) >= 0.5:
                times[i - 1] = (heard[j - 1]["start"], heard[j - 1]["end"])
            i, j = i - 1, j - 1
        elif abs(cost[i, j] - (cost[i - 1, j] + GAP)) < 1e-9:
            i -= 1
        else:
            j -= 1
    # huecos (palabras sin pareja): se interpolan entre vecinos según su largo
    i = 0
    while i < n:
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < n and times[j] is None:
            j += 1
        a = times[i - 1][1] if i > 0 else 0.0
        b = times[j][0] if j < n else dur
        if b <= a:
            b = a + 0.12 * (j - i)
        weights = [len(s_norm[k]) + 1 for k in range(i, j)]
        t = a
        for k in range(i, j):
            d = (b - a) * weights[k - i] / sum(weights)
            times[k] = (t, t + d)
            t += d
        i = j
    # monotonía y límites
    out, last = [], 0.0
    for w, (a, b) in zip(script_words, times):
        a = min(max(a, last), dur)
        b = min(max(b, a + 0.06), dur)
        out.append({"text": w, "start": a, "end": b})
        last = a + 0.02
    return out


# ---------------------------------------------------------------- guion completo
def render_line(line: dict, v: dict, spec: dict, force: bool):
    text = line["text"]
    pause_max = float(line.get("pause_max", spec.get("pause_max", 0.14)))
    pause_keep = float(line.get("pause_keep", spec.get("pause_keep", 0.06)))
    best = None
    for take in range(int(spec.get("takes", 3))):
        x = tts(text, v, take, force)
        x, _ = tighten(x, pause_max, pause_keep)
        x = stretch(x, float(v.get("speed", 1.0)))
        heard = transcribe(x, text, force)
        score = similarity(text, heard["text"])
        if best is None or score > best[0]:
            best = (score, x, heard)
        if score >= MIN_MATCH:
            break
        print(f"  ! toma {take + 1} no coincide ({score:.2f}): «{heard['text'].strip()}» — regenero", file=sys.stderr)
    score, x, heard = best
    if score < MIN_MATCH:
        print(f"  ⚠ «{text}» quedó con parecido {score:.2f}; revísala", file=sys.stderr)
    words = align(text.split(), heard["words"], len(x) / SR)
    return x, words, score


def build(spec: dict, out_dir: str, force=False, listen=False):
    voices = spec["voices"]
    t = float(spec.get("lead", 0.05))
    gap = float(spec.get("gap", 0.06))
    chunks, lines = [], []
    name = spec["name"]
    for line in spec["lines"]:
        v = voices[line["voice"]]
        x, words, score = render_line(line, v, spec, force)
        x = x * float(v.get("gain", 1.0))
        start = t
        lines.append(
            {
                "voice": line["voice"],
                "text": line["text"],
                "start": round(start, 3),
                "end": round(start + len(x) / SR, 3),
                "match": round(score, 3),
                "words": [{"text": w["text"], "start": round(start + w["start"], 3), "end": round(start + w["end"], 3)} for w in words],
            }
        )
        chunks.append((start, x))
        print(f"  ✓ {line['text'][:60]:<60} {len(x) / SR:4.1f}s  (oído {score:.0%})", file=sys.stderr)
        t = start + len(x) / SR + float(line.get("gap", gap))
    duration = t - float(spec["lines"][-1].get("gap", gap)) + float(spec.get("tail", 0.3))
    mix = np.zeros(int(duration * SR) + 1)
    for start, x in chunks:
        i = int(round(start * SR))
        mix[i : i + len(x)] += x[: len(mix) - i]
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, f"{name}.wav"), "wb") as f:
        f.write(to_wav_bytes(mix))
    meta = {"name": name, "engine": f"openai:{TTS_MODEL}+{STT_MODEL}", "duration": round(duration, 3), "lines": lines}
    with open(os.path.join(out_dir, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    talk = sum(l["end"] - l["start"] for l in lines)
    print(f"✓ voz/{name}.wav  {duration:.1f}s  ({len(lines)} frases, {talk / duration:.0%} con voz)", file=sys.stderr)
    if listen:
        heard = transcribe(mix, " ".join(l["text"] for l in spec["lines"]), force)
        print(f"  👂 {heard['text'].strip()}", file=sys.stderr)
    return meta


if __name__ == "__main__":
    args = sys.argv[1:]
    out_dir = os.path.join(ROOT, "public", "voz")
    if "--out-dir" in args:
        i = args.index("--out-dir")
        out_dir = args[i + 1]
        del args[i : i + 2]
    force = "--force" in args
    listen = "--escuchar" in args
    paths = [a for a in args if not a.startswith("--")]
    if not paths:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    for path in paths:
        with open(path, encoding="utf-8") as f:
            build(json.load(f), out_dir, force, listen)
