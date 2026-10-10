# Entregas · videos v2 (voz OpenAI sin silencios)

Todos son verticales 1080×1920 a 30 fps, salvo Flujo, que es horizontal 1920×1080. El audio está normalizado a −14 LUFS (el estándar de Reels, TikTok y Shorts) y cada video trae su portada `.jpg`.

| Carpeta | Video | Duración | Qué es |
|---|---|---|---|
| `motivacionales/` | `disciplina.mp4` | 25 s | Video real con texto detrás de la persona, video dentro de la palabra "DOLOR", contadores, letras que se deshacen y foto final congelada con contorno |
| `motivacionales/` | `nadie-va-a-venir-a-salvarte.mp4` | 20 s | Voz femenina y video real: "NADIE" en vertical, y "TÚ", "8" y "HOY" detrás de las atletas; "SE CONSTRUYE" se arma letra por letra |
| `biblioteca/` | `restaurante-3-errores.mp4` | 41 s | Idea #1 · "3 errores que te hacen perder clientes" (restaurantes) |
| `biblioteca/` | `sabias-que-oceano.mp4` | 34 s | Idea #2 · "¿Sabías que…?" sobre el océano, con 6 datos |
| `biblioteca/` | `guia-mexico-5-lugares.mp4` | 34 s | Idea #4 · Guía de destino con mapa animado; el texto queda detrás de la pirámide y de la parroquia |
| `estilo-cafe/` | `fresca-jugos.mp4` | 15 s | Estilo Grano Alto, más rápido (una escena cada ~1,3 s): jugos prensados en frío |
| `estilo-cafe/` | `brasa-smash-burgers.mp4` | 17 s | Estilo Grano Alto, más rápido: hamburguesas smash |
| `saas/` | `cobra-facturas.mp4` | 21 s | Marca SaaS: app de facturas y cobros |
| `portafolio-voz-nueva/` | Grano Alto · Flujo · Casa Alameda · Mente Fundadora | 14–22 s | El portafolio anterior con la voz nueva, sin silencios |

`web/media` no se tocó: si la landing quiere usar las versiones nuevas del portafolio, están en `portafolio-voz-nueva/`.

## Qué cambió en la voz

Antes la locución salía de una voz offline con pausas fijas entre frases (≈25–30% del video era aire). Ahora (`studio/tools/voz.py`):

1. **OpenAI TTS** (`gpt-4o-mini-tts`) genera cada frase con indicaciones de actuación (coach intenso, narrador de documental, creadora de viajes…).
2. **Se recorta el aire**: silencios y respiraciones de más de 0,14 s quedan en 0,06 s, y entre frases queda un respiro de 0,06–0,07 s.
3. **Whisper "escucha"** cada frase: comprueba que diga exactamente el guion (si no coincide, la vuelve a generar) y da el tiempo real de cada palabra. Con esos tiempos se sincronizan cortes, textos y efectos de sonido.

Resultado: entre el **93 y el 98% del tiempo hay voz**, sin huecos muertos.

> Las voces son sintéticas (IA). Si una plataforma o cliente lo pide, hay que indicarlo.

## Material, música y licencias

- **Video real:** [Mixkit](https://mixkit.co/license/#videoFree), con licencia gratuita para uso comercial y sin atribución obligatoria. La lista exacta de clips de cada video está en `studio/scripts/stock/*.json`.
- **Música y efectos:** sintetizados desde cero en `studio/tools/audio.py`, sin material de terceros.
- **Recorte de personas:** Robust Video Matting (modelo abierto). El cielo se recorta por color (pirámide, parroquia).
- Las marcas Fresca, Brasa, Cobra, Grano Alto y Flujo son ficticias.

## Las 5 ideas con material de biblioteca

1. ✅ **"3 errores que te hacen perder clientes" por nicho**: hecho para restaurantes. Se replica cambiando el guion y los clips para gimnasios, clínicas o barberías.
2. ✅ **"¿Sabías que…?"**: hecho sobre el océano. Funciona como serie para una cuenta sin rostro.
3. ⏳ **Spec ad de negocio local con video real**: manos haciendo café, pan o un corte, con precio y llamado a la acción. Es la versión "real" de los videos de prospección.
4. ✅ **Guía de destino**: hecha con 5 lugares de México. Sirve para hoteles, agencias de viajes e inmobiliarias.
5. ⏳ **"Tienes 1,7 segundos"**: contenido para CORTE con un dato sobre la atención en redes, contadores y glitch entre clips de gente haciendo scroll.

## Cómo regenerar

```bash
cd studio
npm install && pip install openai sherpa-onnx scipy numpy onnxruntime
python3 tools/audio.py            # música y efectos (public/audio)
npm run stock                     # baja y recorta el material de Mixkit (public/stock, no se sube a git)
npm run voz                       # SOLO si cambias un guion: cada toma de OpenAI es distinta (requiere OPENAI_API_KEY)
node scripts/render.mjs Disciplina Nadie Restaurante Oceano Mexico Fresca Brasa Cobra --no-web
node scripts/render.mjs Cafe Saas Inmobiliaria Podcast --no-web
npm run entregar                  # versiones livianas + portadas → entregas/
```

Las locuciones ya generadas (`studio/public/voz/*.wav` + `.json`) están en el repo, así que para volver a renderizar no hace falta la API.
