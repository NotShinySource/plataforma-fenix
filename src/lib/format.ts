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
