"""Genera salida/creditos.md: clips, música y efectos de sonido que usa cada video.

  python3 motor/creditos.py ediciones/nocturna.py ediciones/aura.py …
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import libreria  # noqa: E402
from render import load  # noqa: E402

ROOT = os.path.dirname(HERE)


def main(paths):
    out = ["# Créditos del material", "",
           "Todo el material viene de librerías con licencia de uso comercial gratuito y sin atribución obligatoria "
           "([Mixkit](https://mixkit.co/license/), [Coverr](https://coverr.co/license)). Se lista para que cualquiera pueda "
           "volver a descargarlo o reemplazarlo.", ""]
    for p in paths:
        v = load(p)
        out += [f"## {v.name}", "", "| Clip | Tramo usado | Enlace |", "|---|---|---|"]
        seen = set()
        for c in v.clips:
            if c.ref in seen:
                continue
            seen.add(c.ref)
            src, key = c.ref.split(":", 1)
            link = (f"https://assets.mixkit.co/videos/{key}/{key}-1080.mp4" if src == "mixkit"
                    else f"https://cdn.coverr.co/videos/{key}/1080p.mp4")
            out.append(f"| `{c.ref}` | {c.desde:.1f}–{c.desde + c.dur:.1f} s | [{src}]({link}) |")
        if v.music_spec:
            m = v.music_spec
            out += ["", f"**Música:** Mixkit #{m['id']} desde el segundo {m['start']:.2f} "
                        f"([mp3](https://assets.mixkit.co/music/{m['id']}/{m['id']}.mp3))"]
        sfx = sorted({s["id"] for s in v.sfx_list})
        if sfx:
            out += ["", "**Efectos de sonido (Mixkit):** " + ", ".join(
                f"[#{i}](https://assets.mixkit.co/active_storage/sfx/{i}/{i}-preview.mp3)" for i in sfx)]
        if v.vo:
            out += ["", f"**Voz:** OpenAI TTS (`gpt-4o-mini-tts`), guion en `guiones/{v.vo['name']}.json`; "
                        "tiempos por palabra con Whisper (`whisper-1`)."]
        out.append("")
    path = os.path.join(ROOT, "salida", "creditos.md")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out))
    print(path)


if __name__ == "__main__":
    main(sys.argv[1:])
