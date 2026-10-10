"""Recorte de personas con Robust Video Matting (modelo público, ONNX, corre en CPU).

matte("cache/conform/clip.mp4") → "cache/conform/clip.alpha.mkv": video en escala de grises con el alfa de la
persona, sin pérdidas (FFV1). El motor lo usa para dibujar texto DETRÁS de la persona.
"""
from __future__ import annotations

import os
import subprocess

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MODEL = os.path.join(ROOT, "cache", "modelos", "rvm_mobilenetv3_fp32.onnx")
MODEL_URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx"
W, H, FPS = 1080, 1920, 30


def matte(src: str) -> str:
    dst = src.replace(".mp4", ".alpha.mkv")
    if os.path.exists(dst):
        return dst
    import onnxruntime as ort
    import libreria

    libreria.download(MODEL_URL, MODEL)
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    sess = ort.InferenceSession(MODEL, opts, providers=["CPUExecutionProvider"])
    rec = [np.zeros((1, 1, 1, 1), dtype=np.float32)] * 4
    ratio = np.array([0.25], dtype=np.float32)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", "scale=in_color_matrix=bt709:in_range=tv,format=rgb24",
                            "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], stdout=subprocess.PIPE)
    tmp = dst + ".part.mkv"
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "pipe:0", "-c:v", "ffv1", tmp], stdin=subprocess.PIPE)
    size = W * H * 3
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        rgb = np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3)
        x = (rgb.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
        _, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3],
                                       "downsample_ratio": ratio})
        a = np.clip((pha[0, 0] - 0.06) / 0.88, 0, 1)   # bordes más limpios, sin halo
        enc.stdin.write((a * 255 + 0.5).astype(np.uint8).tobytes())
    enc.stdin.close()
    enc.wait()
    dec.wait()
    os.replace(tmp, dst)
    return dst
