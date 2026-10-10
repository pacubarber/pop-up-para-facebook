"""KEYLINE HOMES — «If you see this in a house, don't sign anything» (marca ficticia). 9:16 · ~48.6 s · inglés.

Video de inmobiliaria con material de librerías (Mixkit + Coverr) y locución de ElevenLabs. Cinco "red flags" con
una bandera cada una arriba (la 5 con candado hasta que se revela), y un efecto principal por señal:
grieta que se dibuja en la esquina de un vano, lupa que revela la humedad bajo la pintura fresca, pantalla dividida
lavamanos + regadera con manómetro que cae, batería que carga y la que no (con parpadeo y glitch), y checklist de
papeles. Gancho con congelado + sello "DON'T SIGN", "5" detrás de la agente (recorte de persona), contrato que se
rompe en "isn't yours", banderas que se vuelven palomitas y cierre con guardar / compartir.
Música: "Greed" (Mixkit 404) con sus dos drops en "flags" y en "cost you".
"""
import math
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motor"))
import efectos as fx  # noqa: E402
from ilustraciones import checkmark, padlock  # noqa: E402
from motor import (FPS, H, W, Video, caption_pages, clamp, ease_in, ease_io, ease_out, fit_size, lerp, load_vo,  # noqa: E402
                   prog, reader, text_width, word_time)

VO = load_vo("inmo-red-flags")
END = round(VO["dur"] + 0.08, 2)
RED, WHITE, INK, GOLD, GREEN, SKY = "#FF3B1F", "#FFFFFF", "#0E1116", "#FFC94A", "#2BD67B", "#7FD3FF"
F, SI = "inter", "serif-i"
GRADE = ("eq=contrast=1.06:saturation=1.06:gamma=0.98,"
         "colorbalance=rs=-0.02:gs=0.0:bs=0.03:rm=0.02:bm=-0.02:rh=0.03:bh=-0.03")
MUSIC_START = 8.38      # drops de la pista 404 en 12.00 s y 38.10 s → "flags" (3.62) y "cost you" (29.72)


def w(text, n=1, after=0.0):
    return word_time(VO, text, n, after)["start"]


def tight(size):
    return -round(size * 0.03)


# ====================================================================== dibujos
def flag(ctx, x, y, s, fill, raised=1.0, op=1.0, outline=WHITE):
    """Bandera: asta + paño triangular que ondea un poco. raised sube el paño por el asta."""
    ctx.line(x, y + 46 * s, x, y - 44 * s, 6 * s, outline, opacity=op)
    top = y - 44 * s + (1 - raised) * 46 * s
    wave = 4 * s * math.sin(ctx.t * 9 + x)
    pts = [(x + 2 * s, top), (x + 50 * s, top + 15 * s + wave), (x + 2 * s, top + 32 * s)]
    if fill:
        ctx.poly(pts, fill, opacity=op)
    else:
        ctx.poly(pts, outline, opacity=op * 0.9, width=4 * s)


FLAG_X = [348 + 96 * k for k in range(5)]
FLAG_Y = 158


def badge(ctx, num, x, y, lt, color=RED):
    """Número de la señal en una pastilla roja que rebota."""
    if lt < 0:
        return
    s, op = fx.pop(lt, 0.4, 3.0, 8)
    ctx.rect(x - 78 * s, y - 52 * s, x + 78 * s, y + 52 * s, color, radius=26 * s, opacity=op)
    ctx.text(num, F, 64 * s, x, y, color=WHITE, wght=900, opacity=op, tracking=tight(64))


def section(ctx, t, num, t_num, title, t_title, t_out, y=1150, color=WHITE):
    """Número + título de la señal, con salida al terminar la sección."""
    out = ease_in(prog(t, t_out - 0.18, t_out), 2)
    if out >= 1:
        return
    ctx.band(y - 260, y + 140, "#000000", 0.42 * (1 - out))
    badge(ctx, num, W / 2, y - 130, t - t_num)
    size = fit_size(title, F, W * 0.86, 116, wght=900)
    fx.rise(ctx, title, F, size, W / 2, y, t - t_title + 0.04, color=color, wght=900, tracking=tight(size),
            shadow=12, opacity=1 - out)


def battery(ctx, cx, cy, s, level, charging, bad=0.0):
    """Ícono de batería: nivel, rayo de carga o X roja."""
    col = RED if bad > 0 else WHITE
    ctx.rect(cx - 110 * s, cy - 56 * s, cx + 100 * s, cy + 56 * s, col, radius=18 * s, opacity=0.95)
    ctx.rect(cx - 100 * s, cy - 46 * s, cx + 90 * s, cy + 46 * s, INK, radius=12 * s, opacity=0.92)
    ctx.rect(cx + 104 * s, cy - 22 * s, cx + 120 * s, cy + 22 * s, col, radius=6 * s)
    if level > 0.01:
        ctx.rect(cx - 90 * s, cy - 36 * s, cx - 90 * s + 170 * s * level, cy + 36 * s, GREEN if bad == 0 else RED,
                 radius=8 * s)
    if charging > 0:
        bolt = [(cx + 6 * s, cy - 62 * s), (cx - 34 * s, cy + 8 * s), (cx - 4 * s, cy + 8 * s), (cx - 14 * s, cy + 62 * s),
                (cx + 34 * s, cy - 10 * s), (cx + 4 * s, cy - 10 * s)]
        ctx.poly(bolt, GOLD, opacity=charging)
    if bad > 0:
        a = 46 * s * bad
        ctx.line(cx - a, cy - a, cx + a, cy + a, 14 * s, WHITE)
        ctx.line(cx - a, cy + a, cx + a, cy - a, 14 * s, WHITE)


def gauge(ctx, cx, cy, r, value, op=1.0):
    """Manómetro: arco de 240° con zona roja y aguja (value 0–1)."""
    a0, a1 = 150, 390
    ctx.circle(cx, cy, r + 26, INK, opacity=0.78 * op)
    ctx.ring(cx, cy, r, 16, WHITE, a0, a1, opacity=0.35 * op)
    ctx.ring(cx, cy, r, 16, RED, a0, a0 + 60, opacity=0.95 * op)
    ctx.ring(cx, cy, r, 16, GREEN, a0 + 150, a1, opacity=0.95 * op)
    for k in range(9):
        ang = math.radians(a0 + (a1 - a0) * k / 8)
        ctx.line(cx + math.cos(ang) * (r - 34), cy + math.sin(ang) * (r - 34), cx + math.cos(ang) * (r - 18),
                 cy + math.sin(ang) * (r - 18), 5, WHITE, opacity=0.8 * op)
    ang = math.radians(a0 + (a1 - a0) * value)
    ctx.line(cx, cy, cx + math.cos(ang) * (r - 30), cy + math.sin(ang) * (r - 30), 10, RED if value < 0.3 else WHITE,
             opacity=op)
    ctx.circle(cx, cy, 18, WHITE, opacity=op)


def warning(ctx, cx, cy, s, op=1.0):
    ctx.poly([(cx, cy - 120 * s), (cx + 138 * s, cy + 112 * s), (cx - 138 * s, cy + 112 * s)], GOLD, opacity=op)
    ctx.poly([(cx, cy - 74 * s), (cx + 98 * s, cy + 88 * s), (cx - 98 * s, cy + 88 * s)], INK, opacity=op)
    ctx.rect(cx - 11 * s, cy - 30 * s, cx + 11 * s, cy + 36 * s, GOLD, radius=6 * s, opacity=op)
    ctx.circle(cx, cy + 62 * s, 12 * s, GOLD, opacity=op)


def magnifier(ctx, cx, cy, r, op=1.0, color=WHITE):
    ctx.ring(cx, cy, r, 12, color, opacity=op)
    ang = math.radians(45)
    ctx.line(cx + math.cos(ang) * (r + 4), cy + math.sin(ang) * (r + 4), cx + math.cos(ang) * (r + 110),
             cy + math.sin(ang) * (r + 110), 26, color, opacity=op)


def bookmark(ctx, cx, cy, s, fill_p, op=1.0):
    pts = [(cx - 60 * s, cy - 84 * s), (cx + 60 * s, cy - 84 * s), (cx + 60 * s, cy + 84 * s), (cx, cy + 40 * s),
           (cx - 60 * s, cy + 84 * s)]
    if fill_p > 0:
        ctx.poly(pts, RED, opacity=op * fill_p)
    ctx.poly(pts, WHITE, opacity=op, width=9 * s)


def share(ctx, cx, cy, s, op=1.0):
    """Flecha de compartir (avión de papel)."""
    ctx.poly([(cx - 90 * s, cy - 10 * s), (cx + 96 * s, cy - 80 * s), (cx + 30 * s, cy + 92 * s), (cx + 4 * s, cy + 20 * s)],
             WHITE, opacity=op)
    ctx.poly([(cx + 4 * s, cy + 20 * s), (cx + 96 * s, cy - 80 * s), (cx + 14 * s, cy + 48 * s)], "#C9D2DC", opacity=op)


def logo(ctx, cx, cy, s, op=1.0):
    """KEYLINE HOMES: casa con ojo de cerradura + nombre."""
    roof = [(cx - 70 * s, cy - 6 * s), (cx, cy - 70 * s), (cx + 70 * s, cy - 6 * s)]
    ctx.poly(roof + [(cx + 52 * s, cy - 6 * s), (cx + 52 * s, cy + 64 * s), (cx - 52 * s, cy + 64 * s),
                     (cx - 52 * s, cy - 6 * s)], WHITE, opacity=op)
    ctx.circle(cx, cy + 14 * s, 14 * s, RED, opacity=op)
    ctx.poly([(cx - 9 * s, cy + 18 * s), (cx + 9 * s, cy + 18 * s), (cx + 14 * s, cy + 50 * s), (cx - 14 * s, cy + 50 * s)],
             RED, opacity=op)
    ctx.text("KEYLINE", F, 92 * s, cx, cy + 150 * s, color=WHITE, wght=900, tracking=tight(92 * s), opacity=op, shadow=10)
    ctx.text("HOMES", F, 44 * s, cx, cy + 228 * s, color=WHITE, wght=700, tracking=round(18 * s), opacity=op * 0.9)


def track_point(clip, frame_ref, x, y, half=70):
    """Sigue un punto del clip (template matching) en todos sus fotogramas → lista de (x, y)."""
    r = reader(clip.path)
    n = int(round(clip.dur * FPS))
    ref = r.frame(frame_ref).copy()
    tpl = ref[y - half:y + half, x - half:x + half]
    out = []
    for i in range(n):
        res = cv2.matchTemplate(r.frame(i), tpl, cv2.TM_CCOEFF_NORMED)
        _, _, _, loc = cv2.minMaxLoc(res)
        out.append((loc[0] + half, loc[1] + half))
    return out


def crack_path(x0, y0, ang, length, seed, step=18):
    rng = np.random.default_rng(seed)
    pts, a, x, y = [(x0, y0)], ang, x0, y0
    for _ in range(int(length / step)):
        a += rng.normal(0, 0.32)
        a = ang + clamp(a - ang, -0.45, 0.45)
        x, y = x + math.cos(a) * step, y + math.sin(a) * step
        pts.append((x, y))
    return pts


def draw_crack(ctx, pts, p, width=7.0, color="#2B2521", op=0.92):
    """Dibuja una grieta progresivamente (p 0–1), más gruesa al inicio."""
    n = len(pts) - 1
    k = p * n
    for i in range(int(math.ceil(k))):
        f = min(1.0, k - i)
        x0, y0 = pts[i]
        x1, y1 = pts[i + 1]
        wd = max(1.6, width * (1 - i / n) + 1.2)
        ctx.line(x0 + 1.5, y0 + 1.5, lerp(x0, x1, f) + 1.5, lerp(y0, y1, f) + 1.5, wd * 0.8, "#FFFFFF", opacity=op * 0.25)
        ctx.line(x0, y0, lerp(x0, x1, f), lerp(y0, y1, f), wd, color, opacity=op)


# ====================================================================== edición
def build():
    v = Video("inmo-red-flags", END, grade=GRADE)
    v.voice("inmo-red-flags", 0.0)
    v.music(404, start=MUSIC_START, gain=-15, fade_out=1.4)
    v.grain, v.vignette, v.bloom = 0.03, 0.22, 0.12
    v.poster = 3.7

    def mk(i, desde, dur, **kw):
        return v.clip(f"mixkit:{i}", desde, dur, **kw)

    def cv(slug, desde, dur, **kw):
        return v.clip(f"coverr:{slug}", desde, dur, **kw)

    T_FOUR = 24.35
    pen = mk(17050, 1.82, 1.0, x=0.42)
    agent = mk(13106, 4.4, 1.6, x=0.47, matte=True)
    crack_room = mk(22513, 12.0, 3.2, x=0.5, y=0.357, cz=1.4)
    paint = cv("coverr-woman-painting-white-walls-8969", 1.5, 5.0, x=0.62)
    decay = mk(5301, 6.0, 3.0, x=0.55)
    sink = mk(3891, 1.0, 2.0, x=0.5)
    shower_full = mk(20718, 30.0, 2.2, x=0.62)
    tear = mk(17694, 2.4, 3.2, x=0.5)
    shots = [
        (0.00, 1.20, mk(22513, 7.2, 1.4, x=0.55), dict(zoom=(1.0, 1.12))),
        (1.20, 2.98, pen, dict(zoom=(1.0, 1.1), timemap=lambda lt: min(lt, 0.78), trans="whip-u", tdur=0.16)),
        (2.98, 4.12, agent, dict(zoom=(1.0, 1.05), trans="zoom", tdur=0.2)),
        (4.12, 6.30, mk(6021, 6.6, 2.4, x=0.42), dict(zoom=(1.12, 1.0), trans="whip-l", tdur=0.16)),
        (6.30, 8.60, mk(36087, 6.0, 2.5, x=0.5), dict(zoom=(1.0, 1.1), trans="slices", tdur=0.24, tparams={"n": 6})),
        (8.60, 11.55, crack_room, dict(zoom=(1.0, 1.0), trans="whip-u", tdur=0.16)),
        (11.55, 13.95, mk(34051, 0.15, 2.6, x=0.5), dict(zoom=(1.0, 1.15), trans="zoom", tdur=0.2)),
        (13.95, 18.62, paint, dict(zoom=(1.0, 1.1), trans="whip-l", tdur=0.16)),
        (18.62, 19.55, mk(47071, 4.4, 1.2, x=0.5), dict(zoom=(1.1, 1.0), trans="whip-u", tdur=0.16)),
        (19.55, 21.30, sink, dict(zoom=(1.0, 1.06), trans="push-up", tdur=0.2)),
        (21.30, 22.90, mk(20718, 51.9, 1.8, x=0.62), dict(zoom=(1.0, 1.08), trans="whip-l", tdur=0.16)),
        (22.90, T_FOUR, mk(49024, 2.0, 1.6, x=0.6), dict(zoom=(1.0, 1.1), trans="zoom", tdur=0.18)),
        (T_FOUR, 27.40, cv("coverr-close-up-of-a-dual-power-outlet", 9.0, 3.2, x=0.5), dict(zoom=(1.08, 1.0), trans="whip-u", tdur=0.16)),
        (27.40, 30.34, mk(48027, 3.0, 3.1, x=0.5), dict(zoom=(1.0, 1.12), trans="glitch", tdur=0.14)),
        (30.34, 33.95, mk(45923, 1.0, 3.8, x=0.45), dict(zoom=(1.0, 1.1), trans="whip-u", tdur=0.16)),
        (33.95, 37.75, mk(46977, 7.0, 4.0, x=0.5), dict(zoom=(1.12, 1.0), trans="slices", tdur=0.24, tparams={"n": 5, "vertical": False})),
        (37.75, 39.10, mk(30357, 1.5, 1.6, x=0.62), dict(zoom=(1.0, 1.1), trans="lightdip", tdur=0.22, tparams={"color": "#fff6e8"})),
        (39.10, 41.15, tear, dict(zoom=(1.0, 1.06), speed=1.2, trans="whip-l", tdur=0.14)),
        (41.15, 43.80, mk(36159, 1.0, 2.8, x=0.6), dict(zoom=(1.0, 1.08), trans="iris", tdur=0.3)),
        (43.80, 46.00, mk(36136, 2.0, 2.4, x=0.5), dict(zoom=(1.08, 1.0), trans="whip-u", tdur=0.16)),
        (46.00, END, mk(4805, 3.0, 3.0, x=0.5), dict(zoom=(1.0, 1.08), trans="zoom", tdur=0.18)),
    ]
    for t0, t1, clip, kw in shots:
        v.shot(t0, t1, clip, **kw)

    # ------------------------------------------------------------------ efectos sobre la imagen (antes del texto)
    t_dont, t_moist, t_under, t_shower = w("don't"), w("moisture"), w("underneath"), w("shower")
    t_yours, t_isnt = w("yours"), w("isn't")
    lens_path = lambda t: (560 + 70 * math.sin((t - t_under) * 1.6), 760 + 40 * math.cos((t - t_under) * 1.2))  # noqa: E731

    def pre(ctx):
        t = ctx.t
        img = ctx.img
        # gancho: congelado en "don't" → desaturado con tinte rojo
        if t_dont - 0.02 <= t < 2.98:
            p = ease_out(prog(t, t_dont - 0.02, t_dont + 0.2), 2)
            luma = img @ np.array([0.114, 0.587, 0.299], np.float32)
            red = luma[..., None] * np.array([0.32, 0.36, 1.0], np.float32)
            ctx.img = img * (1 - p) + red * p
        # lupa: debajo de la pintura fresca hay humedad
        if t_under - 0.05 <= t < 18.62:
            under = ctx.clip_frame(decay, clamp(t - t_under, 0, 2.9))
            under = under * np.array([1.0, 0.92, 0.72], np.float32) * 0.9   # frío y húmedo
            if t >= t_moist:
                r = lerp(260, 1400, ease_in(prog(t, t_moist, t_moist + 0.22), 2))
            else:
                r = 260 * ease_out(prog(t, t_under - 0.05, t_under + 0.3), 3)
            cx, cy = lens_path(t)
            yy, xx = np.ogrid[0:H, 0:W]
            m = np.clip(r - np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) + 1, 0, 1).astype(np.float32)[..., None]
            ctx.img = ctx.img * (1 - m) + under * m
        # pantalla dividida: lavamanos arriba, regadera abajo
        if t_shower - 0.12 <= t < 21.30:
            p = ease_out(prog(t, t_shower - 0.12, t_shower + 0.22), 4)
            top = ctx.img[480:1440].copy()
            bot = ctx.clip_frame(shower_full, clamp(t - t_shower + 0.12, 0, 2.1))[480:1440]
            out = ctx.img.copy()
            out[:960] = lerp(ctx.img[:960], top, p)
            y_in = int(lerp(1920, 960, p))
            out[y_in:] = bot[: 1920 - y_in]
            ctx.img = out
            ctx.rect(0, y_in - 5, W, y_in + 5, WHITE)
        # contrato roto: la imagen se apaga y se enfría
        if t_isnt - 0.05 <= t < 41.15:
            p = ease_out(prog(t, t_isnt - 0.05, t_isnt + 0.3), 2)
            luma = (ctx.img @ np.array([0.114, 0.587, 0.299], np.float32))[..., None]
            ctx.img = ctx.img * (1 - p) + luma * 0.55 * p

    v.pre_layers.append(pre)

    # ------------------------------------------------------------------ 0. gancho
    L = [l["words"] for l in VO["lines"]]

    def hook(ctx, lt, t):
        if t < 1.20:
            ctx.band(640, 1140, "#000000", 0.45)
            fx.rise_words(ctx, L[0][:4], F, 116, W / 2, 820, t, color=WHITE, wght=900, tracking=tight(128), space=1.3,
                          shadow=12)
            fx.rise(ctx, "in a house…", SI, 130, W / 2, 990, t - L[0][4]["start"] + 0.04, color=WHITE, shadow=12)
            return
        q = t - t_dont
        if q >= 0:
            s, op, bl = fx.slam(q, 0.2, 2.2)
            ctx.rect(W / 2 - 420 * s, 860 - 140 * s, W / 2 + 420 * s, 860 + 140 * s, RED, radius=26 * s, opacity=op * 0.9)
            ctx.text("DON'T SIGN", F, 150, W / 2, 860, color=WHITE, wght=900, scale=s, opacity=op, blur=bl,
                     tracking=tight(150))
        fx.slam_text(ctx, "ANYTHING.", F, 96, W / 2, 1080, t - L[0][-1]["start"], color=WHITE, wght=900,
                     tracking=tight(96), shadow=12)

    v.layer(0.0, 2.98, hook)
    v.hit(t_dont, punch=0.08, shake=0.35, rgb=0.4, decay=0.25)
    v.hit(L[0][-1]["start"], punch=0.04, decay=0.2)

    # ------------------------------------------------------------------ 1. "Five red flags." — el 5 detrás de la agente
    t_five, t_flags = w("five"), w("flags")

    def five_back(ctx, lt, t):
        q = t - t_five
        if q < 0:
            return
        p = ease_out(prog(q, 0, 0.35), 3)
        ctx.text("5", F, 1080, W / 2 + 10, 760, color=RED, wght=900, scale=lerp(1.3, 1.0, p), opacity=prog(q, 0, 0.08),
                 blur=(1 - p) * 16)

    def five_front(ctx, lt, t):
        ctx.gradient_v(1000, 1500, "#000000", 0.0, 0.55)
        fx.slam_text(ctx, "RED FLAGS", F, 170, W / 2, 1300, t - t_flags + 0.02, color=WHITE, wght=900,
                     tracking=tight(170), shadow=16)

    v.layer(2.98, 4.12, five_back, behind=True)
    v.layer(2.98, 4.12, five_front)
    v.hit(t_flags + 0.06, punch=0.07, shake=0.25, flash=0.25, decay=0.3)

    # ------------------------------------------------------------------ HUD: cinco banderas arriba
    t_last = w("last")
    raise_at = [L[3][0]["start"], L[5][0]["start"], L[7][0]["start"], T_FOUR, w("five", 2)]
    t_checks = w("check")

    def hud(ctx, lt, t):
        if t >= 43.8:
            return
        ctx.gradient_v(0, 300, "#000000", 0.45, 0.0)
        for k, x in enumerate(FLAG_X):
            q = t - (t_five + 0.07 * k)
            if q < 0:
                continue
            s, op = fx.pop(q, 0.3, 3.2, 9)
            up = t >= raise_at[k]
            ru = ease_out(prog(t, raise_at[k], raise_at[k] + 0.35), 3) if up else 0.0
            done = t >= t_checks + 0.1 * k
            if done:
                p = prog(t, t_checks + 0.1 * k, t_checks + 0.1 * k + 0.35)
                ctx.circle(x + 18, FLAG_Y, 40 * ease_out(p, 3) + 0.1, GREEN)
                checkmark(ctx, x + 18, FLAG_Y + 2, 0.8, prog(t, t_checks + 0.1 * k + 0.1, t_checks + 0.1 * k + 0.4), WHITE, 11)
                continue
            if k == 4 and not up:
                # la quinta: candado hasta que se revela
                pulse = 1 + 0.12 * math.exp(-max(0, t - t_last) * 4) * (t >= t_last)
                padlock(ctx, x + 18, FLAG_Y - 10, 0.28 * s * pulse, body=WHITE, shackle=WHITE, op=op)
                continue
            flag(ctx, x, FLAG_Y, 1.1 * s, RED if up else None, raised=ru if up else 1.0, op=op)

    v.layer(t_five, 43.8, hud, z=5)

    # ------------------------------------------------------------------ 2. "And the last one costs the most money..."
    t_costs, t_money, t_almost, t_nobody, t_checks_it = w("costs"), w("money"), w("almost"), w("nobody"), w("checks")

    def last(ctx, lt, t):
        if t < 6.30:
            ctx.band(240, 760, "#000000", 0.45)
            fx.rise(ctx, "THE LAST ONE", F, 104, W / 2, 400, t - t_last + 0.04, color=WHITE, wght=900, tracking=tight(104), shadow=12)
            fx.rise(ctx, "costs the most", SI, 104, W / 2, 540, t - t_costs + 0.04, color=WHITE, shadow=12)
            for k, x in enumerate((360, 540, 720)):
                q = t - t_money - 0.08 * k
                if q >= 0:
                    s, op = fx.pop(q, 0.2, 2.6, 7)
                    ctx.text("$", F, 210, x, 720 + 10 * math.sin(t * 6 + k), color=GOLD, wght=900, scale=s, opacity=op,
                             shadow=14, rot=(k - 1) * 10)
            return
        ctx.band(240, 700, "#000000", 0.45)
        fx.rise(ctx, "ALMOST NOBODY", F, 108, W / 2, 400, t - t_almost + 0.04, color=WHITE, wght=900, tracking=tight(108), shadow=12)
        fx.slam_text(ctx, "CHECKS IT.", F, 150, W / 2, 610, t - t_checks_it, color=RED, wght=900, tracking=tight(150), shadow=14)
        q = t - t_nobody
        if q >= 0:
            mx = lerp(-160, W + 160, ease_io(prog(q, 0, 1.6)))
            magnifier(ctx, mx, 1000, 120, op=0.95)

    v.layer(4.12, 8.60, last)
    for tt in (t_money, t_checks_it):
        v.hit(tt, punch=0.05, decay=0.2)

    # ------------------------------------------------------------------ 3. Señal 1: grieta en la esquina de un vano
    # la cámara se desplaza: la grieta se dibuja relativa a la esquina del vano, seguida fotograma a fotograma
    CORNER = (0, 0)
    track = {}
    main = crack_path(*CORNER, math.radians(-48), 560, 11)
    br1 = crack_path(*main[12], math.radians(-12), 190, 5)
    br2 = crack_path(*main[22], math.radians(-80), 150, 7)
    low = crack_path(*main[18], math.radians(-4), 130, 3)
    t_cracks, t_corners = w("cracks"), w("corners")

    def one(ctx, lt, t):
        if "pts" not in track:
            track["pts"] = track_point(crack_room, 30, 590, 488)
        pts = track["pts"]
        cx, cy = pts[min(len(pts) - 1, max(0, int(round(lt * FPS))))]
        mv = lambda ps: [(cx + x, cy + y) for x, y in ps]  # noqa: E731
        p = ease_io(prog(t, t_cracks - 0.1, t_cracks + 1.0))
        draw_crack(ctx, mv(main), p, 8)
        draw_crack(ctx, mv(br1), clamp((p - 0.35) / 0.5), 5)
        draw_crack(ctx, mv(br2), clamp((p - 0.55) / 0.45), 4)
        draw_crack(ctx, mv(low), clamp((p - 0.6) / 0.4), 4)
        q = t - t_corners
        if q >= 0:
            pr = ease_out(prog(q, 0, 0.45), 2)
            ctx.ring(cx + 40, cy - 40, 150, 10, RED, -90, -90 + 360 * pr)
        section(ctx, t, "01", L[3][0]["start"], "DIAGONAL CRACKS", w("diagonal"), 11.55)

    v.layer(8.60, 11.55, one)
    v.hit(t_cracks, punch=0.04, shake=0.15, decay=0.2)

    # ------------------------------------------------------------------ 4. "That's not the paint... it could be the structure."
    t_not, t_paint, t_struct = w("not"), w("paint"), w("structure")

    def structure(ctx, lt, t):
        ctx.band(560, 1300, "#000000", 0.35)
        fx.rise(ctx, "NOT THE PAINT", F, 120, W / 2, 760, t - t_not + 0.04, color=WHITE, wght=900, tracking=tight(120), shadow=12)
        q = t - t_paint - 0.25
        if q > 0:
            tw = text_width("NOT THE PAINT", F, 120, 900, tracking=tight(120))
            x0 = W / 2 - tw / 2 - 16
            ctx.line(x0, 776, lerp(x0, x0 + tw + 32, ease_out(prog(q, 0, 0.25), 3)), 746, 14, RED)
        fx.slam_text(ctx, "THE STRUCTURE", F, fit_size("THE STRUCTURE", F, W * 0.9, 150, wght=900), W / 2, 960,
                     t - t_struct, color=RED, wght=900, tracking=tight(140), shadow=14)

    v.layer(11.55, 13.95, structure)
    v.hit(t_struct, punch=0.08, shake=0.45, rgb=0.5, decay=0.3)

    # ------------------------------------------------------------------ 5. Señal 2: pintura fresca → lupa → humedad
    t_fresh = w("fresh")

    def two(ctx, lt, t):
        section(ctx, t, "02", L[5][0]["start"], "FRESH PAINT", t_fresh, t_under - 0.1)
        if t >= t_under - 0.05:
            cx, cy = lens_path(t)
            r = 260 * ease_out(prog(t, t_under - 0.05, t_under + 0.3), 3)
            if t < t_moist:
                magnifier(ctx, cx, cy, r + 6, op=prog(t, t_under - 0.05, t_under + 0.1))
            ctx.band(1050, 1450, "#000000", 0.4)
            fx.rise(ctx, "WHAT'S UNDERNEATH?", F, 88, W / 2, 1230, t - t_under + 0.04, color=WHITE, wght=900,
                    tracking=tight(88), shadow=12, exit_at=t_moist - t_under - 0.05)
            # gotas de agua dentro de la lupa
            for k in range(6):
                ph = (t * 0.9 + k * 0.37) % 1
                dx = (k - 2.5) * 70
                ctx.circle(cx + dx, cy - r * 0.7 + ph * r * 1.4, 9 * (1 - ph * 0.4), SKY, opacity=0.7 * (1 - ph) * prog(t, t_under, t_under + 0.4))
        q = t - t_moist
        if q >= 0:
            fx.slam_text(ctx, "MOISTURE.", F, 190, W / 2, 900, q, color=SKY, wght=900, tracking=tight(190), shadow=16)

    v.layer(13.95, 18.62, two)
    v.hit(t_moist, punch=0.07, flash=0.2, decay=0.25, flash_color="#cfefff")

    # ------------------------------------------------------------------ 6. Señal 3: lavamanos + regadera → presión
    t_sink, t_same, t_drops, t_problem, t_pipes = w("sink"), w("same"), w("drops"), w("problem"), w("pipes")

    def three(ctx, lt, t):
        if t < 19.55:
            badge(ctx, "03", W / 2, 1020, t - L[7][0]["start"])
            return
        if t < 21.30:
            # rótulos de la pantalla dividida
            for txt, y, t0 in (("SINK", 420, t_sink), ("SHOWER", 1380, t_shower)):
                q = t - t0
                if q >= 0:
                    s, op = fx.pop(q, 0.4, 3, 8)
                    tw = text_width(txt, F, 70, 900)
                    ctx.rect(W / 2 - tw / 2 - 34, y - 52, W / 2 + tw / 2 + 34, y + 52, INK, radius=26, opacity=0.8 * op)
                    ctx.text(txt, F, 70, W / 2, y, color=WHITE, wght=900, scale=s, opacity=op)
            q = t - t_same
            if q >= 0:
                s, op = fx.pop(q, 0.35, 3, 8)
                tw = text_width("AT THE SAME TIME", F, 66, 900)
                ctx.rect(W / 2 - tw / 2 - 40, 960 - 54, W / 2 + tw / 2 + 40, 960 + 54, RED, radius=54, opacity=op)
                ctx.text("AT THE SAME TIME", F, 66, W / 2, 960, color=WHITE, wght=900, scale=s, opacity=op)
            return
        if t < 22.90:
            # manómetro: la aguja cae con la presión
            val = lerp(0.82, 0.1, ease_in(prog(t, t_drops - 0.1, t_drops + 0.5), 2))
            val += 0.02 * math.sin(t * 40) * (1 - prog(t, t_drops, t_drops + 0.6))
            op = prog(t, 21.30, 21.5)
            gauge(ctx, 320, 980, 170, val, op)
            fx.rise(ctx, "PRESSURE", F, 74, 320, 1235, t - w("pressure") + 0.04, color=WHITE, wght=900, shadow=10)
            return
        q = t - t_problem
        if q >= 0:
            s, op = fx.pop(q, 0.3, 3, 8)
            warning(ctx, W / 2, 700, 1.1 * s, op)
        fx.slam_text(ctx, "THE PIPES", F, 150, W / 2, 1020, t - t_pipes, color=GOLD, wght=900, tracking=tight(150), shadow=14)

    v.layer(18.62, T_FOUR, three)
    v.hit(t_drops, punch=0.05, shake=0.2, decay=0.25)
    v.hit(t_problem, punch=0.05, decay=0.2)

    # ------------------------------------------------------------------ 7. Señal 4: el cargador y los enchufes
    t_charger, t_test = w("charger"), w("test")
    t_doesnt, t_wiring, t_cost = w("doesn't"), w("wiring"), w("cost")

    def four(ctx, lt, t):
        if t < 27.40:
            section(ctx, t, "04", T_FOUR + 0.05, "TEST THE OUTLETS", t_test, 27.40)
            q = t - t_charger
            if q >= 0:
                s, op = fx.pop(q, 0.3, 3, 8)
                lvl = 0.25 + 0.6 * ((t - t_charger) % 1.2) / 1.2
                battery(ctx, W / 2, 560, 1.15 * s, lvl, 0.5 + 0.5 * math.sin(t * 8))
            return
        q = t - t_doesnt
        if q >= 0:
            s, op = fx.pop(q, 0.3, 3, 8)
            jitter = 10 * math.sin(t * 60) * math.exp(-q * 5)
            battery(ctx, W / 2 + jitter, 560, 1.15 * s, 0.0, 0.0, bad=ease_out(prog(q, 0.05, 0.3)))
        q = t - t_wiring
        if q >= 0 and t < t_cost:
            off = int(12 * math.exp(-q * 3) * (1 if int(t * 30) % 2 else -1))
            ctx.band(860, 1260, "#000000", 0.45)
            ctx.text("THE WIRING", F, 150, W / 2 + off, 1060, color=RED, wght=900, tracking=tight(150), opacity=0.7, blend="add")
            ctx.text("THE WIRING", F, 150, W / 2 - off, 1060, color=SKY, wght=900, tracking=tight(150), opacity=0.5, blend="add")
            ctx.text("THE WIRING", F, 150, W / 2, 1060, color=WHITE, wght=900, tracking=tight(150), shadow=10)
        q = t - t_cost
        if q >= 0:
            s, op = fx.pop(q, 0.25, 2.6, 7)
            ctx.darken(0.35 * prog(q, 0, 0.1))
            ctx.text("$$$", F, 330, W / 2, 940, color=GOLD, wght=900, scale=s, opacity=op, shadow=20, tracking=-10)
            ctx.text("COST YOU", F, 110, W / 2, 1180, color=WHITE, wght=900, opacity=op, shadow=12, tracking=tight(110))

    # parpadeo de la luz: la imagen se apaga a ratos cuando "no carga"
    def flicker(ctx):
        t = ctx.t
        if t_doesnt <= t < t_cost:
            k = int(t * 30)
            if (k * 7919) % 11 in (0, 3, 7):
                ctx.img = ctx.img * 0.35

    v.post.append(flicker)
    v.layer(T_FOUR, 30.34, four)
    v.hit(t_doesnt, rgb=0.5, shake=0.2, decay=0.2)
    v.hit(t_wiring, rgb=0.6, decay=0.25)
    v.hit(t_cost, punch=0.1, shake=0.5, flash=0.3, decay=0.35, flash_color="#fff0c0")

    # ------------------------------------------------------------------ 8. Señal 5: los papeles (el candado se rompe)
    t_five2, t_paperwork = w("five", 2), w("paperwork")

    def five(ctx, lt, t):
        q = t - t_five2
        if -0.6 <= q < 0.9:
            op = prog(q, -0.6, -0.4) * (1 - prog(q, 0.55, 0.9))
            sh = 8 * math.sin(t * 50) * prog(q, -0.6, 0) * (q < 0)
            ctx.circle(W / 2, 760, 230, INK, opacity=0.55 * op, feather=40)
            padlock(ctx, W / 2 + sh, 720, 1.25 * (1 + 0.1 * prog(q, 0, 0.2)), body=WHITE, shackle=WHITE,
                    open_p=ease_out(prog(q, 0, 0.25), 3), op=op)
        if q >= 0.3:
            section(ctx, t, "05", t_five2 + 0.3, "THE PAPERWORK", t_paperwork, 33.95)

    v.layer(30.34, 33.95, five)
    v.hit(t_five2, punch=0.07, shake=0.3, flash=0.2, decay=0.3)

    # ------------------------------------------------------------------ 9. Checklist de papeles
    items = [("IN THE SELLER'S NAME", w("seller's")), ("NO LIENS", w("liens")), ("NO UNPAID DEBTS", w("unpaid"))]

    def papers(ctx, lt, t):
        op = prog(t, 34.0, 34.25)
        ctx.rect(110, 560, W - 110, 1200, INK, radius=40, opacity=0.78 * op)
        fx.rise(ctx, "MAKE SURE IT'S…", F, 64, W / 2, 650, t - L[12][0]["start"] + 0.04, color=WHITE, wght=900, tracking=tight(64))
        for k, (txt, t0) in enumerate(items):
            y = 800 + k * 150
            q = t - t0
            ctx.rect(170, y - 44, 258, y + 44, WHITE, radius=16, opacity=op * 0.25)
            if q >= 0:
                ctx.rect(170, y - 44, 258, y + 44, GREEN, radius=16, opacity=ease_out(prog(q, 0, 0.15)))
                checkmark(ctx, 214, y + 2, 0.9, prog(q, 0.05, 0.35), WHITE, 12)
                fx.rise(ctx, txt, F, 62, 300, y, q + 0.04, color=WHITE, wght=900, anchor="l", tracking=tight(62))

    v.layer(33.95, 37.75, papers)

    # ------------------------------------------------------------------ 10. "A beautiful house with bad paperwork... isn't yours."
    t_beaut, t_bad = w("beautiful"), w("bad")

    def yours(ctx, lt, t):
        if t < 39.10:
            ctx.band(700, 1200, "#000000", 0.35)
            fx.blur_in(ctx, "a beautiful house", SI, 130, W / 2, 940, t - t_beaut, color=WHITE, shadow=14)
            return
        ctx.band(260, 760, "#000000", 0.4)
        fx.rise(ctx, "BAD PAPERWORK", F, 112, W / 2, 470, t - t_bad + 0.04, color=WHITE, wght=900, tracking=tight(112), shadow=12)
        fx.slam_text(ctx, "ISN'T YOURS.", F, fit_size("ISN'T YOURS.", F, W * 0.9, 190, wght=900), W / 2, 640, t - t_isnt,
                     color=RED, wght=900, tracking=tight(170), shadow=16)

    v.layer(37.75, 41.15, yours)
    v.hit(t_isnt, punch=0.08, shake=0.35, rgb=0.4, decay=0.3)
    v.hit(t_yours, punch=0.04, decay=0.2)

    # ------------------------------------------------------------------ 11. "We check all of this..." + guardar / compartir
    t_we, t_show, t_save, t_send = w("we"), w("show"), w("save"), w("send")

    def close(ctx, lt, t):
        if t < 43.80:
            ctx.band(240, 800, "#000000", 0.45)
            fx.rise(ctx, "WE CHECK ALL OF THIS", F, 96, W / 2, 420, t - t_we + 0.04, color=WHITE, wght=900, tracking=tight(96), shadow=12)
            fx.rise(ctx, "before we ever show you a house.", SI, 76, W / 2, 560, t - t_show + 0.04, color=WHITE, shadow=12)
            return
        if t < 46.0:
            q = t - t_save
            ctx.band(500, 1150, "#000000", 0.45)
            if q >= 0:
                s, op = fx.pop(q, 0.3, 3, 8)
                bookmark(ctx, W / 2, 720, 1.2 * s, ease_out(prog(q, 0.25, 0.6)), op)
                fx.slam_text(ctx, "SAVE THIS", F, 140, W / 2, 970, q, color=WHITE, wght=900, tracking=tight(140), shadow=14)
            return
        q = t - t_send
        ctx.darken(0.25 * prog(t, 46.0, 46.4))
        if q >= 0:
            s, op = fx.pop(q, 0.3, 3, 8)
            fly = ease_in(prog(q, 0.55, 0.95), 2)
            share(ctx, W / 2 + 500 * fly, 560 - 300 * fly, 1.1 * s, op * (1 - fly))
            fx.rise(ctx, "SEND IT TO SOMEONE", F, 84, W / 2, 780, q + 0.04, color=WHITE, wght=900, tracking=tight(84), shadow=12)
            fx.rise(ctx, "who's house hunting", SI, 92, W / 2, 900, t - w("who's") + 0.04, color=WHITE, shadow=12)
        q2 = t - (t_send + 0.9)
        if q2 >= 0:
            p = ease_out(prog(q2, 0, 0.5), 3)
            logo(ctx, W / 2, 1120 + (1 - p) * 40, 1.0, op=p)

    v.layer(41.15, END, close)
    v.hit(t_save, punch=0.05, decay=0.2)
    v.hit(t_send, punch=0.05, decay=0.2)

    # ------------------------------------------------------------------ subtítulos (karaoke) en toda la parte explicada
    pages = caption_pages([wd for l in L for wd in l], max_chars=20, max_words=3)
    hide = [(0.0, 4.12), (19.55, 21.30), (t_isnt - 0.05, 41.15), (43.8, END)]

    def captions(ctx, lt, t):
        if any(a <= t < b for a, b in hide):
            return
        for pg in pages:
            if pg["t0"] <= t < pg["t1"]:
                fx.karaoke(ctx, pg, t, fname=F, wght=900, size=68, y=1450, active=GOLD, shadow=12, pop_from=0.7, space=1.7)
                break

    v.layer(0.0, END, captions, z=8)

    # ------------------------------------------------------------------ sonido
    S = v.sfx
    S(t_dont, "sello", gain=-6, align="peak")
    S(t_dont, "boom", gain=-8, align="peak")
    S(1.20, "whoosh_corto", gain=-12, align="peak")
    S(t_flags, "riser_corto", gain=-12, align="peak")
    S(2.98, "zoom", gain=-10, align="peak")
    for k in range(5):
        S(t_five + 0.07 * k, "pop", gain=-16)
    S(4.12, "whoosh_corto", gain=-12, align="peak")
    for k in range(3):
        S(t_money + 0.08 * k, "ding", gain=-18)
    S(6.30, "whoosh", gain=-13, align="peak")
    S(t_nobody, "whoosh_corto", gain=-16, align="peak")
    S(8.60, "whoosh_corto", gain=-12, align="peak")
    S(L[3][0]["start"], "pop", gain=-12)
    S(t_cracks - 0.1, "quiebre", gain=-12, align="onset")
    S(t_corners, "trazo", gain=-12)
    S(11.55, "zoom", gain=-12, align="peak")
    S(t_paint + 0.25, "tijera", gain=-14, align="onset")
    S(t_struct, "boom", gain=-8, align="peak")
    S(13.95, "whoosh_corto", gain=-12, align="peak")
    S(L[5][0]["start"], "pop", gain=-12)
    S(t_under, "swell", gain=-12, align="peak")
    S(t_moist, "boom_suave", gain=-9, align="peak")
    S(18.62, "whoosh_corto", gain=-12, align="peak")
    S(L[7][0]["start"], "pop", gain=-12)
    S(t_shower - 0.12, "whoosh_abajo", gain=-12, align="peak")
    S(t_same, "pop", gain=-12)
    S(21.30, "whoosh_corto", gain=-12, align="peak")
    S(t_drops, "error", gain=-10)
    S(22.90, "zoom", gain=-13, align="peak")
    S(t_problem, "sello", gain=-12, align="peak")
    S(T_FOUR, "whoosh_corto", gain=-12, align="peak")
    S(T_FOUR + 0.05, "pop", gain=-12)
    S(t_charger, "check", gain=-12)
    S(t_doesnt, "glitch", gain=-9)
    S(t_doesnt + 0.05, "error", gain=-10)
    S(t_wiring, "glitch", gain=-10)
    S(t_cost, "boom", gain=-7, align="peak")
    S(30.34, "whoosh_corto", gain=-12, align="peak")
    S(t_five2 - 0.6, "tick", gain=-14)
    S(t_five2 - 0.3, "tock", gain=-14)
    S(t_five2, "quiebre", gain=-8, align="peak")
    S(33.95, "whoosh", gain=-13, align="peak")
    for _, t0 in items:
        S(t0, "check", gain=-11)
    S(37.75, "swell", gain=-12, align="peak")
    S(t_isnt - 0.05, "rasgado", gain=-8)
    S(t_isnt, "boom", gain=-8, align="peak")
    S(41.15, "whoosh", gain=-13, align="peak")
    for k in range(5):
        S(t_checks + 0.1 * k, "pop", gain=-15)
    S(43.80, "whoosh_corto", gain=-12, align="peak")
    S(t_save, "pop", gain=-10)
    S(46.0, "zoom", gain=-13, align="peak")
    S(t_send + 0.55, "whoosh", gain=-12, align="peak")
    S(t_send + 0.9, "ding", gain=-12)
    return v
