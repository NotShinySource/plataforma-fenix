/**
 * Contenido editable de la Landing (RF-14). Lo escribe solo el servidor
 * (Server Actions del Administrador) y lo lee el servidor al armar la página
 * pública: las reglas de Firestore no dejan leerlo ni escribirlo desde el
 * navegador.
 */

/**
 * Una imagen de la Landing. `ruta` es la ubicación en Storage
 * (`landing/...`); queda vacía para las fotos incluidas en el sitio
 * (`/imagenes/...`), que no viven en Storage y no se borran nunca.
 */
export interface ImagenLanding {
  url: string;
  ruta: string;
}

/** Cifra destacada: "700+" / "Estudiantes activos". */
export interface CifraLanding {
  valor: string;
  etiqueta: string;
}

export interface PilarLanding {
  titulo: string;
  texto: string;
}

/**
 * Documento `contenido_landing/general`. En los títulos y párrafos, el texto
 * entre asteriscos se destaca (por ejemplo, "en la *comunidad* loína").
 */
export interface ContenidoLanding {
  portada: {
    /** Etiqueta pequeña sobre el título. */
    etiqueta: string;
    titulo: string;
    descripcion: string;
    imagen: ImagenLanding;
    /** Las dos tarjetas flotantes sobre la foto. */
    tarjetas: [CifraLanding, CifraLanding];
  };
  organizacion: {
    titulo: string;
    parrafos: string[];
    cifras: [CifraLanding, CifraLanding, CifraLanding];
    pilares: [PilarLanding, PilarLanding];
  };
}

export interface EnlaceActuacion {
  etiqueta: string;
  url: string;
}

/** Colección raíz `actuaciones_landing`. */
export interface ActuacionLanding {
  titulo: string;
  /** Día del evento, `YYYY-MM-DD`. */
  fecha: string;
  lugar: string;
  descripcion: string;
  /** La primera es la portada de la tarjeta; el resto se ve en la galería. */
  imagenes: ImagenLanding[];
  enlaces: EnlaceActuacion[];
  /** Posición en el carrusel: menor primero. */
  orden: number;
  /** Un borrador no aparece en la Landing. */
  publicada: boolean;
}
