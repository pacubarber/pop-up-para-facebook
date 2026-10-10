# Cierre y onboarding de clientes

## Llamada de cierre (15 minutos)

1. **Contexto (3 min):** "¿Qué te pareció el video que te hice? ¿Qué cambiarías?"
2. **Objetivo (3 min):** "¿Qué quieres que pase con tus videos en 3 meses? ¿Más mensajes, más reservas, más seguidores?"
3. **Situación (3 min):** "¿Cuántos videos publicas hoy? ¿Quién graba? ¿Cuánto tiempo te toma?"
4. **Propuesta (3 min):** recomienda **una** opción según el volumen. "Con lo que me cuentas, te sirve el paquete de 6 videos por 50 USD." Si sube videos a YouTube, suma el formato largo: 20 USD por video.
5. **Cierre (3 min):** "¿Empezamos esta semana? Te mando el link de pago y el formulario de marca."

Si duda: "Empecemos con un solo reel, de 5 a 8 USD, y decides con el video en la mano."

## Checklist de onboarding (día 0–2)

- [ ] Pago recibido (por adelantado).
- [ ] Acuerdo firmado (ver abajo).
- [ ] **Brief de marca** respondido:
  - Objetivo de los videos y llamada a la acción principal.
  - Público (edad, ciudad, qué le importa).
  - Tono: serio, cercano, divertido o premium.
  - Logo (PNG/SVG), colores (HEX) y tipografías.
  - 3 cuentas o videos de referencia que le gusten.
  - Palabras o temas que NO quiere.
- [ ] Carpeta compartida (Drive) con esta estructura:

```
CLIENTE/
├── 00-marca/          (logo, fuentes, colores, brief)
├── 01-en-bruto/       (lo que graba el cliente, por fecha)
├── 02-en-edicion/     (uso interno)
├── 03-para-revisar/   (versiones v1, v2)
└── 04-aprobados/      (finales listos para publicar)
```

- [ ] Calendario del mes: qué video sale qué día, con su gancho.
- [ ] Grupo de WhatsApp o canal para aprobaciones rápidas.

## Flujo de cada video

1. El cliente sube material a `01-en-bruto/`.
2. Edición con el estudio Remotion (`studio/`), que mantiene plantillas por cliente con sus colores y fuentes.
3. Revisión interna con `npm run frames -- video.mp4`: hoja de contactos para revisar ritmo, textos y errores.
4. Se sube la v1 a `03-para-revisar/` y se avisa al cliente.
5. Cambios (máximo 2 rondas), luego a `04-aprobados/` con la descripción y los hashtags sugeridos.

## Acuerdo de servicio (puntos mínimos)

Basta con un documento de una página que cubra:
- **Alcance:** qué compra (reel suelto, paquete de 6 o formato largo), duración máxima de cada video y lo que incluye o no.
- **Plazos:** entrega en 48–72 h desde que llega el material completo.
- **Revisiones:** 2 rondas por video; las extra se cobran aparte.
- **Pagos:** monto y pago por adelantado; sin pago confirmado no se empieza a editar.
- **Derechos:** el cliente es dueño de los videos finales; CORTE puede mostrarlos en su portafolio salvo que el cliente diga lo contrario.
- **Música y material:** solo música con licencia; el cliente garantiza tener derechos sobre lo que envía.
- **Cancelación:** aviso con 15 días de anticipación.

## Reporte mensual (retención de clientes)

Cada fin de mes manda un resumen corto: videos entregados, los 3 que mejor funcionaron (vistas, retención, mensajes), qué aprendimos y qué probaremos el mes siguiente. Los clientes que ven resultados medidos no cancelan.
