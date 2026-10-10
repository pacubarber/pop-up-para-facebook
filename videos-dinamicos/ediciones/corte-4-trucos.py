"""CORTE — «Los 4 trucos para que no dejes de ver esto». Video de la agencia, estilo ilustrado. 9:16 · ~47 s.

Locución de ElevenLabs (voz Stanley – Trailer, Eleven v3) con silencios recortados y tiempos de Whisper.
Sin librerías ni música: todo se dibuja en código y el sonido es sintetizado (motor/sonido.py).

Estructura viral: bucle abierto (el truco 4 se promete al inicio y se revela al final), cada truco se aplica
mientras se explica, una lista de 4 casillas arriba que se va marcando (con candado en la 4) y un cierre que
rebobina hasta el inicio para que el video se repita.
"""
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motor"))
import efectos as fx  # noqa: E402
from ilustraciones import (BONE, F, INK, LINE, MONO, MUTED, PANEL, RED, SI, checkmark, loading_bar, logo,  # noqa: E402
                           padlock, phone, slam_words, speaker, tag, thumb, tight)
from motor import (H, W, Video, back, caption_pages, clamp, ease_in, ease_io, ease_out, lerp, load_vo, prog,  # noqa: E402,F401
                   spring, text_width, warp, zoom_blur)

VO = load_vo("corte-4-trucos")
L = [l["words"] for l in VO["lines"]]
LS = [l["start"] for l in VO["lines"]]
LE = [l["end"] for l in VO["lines"]]
END = round(VO["dur"] + 0.06, 2)


def wd(line, k):
    return L[line][k]["start"]


# escenas: (inicio, fin, fondo, transición de entrada)
SC = [
    ("gancho", 0.0, 3.80, INK, None),
    ("candado", 3.80, 6.92, INK, "zoom"),
    ("truco1", 6.92, 12.86, BONE, "whip-u"),
    ("cerebro", 12.86, 15.20, RED, "whip-l"),
    ("truco2", 15.20, 18.55, INK, "whip-u"),
    ("corte", 18.55, 19.30, INK, "cut"),
    ("zoom", 19.30, 19.95, BONE, "cut"),
    ("sonido", 19.95, 20.80, RED, "cut"),
    ("pulgar", 20.80, 23.40, BONE, "whip-l"),
    ("truco3", 23.40, 25.00, INK, "whip-u"),
    ("silencio", 25.00, 30.30, BONE, "whip-l"),
    ("revela", 30.30, 33.25, INK, "cut"),
    ("quedaste", 33.25, 36.85, RED, "whip-u"),
    ("marca", 36.85, 39.95, BONE, "whip-l"),
    ("comenta", 39.95, 42.95, RED, "whip-u"),
    ("bucle", 42.95, END, INK, "glitch"),
]
S = {n: (a, b, c) for n, a, b, c, _ in SC}
CHECK = [LE[4] + 0.05, LE[7] + 0.05, LE[10] + 0.04, wd(12, 0) + 0.1]      # cuándo se marca cada casilla
UNCHECK = [43.3 + 0.3 * k for k in range(4)][::-1]                       # el rebobinado las desmarca (4 → 1)


def bg_at(t):
    for _, a, b, c, _ in SC:
        if a <= t < b:
            return c
    return INK


def ink_on(bg):
    return INK if bg == BONE else BONE


def trick_title(ctx, n, t, t0, ink, y=340):
    """TRUCO n — el número en rojo (o en tinta si el fondo es rojo)."""
    q = t - t0 + 0.03
    if q < 0:
        return
    sc, op, bl = fx.slam(q, 0.2, 1.5)
    size = 130
    w1 = text_width("TRUCO ", F, size, 900, tight(size))
    w2 = text_width(str(n), F, int(size * 1.5), 900, tight(size * 1.5))
    x0 = W / 2 - (w1 + w2) / 2
    ctx.text("TRUCO", F, size, x0, y, color=ink, anchor="l", wght=900, tracking=tight(size), scale=sc, opacity=op, blur=bl)
    num_col = RED if ink != BONE or bg_at(t) != RED else INK
    ctx.text(str(n), F, int(size * 1.5), x0 + w1, y - 6, color=num_col, anchor="l", wght=900, tracking=tight(size * 1.5),
             scale=sc, opacity=op, blur=bl)


# ====================================================================== lista de 4 casillas (arriba)
def hud(ctx, lt, t):
    if S["revela"][0] <= t < S["revela"][1] or t < wd(0, 4) - 0.05:
        return
    bg = bg_at(t)
    ink = ink_on(bg)
    appear = [ease_out(prog(t, wd(0, 4) + 0.08 * k, wd(0, 4) + 0.08 * k + 0.3), 3) for k in range(4)]
    fade = 1 - prog(t, END - 0.75, END - 0.3)
    size, gap, y = 88, 146, 150
    for k in range(4):
        a = appear[k] * fade
        if a <= 0.01:
            continue
        x = W / 2 + (k - 1.5) * gap
        dy = (1 - appear[k]) * -80
        checked = CHECK[k] <= t < UNCHECK[k]
        cp = ease_out(prog(t, CHECK[k], CHECK[k] + 0.25), 3) if checked else 0
        un = prog(t, UNCHECK[k], UNCHECK[k] + 0.2)
        if t >= UNCHECK[k]:
            cp = 1 - un
            checked = cp > 0
        pop = 1 + 0.25 * math.exp(-max(0, t - CHECK[k]) / 0.12) * (t >= CHECK[k] and t < CHECK[k] + 0.6)
        s = size * pop
        if checked:
            ctx.rect(x - s / 2, y + dy - s / 2, x + s / 2, y + dy + s / 2, RED if bg != RED else INK, radius=22, opacity=a)
            checkmark(ctx, x, y + dy, s / 110, cp, BONE, 12)
        else:
            ctx.rect(x - s / 2, y + dy - s / 2, x + s / 2, y + dy + s / 2, ink, radius=22, opacity=a)
            ctx.rect(x - s / 2 + 7, y + dy - s / 2 + 7, x + s / 2 - 7, y + dy + s / 2 - 7, bg, radius=16, opacity=a)
            if k == 3 and t < CHECK[3]:
                shake = math.sin(t * 60) * 5 * (prog(t, LS[3], LS[3] + 0.2) * (1 - prog(t, LE[3], LE[3] + 0.3)))
                padlock(ctx, x + shake, y + dy - 12, 0.27, ink, ink, op=a)
            else:
                ctx.text(str(k + 1), MONO, 42, x, y + dy, color=ink, opacity=a)


def rec(ctx, lt, t):
    if S["revela"][0] <= t < S["quedaste"][1]:
        return
    bg = bg_at(t)
    col = ink_on(bg)
    x = W - 64
    ctx.text(f"00:{int(t):02d}", MONO, 30, x, 80, color=col, anchor="r", tracking=4, opacity=0.9)
    tw = text_width("00:00", MONO, 30, tracking=4)
    ctx.circle(x - tw - 24, 80, 9, RED if bg != RED else INK, opacity=1.0 if int(t * 2) % 2 == 0 else 0.25)


# ====================================================================== escenas
def esc_gancho(ctx, lt):
    t = lt
    fx.rise_words(ctx, L[0][:3], F, 84, W / 2, 400, t, color=BONE, wght=900, tracking=tight(84), space=1.5)
    q = t - wd(0, 3) + 0.03
    if q >= 0:
        sc, op, bl = fx.slam(q, 0.2, 2.0)
        ctx.text("4", F, 820, W / 2, 900, color=RED, scale=sc, opacity=op, blur=bl, wght=900)
    slam_words(ctx, t, [("TRUCOS", F, 170, 1330, BONE, wd(0, 4))])
    fx.rise_words(ctx, L[0][5:10], F, 64, W / 2, 1520, t, color=BONE, wght=900, tracking=tight(64), space=1.5)
    fx.rise_words(ctx, L[0][10:13], F, 110, W / 2, 1640, t, color=RED, wght=900, tracking=tight(110), space=1.4)


def esc_candado(ctx, lt):
    t = S["candado"][0] + lt
    ctx.band(0, H, "#000000", 0.25 * prog(t, 5.0, 6.0))
    fx.rise_words(ctx, L[1][:3], F, 120, W / 2, 440, t, color=BONE, wght=900, tracking=tight(120), space=1.5)
    drop = wd(1, 2) + 0.35
    q = t - drop
    if q > -0.4:
        p = ease_in(prog(q, -0.4, 0.0), 2)
        y = lerp(-300, 1010, p) if q < 0 else 1010 - 30 * math.exp(-q / 0.08) * math.sin(q * 40)
        padlock(ctx, W / 2, y, 1.9, BONE, BONE)
    fx.blur_in(ctx, "te lo digo al final.", SI, 150, W / 2, 1560, t - wd(1, 3), dur=0.6, color=RED)


def esc_truco1(ctx, lt):
    t = S["truco1"][0] + lt
    trick_title(ctx, 1, t, wd(2, 0), INK)
    cy = 1150
    if t < LS[3]:
        fx.rise_words(ctx, L[2][2:4], F, 110, W / 2, 540, t, color=INK, wght=900, tracking=tight(110), space=1.5)
        fx.rise(ctx, "PREGUNTA…", F, 150, W / 2, 690, t - wd(2, 4) + 0.04, color=INK, wght=900, tracking=tight(150))
    else:
        fx.rise(ctx, "COMO ACABO DE HACER", F, 74, W / 2 - 30, 540, t - LS[3] + 0.04, color=INK, wght=900, tracking=tight(74))
        fx.rise(ctx, "con el cuarto truco.", SI, 110, W / 2, 670, t - wd(3, 6) + 0.04, color=RED)
        # flecha en codo hacia la casilla 4 (con candado): sube por el borde derecho y entra por el costado
        p = ease_io(prog(t, LS[3] + 0.3, LS[3] + 1.0))
        pts = [(W - 70, 1000), (W - 70, 150), (W / 2 + 1.5 * 146 + 62, 150)]
        seg_len = [abs(pts[1][1] - pts[0][1]), abs(pts[2][0] - pts[1][0])]
        dist = p * sum(seg_len)
        if dist > 0:
            a = min(dist, seg_len[0])
            ctx.line(pts[0][0], pts[0][1], pts[0][0], pts[0][1] - a, 12, RED)
            xe, ye, ang = pts[0][0], pts[0][1] - a, -math.pi / 2
            if dist > seg_len[0]:
                b = dist - seg_len[0]
                ctx.line(pts[1][0], pts[1][1], pts[1][0] - b, pts[1][1], 12, RED)
                xe, ye, ang = pts[1][0] - b, pts[1][1], math.pi
            ctx.poly([(xe + 8 * math.cos(ang), ye + 8 * math.sin(ang)),
                      (xe - 40 * math.cos(ang - 0.5), ye - 40 * math.sin(ang - 0.5)),
                      (xe - 40 * math.cos(ang + 0.5), ye - 40 * math.sin(ang + 0.5))], RED)
    q = t - wd(2, 4)
    if q >= 0:
        s, op = fx.pop(q, 0.3, 2.6, 7)
        ctx.text("?", SI, int(620 * s), W / 2, cy + 20, color=RED, opacity=op)
    # "…y no cerrarla": un círculo que se dibuja pero nunca se cierra
    p = ease_out(prog(t, wd(2, 5), wd(2, 5) + 0.9), 3)
    if p > 0:
        ctx.ring(W / 2, cy, 330, 26, INK, -60, -60 + 320 * p)
        if p > 0.95:
            a = math.radians(-60 + 320)
            ctx.circle(W / 2 + 330 * math.cos(a), cy + 330 * math.sin(a), 24 * (0.7 + 0.3 * math.sin(t * 12)), RED)
    fx.rise(ctx, "y no cerrarla.", SI, 120, W / 2, 1640, t - wd(2, 5) + 0.04, color=INK, exit_at=LS[3] - 0.05)


def esc_cerebro(ctx, lt):
    t = S["cerebro"][0] + lt
    fx.rise_words(ctx, L[4][:3], F, 120, W / 2, 470, t, color=BONE, wght=900, tracking=tight(120), space=1.5)
    fx.rise(ctx, "las historias sin final.", SI, 120, W / 2, 640, t - wd(4, 3) + 0.04, color=INK)
    p = 0.99 * ease_out(prog(t, LS[4] + 0.1, wd(4, 6) - 0.2), 2)
    loading_bar(ctx, 120, W - 120, 1050, p, BONE, "#B8301A", 46)
    stuck = t > wd(4, 6) - 0.2
    blink = (int(t * 5) % 2 == 0) if stuck else True
    ctx.text(f"{int(p * 100)}%", MONO, 150, W / 2, 1270, color=BONE if blink else INK)
    if stuck:
        ctx.text("CARGANDO FINAL…", MONO, 40, W / 2, 1420, color=INK, tracking=8, opacity=prog(t, wd(4, 6) - 0.2, wd(4, 6)))


def esc_truco2(ctx, lt):
    t = S["truco2"][0] + lt
    trick_title(ctx, 2, t, wd(5, 0), BONE)
    fx.rise_words(ctx, L[5][2:5], F, 110, W / 2, 520, t, color=BONE, wght=900, tracking=tight(110), space=1.5)
    fx.rise(ctx, "CADA", F, 70, W / 2, 650, t - wd(5, 5) + 0.04, color=MUTED, wght=900, tracking=6)
    for k, (txt, t0, x) in enumerate((("2", wd(5, 6), W / 2 - 170), ("3", wd(5, 8), W / 2 + 170))):
        q = t - t0 + 0.03
        if q >= 0:
            sc, op, bl = fx.slam(q, 0.18, 1.8)
            ctx.text(txt, F, 420, x, 960, color=RED, scale=sc, opacity=op, blur=bl, wght=900)
    if t >= wd(5, 7):
        ctx.text("O", F, 100, W / 2, 960, color=BONE, wght=900, opacity=prog(t, wd(5, 7), wd(5, 7) + 0.1))
    fx.rise(ctx, "SEGUNDOS", F, 96, W / 2, 1240, t - wd(5, 9) + 0.04, color=BONE, wght=900, tracking=10)
    # línea de tiempo: cada 2–3 s "pasa algo"
    x0, x1, y = 90, W - 90, 1560
    edges = [0, 2.5, 4.8, 7.6, 10.0, 12.7, 15.0]
    ph = ease_io(prog(t, LS[5] + 0.3, S["truco2"][1]))
    for k in range(len(edges) - 1):
        a, b = lerp(x0, x1, edges[k] / 15), lerp(x0, x1, edges[k + 1] / 15)
        hit = ph * 15 >= edges[k]
        ctx.rect(a + 5, y - 50, b - 5, y + 50, RED if hit else PANEL, radius=14)
    xp = lerp(x0, x1, ph)
    ctx.line(xp, y - 90, xp, y + 90, 8, BONE)


def esc_corte(ctx, lt):
    t = S["corte"][0] + lt
    q = t - wd(6, 1)
    size = 300
    ctx.text("UN", F, 90, W / 2, 620, color=MUTED, wght=900)
    if q < 0:
        ctx.text("CORTE.", F, size, W / 2, 960, color=BONE, wght=900, tracking=tight(size))
        return
    # la palabra se corta en diagonal y las mitades se separan
    before = ctx.img.copy()
    ctx.text("CORTE.", F, size, W / 2, 960, color=BONE, wght=900, tracking=tight(size))
    layer = ctx.img - before
    ctx.img = before
    d = 46 * ease_out(prog(q, 0, 0.25), 3)
    ang = math.radians(-30)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    side = np.clip(((xx - W / 2) * math.sin(ang) - (yy - 960) * math.cos(ang)) / 2 + 0.5, 0, 1)[..., None]
    nx, ny = math.sin(ang), -math.cos(ang)
    ctx.img = before + warp(layer * side, 1.0, nx * d, ny * d, border=0) + warp(layer * (1 - side), 1.0, -nx * d, -ny * d, border=0)
    Lh = 900 * ease_out(prog(q, -0.05, 0.12), 2)
    if q < 0.3:
        ctx.line(W / 2 - math.cos(ang) * Lh, 960 - math.sin(ang) * Lh, W / 2 + math.cos(ang) * Lh, 960 + math.sin(ang) * Lh, 10, RED)


def esc_zoom(ctx, lt):
    t = S["zoom"][0] + lt
    ctx.text("UN", F, 90, W / 2, 620, color=MUTED, wght=900)
    ctx.text("ZOOM.", F, 220, W / 2, 960, color=INK, wght=900, tracking=tight(220))
    zt = wd(6, 3)
    z = 1 + 0.42 * back(prog(t, zt, zt + 0.2), 1.4)
    if z > 1.001:
        moving = 1 - prog(t, zt + 0.05, zt + 0.22)
        ctx.img = zoom_blur(ctx.img, z, 0.12 * moving, n=5, cy=960) if moving > 0.05 else warp(ctx.img, z, cy=960)


def esc_sonido(ctx, lt):
    t = S["sonido"][0] + lt
    st = wd(6, 5)
    q = t - st
    for k in range(4):
        qq = q - k * 0.07
        if qq > 0:
            r = 120 + ease_out(prog(qq, 0, 0.6), 2) * 900
            ctx.circle(W / 2, 900, r, BONE, width=24 * (1 - prog(qq, 0, 0.6)) + 2, opacity=1 - prog(qq, 0.1, 0.6))
    speaker(ctx, W / 2 + 20, 900, 1.4, INK, waves=1 if q > 0 else prog(t, st - 0.5, st))
    ctx.text("UN", F, 90, W / 2, 420, color=BONE, wght=900)
    if q >= 0:
        sc, op, bl = fx.slam(q, 0.15, 2.0)
        ctx.text("¡SONIDO!", F, 210, W / 2, 1450, color=INK, scale=sc, opacity=op, blur=bl, wght=900, tracking=tight(210))


def esc_pulgar(ctx, lt):
    t = S["pulgar"][0] + lt
    fx.rise(ctx, "SI NADA CAMBIA…", F, 110, W / 2, 380, t - LS[7] + 0.04, color=INK, wght=900, tracking=tight(110))
    fx.rise(ctx, "tu pulgar se aburre.", SI, 130, W / 2, 540, t - wd(7, 3) + 0.04, color=RED)
    sw = ease_in(prog(t, wd(7, 6) - 0.05, wd(7, 6) + 0.3), 2)          # al final el pulgar desliza: adiós
    py = 1240 - 1500 * sw
    phone(ctx, W / 2, py, 0.62, rot=-2 - 10 * sw, frame=INK, screen=PANEL, progress=0.05 + 0.01 * (t - LS[7]), mini=False)
    thumb(ctx, 800 - 60 * sw, 1760 - 700 * sw, 0.9, -28 + 15 * sw)
    for k in range(3):                                                  # zzz del pulgar aburrido
        q = t - (LS[7] + 0.4 + k * 0.35)
        if 0 < q < 1.6 and sw < 0.1:
            ctx.text("z", SI, 70 + 20 * k, 900 + 40 * k + 20 * math.sin(q * 3), 1450 - q * 260, color=MUTED,
                     opacity=clamp(q * 4) * (1 - prog(q, 1.0, 1.6)))


def esc_truco3(ctx, lt):
    t = S["truco3"][0] + lt
    trick_title(ctx, 3, t, wd(8, 0), BONE)
    q = t - wd(8, 2)
    if q >= 0:
        txt = "SUBTÍTULOS"
        n = int(clamp(q / 0.38) * len(txt))
        size = 170
        tw = text_width(txt, F, size, 900, tight(size))
        x0 = W / 2 - tw / 2
        ctx.text(txt[:n], F, size, x0, 960, color=BONE, anchor="l", wght=900, tracking=tight(size))
        if n < len(txt) or int(t * 4) % 2 == 0:
            cx = x0 + text_width(txt[:n], F, size, 900, tight(size)) + 12
            ctx.rect(cx, 880, cx + 12, 1040, RED)
        # subrayado que barre como karaoke
        p = ease_io(prog(q, 0.4, 0.9))
        if p > 0:
            ctx.rect(x0, 1080, x0 + tw * p, 1098, RED)


def esc_silencio(ctx, lt):
    t = S["silencio"][0] + lt
    if t < LS[10]:
        fx.rise_words(ctx, L[9][:3], F, 96, W / 2, 330, t, color=INK, wght=900, tracking=tight(96), space=1.5)
        fx.rise(ctx, "los videos en silencio.", SI, 120, W / 2, 470, t - wd(9, 3) + 0.04, color=RED)
    else:
        fx.rise(ctx, "SIN TEXTO EN PANTALLA,", F, 84, W / 2, 330, t - LS[10] + 0.04, color=INK, wght=900, tracking=tight(84))
        fx.rise(ctx, "estás hablando solo.", SI, 120, W / 2, 470, t - wd(10, 6) + 0.04, color=RED)
    cx, cy, s = W / 2, 1150, 0.78
    phone(ctx, cx, cy, s, rot=0, frame=INK, screen=PANEL, progress=0.3, mini=False)
    # alguien habla en el video (burbuja con puntos que laten)
    ctx.circle(cx - 90, cy - 150, 70, RED)
    if t < wd(10, 7):
        ctx.rect(cx - 30, cy - 220, cx + 170, cy - 90, BONE, radius=40)
        for k in range(3):
            ctx.circle(cx + 20 + k * 50, cy - 155, 13 * (0.7 + 0.3 * math.sin(t * 9 - k)), INK)
    # icono de silencio
    m = t - wd(9, 6)
    if m >= 0:
        ps, po = fx.pop(m, 0.3, 2.8, 7)
        mx, my = cx + 120, cy + 230
        ctx.circle(mx, my, 70 * ps, RED, opacity=po)
        speaker(ctx, mx - 10, my, 0.32 * ps, BONE)
        ctx.line(mx - 40 * ps, my - 40 * ps, mx + 40 * ps, my + 40 * ps, 10, BONE, opacity=po)
    # la solución: subtítulos que aparecen en la pantalla del celular
    pages = caption_pages(L[10][6:], max_chars=14, max_words=2)
    for pg in pages:
        if pg["t0"] - 0.02 <= t < S["silencio"][1]:
            if pg is pages[-1] or t < pg["t1"]:
                fx.karaoke(ctx, pg, t, fname=F, wght=900, size=58, y=cy + 40, active=RED, max_w=360, shadow=4)


def esc_revela(ctx, lt):
    t = S["revela"][0] + lt
    slam_words(ctx, t, [("¿Y EL CUARTO", F, 120, 360, BONE, LS[11]), ("TRUCO?", F, 120, 490, BONE, wd(11, 3))])
    ya = wd(12, 0)
    cx, cy, size = W / 2, 1060, 440
    tension = prog(t, LS[11], ya)
    shake = math.sin(t * 70) * 14 * tension ** 2 if t < ya else 0
    ctx.rect(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2, BONE, radius=60)
    ctx.rect(cx - size / 2 + 16, cy - size / 2 + 16, cx + size / 2 - 16, cy + size / 2 - 16, INK, radius=46)
    q = t - ya
    if q < 0:
        padlock(ctx, cx + shake, cy - 30, 1.25, BONE, BONE)
    else:
        # el candado se parte en dos (como el logo de CORTE) y aparece la palomita
        d = 400 * ease_out(prog(q, 0, 0.5), 2)
        op = 1 - prog(q, 0.25, 0.5)
        if op > 0:
            before = ctx.img.copy()
            padlock(ctx, cx, cy - 30, 1.25, BONE, BONE)
            layer = ctx.img - before
            ctx.img = before
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            side = np.clip(((xx - cx) * 0.5 - (yy - cy) * 0.866) / 2 + 0.5, 0, 1)[..., None]
            ctx.img = before + op * (warp(layer * side, 1.0, d * 0.5, -d * 0.866, rot=-25 * prog(q, 0, 0.5), border=0)
                                     + warp(layer * (1 - side), 1.0, -d * 0.5, d * 0.866, rot=25 * prog(q, 0, 0.5), border=0))
        checkmark(ctx, cx, cy, 3.2, ease_out(prog(q, 0.12, 0.45), 3), RED, 14)
        sc, op2, bl = fx.slam(q + 0.03, 0.18, 1.8)
        ctx.text("YA LO VISTE.", F, 160, W / 2, 1600, color=RED, scale=sc, opacity=op2, blur=bl, wght=900, tracking=tight(160))


def esc_quedaste(ctx, lt):
    t = S["quedaste"][0] + lt
    fx.rise_words(ctx, L[13][:5], F, 76, W / 2, 330, t, color=BONE, wght=900, tracking=tight(76), space=1.5)
    fx.rise_words(ctx, L[13][5:7], F, 76, W / 2, 430, t, color=BONE, wght=900, tracking=tight(76), space=1.5)
    slam_words(ctx, t, [("TE QUEDASTE", F, 150, 760, INK, wd(13, 9))])
    fx.rise(ctx, "hasta el final.", SI, 140, W / 2, 940, t - wd(13, 10) + 0.04, color=BONE)
    # contador grande: cuánto llevas viendo
    a = prog(t, LS[13], LS[13] + 0.3)
    ctx.text("LLEVAS", MONO, 40, W / 2, 1210, color=INK, tracking=10, opacity=a)
    ctx.text(f"00:{int(t):02d}", MONO, 220, W / 2, 1380, color=BONE, opacity=a, tracking=6)
    ctx.circle(W / 2 - 330, 1380, 22, INK, opacity=a * (1.0 if int(t * 2) % 2 == 0 else 0.3))
    tag(ctx, "TRUCO 4 · PROMETER UN FINAL", W / 2 + 20, 1640, t - (wd(13, 11) + 0.2), INK, BONE)


def esc_marca(ctx, lt):
    t = S["marca"][0] + lt
    q = t - LS[14]
    if q >= -0.1:
        s = spring(q + 0.1, 2.2, 6)
        cut = ease_out(prog(t, wd(14, 3), wd(14, 3) + 0.3), 3)
        logo(ctx, W / 2, lerp(-200, 640, s), 170, 6 + 50 * cut, 1.0, top=INK, bottom=RED)
    slam_words(ctx, t, [("CORTE", F, 200, 1000, INK, wd(14, 3))])
    fx.rise_words(ctx, L[14][4:6], F, 92, W / 2, 1250, t, color=INK, wght=900, tracking=tight(92), space=1.5)
    fx.rise_words(ctx, L[14][6:10], F, 92, W / 2, 1370, t, color=RED, wght=900, tracking=tight(92), space=1.5)


def esc_comenta(ctx, lt):
    t = S["comenta"][0] + lt
    com, corte_w, primer, gratis = L[15][0], L[15][1], L[15][6], L[15][8]
    fx.rise(ctx, "COMENTA", F, 150, W / 2, 330, t - com["start"] + 0.04, color=BONE, wght=900, tracking=tight(150))
    bub = spring(t - com["start"] - 0.05, 2.6, 7)
    c_end = L[15][2]["start"]
    send = t - (c_end + 0.03)
    lift = ease_out(prog(send, 0, 0.3), 3) * 40 if send > 0 else 0
    if bub > 0.02:
        by = 640 - lift
        ctx.rect(110, by - 120 * bub, 970, by + 120 * bub, BONE, radius=60 * bub)
        ctx.circle(205, by, 52 * bub, INK)
        logo(ctx, 205, by, 30 * bub, 8 * bub)
        n = int(clamp((t - corte_w["start"]) / max(0.1, c_end - corte_w["start"] - 0.05)) * 5)
        txt = "CORTE"[:n]
        ctx.text(txt, F, 120, 290, by + 6, color=INK, anchor="l", wght=900, tracking=tight(120))
        if send < 0 and int(t * 4) % 2 == 0:
            cxp = 290 + text_width(txt, F, 120, 900, tight(120)) + 12
            ctx.rect(cxp, by - 50, cxp + 8, by + 50, RED)
        ctx.circle(890, by, 50 * bub, INK)
        ctx.poly([(870, by - 24), (870, by + 24), (912, by)], BONE)
        if send > 0.2:
            hs, ho = fx.pop(send - 0.2, 0.2, 3.0, 7)
            hx, hy = 900, by - 170
            ctx.circle(hx, hy, 58 * hs, BONE, opacity=ho)
            ctx.circle(hx - 16 * hs, hy - 6 * hs, 18 * hs, RED, opacity=ho)
            ctx.circle(hx + 16 * hs, hy - 6 * hs, 18 * hs, RED, opacity=ho)
            ctx.poly([(hx - 33 * hs, hy), (hx + 33 * hs, hy), (hx, hy + 34 * hs)], RED, opacity=ho)
    fx.rise_words(ctx, L[15][2:6], F, 92, W / 2, 960, t, color=BONE, wght=900, tracking=tight(92), space=1.5)
    fx.rise(ctx, "primer video", SI, 170, W / 2, 1130, t - primer["start"] + 0.04, color=BONE)
    q = t - gratis["start"] + 0.02
    if q >= 0:
        s = spring(q, 2.8, 8)
        cx, cy, ang = 540, 1450, -12 + (1 - s) * 50
        r = 200 * (0.4 + 0.6 * s)
        ctx.circle(cx, cy, r + 14, BONE, opacity=clamp(q * 8))
        ctx.circle(cx, cy, r, INK, opacity=clamp(q * 8))
        ctx.circle(cx, cy, r - 22, RED, width=5, opacity=clamp(q * 8))
        ctx.text("GRATIS", F, int(78 * r / 200), cx, cy, color=RED, rot=ang, wght=900, tracking=tight(78), opacity=clamp(q * 8))
    op = prog(t, gratis["start"] + 0.3, gratis["start"] + 0.6)
    if op > 0:
        logo(ctx, 400, 1770, 34, 9, op)
        ctx.text("CORTE", F, 70, 455, 1770, color=BONE, anchor="l", wght=900, tracking=tight(70), opacity=op)
        ctx.text("@corte.studio", MONO, 28, W / 2, 1840, color=BONE, tracking=4, opacity=op * 0.8)


def esc_bucle(ctx, lt):
    t = S["bucle"][0] + lt
    out = 1 - prog(t, END - 0.75, END - 0.3)                          # todo se apaga: empalma con el inicio
    fx.rise_words(ctx, L[16][:6], F, 80, W / 2, 620, t, color=BONE, wght=900, tracking=tight(80), space=1.4,
                  opacity=out)
    rw = prog(t, 43.15, 44.6)
    if 0 < rw < 1:                                                     # rebobinado: ◀◀ y líneas de cinta
        for k in range(2):
            x = W / 2 + 60 - k * 130
            ctx.poly([(x, 1000), (x + 120, 920), (x + 120, 1080)], BONE, opacity=0.6 + 0.4 * math.sin(t * 20))
        for k in range(5):
            yy = (k * 397 + t * 2600) % H
            ctx.rect(0, yy, W, yy + 6, BONE, opacity=0.18)
    fx.rise(ctx, "vas a encontrar", F, 84, W / 2, 1340, t - wd(16, 6) + 0.04, color=BONE, wght=900, tracking=tight(84),
            opacity=out)
    fx.rise(ctx, "los cuatro trucos.", SI, 140, W / 2, 1490, t - wd(16, 8) + 0.04, color=RED, opacity=out)
    q = t - wd(16, 10)
    if q >= 0:
        s, op = fx.pop(q, 0.3, 2.4, 6)
        ctx.text("4", F, int(420 * s), W / 2, 1010, color=RED, wght=900, opacity=op * out)


DRAW = {"gancho": esc_gancho, "candado": esc_candado, "truco1": esc_truco1, "cerebro": esc_cerebro, "truco2": esc_truco2,
        "corte": esc_corte, "zoom": esc_zoom, "sonido": esc_sonido, "pulgar": esc_pulgar, "truco3": esc_truco3,
        "silencio": esc_silencio, "revela": esc_revela, "quedaste": esc_quedaste, "marca": esc_marca,
        "comenta": esc_comenta, "bucle": esc_bucle}


# ====================================================================== armado
def build():
    v = Video("corte-4-trucos", END)
    v.voice("corte-4-trucos", 0.0)
    v.grain, v.vignette, v.bloom = 0.04, 0.25, 0.0
    v.poster = 1.9
    for name, a, b, bg, tr in SC:
        kw = {}
        if tr and tr != "cut":
            kw = dict(trans=tr, tdur=0.12 if tr == "glitch" else 0.22)
        v.scene(a, b, DRAW[name], bg=bg, **kw)
    v.layer(0.0, END, hud, z=10)
    v.layer(0.0, END, rec, z=11)

    # ------------------------------------------------ golpes visuales
    v.hit(wd(0, 3), punch=0.08, shake=0.3, decay=0.2)
    v.hit(wd(0, 4), punch=0.05, decay=0.15)
    v.hit(wd(1, 2) + 0.35, shake=0.5, decay=0.25)
    v.hit(wd(2, 4), punch=0.05, decay=0.2)
    v.hit(wd(4, 6) - 0.2, shake=0.3, decay=0.2)
    v.hit(wd(5, 6), punch=0.05, decay=0.15)
    v.hit(wd(5, 8), punch=0.05, decay=0.15)
    v.hit(wd(6, 1), shake=0.5, rgb=0.5, decay=0.2)
    v.hit(wd(6, 5), shake=1.0, rgb=0.6, flash=0.25, decay=0.3, flash_color=BONE)
    v.hit(wd(7, 6), punch=0.06, decay=0.2)
    v.hit(wd(12, 0), shake=1.0, rgb=0.7, flash=0.5, decay=0.35, flash_color=RED)
    v.hit(wd(13, 9), punch=0.07, decay=0.25)
    v.hit(wd(14, 3), shake=0.4, decay=0.2)
    v.hit(L[15][8]["start"], shake=0.4, decay=0.2)
    v.hit(wd(16, 10), punch=0.08, decay=0.25)

    # ------------------------------------------------ diseño sonoro sintetizado (sin música)
    sfx = v.sfx
    sfx(0.0, "boom_suave", -10, "start")
    sfx(0.0, "dron", -18, "start")
    sfx(wd(0, 3), "boom_suave", -8)
    for k in range(4):
        sfx(wd(0, 4) + 0.08 * k, "pop", -18, "start")
    sfx(S["candado"][0], "whoosh", -13, "peak")
    sfx(LS[1], "dron_largo", -16, "start")
    sfx(wd(1, 2) + 0.35, "candado", -5)
    for name, a, _, _, tr in SC[2:]:
        if tr in ("whip-u", "whip-l"):
            sfx(a, "whoosh" if tr == "whip-l" else "whoosh_abajo", -13, "peak")
    sfx(wd(2, 4), "pop", -12, "start")
    sfx(wd(2, 5), "whoosh_corto", -16, "peak")
    sfx(LS[3] + 0.3, "whoosh_corto", -16, "start")
    sfx(wd(3, 6), "candado", -15)
    sfx(wd(4, 6) - 0.2, "error", -9, "start")
    sfx(CHECK[0], "check", -7, "start")
    sfx(wd(5, 6), "pop", -11, "start")
    sfx(wd(5, 8), "pop", -11, "start")
    sfx(S["corte"][0], "glitch", -16, "start")
    sfx(wd(6, 1) - 0.06, "tijera", -5, "start")
    sfx(wd(6, 3) - 0.22, "zoom", -4, "start")
    sfx(wd(6, 5) - 0.8, "swell", -9, "start")
    sfx(wd(6, 5), "boom", -2)
    for k in range(3):
        sfx(LS[7] + 0.4 + k * 0.35, "pop", -21, "start")
    sfx(wd(7, 6) - 0.05, "whoosh", -8, "peak")
    sfx(CHECK[1], "check", -7, "start")
    q0 = wd(8, 2)
    for k in range(10):
        sfx(q0 + k * 0.038, "tecla", -12, "start")
    sfx(wd(9, 6), "pop", -11, "start")
    for wdd in L[10][6:]:
        sfx(wdd["start"], "pop", -18, "start")
    sfx(CHECK[2], "check", -7, "start")
    sfx(S["revela"][0] - 0.2, "latido", -5, "start")                    # pausa dramática + latido
    tt = LS[11] + 0.2
    while tt < wd(12, 0) - 0.05:                                        # tic-tac cada vez más rápido
        sfx(tt, "tick", -15, "start")
        tt += max(0.12, 0.3 - 0.1 * (tt - LS[11]))
    sfx(wd(12, 0) - 1.0, "riser_corto", -8, "start")
    sfx(wd(12, 0), "quiebre", -1)
    sfx(CHECK[3] + 0.15, "check", -8, "start")
    sfx(wd(13, 9), "boom_suave", -8)
    sfx(LS[14], "whoosh_abajo", -14, "peak")
    sfx(LS[14] + 0.35, "sello", -10)
    sfx(wd(14, 3) - 0.1, "tijera", -6, "start")
    cw = L[15][1]
    for k in range(5):
        sfx(cw["start"] + k * 0.07, "tecla", -9, "start")
    sfx(L[15][2]["start"] + 0.03, "pop", -8, "start")
    sfx(L[15][2]["start"] + 0.25, "pop", -10, "start")
    sfx(L[15][8]["start"], "sello", -3)
    sfx(S["bucle"][0], "glitch", -12, "start")
    sfx(43.15, "rebobinado", -8, "start")
    sfx(wd(16, 10), "boom_suave", -10)
    sfx(END - 1.45, "swell_largo", -10, "start")                        # empuja hacia el inicio (bucle)
    return v
