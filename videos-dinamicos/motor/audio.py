"""Mezcla de audio con FFmpeg: locución + música (con ducking) + efectos, normalizado a −14 LUFS."""
from __future__ import annotations

import json
import os
import subprocess

import numpy as np

import libreria

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(ROOT, "cache")


def sfx_offset(path: str, align: str) -> float:
    """Segundos desde el inicio del archivo hasta su ataque ('onset') o su pico ('peak')."""
    if align == "start":
        return 0.0
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "22050", "pipe:1"],
                         capture_output=True, check=True).stdout
    x = np.abs(np.frombuffer(raw, np.float32))
    if not len(x):
        return 0.0
    if align == "peak":
        env = np.convolve(x, np.ones(220) / 220, "same")
        return float(np.argmax(env)) / 22050
    return float(np.argmax(x > 0.1 * x.max())) / 22050


def mix(video, out_wav: str) -> str:
    dur = video.dur
    inputs, chains, labels = [], [], []

    # locución
    vo_label = None
    if video.vo:
        p = os.path.join(CACHE, "voz", f"{video.vo['name']}.wav")
        inputs += ["-i", p]
        k = len(inputs) // 2 - 1
        ms = int(video.vo["offset"] * 1000)
        chains.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms},"
                      f"volume={video.vo['gain']}dB,asplit=2[vo][vokey]")
        vo_label = "vo"
        labels.append("[vo]")

    # música
    m = video.music_spec
    if m:
        p = libreria.music_path(m["id"])
        inputs += ["-i", p]
        k = len(inputs) // 2 - 1
        ms = int(m["offset"] * 1000)
        end = m["end"] if m["end"] is not None else dur
        length = end - m["offset"]
        fo = m["fade_out"]
        c = (f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=start={m['start']}:duration={length},"
             f"asetpts=PTS-STARTPTS")
        if m["fade_in"] > 0:
            c += f",afade=t=in:d={m['fade_in']}"
        if fo > 0:
            c += f",afade=t=out:st={max(0, length - fo)}:d={fo}"
        c += f",adelay={ms}|{ms},volume={m['gain']}dB"
        if m["duck"] and vo_label:
            chains.append(c + "[mraw]")
            chains.append("[mraw][vokey]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=300:makeup=1[mus]")
        else:
            chains.append(c + "[mus]")
            if vo_label:
                chains.append("[vokey]anullsink")
        labels.append("[mus]")
    elif vo_label:
        chains.append("[vokey]anullsink")

    # efectos
    for j, s in enumerate(video.sfx_list):
        p = libreria.sfx_path(s["id"])
        inputs += ["-i", p]
        k = len(inputs) // 2 - 1
        t = s["t"] - sfx_offset(p, s["align"])
        trim = ""
        if t < 0:
            trim = f",atrim=start={-t},asetpts=PTS-STARTPTS"
            t = 0
        ms = int(t * 1000)
        chains.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo{trim},adelay={ms}|{ms},volume={s['gain']}dB[s{j}]")
        labels.append(f"[s{j}]")

    graph = ";".join(chains) + ";" + "".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{dur},apad=whole_dur={dur}[mix]"
    pre = out_wav + ".pre.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[mix]", "-ar", "48000", pre], check=True)

    # normalización en dos pasadas a −14 LUFS / −1.5 dBTP
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", pre, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    txt = r.stderr[r.stderr.rfind("{"):r.stderr.rfind("}") + 1]
    ms = json.loads(txt)
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={ms['input_i']}:measured_TP={ms['input_tp']}:"
          f"measured_LRA={ms['input_lra']}:measured_thresh={ms['input_thresh']}:offset={ms['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-ar", "48000", out_wav], check=True)
    os.remove(pre)
    return out_wav
