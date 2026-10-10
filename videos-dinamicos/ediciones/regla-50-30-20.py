"""LA REGLA 50/30/20 — video educativo de finanzas personales. 9:16 · ~35 s.

Gancho con golpes de cámara, montaje rápido de pagos, números que caen, dona que se llena por categoría,
listas que se arman al ritmo de la voz, barra de $1.000 que se reparte y se reordena ("el 20 primero"),
subtítulos karaoke con palabras clave en el color de cada categoría.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motor"))
import efectos as fx  # noqa: E402
from motor import (H, W, Video, caption_pages, clamp, ease_in, ease_io, ease_out, fit_size, lerp,  # noqa: E402,F401
                   load_vo, prog, spring, text_width, word_time, words_between)

VO = load_vo("regla-50-30-20")
NEED, WANT, FUT = "#3DDC84", "#FFB020", "#4DA3FF"
WHITE, YEL, INK = "#FFFFFF", "#FFE14D", "#0B0E14"
GRADE = "eq=contrast=1.06:saturation=1.12:brightness=0.0,colorbalance=rm=0.02:bm=-0.02"
F = "inter"
CX, CY, R, RW = W / 2, 820, 290, 74       # dona


def w(text, n=1, after=0.0):
    return word_time(VO, text, n, after)


def line(i):
    return VO["lines"][i]


def donut(ctx, t, upto, label, color, value, t0, t1, cy=CY, show_center=True):
    """Dona 50/30/20. upto: cuántos segmentos (1–3); el último se dibuja animado desde t0."""
    segs = [(0.0, 0.5, NEED), (0.5, 0.8, WANT), (0.8, 1.0, FUT)]
    appear = spring(t - t0 + 0.05, 2.6, 7)
    leave = ease_in(prog(t, t1 - 0.2, t1), 2)
    sc = (0.75 + 0.25 * appear) * (1 - 0.3 * leave)
    op = clamp(appear * 3) * (1 - leave)
    if op <= 0:
        return
    r, rw = R * sc, RW * sc
    ctx.ring(CX, cy, r, rw, "#ffffff", opacity=0.10 * op)
    for k, (a, b, col) in enumerate(segs[:upto]):
        p = 1.0 if k < upto - 1 else ease_io(prog(t, t0 + 0.15, t0 + 0.85))
        a0 = -90 + 360 * a + 1.5
        a1 = a0 + (360 * (b - a) - 3) * p
        ctx.ring(CX, cy, r, rw, col, a0, a1, opacity=op)
    if show_center:
        q = prog(t, t0 + 0.15, t0 + 0.85)
        val = int(round(value * ease_out(q, 2)))
        ctx.text(f"{val}%", F, int(170 * sc), CX, cy - 22 * sc, color=WHITE, wght=900, opacity=op)
        ctx.text(label, F, int(36 * sc), CX, cy + 104 * sc, color=color, wght=800, tracking=round(3 * sc), opacity=op * prog(t, t0 + 0.4, t0 + 0.7))


def bullet_list(ctx, t, items, color, title, title_t):
    """Lista que se arma: viñeta de color + palabra grande; las anteriores bajan de intensidad."""
    ctx.gradient_v(980, H, "#000000", 0.0, 0.78)
    fx.rise(ctx, title, F, 46, 110, 1170, t - title_t, color=color, wght=800, anchor="l", tracking=6, shadow=6)
    for k, (txt, wd) in enumerate(items):
        q = t - wd["start"] + 0.05
        if q < 0:
            continue
        y = 1290 + k * 128
        nxt = items[k + 1][1]["start"] if k + 1 < len(items) else 1e9
        dimv = 0.55 if t > nxt else 1.0
        s, op = fx.pop(q, 0.2, 3.0, 8)
        ctx.circle(132, y, 17 * s, color, opacity=op)
        fx.rise(ctx, txt, F, 96, 180, y, q, color=WHITE, wght=900, anchor="l", opacity=dimv, shadow=8)


def build():
    v = Video("regla-50-30-20", 35.0, grade=GRADE)
    v.voice("regla-50-30-20", 0.0)
    v.music(768, start=0.0, gain=-15, fade_out=1.5)
    v.grain, v.vignette, v.bloom = 0.025, 0.22, 0.06
    v.poster = 10.6

    def mk(i, desde, dur, **kw):
        return v.clip(f"mixkit:{i}", desde, dur, **kw)

    def cv(slug, desde, dur, **kw):
        return v.clip(f"coverr:{slug}", desde, dur, **kw)

    L = [line(i)["words"] for i in range(9)]
    # ------------------------------------------------------------------ planos
    shots = [
        (0.00, 1.24, mk(34180, 1.0, 2.0, x=0.4), dict(zoom=(1.18, 1.05))),
        (1.24, 2.22, mk(18299, 2.0, 2.0, x=0.45), dict(zoom=(1.0, 1.12), trans="whip-l", tdur=0.14)),
        (2.22, 3.10, mk(22026, 3.0, 2.0, x=0.62), dict(zoom=(1.08, 1.2))),
        (3.10, 5.56, mk(45703, 2.0, 3.5), dict(zoom=(1.0, 1.18), trans="zoom", tdur=0.2)),
        (5.56, 5.86, mk(21780, 2.0, 1.0), dict(zoom=(1.1, 1.0), trans="whip-l", tdur=0.12)),
        (5.86, 6.10, mk(6367, 3.0, 1.0, x=0.45), dict(zoom=(1.1, 1.0), trans="whip-l", tdur=0.12)),
        (6.10, 6.30, cv("coverr-a-customer-pays-with-apple-pay-at-the-café-6240", 2.0, 1.0, x=0.4), dict(zoom=(1.1, 1.0), trans="whip-l", tdur=0.1)),
        (6.30, 6.75, mk(5443, 3.0, 1.2), dict(zoom=(1.1, 1.0), trans="whip-l", tdur=0.1)),
        (6.75, 9.57, mk(46994, 3.0, 3.5), dict(zoom=(1.0, 1.1), dim=0.55, blur=16, trans="zoom", tdur=0.2)),
        (9.57, 12.70, mk(47517, 2.0, 4.0), dict(zoom=(1.0, 1.12), dim=0.62, blur=10, trans="blurfade", tdur=0.2)),
        (12.70, 13.36, mk(42127, 2.0, 1.5, x=0.6), dict(zoom=(1.05, 1.15), trans="whip-u", tdur=0.16)),
        (13.36, 13.86, mk(49137, 5.0, 1.2), dict(zoom=(1.12, 1.02))),
        (13.86, 14.56, mk(4390, 1.0, 1.5), dict(zoom=(1.0, 1.1))),
        (14.56, 16.55, mk(47007, 2.0, 2.5), dict(zoom=(1.0, 1.1), dim=0.62, blur=10, trans="blurfade", tdur=0.2)),
        (16.55, 17.45, mk(48636, 1.5, 1.5), dict(zoom=(1.05, 1.15), trans="whip-u", tdur=0.16)),
        (17.45, 18.10, mk(44378, 1.0, 1.5), dict(zoom=(1.15, 1.02))),
        (18.10, 18.85, mk(6302, 3.0, 1.5, x=0.45), dict(zoom=(1.0, 1.1))),
        (18.85, 21.62, mk(46983, 5.0, 3.5), dict(zoom=(1.0, 1.1), dim=0.62, blur=10, trans="blurfade", tdur=0.2)),
        (21.62, 22.33, mk(14006, 3.0, 1.5, x=0.6), dict(zoom=(1.05, 1.15), trans="whip-u", tdur=0.16)),
        (22.33, 22.93, cv("coverr-organizing-monthly-bills", 3.0, 1.5), dict(zoom=(1.1, 1.0))),
        (22.93, 26.95, mk(18305, 2.0, 4.5), dict(zoom=(1.0, 1.08), dim=0.35, trans="zoom", tdur=0.2)),
        (26.95, 27.95, mk(35902, 2.0, 1.5, x=0.45), dict(zoom=(1.12, 1.0), dim=0.45, trans="glitch", tdur=0.1)),
        (27.95, 29.30, mk(18264, 1.0, 2.0, x=0.55), dict(zoom=(1.0, 1.08), dim=0.55, blur=8)),
        (29.30, 30.75, mk(23466, 3.0, 2.0, x=0.42), dict(zoom=(1.05, 1.15), trans="whip-l", tdur=0.14)),
        (30.75, 35.00, mk(46972, 2.0, 5.0), dict(zoom=(1.0, 1.12), trans="zoom", tdur=0.2)),
    ]
    for t0, t1, clip, kw in shots:
        v.shot(t0, t1, clip, **kw)

    # ------------------------------------------------------------------ 1. gancho
    def gancho(ctx, lt, t):
        ctx.band(300, 1650, "#000000", 0.5)
        ws = L[0]
        fx.slam_text(ctx, "¿GANAS", F, 150, W / 2, 640, t - ws[0]["start"], color=WHITE, wght=900, shadow=12, frm=1.6)
        fx.slam_text(ctx, "BIEN?", F, 150, W / 2, 800, t - ws[1]["start"], color=NEED, wght=900, shadow=12, frm=1.6)
        if t >= 1.24:
            fx.rise_words(ctx, ws[2:5], F, 86, W / 2, 1000, t, color=WHITE, wght=800, shadow=10)
        if t >= ws[5]["start"]:
            s = fit_size("¿NO TE ALCANZA?", F, W * 0.9, 150, 900)
            fx.slam_text(ctx, "¿NO TE", F, s, W / 2, 1180, t - ws[5]["start"], color=WHITE, wght=900, shadow=12, frm=1.5)
            fx.slam_text(ctx, "ALCANZA?", F, int(s * 1.25), W / 2, 1180 + s * 1.15, t - ws[7]["start"], color=YEL, wght=900,
                         shadow=12, frm=1.8)

    v.layer(0.0, 3.10, gancho)
    v.hit(L[0][7]["start"], shake=0.6, punch=0.08, rgb=0.3, decay=0.25)
    for wd in L[0][:2]:
        v.hit(wd["start"], punch=0.05, decay=0.15)
    v.sfx(L[0][7]["start"], 2299, gain=-12)
    v.sfx(0.0, 1489, gain=-16, align="start")

    # ------------------------------------------------------------------ 2. "El problema no es cuánto ganas, es a dónde se va." (karaoke)
    pages = caption_pages(L[1], max_chars=16, max_words=3)

    def subs(ctx, lt, t, pages=pages, hl=None):
        for pg in pages:
            if pg["t0"] - 0.02 <= t < pg["t1"]:
                fx.karaoke(ctx, pg, t, fname=F, wght=900, size=84, y=1420, active=YEL, highlight=hl)

    v.layer(3.10, 6.75, lambda ctx, lt, t: subs(ctx, lt, t, hl={"donde": YEL, "va": YEL}))
    for tt in (5.56, 5.86, 6.10, 6.30):
        v.hit(tt, punch=0.05, decay=0.12)
        v.sfx(tt, 3115, gain=-15, align="peak")
    v.sfx(3.10, 166, gain=-13, align="peak")
    v.sfx(3.5, 1993, gain=-14)

    # ------------------------------------------------------------------ 3. "Prueba la regla 50 / 30 / 20"
    n50, n30, n20 = L[2][3]["start"], L[2][4]["start"], L[2][5]["start"]

    def regla(ctx, lt, t):
        fx.rise(ctx, "PRUEBA LA REGLA", F, 58, W / 2, 650, t - L[2][0]["start"], color=WHITE, wght=800, tracking=10, shadow=8)
        size = 172
        xs = [W / 2 - 335, W / 2, W / 2 + 335]
        for k, (num, col, t0) in enumerate([("50", NEED, n50), ("30", WANT, n30), ("20", FUT, n20)]):
            q = t - t0 + 0.03
            fx.slam_text(ctx, num, F, size, xs[k], 900, q, color=col, wght=900, frm=1.8, shadow=12)
            if k > 0 and q > 0:
                e = ease_out(prog(q, 0, 0.2))
                x = (xs[k - 1] + xs[k]) / 2
                ctx.line(x + 24 - 48 * e, 990, x + 24, 810, 10, "#ffffff", opacity=0.75 * e)

    v.layer(6.75, 9.57, regla)
    for tt in (n50, n30, n20):
        v.hit(tt, punch=0.06, rgb=0.25, decay=0.16)
        v.sfx(tt, 2364, gain=-10)

    # ------------------------------------------------------------------ 4–6. dona + listas por categoría
    sections = [
        dict(i=3, upto=1, label="LO QUE NECESITAS", col=NEED, val=50, t0=9.57, t1=12.70,
             items=[("RENTA", w("renta")), ("COMIDA", w("comida")), ("TRANSPORTE", w("transporte"))], lt1=14.56,
             title="50% · NECESIDADES"),
        dict(i=4, upto=2, label="LO QUE QUIERES", col=WANT, val=30, t0=14.56, t1=16.55,
             items=[("SALIDAS", w("salidas")), ("VIAJES", w("viajes")), ("CAPRICHOS", w("caprichos"))], lt1=18.85,
             title="30% · DESEOS"),
        dict(i=5, upto=3, label="TU FUTURO", col=FUT, val=20, t0=18.85, t1=21.62,
             items=[("AHORRO", w("ahorro")), ("DEUDAS", w("deudas"))], lt1=22.93, title="20% · FUTURO"),
    ]
    for sec in sections:
        def dona(ctx, lt, t, sec=sec):
            donut(ctx, t, sec["upto"], sec["label"], sec["col"], sec["val"], sec["t0"], sec["t1"])
            # subtítulo de la frase mientras se ve la dona
            ws = [x for x in line(sec["i"])["words"] if x["start"] < sec["t1"] - 0.25]
            for pg in caption_pages(ws, max_chars=18, max_words=3):
                if pg["t0"] - 0.02 <= t < min(pg["t1"], sec["t1"] - 0.15):
                    fx.karaoke(ctx, pg, t, fname=F, wght=900, size=72, y=1330, active=sec["col"])

        def lista(ctx, lt, t, sec=sec):
            bullet_list(ctx, t, sec["items"], sec["col"], sec["title"], sec["t1"])

        v.layer(sec["t0"], sec["t1"], dona)
        v.layer(sec["t1"], sec["lt1"], lista)
        v.sfx(sec["t0"] + 0.15, 175, gain=-13)
        for _, wd in sec["items"]:
            v.sfx(wd["start"], 2568, gain=-11)
            v.hit(wd["start"], punch=0.04, decay=0.15)
    v.hit(21.0, punch=0.05, decay=0.3)   # dona completa

    # ------------------------------------------------------------------ 7. "Si ganas mil dólares: quinientos, trescientos y doscientos."
    mil, q500, q300, q200 = w("mil"), w("quinientos"), w("trescientos"), w("doscientos")
    BX0, BX1, BY, BH = 90, W - 90, 980, 120

    def bar(ctx, t, order=(0, 1, 2), reorder_p=0.0, show=(1, 1, 1), y=BY, amounts=True):
        segs = [(0.5, NEED, "$500", "NECESIDADES", q500), (0.3, WANT, "$300", "DESEOS", q300), (0.2, FUT, "$200", "FUTURO", q200)]
        total_w = BX1 - BX0
        gap = 10
        # posición de cada segmento según el orden (con interpolación para la animación de reordenar)
        def lefts(order):
            pos, x = {}, BX0
            for k in order:
                pos[k] = x
                x += segs[k][0] * total_w
            return pos
        pa, pb = lefts((0, 1, 2)), lefts(order)
        for k, (frac, col, amt, lab, wd) in enumerate(segs):
            grow = ease_out(prog(t, wd["start"] - 0.05, wd["start"] + 0.3), 3) if show[k] else 0
            if grow <= 0:
                continue
            x0 = lerp(pa[k], pb[k], ease_io(reorder_p))
            lift = math.sin(math.pi * reorder_p) * (-150 if k == 2 else 40)
            wdt = frac * total_w * grow
            ctx.rect(x0 + gap / 2, y + lift, x0 + wdt - gap / 2, y + BH + lift, col, radius=22)
            if amounts and reorder_p < 0.98 and reorder_p > 0.02:
                amounts_op = 0.0
            else:
                amounts_op = 1.0
            if amounts and amounts_op > 0:
                cx = x0 + frac * total_w / 2
                val = int(round(float(amt[1:]) * ease_out(prog(t, wd["start"], wd["start"] + 0.35), 2)))
                ctx.text(f"${val}", F, 64 if frac > 0.25 else 56, cx, y + BH + 90 + lift, color=col, wght=900, opacity=grow)
                ctx.text(lab, F, 34 if frac > 0.25 else 30, cx, y + BH + 160 + lift, color=WHITE, wght=800, tracking=3,
                         opacity=grow * 0.85)

    def mil_dolares(ctx, lt, t):
        q = t - mil["start"] + 0.05
        if q >= 0:
            val = fx.counter(0, 1000, prog(q, 0, 0.6))
            s, op = fx.pop(q, 0.5, 3, 8)
            ctx.text(f"${val}", F, 230, W / 2, 700, color=WHITE, wght=900, scale=s, opacity=op, shadow=14)
        fx.rise(ctx, "SI GANAS", F, 58, W / 2, 520, t - L[6][0]["start"], color=WHITE, wght=800, tracking=10, shadow=8)
        # contorno de la barra vacía
        if q > 0.3:
            ctx.rect(BX0, BY, BX1, BY + BH, "#ffffff", opacity=0.10 * prog(q, 0.3, 0.6), radius=22)
        bar(ctx, t)

    v.layer(22.93, 26.95, mil_dolares)
    v.sfx(mil["start"] + 0.6, 1992, gain=-14)
    for wd in (q500, q300, q200):
        v.sfx(wd["start"], 2364, gain=-11)
        v.hit(wd["start"], punch=0.04, decay=0.15)

    # ------------------------------------------------------------------ 8. "El truco: el veinte se aparta primero, el mismo día que cobras."
    truco, veinte, primero = w("truco"), w("veinte", after=27.5), w("primero")

    def el_truco(ctx, lt, t):
        if t < 27.95:
            fx.slam_text(ctx, "EL TRUCO", F, fit_size("EL TRUCO", F, W * 0.86, 190, 900), W / 2, 900, t - truco["start"] + 0.1,
                         color=YEL, wght=900, frm=2.0, shadow=14)
            return
        p = prog(t, veinte["start"] + 0.1, primero["start"] + 0.2)
        bar(ctx, 99, order=(2, 0, 1), reorder_p=p, y=860, amounts=True)
        fx.rise(ctx, "PRIMERO", F, 150, W / 2, 1340, t - primero["start"] + 0.05, color=FUT, wght=900, shadow=12)
        fx.rise(ctx, "EL 20% SE APARTA", F, 60, W / 2, 640, t - veinte["start"] + 0.05, color=WHITE, wght=800, tracking=6, shadow=8)

    v.layer(26.95, 29.30, el_truco)
    v.hit(truco["start"] + 0.1, shake=0.5, punch=0.08, rgb=0.4, decay=0.22)
    v.sfx(truco["start"] + 0.1, 772, gain=-10, align="peak")
    v.sfx(veinte["start"] + 0.2, 166, gain=-12, align="peak")
    v.sfx(primero["start"], 2364, gain=-10)

    pages8 = caption_pages([x for x in L[7] if x["start"] >= 29.2], max_chars=16, max_words=3)
    v.layer(29.30, 30.75, lambda ctx, lt, t: subs(ctx, lt, t, pages=pages8, hl={"cobras": NEED}))

    # ------------------------------------------------------------------ 9. "Guarda este video y empieza este mes." + cierre
    guarda = w("guarda")

    def bookmark(ctx, x, y, s, fill_p, op):
        hw, hh = 70 * s, 95 * s
        pts = [(x - hw, y - hh), (x + hw, y - hh), (x + hw, y + hh), (x, y + hh * 0.45), (x - hw, y + hh)]
        if fill_p > 0:
            ctx.poly(pts, YEL, opacity=op * fill_p)
        ctx.poly(pts, WHITE, opacity=op, width=9 * s)

    def cta(ctx, lt, t):
        q = t - guarda["start"]
        if q >= 0:
            s, op = fx.pop(q, 0.3, 2.8, 7)
            fill = ease_out(prog(q, 0.35, 0.6))
            bookmark(ctx, W / 2, 720, s * 1.3, fill, op)
            fx.slam_text(ctx, "GUÁRDALO", F, 150, W / 2, 1000, q - 0.05, color=WHITE, wght=900, shadow=12, frm=1.6)
        pg = caption_pages(L[8][3:], max_chars=20, max_words=4)
        for p in pg:
            if p["t0"] - 0.02 <= t < 33.5:
                fx.karaoke(ctx, p, t, fname=F, wght=900, size=78, y=1200, active=NEED)
        if t >= 33.5:   # cierre: dona completa en miniatura
            donut(ctx, t, 3, "", WHITE, 0, 33.5, 99, cy=1500, show_center=False)
            fx.rise(ctx, "50 · 30 · 20", F, 64, W / 2, 1500, t - 33.6, color=WHITE, wght=900, shadow=8)

    def cierre_pre(ctx):
        if ctx.t >= 30.75:
            ctx.band(350, 1450, "#000000", 0.45)
        if ctx.t >= 33.3:
            p = ease_io(prog(ctx.t, 33.3, 33.8))
            ctx.blur(18 * p)
            ctx.darken(0.45 * p)

    v.pre_layers.append(cierre_pre)
    v.layer(30.75, 35.0, cta)
    v.hit(guarda["start"] + 0.4, punch=0.05, decay=0.2)
    v.sfx(guarda["start"] + 0.35, 1120, gain=-8)
    return v


import math  # noqa: E402
