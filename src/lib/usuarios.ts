/** Utilidades de presentación para cualquier objeto con nombres y apellidos. */
interface ConNombre {
  nombres: string;
  apellidos: string;
}

export function nombreCompleto(usuario: ConNombre): string {
  return `${usuario.nombres} ${usuario.apellidos}`;
}

/** "María Pérez" → "MP", para el círculo con iniciales. */
export function iniciales(usuario: ConNombre): string {
  return `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase();
}

/**
 * Búsqueda por nombre, sin distinguir mayúsculas. Un término vacío coincide
 * con todos. La búsqueda por RUT se hace en el servidor (useBusquedaPorRut).
 */
export function coincideNombre(usuario: ConNombre, termino: string): boolean {
  const t = termino.trim().toLowerCase();
  if (!t) return true;
  return nombreCompleto(usuario).toLowerCase().includes(t);
}

/** Orden alfabético por apellido, como en una lista de curso. */
export function compararPorApellido(a: ConNombre, b: ConNombre): number {
  return `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`, "es");
}
