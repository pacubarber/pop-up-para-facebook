import subprocess,sys
video,vo,music,out,dur=sys.argv[1:6]; dur=float(dur)
events=eval(sys.argv[6])  # list of (sfxname, time, gain)
inputs=['-i',video,'-i',vo,'-stream_loop','-1','-i',music]
fc=[f"[1:a]volume=1.0,adelay=0|0[vo]",f"[2:a]atrim=0:{dur},volume=0.16,afade=t=in:d=0.4,afade=t=out:st={dur-1.6}:d=1.6[mu]"]
labels=['[vo]','[mu]']
for i,(n,t,g) in enumerate(events):
    inputs+=['-i',f'sfx/{n}.wav']; ms=int(t*1000)
    fc.append(f"[{i+3}:a]volume={g},adelay={ms}|{ms}[s{i}]"); labels.append(f'[s{i}]')
fc.append(''.join(labels)+f"amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{dur},alimiter=limit=0.95[a]")
cmd=['ffmpeg','-y','-v','error',*inputs,'-filter_complex',';'.join(fc),'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-shortest','-movflags','+faststart',out]
subprocess.run(cmd,check=True); print('ok',out)
