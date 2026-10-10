"""Análisis de música: BPM, rejilla de beats y curva de energía (para cortar al ritmo y encontrar el drop).

  python3 motor/ritmo.py cache/musica/124.mp3 [...]   → BPM, primer beat y energía por segundo
"""
from __future__ import annotations

import subprocess
import sys

import numpy as np

SR = 22050


def load(path: str, sr=SR) -> np.ndarray:
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(sr), "pipe:1"],
                       capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def onset_envelope(x: np.ndarray, hop=512, n_fft=2048):
    win = np.hanning(n_fft).astype(np.float32)
    frames = 1 + (len(x) - n_fft) // hop
    idx = np.arange(n_fft)[None, :] + hop * np.arange(frames)[:, None]
    spec = np.abs(np.fft.rfft(x[idx] * win, axis=1))
    logspec = np.log1p(100 * spec)
    flux = np.maximum(0, np.diff(logspec, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    flux -= np.convolve(flux, np.ones(16) / 16, mode="same")
    return np.maximum(flux, 0), hop / SR


def tempo(env: np.ndarray, dt: float, lo=80, hi=170) -> float:
    ac = np.correlate(env - env.mean(), env - env.mean(), mode="full")[len(env) - 1:]
    lags = np.arange(len(ac)) * dt
    bpms = 60 / np.maximum(lags, 1e-9)
    mask = (bpms >= lo) & (bpms <= hi)
    # preferimos el rango 110–135 típico de dance si hay ambigüedad de octava
    weight = np.exp(-0.5 * ((np.log2(bpms / 122.0)) / 0.6) ** 2)
    k = np.argmax(np.where(mask, ac * weight, -np.inf))
    # refinamiento parabólico
    if 0 < k < len(ac) - 1:
        a, b, c = ac[k - 1], ac[k], ac[k + 1]
        k = k + 0.5 * (a - c) / (a - 2 * b + c + 1e-9)
    return 60.0 / (k * dt)


def beat_phase(env: np.ndarray, dt: float, bpm: float) -> float:
    period = 60.0 / bpm
    t = np.arange(len(env)) * dt
    best, best_phase = -1, 0.0
    for ph in np.linspace(0, period, 64, endpoint=False):
        k = np.round((t - ph) / period)
        d = np.abs(t - ph - k * period)
        score = (env * np.exp(-0.5 * (d / 0.02) ** 2)).sum()
        if score > best:
            best, best_phase = score, ph
    return best_phase


def analyze(path: str) -> dict:
    x = load(path)
    env, dt = onset_envelope(x)
    bpm = tempo(env, dt)
    ph = beat_phase(env, dt, bpm)
    sec = SR
    n = len(x) // sec
    rms = np.sqrt(np.mean(x[: n * sec].reshape(n, sec) ** 2, axis=1))
    db = 20 * np.log10(rms / (rms.max() + 1e-9) + 1e-9)
    # bajo: energía < 150 Hz por segundo (para ver dónde entra el bombo)
    return {"bpm": float(bpm), "phase": float(ph), "dur": len(x) / SR, "db": db}


def beats(info: dict, start: float, end: float) -> list[float]:
    p = 60.0 / info["bpm"]
    k0 = int(np.ceil((start - info["phase"]) / p))
    out, k = [], k0
    while info["phase"] + k * p <= end:
        out.append(info["phase"] + k * p)
        k += 1
    return out


if __name__ == "__main__":
    for path in sys.argv[1:]:
        a = analyze(path)
        bar = "".join(" .:-=+*#%@"[min(9, max(0, int((v + 30) / 3)))] for v in a["db"])
        print(f"{path}: {a['bpm']:.1f} BPM, fase {a['phase']:.3f}s, {a['dur']:.0f}s\n  {bar}")
