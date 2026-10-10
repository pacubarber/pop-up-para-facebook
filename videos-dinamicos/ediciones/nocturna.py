"""NOCTURNA — promo de festival de música electrónica (marca ficticia). 9:16 · ~21 s.

Cortes al beat (Hard Techno, 120 BPM), drop justo en "Nocturna" con zoom a través de las letras, números que
golpean, texto gigante detrás de la bailarina, cuenta de boletos y cierre de "televisor que se apaga".
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motor"))
import efectos as fx  # noqa: E402
from motor import (FPS, H, W, Video, back, clamp, ease_in, ease_io, ease_out, fit_size, font, lerp, load_vo,  # noqa: E402,F401
                   prog, text_width, word_time)

VO = load_vo("nocturna")
DROP = 5.25                      # el drop de la música cae aquí (pista 197, segundo 112.0)
BEAT = 60 / 119.8
ACID, PINK, WHITE, SUN = "#C8FF1E", "#FF2E88", "#F4F4F4", "#FFC46B"
GRADE = ("eq=contrast=1.12:brightness=-0.03:saturation=1.3,"
         "colorbalance=rs=0.03:bs=0.09:rm=0.04:bm=0.07")


def B(k):
    return DROP + k * BEAT


TE_Y, CAM_Y = 560, 800           # "TE CAMBIAN" detrás de la cabeza de la bailarina


def w(text, n=1):
    return word_time(VO, text, n)


def build():
    v = Video("nocturna", 21.0, grade=GRADE)
    v.voice("nocturna", 0.0, gain=0)
    v.music(197, start=112.0 - DROP, gain=-8, fade_out=1.6)
    v.grain, v.vignette, v.bloom = 0.035, 0.32, 0.18
    v.poster = 7.9

    def c(i, desde, dur, **kw):
        return v.clip(f"mixkit:{i}", desde, dur, **kw)

    # ------------------------------------------------------------------ planos
    v.shot(0.00, 1.25, c(48508, 3.0, 3.0), zoom=(1.10, 1.22), speed=0.8)
    v.shot(1.25, 2.22, c(14084, 2.0, 3.0), zoom=(1.18, 1.06), speed=0.8, dim=0.35)
    v.shot(2.22, 3.30, c(50435, 1.0, 2.0), zoom=(1.0, 1.08), trans="glitch", tdur=0.13)
    v.shot(3.30, 4.22, c(50438, 2.0, 2.0, matte=True), zoom=(1.12, 1.18), speed=0.5, trans="zoom", tdur=0.16)
    v.shot(4.22, 5.75, c(4188, 4.0, 3.0), zoom=(1.0, 1.08))
    cuts = [  # (fin, clip, kwargs)
        (6.25, c(42421, 2.0, 2.0), dict(zoom=(1.18, 1.06), trans="whip-l", tdur=0.16, dim=0.2)),
        (6.75, c(9586, 10.0, 2.0), dict(zoom=(1.0, 1.12), dim=0.2)),
        (7.25, c(4187, 3.0, 2.0), dict(zoom=(1.2, 1.05), trans="zoom", tdur=0.2, dim=0.2)),
        (7.75, c(4139, 2.0, 2.0), dict(zoom=(1.05, 1.15), dim=0.2)),
        (8.25, c(4026, 3.0, 2.0), dict(zoom=(1.12, 1.02), trans="whip-r", tdur=0.16, dim=0.2)),
        (8.76, c(14756, 2.0, 2.0), dict(zoom=(1.0, 1.1), dim=0.2)),
        (9.26, c(14088, 6.0, 2.0), dict(zoom=(1.15, 1.05), trans="glitch", tdur=0.1, dim=0.25)),
        (9.76, c(48510, 3.0, 2.0), dict(zoom=(1.05, 1.18), dim=0.25)),
        (10.26, c(45742, 2.0, 2.0), dict(zoom=(1.0, 1.06), trans="zoom", tdur=0.2)),
        (10.76, c(28375, 10.0, 2.0), dict(zoom=(1.1, 1.0))),
        (11.26, c(51283, 4.0, 2.0, matte=True), dict(zoom=(1.0, 1.06), trans="whip-u", tdur=0.16)),
        (12.26, c(14115, 8.0, 2.5), dict(zoom=(1.0, 1.1), dim=0.25)),
        (13.26, c(50440, 3.0, 2.0), dict(zoom=(1.12, 1.0), trans="glitch", tdur=0.1, dim=0.2)),
        (14.26, c(33906, 6.0, 2.0), dict(zoom=(1.0, 1.1), trans="whip-l", tdur=0.16)),
        (14.76, c(48506, 4.0, 1.5), dict(zoom=(1.1, 1.2))),
        (15.52, c(49079, 3.0, 1.5), dict(zoom=(1.0, 1.15), trans="zoom", tdur=0.18)),
        (16.52, c(45739, 2.0, 2.5), dict(zoom=(1.0, 1.06), dim=0.4)),
        (18.80, c(42425, 0.5, 4.0), dict(zoom=(1.0, 1.1), trans="lightdip", tdur=0.24, tparams={"color": SUN})),
        (21.0, c(42424, 1.5, 4.5), dict(zoom=(1.0, 1.1), trans="blurfade", tdur=0.3)),
    ]
    t = 5.75
    for end, clip, kw in cuts:
        v.shot(t, end, clip, **kw)
        t = end

    # ------------------------------------------------------------------ 1. "Hay noches que se olvidan." (las palabras se olvidan)
    L1 = VO["lines"][0]["words"]

    def intro(ctx, lt, t):
        ctx.band(450, 1350, "#000000", 0.45)
        forget = prog(t, 1.75, 2.22)                    # al final las palabras "se olvidan": desenfoque y dispersión
        rows = [(L1[:2], 820, [WHITE, WHITE]), (L1[2:], 960, [WHITE, WHITE, ACID])]
        for ws, y, cols in rows:
            words = [x["text"].upper().strip(".") for x in ws]
            sp = text_width(" ", "inter", 120, 900) * 1.6
            widths = [text_width(s, "inter", 120, 900) for s in words]
            x = W / 2 - (sum(widths) + sp * (len(words) - 1)) / 2
            for k, (s, wd, wl, col) in enumerate(zip(words, widths, ws, cols)):
                e = ease_in(forget, 2) * (0.5 + 0.25 * k + (0.3 if y > 900 else 0))
                if t >= wl["start"]:
                    fx.rise(ctx, s, "inter", 120, x + wd / 2, y - e * 70, t - wl["start"] + 0.04, color=col, wght=900,
                            opacity=1 - min(1, e), blur=e * 26, scale=1 + e * 0.25, shadow=10)
                x += wd + sp

    v.layer(0.0, 2.24, intro)
    v.sfx(0.0, 1486, gain=-16)

    # ------------------------------------------------------------------ 2. "Y hay noches que te cambian." (texto gigante DETRÁS de la bailarina)
    L2 = VO["lines"][1]["words"]

    def cambian_back(ctx, lt, t):
        te, cam = L2[4], L2[5]
        grow = 1 + 0.06 * prog(t, 3.3, 4.22)
        s1 = fit_size("CAMBIAN", "unbounded", W * 0.96, 400)
        fx.slam_text(ctx, "TE", "unbounded", 300, W / 2, TE_Y, t - te["start"] + 0.02, color=ACID, frm=1.5)
        if t >= cam["start"]:
            sc, op, bl = fx.slam(t - cam["start"] + 0.02, 0.22, 1.5)
            ctx.text("CAMBIAN", "unbounded", s1, W / 2, CAM_Y, color=ACID, scale=sc * grow, opacity=op, blur=bl)

    def cambian_front(ctx, lt, t):
        fx.rise_words(ctx, L2[:4], "inter", 92, W / 2, 1500, t, color=WHITE, wght=900, shadow=10)

    v.layer(3.30, 4.22, cambian_back, behind=True)
    v.layer(2.22, 3.30, cambian_front)
    v.sfx(2.22, 2946, gain=-12, align="peak")
    v.sfx(3.30, 645, gain=-7)

    # ------------------------------------------------------------------ 3. "Nocturna." texto con video dentro → zoom a través de la T en el drop
    noc = w("nocturna", 1)
    size_n = fit_size("NOCTURNA", "unbounded", W * 0.9, 300)
    fnt = font("unbounded", size_n)
    total = fnt.getlength("NOCTURNA")
    tx = W / 2 - total / 2 + fnt.getlength("NOC") + fnt.getlength("T") / 2   # centro de la T
    ty = H / 2 + size_n * 0.12

    def knock(ctx, lt, t):
        appear = ease_out(prog(t, noc["start"] - 0.05, noc["start"] + 0.35), 3)
        zoom_p = prog(t, DROP - 0.12, DROP + 0.2)
        s = (0.88 + 0.12 * appear) * (1 + 40 * ease_in(zoom_p, 3))
        x = tx + s * (W / 2 - tx)
        y = ty + s * (H / 2 - ty)
        mask = ctx.text_mask("NOCTURNA", "unbounded", size_n, x, y, scale=s, blur=(1 - appear) * 14,
                             tracking=round((1 - appear) * 30))
        mask *= max(appear, zoom_p)
        fx.knockout(ctx, mask)
        if zoom_p <= 0:   # contorno fino que dibuja la palabra mientras se susurra
            ctx.text("NOCTURNA", "unbounded", size_n, x, y, scale=s, outline=True, stroke=2, color=WHITE,
                     opacity=0.35 * appear)

    v.layer(4.22, DROP + 0.22, knock)
    v.hit(DROP, shake=1.0, rgb=0.9, flash=0.55, punch=0.10, decay=0.3)
    v.sfx(DROP, 1143, gain=-2, align="peak")
    v.sfx(DROP - 0.05, 1492, gain=-9, align="peak")

    # ------------------------------------------------------------------ 4. "Doce horas. Tres escenarios. Treinta artistas."
    stats = [("12", "HORAS", w("doce")["start"]), ("3", "ESCENARIOS", w("tres")["start"]),
             ("30", "ARTISTAS", w("treinta")["start"]), (None, None, 8.62)]

    def numbers(ctx, lt, t):
        for k in range(3):
            num, lab, t0 = stats[k]
            t1 = stats[k + 1][2]
            if not (t0 - 0.02 <= t < t1):
                continue
            q = t - t0
            val = int(round(lerp(0, int(num), ease_out(prog(q, 0, 0.28), 2))))
            s, op, bl = fx.slam(q, 0.2, 1.7)
            ctx.text(str(val) if q < 0.28 else num, "unbounded", min(600, fit_size(num, "unbounded", W * 0.84, 600)), W / 2, 860,
                     color=ACID, scale=s, opacity=op,
                     blur=bl, shadow=18, shadow_op=0.45)
            fx.rise(ctx, lab, "grotesk", 92, W / 2, 1230, q - 0.1, color=WHITE, tracking=22, wght=700)

    v.layer(5.30, 8.62, numbers)
    for k in range(3):
        v.hit(stats[k][2], punch=0.07, rgb=0.45, decay=0.18)
        v.sfx(stats[k][2] - 0.08, 2299, gain=-13)
    for tt in (5.75, 8.25):
        v.sfx(tt, 3115, gain=-13, align="peak")
    v.sfx(6.75, 166, gain=-12, align="peak")

    # ------------------------------------------------------------------ 5. "Una sola noche."
    L5 = VO["lines"][4]["words"]

    def sola(ctx, lt, t):
        rows = [("UNA", 690, WHITE), ("SOLA", 950, WHITE), ("NOCHE", 1225, ACID)]
        for (txt, y, col), wd in zip(rows, L5):
            size = fit_size(txt, "unbounded", W * 0.82, 260)
            fx.slam_text(ctx, txt, "unbounded", size, W / 2, y, t - wd["start"] + 0.02, color=col, frm=1.6,
                         shadow=14, shadow_op=0.4)

    v.layer(8.62, 9.80, sola)
    for wd in L5:
        v.hit(wd["start"], punch=0.05, decay=0.15)

    # ------------------------------------------------------------------ 6. "Catorce de noviembre." 14 → .11 y NOVIEMBRE detrás de la silueta
    cat, de, nov = w("catorce"), w("de", 1), w("noviembre")

    def fecha(ctx, lt, t):
        if t < 10.76:
            size = 330
            fnt14 = font("unbounded", size)
            full = fnt14.getlength("14.11")
            left = W / 2 - full / 2
            slide = ease_out(prog(t, de["start"] - 0.04, de["start"] + 0.22), 4)
            x14 = lerp(W / 2 - fnt14.getlength("14") / 2, left, slide)
            fx.slam_text(ctx, "14", "unbounded", size, x14, 900, t - cat["start"] + 0.02, color=WHITE, anchor="l", frm=1.6)
            if slide > 0:
                ctx.text(".11", "unbounded", size, x14 + fnt14.getlength("14"), 900, color=ACID, anchor="l",
                         opacity=slide, blur=(1 - slide) * 10, mblur=((1 - slide) * 60, 0))
            fx.rise(ctx, "NOV · 2026", "mono", 56, W / 2, 1120, t - cat["start"] - 0.25, color=WHITE, tracking=18)
        else:
            ctx.text("14.11", "unbounded", 110, W / 2, 330, color=WHITE, shadow=10)

    def nov_back(ctx, lt, t):
        size = fit_size("NOVIEMBRE", "unbounded", W * 0.97, 300)
        sc, op, bl = fx.slam(t - 10.76, 0.2, 1.4)
        ctx.text("NOVIEMBRE", "unbounded", size, W / 2, 1000, color=ACID, scale=sc * (1 + 0.04 * prog(t, 10.76, 11.26)),
                 opacity=op, blur=bl)

    v.layer(9.90, 11.26, fecha)
    v.layer(10.76, 11.26, nov_back, behind=True)
    v.hit(cat["start"], punch=0.08, shake=0.4, rgb=0.5, decay=0.2)
    v.sfx(cat["start"], 772, gain=-8, align="peak")
    v.sfx(10.76, 175, gain=-12, align="peak")

    # ------------------------------------------------------------------ 7. "Preventa: solo mil boletos."
    pre, solo, mil, bol = w("preventa"), w("solo"), w("mil"), w("boletos")

    def preventa(ctx, lt, t):
        q = t - pre["start"]
        txt = "PREVENTA"
        n = int(clamp(q / 0.32) * len(txt))
        if q >= 0:
            fnt_m = font("mono", 58)
            tw = fnt_m.getlength(txt) + 12 * (len(txt) - 1)
            x0 = W / 2 - tw / 2
            ctx.text(txt[:n], "mono", 58, x0, 600, color=WHITE, anchor="l", tracking=12, shadow=6)
        fx.rise(ctx, "SOLO", "grotesk", 100, W / 2, 790, t - solo["start"] + 0.04, color=WHITE, tracking=16, wght=700)
        qm = t - mil["start"]
        if qm >= -0.05:
            val = fx.counter(0, 1000, prog(qm, -0.05, 0.42))
            s, op, bl = fx.slam(qm + 0.05, 0.2, 1.4)
            ctx.text(val, "unbounded", fit_size("1,000", "unbounded", W * 0.9, 330), W / 2, 1050, color=ACID, scale=s, opacity=op, blur=bl, shadow=16, shadow_op=0.45)
        fx.rise(ctx, "BOLETOS", "grotesk", 120, W / 2, 1320, t - bol["start"] + 0.04, color=WHITE, tracking=26, wght=700)

    v.layer(11.40, 13.42, preventa)
    v.sfx(pre["start"], 1120, gain=-10)
    v.hit(mil["start"], punch=0.06, decay=0.2)
    v.sfx(mil["start"] + 0.42, 2364, gain=-11)

    # ------------------------------------------------------------------ 8. "Cuando se acaben, se acabó." → apagón
    L8 = VO["lines"][7]["words"]
    acabo = L8[4]
    off0, off1 = 15.27, 15.52

    def acaben(ctx, lt, t):
        fx.rise_words(ctx, L8[:3], "inter", fit_size("CUANDO SE ACABEN,", "inter", W * 0.9, 104, 900), W / 2, 860, t,
                      color=WHITE, wght=900, shadow=10)
        q = t - L8[3]["start"]
        if q >= 0:
            size = fit_size("SE ACABÓ.", "unbounded", W * 0.92, 240)
            fx.slam_text(ctx, "SE ACABÓ.", "unbounded", size, W / 2, 1080, q, color=PINK, frm=1.8, shadow=16)

    def apagon(ctx):
        if off0 <= ctx.t < off1:
            ctx.img = fx.tv_off(ctx.img, prog(ctx.t, off0, off1))

    v.layer(13.50, off1, acaben)
    v.post.append(apagon)
    v.hit(L8[3]["start"], shake=0.7, rgb=0.8, punch=0.08, decay=0.25)
    v.sfx(L8[3]["start"], 2303, gain=-6)
    v.sfx(off0, 2951, gain=-8)

    # ------------------------------------------------------------------ 9. Logo: letras que caen + línea
    noc2 = w("nocturna", 2)

    def logo(ctx, lt, t, y=900, t0=None, sub=False):
        t0 = noc2["start"] if t0 is None else t0
        size = fit_size("NOCTURNA", "unbounded", W * 0.88, 300)

        def letter(i, n):
            q = t - t0 - i * 0.035
            e = ease_out(prog(q, 0, 0.3), 4)
            return dict(dy=-(1 - e) * 140, opacity=prog(q, 0, 0.08), blur=(1 - e) * 12, color=WHITE)

        ctx.letters("NOCTURNA", "unbounded", size, W / 2, y, letter, glow=0.25, glow_color=ACID)
        lw = ease_io(prog(t, t0 + 0.35, t0 + 0.75)) * size * 3.4
        if lw > 1:
            ctx.rect(W / 2 - lw / 2, y + size * 0.62, W / 2 + lw / 2, y + size * 0.62 + 10, ACID)

    v.layer(15.52, 16.52, logo)
    v.sfx(15.9, 2633, gain=-12, align="peak")

    # ------------------------------------------------------------------ 10. "Bailamos hasta que salga el sol."
    L10 = VO["lines"][9]["words"]

    def sol(ctx, lt, t):
        ctx.gradient_v(0, 1000, "#000000", 0.55, 0.0)
        fx.rise(ctx, "BAILAMOS", "inter", 116, W / 2, 400, t - L10[0]["start"] + 0.04, color=WHITE, wght=900, shadow=8)
        fx.rise_words(ctx, L10[1:3], "inter", 116, W / 2, 530, t, color=WHITE, wght=900, shadow=8)
        size = fit_size("SALGA EL SOL", "unbounded", W * 0.9, 200)
        fx.rise_words(ctx, L10[3:5], "unbounded", size, W / 2 - text_width(" SOL", "unbounded", size) / 2, 700, t,
                      color=SUN, glow=0.35)
        q = t - L10[5]["start"]
        if q >= 0:
            ws = text_width("SALGA EL ", "unbounded", size)
            total = text_width("SALGA EL SOL", "unbounded", size)
            x = W / 2 - total / 2 + ws + text_width("SOL", "unbounded", size) / 2
            s, op, bl = fx.slam(q, 0.22, 1.7)
            ctx.text("SOL", "unbounded", size, x, 700, color=SUN, scale=s, opacity=op, blur=bl, glow=0.6)

    v.layer(16.52, 18.80, sol)
    v.hit(L10[5]["start"], punch=0.05, decay=0.3)

    # ------------------------------------------------------------------ 11. Cierre
    def cierre_pre(ctx):
        if ctx.t >= 18.6:
            p = ease_io(prog(ctx.t, 18.6, 19.2))
            ctx.blur(22 * p)
            ctx.darken(0.62 * p)

    def cierre(ctx, lt, t):
        logo(ctx, lt, t, y=860, t0=18.85)
        fx.rise(ctx, "14.11.2026", "mono", 64, W / 2, 1060, t - 19.35, color=WHITE, tracking=20)
        q = t - 19.6
        if q >= 0:
            ctx.text("PREVENTA EN LA BIO", "grotesk", 54, W / 2, 1160, color=ACID, tracking=14, wght=700,
                     opacity=prog(q, 0, 0.25) * (0.75 + 0.25 * (1 if int(t * 3) % 2 == 0 else 0)))
        fade = prog(t, 20.45, 21.0)
        if fade > 0:
            ctx.darken(fade)

    v.pre_layers.append(cierre_pre)
    v.layer(18.80, 21.0, cierre)
    v.sfx(18.8, 1489, gain=-14, align="peak")
    return v
