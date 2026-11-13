export const TIPOS_ADJUNTO_TAREA = ["Ninguno", "PDF", "Audio"] as const;

export type TipoAdjuntoTarea = (typeof TIPOS_ADJUNTO_TAREA)[number];

/**
 * Colección raíz `tareas`, al mismo nivel que `usuarios` y `elencos`. Una
 * tarea es accionable (el alumno la marca como cumplida), a diferencia de un
 * aviso, que solo informa.
 *
 * Puede ir dirigida a todo el elenco (`alumnoId: null`) o a un solo alumno de
 * ese elenco. Una tarea individual solo la ven ese alumno, los docentes del
 * elenco y la Dirección; los compañeros no.
 *
 * El estado es por alumno: `completadoPor` lista a quienes ya la cumplieron
 * y `completadoEn` guarda cuándo lo hizo cada uno (clave = uid del alumno),
 * que es lo que permite contar las "completadas esta semana".
 */
export interface Tarea {
  titulo: string;
  elencoId: string;
  /** Docente que la asignó: es el único que puede editarla o eliminarla. */
  profesorId: string;
  /**
   * Alumno destinatario, o `null` si la tarea es para todo el elenco. Se
   * guarda siempre (también como `null`) porque las consultas del alumno
   * filtran por este campo, y Firestore no encuentra documentos donde falta.
   */
  alumnoId: string | null;
  fechaLimite?: Date;
  tipoAdjunto: TipoAdjuntoTarea;
  urlAdjunto?: string;
  /** Nombre original del archivo, para mostrarlo en la tarjeta. */
  nombreAdjunto?: string;
  completadoPor: string[];
  /** Se escribe con serverTimestamp() al marcar, nunca con el reloj del alumno. */
  completadoEn: Record<string, Date>;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp(), nunca con Date del cliente. */
  fechaCreacion: Date;
}
