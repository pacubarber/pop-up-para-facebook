"""AURA — anuncio de sérum de vitamina C (marca ficticia). 9:16 · ~22 s.

Estética cálida y limpia: tipografía serif con revelados suaves, AURA gigante detrás de la modelo en el drop,
contador 15 % con anillo, destello de luz que cruza el texto, barrido antes/después, temporizador circular,
tachado animado y cierre en el que el video se encoge a una tarjeta redondeada sobre fondo crema.
"""
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motor"))
import efectos as fx  # noqa: E402
from motor import (H, W, Video, clamp, ease_in, ease_io, ease_out, fit_size, hexc, lerp, load_vo, prog,  # noqa: E402,F401
                   text_width, word_time)

VO = load_vo("aura")
CREAM, ORANGE, GOLD, BROWN, WHITE = "#F6EFE6", "#FF7A2F", "#E9B86C", "#3A2418", "#FFFFFF"
GRADE = ("eq=contrast=0.98:saturation=1.06:gamma=1.02,"
         "colorbalance=rs=0.04:gs=0.01:bs=-0.04:rm=0.03:bm=-0.03:rh=0.02:bh=-0.03")
DROP = 6.03                     # "Aura." = drop de la pista 485 (segundo 10.10)
SERIF, SERIF_I, SANS = "serif", "serif-i", "inter"


def w(text, n=1, after=0.0):
    return word_time(VO, text, n, after)


def build():
    v = Video("aura", 22.0, grade=GRADE)
    v.voice("aura", 0.0)
    v.music(485, start=10.10 - DROP, gain=-12, fade_out=1.6)
    v.grain, v.vignette, v.bloom = 0.03, 0.16, 0.22
    v.poster = 6.4

    def mk(i, desde, dur, **kw):
        return v.clip(f"mixkit:{i}", desde, dur, **kw)

    shots = [
        (0.00, 1.61, mk(51185, 3.0, 2.5), dict(zoom=(1.0, 1.12))),
        (1.61, 2.59, mk(32765, 2.0, 2.0), dict(zoom=(1.12, 1.0), trans="lightdip", tdur=0.22, tparams={"color": "#ffe2b8"})),
        (2.59, 3.43, mk(27794, 4.0, 1.5, x=0.45), dict(zoom=(1.05, 1.15), trans="slices", tdur=0.24, tparams={"n": 6})),
        (3.43, 4.83, mk(4911, 2.0, 2.0, x=0.55), dict(zoom=(1.15, 1.02), trans="whip-u", tdur=0.18)),
        (4.83, 6.57, mk(34427, 1.0, 2.5, matte=True), dict(zoom=(1.0, 1.06), trans="blurfade", tdur=0.24)),
        (6.57, 8.10, mk(10429, 1.0, 2.0), dict(zoom=(1.0, 1.12), trans="zoom", tdur=0.2)),
        (8.10, 9.95, mk(42947, 2.0, 2.5), dict(zoom=(1.08, 1.0), dim=0.2, trans="whip-u", tdur=0.16)),
        (9.95, 10.93, mk(52039, 2.0, 1.5, x=0.6), dict(zoom=(1.0, 1.08), trans="lightdip", tdur=0.24, tparams={"color": "#fff1dc"})),
        (10.93, 12.42, mk(52054, 0.5, 2.0, x=0.55), dict(zoom=(1.1, 1.0), trans="lightdip", tdur=0.2, tparams={"color": "#fff1dc"})),
        (12.42, 14.33, mk(33201, 4.0, 2.5), dict(zoom=(1.02, 1.1), trans="slices", tdur=0.24, tparams={"n": 5, "vertical": False})),
        (14.33, 15.20, mk(45160, 1.0, 1.5, x=0.42), dict(zoom=(1.15, 1.02), trans="whip-l", tdur=0.16)),
        (15.20, 16.48, mk(51173, 3.0, 3.0, x=0.45), dict(zoom=(1.0, 1.1), speed=1.6, trans="zoom", tdur=0.18)),
        (16.48, 17.62, mk(52151, 3.0, 1.8), dict(zoom=(1.08, 1.0), trans="blurfade", tdur=0.22)),
        (17.62, 18.70, mk(9158, 4.0, 1.8, x=0.55), dict(zoom=(1.0, 1.08), trans="whip-l", tdur=0.16)),
        (18.70, 22.00, mk(51183, 2.0, 4.0), dict(zoom=(1.0, 1.06), trans="iris", tdur=0.3)),
    ]
    for t0, t1, clip, kw in shots:
        v.shot(t0, t1, clip, **kw)

    # luz: fuga cálida suave en todo el video, más fuerte en "el sol" y en "más luz"
    def leaks(ctx):
        t = ctx.t
        s = 0.10 + 0.35 * (prog(t, 1.5, 1.9) * (1 - prog(t, 2.5, 2.8))) + 0.3 * (prog(t, 9.9, 10.3) * (1 - prog(t, 12.2, 12.5)))
        if t < 18.7:
            fx.light_leak(ctx, t, "#ffb070", s, 0.7, 1.3)

    v.pre_layers.append(leaks)

    L = [l["words"] for l in VO["lines"]]

    # ------------------------------------------------------------------ 1. "Tu piel lo nota todo."
    def uno(ctx, lt, t):
        ctx.band(1200, 1900, "#1a0f08", 0.55)
        ws = L[0]
        fx.rise_words(ctx, ws[:4], SERIF, 120, W / 2, 1460, t, color=WHITE, upper=False, space=1.3, shadow=10)
        q = t - ws[4]["start"]
        fx.blur_in(ctx, "todo.", SERIF_I, 210, W / 2, 1640, q, dur=0.4, color=GOLD, shadow=12)

    v.layer(0.0, 1.61, uno)

    # ------------------------------------------------------------------ 2. "El sol. El estrés. Las noches cortas."
    frases = [("El sol.", 1.61, 2.59, L[1][0]["start"]), ("El estrés.", 2.59, 3.43, L[1][2]["start"]),
              ("Las noches cortas.", 3.43, 4.83, L[1][4]["start"])]

    def dos(ctx, lt, t):
        for txt, a, b, ts in frases:
            if a <= t < b:
                ctx.band(560, 1360, "#1a0f08", 0.4)
                size = fit_size(txt, SERIF_I, W * 0.86, 220)
                fx.rise(ctx, txt, SERIF_I, size, W / 2, 960, t - ts + 0.05, color=WHITE, dur=0.4, shadow=12)

    v.layer(1.61, 4.83, dos)
    v.sfx(2.59, 175, gain=-16, align="peak")
    v.sfx(3.43, 1489, gain=-17, align="peak")
    for _, a, _, _ in frases[1:]:
        v.hit(a, punch=0.05, decay=0.2)

    # ------------------------------------------------------------------ 3. "Por eso creamos Aura." AURA detrás de la modelo
    def tres_front(ctx, lt, t):
        fx.rise_words(ctx, L[2][:3], SANS, 46, W / 2, 330, t, color=BROWN, wght=600, tracking=10, space=1.4)

    def tres_back(ctx, lt, t):
        q = t - DROP + 0.03
        if q < 0:
            return
        size = fit_size("AURA", SERIF, W * 0.98, 560)
        p = ease_out(prog(q, 0, 0.5), 3)
        ctx.text("AURA", SERIF, size, W / 2, 760, color=ORANGE, scale=lerp(1.25, 1.0, p) * (1 + 0.03 * prog(t, DROP, 6.6)),
                 opacity=prog(q, 0, 0.1), blur=(1 - p) * 18, tracking=round(lerp(60, 6, p)))

    v.layer(4.83, 6.57, tres_back, behind=True)
    v.layer(4.83, 6.57, tres_front)
    v.hit(DROP, punch=0.06, flash=0.35, decay=0.35, flash_color="#fff3e2")
    v.sfx(DROP, 2633, gain=-10, align="peak")

    # ------------------------------------------------------------------ 4. "Sérum de vitamina C al quince por ciento."
    serum, vit, quince = w("serum"), w("vitamina"), w("quince")

    def cuatro(ctx, lt, t):
        if t < 8.10:
            ctx.band(500, 1500, "#2a1205", 0.35)
            fx.blur_in(ctx, "Sérum", SERIF_I, 200, W / 2, 860, t - serum["start"], color=WHITE, shadow=12)
            fx.rise(ctx, "DE VITAMINA C", SANS, 64, W / 2, 1040, t - vit["start"] + 0.05, color=WHITE, wght=700, tracking=14,
                    shadow=8)
            return
        q = t - quince["start"] + 0.05
        cx, cy = W / 2, 900
        ctx.circle(cx, cy, 330, "#2a1205", opacity=0.30, feather=60)
        if q >= -0.3:
            p = ease_io(prog(q, -0.3, 0.7))
            ctx.ring(cx, cy, 330, 5, CREAM, -90, -90 + 360 * p, opacity=0.9)
        if q >= 0:
            val = int(round(15 * ease_out(prog(q, 0, 0.6), 2)))
            s, op = fx.pop(q, 0.6, 2.4, 7)
            ctx.text(f"{val}%", SERIF, 300, cx, cy - 10, color=WHITE, scale=s, opacity=op, shadow=14)
        ctx.text("VITAMINA C", SANS, 46, cx, cy + 170, color=CREAM, wght=700, tracking=12, opacity=prog(t, 8.15, 8.4))

    v.layer(6.57, 9.95, cuatro)
    v.sfx(quince["start"], 3062, gain=-14)

    # ------------------------------------------------------------------ 5. "Más luz desde la primera semana." (destello que cruza el texto)
    mas, desde = w("mas"), w("desde")

    def cinco(ctx, lt, t):
        ctx.band(600, 1500, "#1a0f08", 0.35)
        size = 230
        y = 900
        q = t - mas["start"]
        fx.blur_in(ctx, "Más luz", SERIF_I, size, W / 2, y, q, dur=0.45, color=WHITE, shadow=14)
        # destello: banda diagonal brillante que recorre el texto
        sp = prog(t, 10.55, 11.25)
        if 0 < sp < 1:
            m = ctx.text_mask("Más luz", SERIF_I, size, W / 2, y)
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            pos = lerp(-300, W + 300, ease_io(sp))
            d = np.abs((xx + (yy - y) * 0.45) - pos)
            band = np.clip(1 - d / 90, 0, 1) ** 2
            ctx.put(m * band, "#ffffff", 0, 0, 0.95, "add")
        fx.rise_words(ctx, L[4][2:], SANS, 54, W / 2, 1100, t, color=CREAM, wght=700, tracking=10, space=1.4, shadow=8)

    v.layer(9.95, 12.42, cinco)
    v.sfx(10.6, 2586, gain=-15, align="peak")

    # ------------------------------------------------------------------ 6. "Un tono más uniforme." barrido antes / después
    tono = w("tono")

    def seis_pre(ctx):
        t = ctx.t
        if not (12.42 <= t < 14.33):
            return
        x = lerp(-20, W + 20, ease_io(prog(t, 12.55, 14.1)))
        img = ctx.img
        luma = img @ np.array([0.114, 0.587, 0.299], np.float32)
        before = (luma[..., None] * 0.55 + img * 0.45) * 0.9 + np.array([0.02, 0.0, -0.01], np.float32)
        after = np.clip(img * 1.05 + np.array([-0.01, 0.01, 0.03], np.float32), 0, 1)
        xx = np.arange(W, dtype=np.float32)
        m = np.clip((x - xx) / 3 + 0.5, 0, 1)[None, :, None]     # izquierda de la línea = después
        ctx.img = after * m + before * (1 - m)
        if 0 < x < W:
            ctx.rect(x - 3, 0, x + 3, H, WHITE, opacity=0.95)
            ctx.circle(x, 1500, 34, WHITE, opacity=0.95)
            ctx.poly([(x - 18, 1500), (x - 8, 1490), (x - 8, 1510)], BROWN)
            ctx.poly([(x + 18, 1500), (x + 8, 1490), (x + 8, 1510)], BROWN)

    def seis(ctx, lt, t):
        ctx.band(250, 900, "#1a0f08", 0.3)
        fx.rise(ctx, "Un tono", SERIF, 150, W / 2, 470, t - L[5][0]["start"] + 0.05, color=WHITE, shadow=12)
        fx.blur_in(ctx, "más uniforme", SERIF_I, 150, W / 2, 640, t - L[5][2]["start"], color=GOLD, shadow=12)

    v.pre_layers.append(seis_pre)
    v.layer(12.42, 14.33, seis)
    v.sfx(12.6, 166, gain=-16, align="peak")

    # ------------------------------------------------------------------ 7. "Y se absorbe en segundos." temporizador circular
    absorbe, en = w("absorbe"), w("en", after=15.0)

    def siete(ctx, lt, t):
        ctx.band(500, 1500, "#1a0f08", 0.35)
        fx.rise_words(ctx, L[6][:3], SERIF, 130, W / 2, 760, t, color=WHITE, upper=False, space=1.3, shadow=12)
        q = t - en["start"]
        if q >= -0.1:
            p = ease_io(prog(q, 0.0, 0.9))
            cx, cy = W / 2, 1080
            ctx.ring(cx, cy, 120, 8, WHITE, opacity=0.25 * prog(q, -0.1, 0.1))
            ctx.ring(cx, cy, 120, 8, GOLD, -90, -90 + 360 * p, opacity=prog(q, -0.1, 0.1))
            if p < 1:
                ctx.text(f"{p * 3:.1f}s", SANS, 54, cx, cy, color=WHITE, wght=800, opacity=prog(q, 0, 0.15))
            else:   # palomita que se dibuja
                c1 = ease_out(prog(q, 0.9, 1.05))
                c2 = ease_out(prog(q, 1.05, 1.25))
                ctx.line(cx - 40, cy, cx - 40 + 28 * c1, cy + 28 * c1, 11, WHITE)
                if c2 > 0:
                    ctx.line(cx - 12, cy + 28, cx - 12 + 58 * c2, cy + 28 - 62 * c2, 11, WHITE)
            fx.blur_in(ctx, "en segundos", SERIF_I, 120, W / 2, 1300, q, color=GOLD, shadow=12)

    v.layer(14.33, 16.48, siete)
    v.sfx(en["start"] + 0.9, 2568, gain=-12)

    # ------------------------------------------------------------------ 8. "Sin perfume. Sin parabenos." tachado animado
    perf, para = w("perfume"), w("parabenos")

    def ocho(ctx, lt, t):
        ctx.band(550, 1450, "#1a0f08", 0.4)
        for k, (word, wd, y) in enumerate([("perfume", perf, 860), ("parabenos", para, 1060)]):
            sin_t = L[7][k * 2]["start"]
            line_txt = f"Sin {word}"
            size = 140
            fx.rise(ctx, line_txt, SERIF, size, W / 2, y, t - sin_t + 0.05, color=WHITE, shadow=12)
            q = t - wd["end"] + 0.1
            if q > 0:
                tw = text_width(line_txt, SERIF, size)
                ww = text_width(word, SERIF, size)
                x1 = W / 2 + tw / 2 + 10
                x0 = x1 - ww - 20
                p = ease_out(prog(q, 0, 0.3), 3)
                ctx.line(x0, y + 4, lerp(x0, x1, p), y - 6, 9, GOLD)

    v.layer(16.48, 18.70, ocho)
    v.sfx(perf["end"] - 0.1, 175, gain=-16, align="peak")
    v.sfx(para["end"] - 0.1, 175, gain=-16, align="peak")

    # ------------------------------------------------------------------ 9. Cierre: el video se encoge a una tarjeta sobre crema
    aura2 = w("aura", 2)

    def cierre(ctx, lt, t):
        p = ease_io(prog(t, aura2["start"], aura2["start"] + 0.65))
        s = lerp(1.0, 0.56, p)
        cy = lerp(H / 2, 1010, p)
        rad = lerp(0, 56, p)
        vid = ctx.img
        bg = np.empty_like(vid)
        bg[:] = hexc(CREAM)
        ctx.img = bg
        # mancha cálida de fondo
        ctx.circle(W * 0.82, 260, 380, "#FFD7B0", opacity=0.55 * p, feather=220)
        ctx.circle(W * 0.1, 1700, 320, "#FFE6CC", opacity=0.5 * p, feather=200)
        sw, sh = int(W * s), int(H * s)
        small = cv2.resize(vid, (sw, sh), interpolation=cv2.INTER_AREA)
        x0, y0 = int(W / 2 - sw / 2), int(cy - sh / 2)
        yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32) + 0.5
        dx = np.maximum(np.abs(xx - sw / 2) - (sw / 2 - rad), 0)
        dy = np.maximum(np.abs(yy - sh / 2) - (sh / 2 - rad), 0)
        a = np.clip(rad - np.sqrt(dx * dx + dy * dy) + 0.5, 0, 1) if rad > 0.5 else np.ones((sh, sw), np.float32)
        # sombra suave de la tarjeta
        if p > 0:
            ctx.rect(x0 + 10, y0 + 30, x0 + sw - 10, y0 + sh + 30, "#5a3a24", opacity=0.22 * p, radius=rad, feather=40)
        reg = ctx.img[max(0, y0):y0 + sh, max(0, x0):x0 + sw]
        sy, sx = max(0, -y0), max(0, -x0)
        am = a[sy:sy + reg.shape[0], sx:sx + reg.shape[1], None]
        reg[:] = reg * (1 - am) + small[sy:sy + reg.shape[0], sx:sx + reg.shape[1]] * am
        # logo y textos
        q = t - aura2["start"] - 0.25
        fx.blur_in(ctx, "Aura", SERIF, 210, W / 2, 245, q, dur=0.6, color=BROWN, tracking_from=70, tracking=4)
        fx.rise(ctx, "Tu piel, en su mejor versión.", SERIF_I, 70, W / 2, 1640, t - L[8][1]["start"] + 0.05, color=BROWN)
        fx.rise(ctx, "SÉRUM · VITAMINA C 15%", SANS, 36, W / 2, 1745, t - 20.4, color=ORANGE, wght=700, tracking=10)

    v.layer(18.70, 22.0, cierre)
    v.sfx(aura2["start"], 1489, gain=-15, align="peak")
    v.sfx(aura2["start"] + 0.4, 3062, gain=-14)
    return v
