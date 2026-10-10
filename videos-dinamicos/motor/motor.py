"""Motor de edición de videos-dinamicos.

Compositor por fotograma (NumPy + OpenCV) con FFmpeg para todo lo que entra y sale:
  · FFmpeg recorta, encuadra a 9:16, gradúa el color y entrega los fotogramas de cada clip (conform).
  · Python compone: movimiento de cámara, transiciones, texto cinético, gráficas, texto detrás de personas
    (recorte con Robust Video Matting), texto con video dentro, golpes de cámara, grano y viñeta.
  · FFmpeg codifica los fotogramas y mezcla el audio (ver audio.py).

Cada video es un módulo en ediciones/ con una función build() que devuelve un Video.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import subprocess
import sys
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Callable

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(ROOT, "cache")
sys.path.insert(0, HERE)
import libreria  # noqa: E402

W, H, FPS = 1080, 1920, 30
CONFORM_VERSION = 3

# ======================================================================= utilidades de tiempo
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, t):
    return a + (b - a) * t


def prog(t, a, b):
    if b <= a:
        return 1.0 if t >= a else 0.0
    return clamp((t - a) / (b - a))


def ease_out(t, p=3):
    return 1 - (1 - clamp(t)) ** p


def ease_in(t, p=3):
    return clamp(t) ** p


def ease_io(t):
    t = clamp(t)
    return 4 * t * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def back(t, s=1.9):
    t = clamp(t) - 1
    return t * t * ((s + 1) * t + s) + 1


def spring(t, freq=3.2, damp=5.5):
    """Respuesta de un resorte: 0 → 1 con rebote. t en segundos."""
    if t <= 0:
        return 0.0
    return 1 - math.exp(-damp * t) * math.cos(2 * math.pi * freq * t)


def pulse(t, t0, attack=0.04, decay=0.25):
    """Envolvente de golpe: sube en `attack` y cae exponencialmente."""
    d = t - t0
    if d < 0:
        return 0.0
    if d < attack:
        return d / attack
    return math.exp(-(d - attack) / decay)


def hexc(c) -> np.ndarray:
    """'#RRGGBB' → color BGR float32 0–1."""
    if isinstance(c, np.ndarray):
        return c
    if isinstance(c, (tuple, list)):
        return np.array(c, np.float32)
    c = c.lstrip("#")
    r, g, b = (int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return np.array([b, g, r], np.float32)


# ======================================================================= tipografías
FONT_REPO = "https://raw.githubusercontent.com/google/fonts/main/ofl"
FONTS = {
    "anton": ("anton/Anton-Regular.ttf", None),
    "unbounded": ("unbounded/Unbounded%5Bwght%5D.ttf", 900),
    "inter": ("intertight/InterTight%5Bwght%5D.ttf", 800),
    "inter-i": ("intertight/InterTight-Italic%5Bwght%5D.ttf", 800),
    "montserrat": ("montserrat/Montserrat%5Bwght%5D.ttf", 900),
    "serif": ("instrumentserif/InstrumentSerif-Regular.ttf", None),
    "serif-i": ("instrumentserif/InstrumentSerif-Italic.ttf", None),
    "dmserif": ("dmserifdisplay/DMSerifDisplay-Regular.ttf", None),
    "dmserif-i": ("dmserifdisplay/DMSerifDisplay-Italic.ttf", None),
    "grotesk": ("spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf", 700),
    "mono": ("jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf", 700),
    "archivo": ("archivoblack/ArchivoBlack-Regular.ttf", None),
    "bebas": ("bebasneue/BebasNeue-Regular.ttf", None),
    "syne": ("syne/Syne%5Bwght%5D.ttf", 800),
    "manrope": ("manrope/Manrope%5Bwght%5D.ttf", 800),
}


def font_path(name: str) -> str:
    rel, _ = FONTS[name]
    path = os.path.join(CACHE, "fuentes", os.path.basename(rel).replace("%5B", "[").replace("%5D", "]"))
    if not os.path.exists(path):
        libreria.download(f"{FONT_REPO}/{rel}", path)
    return path


@lru_cache(maxsize=256)
def font(name: str, size: int, wght: int | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(font_path(name), int(size))
    w = wght if wght is not None else FONTS[name][1]
    if w is not None:
        try:
            f.set_variation_by_axes([w])
        except Exception:
            pass
    return f


def track_offset(fnt, txt, i, tracking):
    """Posición x del carácter i con espaciado entre letras. Con espaciado negativo los espacios
    conservan su ancho (si no, las palabras se pegan)."""
    if tracking == 0:
        return fnt.getlength(txt[:i])
    spaces = txt[:i].count(" ")
    extra = -tracking * 2 * spaces if tracking < 0 else 0
    return fnt.getlength(txt[:i]) + tracking * i + extra


def track_width(fnt, txt, tracking):
    return track_offset(fnt, txt, len(txt), tracking) - (tracking if txt and tracking else 0)


@dataclass
class Sprite:
    arr: np.ndarray        # (h, w, 3) float32: relleno, contorno, sombra (alfas 0–1)
    cx: float              # centro de la caja de avance (x) dentro del sprite
    cy: float              # mitad de la altura de mayúsculas (y)
    adv: float             # ancho de avance
    cap: float             # altura de mayúsculas


@lru_cache(maxsize=2048)
def sprite(txt: str, fname: str, size: int, wght: int | None = None, tracking: float = 0.0,
           stroke: int = 0, shadow: float = 0.0) -> Sprite:
    fnt = font(fname, size, wght)
    asc, desc = fnt.getmetrics()
    n = len(txt)
    adv = track_width(fnt, txt, tracking)
    sh = int(math.ceil(shadow * 2.5)) if shadow else 0
    pad = int(size * 0.25) + stroke + sh
    w = int(math.ceil(adv + 2 * pad))
    h = int(asc + desc + 2 * pad)
    x0, base = pad, pad + asc

    def draw(sw=0):
        im = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(im)
        if tracking == 0:
            d.text((x0, base), txt, font=fnt, fill=255, anchor="ls", stroke_width=sw, stroke_fill=255)
        else:
            for i, ch in enumerate(txt):
                xi = x0 + track_offset(fnt, txt, i, tracking)
                d.text((xi, base), ch, font=fnt, fill=255, anchor="ls", stroke_width=sw, stroke_fill=255)
        return np.asarray(im, np.float32) / 255.0

    fill = draw()
    ring = np.clip(draw(stroke) - fill, 0, 1) if stroke else np.zeros_like(fill)
    if shadow:
        base_a = np.maximum(fill, ring)
        shad = cv2.GaussianBlur(base_a, (0, 0), shadow)
        M = np.float32([[1, 0, 0], [0, 1, shadow * 0.35]])
        shad = cv2.warpAffine(shad, M, (w, h))
    else:
        shad = np.zeros_like(fill)
    cap = -fnt.getbbox("H", anchor="ls")[1]
    return Sprite(np.dstack([fill, ring, shad]).astype(np.float32), x0 + adv / 2, base - cap / 2, adv, cap)


def text_width(txt, fname, size, wght=None, tracking=0.0) -> float:
    fnt = font(fname, size, wght)
    return track_width(fnt, txt, tracking)


def fit_size(txt, fname, max_w, start=400, wght=None, tracking_em=0.0, lo=10) -> int:
    s = start
    while s > lo and text_width(txt, fname, s, wght, tracking_em * s) > max_w:
        s = int(s * 0.96)
    return s


# ======================================================================= lectura de fotogramas
VF_IN = "scale=in_color_matrix=bt709:in_range=tv,format={fmt}"


class Reader:
    """Lee un archivo fotograma a fotograma (secuencial; reabre con -ss si hay que retroceder)."""

    def __init__(self, path: str, gray=False):
        self.path, self.gray = path, gray
        self.ch = 1 if gray else 3
        self.proc = None
        self.idx = -1
        self.buf: dict[int, np.ndarray] = {}
        self.n = int(round(libreria.probe(path)["dur"] * FPS)) if not gray else None
        self.last = None

    def _open(self, start: int):
        if self.proc:
            self.proc.kill()
        fmt = "gray" if self.gray else "bgr24"
        vf = "format=gray" if self.gray else VF_IN.format(fmt=fmt)
        self.proc = subprocess.Popen(
            ["ffmpeg", "-v", "error", "-ss", f"{start / FPS:.4f}", "-i", self.path, "-vf", vf, "-f", "rawvideo",
             "-pix_fmt", fmt, "pipe:1"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=W * H * 3 * 2)
        self.idx = start - 1
        self.buf = {}

    def frame(self, i: int) -> np.ndarray:
        i = max(0, i)
        if i in self.buf:
            return self.buf[i]
        if self.proc is None or i < self.idx - 1 or i > self.idx + 90:
            self._open(i)
        size = W * H * self.ch
        while self.idx < i:
            raw = self.proc.stdout.read(size)
            if len(raw) < size:   # fin del clip: se congela el último fotograma
                return self.last if self.last is not None else np.zeros((H, W, self.ch) if self.ch > 1 else (H, W), np.uint8)
            self.idx += 1
            fr = np.frombuffer(raw, np.uint8).reshape((H, W, 3) if self.ch == 3 else (H, W))
            self.buf[self.idx] = fr
            self.last = fr
            for k in list(self.buf):
                if k < self.idx - 2:
                    del self.buf[k]
        return self.buf.get(i, self.last)

    def at(self, t: float, blend=True) -> np.ndarray:
        """Fotograma en el tiempo t (s). Con blend mezcla los dos vecinos (cámara lenta suave)."""
        f = t * FPS
        i = int(math.floor(f))
        a = f - i
        fr = self.frame(i)
        if not blend or a < 0.15 or a > 0.85:
            return fr if a <= 0.85 or not blend else self.frame(i + 1)
        fr2 = self.frame(i + 1)
        return cv2.addWeighted(fr, 1 - a, fr2, a, 0)


_readers: dict[str, Reader] = {}


def reader(path: str, gray=False) -> Reader:
    k = path + (":g" if gray else "")
    if k not in _readers:
        _readers[k] = Reader(path, gray)
    return _readers[k]


# ======================================================================= clips (conform + recorte)
@dataclass
class Clip:
    ref: str
    desde: float = 0.0
    dur: float = 4.0
    x: float = 0.5           # centro horizontal del encuadre 9:16 (0–1)
    y: float = 0.5           # centro vertical (si hay recorte extra)
    cz: float = 1.0          # zoom de encuadre en el conform (>1 recorta más cerrado)
    vf: str = ""             # filtros FFmpeg extra para este clip
    grade: str = ""          # gradación del video (la pone Video.clip)
    flip: bool = False
    matte: bool = False      # genera recorte de persona (alfa) para texto detrás
    path: str = ""
    alpha: str = ""

    def key(self):
        s = json.dumps([self.ref, self.desde, self.dur, self.x, self.y, self.cz, self.vf, self.grade, self.flip, CONFORM_VERSION])
        return hashlib.sha1(s.encode()).hexdigest()[:12]

    def prepare(self):
        name = self.ref.split(":", 1)[1][:40]
        out = os.path.join(CACHE, "conform", f"{name}-{self.key()}.mp4")
        if not os.path.exists(out):
            src = libreria.source_path(self.ref)
            info = libreria.probe(src)
            sw, sh = info["w"], info["h"]
            # ventana 9:16 dentro del original
            if sw / sh > W / H:
                ch = sh / self.cz
                cw = ch * W / H
            else:
                cw = sw / self.cz
                ch = cw * H / W
            cx = clamp(self.x * sw - cw / 2, 0, sw - cw)
            cy = clamp(self.y * sh - ch / 2, 0, sh - ch)
            vf = [f"crop={int(cw)//2*2}:{int(ch)//2*2}:{int(cx)}:{int(cy)}", f"scale={W}:{H}:flags=lanczos", f"fps={FPS}", "setsar=1"]
            if self.flip:
                vf.append("hflip")
            if self.grade:
                vf.append(self.grade)
            if self.vf:
                vf.append(self.vf)
            vf.append("format=yuv420p")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            tmp = out + ".part.mp4"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{self.desde:.3f}", "-t", f"{self.dur:.3f}", "-i", src,
                            "-vf", ",".join(vf), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "12", "-g", "15",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", tmp], check=True)
            os.replace(tmp, out)
        self.path = out
        if self.matte:
            import recorte
            self.alpha = recorte.matte(out)
        return self


# ======================================================================= lienzo y dibujo
class Ctx:
    """Lienzo de un fotograma (float32 BGR 0–1) con herramientas de dibujo."""

    def __init__(self, img: np.ndarray, t: float, video: "Video"):
        self.img, self.t, self.video = img, t, video
        self.matte = None

    # ---------------------------------------------------------- composición básica
    def _region(self, x0, y0, x1, y1, clip=None):
        x0, y0 = max(0, int(math.floor(x0))), max(0, int(math.floor(y0)))
        x1, y1 = min(W, int(math.ceil(x1))), min(H, int(math.ceil(y1)))
        if clip:
            x0, y0 = max(x0, int(clip[0])), max(y0, int(clip[1]))
            x1, y1 = min(x1, int(clip[2])), min(y1, int(clip[3]))
        return x0, y0, x1, y1

    def put(self, alpha: np.ndarray, color, x0: int, y0: int, opacity=1.0, blend="normal", target=None):
        """Pega un alfa (h,w) con un color (o imagen (h,w,3)) en (x0,y0)."""
        img = self.img if target is None else target
        h, w = alpha.shape[:2]
        if h <= 0 or w <= 0:
            return
        reg = img[y0:y0 + h, x0:x0 + w]
        a = alpha[..., None] * opacity
        col = hexc(color) if not isinstance(color, np.ndarray) or color.ndim == 1 else color
        if blend == "add":
            reg += col * a
        elif blend == "screen":
            reg[:] = 1 - (1 - reg) * (1 - col * a)
        else:
            reg *= 1 - a
            reg += col * a

    # ---------------------------------------------------------- texto
    def text(self, txt, fname, size, x, y, color="#ffffff", wght=None, scale=1.0, sx=None, sy=None, rot=0.0,
             opacity=1.0, blur=0.0, tracking=0.0, anchor="c", stroke=0, stroke_color="#000000", outline=False,
             shadow=0.0, shadow_op=0.55, mblur=(0, 0), glow=0.0, glow_color=None, blend="normal", clip=None,
             target=None, mask_only=False):
        """Dibuja texto centrado (anchor c) / alineado a la izquierda (l) / derecha (r) en (x, y).
        y es el centro de la altura de mayúsculas. tracking en píxeles. outline=True dibuja solo el contorno."""
        if opacity <= 0.003 or not txt:
            return None
        spr = sprite(txt, fname, int(size), wght, float(tracking), int(stroke), float(shadow))
        ax = {"c": spr.cx, "l": spr.cx - spr.adv / 2, "r": spr.cx + spr.adv / 2}[anchor]
        sx = scale if sx is None else sx
        sy = scale if sy is None else sy
        if abs(sx) < 1e-3 or abs(sy) < 1e-3:
            return None
        c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
        # M: sprite → lienzo (escala y rotación alrededor del ancla)
        A = np.array([[c * sx, -s * sy], [s * sx, c * sy]], np.float64)
        tvec = np.array([x, y]) - A @ np.array([ax, spr.cy])
        h, w = spr.arr.shape[:2]
        corners = (A @ np.array([[0, w, w, 0], [0, 0, h, h]])).T + tvec
        mbx, mby = abs(mblur[0]), abs(mblur[1])
        pad = blur * 3 + glow * 0 + max(mbx, mby)
        x0, y0, x1, y1 = self._region(corners[:, 0].min() - pad, corners[:, 1].min() - pad,
                                      corners[:, 0].max() + pad, corners[:, 1].max() + pad, clip)
        if x1 <= x0 or y1 <= y0:
            return None
        M = np.hstack([A, (tvec - [x0, y0])[:, None]]).astype(np.float32)
        patch = cv2.warpAffine(spr.arr, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderValue=0)
        if blur > 0.3:
            patch = cv2.GaussianBlur(patch, (0, 0), blur)
        if mbx > 1 or mby > 1:
            kx, ky = max(1, int(mbx)), max(1, int(mby))
            patch = cv2.blur(patch, (kx, ky))
        if mask_only:
            full = np.zeros((H, W), np.float32)
            full[y0:y1, x0:x1] = np.maximum(patch[..., 0], patch[..., 1] if outline else 0) if not outline else patch[..., 1]
            return full
        if shadow > 0:
            self.put(patch[..., 2], "#000000", x0, y0, shadow_op * opacity, target=target)
        if glow > 0:
            g = cv2.GaussianBlur(patch[..., 0] if not outline else patch[..., 1], (0, 0), max(4, size * 0.12))
            self.put(g, glow_color or color, x0, y0, glow * opacity, "add", target=target)
        if outline:
            self.put(patch[..., 1], color, x0, y0, opacity, blend, target=target)
        else:
            if stroke:
                self.put(patch[..., 1], stroke_color, x0, y0, opacity, blend, target=target)
            self.put(patch[..., 0], color, x0, y0, opacity, blend, target=target)
        return (x0, y0, x1, y1)

    def text_mask(self, txt, fname, size, x, y, **kw) -> np.ndarray:
        m = self.text(txt, fname, size, x, y, mask_only=True, **kw)
        return m if m is not None else np.zeros((H, W), np.float32)

    def letters(self, txt, fname, size, x, y, fn: Callable[[int, int], dict], wght=None, tracking=0.0, anchor="c", **kw):
        """Dibuja letra por letra. fn(i, n) → dict con dx, dy, scale, rot, opacity, blur, color…"""
        fnt = font(fname, int(size), wght)
        total = track_width(fnt, txt, tracking)
        left = {"c": x - total / 2, "l": x, "r": x - total}[anchor]
        n = len(txt)
        for i, ch in enumerate(txt):
            if ch == " ":
                continue
            off = track_offset(fnt, txt, i, tracking)
            cw = fnt.getlength(ch)
            p = dict(kw)
            p.update(fn(i, n))
            dx, dy = p.pop("dx", 0), p.pop("dy", 0)
            self.text(ch, fname, size, left + off + cw / 2 + dx, y + dy, wght=wght, **p)

    # ---------------------------------------------------------- formas
    def rect(self, x0, y0, x1, y1, color, opacity=1.0, radius=0, blend="normal", feather=0.0):
        X0, Y0, X1, Y1 = self._region(x0 - feather, y0 - feather, x1 + feather, y1 + feather)
        if X1 <= X0 or Y1 <= Y0:
            return
        if radius <= 0 and feather <= 0:
            self.put(np.ones((Y1 - Y0, X1 - X0), np.float32), color, X0, Y0, opacity, blend)
            return
        yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32) + 0.5
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        hw, hh = (x1 - x0) / 2 - radius, (y1 - y0) / 2 - radius
        dx = np.maximum(np.abs(xx - cx) - hw, 0)
        dy = np.maximum(np.abs(yy - cy) - hh, 0)
        d = np.sqrt(dx * dx + dy * dy) - radius
        a = np.clip(0.5 - d / max(1.0, feather + 1.0), 0, 1)
        self.put(a.astype(np.float32), color, X0, Y0, opacity, blend)

    def ring(self, cx, cy, r, width, color, a0=-90.0, a1=270.0, opacity=1.0, cap=True, blend="normal"):
        """Arco de anillo (donut) antialiasado entre ángulos a0→a1 (grados, 0 = derecha, sentido horario)."""
        if a1 - a0 <= 0.05:
            return
        R = r + width / 2 + 2
        X0, Y0, X1, Y1 = self._region(cx - R, cy - R, cx + R, cy + R)
        yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32) + 0.5
        dx, dy = xx - cx, yy - cy
        rad = np.sqrt(dx * dx + dy * dy)
        ang = (np.degrees(np.arctan2(dy, dx)) - a0) % 360
        span = min(360.0, a1 - a0)
        band = np.clip(width / 2 - np.abs(rad - r) + 0.5, 0, 1)
        if span >= 359.9:
            a = band
        else:
            # distancia en px a los bordes angulares para antialias
            edge = np.minimum(ang, span - ang) * np.pi / 180 * rad
            inside = ang <= span
            a = band * np.where(inside, np.clip(edge + 0.5, 0, 1), 0)
            if cap:
                for ae in (a0, a0 + span):
                    ex, ey = cx + r * math.cos(math.radians(ae)), cy + r * math.sin(math.radians(ae))
                    dd = np.sqrt((xx - ex) ** 2 + (yy - ey) ** 2)
                    a = np.maximum(a, np.clip(width / 2 - dd + 0.5, 0, 1))
        self.put(a.astype(np.float32), color, X0, Y0, opacity, blend)

    def circle(self, cx, cy, r, color, opacity=1.0, width=0, blend="normal", feather=0.0):
        R = r + width + feather + 2
        X0, Y0, X1, Y1 = self._region(cx - R, cy - R, cx + R, cy + R)
        if X1 <= X0 or Y1 <= Y0:
            return
        yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32) + 0.5
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        f = max(1.0, feather)
        if width > 0:
            a = np.clip((width / 2 - np.abs(d - r)) / f + 0.5, 0, 1)
        else:
            a = np.clip((r - d) / f + 0.5, 0, 1)
        self.put(a.astype(np.float32), color, X0, Y0, opacity, blend)

    def line(self, x0, y0, x1, y1, width, color, opacity=1.0, blend="normal"):
        R = width / 2 + 2
        X0, Y0, X1, Y1 = self._region(min(x0, x1) - R, min(y0, y1) - R, max(x0, x1) + R, max(y0, y1) + R)
        if X1 <= X0 or Y1 <= Y0:
            return
        yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32) + 0.5
        vx, vy = x1 - x0, y1 - y0
        L2 = vx * vx + vy * vy + 1e-9
        tt = np.clip(((xx - x0) * vx + (yy - y0) * vy) / L2, 0, 1)
        d = np.sqrt((xx - x0 - tt * vx) ** 2 + (yy - y0 - tt * vy) ** 2)
        a = np.clip(width / 2 - d + 0.5, 0, 1)
        self.put(a.astype(np.float32), color, X0, Y0, opacity, blend)

    def poly(self, pts, color, opacity=1.0, width=0, blend="normal"):
        """Polígono relleno (width=0) o contorno, antialiasado (supermuestreo 4x)."""
        pts = np.asarray(pts, np.float32)
        X0, Y0, X1, Y1 = self._region(pts[:, 0].min() - width - 2, pts[:, 1].min() - width - 2,
                                      pts[:, 0].max() + width + 2, pts[:, 1].max() + width + 2)
        if X1 <= X0 or Y1 <= Y0:
            return
        k = 4
        m = np.zeros(((Y1 - Y0) * k, (X1 - X0) * k), np.uint8)
        q = ((pts - [X0, Y0]) * k).round().astype(np.int32)
        if width > 0:
            cv2.polylines(m, [q], True, 255, int(width * k), lineType=cv2.LINE_8)
        else:
            cv2.fillPoly(m, [q], 255)
        a = cv2.resize(m, (X1 - X0, Y1 - Y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        self.put(a, color, X0, Y0, opacity, blend)

    # ---------------------------------------------------------- efectos de lienzo
    def darken(self, amount, color="#000000"):
        if amount > 0:
            self.img *= 1 - amount
            self.img += hexc(color) * amount

    def blur(self, sigma):
        if sigma > 0.5:
            small = cv2.resize(self.img, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
            small = cv2.GaussianBlur(small, (0, 0), sigma / 4)
            self.img[:] = cv2.resize(small, (W, H), interpolation=cv2.INTER_LINEAR)

    def composite(self, mask: np.ndarray, fill, opacity=1.0):
        """Rellena una máscara (H,W) con color o imagen."""
        a = mask[..., None] * opacity
        f = hexc(fill) if isinstance(fill, str) else fill
        self.img *= 1 - a
        self.img += f * a

    def clip_frame(self, clip: Clip, t_src: float, zoom=1.0, dx=0.0, dy=0.0) -> np.ndarray:
        fr = reader(clip.path).at(t_src).astype(np.float32) / 255.0
        if zoom != 1.0 or dx or dy:
            fr = warp(fr, zoom, dx, dy)
        return fr

    def band(self, y0, y1, color="#000000", amount=0.4):
        """Franja oscura suave (sin bordes): 0 en y0 y y1, máxima en el centro."""
        Y0, Y1 = max(0, int(y0)), min(H, int(y1))
        if Y1 <= Y0 or amount <= 0:
            return
        yy = np.linspace(0, 1, int(y1) - int(y0), dtype=np.float32)
        ramp = (np.clip(np.sin(np.pi * yy), 0, 1) ** 1.2 * amount)[Y0 - int(y0):Y1 - int(y0), None]
        self.put(np.repeat(ramp, W, axis=1), color, 0, Y0)

    def gradient_v(self, y0, y1, color, a0=0.0, a1=1.0):
        """Degradado vertical de opacidad (para dar legibilidad al texto)."""
        Y0, Y1 = max(0, int(y0)), min(H, int(y1))
        if Y1 <= Y0:
            return
        ramp = np.linspace(a0, a1, Y1 - Y0, dtype=np.float32)[:, None]
        a = np.repeat(ramp, W, axis=1)
        self.put(a, color, 0, Y0)


# ======================================================================= transformaciones de imagen
def warp(img, zoom=1.0, dx=0.0, dy=0.0, rot=0.0, cx=W / 2, cy=H / 2, border=cv2.BORDER_REFLECT_101):
    if zoom == 1.0 and dx == 0 and dy == 0 and rot == 0:
        return img
    M = cv2.getRotationMatrix2D((cx, cy), rot, zoom)
    M[0, 2] += dx
    M[1, 2] += dy
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=border)


def zoom_blur(img, zoom, amount, n=6, cx=W / 2, cy=H / 2):
    """Desenfoque radial (zoom) aproximado promediando copias escaladas."""
    acc = np.zeros_like(img)
    for k in range(n):
        z = zoom * (1 + amount * k / max(1, n - 1))
        acc += warp(img, z, cx=cx, cy=cy)
    return acc / n


def motion_blur(img, kx=0, ky=0):
    kx, ky = int(abs(kx)), int(abs(ky))
    if kx < 2 and ky < 2:
        return img
    return cv2.blur(img, (max(1, kx), max(1, ky)))


# ======================================================================= transiciones
def transition(kind, A, B, p, params=None, t=0.0):
    """Combina el plano saliente A con el entrante B. p de 0 a 1."""
    params = params or {}
    if kind == "cut":
        return B if p >= 0.5 else A
    if kind in ("whip", "whip-l", "whip-r", "whip-u", "whip-d"):
        d = {"whip": "l", "whip-l": "l", "whip-r": "r", "whip-u": "u", "whip-d": "d"}[kind]
        e = ease_io(p)
        speed = 6 * p * (1 - p) * 4  # derivada aproximada, máx en p=.5
        blur = 260 * speed / 6
        sgn = -1 if d in ("l", "u") else 1
        if d in ("l", "r"):
            a = warp(A, 1.0, sgn * e * W, 0, border=cv2.BORDER_CONSTANT)
            b = warp(B, 1.0, sgn * (e - 1) * W, 0, border=cv2.BORDER_CONSTANT)
            out = a + b
            return motion_blur(out, blur, 0)
        a = warp(A, 1.0, 0, sgn * e * H, border=cv2.BORDER_CONSTANT)
        b = warp(B, 1.0, 0, sgn * (e - 1) * H, border=cv2.BORDER_CONSTANT)
        return motion_blur(a + b, 0, blur * 1.4)
    if kind == "zoom":
        amt = params.get("amount", 0.9)
        if p < 0.5:
            q = ease_in(p * 2, 2)
            return zoom_blur(A, 1 + amt * q, 0.25 * q)
        q = 1 - ease_out((p - 0.5) * 2, 2)
        return zoom_blur(B, 1 + amt * 0.6 * q, 0.25 * q)
    if kind == "zoomout":
        if p < 0.5:
            q = ease_in(p * 2, 2)
            return zoom_blur(A, max(1.0, 1 + 0.6 * (1 - q) - 0.6), 0.2 * q)
        q = 1 - ease_out((p - 0.5) * 2, 2)
        return zoom_blur(B, 1 + 0.9 * q, 0.2 * q)
    if kind == "glitch":
        src = A if p < 0.5 else B
        rng = np.random.default_rng(int(t * FPS) + 7)
        out = src.copy()
        strength = 1 - abs(p - 0.5) * 2
        for _ in range(int(6 + 10 * strength)):
            y = rng.integers(0, H - 40)
            h = rng.integers(10, 140)
            out[y:y + h] = np.roll(src[y:y + h], int(rng.integers(-90, 90) * strength), axis=1)
        sh = int(26 * strength)
        out[..., 2] = np.roll(out[..., 2], sh, axis=1)
        out[..., 0] = np.roll(out[..., 0], -sh, axis=1)
        return out
    if kind == "fade":
        return A * (1 - p) + B * p
    if kind == "blurfade":
        s = 1 - abs(p - 0.5) * 2
        mix = A * (1 - ease_io(p)) + B * ease_io(p)
        if s > 0.05:
            small = cv2.resize(mix, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
            small = cv2.GaussianBlur(small, (0, 0), 6 * s)
            mix = cv2.resize(small, (W, H))
        return mix
    if kind == "lightdip":
        col = hexc(params.get("color", "#fff6ea"))
        s = 1 - abs(p - 0.5) * 2
        base = A if p < 0.5 else B
        return base * (1 - s * 0.9) + col * s * 0.9
    if kind == "iris":
        cx, cy = params.get("cx", W / 2), params.get("cy", H / 2)
        r = ease_in_out_r(p) * math.hypot(W, H)
        yy, xx = np.ogrid[:H, :W]
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        m = np.clip((r - d) / 3 + 0.5, 0, 1).astype(np.float32)[..., None]
        return A * (1 - m) + B * m
    if kind == "slices":
        n = params.get("n", 6)
        vertical = params.get("vertical", True)
        out = A.copy()
        for k in range(n):
            q = ease_io(clamp(p * 1.6 - k * 0.6 / n))
            if vertical:
                x0, x1 = k * W // n, (k + 1) * W // n
                hh = int(q * H)
                if k % 2 == 0:
                    out[:hh, x0:x1] = B[:hh, x0:x1]
                else:
                    out[H - hh:, x0:x1] = B[H - hh:, x0:x1]
            else:
                y0, y1 = k * H // n, (k + 1) * H // n
                ww = int(q * W)
                if k % 2 == 0:
                    out[y0:y1, :ww] = B[y0:y1, :ww]
                else:
                    out[y0:y1, W - ww:] = B[y0:y1, W - ww:]
        return out
    if kind == "push-up":
        e = ease_io(p)
        a = warp(A, 1.0, 0, -e * H, border=cv2.BORDER_CONSTANT)
        b = warp(B, 1.0, 0, (1 - e) * H, border=cv2.BORDER_CONSTANT)
        return a + b
    raise ValueError(kind)


def ease_in_out_r(p):
    return ease_in(p, 2) if p < 0.5 else ease_io(p)


# ======================================================================= línea de tiempo
@dataclass
class Shot:
    t0: float
    t1: float
    clip: Clip | None = None
    at: float = 0.0                       # segundo del clip donde empieza el plano
    zoom: tuple = (1.0, 1.0)              # zoom de inicio y fin (Ken Burns)
    pan: tuple = (0.0, 0.0, 0.0, 0.0)     # dx0, dy0, dx1, dy1 (px)
    rot: tuple = (0.0, 0.0)
    ease: Callable | None = None
    speed: float = 1.0
    timemap: Callable | None = None       # función t_local → t_clip (rampas de velocidad)
    trans: str = "cut"                    # transición de ENTRADA
    tdur: float = 0.0
    tparams: dict = field(default_factory=dict)
    dim: float = 0.0                      # oscurecer el plano (0–1)
    blur: float = 0.0
    draw: Callable | None = None          # escena dibujada (sin clip): fn(ctx, t_local)
    bg: str = "#000000"

    def src_time(self, t):
        lt = t - self.t0
        if self.timemap:
            return self.at + self.timemap(lt)
        return self.at + lt * self.speed


@dataclass
class Layer:
    t0: float
    t1: float
    fn: Callable
    behind: bool = False
    z: int = 0


class Video:
    def __init__(self, name: str, dur: float, grade: str = ""):
        self.name, self.dur, self.grade = name, dur, grade
        self.clips: list[Clip] = []
        self.shots: list[Shot] = []
        self.layers: list[Layer] = []
        self.hits: list[dict] = []
        self.sfx_list: list[dict] = []
        self.vo: dict | None = None
        self.music_spec: dict | None = None
        self.grain = 0.035
        self.vignette = 0.25
        self.bloom = 0.0
        self.post: list[Callable] = []    # efectos globales extra: fn(ctx)
        self.pre_layers: list[Callable] = []

    # -------------------------------------------------- construcción
    def clip(self, ref, desde=0.0, dur=4.0, **kw) -> Clip:
        c = Clip(ref, desde, dur, grade=kw.pop("grade", self.grade), **kw)
        self.clips.append(c)
        return c

    def shot(self, t0, t1, clip, **kw) -> Shot:
        s = Shot(t0, t1, clip, **kw)
        self.shots.append(s)
        self.shots.sort(key=lambda s: s.t0)
        return s

    def scene(self, t0, t1, draw, bg="#000000", **kw) -> Shot:
        """Escena ilustrada: se dibuja en código, sin material de video."""
        return self.shot(t0, t1, None, draw=draw, bg=bg, **kw)

    def layer(self, t0, t1, fn, behind=False, z=0):
        self.layers.append(Layer(t0, t1, fn, behind, z))
        self.layers.sort(key=lambda l: l.z)

    def hit(self, t, shake=0.0, rgb=0.0, flash=0.0, punch=0.0, decay=0.22, flash_color="#ffffff"):
        self.hits.append(dict(t=t, shake=shake, rgb=rgb, flash=flash, punch=punch, decay=decay, flash_color=flash_color))

    def sfx(self, t, sid, gain=0.0, align="onset"):
        self.sfx_list.append(dict(t=t, id=sid, gain=gain, align=align))

    def voice(self, name, offset=0.0, gain=0.0):
        self.vo = dict(name=name, offset=offset, gain=gain)

    def music(self, mid, start, offset=0.0, gain=-14.0, fade_in=0.0, fade_out=1.5, duck=True, end=None):
        self.music_spec = dict(id=mid, start=start, offset=offset, gain=gain, fade_in=fade_in, fade_out=fade_out, duck=duck, end=end)

    # -------------------------------------------------- render de un fotograma
    def shot_at(self, t) -> int:
        for i, s in enumerate(self.shots):
            if s.t0 <= t < s.t1:
                return i
        return len(self.shots) - 1 if t >= self.shots[-1].t0 else 0

    def punch_at(self, t):
        return 1 + sum(h["punch"] * pulse(t, h["t"], 0.035, h["decay"]) for h in self.hits if h["punch"])

    def render_shot(self, s: Shot, t, need_matte=False):
        st = s.src_time(t)
        m = None
        if s.draw is not None:
            fr = np.empty((H, W, 3), np.float32)
            fr[:] = hexc(s.bg)
            c = Ctx(fr, t, self)
            s.draw(c, t - s.t0)
            fr = c.img
        else:
            fr = reader(s.clip.path).at(st).astype(np.float32) * (1 / 255.0)
        if need_matte and s.clip is not None and s.clip.alpha:
            m = reader(s.clip.alpha, gray=True).at(st, blend=False).astype(np.float32) * (1 / 255.0)
        lt = prog(t, s.t0, s.t1)
        e = s.ease(lt) if s.ease else lt
        z = lerp(s.zoom[0], s.zoom[1], e) * self.punch_at(t)
        dx, dy = lerp(s.pan[0], s.pan[2], e), lerp(s.pan[1], s.pan[3], e)
        r = lerp(s.rot[0], s.rot[1], e)
        if z != 1 or dx or dy or r:
            fr = warp(fr, z, dx, dy, r)
            if m is not None:
                m = warp(m, z, dx, dy, r)
        if s.blur > 0.5:
            small = cv2.resize(fr, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
            fr = cv2.resize(cv2.GaussianBlur(small, (0, 0), s.blur / 4), (W, H))
        if s.dim > 0:
            fr *= 1 - s.dim
        return fr, m

    def base_at(self, t, need_matte=False):
        i = self.shot_at(t)
        s = self.shots[i]
        # ¿estamos dentro de la transición de entrada del plano siguiente o de este?
        for j in (i, i + 1):
            if 0 < j < len(self.shots):
                b = self.shots[j]
                if b.tdur > 0 and b.trans != "cut" and b.t0 - b.tdur / 2 <= t < b.t0 + b.tdur / 2:
                    a = self.shots[j - 1]
                    p = (t - (b.t0 - b.tdur / 2)) / b.tdur
                    A, ma = self.render_shot(a, t, need_matte and p <= 0.5)
                    B, mb = self.render_shot(b, t, need_matte and p > 0.5)
                    out = transition(b.trans, A, B, p, b.tparams, t)
                    return out, (mb if p > 0.5 else ma)
        return self.render_shot(s, t, need_matte)

    def frame(self, n: int) -> np.ndarray:
        t = n / FPS
        active = [l for l in self.layers if l.t0 <= t < l.t1]
        need_matte = any(l.behind for l in active)
        img, m = self.base_at(t, need_matte)
        img = np.ascontiguousarray(img, dtype=np.float32)
        ctx = Ctx(img, t, self)
        ctx.matte = m
        for fn in self.pre_layers:
            fn(ctx)
        behind = [l for l in active if l.behind]
        if behind:
            under = img.copy()
            for l in behind:
                l.fn(ctx, t - l.t0, t)
            if m is not None:
                a = m[..., None]
                ctx.img = ctx.img * (1 - a) + under * a
        for l in active:
            if not l.behind:
                l.fn(ctx, t - l.t0, t)
        img = ctx.img
        # ------------------------------------------------ golpes: sacudida, separación RGB, flash
        shake = sum(h["shake"] * pulse(t, h["t"], 0.02, h["decay"]) for h in self.hits if h["shake"])
        if shake > 0.01:
            rng = np.random.default_rng(n * 13 + 1)
            dx, dy = rng.uniform(-1, 1, 2) * shake * 38
            rot = rng.uniform(-1, 1) * shake * 1.2
            img = warp(img, 1 + 0.05 * shake, dx, dy, rot)
        rgb = sum(h["rgb"] * pulse(t, h["t"], 0.02, h["decay"]) for h in self.hits if h["rgb"])
        if rgb > 0.02:
            sh = int(rgb * 22)
            img = img.copy()
            img[..., 2] = np.roll(img[..., 2], sh, axis=1)
            img[..., 0] = np.roll(img[..., 0], -sh, axis=1)
        for h in self.hits:
            if h["flash"]:
                f = h["flash"] * pulse(t, h["t"], 0.01, h["decay"] * 0.6)
                if f > 0.01:
                    img = img * (1 - f) + hexc(h["flash_color"]) * f
        ctx.img = img
        for fn in self.post:
            fn(ctx)
        img = ctx.img
        # ------------------------------------------------ bloom, viñeta, grano
        if self.bloom > 0:
            small = cv2.resize(img, (W // 6, H // 6), interpolation=cv2.INTER_AREA)
            bright = np.clip(small - 0.6, 0, 1) * 2.2
            glow = cv2.GaussianBlur(bright, (0, 0), 9)
            img = img + cv2.resize(glow, (W, H)) * self.bloom
        if self.vignette > 0:
            img = img * vignette_mask(self.vignette)[..., None]
        if self.grain > 0:
            img = img + grain_tile(n % 8)[..., None] * self.grain
        return img

    def frame_u8(self, n: int) -> np.ndarray:
        img = np.nan_to_num(self.frame(n), nan=0.0)
        return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


@lru_cache(maxsize=4)
def vignette_mask(strength):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
    return (1 - strength * np.clip(d - 0.45, 0, 1) ** 1.6).astype(np.float32)


@lru_cache(maxsize=8)
def grain_tile(k):
    rng = np.random.default_rng(1234 + k)
    small = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    return cv2.resize(small, (W, H), interpolation=cv2.INTER_LINEAR)


# ======================================================================= subtítulos karaoke
def caption_pages(words: list[dict], max_chars=18, max_words=3, gap_break=0.35):
    """Agrupa palabras (de Whisper) en 'páginas' de subtítulos cortos."""
    pages, cur = [], []
    for w in words:
        txt = " ".join(x["text"] for x in cur + [w])
        brk = cur and (len(txt) > max_chars or len(cur) >= max_words or w["start"] - cur[-1]["end"] > gap_break)
        if brk:
            pages.append(cur)
            cur = []
        cur.append(w)
        if w["text"][-1:] in ".?!,:" and len(cur) >= 1:
            pages.append(cur)
            cur = []
    if cur:
        pages.append(cur)
    out = []
    for i, p in enumerate(pages):
        t0 = p[0]["start"]
        t1 = pages[i + 1][0]["start"] if i + 1 < len(pages) else p[-1]["end"] + 0.4
        t1 = min(t1, p[-1]["end"] + 0.6)
        out.append({"words": p, "t0": t0, "t1": t1})
    return out


def load_vo(name) -> dict:
    with open(os.path.join(CACHE, "voz", f"{name}.json"), encoding="utf-8") as fh:
        return json.load(fh)


def words_between(vo, t0, t1):
    return [w for l in vo["lines"] for w in l["words"] if w["start"] >= t0 - 1e-3 and w["start"] < t1]


def word_time(vo, text, occurrence=1, after=0.0):
    """Tiempo de inicio de una palabra del guion (para sincronizar efectos con la voz)."""
    k = 0
    for l in vo["lines"]:
        for w in l["words"]:
            if w["start"] >= after and libreria_norm(w["text"]) == libreria_norm(text):
                k += 1
                if k == occurrence:
                    return w
    raise KeyError(text)


def libreria_norm(s):
    import unicodedata
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return "".join(c for c in s if c.isalnum())
