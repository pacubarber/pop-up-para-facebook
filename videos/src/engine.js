// Mini motion-graphics engine: deterministic render(t) for frame-by-frame capture.
const W = 1080, H = 1920;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = {
  out: p => 1 - Math.pow(1 - p, 3),
  expo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  inOut: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  back: p => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  in: p => p * p * p,
};
const ELS = [];
const stage = () => document.getElementById('stage');

// Enter/exit presets -> {dx, dy, s, r, o, blur} at progress p (0 = hidden, 1 = settled)
function preset(name, p) {
  const e = name === 'pop' ? ease.back(p) : ease.expo(p);
  const q = 1 - e;
  switch (name) {
    case 'pop': return { s: lerp(0.2, 1, e), o: clamp(p * 3) };
    case 'up': return { dy: 120 * q, o: clamp(p * 2.5), blur: 14 * q };
    case 'down': return { dy: -120 * q, o: clamp(p * 2.5), blur: 14 * q };
    case 'left': return { dx: 260 * q, o: clamp(p * 2.5), blur: 10 * q };
    case 'right': return { dx: -260 * q, o: clamp(p * 2.5), blur: 10 * q };
    case 'blur': return { s: lerp(1.25, 1, e), o: clamp(p * 2), blur: 30 * q };
    case 'zoom': return { s: lerp(2.6, 1, e), o: clamp(p * 2), blur: 20 * q };
    case 'spin': return { s: lerp(0.3, 1, ease.back(p)), r: -40 * q, o: clamp(p * 3) };
    case 'fade': return { o: e };
    default: return { o: p > 0 ? 1 : 0 };
  }
}

function el(html, o = {}) {
  const d = document.createElement('div');
  d.className = 'el ' + (o.cls || '');
  d.innerHTML = html;
  if (o.style) Object.assign(d.style, o.style);
  if (o.w) d.style.width = o.w + 'px';
  d.style.zIndex = o.z || 5;
  (o.parent || stage()).appendChild(d);
  const item = Object.assign({ x: W / 2, y: H / 2, t0: 0, t1: 999, enter: 'up', exit: 'fade', dIn: 0.5, dOut: 0.3, s: 1, r: 0, d }, o);
  item.spans = [...d.querySelectorAll('[data-t]')];
  ELS.push(item);
  return item;
}

function render(t) {
  for (const it of ELS) {
    const { d } = it;
    if (t < it.t0 - 0.0001 || t > it.t1 + it.dOut) { d.style.display = 'none'; continue; }
    d.style.display = '';
    const pi = clamp((t - it.t0) / it.dIn), po = clamp((t - it.t1) / it.dOut);
    const a = preset(it.enter, pi);
    const b = po > 0 ? preset(it.exit, 1 - po) : {};
    let dx = (a.dx || 0) + (b.dx || 0), dy = (a.dy || 0) + (b.dy || 0);
    let s = (a.s ?? 1) * (b.s ?? 1) * it.s, r = (a.r || 0) + (b.r || 0) + it.r;
    const o = (a.o ?? 1) * (b.o ?? 1), blur = (a.blur || 0) + (b.blur || 0);
    if (it.float) { const f = it.float; dy += Math.sin((t + (f.ph || 0)) * (f.sp || 1.2)) * (f.amp || 14); r += Math.sin((t + (f.ph || 0)) * (f.sp || 1.2) * 0.7) * (f.rot || 0); }
    if (it.drift) { const lt = t - it.t0; dx += (it.drift.x || 0) * lt; dy += (it.drift.y || 0) * lt; s *= 1 + (it.drift.s || 0) * lt; r += (it.drift.r || 0) * lt; }
    const st = { x: it.x + dx, y: it.y + dy, s, r, o, blur };
    if (it.update) it.update(it, t, t - it.t0, st);
    d.style.transform = `translate(-50%,-50%) translate(${st.x}px,${st.y}px) scale(${st.s}) rotate(${st.r}deg)`;
    d.style.opacity = st.o;
    d.style.filter = st.blur > 0.3 ? `blur(${st.blur}px)` : '';
    for (const sp of it.spans) {
      const p = clamp((t - +sp.dataset.t) / (+sp.dataset.d || 0.35));
      const kind = sp.dataset.a || 'up';
      const e = kind === 'pop' ? ease.back(p) : ease.expo(p);
      if (kind === 'pop') sp.style.transform = `scale(${lerp(0.3, 1, e)})`;
      else if (kind === 'wipe') { sp.style.clipPath = `inset(0 ${100 - e * 100}% 0 0)`; }
      else sp.style.transform = `translateY(${(1 - e) * 60}px)`;
      sp.style.opacity = kind === 'wipe' ? (p > 0 ? 1 : 0) : clamp(p * 2.5);
      sp.style.filter = kind === 'up' && p < 1 ? `blur(${(1 - e) * 10}px)` : '';
    }
  }
  if (window.onFrame) window.onFrame(t);
}

// Helpers
const sp = (txt, t, cls = '', a = 'up', d) => `<span class="w ${cls}" data-t="${t}" data-a="${a}"${d ? ` data-d="${d}"` : ''}>${txt}</span>`;
const img = (src, w) => `<img src="${src}" style="width:${w}px;display:block">`;
const countUp = (from, to, t0, dur, fmt = v => Math.round(v)) => (it, t) => {
  const p = ease.out(clamp((t - t0) / dur));
  it.d.querySelector('.num').textContent = fmt(lerp(from, to, p));
};
window.seek = t => render(t);
