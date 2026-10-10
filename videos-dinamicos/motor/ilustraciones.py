"""Ilustraciones de la marca CORTE dibujadas en código (estilo plano, como Grano Alto).

Celular con interfaz de reel, pulgar, isotipo del disco cortado, altavoz, notas de editor, candado,
casillas de verificación y barra de carga. Las usan las ediciones de la agencia (corte-reto, corte-4-trucos).
"""
import math

import numpy as np

import efectos as fx
from motor import W, clamp, ease_out, lerp, prog, text_width

INK, PANEL, LINE, BONE, MUTED, RED, REDD = "#0C0C0E", "#17171A", "#2A2A2F", "#F2EEE6", "#8C8A84", "#FF3B1F", "#C9260E"
SKIN, NAIL = "#E7DCCB", "#F6EEE4"
F, SI, MONO = "inter", "serif-i", "mono"


def tight(size):
    """Espaciado apretado de los titulares de CORTE (−3.5 % del tamaño)."""
    return -round(size * 0.035)


def rot_pts(pts, cx, cy, deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return [(cx + x * c - y * s, cy + x * s + y * c) for x, y in pts]


def rrect(w_, h_, r, n=10):
    """Rectángulo redondeado centrado en el origen (lista de puntos)."""
    pts = []
    for cx, cy, a0 in ((w_ / 2 - r, -h_ / 2 + r, -90), (w_ / 2 - r, h_ / 2 - r, 0), (-w_ / 2 + r, h_ / 2 - r, 90),
                       (-w_ / 2 + r, -h_ / 2 + r, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def phone(ctx, cx, cy, s=1.0, rot=0.0, frame=BONE, screen=PANEL, progress=0.03, mini=True, mini_t=99.0):
    """Celular con la interfaz de un reel. Su pantalla muestra ESTE mismo video en miniatura (efecto Droste)."""
    pw, ph = 500 * s, 1000 * s
    ctx.poly(rot_pts(rrect(pw + 30 * s, ph + 30 * s, 84 * s), cx, cy, rot), frame)
    ctx.poly(rot_pts(rrect(pw, ph, 70 * s), cx, cy, rot), screen)
    P = lambda x, y: rot_pts([(x * s, y * s)], cx, cy, rot)[0]  # noqa: E731
    # muesca
    ctx.poly(rot_pts(rrect(120 * s, 26 * s, 13 * s), *P(0, -460), rot), frame)
    if mini:   # el video dentro del video
        for txt, y, fn, size, col in (("INTENTA NO", -150, F, 66, BONE), ("SALTARTE", -78, F, 74, BONE), ("este video.", 10, SI, 84, RED)):
            x, yy = P(0, y)
            ctx.text(txt, fn, int(size * s), x, yy, color=col, rot=rot, wght=900 if fn == F else None,
                     tracking=tight(size * s) if fn == F else 0, opacity=clamp(mini_t * 4))
    # columna de íconos (corazón, comentario, compartir)
    for k, y in enumerate((120, 230, 340)):
        x, yy = P(200, y)
        ctx.circle(x, yy, 30 * s, BONE, opacity=0.9 if k == 0 else 0.55)
    # usuario y descripción
    x, yy = P(-170, 330)
    ctx.circle(x, yy, 30 * s, RED)
    for k, (dx, ww) in enumerate(((-40, 180), (-80, 300), (-110, 240))):
        x, yy = P(-150 + ww / 2 + (0 if k == 0 else -40), 330 + k * 46 - (0 if k == 0 else -10))
        ctx.poly(rot_pts(rrect(ww * s, 20 * s, 10 * s), x, yy, rot), BONE, opacity=0.8 if k == 0 else 0.4)
    # barra de progreso
    x0, y0 = P(-220, 470)
    x1, y1 = P(220, 470)
    ctx.line(x0, y0, x1, y1, 8 * s, LINE)
    pe = lerp(-220, 220, clamp(progress))
    x2, y2 = P(pe, 470)
    ctx.line(x0, y0, x2, y2, 8 * s, RED)
    ctx.circle(x2, y2, 9 * s, RED)


def thumb(ctx, x, y, s=1.0, rot=-28.0, shadow=True):
    """Pulgar ilustrado (cápsula + uña)."""
    if shadow:
        ctx.poly(rot_pts(rrect(160 * s, 520 * s, 80 * s), x + 18 * s, y + 26 * s, rot), "#000000", opacity=0.25)
    ctx.poly(rot_pts(rrect(160 * s, 520 * s, 80 * s), x, y, rot), SKIN)
    nx, ny = rot_pts([(0, -150 * s)], x, y, rot)[0]
    ctx.poly(rot_pts(rrect(104 * s, 132 * s, 50 * s), nx, ny, rot), NAIL)
    ctx.poly(rot_pts(rrect(104 * s, 132 * s, 50 * s), nx, ny, rot), "#CDBFAA", width=3 * s)
    # pliegue del nudillo
    kx, ky = rot_pts([(0, 40 * s)], x, y, rot)[0]
    ctx.poly(rot_pts(rrect(70 * s, 8 * s, 4 * s), kx, ky, rot), "#CDBFAA", opacity=0.8)


def tag(ctx, txt, x, y, lt, color=RED, ink=BONE, anchor="c"):
    """Nota de editor: punto + texto mono."""
    if lt < 0:
        return
    e = ease_out(prog(lt, 0, 0.25), 3)
    tw = text_width(txt, MONO, 34, tracking=6)
    left = {"c": x - tw / 2, "l": x}[anchor]
    ctx.circle(left - 26, y, 10 * e, color)
    ctx.text(txt[: max(1, int(len(txt) * clamp(lt / 0.3)))], MONO, 34, left, y, color=ink, anchor="l", tracking=6,
             opacity=e)


def half_disc_pts(cx, cy, r, ang, n=40):
    return [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in np.linspace(ang, ang + 180, n)]


def logo(ctx, cx, cy, r, sep=None, op=1.0, top=BONE, bottom=RED):
    """Isotipo de CORTE: un disco cortado en dos mitades separadas."""
    sep = r * 0.25 if sep is None else sep
    ang = math.degrees(math.atan2(45.89, -65.53))           # dirección del corte (del SVG de la marca)
    nx, ny = math.cos(math.radians(ang + 90)), math.sin(math.radians(ang + 90))
    ctx.poly(half_disc_pts(cx - nx * sep / 2, cy - ny * sep / 2, r, ang), top, opacity=op)
    ctx.poly(half_disc_pts(cx + nx * sep / 2, cy + ny * sep / 2, r, ang + 180), bottom, opacity=op)


def speaker(ctx, cx, cy, s, col, waves=0.0):
    ctx.poly([(cx - 150 * s, cy - 60 * s), (cx - 80 * s, cy - 60 * s), (cx + 10 * s, cy - 140 * s), (cx + 10 * s, cy + 140 * s),
              (cx - 80 * s, cy + 60 * s), (cx - 150 * s, cy + 60 * s)], col)
    for k in range(3):
        o = clamp(waves * 3 - k)
        if o > 0:
            ctx.ring(cx + 30 * s, cy, (90 + 70 * k) * s, 22 * s, col, -45, 45, opacity=o)


def slam_words(ctx, t, items, **kw):
    """items: [(texto, fuente, tamaño, y, color, t0)] — cada palabra golpea a su tiempo."""
    for txt, fn, size, y, col, t0 in items:
        q = t - t0 + 0.03
        if q < 0:
            continue
        sc, op, bl = fx.slam(q, 0.2, 1.6)
        ctx.text(txt, fn, size, W / 2, y, color=col, scale=sc, opacity=op, blur=bl,
                 wght=900 if fn == F else None, tracking=tight(size) if fn == F else 0, **kw)


def padlock(ctx, cx, cy, s, body=BONE, shackle=BONE, open_p=0.0, op=1.0):
    """Candado: cuerpo redondeado + arco. open_p levanta el arco."""
    lift = 40 * s * open_p
    ctx.ring(cx, cy - 40 * s - lift, 62 * s, 22 * s, shackle, 180, 360, opacity=op, cap=False)
    ctx.rect(cx - 84 * s, cy - 40 * s - lift, cx - 62 * s, cy + 10 * s - lift * 0.0, shackle, opacity=op)
    ctx.rect(cx + 62 * s, cy - 40 * s - lift, cx + 84 * s, cy + 10 * s - lift, shackle, opacity=op)
    ctx.rect(cx - 110 * s, cy - 10 * s, cx + 110 * s, cy + 140 * s, body, radius=26 * s, opacity=op)
    ctx.circle(cx, cy + 50 * s, 18 * s, INK, opacity=op)
    ctx.rect(cx - 7 * s, cy + 55 * s, cx + 7 * s, cy + 100 * s, INK, opacity=op)


def checkmark(ctx, cx, cy, s, p, color=BONE, width=12):
    """Palomita que se dibuja (p de 0 a 1)."""
    a = clamp(p / 0.4)
    b = clamp((p - 0.4) / 0.6)
    x0, y0, x1, y1, x2, y2 = cx - 34 * s, cy, cx - 10 * s, cy + 26 * s, cx + 38 * s, cy - 30 * s
    if a > 0:
        ctx.line(x0, y0, lerp(x0, x1, a), lerp(y0, y1, a), width * s, color)
    if b > 0:
        ctx.line(x1, y1, lerp(x1, x2, b), lerp(y1, y2, b), width * s, color)


def loading_bar(ctx, x0, x1, y, p, color=RED, track=LINE, h=34):
    ctx.rect(x0, y - h / 2, x1, y + h / 2, track, radius=h / 2)
    if p > 0:
        ctx.rect(x0, y - h / 2, lerp(x0 + h, x1, p), y + h / 2, color, radius=h / 2)

