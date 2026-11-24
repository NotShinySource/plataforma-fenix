/** Las justificaciones forman parte del total de asistencias registradas. */
export function porcentajeAsistencia(presentes: number, total: number): number {
  return total > 0 ? Math.round((presentes / total) * 100) : 0;
}
