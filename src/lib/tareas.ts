import type { ConId, Tarea } from "@/types";

/** Recibe solo las tareas visibles para este alumno, filtradas por Firestore. */
export function tareasNuevasParaAlumno(
  tareas: ConId<Tarea>[],
  alumnoId: string,
  vistas: ReadonlySet<string>,
): ConId<Tarea>[] {
  return tareas.filter((tarea) =>
    tarea.notificarAsignacion && !vistas.has(tarea.id) && !tarea.completadoPor.includes(alumnoId)
  );
}
