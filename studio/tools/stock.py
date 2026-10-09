"""Material de video real de Mixkit (licencia gratuita, uso comercial, sin atribución obligatoria).

  python3 tools/stock.py buscar boxing gym [--paginas 3]   → lista clips (id, vertical/horizontal, título)
  python3 tools/stock.py bajar scripts/stock/disciplina.json → descarga y prepara los clips de un video

Cada clip queda en public/stock/<id>.mp4 a 1080×1920 / 30 fps (los horizontales se bajan en 4K y se
recortan a vertical). Si el clip lleva `"recorte": true`, también se genera public/stock/<id>.fg.webm:
la persona sola con canal alfa (Robust Video Matting), para poner texto DETRÁS de ella.
Con `"cielo": "dia"` o `"noche"` el .fg.webm es todo menos el cielo (texto detrás de edificios o montañas).

Formato del manifiesto:
{"name": "disciplina", "clips": [{"id": 52079, "desde": 0.5, "dur": 6, "recorte": true, "x": 0.5}]}
  desde/dur  tramo a usar (s) · x  centro del recorte vertical en clips horizontales (0–1)
Los videos fuente se guardan en .cache/stock (no se suben a git); public/stock se regenera con esto.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.request

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
CACHE = os.path.join(ROOT, ".cache", "stock")
OUT = os.path.join(ROOT, "public", "stock")
MODEL = os.path.join(ROOT, ".cache", "models", "rvm_mobilenetv3_fp32.onnx")
MODEL_URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx"
UA = {"User-Agent": "Mozilla/5.0 (CORTE studio)"}
W, H, FPS = 1080, 1920, 30


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def download(url: str, path: str):
    if os.path.exists(path):
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".part"
    subprocess.run(["curl", "-s", "-f", "-L", "--retry", "4", "-A", UA["User-Agent"], "-o", tmp, url], check=True)
    os.replace(tmp, path)
    return path


def probe(path: str):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-show_entries", "format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True,
    )
    d = json.loads(out.stdout)
    s = d["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    return int(s["width"]), int(s["height"]), float(num) / float(den), float(d["format"]["duration"])


# ---------------------------------------------------------------- búsqueda
def search(tags: list[str], pages=2):
    seen = {}
    for tag in tags:
        for p in range(1, pages + 1):
            url = f"https://mixkit.co/free-stock-video/{tag}/" + (f"?page={p}" if p > 1 else "")
            try:
                html = get(url).decode("utf-8", "ignore")
            except Exception:
                break
            found = re.findall(r'href="/free-stock-video/([a-z0-9-]+)-([0-9]+)/"', html)
            if not found:
                break
            for slug, vid in found:
                seen.setdefault(int(vid), slug)
    return seen


def orientation(vid: int) -> str:
    path = download(f"https://assets.mixkit.co/videos/{vid}/{vid}-360.mp4", os.path.join(CACHE, "prev", f"{vid}.mp4"))
    w, h, _, _ = probe(path)
    return "vertical" if h > w else "horizontal"


# ---------------------------------------------------------------- recorte de personas (RVM)
def matte(src: str, dst: str):
    """Genera un webm VP9 con alfa que contiene solo a la(s) persona(s) del clip."""
    import onnxruntime as ort

    download(MODEL_URL, MODEL)
    sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
    rec = [np.zeros((1, 1, 1, 1), dtype=np.float32)] * 4
    ratio = np.array([0.25], dtype=np.float32)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "pipe:0",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "8",
         "-auto-alt-ref", "0", dst],
        stdin=subprocess.PIPE,
    )
    size = W * H * 3
    n = 0
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        rgb = np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3)
        x = (rgb.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
        fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ratio})
        a = pha[0, 0]
        # bordes más limpios: quita el "halo" tenue y endurece un poco la máscara
        a = np.clip((a - 0.08) / 0.84, 0, 1)
        rgba = np.dstack([rgb, (a * 255).astype(np.uint8)])
        enc.stdin.write(rgba.tobytes())
        n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    return n


def sky_matte(src: str, dst: str, mode: str = "dia"):
    """Como `matte`, pero deja todo MENOS el cielo (para poner texto detrás de edificios o montañas).

    El cielo se detecta por color (azul, o blanco neutro de nubes) y por estar conectado al borde
    superior; la máscara se suaviza en el tiempo para que no "tiemble".
    """
    from scipy import ndimage

    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "pipe:0",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "8",
         "-auto-alt-ref", "0", dst],
        stdin=subprocess.PIPE,
    )
    size = W * H * 3
    k = 4  # la máscara se calcula a 1/4 de resolución
    prev = None
    n = 0
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        rgb = np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3)
        small = rgb[::k, ::k].astype(np.int16)
        r, g, b = small[..., 0], small[..., 1], small[..., 2]
        mx, mn = small.max(-1), small.min(-1)
        blue = (b - r > 12) & (b >= g - 12)
        if mode == "dia":  # de día el cielo es claro: así la piedra en sombra (gris azulada) no cuenta como cielo
            blue &= (mx > 165) & ((mx - mn) > 0.18 * mx)
        # nubes: claras, casi neutras o azuladas (la piedra iluminada es más cálida: rojo > azul)
        cloud = (mn > 150) & (b >= r - 4) & (mx - mn < 50) if mode == "dia" else (mn > 185) & (mx - mn < 30)
        sky = blue | cloud
        sky = ndimage.binary_opening(sky, iterations=2)
        lab, _ = ndimage.label(sky)
        top = np.unique(lab[0][lab[0] > 0])
        sky = np.isin(lab, top)
        sky = ndimage.binary_closing(sky, iterations=3)
        m = sky.astype(np.float32)
        prev = m if prev is None else prev * 0.6 + m * 0.4
        soft = ndimage.gaussian_filter(prev, 1.2)
        big = np.repeat(np.repeat(soft, k, 0), k, 1)[:H, :W]
        alpha = np.clip((1 - big - 0.15) / 0.7, 0, 1)
        rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
        enc.stdin.write(rgba.tobytes())
        n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    return n


# ---------------------------------------------------------------- preparación
def prepare(clip: dict, force=False):
    vid = int(clip["id"])
    os.makedirs(OUT, exist_ok=True)
    dst = os.path.join(OUT, f"{vid}.mp4")
    if force or not os.path.exists(dst):
        prev = orientation(vid)
        # los horizontales se bajan en 4K para recortarlos a vertical sin perder nitidez
        qualities = ["1080", "720"] if prev == "vertical" else ["2160", "1080", "720"]
        src = None
        for q in qualities:
            try:
                src = download(f"https://assets.mixkit.co/videos/{vid}/{vid}-{q}.mp4", os.path.join(CACHE, f"{vid}-{q}.mp4"))
                break
            except subprocess.CalledProcessError:
                continue
        if src is None:
            raise RuntimeError(f"Mixkit no entrega el clip {vid} en ninguna calidad")
        w, h, fps, dur = probe(src)
        start = float(clip.get("desde", 0))
        length = min(float(clip.get("dur", dur - start)), dur - start)
        if h >= w:
            vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"
        else:
            cw = int(h * W / H) // 2 * 2
            cx = float(clip.get("x", 0.5))
            x0 = int(max(0, min(w - cw, cx * w - cw / 2)))
            vf = f"crop={cw}:{h}:{x0}:0,scale={W}:{H}"
        vf += f",fps={FPS},setsar=1"
        # GOP corto para que Remotion pueda saltar a cualquier frame rápido
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(length), "-i", src, "-vf", vf, "-an",
             "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-g", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dst],
            check=True,
        )
        print(f"  ✓ {vid} ({'vertical' if h >= w else 'horizontal→vertical'}, {length:.1f}s)", file=sys.stderr)
    fg = os.path.join(OUT, f"{vid}.fg.webm")
    if clip.get("recorte") and (force or not os.path.exists(fg)):
        n = matte(dst, fg)
        print(f"  ✓ {vid} recorte de persona ({n} frames)", file=sys.stderr)
    if clip.get("cielo") and (force or not os.path.exists(fg)):
        n = sky_matte(dst, fg, "noche" if clip["cielo"] == "noche" else "dia")
        print(f"  ✓ {vid} recorte de cielo ({n} frames)", file=sys.stderr)


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    cmd, rest = args[0], args[1:]
    force = "--force" in rest
    rest = [a for a in rest if a != "--force"]
    if cmd == "buscar":
        pages = 2
        if "--paginas" in rest:
            i = rest.index("--paginas")
            pages = int(rest[i + 1])
            del rest[i : i + 2]
        for vid, slug in sorted(search(rest, pages).items()):
            print(vid, slug)
    elif cmd == "bajar":
        for path in rest:
            spec = json.load(open(path, encoding="utf-8"))
            print(f"▶ {spec['name']}", file=sys.stderr)
            for clip in spec["clips"]:
                try:
                    prepare(clip, force)
                except Exception as e:  # un clip caído no frena el resto
                    print(f"  ✗ {clip['id']}: {e}", file=sys.stderr)
    else:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
