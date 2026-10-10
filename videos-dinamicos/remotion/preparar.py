"""Deja listo public/ para que Remotion renderice los videos descritos en videos/*.json.

  python3 preparar.py videos/corte-4-trucos-b.json

Por cada JSON:
  · voz: genera (o reutiliza de cache/voz) la locución del guion con el mismo flujo de Python
    (OpenAI TTS o locución externa + Whisper) → public/voz/<nombre>.wav y los tiempos por palabra en .json
  · efectos: sintetiza con motor/sonido.py los que use el video → public/sonidos/<id>.wav y en
    public/sonidos/indice.json la duración, el ataque y el pico de cada uno (para alinearlos al golpe)
  · fuentes (Google Fonts) y textura de grano
"""
from __future__ import annotations

import json
import os
import shutil
import sys
import wave

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "motor"))
import audio  # noqa: E402
import motor  # noqa: E402
import sonido  # noqa: E402
import voz  # noqa: E402

PUB = os.path.join(HERE, "public")

# nombre en motor.FONTS → archivo en public/fuentes (los mismos que carga src/motor/fuentes.ts)
FUENTES = {
    "inter": "inter-tight.ttf",
    "inter-i": "inter-tight-italic.ttf",
    "serif": "instrument-serif.ttf",
    "serif-i": "instrument-serif-italic.ttf",
    "mono": "jetbrains-mono.ttf",
}


def preparar_voz(spec: dict, base: str) -> None:
    guion_path = os.path.normpath(os.path.join(base, spec["voz"]["guion"]))
    guion = json.load(open(guion_path, encoding="utf-8"))
    name = guion["name"]
    wav = os.path.join(voz.CACHE, f"{name}.wav")
    meta = os.path.join(voz.CACHE, f"{name}.json")
    if not (os.path.exists(wav) and os.path.exists(meta)):
        voz.from_audio(guion) if guion.get("audio") else voz.build(guion)
    os.makedirs(os.path.join(PUB, "voz"), exist_ok=True)
    shutil.copyfile(wav, os.path.join(PUB, "voz", f"{name}.wav"))
    d = json.load(open(meta, encoding="utf-8"))
    out = {"nombre": name, "dur": d["dur"],
           "lineas": [{"texto": l["text"], "inicio": l["start"], "fin": l["end"],
                       "palabras": [{"texto": w["text"], "inicio": w["start"], "fin": w["end"]} for w in l["words"]]}
                      for l in d["lines"]]}
    with open(os.path.join(PUB, "voz", f"{name}.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print(f"voz      {name}: {d['dur']:.2f} s, {len(d['lines'])} líneas")


def preparar_sonidos(spec: dict) -> None:
    carpeta = os.path.join(PUB, "sonidos")
    os.makedirs(carpeta, exist_ok=True)
    idx_path = os.path.join(carpeta, "indice.json")
    indice = json.load(open(idx_path, encoding="utf-8")) if os.path.exists(idx_path) else {}
    ids = sorted({s["id"] for s in spec.get("sonidos", [])})
    for sid in ids:
        src = sonido.path(sid)
        shutil.copyfile(src, os.path.join(carpeta, f"{sid}.wav"))
        with wave.open(src) as w:
            dur = w.getnframes() / w.getframerate()
        indice[sid] = {"dur": round(dur, 4),
                       "ataque": round(audio.sfx_offset(src, "onset"), 4),
                       "pico": round(audio.sfx_offset(src, "peak"), 4)}
    with open(idx_path, "w", encoding="utf-8") as fh:
        json.dump(indice, fh, indent=1)
    print(f"efectos  {len(ids)}: {', '.join(ids)}")


def preparar_fuentes() -> None:
    carpeta = os.path.join(PUB, "fuentes")
    os.makedirs(carpeta, exist_ok=True)
    for name, archivo in FUENTES.items():
        dst = os.path.join(carpeta, archivo)
        if not os.path.exists(dst):
            shutil.copyfile(motor.font_path(name), dst)
    print(f"fuentes  {len(FUENTES)}")


def preparar_grano() -> None:
    dst = os.path.join(PUB, "grano.png")
    if os.path.exists(dst):
        return
    rng = np.random.default_rng(3)
    g = rng.normal(0, 1, (512, 512)).astype(np.float32)
    g = cv2.GaussianBlur(g, (0, 0), 0.7)
    g = np.clip(128 + g / g.std() * 34, 0, 255).astype(np.uint8)
    cv2.imwrite(dst, g)


def main(paths: list[str]) -> None:
    for p in paths:
        spec = json.load(open(p, encoding="utf-8"))
        print(f"— {spec['nombre']}")
        preparar_voz(spec, os.path.dirname(os.path.abspath(p)))
        preparar_sonidos(spec)
    preparar_fuentes()
    preparar_grano()


if __name__ == "__main__":
    if not sys.argv[1:]:
        sys.exit(__doc__)
    main(sys.argv[1:])
