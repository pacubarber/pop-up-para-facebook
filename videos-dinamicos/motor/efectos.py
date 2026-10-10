"""Animaciones de texto y gráficos reutilizables (sobre motor.Ctx).

Todas reciben `lt` = segundos desde que empieza la animación, así se pueden encadenar con los tiempos de Whisper.
"""
from __future__ import annotations

import math

import numpy as np

from motor import (H, W, back, clamp, ease_io, ease_out, font, hexc, lerp, prog, spring,
                   text_width)


# ---------------------------------------------------------------------- curvas
def slam(lt, dur=0.22, frm=1.9):
    """Golpe: entra grande y desenfocado y cae a su tamaño. → (escala, opacidad, blur)."""
    p = prog(lt, 0, dur)
    e = ease_out(p, 4)
    return lerp(frm, 1.0, e), prog(lt, 0, 0.05), (1 - e) * 14


def pop(lt, frm=0.35, freq=3.4, damp=8.0):
    """Aparece con rebote. → (escala, opacidad)"""
    return lerp(frm, 1.0, spring(lt, freq, damp)), prog(lt, 0, 0.06)


def out(lt_end, dur=0.16):
    """Salida: lt_end = segundos que faltan para terminar (negativo = ya terminó). → (opacidad, escala, blur)"""
    p = 1 - prog(lt_end, 0, dur)
    return 1 - ease_out(p, 2), 1 + 0.06 * p, p * 10


# ---------------------------------------------------------------------- texto que sube desde una máscara
def rise(ctx, txt, fname, size, x, y, lt, color="#ffffff", dur=0.32, delay=0.0, anchor="c", exit_at=None,
         exit_dur=0.22, **kw):
    """El texto sube desde detrás de una línea invisible (revelado limpio con máscara)."""
    lt = lt - delay
    if lt < 0:
        return
    op_in = kw.pop("opacity", 1.0)
    e = ease_out(prog(lt, 0, dur), 4)
    dy = (1 - e) * size * 1.05
    op = 1.0
    if exit_at is not None and lt + delay > exit_at:
        q = ease_io(prog(lt + delay, exit_at, exit_at + exit_dur))
        dy = -q * size * 1.05
        op = 1 - q * 0.2
    clipbox = (0, y - size * 0.62, W, y + size * 0.62)
    ctx.text(txt, fname, size, x, y + dy, color=color, anchor=anchor, clip=clipbox, opacity=op * op_in,
             mblur=(0, abs(dy) * 0.12), **kw)


def rise_words(ctx, words, fname, size, x, y, t, color="#ffffff", space=1.6, colors=None, dur=0.3, upper=True,
               anchor="c", **kw):
    """Palabras (con tiempos de Whisper) que van subiendo una a una en la misma línea."""
    sp = text_width(" ", fname, size, kw.get("wght")) * space
    ws = [w["text"].upper() if upper else w["text"] for w in words]
    widths = [text_width(s, fname, size, kw.get("wght")) for s in ws]
    total = sum(widths) + sp * (len(ws) - 1)
    left = {"c": x - total / 2, "l": x, "r": x - total}[anchor]
    cx = left
    for i, (w, s, wd) in enumerate(zip(words, ws, widths)):
        col = colors[i] if colors else color
        rise(ctx, s, fname, size, cx + wd / 2, y, t - w["start"] + 0.04, color=col, dur=dur, **kw)
        cx += wd + sp


# ---------------------------------------------------------------------- golpe de texto
def slam_text(ctx, txt, fname, size, x, y, lt, color="#ffffff", frm=1.9, dur=0.22, life=None, **kw):
    if lt < 0:
        return
    s, op, bl = slam(lt, dur, frm)
    if life is not None:
        o2, s2, b2 = out(life - lt)
        op *= o2
        s *= s2
        bl += b2
    ctx.text(txt, fname, size, x, y, color=color, scale=s, opacity=op, blur=bl, **kw)


def pop_text(ctx, txt, fname, size, x, y, lt, color="#ffffff", life=None, frm=0.35, **kw):
    if lt < 0:
        return
    s, op = pop(lt, frm)
    bl = 0.0
    if life is not None:
        o2, s2, b2 = out(life - lt)
        op *= o2
        s *= s2
        bl = b2
    ctx.text(txt, fname, size, x, y, color=color, scale=s, opacity=op, blur=bl, **kw)


def blur_in(ctx, txt, fname, size, x, y, lt, dur=0.45, color="#ffffff", tracking_from=None, tracking=0.0, **kw):
    """Aparece desde un desenfoque, con espaciado que se cierra (elegante)."""
    if lt < 0:
        return
    p = ease_out(prog(lt, 0, dur), 3)
    tr = lerp(tracking_from if tracking_from is not None else tracking + size * 0.25, tracking, p)
    ctx.text(txt, fname, size, x, y, color=color, opacity=p, blur=(1 - p) * 16, tracking=round(tr), **kw)


def counter(a, b, p, fmt="{:,.0f}", sep=","):
    v = lerp(a, b, ease_out(clamp(p), 3))
    return fmt.format(v).replace(",", sep)


# ---------------------------------------------------------------------- subtítulos karaoke
def karaoke(ctx, page, t, fname="montserrat", size=78, y=1380, color="#ffffff", active="#ffd400", max_w=920,
            upper=True, shadow=10, highlight: dict | None = None, wght=None, line_h=1.12, pop_from=0.55):
    """Dibuja una página de subtítulos: cada palabra aparece con rebote al decirse; la palabra activa cambia de color.
    highlight: {palabra_normalizada: color} para resaltar palabras clave."""
    from motor import libreria_norm
    words = page["words"]
    texts = [w["text"].upper() if upper else w["text"] for w in words]
    sp = text_width(" ", fname, size, wght)
    widths = [text_width(s, fname, size, wght) for s in texts]
    # reparto en líneas
    lines, cur, cw = [], [], 0
    for i, wd in enumerate(widths):
        if cur and cw + sp + wd > max_w:
            lines.append(cur)
            cur, cw = [], 0
        cw = cw + (sp if cur else 0) + wd
        cur.append(i)
    if cur:
        lines.append(cur)
    lh = size * line_h
    y0 = y - (len(lines) - 1) * lh / 2
    life = page["t1"] - t
    for li, idx in enumerate(lines):
        total = sum(widths[i] for i in idx) + sp * (len(idx) - 1)
        x = W / 2 - total / 2
        for i in idx:
            w = words[i]
            lt = t - w["start"] + 0.03
            if lt >= 0:
                s, op = pop(lt, pop_from, 3.2, 9)
                if life < 0.12:
                    op *= clamp(life / 0.12)
                key = libreria_norm(w["text"])
                col = color
                if highlight and key in highlight:
                    col = highlight[key]
                elif w["start"] <= t < w["end"] + 0.05:
                    col = active
                ctx.text(texts[i], fname, size, x + widths[i] / 2, y0 + li * lh, color=col, scale=s, opacity=op,
                         shadow=shadow, shadow_op=0.6, wght=wght)
            x += widths[i] + sp


# ---------------------------------------------------------------------- utilidades de composición
def knockout(ctx, mask, fill_img=None, outside="#000000", outside_op=1.0):
    """Deja ver la imagen solo dentro de la máscara (texto con video adentro)."""
    a = mask[..., None]
    base = ctx.img if fill_img is None else fill_img
    o = hexc(outside)
    ctx.img = base * a + (ctx.img * (1 - outside_op) + o * outside_op) * (1 - a)


def light_leak(ctx, t, color="#ff8a3d", strength=0.35, speed=0.6, seed=0):
    """Fuga de luz suave que se desplaza (mezcla screen)."""
    sw, sh = W // 8, H // 8
    yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
    cx = sw * (0.5 + 0.55 * math.sin(t * speed + seed))
    cy = sh * (0.35 + 0.4 * math.cos(t * speed * 0.7 + seed * 2))
    d = np.sqrt(((xx - cx) / (sw * 0.55)) ** 2 + ((yy - cy) / (sh * 0.45)) ** 2)
    a = np.clip(1 - d, 0, 1) ** 2 * strength
    import cv2
    a = cv2.resize(a, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    col = hexc(color)
    ctx.img = 1 - (1 - ctx.img) * (1 - col * a)


def tv_off(img, p):
    """Efecto de televisor que se apaga: la imagen se aplasta a una línea y luego a un punto."""
    import cv2
    out = np.zeros_like(img)
    if p >= 1:
        return out
    if p < 0.6:
        q = ease_io(p / 0.6)
        h = max(2, int(H * (1 - q) ** 2))
        small = cv2.resize(img, (W, h), interpolation=cv2.INTER_AREA)
        small = np.clip(small * (1 + 2.5 * q), 0, 1)
        y0 = (H - h) // 2
        out[y0:y0 + h] = small
    else:
        q = ease_io((p - 0.6) / 0.4)
        w = max(2, int(W * (1 - q)))
        y0 = H // 2 - 2
        out[y0:y0 + 4, (W - w) // 2:(W - w) // 2 + w] = 1.0 * (1 - q * 0.5)
    return out
