#!/usr/bin/env bash
# Convierte un video en frames y arma una hoja de contactos para revisarlo.
# Uso: bash scripts/frames.sh <video.mp4> [frames_por_segundo=1] [carpeta_salida]
set -euo pipefail
src="$1"
rate="${2:-1}"
out="${3:-out/frames/$(basename "${src%.*}")}"
mkdir -p "$out"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nw=1:nk=1 "$src")
h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$src")
count=$(python3 -c "import math; print(max(1, math.floor($dur * $rate)))")
cols=$([ "$w" -lt "$h" ] && echo 8 || echo 5)
rows=$(( (count + cols - 1) / cols ))
thumb=$([ "$w" -lt "$h" ] && echo 240 || echo 384)
ffmpeg -hide_banner -loglevel error -y -i "$src" -vf "fps=$rate,scale=$thumb:-2" "$out/frame_%03d.jpg"
ffmpeg -hide_banner -loglevel error -y -i "$src" \
  -vf "fps=$rate,scale=$thumb:-2,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=4:color=gray" \
  -frames:v 1 "$out/contacto.jpg"
echo "✓ $count frames en $out  ·  hoja de contactos: $out/contacto.jpg"
