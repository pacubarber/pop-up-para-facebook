"""Render de un video definido en ediciones/.

  python3 motor/render.py ediciones/nocturna.py                    → salida/nocturna.mp4 + salida/nocturna.jpg
  python3 motor/render.py ediciones/nocturna.py --frames 0.5,4.8   → fotogramas sueltos para revisar (cache/frames/)
  python3 motor/render.py ediciones/nocturna.py --desde 4 --hasta 9 → tramo rápido sin audio (cache/tramos/)
  python3 motor/render.py ediciones/nocturna.py --hoja             → hoja de contactos del video final (cada 0.5 s)

Renderiza en paralelo por tramos (un proceso por núcleo) y une los tramos con FFmpeg.
"""
from __future__ import annotations

import argparse
import importlib.util
import multiprocessing as mp
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import audio  # noqa: E402
import motor  # noqa: E402
from motor import CACHE, FPS, H, ROOT, W  # noqa: E402

ENC = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
VF_OUT = "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"

_video = None


def load(path: str):
    spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3].replace("-", "_"), path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.build()


def prepare(v):
    t = time.time()
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(lambda c: c.prepare() if not c.matte else None, v.clips))
    for c in v.clips:
        if c.matte:
            c.prepare()
    print(f"· {len(v.clips)} clips listos ({time.time() - t:.0f}s)")


def _worker(args):
    a, b, out = args
    cv2.setNumThreads(1)
    v = _video
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "pipe:0", "-vf", VF_OUT, *ENC, "-preset", "veryfast", "-crf", "12", out],
                           stdin=subprocess.PIPE)
    t0 = time.time()
    for n in range(a, b):
        enc.stdin.write(v.frame_u8(n).tobytes())
        if (n - a) % 90 == 89:
            print(f"  tramo {a}-{b}: {n - a + 1}/{b - a} ({(n - a + 1) / (time.time() - t0):.1f} fps)", flush=True)
    enc.stdin.close()
    enc.wait()
    return out


def render_frames(v, n0, n1, out, jobs):
    global _video
    _video = v
    tmp = os.path.join(CACHE, "tramos", v.name)
    os.makedirs(tmp, exist_ok=True)
    total = n1 - n0
    jobs = max(1, min(jobs, total // 30 or 1))
    edges = [n0 + total * k // jobs for k in range(jobs + 1)]
    parts = [(edges[k], edges[k + 1], os.path.join(tmp, f"parte-{k:02d}.mp4")) for k in range(jobs)]
    with mp.get_context("fork").Pool(jobs) as pool:
        files = pool.map(_worker, parts)
    lst = os.path.join(tmp, "lista.txt")
    with open(lst, "w") as fh:
        for f in files:
            fh.write(f"file '{f}'\n")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", out], check=True)
    return out


def contact_sheet(path, out, step=0.5, cols=8):
    d = motor.libreria.probe(path)["dur"]
    k = int(round(step * FPS))
    vf = f"select='not(mod(n\\,{k}))',scale=216:384,drawtext=text='%{{pts\\:hms}}':x=4:y=4:fontsize=16:fontcolor=yellow:" \
         f"box=1:boxcolor=black@0.6,tile={cols}x{int(d / step / cols) + 1}:padding=3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-vf", vf, "-fps_mode", "vfr", "-frames:v", "1", out], check=True)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("edicion")
    ap.add_argument("--frames", default="")
    ap.add_argument("--desde", type=float)
    ap.add_argument("--hasta", type=float)
    ap.add_argument("--jobs", type=int, default=os.cpu_count() or 4)
    ap.add_argument("--hoja", action="store_true")
    ap.add_argument("--salida", default=os.path.join(ROOT, "salida"))
    a = ap.parse_args()

    v = load(a.edicion)
    if a.hoja:
        mp4 = os.path.join(a.salida, f"{v.name}.mp4")
        print(contact_sheet(mp4, os.path.join(CACHE, "frames", f"{v.name}-hoja.jpg")))
        return
    prepare(v)

    if a.frames:
        os.makedirs(os.path.join(CACHE, "frames"), exist_ok=True)
        outs = []
        for ts in a.frames.split(","):
            t = float(ts)
            img = v.frame_u8(int(round(t * FPS)))
            p = os.path.join(CACHE, "frames", f"{v.name}-{t:06.2f}.jpg")
            cv2.imwrite(p, img, [cv2.IMWRITE_JPEG_QUALITY, 88])
            outs.append(p)
        if len(outs) > 1:
            sheet = os.path.join(CACHE, "frames", f"{v.name}-muestra.jpg")
            row = [cv2.resize(cv2.imread(p), (360, 640)) for p in outs]
            import numpy as np
            while len(row) % 6:
                row.append(np.zeros_like(row[0]))
            rows = [np.hstack(row[i:i + 6]) for i in range(0, len(row), 6)]
            cv2.imwrite(sheet, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
            print(sheet)
        else:
            print(outs[0])
        return

    t0 = time.time()
    if a.desde is not None or a.hasta is not None:
        n0 = int(round((a.desde or 0) * FPS))
        n1 = int(round((a.hasta or v.dur) * FPS))
        out = os.path.join(CACHE, "tramos", f"{v.name}-{n0}-{n1}.mp4")
        render_frames(v, n0, n1, out, a.jobs)
        print(f"✓ {out} ({time.time() - t0:.0f}s)")
        return

    n = int(round(v.dur * FPS))
    silent = os.path.join(CACHE, "tramos", f"{v.name}-video.mp4")
    render_frames(v, 0, n, silent, a.jobs)
    wav = os.path.join(CACHE, "tramos", f"{v.name}-audio.wav")
    audio.mix(v, wav)
    os.makedirs(a.salida, exist_ok=True)
    out = os.path.join(a.salida, f"{v.name}.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a", *ENC,
                    "-preset", "slow", "-crf", "21", "-maxrate", "5M", "-bufsize", "10M", "-profile:v", "high",
                    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out], check=True)
    poster_t = getattr(v, "poster", v.dur * 0.3)
    cv2.imwrite(os.path.join(a.salida, f"{v.name}.jpg"), v.frame_u8(int(poster_t * FPS)), [cv2.IMWRITE_JPEG_QUALITY, 86])
    size = os.path.getsize(out) / 1e6
    print(f"✓ {out} · {v.dur:.1f}s · {size:.1f} MB · render {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
