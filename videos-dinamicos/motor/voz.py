"""Locución con la API de OpenAI: TTS por frase + Whisper para los tiempos de cada palabra.

  python3 motor/voz.py guiones/nocturna.json            → cache/voz/nocturna.wav + cache/voz/nocturna.json
  python3 motor/voz.py guiones/nocturna.json --probar onyx cedar ash   → compara voces con Whisper

Guion:
{
  "name": "nocturna",
  "voice": "cedar", "model": "gpt-4o-mini-tts-2025-12-15", "speed": 1.08,
  "instructions": "Voz masculina grave…",
  "gap": 0.08,            # pausa entre frases (s)
  "pause_max": 0.12,      # silencios internos más largos que esto se recortan…
  "pause_keep": 0.05,     # …a esta duración (quita los "huecos" que hacen monótono un reel)
  "lines": ["Hay noches que se olvidan.", {"text": "Nocturna.", "gap": 0.3}]
}

Salida JSON: {"dur", "lines": [{"text", "start", "end", "words": [{"text", "start", "end"}]}]}
Los tiempos de las palabras salen de Whisper (whisper-1, granularidad por palabra) y se alinean con
el texto del guion, así que la ortografía de los subtítulos es siempre la del guion.
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
import unicodedata
import wave

import numpy as np
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(ROOT, "cache", "voz")
SR = 48000
API = "https://api.openai.com/v1"
TTS_MODEL = "gpt-4o-mini-tts-2025-12-15"


def key() -> str:
    k = os.environ.get("OPENAI_API_KEY")
    if not k:
        sys.exit("Falta OPENAI_API_KEY")
    return k


# ------------------------------------------------------------------ audio util
def decode(data: bytes) -> np.ndarray:
    """Cualquier formato → float32 mono a 48 kHz (vía FFmpeg)."""
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                       input=data, capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def write_wav(path: str, x: np.ndarray):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    y = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(y.tobytes())


def wav_bytes(x: np.ndarray) -> bytes:
    buf = io.BytesIO()
    y = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(y.tobytes())
    return buf.getvalue()


def envelope(x: np.ndarray, win=0.01) -> np.ndarray:
    n = int(SR * win)
    m = len(x) // n
    return np.sqrt(np.mean(x[: m * n].reshape(m, n) ** 2, axis=1) + 1e-12)


def tighten(x: np.ndarray, pause_max: float, pause_keep: float, thresh_db=-42.0) -> np.ndarray:
    """Recorta silencios al inicio/final y acorta pausas internas largas."""
    win = 0.01
    env = envelope(x, win)
    db = 20 * np.log10(env / (np.max(env) + 1e-9))
    voiced = db > thresh_db
    if not voiced.any():
        return x
    first, last = np.argmax(voiced), len(voiced) - np.argmax(voiced[::-1])
    n = int(SR * win)
    pieces, i = [], first
    while i < last:
        if voiced[i]:
            j = i
            while j < last and voiced[j]:
                j += 1
            pieces.append(x[i * n: j * n])
            i = j
        else:
            j = i
            while j < last and not voiced[j]:
                j += 1
            gap = (j - i) * win
            keep = gap if gap <= pause_max else pause_keep
            k = int(keep * SR)
            mid = (i * n + j * n) // 2
            pieces.append(x[mid - k // 2: mid - k // 2 + k])
            i = j
    y = np.concatenate(pieces)
    # micro-fundidos para que no haya clics
    f = int(0.004 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    pad = int(0.015 * SR)
    return np.concatenate([np.zeros(pad, np.float32), y, np.zeros(pad, np.float32)])


def atempo(x: np.ndarray, speed: float) -> np.ndarray:
    if abs(speed - 1.0) < 1e-3:
        return x
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
                        "-af", f"atempo={speed}", "-f", "f32le", "pipe:1"], input=x.tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


# ------------------------------------------------------------------ OpenAI
def tts(text: str, voice: str, instructions: str, model: str) -> np.ndarray:
    h = hashlib.sha1(json.dumps([text, voice, instructions, model]).encode()).hexdigest()[:16]
    path = os.path.join(CACHE, "frases", f"{h}.wav")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        r = requests.post(f"{API}/audio/speech", headers={"Authorization": f"Bearer {key()}"}, timeout=120,
                          json={"model": model, "voice": voice, "input": text, "instructions": instructions,
                                "response_format": "wav"})
        r.raise_for_status()
        with open(path, "wb") as fh:
            fh.write(r.content)
    with open(path, "rb") as fh:
        return decode(fh.read())


def whisper_words(x: np.ndarray, prompt: str = "") -> list[dict]:
    r = requests.post(f"{API}/audio/transcriptions", headers={"Authorization": f"Bearer {key()}"}, timeout=180,
                      files={"file": ("voz.wav", wav_bytes(x), "audio/wav")},
                      data=[("model", "whisper-1"), ("language", "es"), ("response_format", "verbose_json"),
                            ("timestamp_granularities[]", "word"), ("prompt", prompt)])
    r.raise_for_status()
    d = r.json()
    return [{"text": w["word"], "start": float(w["start"]), "end": float(w["end"])} for w in d.get("words", [])], d.get("text", "")


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


def align(script_words: list[str], heard: list[dict], dur: float) -> list[dict]:
    """Pasa los tiempos de Whisper a las palabras del guion (las que no casan se interpolan)."""
    a = [norm(w) for w in script_words]
    b = [norm(w["text"]) for w in heard]
    times: list[tuple[float, float] | None] = [None] * len(a)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k]["start"], heard[j1 + k]["end"])
        elif tag == "replace" and j2 > j1:
            # reparte el tramo oído entre las palabras del guion, en proporción a su longitud
            t0, t1 = heard[j1]["start"], heard[j2 - 1]["end"]
            lens = np.array([max(1, len(a[i])) for i in range(i1, i2)], float)
            edges = t0 + (t1 - t0) * np.concatenate([[0], np.cumsum(lens) / lens.sum()])
            for k in range(i2 - i1):
                times[i1 + k] = (edges[k], edges[k + 1])
    # interpolación de huecos
    for i in range(len(a)):
        if times[i] is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
            nxt = next((times[j][0] for j in range(i + 1, len(a)) if times[j]), dur)
            times[i] = (prev, max(prev + 0.05, nxt if nxt > prev else prev + 0.2))
    out = []
    for w, (s, e) in zip(script_words, times):
        out.append({"text": w, "start": round(float(s), 3), "end": round(float(max(e, s + 0.06)), 3)})
    # Whisper a veces da duración casi nula a la última palabra: la estiramos hasta el final del audio
    if out:
        out[-1]["end"] = round(max(out[-1]["end"], min(dur - 0.02, out[-1]["start"] + 0.45)), 3)
    return out


# ------------------------------------------------------------------ guion → locución
def build(spec: dict, out_dir: str | None = None) -> dict:
    out_dir = out_dir or CACHE
    voice, model = spec["voice"], spec.get("model", TTS_MODEL)
    inst, speed = spec.get("instructions", ""), float(spec.get("speed", 1.0))
    pieces, lines, t = [], [], 0.0
    lead = float(spec.get("lead", 0.0))
    if lead:
        pieces.append(np.zeros(int(lead * SR), np.float32))
        t = lead
    for k, line in enumerate(spec["lines"]):
        if isinstance(line, str):
            line = {"text": line}
        raw = tts(line["text"], line.get("voice", voice), line.get("instructions", inst), model)
        y = tighten(raw, spec.get("pause_max", 0.12), spec.get("pause_keep", 0.05))
        y = atempo(y, float(line.get("speed", speed)))
        heard, text = whisper_words(y, prompt=line["text"])
        words = align(line["text"].split(), heard, len(y) / SR)
        for w in words:
            w["start"] = round(w["start"] + t, 3)
            w["end"] = round(w["end"] + t, 3)
        lines.append({"text": line["text"], "start": round(t, 3), "end": round(t + len(y) / SR, 3), "words": words,
                      "heard": text.strip()})
        pieces.append(y)
        t += len(y) / SR
        if k < len(spec["lines"]) - 1:
            g = float(line.get("gap", spec.get("gap", 0.08)))
            pieces.append(np.zeros(int(g * SR), np.float32))
            t += g
    tail = float(spec.get("tail", 0.3))
    pieces.append(np.zeros(int(tail * SR), np.float32))
    x = np.concatenate(pieces)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    name = spec["name"]
    write_wav(os.path.join(out_dir, f"{name}.wav"), x)
    data = {"name": name, "dur": round(len(x) / SR, 3), "lines": lines}
    with open(os.path.join(out_dir, f"{name}.json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    return data


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(a=norm(a), b=norm(b)).ratio()


def main(argv):
    spec = json.load(open(argv[0], encoding="utf-8"))
    if "--probar" in argv:
        voices = argv[argv.index("--probar") + 1:]
        text = " ".join(l if isinstance(l, str) else l["text"] for l in spec["lines"][:3])
        for v in voices:
            raw = tts(text, v, spec.get("instructions", ""), spec.get("model", TTS_MODEL))
            y = tighten(raw, spec.get("pause_max", 0.12), spec.get("pause_keep", 0.05))
            _, heard = whisper_words(y)
            print(f"{v:8s} bruto {len(raw)/SR:5.2f}s → {len(y)/SR:5.2f}s  parecido {similarity(text, heard):.2f}  «{heard.strip()}»")
        return
    d = build(spec)
    for l in d["lines"]:
        ok = similarity(l["text"], l["heard"])
        print(f"{l['start']:6.2f}–{l['end']:6.2f}  {ok:.2f}  {l['text']}")
    print(f"total {d['dur']:.2f}s → cache/voz/{d['name']}.wav")


if __name__ == "__main__":
    main(sys.argv[1:])
