import type { ActuacionLanding, ContenidoLanding, ImagenLanding } from "@/types";

/**
 * Contenido de la Landing antes de que el Administrador la edite. Se muestra
 * mientras `contenido_landing/general` no exista, y se copia a Firestore la
 * primera vez que se abre el panel de la Landing.
 *
 * Las fotos vienen incluidas en el sitio (`public/imagenes`), por eso su
 * ruta de Storage queda vacía.
 */

function local(url: string): ImagenLanding {
  return { url, ruta: "" };
}

export const CONTENIDO_PREDETERMINADO: ContenidoLanding = {
  portada: {
    etiqueta: "Música para el Futuro",
    titulo: "El impacto del arte en la *comunidad* loína",
    descripcion:
      "Transformamos vidas a través de la educación musical gratuita y de excelencia. Fomentando el compañerismo, la disciplina y el rescate cultural en Calama.",
    imagen: local("/imagenes/inicio/principal.jpg"),
    tarjetas: [
      { valor: "700+", etiqueta: "Estudiantes activos" },
      { valor: "Matrícula 100%", etiqueta: "Gratuita" },
    ],
  },
  organizacion: {
    titulo: "Misión, historia y rescate cultural en Calama",
    parrafos: [
      "La Escuela de Música *Calambanda* nació bajo la convicción de que el arte es un motor de cambio social invaluable. Operamos activamente en los espacios patrimoniales restaurados de nuestra comuna, llevando alegría, educación y valores a familias enteras.",
      "Nuestra misión central es fomentar el talento artístico local, ofreciendo un entorno seguro, inclusivo y profesional para que personas de todas las edades desarrollen habilidades musicales óptimas. Rescatamos el patrimonio del desierto de Atacama mediante repertorios inspirados en nuestras raíces.",
    ],
    cifras: [
      { valor: "12", etiqueta: "Docentes Expertos" },
      { valor: "700+", etiqueta: "Alumnos Activos" },
      { valor: "Centro de Arte", etiqueta: "Ojo del Desierto" },
    ],
    pilares: [
      {
        titulo: "Inclusión Total",
        texto:
          "No exigimos conocimientos previos. Todo joven con ganas de aprender es bienvenido en nuestra familia.",
      },
      {
        titulo: "Rescate Patrimonial",
        texto:
          "Nuestros ensambles tocan melodías tradicionales del norte de Chile y la cosmovisión andina.",
      },
    ],
  },
};

export const ACTUACIONES_PREDETERMINADAS: ActuacionLanding[] = [
  {
    titulo: "Coco un poco loco",
    fecha: "2026-08-22",
    lugar: "Teatro Municipal de Calama",
    descripcion: "Presentación de «Coco un poco loco» en el Teatro Municipal de Calama.",
    imagenes: [
      local("/imagenes/actuaciones/coco/CocoP.jpg"),
      local("/imagenes/actuaciones/coco/Coco1.jpg"),
      local("/imagenes/actuaciones/coco/Coco2.jpg"),
      local("/imagenes/actuaciones/coco/Coco3.jpg"),
      local("/imagenes/actuaciones/coco/Coco4.jpg"),
      local("/imagenes/actuaciones/coco/Coco5.jpg"),
      local("/imagenes/actuaciones/coco/Coco6.jpg"),
      local("/imagenes/actuaciones/coco/CocoBanda.jpg"),
    ],
    enlaces: [{ etiqueta: "Ver video", url: "https://www.facebook.com/reel/1038820222308490" }],
    orden: 1,
    publicada: true,
  },
  {
    titulo: "Rey León",
    fecha: "2024-12-13",
    lugar: "Teatro Municipal de Calama",
    descripcion: "Presentación de «Rey León» en el Teatro Municipal de Calama.",
    imagenes: [
      local("/imagenes/actuaciones/Rey/ReyP.jpg"),
      local("/imagenes/actuaciones/Rey/Rey1.jpg"),
      local("/imagenes/actuaciones/Rey/Rey2.jpg"),
      local("/imagenes/actuaciones/Rey/Rey3.jpg"),
      local("/imagenes/actuaciones/Rey/Rey4.jpg"),
      local("/imagenes/actuaciones/Rey/Rey5.jpg"),
      local("/imagenes/actuaciones/Rey/Rey6.jpg"),
      local("/imagenes/actuaciones/Rey/Rey7.jpg"),
      local("/imagenes/actuaciones/Rey/Rey8.jpg"),
      local("/imagenes/actuaciones/Rey/Rey9.jpg"),
    ],
    enlaces: [],
    orden: 2,
    publicada: true,
  },
  {
    titulo: "Concierto Santa Cecilia",
    fecha: "2025-11-22",
    lugar: "Parque José Saavedra",
    descripcion: "Presentación de «Concierto Santa Cecilia» en el Parque José Saavedra.",
    imagenes: [
      local("/imagenes/actuaciones/Cecilia/CeciliaP.jpg"),
      local("/imagenes/actuaciones/Cecilia/Cecilia1.jpg"),
      local("/imagenes/actuaciones/Cecilia/Cecilia2.jpg"),
      local("/imagenes/actuaciones/Cecilia/Cecilia3.jpg"),
      local("/imagenes/actuaciones/Cecilia/Cecilia4.jpg"),
      local("/imagenes/actuaciones/Cecilia/Cecilia5.jpg"),
      local("/imagenes/actuaciones/Cecilia/Cecilia6.jpg"),
    ],
    enlaces: [],
    orden: 3,
    publicada: true,
  },
  {
    titulo: "Aladdin El Musical",
    fecha: "2025-08-30",
    lugar: "Teatro Municipal de Calama",
    descripcion: "Presentación de «Aladdin El Musical» en el Teatro Municipal de Calama.",
    imagenes: [
      local("/imagenes/actuaciones/Aladin/AladinP.jpg"),
      local("/imagenes/actuaciones/Aladin/Aladin1.jpg"),
      local("/imagenes/actuaciones/Aladin/Aladin2.jpg"),
      local("/imagenes/actuaciones/Aladin/Aladin3.jpg"),
      local("/imagenes/actuaciones/Aladin/Aladin4.jpg"),
      local("/imagenes/actuaciones/Aladin/Aladin5.jpg"),
      local("/imagenes/actuaciones/Aladin/Aladin7.jpg"),
      local("/imagenes/actuaciones/Aladin/Aladin8.jpg"),
      local("/imagenes/actuaciones/Aladin/Aladin9.jpg"),
    ],
    enlaces: [],
    orden: 4,
    publicada: true,
  },
  {
    titulo: "Concierto de Navidad",
    fecha: "2025-12-13",
    lugar: "Parque Loa",
    descripcion: "Presentación de «Concierto de Navidad» en el Parque Loa.",
    imagenes: [
      local("/imagenes/actuaciones/Navidad/Navip.jpg"),
      local("/imagenes/actuaciones/Navidad/Navi1.jpg"),
      local("/imagenes/actuaciones/Navidad/Navi2.jpg"),
      local("/imagenes/actuaciones/Navidad/Navi3.jpg"),
      local("/imagenes/actuaciones/Navidad/Navi4.jpg"),
      local("/imagenes/actuaciones/Navidad/Navi5.jpg"),
    ],
    enlaces: [],
    orden: 5,
    publicada: true,
  },
];
