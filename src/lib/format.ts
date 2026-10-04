export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatearFechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

/** `fechaSesion` es `YYYY-MM-DD` a propósito: forma parte del ID determinístico de la asistencia. */
export function formatearFechaSesion(fechaSesion: string): string {
  const [anio, mes, dia] = fechaSesion.split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** "15 de septiembre": día y mes, sin año, para fechas límite cercanas. */
export function formatearDiaMes(fecha: Date): string {
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "long" });
}

/** "8 oct", o "Hoy" si la fecha cae en el día actual. */
export function formatearFechaCorta(fecha: Date): string {
  if (fecha.toDateString() === new Date().toDateString()) return "Hoy";
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" }).replace(".", "");
}

/** Convierte una fecha al valor `YYYY-MM-DD` que usa <input type="date">, en hora local. */
export function fechaAValorInput(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** `YYYY-MM-DD` de un <input type="date"> al final de ese día, en hora local. */
export function valorInputAFinDeDia(valor: string): Date {
  const [anio, mes, dia] = valor.split("-").map(Number);
  return new Date(anio, mes - 1, dia, 23, 59, 59);
}

export function formatearTamanioArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Formatea un RUT chileno mientras el usuario escribe (puntos + guión antes
 * del dígito verificador). Puramente visual — quien la use sigue siendo
 * responsable de limpiar el valor (ver `limpiarRut` en `src/lib/auth/rut.ts`)
 * antes de derivar el correo sintético o guardarlo.
 */
export function formatearRutInput(valor: string): string {
  const limpio = valor.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  if (limpio.length === 0) return "";
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (cuerpo.length === 0) return dv;
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpoConPuntos}-${dv}`;
}
