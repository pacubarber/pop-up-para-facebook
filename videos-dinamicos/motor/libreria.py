"""B-roll, música y efectos de sonido de librerías públicas gratuitas.

Fuentes (todas con licencia de uso comercial gratuito, sin atribución obligatoria):
  · Mixkit  — video, música y efectos de sonido   https://mixkit.co/license/
  · Coverr  — video                                https://coverr.co/license
    (se descartan los clips premium y los generados con IA)

  python3 motor/libreria.py video mixkit concert dj crowd [--paginas 2]
  python3 motor/libreria.py video coverr concert festival
  python3 motor/libreria.py musica edm deep-house
  python3 motor/libreria.py sfx whoosh impact
  python3 motor/libreria.py hoja mixkit:41000 coverr:coverr-people-at-a-rave-8099 ...   → hoja de contactos para elegir clips

Las referencias de clip son "mixkit:<id>" o "coverr:<baseFilename>". Todo lo descargado vive en cache/.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(ROOT, "cache")
UA = "Mozilla/5.0 (X11; Linux x86_64) videos-dinamicos"


# ------------------------------------------------------------------ red
def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "ignore")


def download(url: str, path: str) -> str:
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".part"
    subprocess.run(["curl", "-sS", "-f", "-L", "--retry", "4", "-m", "600", "-A", UA, "-o", tmp, url], check=True)
    os.replace(tmp, path)
    return path


def probe(path: str) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
         "-show_entries", "format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True,
    )
    d = json.loads(out.stdout)
    s = d["streams"][0] if d.get("streams") else {}
    fps = 0.0
    if s.get("r_frame_rate"):
        n, m = s["r_frame_rate"].split("/")
        fps = float(n) / float(m or 1)
    return {"w": s.get("width", 0), "h": s.get("height", 0), "fps": fps, "dur": float(d["format"]["duration"])}


# ------------------------------------------------------------------ Mixkit video
def mixkit_search(tags: list[str], pages=2) -> dict[int, str]:
    seen: dict[int, str] = {}
    for tag in tags:
        for p in range(1, pages + 1):
            url = f"https://mixkit.co/free-stock-video/{tag}/" + (f"?page={p}" if p > 1 else "")
            try:
                html = get(url)
            except Exception:
                break
            found = re.findall(r'href="/free-stock-video/([a-z0-9-]+)-([0-9]+)/"', html)
            if not found:
                break
            for slug, vid in found:
                seen.setdefault(int(vid), slug)
    return seen


# ------------------------------------------------------------------ Coverr video
def coverr_search(tags: list[str]) -> dict[str, dict]:
    seen: dict[str, dict] = {}
    for tag in tags:
        try:
            html = get(f"https://coverr.co/stock-video-footage/{tag}")
        except Exception:
            continue
        dec = json.JSONDecoder()
        hits = []
        for m in re.finditer(r'"hits":\[', html):
            try:
                arr, _ = dec.raw_decode(html, m.end() - 1)
                hits += [h for h in arr if isinstance(h, dict)]
            except ValueError:
                continue
        for hit in hits:
            base = hit.get("baseFilename") or ""
            if not base.startswith("coverr-") or base.startswith("coverr-temp-") or hit.get("isAiGenerated") or hit.get("isPremium"):
                continue
            seen.setdefault(base, {
                "title": hit.get("title", ""),
                "vertical": bool(hit.get("isVertical")),
                "dur": float(hit.get("duration") or 0),
                "maxh": hit.get("maxHeight"),
            })
    return seen


# ------------------------------------------------------------------ descargas de video
def preview_path(ref: str) -> str:
    src, key = ref.split(":", 1)
    if src == "mixkit":
        # los clips más nuevos de Mixkit no tienen versión 360: se usa la 720
        for q in ("360", "720", "1080"):
            try:
                return download(f"https://assets.mixkit.co/videos/{key}/{key}-{q}.mp4", os.path.join(CACHE, "prev", f"mixkit-{key}.mp4"))
            except subprocess.CalledProcessError:
                continue
    if src == "coverr":
        return download(f"https://cdn.coverr.co/videos/{key}/360p.mp4", os.path.join(CACHE, "prev", f"{key}.mp4"))
    raise ValueError(f"sin vista previa: {ref}")


def source_path(ref: str) -> str:
    """Descarga el original en la mejor calidad razonable (vertical 1080, horizontal 4K si existe)."""
    src, key = ref.split(":", 1)
    if src == "mixkit":
        info = probe(preview_path(ref))
        qualities = ["1080"] if info["h"] > info["w"] else ["2160", "1080"]
        for q in qualities:
            try:
                return download(f"https://assets.mixkit.co/videos/{key}/{key}-{q}.mp4", os.path.join(CACHE, "src", f"mixkit-{key}-{q}.mp4"))
            except subprocess.CalledProcessError:
                continue
        return download(f"https://assets.mixkit.co/videos/{key}/{key}-720.mp4", os.path.join(CACHE, "src", f"mixkit-{key}-720.mp4"))
    if src == "coverr":
        for q in ["2160p", "1080p"]:
            try:
                return download(f"https://cdn.coverr.co/videos/{key}/{q}.mp4", os.path.join(CACHE, "src", f"{key}-{q}.mp4"))
            except subprocess.CalledProcessError:
                continue
    raise ValueError(ref)


# ------------------------------------------------------------------ Mixkit música y efectos
def mixkit_music(tags: list[str], pages=1) -> dict[int, str]:
    """Lee la lista JSON-LD de cada página de género: id → "Título · género · artista · duración"."""
    seen: dict[int, str] = {}
    for tag in tags:
        for p in range(1, pages + 1):
            url = f"https://mixkit.co/free-stock-music/{tag}/" + (f"?page={p}" if p > 1 else "")
            try:
                html = get(url)
            except Exception:
                break
            for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
                try:
                    data = json.loads(block)
                except ValueError:
                    continue
                for node in data.get("@graph", []):
                    for it in node.get("itemListElement", []) if node.get("@type") == "ItemList" else []:
                        m = re.search(r"/music/([0-9]+)/", it.get("url", ""))
                        if m:
                            dur = it.get("duration", "").replace("PT", "").lower()
                            seen.setdefault(int(m.group(1)), f"{it.get('name')} · {it.get('genre')} · {it.get('byArtist')} · {dur}")
    return seen


def music_path(mid: int) -> str:
    return download(f"https://assets.mixkit.co/music/{mid}/{mid}.mp3", os.path.join(CACHE, "musica", f"{mid}.mp3"))


def mixkit_sfx(tags: list[str]) -> dict[int, str]:
    seen: dict[int, str] = {}
    for tag in tags:
        try:
            html = get(f"https://mixkit.co/free-sound-effects/{tag}/")
        except Exception:
            continue
        blocks = re.split(r'data-audio-player-preview-url-value=', html)
        for b in blocks[1:]:
            m = re.match(r'"https://assets\.mixkit\.co/active_storage/sfx/([0-9]+)/', b)
            if not m:
                continue
            t = re.search(r'class="item-grid-card__title"[^>]*>\s*([^<]+)<', b)
            seen.setdefault(int(m.group(1)), (t.group(1).strip() if t else ""))
    return seen


def sfx_path(sid: int) -> str:
    return download(f"https://assets.mixkit.co/active_storage/sfx/{sid}/{sid}-preview.mp3", os.path.join(CACHE, "sfx", f"{sid}.mp3"))


# ------------------------------------------------------------------ hoja de contactos
def contact_sheet(refs: list[str], out: str, per_row=6):
    th = os.path.join(CACHE, "thumbs")
    os.makedirs(th, exist_ok=True)

    def one(ref):
        try:
            p = preview_path(ref)
        except Exception as e:
            print(f"  ✗ {ref}: {e}", file=sys.stderr)
            return []
        info = probe(p)
        tiles = []
        for k in (1, 2, 3):
            t = info["dur"] * k / 4
            f = os.path.join(th, ref.replace(":", "_") + f"_{k}.jpg")
            label = ref.split(":", 1)[1][:28].replace("'", "")
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", p, "-frames:v", "1", "-vf",
                 "scale=200:356:force_original_aspect_ratio=decrease,pad=200:356:(ow-iw)/2:(oh-ih)/2,"
                 f"drawtext=text='{label}':x=4:y=4:fontsize=13:fontcolor=yellow:box=1:boxcolor=black@0.7", f],
                check=True)
            tiles.append(f)
        return tiles

    with ThreadPoolExecutor(8) as ex:
        tiles = [t for ts in ex.map(one, refs) for t in ts]
    lst = os.path.join(th, f"list-{os.getpid()}.txt")
    with open(lst, "w") as fh:
        for t in tiles:
            fh.write(f"file '{t}'\n")
    cols = per_row * 3
    rows = (len(tiles) + cols - 1) // cols
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-vf",
                    f"tile={cols}x{rows}:padding=2", "-frames:v", "1", out], check=True)
    return out


def main(argv: list[str]):
    if len(argv) < 2:
        print(__doc__)
        return
    cmd, args = argv[0], argv[1:]
    pages = 2
    if "--paginas" in args:
        i = args.index("--paginas")
        pages = int(args[i + 1])
        args = args[:i] + args[i + 2:]
    if cmd == "video" and args[0] == "mixkit":
        for vid, slug in sorted(mixkit_search(args[1:], pages).items()):
            print(f"mixkit:{vid}  {slug}")
    elif cmd == "video" and args[0] == "coverr":
        for base, h in coverr_search(args[1:]).items():
            print(f"coverr:{base}  {'V' if h['vertical'] else 'H'} {h['dur']:5.1f}s {h['maxh']}p  {h['title']}")
    elif cmd == "musica":
        for mid, slug in sorted(mixkit_music(args, pages).items()):
            print(f"{mid}  {slug}")
    elif cmd == "sfx":
        for sid, name in sorted(mixkit_sfx(args).items()):
            print(f"{sid}  {name}")
    elif cmd == "hoja":
        out = args[0]
        print(contact_sheet(args[1:], out))
    else:
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
