"""Locuciones en español con voces Piper (offline, vía sherpa-onnx).

Lee un guion JSON y genera:
  public/vo/<nombre>.wav   — la locución completa
  public/vo/<nombre>.json  — tiempos por frase y por palabra (para subtítulos karaoke)

Formato del guion:
{
  "name": "podcast",
  "lead": 0.4,              # silencio inicial (s)
  "gap": 0.25,              # pausa entre frases (s)
  "voices": {"ana": {"model": "es_MX-claude-high", "speed": 1.0, "sid": 0}},
  "lines": [{"voice": "ana", "text": "Hola, ¿qué tal?", "gap": 0.4}]
}

Uso:  python3 tools/tts.py guion.json [--out-dir public/vo]
"""
from __future__ import annotations

import json
import os
import re
import sys
import tarfile
import urllib.request
import wave

import numpy as np
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "..", ".cache", "voices")
SR = 44100
RELEASE = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-{}.tar.bz2"

_engines: dict = {}


def engine(model: str):
    if model in _engines:
        return _engines[model]
    import sherpa_onnx

    d = os.path.join(CACHE, f"vits-piper-{model}")
    if not os.path.isdir(d):
        os.makedirs(CACHE, exist_ok=True)
        tar_path = os.path.join(CACHE, f"{model}.tar.bz2")
        print(f"↓ descargando voz {model}…", file=sys.stderr)
        urllib.request.urlretrieve(RELEASE.format(model), tar_path)
        with tarfile.open(tar_path) as tf:
            tf.extractall(CACHE, filter="data")
        os.remove(tar_path)
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=os.path.join(d, f"{model}.onnx"),
                tokens=os.path.join(d, "tokens.txt"),
                data_dir=os.path.join(d, "espeak-ng-data"),
            ),
            num_threads=4,
        )
    )
    _engines[model] = sherpa_onnx.OfflineTts(cfg)
    return _engines[model]


def synth(text: str, model: str, speed=1.0, sid=0) -> np.ndarray:
    audio = engine(model).generate(text, sid=sid, speed=speed)
    x = np.asarray(audio.samples, dtype=np.float64)
    if audio.sample_rate != SR:
        x = resample_poly(x, SR, audio.sample_rate)
    return x


def frame_rms(x: np.ndarray, hop: int):
    n = len(x) // hop
    return np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)


def trim(x: np.ndarray, pad=0.03):
    hop = int(SR * 0.01)
    r = frame_rms(x, hop)
    on = np.where(r > r.max() * 0.04)[0]
    if len(on) == 0:
        return x
    a = max(0, on[0] * hop - int(pad * SR))
    b = min(len(x), (on[-1] + 1) * hop + int(pad * SR))
    return x[a:b]


def word_timings(x: np.ndarray, text: str, offset: float):
    """Reparte el tiempo entre palabras usando las pausas reales del audio."""
    words = text.split()
    if not words:
        return []
    # sub-frases separadas por puntuación
    groups, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r"[,;:.!?…]$", w):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)

    hop = int(SR * 0.01)
    r = frame_rms(x, hop)
    silent = r < r.max() * 0.05
    runs, start = [], None
    for i, s in enumerate(silent):
        if s and start is None:
            start = i
        elif not s and start is not None:
            if i - start >= 7 and start > 3:  # ≥70 ms y no al inicio
                runs.append((start, i))
            start = None
    total = len(x) / SR
    bounds = [(0.0, total)]
    if len(groups) > 1 and runs:
        # Cada signo de puntuación se asocia al silencio más cercano a donde
        # "debería" caer según la proporción de letras.
        weight = lambda ws: sum(len(w) + 2 for w in ws)
        all_w = weight(words)
        edges, acc, used, ok = [0.0], 0, set(), True
        for g in groups[:-1]:
            acc += weight(g)
            expected = total * acc / all_w
            cands = [
                (abs((a + b) / 2 * hop / SR - expected), i)
                for i, (a, b) in enumerate(runs)
                if i not in used and a * hop / SR > edges[-1]
            ]
            if not cands or min(cands)[0] > total * 0.25:
                ok = False
                break
            _, i = min(cands)
            used.add(i)
            edges += [runs[i][0] * hop / SR, runs[i][1] * hop / SR]
        if ok:
            edges.append(total)
            bounds = [(edges[2 * i], edges[2 * i + 1]) for i in range(len(groups))]
        else:
            groups = [words]
    else:
        groups = [words]

    out = []
    for g, (a, b) in zip(groups, bounds):
        weights = [len(re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I)) + 2 for w in g]
        span = b - a
        t = a
        for w, wt in zip(g, weights):
            d = span * wt / sum(weights)
            out.append({"text": w, "start": round(offset + t, 3), "end": round(offset + t + d, 3)})
            t += d
    return out


def build(spec: dict, out_dir: str):
    voices = spec["voices"]
    t = float(spec.get("lead", 0.3))
    gap = float(spec.get("gap", 0.25))
    chunks, lines = [], []
    for line in spec["lines"]:
        v = voices[line["voice"]]
        x = trim(synth(line["text"], v["model"], v.get("speed", 1.0), v.get("sid", 0)))
        x *= float(v.get("gain", 1.0))
        start = t
        lines.append(
            {
                "voice": line["voice"],
                "text": line["text"],
                "start": round(start, 3),
                "end": round(start + len(x) / SR, 3),
                "words": word_timings(x, line["text"], start),
            }
        )
        chunks.append((start, x))
        t = start + len(x) / SR + float(line.get("gap", gap))
    duration = t + float(spec.get("tail", 0.2))
    mix = np.zeros(int(duration * SR) + 1)
    for start, x in chunks:
        i = int(start * SR)
        mix[i : i + len(x)] += x
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    os.makedirs(out_dir, exist_ok=True)
    name = spec["name"]
    with wave.open(os.path.join(out_dir, f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype("<i2").tobytes())
    meta = {"name": name, "duration": round(duration, 3), "lines": lines}
    with open(os.path.join(out_dir, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print(f"✓ vo/{name}.wav  {duration:.1f}s  ({len(lines)} frases)", file=sys.stderr)
    return meta


if __name__ == "__main__":
    args = sys.argv[1:]
    out_dir = os.path.join(HERE, "..", "public", "vo")
    if "--out-dir" in args:
        i = args.index("--out-dir")
        out_dir = args[i + 1]
        del args[i : i + 2]
    for path in args:
        with open(path, encoding="utf-8") as f:
            build(json.load(f), out_dir)
