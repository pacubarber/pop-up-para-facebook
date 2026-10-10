"""CORTE — «Intenta no saltarte este video». Video de la agencia, estilo ilustrado (como Grano Alto). 9:16 · ~20 s.

Sin material de librerías: todo se dibuja en código y todo el sonido se sintetiza (motor/sonido.py), sin música.
Es un video "meta": cada truco de retención aparece justo cuando la voz lo nombra (zoom, sonido, pregunta),
y al final la línea de tiempo marca los tres trucos donde ocurrieron.
El cierre empalma con el inicio para que el video se repita solo.
"""
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motor"))
import efectos as fx  # noqa: E402
from motor import (H, W, Video, back, clamp, ease_in, ease_io, ease_out, fit_size, font, hexc, lerp, load_vo,  # noqa: E402,F401
                   prog, spring, text_width, warp, word_time, zoom_blur)

VO = load_vo("corte-reto")
from ilustraciones import (BONE, F, INK, LINE, MONO, MUTED, PANEL, RED, SI, logo, phone, slam_words,  # noqa: E402
                           speaker, thumb, tight)
L = [l["words"] for l in VO["lines"]]
END = 19.6

# escenas (inicio, fin, fondo)
S = {"gancho": (0.0, 2.62, INK), "zoom": (2.62, 6.16, BONE), "sonido": (6.16, 7.84, RED), "pregunta": (7.84, 10.62, INK),
     "retencion": (10.62, 14.76, BONE), "comenta": (14.76, 19.0, RED), "bucle": (19.0, END, INK)}
TRICKS = [("ZOOM", L[1][9]["start"]), ("SONIDO", L[2][2]["start"]), ("PREGUNTA", L[3][4]["start"])]


def w(text, n=1, after=0.0):
    return word_time(VO, text, n, after)


def bg_at(t):
    for a, b, c in S.values():
        if a <= t < b:
            return c
    return INK


# ilustraciones de la marca: motor/ilustraciones.py

# ====================================================================== escenas
def gancho_base(ctx, t, thumb_in=1.0):
    wig = math.sin(t * 5.0) * 10
    phone(ctx, W / 2, 1390, 0.74, rot=-2, progress=0.03 + 0.02 * t, mini_t=t)
    tx = lerp(1010, 830, thumb_in) + wig * 0.4
    ty = lerp(2250, 1720, thumb_in) + wig
    thumb(ctx, tx, ty, 0.95, -28 + wig * 0.15)


def esc_gancho(ctx, lt):
    t = lt
    gancho_base(ctx, t)
    ws = L[0]
    slam_words(ctx, t, [("INTENTA NO", F, 150, 330, BONE, ws[0]["start"]),
                        ("SALTARTE", F, 196, 500, BONE, ws[2]["start"]),
                        ("este video.", SI, 210, 690, RED, ws[3]["start"])])


def esc_zoom(ctx, lt):
    t = S["zoom"][0] + lt
    ir, por, zoom_t = w("ir"), w("por"), w("zoom")["start"]
    # el pulgar intenta deslizar el celular… y el video lo retiene
    drag = ease_io(prog(t, ir["start"], ir["start"] + 0.55)) * (1 - spring(t - por["start"], 2.4, 6) if t > por["start"] else 1)
    py = 1240 - 210 * drag
    phone(ctx, W / 2, py, 0.72, rot=-2 - 6 * drag, frame=INK, screen=PANEL, progress=0.18)
    thumb(ctx, 820, py + 520 - 40 * drag, 0.95, -28)
    if t < por["start"]:
        for txt, y, t0 in (("AQUÍ TE", 330, L[1][0]["start"]), ("IBAS A IR…", 490, L[1][2]["start"])):
            fx.rise(ctx, txt, F, 150, W / 2, y, t - t0 + 0.04, color=INK, wght=900, tracking=tight(150))
    else:
        fx.rise(ctx, "POR ESO PUSE ESTE", F, 84, W / 2, 330, t - por["start"] + 0.04, color=INK, wght=900, tracking=tight(84))
        q = t - zoom_t + 0.03
        if q >= 0:
            sc, op, bl = fx.slam(q, 0.18, 1.5)
            ctx.text("ZOOM", F, 230, W / 2, 560, color=RED, scale=sc, opacity=op, blur=bl, wght=900, tracking=tight(230))
    # el ZOOM de verdad: la cámara se mete en la palabra
    z = 1 + 0.42 * back(prog(t, zoom_t, zoom_t + 0.22), 1.4)
    if z > 1.001:
        moving = 1 - prog(t, zoom_t + 0.05, zoom_t + 0.25)
        cx, cy = W / 2, 560
        img = zoom_blur(ctx.img, z, 0.12 * moving, n=5, cx=cx, cy=cy) if moving > 0.05 else warp(ctx.img, z, cx=cx, cy=cy)
        ctx.img = img


def esc_sonido(ctx, lt):
    t = S["sonido"][0] + lt
    son = w("sonido")["start"]
    fx.rise(ctx, "AQUÍ,", F, 150, W / 2, 330, t - L[2][0]["start"] + 0.04, color=BONE, wght=900, tracking=tight(150))
    fx.rise(ctx, "UN SONIDO", F, 150, W / 2, 490, t - L[2][1]["start"] + 0.04, color=BONE, wght=900, tracking=tight(150))
    q = t - son
    # anillos de la onda expansiva
    for k in range(4):
        qq = q - k * 0.08
        if qq > 0:
            r = 120 + ease_out(prog(qq, 0, 0.7), 2) * 900
            ctx.circle(W / 2, 1060, r, BONE, width=26 * (1 - prog(qq, 0, 0.7)) + 2, opacity=1 - prog(qq, 0.1, 0.7))
    pre = prog(t, son - 0.6, son)
    speaker(ctx, W / 2 + 20, 1060, 1.5 * (1 + 0.08 * math.sin(t * 40) * pre * (q < 0)), INK, waves=pre * 1.2 if q < 0 else 1)
    if q >= 0:
        sc, op, bl = fx.slam(q, 0.16, 2.0)
        ctx.text("¡PUM!", F, 300, W / 2, 1560, color=INK, scale=sc, opacity=op, blur=bl, wght=900, tracking=tight(300))


def esc_pregunta(ctx, lt):
    t = S["pregunta"][0] + lt
    sig = w("sigues")["start"]
    fx.rise(ctx, "Y AQUÍ,", F, 120, W / 2, 330, t - L[3][0]["start"] + 0.04, color=BONE, wght=900, tracking=tight(120))
    fx.rise(ctx, "UNA PREGUNTA:", F, 120, W / 2, 470, t - L[3][2]["start"] + 0.04, color=BONE, wght=900, tracking=tight(120))
    # cronómetro: avanza a saltos con el tic-tac y se congela en el silencio
    frozen = min(t, 9.55)
    step = math.floor(frozen * 2) / 2
    cx, cy, r = W / 2, 1010, 230
    ctx.ring(cx, cy, r, 26, LINE)
    ctx.ring(cx, cy, r, 26, RED, -90, -90 + 360 * ((step % 10) / 10))
    ang = math.radians(-90 + 360 * ((step % 10) / 10))
    ctx.line(cx, cy, cx + (r - 50) * math.cos(ang), cy + (r - 50) * math.sin(ang), 12, BONE)
    ctx.circle(cx, cy, 16, BONE)
    ctx.text(f"00:{int(t):02d}", MONO, 64, cx, cy + 120, color=BONE, tracking=4)
    ctx.text("LLEVAS VIENDO", MONO, 30, cx, cy - r - 60, color=MUTED, tracking=8)
    if t >= sig:
        slam_words(ctx, t, [("¿SIGUES", F, 190, 1430, BONE, sig), ("aquí?", SI, 250, 1630, RED, w("aqui", 4)["start"])])


TL = dict(x0=110, x1=970, y0=930, y1=1610)     # panel de línea de tiempo


def tl_x(tv):
    return lerp(TL["x0"] + 40, TL["x1"] - 40, tv / END)


def timeline(ctx, t, ph_t):
    x0, x1, y0, y1 = TL["x0"], TL["x1"], TL["y0"], TL["y1"]
    ctx.rect(x0 - 40, y0 - 40, x1 + 40, y1 + 40, INK, radius=40)
    # regla
    for k in range(0, 20):
        x = tl_x(k)
        ctx.line(x, y0 + 10, x, y0 + (34 if k % 5 == 0 else 22), 3, MUTED)
        if k % 5 == 0:
            ctx.text(f"00:{k:02d}", MONO, 22, x + 6, y0 + 20, color=MUTED, anchor="l")
    # pistas
    rng = np.random.default_rng(3)
    edges = [0.0, 2.62, 6.16, 7.84, 10.62, 14.76, 19.0, END]
    cols = [PANEL, "#3A3A40", RED, PANEL, "#3A3A40", RED, PANEL]
    for k in range(len(edges) - 1):
        ctx.rect(tl_x(edges[k]) + 4, y0 + 300, tl_x(edges[k + 1]) - 4, y0 + 390, cols[k], radius=12)
        ctx.rect(tl_x(edges[k]) + 4, y0 + 300, tl_x(edges[k + 1]) - 4, y0 + 390, BONE, radius=12, opacity=0.08)
    xs = np.linspace(tl_x(0), tl_x(END), 70)
    for x in xs:
        hh = 10 + rng.uniform(0, 1) ** 1.5 * 70
        ctx.line(x, y0 + 470 - hh / 2, x, y0 + 470 + hh / 2, 6, BONE, opacity=0.65)
    for a, b in ((0, 2.4), (2.7, 6.0), (6.3, 7.6), (7.9, 10.4), (10.7, 14.6), (14.8, 18.7)):
        ctx.rect(tl_x(a) + 2, y0 + 560, tl_x(b) - 2, y0 + 610, RED, radius=10, opacity=0.85)
    # curva de retención: se dibuja con el cabezal y nunca cae (cada truco la levanta)
    pts = []
    for k in range(120):
        tv = END * k / 119
        if tv > ph_t:
            break
        y = 0.82 - 0.10 * (tv / END)
        for _, tt in TRICKS:
            y += 0.09 * math.exp(-((tv - tt) / 0.5) ** 2)
        y -= 0.05 * math.sin(tv * 1.7) ** 2
        pts.append((tl_x(tv), y0 + 280 - y * 200))
    for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
        ctx.line(xa, ya, xb, yb, 9, RED)
    # marcas de cada truco
    for k, (name, tt) in enumerate(TRICKS):
        if ph_t >= tt:
            q = ease_out(prog(ph_t, tt, tt + 1.0), 3)
            x = tl_x(tt)
            ctx.line(x, y0 + 40, x, y0 + 610, 4, BONE, opacity=0.5 * q)
            ctx.poly([(x, y0 + 40), (x + 26 * q, y0 + 54), (x, y0 + 68)], BONE)
            ctx.text(name, MONO, 30, x - 8, y0 - 66 - k * 38, color=INK, anchor="l", tracking=4, opacity=q)
    # cabezal
    xp = tl_x(ph_t)
    ctx.line(xp, y0 + 30, xp, y1 + 10, 6, RED)
    ctx.poly([(xp - 18, y0 + 6), (xp + 18, y0 + 6), (xp, y0 + 36)], RED)


def esc_retencion(ctx, lt):
    t = S["retencion"][0] + lt
    fx.rise_words(ctx, L[4][:3], F, 116, W / 2, 300, t, color=INK, wght=900, tracking=tight(116), space=1.5)
    fx.rise(ctx, "se llama", SI, 100, W / 2, 440, t - L[4][3]["start"] + 0.04, color=INK)
    ret = w("retencion")["start"]
    q = t - ret + 0.03
    if q >= 0:
        sc, op, bl = fx.slam(q, 0.22, 1.6)
        ctx.text("retención.", SI, 230, W / 2, 620, color=RED, scale=sc, opacity=op, blur=bl)
    ph_t = END * ease_io(prog(t, 10.8, 13.7))
    edita = w("edita")["start"]
    split = ease_out(prog(t, edita, edita + 0.35), 3)
    if split <= 0:
        timeline(ctx, t, ph_t)
    else:
        # "Y se edita": la línea de tiempo se corta en diagonal como el logo de CORTE
        before = ctx.img.copy()
        timeline(ctx, t, ph_t)
        drawn = ctx.img
        ctx.img = before
        ang = math.radians(-35)
        cx, cy = (TL["x0"] + TL["x1"]) / 2, (TL["y0"] + TL["y1"]) / 2
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        side = (xx - cx) * math.sin(ang) - (yy - cy) * math.cos(ang)
        nx, ny = math.sin(ang), -math.cos(ang)
        d = 34 * split
        layer = drawn - before
        a_mask = np.clip(side / 2 + 0.5, 0, 1)[..., None]
        part_a = warp(layer * a_mask, 1.0, nx * d, ny * d, border=0)
        part_b = warp(layer * (1 - a_mask), 1.0, -nx * d, -ny * d, border=0)
        ctx.img = before + part_a + part_b
        L0 = 900 * ease_out(prog(t, edita - 0.25, edita + 0.05), 2)
        if prog(t, edita - 0.25, edita + 0.35) < 1:
            ctx.line(cx - math.cos(ang) * L0, cy - math.sin(ang) * L0, cx + math.cos(ang) * L0, cy + math.sin(ang) * L0, 8, RED)
        fx.rise(ctx, "Y SE EDITA.", F, 110, W / 2, 1760, t - w("y", after=13.5)["start"] + 0.04, color=INK, wght=900,
                tracking=tight(110))


def esc_comenta(ctx, lt):
    t = S["comenta"][0] + lt
    com, corte, primer, gratis = w("comenta"), w("corte"), w("primer"), w("gratis")
    fx.rise(ctx, "COMENTA", F, 150, W / 2, 300, t - com["start"] + 0.04, color=BONE, wght=900, tracking=tight(150))
    # burbuja de comentario que se escribe sola
    bub = spring(t - com["start"] - 0.1, 2.6, 7)
    send = t - (corte["end"] + 0.05)
    lift = ease_out(prog(send, 0, 0.3), 3) * 40 if send > 0 else 0
    if bub > 0.02:
        by = 640 - lift
        ctx.rect(110, by - 120 * bub, 970, by + 120 * bub, BONE, radius=60 * bub)
        ctx.circle(205, by, 52 * bub, INK)
        logo(ctx, 205, by, 30 * bub, 8 * bub)
        n = int(clamp((t - corte["start"]) / (corte["end"] - corte["start"] - 0.05)) * 5)
        txt = "CORTE"[:n]
        ctx.text(txt, F, 120, 290, by + 6, color=INK, anchor="l", wght=900, tracking=tight(120))
        if send < 0 and int(t * 4) % 2 == 0:
            cxp = 290 + text_width(txt, F, 120, 900, tight(120)) + 12
            ctx.rect(cxp, by - 50, cxp + 8, by + 50, RED)
        # botón enviar y corazón
        ctx.circle(890, by, 50 * bub, INK)
        ctx.poly([(870, by - 24), (870, by + 24), (912, by)], BONE)
        if send > 0.2:
            hs, ho = fx.pop(send - 0.2, 0.2, 3.0, 7)
            hx, hy = 900, by - 170
            ctx.circle(hx, hy, 58 * hs, BONE, opacity=ho)
            ctx.circle(hx - 16 * hs, hy - 6 * hs, 18 * hs, RED, opacity=ho)
            ctx.circle(hx + 16 * hs, hy - 6 * hs, 18 * hs, RED, opacity=ho)
            ctx.poly([(hx - 33 * hs, hy), (hx + 33 * hs, hy), (hx, hy + 34 * hs)], RED, opacity=ho)
    fx.rise_words(ctx, L[5][2:6], F, 92, W / 2, 960, t, color=BONE, wght=900, tracking=tight(92), space=1.5)
    fx.rise(ctx, "primer video", SI, 170, W / 2, 1130, t - primer["start"] + 0.04, color=BONE)
    # sello GRATIS
    q = t - gratis["start"] + 0.02
    if q >= 0:
        s = spring(q, 2.8, 8)
        cx, cy, ang = 540, 1450, -12 + (1 - s) * 50
        r = 200 * (0.4 + 0.6 * s)
        ctx.circle(cx, cy, r + 14, BONE, opacity=clamp(q * 8))
        ctx.circle(cx, cy, r, INK, opacity=clamp(q * 8))
        ctx.circle(cx, cy, r - 22, RED, width=5, opacity=clamp(q * 8))
        ctx.text("GRATIS", F, int(78 * r / 200), cx, cy, color=RED, rot=ang, wght=900, tracking=tight(78), opacity=clamp(q * 8))
    # firma
    op = prog(t, gratis["start"] + 0.3, gratis["start"] + 0.6)
    if op > 0:
        logo(ctx, 400, 1770, 34, 9, op)
        ctx.text("CORTE", F, 70, 455, 1770, color=BONE, anchor="l", wght=900, tracking=tight(70), opacity=op)
        ctx.text("@corte.studio", MONO, 28, W / 2, 1840, color=BONE, tracking=4, opacity=op * 0.8)


def esc_bucle(ctx, lt):
    # vuelve a la composición del primer fotograma: el video empalma consigo mismo
    gancho_base(ctx, -0.6 + lt, thumb_in=ease_out(prog(lt, 0, 0.55), 3))


# ====================================================================== armado
def build():
    v = Video("corte-reto", END)
    v.voice("corte-reto", 0.0)
    v.grain, v.vignette, v.bloom = 0.04, 0.25, 0.0
    v.poster = 5.95

    trans = {"zoom": "whip-u", "sonido": "whip-l", "pregunta": "whip-u", "retencion": "whip-l", "comenta": "whip-u",
             "bucle": "glitch"}
    draws = {"gancho": esc_gancho, "zoom": esc_zoom, "sonido": esc_sonido, "pregunta": esc_pregunta,
             "retencion": esc_retencion, "comenta": esc_comenta, "bucle": esc_bucle}
    for k, (a, b, bg) in S.items():
        kw = dict(trans=trans[k], tdur=0.22 if trans[k] != "glitch" else 0.12) if k in trans else {}
        v.scene(a, b, draws[k], bg=bg, **kw)

    # golpes visuales
    for wd in (L[0][0], L[0][2], L[0][3]):
        v.hit(wd["start"], punch=0.05, decay=0.15)
    zoom_t, son, sig, ret, edita, gratis = (TRICKS[0][1], TRICKS[1][1], TRICKS[2][1], w("retencion")["start"],
                                            w("edita")["start"], w("gratis")["start"])
    v.hit(zoom_t, shake=0.25, decay=0.2)
    v.hit(son, shake=1.0, rgb=0.6, flash=0.25, decay=0.3, flash_color=BONE)
    v.hit(sig, punch=0.05, decay=0.2)
    v.hit(ret, punch=0.06, decay=0.25)
    v.hit(edita, shake=0.5, rgb=0.4, decay=0.25)
    v.hit(gratis, shake=0.4, decay=0.2)

    # ------------------------------------------------ diseño sonoro (todo sintetizado, sin música)
    v.sfx(0.0, "boom_suave", gain=-9, align="start")
    v.sfx(0.0, "dron", gain=-17, align="start")
    tt, k = 0.25, 0
    while tt < 9.55:                       # tic-tac que sostiene la tensión… y se corta antes de "¿sigues aquí?"
        v.sfx(tt, "tick" if k % 2 == 0 else "tock", gain=-19 if tt < 7.84 else -15, align="start")
        tt += 0.5
        k += 1
    v.sfx(L[0][2]["start"], "whoosh_corto", gain=-15, align="peak")
    for name in ("zoom", "sonido", "pregunta", "retencion", "comenta"):
        v.sfx(S[name][0], "whoosh" if name != "pregunta" else "whoosh_abajo", gain=-12, align="peak")
    v.sfx(w("ir")["start"] + 0.1, "whoosh", gain=-13, align="peak")           # el pulgar intenta deslizar
    v.sfx(zoom_t - 1.0, "riser_corto", gain=-9, align="start")               # sube hasta el zoom
    v.sfx(zoom_t - 0.22, "zoom", gain=-4, align="start")
    v.sfx(son - 0.8, "swell", gain=-8, align="start")                       # aspira antes del golpe
    v.sfx(son, "boom", gain=-1)
    v.sfx(sig + 0.02, "latido", gain=-6, align="start")                      # silencio + latido en la pregunta
    v.sfx(w("aqui", 4)["end"] + 0.02, "ding", gain=-11, align="start")
    v.sfx(ret - 1.0, "riser_corto", gain=-10, align="start")
    v.sfx(ret, "boom_suave", gain=-9)
    ph = lambda tv: 10.8 + (13.7 - 10.8) * tv / END  # aprox. cuándo el cabezal pasa por cada marca  # noqa: E731
    for _, tv in TRICKS:
        v.sfx(ph(tv), "pop", gain=-14, align="start")
    v.sfx(edita - 0.25, "tijera", gain=-6, align="start")
    v.sfx(edita, "boom_suave", gain=-8)
    corte = w("corte")
    for i in range(5):
        v.sfx(corte["start"] + i * (corte["end"] - corte["start"] - 0.05) / 5, "tecla", gain=-9, align="start")
    v.sfx(corte["end"] + 0.05, "pop", gain=-8, align="start")
    v.sfx(corte["end"] + 0.27, "pop", gain=-10, align="start")
    v.sfx(gratis, "sello", gain=-3)
    v.sfx(19.0, "glitch", gain=-12, align="start")
    v.sfx(END - 1.4, "swell_largo", gain=-10, align="start")                # empuja hacia el inicio (bucle)
    return v
