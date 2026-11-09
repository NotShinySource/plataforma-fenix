/**
 * Plazo de conservación de una cuenta egresada, según la Política de
 * Privacidad: al egresar la cuenta se inhabilita, y sus datos de acceso y de
 * contacto se eliminan pasado este plazo (salvo que la persona se reactive).
 *
 * Sin dependencias de servidor: lo usan tanto el panel (para mostrar la fecha
 * de eliminación) como los Server Actions (que vuelven a calcularla).
 */
export const MESES_CONSERVACION_EGRESADOS = 12;

/** Fecha desde la que una cuenta egresada ya puede eliminarse. */
export function fechaEliminacionEgresado(fechaEgreso: Date): Date {
  const fecha = new Date(fechaEgreso);
  fecha.setMonth(fecha.getMonth() + MESES_CONSERVACION_EGRESADOS);
  return fecha;
}

export function egresoVencido(fechaEgreso: Date, ahora: Date = new Date()): boolean {
  return fechaEliminacionEgresado(fechaEgreso).getTime() <= ahora.getTime();
}
