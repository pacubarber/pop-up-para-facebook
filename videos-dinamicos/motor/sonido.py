"""Diseño sonoro sintetizado (solo NumPy): risers, golpes, whooshes, tic-tac, latidos…

  python3 motor/sonido.py            → genera todos los efectos en cache/sonidos/*.wav

Nada viene de librerías: cada sonido se construye con osciladores, ruido moldeado en frecuencia (STFT)
y envolventes. Así el video no depende de música con derechos y la retención la sostienen los efectos.
"""
from __future__ import annotations

import os
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "cache", "sonidos")
SR = 48000
RNG = np.random.default_rng(7)


# ------------------------------------------------------------------ utilidades
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def sweep(f0, f1, dur, curve="exp"):
    """Oscilador senoidal con barrido de frecuencia (fase integrada)."""
    t = t_axis(dur)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (t / dur)
    else:
        f = f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def shaped_noise(dur, center, width=0.6, gain=None, n_fft=1024):
    """Ruido con un 'pico' de frecuencia que puede moverse en el tiempo.
    center: función t_normalizado(0–1) → Hz; width en octavas."""
    hop = n_fft // 4
    n = int(dur * SR)
    frames = n // hop + 4
    freqs = np.fft.rfftfreq(n_fft, 1 / SR)
    win = np.hanning(n_fft)
    out = np.zeros(frames * hop + n_fft)
    for k in range(frames):
        u = min(1.0, k * hop / max(1, n))
        c = center(u)
        mag = np.exp(-0.5 * (np.log2(np.maximum(freqs, 20) / c) / width) ** 2)
        spec = mag * np.exp(1j * RNG.uniform(0, 2 * np.pi, len(freqs)))
        frame = np.fft.irfft(spec, n_fft) * win
        out[k * hop:k * hop + n_fft] += frame
    out = out[:n]
    return out / (np.max(np.abs(out)) + 1e-9)


def lowpass(x, hz):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / hz) ** 4), len(x))


def highpass(x, hz):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (1 - 1 / np.sqrt(1 + (f / hz) ** 4)), len(x))


def env_exp(dur, decay, attack=0.002):
    t = t_axis(dur)
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def norm(x, peak=0.9):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def reverb(x, seconds=1.2, mix=0.25):
    """Reverb simple por convolución con ruido que decae."""
    n = int(seconds * SR)
    ir = RNG.normal(0, 1, n) * np.exp(-np.arange(n) / (SR * seconds / 5))
    ir = lowpass(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)
    out = np.zeros(L)
    out[:len(x)] = x * (1 - mix)
    return out + y * mix


def stereo(x, width=0.0, seed=0):
    """Mono → estéreo con un leve ensanchado (retardo corto en un canal)."""
    d = int(0.004 * SR * width)
    left = x
    right = np.concatenate([np.zeros(d), x[:len(x) - d]]) if d else x
    return np.stack([left, right], 1)


def write(name, x):
    os.makedirs(OUT, exist_ok=True)
    if x.ndim == 1:
        x = stereo(x)
    x = norm(x, 0.89)
    y = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    path = os.path.join(OUT, f"{name}.wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(y.tobytes())
    return path


# ------------------------------------------------------------------ efectos
def tick(high=True):
    dur = 0.06
    f = 2600 if high else 1900
    blip = sweep(f, f * 0.9, dur) * env_exp(dur, 0.008)
    click = highpass(RNG.normal(0, 1, int(dur * SR)), 3000) * env_exp(dur, 0.003)
    return blip * 0.8 + click * 0.5


def riser(dur=1.6):
    t = t_axis(dur)
    u = t / dur
    noise = shaped_noise(dur, lambda u: 300 * (6000 / 300) ** (u ** 1.4), 0.5)
    tone = sweep(180, 1400, dur) * (0.5 + 0.5 * np.sin(2 * np.pi * (4 + 18 * u) * t))
    tone2 = sweep(181.5, 1410, dur)
    e = (u ** 2.2)
    x = (noise * 0.7 + tone * 0.35 + tone2 * 0.25) * e
    x[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))
    return stereo(x, 1.0)


def reverse_swell(dur=0.8):
    t = t_axis(dur)
    u = t / dur
    noise = highpass(RNG.normal(0, 1, len(t)), 2500)
    shimmer = sum(np.sin(2 * np.pi * f * t) for f in (3150, 4720, 6310)) * 0.15
    x = (noise + shimmer) * np.exp(5.5 * (u - 1)) * u
    x[-int(0.003 * SR):] *= np.linspace(1, 0, int(0.003 * SR))
    return stereo(x, 1.0)


def boom(dur=1.6, f0=110, f1=36, decay=0.55):
    sub = sweep(f0, f1, dur) * env_exp(dur, decay, 0.003)
    click = lowpass(RNG.normal(0, 1, int(dur * SR)), 3500) * env_exp(dur, 0.025)
    body = lowpass(RNG.normal(0, 1, int(dur * SR)), 400) * env_exp(dur, 0.18)
    x = np.tanh((sub * 1.2 + click * 0.5 + body * 0.4) * 1.6)
    return stereo(reverb(x, 1.4, 0.18)[: int((dur + 0.6) * SR)], 0.6)


def whoosh(dur=0.45, up=True):
    c = (lambda u: 350 * (3200 / 350) ** u) if up else (lambda u: 3200 * (350 / 3200) ** u)
    x = shaped_noise(dur, c, 0.7)
    t = t_axis(dur)
    e = np.sin(np.pi * t / dur) ** 2
    return stereo(x * e, 1.0)


def zoom_hit():
    """Zoom de cámara: subida corta + chasquido + sub."""
    w = whoosh(0.22, True)[:, 0]
    snap = highpass(RNG.normal(0, 1, int(0.08 * SR)), 2500) * env_exp(0.08, 0.01)
    sub = sweep(90, 45, 0.5) * env_exp(0.5, 0.18)
    n = int(0.22 * SR)
    x = np.zeros(n + int(0.6 * SR))
    x[:n] += w * 0.6
    x[n:n + len(snap)] += snap * 0.9
    x[n:n + len(sub)] += sub * 0.9
    return stereo(x, 0.8)


def heartbeat():
    def thump(f=55, d=0.18):
        return sweep(f * 1.6, f, d) * env_exp(d, 0.06, 0.004)
    a, b = thump(60), thump(52)
    x = np.zeros(int(0.7 * SR))
    x[:len(a)] += a
    x[int(0.22 * SR):int(0.22 * SR) + len(b)] += b * 0.8
    return lowpass(x, 300)


def ding():
    dur = 1.6
    t = t_axis(dur)
    base = 1318.5
    x = sum(a * np.sin(2 * np.pi * base * r * t) * np.exp(-t / d)
            for r, a, d in ((1, 1.0, 0.7), (2.0, 0.4, 0.4), (2.76, 0.3, 0.25), (5.4, 0.15, 0.12)))
    return stereo(reverb(x * np.clip(t / 0.002, 0, 1), 1.0, 0.2)[: int(dur * SR)], 0.5)


def pop():
    dur = 0.12
    return sweep(480, 1150, dur) * env_exp(dur, 0.035, 0.002) + highpass(RNG.normal(0, 1, int(dur * SR)), 4000) * env_exp(dur, 0.004) * 0.3


def key_click():
    dur = 0.05
    return highpass(RNG.normal(0, 1, int(dur * SR)), 1800) * env_exp(dur, 0.006) + sweep(3800, 3000, dur) * env_exp(dur, 0.004) * 0.3


def snip():
    """Tijeretazo: dos clics metálicos."""
    def blade(f):
        d = 0.09
        return (highpass(RNG.normal(0, 1, int(d * SR)), 3000) * env_exp(d, 0.012)
                + np.sin(2 * np.pi * f * t_axis(d)) * env_exp(d, 0.03) * 0.5)
    x = np.zeros(int(0.3 * SR))
    a, b = blade(4600), blade(5200)
    x[:len(a)] += a
    x[int(0.07 * SR):int(0.07 * SR) + len(b)] += b
    return stereo(x, 0.6)


def stamp():
    d = 0.6
    thump = sweep(140, 55, d) * env_exp(d, 0.09, 0.002)
    slap = lowpass(RNG.normal(0, 1, int(d * SR)), 2500) * env_exp(d, 0.03)
    return stereo(np.tanh((thump + slap * 0.6) * 1.5), 0.4)


def glitch():
    d = 0.25
    n = int(d * SR)
    x = np.zeros(n)
    pos = 0
    while pos < n:
        seg = int(RNG.uniform(0.008, 0.035) * SR)
        kind = RNG.integers(0, 3)
        tt = np.arange(seg) / SR
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * RNG.uniform(200, 2000) * tt))
        elif kind == 1:
            s = np.repeat(RNG.uniform(-1, 1, seg // 40 + 1), 40)[:seg]
        else:
            s = np.zeros(seg)
        x[pos:pos + seg] = s[: max(0, min(seg, n - pos))]
        pos += seg
    return stereo(x * 0.6, 1.0)


def drone(dur=3.0):
    t = t_axis(dur)
    u = t / dur
    x = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.41 * t + 0.5) + 0.3 * np.sin(2 * np.pi * 110.3 * t))
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.5 * t)
    air = lowpass(RNG.normal(0, 1, len(t)), 700) * 0.25
    e = np.clip(u / 0.3, 0, 1) * np.clip((1 - u) / 0.15, 0, 1)
    return stereo((x + air) * e, 0.8)


def check():
    """Palomita: dos notas ascendentes cortas."""
    x = np.zeros(int(0.32 * SR))
    for k, f in enumerate((880, 1320)):
        d = 0.14
        n = sweep(f, f * 1.01, d) * env_exp(d, 0.05, 0.002)
        i = int(k * 0.07 * SR)
        x[i:i + len(n)] += n
    return stereo(reverb(x, 0.6, 0.15)[: int(0.5 * SR)], 0.4)


def clack():
    """Candado que se cierra: clic metálico + golpe seco."""
    d = 0.35
    click = highpass(RNG.normal(0, 1, int(d * SR)), 3500) * env_exp(d, 0.008)
    ring_ = sum(np.sin(2 * np.pi * f * t_axis(d)) for f in (2300, 3700)) * env_exp(d, 0.05) * 0.3
    thud = sweep(160, 70, d) * env_exp(d, 0.05)
    return stereo(click * 0.8 + ring_ + thud * 0.9, 0.3)


def quiebre():
    """El candado se rompe: chasquido metálico + campana rota + golpe sub."""
    d = 1.4
    snap = highpass(RNG.normal(0, 1, int(d * SR)), 2000) * env_exp(d, 0.02)
    bell = sum(a * np.sin(2 * np.pi * f * t_axis(d)) * np.exp(-t_axis(d) / dd)
               for f, a, dd in ((1870, 0.4, 0.3), (2950, 0.3, 0.2), (4410, 0.2, 0.12)))
    b = boom(1.2, 100, 38, 0.4)[:, 0]
    x = np.zeros(max(len(b), int(d * SR)))
    x[: int(d * SR)] += snap * 0.7 + bell
    x[: len(b)] += b * 0.9
    return stereo(x, 0.7)


def rebobinado(dur=1.1):
    """Cinta que rebobina: chirridos que bajan de tono con temblor."""
    t = t_axis(dur)
    u = t / dur
    f = 2400 * (300 / 2400) ** u * (1 + 0.08 * np.sin(2 * np.pi * 23 * t))
    chirp = np.sin(2 * np.pi * np.cumsum(f) / SR)
    noise = shaped_noise(dur, lambda uu: 3000 * (500 / 3000) ** uu, 0.6)
    gate = 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 14 * t))
    x = (chirp * 0.5 + noise * 0.6) * gate * np.sin(np.pi * np.clip(u, 0, 1)) ** 0.5
    return stereo(x, 1.0)


def error():
    """Pitido de error (barra de carga atascada)."""
    x = np.zeros(int(0.5 * SR))
    for k in range(2):
        d = 0.12
        n = np.sign(np.sin(2 * np.pi * 196 * t_axis(d))) * env_exp(d, 0.08, 0.004)
        n = lowpass(n, 2500)
        i = int(k * 0.17 * SR)
        x[i:i + len(n)] += n
    return x * 0.8


EFFECTS = {
    "tick": lambda: tick(True), "tock": lambda: tick(False), "riser": riser, "riser_corto": lambda: riser(1.0),
    "swell": reverse_swell, "swell_largo": lambda: reverse_swell(1.4), "boom": boom,
    "boom_suave": lambda: boom(1.2, 90, 40, 0.35), "whoosh": whoosh, "whoosh_abajo": lambda: whoosh(0.45, False),
    "whoosh_corto": lambda: whoosh(0.28, True), "zoom": zoom_hit, "latido": heartbeat, "ding": ding, "pop": pop,
    "tecla": key_click, "tijera": snip, "sello": stamp, "glitch": glitch, "dron": drone,
    "dron_largo": lambda: drone(6.0), "check": check, "candado": clack, "quiebre": quiebre, "rebobinado": rebobinado,
    "error": error,
}


def path(name: str) -> str:
    p = os.path.join(OUT, f"{name}.wav")
    if not os.path.exists(p):
        write(name, EFFECTS[name]())
    return p


if __name__ == "__main__":
    for k in EFFECTS:
        print(path(k))
