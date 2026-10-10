# CORTE · Estudio de edición de video

Todo lo necesario para operar la agencia: marca, web con portafolio, motor de edición (FFmpeg + Remotion), videos de prospección personalizados y el playbook de ventas.

```
branding/      Logos (SVG) y guía de marca
web/           Sitio de la agencia + portafolio (estático, listo para GitHub Pages)
studio/        Motor de edición: Remotion + música, efectos y voces generados desde cero
prospeccion/   Lista de leads, videos personalizados y mensajes listos para enviar
ventas/        Estrategia de captación, guiones de DM/email, precios y onboarding
```

## Marca

- **Nombre:** CORTE · **Tagline:** *Cada corte cuenta.* · **Promesa:** *Editamos videos que nadie se salta.*
- **Colores:** Negro Sala `#0C0C0E`, Hueso `#F2EEE6`, Rojo Corte `#FF3B1F`.
- **Tipografías:** Inter Tight (titulares), Instrument Serif itálica (acentos), JetBrains Mono (timecodes).
- Guía completa en `branding/guia-de-marca.html`. Los logos se regeneran con `node studio/scripts/build-logos.mjs`.
- Antes de registrar nada, comprueba que estén libres el dominio `cortestudio.co` y el usuario `@corte.studio`; si no, cambia el nombre en `studio/src/brand.ts` y en la web.

## Portafolio

| Pieza | Formato | Qué muestra |
|---|---|---|
| Showreel CORTE | 16:9 · 34 s | Montaje de todo, cortado a 120 BPM |
| Mente Fundadora | 9:16 · 26 s | Clip de podcast: subtítulos karaoke, lip-sync, gráficos |
| Grano Alto | 9:16 · 15 s | Anuncio de producto con ilustración y oferta |
| Casa Alameda | 9:16 · 18 s | Inmobiliaria: plano animado, mapa, subtítulos |
| Flujo | 16:9 · 16 s | Producto SaaS: UI animada y zoom de pantalla |

Son piezas de muestra con **marcas ficticias**, hechas desde cero: ilustración y animación en código, música y efectos sintetizados (`studio/tools/audio.py`) y locución con voces neuronales offline (Piper). Sin material de terceros, así que no hay problemas de derechos.

## Motor de edición (`studio/`)

Requisitos: Node 20+, Python 3.10+, FFmpeg.

```bash
cd studio
npm install
pip install sherpa-onnx scipy numpy        # voces y audio
npm run setup                              # genera música, efectos y locuciones (no se suben a git)
npm run studio                             # editor visual de Remotion en el navegador
node scripts/render.mjs --all              # renderiza el portafolio → out/ y web/media/
npm run frames -- out/Podcast.mp4 2        # FFmpeg: video → frames + hoja de contactos para revisar
```

- **Edición con Remotion:** cada video es un componente en `src/videos/`. Las piezas comunes (subtítulos karaoke, transiciones whip, música con ducking, efectos) están en `src/lib/`.
- **Revisión con FFmpeg:** `scripts/frames.sh` convierte cualquier video en frames y arma una hoja de contactos con timecodes, para revisar ritmo y errores sin reproducirlo.
- **Audio:** `render.mjs` normaliza todo a −14 LUFS (estándar de Instagram, TikTok y YouTube).
- **Locuciones:** `python3 tools/tts.py guion.json` genera la voz y los tiempos de cada palabra (para los subtítulos). Los guiones están en `scripts/vo/`.
- **Música propia:** `python3 tools/audio.py` regenera las 3 pistas y los 10 efectos.
- En la nube se usa el Chromium preinstalado con `REMOTION_BROWSER=/ruta/a/chrome`; en tu equipo Remotion descarga el suyo solo.
- Licencia de Remotion: gratis para personas y empresas de hasta 3 empleados. Si la agencia crece, revisa remotion.dev/license.

## Prospección con video personalizado

1. Agrega prospectos a `prospeccion/leads.csv` (ver el ejemplo en `leads-ejemplo.csv`).
   Columnas clave: `nombre, negocio, handle, nicho, ciudad, color` (HEX de su logo). `nombre_voz` sirve para corregir la pronunciación (p. ej. "Dra." → "doctora").
2. Genera los videos y mensajes de todos los pendientes:
   ```bash
   cd studio && npm run pitch -- --csv ../prospeccion/leads.csv
   ```
3. Envía `prospeccion/videos/<negocio>.mp4` con el texto de `prospeccion/mensajes/<negocio>.md` (DM, email y seguimiento).
4. Actualiza la columna `estado` del CSV.

Nichos disponibles (con 3 ideas de contenido cada uno): `restaurante, cafeteria, inmobiliaria, gimnasio, clinica, belleza, coach, ecommerce, podcast, otro`. Se editan en `studio/src/data/nichos.json`.

## Web

`web/index.html` es estático: se puede abrir directamente o publicar.
- **Variantes nuevas:** `web/ritmo/`, `web/croma/` y `web/barras/`, cada una con su inicio y su `portafolio.html` (el enlace para mandar a prospectos). Precios, contacto y lista de videos salen de `web/assets/datos.js`.
- **GitHub Pages:** en Settings → Pages elige "GitHub Actions". El workflow `.github/workflows/pages.yml` publica `web/` en cada push a `main`.
- **Antes de publicar:** cambia los datos de contacto (busca `CONFIGURA AQUÍ` en `web/index.html`).

## Ventas

Empieza por `ventas/01-estrategia-captacion.md`. Resumen: elige un nicho, investiga 20 cuentas al día y manda un video personalizado con el enlace al portafolio y precios claros: **reel 5–8 USD, paquete de 6 videos 50 USD y video largo 20 USD** (detalle en `ventas/03-precios-y-paquetes.md`). No hay video de prueba gratis.
