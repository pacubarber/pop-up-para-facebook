# Estrategia de captación de clientes — CORTE

> Mercado inicial: **Latinoamérica, precios en USD, español neutro.** Si apuntas a España o a hispanos en EE. UU., cambia solo los precios (ver `03-precios-y-paquetes.md`); el método es el mismo.

## La idea central

Una agencia nueva no tiene testimonios, así que **el portafolio y el video personalizado hacen de testimonio**. Nunca escribimos "¿necesitas un editor?". Mandamos **un video hecho para esa persona** (`npm run pitch`), el **enlace al portafolio** y precios claros desde el primer mensaje: **reels desde 5 USD**. Así el cliente decide viendo el resultado, no leyendo una promesa. No regalamos videos de prueba: con precios tan bajos, la prueba es pagar un solo reel.

```
Investigar 20 cuentas → video personalizado → DM o email con el portafolio → «QUIERO» → primer pedido (un reel o el paquete de 6) → cliente que repite
```

## 1. Elegir nicho (los primeros 90 días)

Elige **1 nicho principal y 1 de respaldo**. Especializarte hace que el portafolio, los mensajes y las ideas suenen a experto.

| Nicho | Por qué funciona | Señal de que necesitan editor |
|---|---|---|
| **Inmobiliarias y agentes** | Cada propiedad es un video; tienen margen alto | Publican fotos o videos sin subtítulos ni música |
| **Clínicas (dental, estética)** | Contenido de antes y después rinde mucho | Reels largos, sin gancho, con audio malo |
| **Gimnasios y entrenadores** | Publican a diario y el ritmo importa | Cortes lentos, sin texto en pantalla |
| **Restaurantes y cafeterías** | Mucho volumen, decisión rápida del dueño | Videos "crudos" de celular sin edición |
| **Coaches, creadores y podcasts** | Ya graban mucho; les falta tiempo para editar | Lives o podcasts sin cortar en clips |

**Recomendado para empezar:** inmobiliarias (pagan mejor) y, como respaldo, clínicas o coaches.

## 2. Canales, en orden de prioridad

### 1) DM de Instagram con video personalizado (el canal principal)
- **Para quién:** negocios locales y creadores de 2.000 a 100.000 seguidores que **ya publican video** pero mal editado.
- **Cómo:** sigue la cuenta, reacciona a 1 o 2 historias, y al día siguiente manda el video de `prospeccion/videos/` más el texto de `prospeccion/mensajes/`.
- **Volumen:** 15–25 DMs al día. Con una cuenta nueva, empieza con 10 al día durante la primera semana para que Instagram no la limite.
- **Clave:** cada DM lleva el nombre, el negocio y 3 ideas del nicho. Nada de copiar y pegar genérico.

### 2) Email en frío con video (segundo canal)
- **Para quién:** negocios con web y email público: inmobiliarias, clínicas, SaaS, podcasts, consultoras.
- **Cómo:** la secuencia de `02-guiones-dm-y-email.md` (3 correos + cierre). El video va como enlace, nunca adjunto.
- **Volumen:** 20–40 correos al día desde un **dominio secundario** (p. ej. `hola@cortestudio-mail.com`) con SPF, DKIM y DMARC configurados, para proteger el dominio principal.
- **Legal:** escribe solo a correos de empresa publicados, identifícate, incluye una línea para darse de baja y respeta a quien diga que no. En España aplica el RGPD/LSSI: allí es mejor usar email solo con empresas y priorizar LinkedIn o DM.

### 3) Contenido propio (marketing que trabaja solo)
- Publica en el Instagram y TikTok de CORTE **3 piezas por semana**: antes y después de una edición, "cómo editaría el video de X", y clips del showreel.
- Cada pieza termina con: *"¿Quieres que edite los tuyos? Reels desde 5 USD. Escribe EDITA por DM."*

### 4) Alianzas con agencias de marketing y community managers
- Muchas agencias de redes **no editan video** y lo subcontratan. Ofréceles edición *white label* (sin tu marca) con un 15–20 % de descuento por volumen.
- Un socio puede traer de 3 a 10 clientes. Busca "agencia de marketing digital + ciudad" en Google Maps y en Instagram.

### 5) Plataformas freelance (para las primeras reseñas)
- Workana (LatAm), Upwork, Fiverr y Malt (España). Úsalas el primer mes para conseguir **reseñas y casos reales**, y luego pásalos a trato directo con el paquete de 6 videos.

### 6) Referidos
- A cada cliente: *"Si me recomiendas a alguien que contrate, tu próximo paquete tiene un 20 % de descuento."*

### 7) LinkedIn (solo B2B)
- Para SaaS, consultoras y podcasts de negocios. Comenta en sus publicaciones 3 días seguidos y luego manda el video personalizado por mensaje.

## 3. Cómo encontrar prospectos (20 al día)

1. **Instagram:** busca hashtags de nicho + ciudad (`#inmobiliariaguadalajara`, `#dentistalima`, `#gymbogota`) y abre la pestaña de Reels.
2. **Google Maps:** "clínica dental en [ciudad]" → entra a la web → busca su Instagram y su email.
3. **Biblioteca de anuncios de Meta** (facebook.com/ads/library): quien **ya paga anuncios** tiene presupuesto. Es el mejor filtro.
4. **Spotify / YouTube:** podcasts en español con menos de 50 episodios y sin clips en redes.

**Calificación rápida (3 de 4 para contactar):**
- [ ] Publica video al menos 2 veces por semana.
- [ ] La edición es floja: sin subtítulos, sin gancho, sin ritmo o con mal audio.
- [ ] Tiene señales de presupuesto: local físico, anuncios activos, precios altos.
- [ ] Cuenta activa en los últimos 7 días.

Anota cada prospecto en `prospeccion/leads.csv` (nombre, negocio, @, nicho, ciudad y color de marca, que sacas del logo con un cuentagotas) y genera todos los videos de una vez:

```bash
cd studio && npm run pitch -- --csv ../prospeccion/leads.csv
```

## 4. Rutina diaria (2–3 horas)

| Bloque | Tarea | Tiempo |
|---|---|---|
| 1 | Investigar y calificar 20 cuentas → `leads.csv` | 45 min |
| 2 | Generar videos personalizados (`npm run pitch`) | 10 min (corre solo) |
| 3 | Enviar DMs y emails + seguimientos del día | 45 min |
| 4 | Editar los pedidos pagados | 30–60 min |
| 5 | Publicar 1 pieza de contenido propio | 15 min |

Al enviar, actualiza la columna `estado`: `por_contactar → contactado → respondio → primer_pedido → cliente / descartado`.

## 5. Números a vigilar (estimaciones para calibrar, no garantías)

| Métrica | Meta inicial | Si estás por debajo… |
|---|---|---|
| Respuesta a DM/email | 10–20 % | Mejora el gancho del video y el nicho |
| Respuesta → primer pedido | 25–40 % | Los precios no se entienden o el portafolio no convence: muestra piezas de su nicho |
| Primer pedido → vuelve a comprar | 40–60 % | Mejora la calidad o haz la llamada de cierre |

Con **100 contactos por semana** deberías cerrar de 2 a 4 clientes al mes. Haz las cuentas con los precios actuales: cada paquete son 50 USD, así que para facturar 1.000 USD al mes necesitas vender 20 paquetes (120 videos).

## 6. Lo que NO hacer

- Comprar listas de emails o seguidores.
- Mandar el mismo DM a 200 cuentas: Instagram bloquea la cuenta y quema tu marca.
- Bajar precios en la primera conversación: ya son precios de entrada.
- Editar videos gratis "de prueba". Para eso están el portafolio y el reel de 5 USD.
- Usar música con copyright en los videos de clientes (usa bibliotecas con licencia o la música propia de `studio/tools/audio.py`).
