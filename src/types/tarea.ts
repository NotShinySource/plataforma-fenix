export const TIPOS_ADJUNTO_TAREA = ["Ninguno", "PDF", "Audio"] as const;

export type TipoAdjuntoTarea = (typeof TIPOS_ADJUNTO_TAREA)[number];

/**
 * Colección raíz `tareas`, al mismo nivel que `usuarios` y `elencos`. Una
 * tarea es accionable (el alumno la marca como cumplida), a diferencia de un
 * aviso, que solo informa.
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
