// Datos del sitio: contacto, precios y portafolio.
// Las tres variantes (ritmo/, croma/, barras/) y sus páginas de portafolio leen
// este archivo, así que un cambio aquí se ve en todas.
//
// Para sumar un video al portafolio:
//   1. Copia el .mp4 y su miniatura .jpg a web/media/
//   2. Crea la vista previa muda de 6 s (opcional, pero carga mucho más rápido):
//        ffmpeg -ss 1 -t 6 -i web/media/NOMBRE.mp4 -an -vf "scale=360:-2,fps=30" \
//          -c:v libx264 -crf 30 -pix_fmt yuv420p -movflags +faststart web/media/previews/NOMBRE.mp4
//      (para videos 16:9 usa scale=640:-2)
//   3. Agrega una entrada a `portafolio`. El orden de la lista es el orden en la web.
window.CORTE = {
  // CONFIGURA AQUÍ tus datos reales antes de publicar.
  contacto: {
    instagram: 'corte.studio',
    email: 'hola@cortestudio.co',
    whatsapp: '', // con código de país y sin espacios, p. ej. '573001234567'. Vacío = no se muestra.
  },

  precios: [
    {nombre: 'Reel', precio: '$5–8', unidad: 'por reel'},
    {nombre: 'Paquete', precio: '$50', unidad: '6 videos'},
    {nombre: 'Formato largo', precio: '$20', unidad: 'por video'},
  ],
  incluye: 'Subtítulos, música y 2 rondas de cambios en cada video.',

  portafolio: [
    {
      id: 'showreel', titulo: 'Showreel CORTE', tipo: 'Showreel', formato: '16:9', duracion: '0:34',
      video: 'media/showreel-corte.mp4', poster: 'media/showreel-corte.jpg', preview: 'media/previews/showreel-corte.mp4',
    },
    {
      id: 'mente-fundadora', titulo: 'Mente Fundadora', tipo: 'Clip de podcast', formato: '9:16', duracion: '0:26',
      video: 'media/podcast-mente-fundadora.mp4', poster: 'media/podcast-mente-fundadora.jpg', preview: 'media/previews/podcast-mente-fundadora.mp4',
    },
    {
      id: 'grano-alto', titulo: 'Grano Alto', tipo: 'Anuncio', formato: '9:16', duracion: '0:15',
      video: 'media/anuncio-grano-alto.mp4', poster: 'media/anuncio-grano-alto.jpg', preview: 'media/previews/anuncio-grano-alto.mp4',
    },
    {
      id: 'casa-alameda', titulo: 'Casa Alameda', tipo: 'Inmobiliaria', formato: '9:16', duracion: '0:18',
      video: 'media/inmobiliaria-casa-alameda.mp4', poster: 'media/inmobiliaria-casa-alameda.jpg', preview: 'media/previews/inmobiliaria-casa-alameda.mp4',
    },
    {
      id: 'flujo', titulo: 'Flujo', tipo: 'Producto SaaS', formato: '16:9', duracion: '0:16',
      video: 'media/saas-flujo.mp4', poster: 'media/saas-flujo.jpg', preview: 'media/previews/saas-flujo.mp4',
    },
  ],
};
