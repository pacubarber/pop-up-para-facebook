"""Música y efectos de sonido de CORTE, sintetizados desde cero.

Todo el audio del portafolio sale de aquí: no hay samples ni pistas de terceros,
así que no hay problemas de licencia al publicar los videos.

Uso:  python3 tools/audio.py            (genera todo en public/audio/)
"""
from __future__ import annotations

import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- utilidades
def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def n_of(sec: float) -> int:
    return int(round(sec * SR))


def lp(x, hz, order=2):
    return sosfilt(butter(order, min(hz, SR / 2 - 100), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR / 2 - 100)], "band", fs=SR, output="sos"), x, axis=0)


def env_adsr(n, a=0.005, d=0.1, s=0.7, r=0.1):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-6), e)
    e = np.where(t >= a + d, s, e)
    rel = np.clip((dur - t) / max(r, 1e-6), 0, 1)
    return e * rel


def saw(freq, n, harmonics=40, phase=0.0):
    t = np.arange(n) / SR
    k_max = max(1, min(harmonics, int((SR / 2) / freq)))
    y = np.zeros(n)
    for k in range(1, k_max + 1):
        y += np.sin(2 * np.pi * k * freq * t + phase * k) / k
    return y * (2 / np.pi)


def tri(freq, n):
    t = np.arange(n) / SR
    y = np.zeros(n)
    for i, k in enumerate(range(1, 30, 2)):
        if k * freq > SR / 2:
            break
        y += ((-1) ** i) * np.sin(2 * np.pi * k * freq * t) / (k * k)
    return y * (8 / np.pi**2)


def reverb(x, seconds=1.8, decay=0.55, wet=0.22, seed=1):
    """Reverb sencilla por convolución con ruido decreciente (estéreo)."""
    r = np.random.default_rng(seed)
    n = n_of(seconds)
    t = np.arange(n) / SR
    out = np.zeros((len(x) + n - 1, 2))
    for c in range(2):
        ir = r.standard_normal(n) * np.exp(-t / decay)
        ir = lp(ir, 6000)
        ir /= np.sqrt(np.sum(ir**2))
        src = x[:, c] if x.ndim == 2 else x
        out[:, c] = fftconvolve(src, ir)
    dry = np.zeros_like(out)
    dry[: len(x)] = x if x.ndim == 2 else np.stack([x, x], 1)
    return dry * (1 - wet) + out * wet


def place(buf, sig, at_sec, gain=1.0, pan=0.0):
    """Suma `sig` (mono o estéreo) en `buf` a partir de `at_sec`."""
    i = n_of(at_sec)
    if i >= len(buf):
        return
    if sig.ndim == 1:
        lg = np.cos((pan + 1) * np.pi / 4)
        rg = np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * lg, sig * rg], 1) * np.sqrt(2)
    end = min(len(buf), i + len(sig))
    buf[i:end] += sig[: end - i] * gain


def write_wav(path, x, peak_db=-1.0):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    peak = np.max(np.abs(x)) + 1e-9
    x = x / peak * 10 ** (peak_db / 20)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    print("✓", os.path.relpath(path), f"{len(x) / SR:.1f}s")


def master(x, drive=1.4):
    x = hp(x, 28)
    return np.tanh(x * drive) / np.tanh(drive)


# ---------------------------------------------------------------- batería
def kick(punch=1.0, length=0.45):
    n = n_of(length)
    t = np.arange(n) / SR
    f = 46 + 120 * punch * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 6.5)
    click = lp(rng.standard_normal(n), 3500) * np.exp(-t * 350) * 0.35
    return np.tanh((body + click) * 1.6)


def clap():
    n = n_of(0.35)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 3200)
    e = np.zeros(n)
    for off in (0.0, 0.011, 0.022):
        tt = np.clip(t - off, 0, None)
        e = np.maximum(e, np.where(t >= off, np.exp(-tt * 140), 0))
    e = np.maximum(e, np.where(t >= 0.022, np.exp(-(t - 0.022) * 18) * 0.55, 0))
    return noise * e


def hat(open_=False):
    n = n_of(0.25 if open_ else 0.06)
    t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 7500, 4)
    return x * np.exp(-t * (14 if open_ else 75))


def rim():
    n = n_of(0.12)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 90)
    noise = bp(rng.standard_normal(n), 1500, 5000) * np.exp(-t * 120)
    return (tone * 0.6 + noise * 0.5)


# ---------------------------------------------------------------- instrumentos
def pad_chord(notes, dur, cutoff=1800, detune=8):
    n = n_of(dur)
    out = np.zeros((n, 2))
    for m in notes:
        f = midi(m)
        for c, cents in enumerate((-detune, detune)):
            out[:, c] += saw(f * 2 ** (cents / 1200), n, 24, phase=c * 0.7)
    out = lp(out, cutoff, 2)
    return out * env_adsr(n, 0.25, 0.3, 0.8, 0.45)[:, None] / len(notes)


def pluck(m, dur=0.32, bright=4200):
    n = n_of(dur)
    t = np.arange(n) / SR
    x = tri(midi(m), n) * 0.7 + saw(midi(m), n, 12) * 0.3
    x = lp(x, bright, 2)
    return x * np.exp(-t * 11) * np.clip(t / 0.003, 0, 1)


def bass_note(m, dur, cutoff=420):
    n = n_of(dur)
    t = np.arange(n) / SR
    x = lp(saw(midi(m), n, 30), cutoff, 3) * 0.8 + np.sin(2 * np.pi * midi(m) * t) * 0.6
    return x * env_adsr(n, 0.004, 0.08, 0.75, 0.04)


def keys(notes, dur):
    """Piano eléctrico tipo Rhodes (seno + armónicos + trémolo)."""
    n = n_of(dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m in notes:
        f = midi(m)
        tone = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
        bell = 0.18 * np.sin(2 * np.pi * 7.1 * f * t) * np.exp(-t * 18)
        out += (tone + bell) * np.exp(-t * 0.9)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)
    out = out * trem * env_adsr(n, 0.004, 0.2, 0.85, 0.35) / len(notes)
    return np.stack([out * (1 + 0.15 * np.sin(2 * np.pi * 0.3 * t)), out * (1 - 0.15 * np.sin(2 * np.pi * 0.3 * t))], 1)


def ducking(n, kick_times, depth=0.55, release=0.14):
    g = np.ones(n)
    t = np.arange(n) / SR
    for k in kick_times:
        i = n_of(k)
        seg = t[i:] - k
        g[i:] = np.minimum(g[i:], 1 - depth * np.exp(-seg / release))
    return g


# ---------------------------------------------------------------- pistas
def track_pulse(bars=17, bpm=120, prog=None, root_oct=33, name="pulse_120.wav"):
    """Pista enérgica para reels de producto y el showreel."""
    beat = 60 / bpm
    bar = beat * 4
    total = bars * bar + 2.5
    n = n_of(total)
    drums = np.zeros((n, 2))
    music = np.zeros((n, 2))
    bass = np.zeros((n, 2))
    # Am - F - C - G  (raíces y acordes en MIDI)
    prog = prog or [(57, [57, 60, 64, 69]), (53, [53, 57, 60, 65]), (48, [55, 60, 64, 67]), (55, [55, 59, 62, 67])]
    kicks = []
    full = lambda b: (2 <= b < 10) or (12 <= b < bars - 1)
    for b in range(bars):
        t0 = b * bar
        root, chord = prog[b % len(prog)]
        last = b == bars - 1
        # pad
        cutoff = 900 if b < 2 else (1300 if b in (10, 11) else 2200)
        place(music, pad_chord(chord, bar + 0.4, cutoff), t0, 0.55 if not last else 0.8)
        if last:
            place(drums, kick(1.2, 0.9), t0, 1.0)
            place(music, pluck(chord[-1] + 12, 1.2), t0, 0.5)
            kicks.append(t0)
            continue
        # arpegio de 16avos
        arp = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[3] + 12]
        for s in range(16):
            if b < 2 and s % 2:
                continue
            m = arp[(s * 3) % 4] + (12 if s in (6, 14) else 0)
            place(music, pluck(m, 0.3, 3200 if b < 2 else 5200), t0 + s * beat / 4, 0.22, pan=-0.3 if s % 2 else 0.3)
        if full(b):
            for q in range(4):
                place(drums, kick(), t0 + q * beat, 0.95)
                kicks.append(t0 + q * beat)
                place(drums, hat(), t0 + q * beat + beat / 2, 0.22, pan=0.25)
                if q in (1, 3):
                    place(drums, clap(), t0 + q * beat, 0.5)
            place(drums, hat(True), t0 + 3.5 * beat, 0.12, pan=-0.2)
            for e in range(8):
                note = root - 12 + (12 if e % 2 else 0)
                place(bass, bass_note(note, beat / 2 * 0.92), t0 + e * beat / 2, 0.55)
        else:
            for q in range(4):
                place(drums, hat(), t0 + q * beat + beat / 2, 0.12, pan=0.25)
        if b == 11:  # redoble antes del segundo drop
            for s in range(8):
                place(drums, clap(), t0 + 2 * beat + s * beat / 4, 0.12 + s * 0.04)
    duck = ducking(n, kicks)[:, None]
    mix = drums + (reverb(music, 2.2, 0.6, 0.28)[:n] + bass) * duck
    write_wav(os.path.join(OUT, name), master(mix * 0.9))


def track_chill(bars=15, bpm=88, name="chill_88.wav", vinyl=True):
    """Lo-fi cálido: fondo para podcast e inmobiliaria."""
    beat = 60 / bpm
    bar = beat * 4
    total = bars * bar + 3
    n = n_of(total)
    drums = np.zeros((n, 2))
    music = np.zeros((n, 2))
    bass = np.zeros((n, 2))
    prog = [
        (38, [53, 57, 60, 64]),  # Dm9
        (43, [53, 59, 64]),  # G13
        (36, [52, 59, 62, 67]),  # Cmaj9
        (45, [55, 60, 64, 67]),  # Am7
    ]
    swing = beat / 2 * 0.12
    for b in range(bars):
        t0 = b * bar
        root, chord = prog[b % len(prog)]
        place(music, keys(chord, bar * 0.98), t0, 0.55)
        place(music, keys([chord[-1] + 12], beat * 1.5), t0 + beat * 2.5 + swing, 0.18)
        place(bass, bass_note(root, beat * 1.8, 260), t0, 0.5)
        place(bass, bass_note(root + 7, beat * 0.9, 260), t0 + beat * 2.5 + swing, 0.38)
        if b == 0 or b == bars - 1:
            continue
        for q in range(4):
            if q in (0, 2):
                place(drums, kick(0.6, 0.35), t0 + q * beat, 0.6)
            if q in (1, 3):
                place(drums, lp(clap(), 2500), t0 + q * beat, 0.35)
            place(drums, hat(), t0 + q * beat, 0.08, pan=0.3)
            place(drums, hat(), t0 + q * beat + beat / 2 + swing, 0.06, pan=0.3)
        place(drums, kick(0.6, 0.3), t0 + 2.5 * beat + swing, 0.35)
    mix = drums + reverb(music, 2.5, 0.8, 0.3)[:n] + bass
    if vinyl:
        hiss = lp(hp(rng.standard_normal(n), 3000), 9000) * 0.012
        crackle = np.zeros(n)
        idx = rng.integers(0, n, int(total * 9))
        crackle[idx] = rng.uniform(-0.25, 0.25, len(idx))
        crackle = bp(crackle, 1500, 8000)
        mix += np.stack([hiss + crackle, hiss + np.roll(crackle, 37)], 1)
    mix = lp(mix, 7500)
    write_wav(os.path.join(OUT, name), master(mix, 1.2))


def track_tech(bars=12, bpm=112, name="tech_112.wav"):
    """Minimal y limpio para videos de producto digital / SaaS."""
    beat = 60 / bpm
    bar = beat * 4
    total = bars * bar + 2.5
    n = n_of(total)
    drums = np.zeros((n, 2))
    music = np.zeros((n, 2))
    bass = np.zeros((n, 2))
    prog = [(52, [64, 67, 71, 74]), (48, [64, 67, 72, 76]), (55, [62, 67, 71, 74]), (50, [62, 66, 69, 74])]  # Em C G D
    kicks = []
    for b in range(bars):
        t0 = b * bar
        root, chord = prog[b % len(prog)]
        last = b == bars - 1
        place(music, pad_chord([c - 12 for c in chord], bar + 0.4, 1400, 12), t0, 0.4)
        if last:
            place(drums, kick(1.0, 0.8), t0, 0.9)
            kicks.append(t0)
            place(music, pluck(chord[0] + 12, 1.4, 6000), t0, 0.35)
            continue
        pattern = [0, 2, 1, 3, 2, 1, 3, 2]
        for s in range(8):
            m = chord[pattern[s]]
            place(music, pluck(m, 0.22, 6500), t0 + s * beat / 2, 0.2, pan=-0.4 if s % 2 else 0.4)
            # eco de corchea con puntillo
            place(music, pluck(m, 0.22, 3000), t0 + s * beat / 2 + beat * 0.75, 0.07, pan=0.4 if s % 2 else -0.4)
        if b >= 1:
            for q in range(4):
                place(drums, kick(0.8), t0 + q * beat, 0.85)
                kicks.append(t0 + q * beat)
                place(drums, hat(), t0 + q * beat + beat / 2, 0.16, pan=0.2)
                if b >= 2 and q in (1, 3):
                    place(drums, rim(), t0 + q * beat, 0.25, pan=-0.15)
            for e in range(4):
                place(bass, bass_note(root - 24 + 12, beat * 0.45, 300), t0 + e * beat + beat / 2, 0.55)
    duck = ducking(n, kicks, 0.5)[:, None]
    mix = drums + (reverb(music, 1.6, 0.45, 0.25)[:n] + bass) * duck
    write_wav(os.path.join(OUT, name), master(mix))


# ---------------------------------------------------------------- efectos
def sweep_noise(n, f_from, f_to, q=1.4, seed=3):
    """Ruido filtrado por un pasabanda que barre de f_from a f_to (por bloques)."""
    r = np.random.default_rng(seed)
    x = r.standard_normal(n)
    out = np.zeros(n)
    block = 512
    zi = None
    for i in range(0, n, block):
        p = i / max(1, n - 1)
        fc = f_from * (f_to / f_from) ** p
        lo, hi = fc / q, min(fc * q, SR / 2 - 200)
        sos = butter(2, [lo, hi], "band", fs=SR, output="sos")
        if zi is None or zi.shape[0] != sos.shape[0]:
            zi = np.zeros((sos.shape[0], 2))
        out[i : i + block], zi = sosfilt(sos, x[i : i + block], zi=zi)
    return out


def sfx_whoosh(dur=0.6, name="whoosh.wav"):
    n = n_of(dur)
    t = np.arange(n) / SR
    x = sweep_noise(n, 300, 5000) + sweep_noise(n, 150, 2200, seed=9) * 0.6
    peak = 0.62 * dur
    e = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) * 14))
    pan = np.linspace(-0.8, 0.8, n)
    sig = np.stack([x * e * np.cos((pan + 1) * np.pi / 4), x * e * np.sin((pan + 1) * np.pi / 4)], 1)
    write_wav(os.path.join(OUT, name), reverb(sig, 0.8, 0.25, 0.2), -3)


def sfx_impact(name="impact.wav"):
    n = n_of(1.6)
    t = np.arange(n) / SR
    f = 38 + 90 * np.exp(-t * 18)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    crack = lp(rng.standard_normal(n), 5000) * np.exp(-t * 45) * 0.6
    sig = np.tanh((boom + crack) * 2.0)
    write_wav(os.path.join(OUT, name), reverb(sig, 2.2, 0.7, 0.3), -1.5)


def sfx_pop(name="pop.wav"):
    n = n_of(0.12)
    t = np.arange(n) / SR
    f = 520 + 700 * (1 - np.exp(-t * 60))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)
    write_wav(os.path.join(OUT, name), x, -4)


def sfx_click(name="click.wav"):
    n = n_of(0.05)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 2000, 9000) * np.exp(-t * 400) + np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 300) * 0.4
    write_wav(os.path.join(OUT, name), x, -6)


def sfx_typing(dur=1.6, name="typing.wav"):
    out = np.zeros((n_of(dur), 2))
    t = 0.0
    while t < dur - 0.06:
        n = n_of(0.03)
        tt = np.arange(n) / SR
        k = bp(rng.standard_normal(n), 1800 + rng.uniform(-300, 600), 7000) * np.exp(-tt * rng.uniform(250, 420))
        place(out, k, t, rng.uniform(0.5, 1.0), pan=rng.uniform(-0.2, 0.2))
        t += rng.uniform(0.055, 0.11)
    write_wav(os.path.join(OUT, name), out, -8)


def sfx_ding(name="ding.wav"):
    n = n_of(1.2)
    t = np.arange(n) / SR
    a = (np.sin(2 * np.pi * 1318.5 * t) + 0.3 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t * 5)
    b = np.zeros(n)
    i = n_of(0.09)
    tb = t[: n - i]
    b[i:] = (np.sin(2 * np.pi * 1975.5 * tb) + 0.25 * np.sin(2 * np.pi * 3951 * tb)) * np.exp(-tb * 4.5)
    write_wav(os.path.join(OUT, name), reverb((a + b) * 0.5, 1.0, 0.3, 0.2), -5)


def sfx_riser(dur=2.0, name="riser.wav"):
    n = n_of(dur)
    t = np.arange(n) / SR
    x = sweep_noise(n, 400, 9000, 1.8) * (t / dur) ** 2.5
    f = 180 * (8 ** (t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 3 * 0.35
    write_wav(os.path.join(OUT, name), reverb(x + tone, 1.2, 0.4, 0.25), -3)


def sfx_glitch(name="glitch.wav"):
    n = n_of(0.22)
    x = np.zeros(n)
    for _ in range(6):
        i = rng.integers(0, n - 800)
        L = rng.integers(200, 800)
        f = rng.uniform(200, 2500)
        tt = np.arange(L) / SR
        x[i : i + L] += np.sign(np.sin(2 * np.pi * f * tt)) * 0.5
    x = np.round(x * 6) / 6
    write_wav(os.path.join(OUT, name), lp(x, 7000), -8)


def sfx_cash(name="cash.wav"):
    n = n_of(1.0)
    t = np.arange(n) / SR
    clack = bp(rng.standard_normal(n), 1500, 6000) * np.exp(-t * 90) * 0.7
    bell = np.zeros(n)
    for k, f in enumerate((2093, 2637, 3136)):
        i = n_of(0.05 + 0.035 * k)
        tb = t[: n - i]
        bell[i:] += np.sin(2 * np.pi * f * tb) * np.exp(-tb * 6) * 0.5
    write_wav(os.path.join(OUT, name), reverb(clack + bell, 0.9, 0.3, 0.18), -5)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    track_pulse()
    track_chill()
    track_tech()
    sfx_whoosh()
    sfx_whoosh(0.35, "whoosh_short.wav")
    sfx_impact()
    sfx_pop()
    sfx_click()
    sfx_typing()
    sfx_ding()
    sfx_riser()
    sfx_glitch()
    sfx_cash()
