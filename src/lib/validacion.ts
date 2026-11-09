/**
 * Validaciones de formulario compartidas entre el navegador (feedback
 * inmediato) y los Server Actions (fuente de verdad: un Server Action es un
 * endpoint público y se revalida siempre ahí).
 */

const LONGITUD_MAXIMA_EMAIL = 254;
export const LONGITUD_MINIMA_PASSWORD = 8;

/** Formato razonable de correo: algo@dominio.tld, sin espacios. No verifica que exista. */
export function esEmailValido(email: string): boolean {
  return (
    email.length <= LONGITUD_MAXIMA_EMAIL && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

/** Normaliza un correo para guardarlo: sin espacios alrededor y en minúsculas. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Fecha de nacimiento en formato YYYY-MM-DD (el que entrega <input type="date">):
 * debe existir en el calendario, no ser futura ni anterior a 1900.
 */
export function esFechaNacimientoValida(fecha: string): boolean {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!coincidencia) return false;

  const [anio, mes, dia] = coincidencia.slice(1).map(Number);
  const comoFecha = new Date(Date.UTC(anio, mes - 1, dia));
  const existe =
    comoFecha.getUTCFullYear() === anio &&
    comoFecha.getUTCMonth() === mes - 1 &&
    comoFecha.getUTCDate() === dia;

  return existe && anio >= 1900 && comoFecha.getTime() <= Date.now();
}

export const LONGITUD_MAXIMA_TITULO_TAREA = 120;

// Los mismos límites que exigen firestore.rules al crear el documento.
export const LONGITUD_MAXIMA_TITULO_MATERIAL = 150;
export const LONGITUD_MAXIMA_CATEGORIA_MATERIAL = 60;
export const LONGITUD_MAXIMA_TITULO_AVISO = 150;
export const LONGITUD_MAXIMA_CONTENIDO_AVISO = 5000;

const MEGABYTE = 1024 * 1024;

/**
 * Formatos y tamaños máximos del material de estudio (restricciones R2 y R4).
 * storage.rules exige lo mismo: esto solo da el aviso antes de subir.
 */
const LIMITES_MATERIAL = {
  pdf: { extension: ".pdf", maximoBytes: 25 * MEGABYTE, etiqueta: "PDF de hasta 25 MB" },
  mp3: { extension: ".mp3", maximoBytes: 50 * MEGABYTE, etiqueta: "audio .mp3 de hasta 50 MB" },
  wav: { extension: ".wav", maximoBytes: 50 * MEGABYTE, etiqueta: "audio .wav de hasta 50 MB" },
} as const;

export const ACCEPT_MATERIAL = {
  pdf: ".pdf,application/pdf",
  mp3: ".mp3,audio/mpeg",
  wav: ".wav,audio/wav,audio/x-wav",
} as const;

/** Devuelve el mensaje de error, o null si el archivo es aceptable. */
export function validarArchivoMaterial(archivo: File, tipo: keyof typeof LIMITES_MATERIAL): string | null {
  const limite = LIMITES_MATERIAL[tipo];
  if (!archivo.name.toLowerCase().endsWith(limite.extension) || archivo.size > limite.maximoBytes) {
    return `El archivo debe ser un ${limite.etiqueta}.`;
  }
  return null;
}

/** Formatos y tamaños máximos admitidos para el material adjunto de una tarea. */
const LIMITES_ADJUNTO = {
  PDF: { extensiones: [".pdf"], maximoBytes: 25 * MEGABYTE, etiqueta: "PDF de hasta 25 MB" },
  Audio: {
    extensiones: [".mp3", ".wav"],
    maximoBytes: 50 * MEGABYTE,
    etiqueta: "audio .mp3 o .wav de hasta 50 MB",
  },
} as const;

export const ACCEPT_ADJUNTO = {
  PDF: ".pdf,application/pdf",
  Audio: ".mp3,.wav,audio/mpeg,audio/wav",
} as const;

/** Devuelve el mensaje de error, o null si el archivo es aceptable. */
export function validarAdjunto(archivo: File, tipo: "PDF" | "Audio"): string | null {
  const limite = LIMITES_ADJUNTO[tipo];
  const nombre = archivo.name.toLowerCase();
  const formatoValido = limite.extensiones.some((extension) => nombre.endsWith(extension));

  if (!formatoValido || archivo.size > limite.maximoBytes) {
    return `El archivo debe ser un ${limite.etiqueta}.`;
  }
  return null;
}

/** Imágenes de la Landing (restricciones R2 y R4). storage.rules exige lo mismo. */
const MAXIMO_IMAGEN_LANDING = 5 * MEGABYTE;
const EXTENSIONES_IMAGEN_LANDING = [".jpg", ".jpeg", ".png", ".webp"];

export const ACCEPT_IMAGEN_LANDING = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

/** Devuelve el mensaje de error, o null si la imagen es aceptable. */
export function validarImagenLanding(archivo: File): string | null {
  const nombre = archivo.name.toLowerCase();
  if (!EXTENSIONES_IMAGEN_LANDING.some((extension) => nombre.endsWith(extension))) {
    return "La imagen debe ser JPG, PNG o WebP.";
  }
  if (archivo.size > MAXIMO_IMAGEN_LANDING) return "La imagen no puede superar los 5 MB.";
  return null;
}
