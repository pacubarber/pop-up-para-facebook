// Comportamiento común de index.html y portfolio.html: rutas de los videos, datos de
// contacto, reproducción automática al entrar en pantalla, reproductor con
// sonido y animaciones de entrada. Cada página pone su propio diseño encima.
(() => {
  const D = window.CORTE || {};
  // Las rutas de datos.js son relativas a web/; este archivo vive en web/assets/.
  const base = new URL('..', document.currentScript.src);
  const abs = (p) => (p ? new URL(p, base).href : '');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  const piezas = (D.portafolio || []).map((p) => ({
    ...p,
    video: abs(p.video),
    poster: abs(p.poster),
    preview: abs(p.preview || p.video),
    vertical: p.formato !== '16:9',
  }));
  const pieza = (id) => piezas.find((p) => p.id === id);

  // <video> mudo que carga su vista previa solo cuando se acerca a la pantalla.
  const video = (p, cls = '') =>
    `<video class="${cls}" muted loop playsinline preload="none" poster="${esc(p.poster)}" data-src="${esc(p.preview)}" aria-hidden="true"></video>`;

  // ---------- contacto: <a data-contacto="instagram|email|whatsapp"><span data-valor></span></a>
  function contacto(root = document) {
    const c = D.contacto || {};
    const wa = String(c.whatsapp || '').replace(/\D/g, '');
    const links = {
      instagram: c.instagram && {href: `https://instagram.com/${c.instagram}`, text: `@${c.instagram}`},
      email: c.email && {href: `mailto:${c.email}`, text: c.email},
      whatsapp: wa && {href: `https://wa.me/${wa}?text=${encodeURIComponent("Hi! I'd like to get a video edited.")}`, text: `+${wa}`},
    };
    root.querySelectorAll('[data-contacto]').forEach((el) => {
      const l = links[el.dataset.contacto];
      if (!l) { el.hidden = true; return; }
      if (el.tagName === 'A') {
        el.href = l.href;
        if (!l.href.startsWith('mailto:')) { el.target = '_blank'; el.rel = 'noopener'; }
      }
      el.querySelectorAll('[data-valor]').forEach((v) => (v.textContent = l.text));
    });
  }

  // ---------- reproducción automática de las vistas previas visibles
  const visibles = new Set();
  let enPausa = false;
  const io = 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
    entries.forEach(({target: v, isIntersecting}) => {
      if (isIntersecting) {
        visibles.add(v);
        if (!v.src) v.src = v.dataset.src;
        if (!enPausa) v.play().catch(() => {});
      } else {
        visibles.delete(v);
        v.pause();
      }
    });
  }, {rootMargin: '120px 0px', threshold: 0.1});

  function autoplay(scope = document) {
    if (reduce || !io) return; // con movimiento reducido se quedan las miniaturas
    scope.querySelectorAll('video[data-src]').forEach((v) => {
      v.muted = true;
      io.observe(v);
    });
  }
  const pausar = () => { enPausa = true; visibles.forEach((v) => v.pause()); };
  const reanudar = () => { enPausa = false; visibles.forEach((v) => v.play().catch(() => {})); };

  // ---------- reproductor con sonido: cualquier elemento con data-pieza="id"
  let dlg, lbv, lbt;
  function abrir(id) {
    const p = pieza(id);
    if (!p) return;
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'lb';
      dlg.setAttribute('aria-label', 'Video player');
      dlg.innerHTML = '<div class="lb-in"><video controls playsinline></video><div class="lb-bar"><span class="lb-t"></span><button class="lb-x" type="button">Close</button></div></div>';
      document.body.append(dlg);
      lbv = dlg.querySelector('video');
      lbt = dlg.querySelector('.lb-t');
      dlg.querySelector('.lb-x').addEventListener('click', () => dlg.close());
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', () => {
        lbv.pause();
        lbv.removeAttribute('src');
        lbv.load();
        reanudar();
      });
    }
    pausar();
    dlg.classList.toggle('h', !p.vertical);
    lbv.poster = p.poster;
    lbv.src = p.video;
    lbt.textContent = `${p.titulo} · ${p.tipo}`;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    lbv.play().catch(() => {});
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-pieza]');
    if (!t) return;
    e.preventDefault();
    abrir(t.dataset.pieza);
  });

  // ---------- entrada al hacer scroll. Lo que ya está en pantalla al cargar no se oculta nunca.
  function reveal(sel = '.rv') {
    if (reduce || !io) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, {threshold: 0.12});
    document.querySelectorAll(sel).forEach((el) => {
      if (el.getBoundingClientRect().top > innerHeight * 0.92) {
        el.classList.add('pre');
        obs.observe(el);
      }
    });
  }

  // Estilo base del reproductor; cada página lo ajusta con --lb-bg, --lb-fg y --lb-font.
  const css = document.createElement('style');
  css.textContent = `
.lb{border:0;padding:0;background:transparent;max-width:100vw;max-height:100dvh;overflow:visible}
.lb::backdrop{background:var(--lb-bg,rgba(0,0,0,.9))}
.lb-in{display:grid;gap:10px;justify-items:center}
.lb video{display:block;height:min(80dvh,1100px);width:auto;max-width:92vw;aspect-ratio:9/16;object-fit:contain;background:#000}
.lb.h video{height:auto;width:min(92vw,1280px);aspect-ratio:16/9;max-height:80dvh}
.lb-bar{display:flex;gap:16px;align-items:center;justify-content:space-between;width:100%;color:var(--lb-fg,#fff);font:500 14px/1.2 var(--lb-font,system-ui,sans-serif)}
.lb-x{background:none;border:0;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:8px 0}
`;
  document.head.append(css);

  window.SITIO = {piezas, pieza, precios: D.precios || [], incluye: D.incluye || '', video, contacto, autoplay, reveal, abrir, esc, reduce};
})();
