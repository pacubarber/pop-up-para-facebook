# Videos con motion graphics — guiones virales

Formato: vertical 1080×1920, 30 fps, ~35 s (Reels / TikTok / Shorts / Facebook).
Voz en off (ElevenLabs vía vidIQ), música original generada, sincronización palabra por palabra con Whisper,
iconos 3D generados con OpenAI (`gpt-image-1`) y animación renderizada frame a frame (HTML + Playwright + ffmpeg).

> Cambia `@tucuenta` por tu usuario en `src/v1.html` y `src/v2.html` y vuelve a renderizar (ver "Cómo re-renderizar").

---

## Video 1 — "Tienes 3 segundos" (estilo oscuro / rojo)

**Tema:** por qué nadie ve tus videos → el gancho de los primeros 3 segundos.
**Por qué puede ser viral:** el video *se demuestra a sí mismo* (abre con un gancho de 3 s y una cuenta regresiva real),
da un dato concreto (65 %), una fórmula accionable de 3 pasos y cierra con un CTA de "guardar" (la señal que más pesa en el algoritmo de Instagram).

| Tiempo | Voz en off | Visual |
|---|---|---|
| 0:00 | Tienes tres segundos. | Cronómetro 3D rojo entra girando; cuenta regresiva real 3‑2‑1. "TRES SEGUNDOS" en tipografía cinética. |
| 0:02 | Solo tres. | El cronómetro vibra, "tres." en rojo con glow. |
| 0:03 | Ese es el tiempo que alguien te da antes de seguir haciendo scroll. | Mockup de celular con feed que acelera hasta desenfocarse; dedo haciendo swipe; "SCROLL." pop. |
| 0:07 | Y el problema no es tu contenido. | "NO ES" gigante en rojo; "tu contenido" se tacha con una línea roja. |
| 0:09 | Es tu primera frase. | "PRIMERA FRASE." con barrido de resaltado rojo; megáfono 3D pulsando. |
| 0:12 | El 65 % de las personas que ven los primeros 3 segundos de un video, se quedan por lo menos diez. | Contador 0 → 65 %; estatua griega roja mirando su celular; píldora "se quedan por lo menos 10s". |
| 0:19 | Así que deja de presentarte. Deja de decir: "hola, en este video". | "DEJA DE presentarte" → burbuja de chat "Hola, en este video…" que tiembla y recibe un sello ✕ rojo. |
| 0:25 | Empieza con un problema. Una pregunta. O un número que duela. | Tres tarjetas 01 / 02 / 03 entran sincronizadas con cada palabra. |
| 0:30 | Justo como hice yo contigo. | "HICE YO CONTIGO." + flashback del cronómetro, "65%" y "3 seg." |
| 0:32 | Guarda este video. Lo vas a necesitar. | "GUARDA este video" + icono 3D de guardar con glow rojo. |

**Copy para la publicación:**
> El 90 % de los videos mueren en el segundo 3. 💀 Esta es la fórmula para que el tuyo no. Guárdalo para tu próximo post 📌

**Hashtags:** `#marketingdigital #reels #tiktoktips #creadoresdecontenido #emprendedores #redessociales #ganchos #viral`

**Texto de portada:** "TIENES 3 SEGUNDOS"

---

## Video 2 — "Usaste IA hoy y ni te diste cuenta" (estilo claro / gris 3D)

**Tema:** la inteligencia artificial ya está en tu día a día.
**Por qué puede ser viral:** abre con una afirmación personal y sorprendente ("hoy usaste IA 10 veces"), usa ejemplos que
*todo el mundo* reconoce (Face ID, Netflix, el banco, Google Maps), tiene un contador visual que engancha
("IA usada hoy ●●●●") y cierra con un giro de FOMO ("antes que los demás") + CTA de seguir.

| Tiempo | Voz en off | Visual |
|---|---|---|
| 0:00 | Hoy usaste inteligencia artificial por lo menos diez veces. | Cabeza mitad humana / mitad robot; "INTELIGENCIA ARTIFICIAL" en degradado; contador 0 → 10. |
| 0:03 | Y ni te diste cuenta. | "CUENTA." gigante; la cabeza hace zoom lento. |
| 0:05 | Cuando desbloqueaste tu celular con la cara. Inteligencia artificial. | Celular 3D con marco Face ID y línea de escaneo azul; sello "✦ IA"; se llena el 1er punto del contador. |
| 0:10 | Cuando Netflix supo exactamente qué querías ver. Inteligencia artificial. | Balde de palomitas 3D + miniaturas; etiqueta "98% para ti"; sello "✦ IA" (2/4). |
| 0:16 | Cuando tu banco bloqueó una compra rara. También. | Tarjeta 3D con candado que tiembla; notificación "Compra sospechosa bloqueada"; "✦ IA también" (3/4). |
| 0:19 | Cuando Google Maps te esquivó el tráfico. Otra vez. | Mapa con tramo rojo de tráfico y ruta azul que se dibuja esquivándolo; pin 3D; "✦ IA otra vez" (4/4). |
| 0:23 | La pregunta ya no es si la IA va a cambiar tu vida… | Tipografía cinética: "ya no es **si**" → "CAMBIAR TU VIDA." |
| 0:27 | …es si vas a aprender a usarla antes que los demás. | "APRENDER A USARLA" + barras de carrera: "Tú" 92 % vs "Los demás" 34 %. |
| 0:31 | Sígueme. Te enseño cómo. | Tarjeta de perfil, cursor hace clic en "Seguir" → "Siguiendo ✓". |

**Copy para la publicación:**
> ¿Cuántas veces usaste IA hoy sin saberlo? 🤖 Cuéntame en los comentarios cuál te sorprendió más 👇

**Hashtags:** `#inteligenciaartificial #ia #tecnologia #chatgpt #futuro #aprendeia #productividad #viral`

**Texto de portada:** "USASTE IA HOY (Y NI TE DISTE CUENTA)"

---

## Tips de publicación
- Publica a la hora pico de tu audiencia (normalmente 12–14 h y 19–21 h).
- Fija un comentario con una pregunta para disparar respuestas ("¿Cuál es tu gancho favorito?").
- Agrega subtítulos automáticos de la plataforma si tu audiencia ve sin sonido (el texto en pantalla ya cubre la idea principal).
- Reutiliza el mismo video en Reels, TikTok, Shorts y Facebook; cambia sólo el copy.

## Cómo re-renderizar
```bash
# requisitos: node + playwright (Chromium), ffmpeg, python3
node scripts/render.mjs src/v1.html out/v1_silent.mp4 35.5
python3 scripts/mix.py out/v1_silent.mp4 audio/vo1.mp3 audio/music1.wav video1_tienes_3_segundos.mp4 35.5 "<eventos sfx>"
```
Los tiempos de cada palabra están en `audio/words1.json` / `audio/words2.json` (Whisper) por si cambias la voz.
