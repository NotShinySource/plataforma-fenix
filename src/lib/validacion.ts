/**
 * Validaciones de formulario compartidas entre el navegador (feedback
 * inmediato) y los Server Actions (fuente de verdad: un Server Action es un
 * endpoint público y se revalida siempre ahí).
 */

export const LONGITUD_MAXIMA_EMAIL = 254;
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
