# Videos dinámicos con b-roll de librerías públicas

Carpeta independiente: no toca nada de `studio/`, `web/` ni de las landings. Todo lo de aquí vive en `videos-dinamicos/`.

Flujo: **librería pública (Mixkit + Coverr) → guion → voz con OpenAI → tiempos por palabra con Whisper → edición por fotograma en Python → FFmpeg (color, encuadre, mezcla y exportación)**.

## Los videos (9:16, 1080×1920, 30 fps, −14 LUFS)

| Video | Duración | Qué tiene |
|---|---|---|
| `salida/nocturna.mp4` · Promo de festival | 21 s | Cortes al beat (120 BPM) y drop alineado con la palabra "Nocturna"; zoom a través de las letras (texto con video dentro); "TE CAMBIAN" y "NOVIEMBRE" detrás de las bailarinas (recorte de persona con IA); números que golpean con contador; cuenta 0→1000 boletos; transiciones whip, zoom y glitch; separación RGB y sacudidas en los golpes; apagón de televisor; logo con letras que caen. |
| `salida/regla-50-30-20.mp4` · Educativo de finanzas | 35 s | Gancho con golpes de cámara, montaje rápido de pagos, 50/30/20 que caen, dona que se llena por categoría, listas que se arman con la voz, barra de $1.000 que se reparte y se reordena para explicar "el 20 primero", subtítulos karaoke con palabras clave en el color de cada categoría, marcador que se rellena en el llamado a la acción. |
| `salida/aura.mp4` · Anuncio de skincare | 22 s | Tipografía serif con revelados suaves, "AURA" gigante detrás de la modelo en el drop, contador 15 % con anillo, destello de luz que cruza el texto, barrido antes/después, temporizador circular con palomita, tachado animado, fugas de luz cálidas y cierre en el que el video se encoge a una tarjeta sobre fondo crema. |

| `salida/corte-reto.mp4` · Video de la agencia CORTE | 19.6 s | Estilo ilustrado (como Grano Alto), **sin librerías**: todo dibujado en código y sonido 100 % sintetizado, sin música. Video "meta": el zoom, el ¡PUM! y la pregunta aparecen justo cuando la voz los nombra, la línea de tiempo marca los tres trucos donde ocurrieron y se corta en diagonal como el logo. Tic-tac que se corta en "¿sigues aquí?", risers, golpes y un final que empalma con el inicio (bucle). |
| `salida/corte-4-trucos.mp4` · Video de la agencia CORTE | 47.4 s | Locución de **ElevenLabs** (voz Stanley – Trailer, Eleven v3) con pausas recortadas y tiempos de Whisper. Bucle abierto: el truco 4 se promete al inicio y se revela al final; lista de 4 casillas que se marcan (con candado en la 4, que se rompe en "Ya lo viste"); corte, zoom y sonido aplicados sobre su propia palabra; subtítulos que aparecen en el celular cuando se explica el truco 3; rebobinado final que empalma con el inicio. Sin librerías ni música. |
| `salida/corte-4-trucos-b.mp4` · Variante en **Remotion + JSON** | 47.4 s | La misma locución de ElevenLabs, editada de otra forma y descrita entera en `remotion/videos/corte-4-trucos-b.json`: tipografía cinética sobre papel hueso que entra palabra por palabra con la voz, escenas que alternan a negro y rojo con transiciones (empuje, círculo, corte en diagonal como el logo, zoom), regla de progreso arriba con una marca por truco (la 4 es un "?"), tarjeta sellada con cinta "NO ABRIR HASTA EL FINAL" que se arranca en "Ya lo viste", "FINAL" y "UN CORTE." que se parten en diagonal, feed que el pulgar desliza, celular en silencio con y sin subtítulos, cronómetro con lo que llevas viendo, comentario que se escribe y se envía, y rebobinado final que empalma con el inicio. |

Las marcas (Nocturna, Aura) son ficticias. Los guiones están en `guiones/` y la edición de cada video en `ediciones/`.

## Remotion + JSON (`remotion/`)

Otra forma de editar: el video entero es un JSON (`remotion/videos/<nombre>.json`) y Remotion lo dibuja. La voz, los tiempos de Whisper y los efectos sintetizados salen del mismo flujo de Python.

```bash
cd videos-dinamicos/remotion
npm install
python3 preparar.py videos/corte-4-trucos-b.json      # voz + tiempos por palabra, efectos, fuentes y grano → public/
node render.mjs videos/corte-4-trucos-b.json --frames 1.7,9.0,32.3   # fotogramas sueltos → out/
node render.mjs videos/corte-4-trucos-b.json          # video final → ../salida/corte-4-trucos-b.mp4 (−14 LUFS)
npx remotion studio                                    # editar viendo los cambios en vivo
```

Cómo se escribe el JSON:

- **Tiempos atados a la voz.** Cualquier tiempo puede ser segundos o una referencia que se resuelve con Whisper antes de renderizar: `"@L3"` (inicio de la línea 3 del guion), `"@L3.fin"`, `"@L3/cuarto"` (esa palabra dentro de la línea), `"@L3/cuarto#2"`, `"@cuarto#2"` (segunda vez en todo el video), `"@fin"`, todas con desfase: `"@L5/final+0.32"`. Si se cambia la locución, todo se vuelve a sincronizar solo.
- **`escenas`**: `desde` (y `hasta`, o hasta la siguiente), `fondo`, `entrada` (`corte`, `barrido`, `empuje`, `zoom`, `circulo`, `diagonal`), `camara` (zoom lento) y:
  - `textos`: bloques con `fuente` (display, serif, mono), `tam` (o automático al `ancho`), `anim` (`golpe`, `sube`, `aparece`, `escribe`, `desliza`), `sync: true` para que cada palabra entre cuando la voz la dice, `acentos`, `etiqueta` (pastilla), `contorno`, `tachar`, `subrayar` y `partir` (se parte en diagonal).
  - `graficos`: `anillo`, `caja`, `sello`, `segmentos`, `ondas`, `feed`, `celular` (con subtítulos karaoke de la voz), `cronometro`, `logo`, `comentario`, `estampa`, `rebobinar`, `flecha`.
- **`capas`** por encima de todo: `regla` (progreso con marcas), `rotulo`, `grano`, `vineta`.
- **`golpes`** de cámara (`zoom`, `sacudida`, `flash`, `invertir`) y **`sonidos`** (`id` de `motor/sonido.py`, `vol`, y `alinear` al `ataque` o al `pico` para que el golpe caiga justo en la palabra).

```
remotion/
  preparar.py     Prepara public/ con el flujo de Python (voz.py, sonido.py, fuentes de motor.py)
  render.mjs      Empaqueta, renderiza, normaliza el audio y deja el póster
  videos/         Un JSON por video (cada uno es una composición en Remotion Studio)
  src/motor/      tiempo.ts (referencias a la voz), Video.tsx (composición), Escena.tsx (transiciones),
                  Texto.tsx (textos animados), graficos.tsx, capas.tsx
```

## Requisitos

- Python 3.10+ con `numpy`, `opencv-python-headless`, `pillow`, `requests`, `onnxruntime`
- FFmpeg 6+
- `OPENAI_API_KEY` en el entorno (voz y Whisper)
- Para `remotion/`: Node 18+ (Remotion usa su propio Chromium; en la nube toma el de Playwright)

```bash
pip install numpy opencv-python-headless pillow requests onnxruntime
```

## Uso

```bash
cd videos-dinamicos

# 1) Buscar material en las librerías
python3 motor/libreria.py video mixkit concert dj crowd --paginas 2
python3 motor/libreria.py video coverr concert festival
python3 motor/libreria.py musica edm house
python3 motor/libreria.py sfx whoosh impact
python3 motor/libreria.py hoja /tmp/hoja.jpg mixkit:48508 mixkit:50435 coverr:coverr-dj-at-a-party-8079   # hoja de contactos

# 2) Locución: TTS de OpenAI por frase, silencios recortados y tiempos de cada palabra con Whisper
#    (o una locución propia, p. ej. de ElevenLabs: guion con "audio": "voces/archivo.mp3"; ver guiones/corte-4-trucos.json)
python3 motor/voz.py guiones/nocturna.json
python3 motor/voz.py guiones/nocturna.json --probar echo onyx cedar      # comparar voces

# 3) Música: BPM, beats y dónde está el drop
python3 motor/ritmo.py cache/musica/197.mp3

# 4) Render
python3 motor/render.py ediciones/nocturna.py --frames 1.0,5.3,9.0   # fotogramas sueltos para revisar
python3 motor/render.py ediciones/nocturna.py --desde 4 --hasta 9    # un tramo
python3 motor/render.py ediciones/nocturna.py                        # video final → salida/
python3 motor/render.py ediciones/nocturna.py --hoja                 # hoja de contactos del final
```

La primera vez descarga los clips (los horizontales en 4K para recortarlos a vertical sin perder calidad), las tipografías de Google Fonts y el modelo de recorte. Todo queda en `cache/` (ignorado por git). Un video de 20–35 s se renderiza en 2–4 minutos con 4 núcleos.

## Cómo está hecho

```
motor/
  libreria.py   Búsqueda y descarga: Mixkit (video, música, efectos) y Coverr (video, sin clips premium ni generados con IA)
  voz.py        OpenAI TTS (gpt-4o-mini-tts) por frase → recorta silencios → Whisper (whisper-1) da el tiempo de cada palabra;
                también procesa locuciones externas (ElevenLabs): acorta pausas sin tocar la voz y alinea al guion
  ilustraciones.py  Ilustraciones de la marca CORTE (celular, pulgar, logo, candado, casillas…) para los videos de la agencia
  ritmo.py      BPM, rejilla de beats y curva de energía para cortar al ritmo y ubicar el drop
  sonido.py     Efectos sintetizados sin librerías: tic-tac, risers, swells, golpes sub, whooshes, zoom,
                latido, ding, tecleo, tijera, sello, glitch, cinta que se arranca, marcador (python3 motor/sonido.py los genera)
  recorte.py    Robust Video Matting (ONNX, CPU): alfa de la persona para poner texto detrás
  motor.py      Escenas ilustradas (Video.scene: se dibujan en código, sin clips) y conform con FFmpeg (encuadre 9:16, gradación de color, 30 fps), lectura por fotograma,
                transiciones (whip, zoom, glitch, iris, persianas, destello, desenfoque), Ken Burns,
                golpes (zoom, sacudida, separación RGB, flash), texto antialiasado, formas, grano, viñeta, bloom
  efectos.py    Animaciones de texto: golpe, rebote, subida con máscara, desenfoque de entrada,
                contadores, subtítulos karaoke, texto con video dentro, fugas de luz, apagón de TV
  audio.py      Mezcla con FFmpeg: voz + música con ducking (sidechain) + efectos alineados a su ataque,
                normalización en dos pasadas a −14 LUFS / −1.5 dBTP
  render.py     Render en paralelo por tramos, unión y exportación H.264 + AAC
ediciones/      Un archivo por video: planos, capas de texto y gráficos, golpes y efectos de sonido
guiones/        Guion y voz de cada video
```

Cada edición se sincroniza con la voz real: los textos aparecen en el momento exacto en que Whisper detectó cada palabra, y los cortes caen en los beats de la música.

## Licencias del material

- **Video, música y efectos de Mixkit:** [licencia gratuita de Mixkit](https://mixkit.co/license/), uso comercial sin atribución obligatoria.
- **Video de Coverr:** [licencia de Coverr](https://coverr.co/license), uso comercial sin atribución obligatoria. Se excluyen los clips premium y los generados con IA.
- **Tipografías:** Google Fonts (SIL Open Font License).
- **Recorte de personas:** Robust Video Matting (GPL-3.0): se usa como herramienta y no se distribuye con los videos.
- **Voz:** generada con la API de OpenAI. Al publicar, indica que la voz es sintética si la plataforma o el cliente lo piden.

La lista exacta de clips, pistas y efectos de cada video está en `salida/creditos.md`.
