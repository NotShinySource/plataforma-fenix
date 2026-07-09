export type EstadoAsistencia = "presente" | "ausente" | "justificado";

/** ID determinístico `{elencoId}_{alumnoId}_{fechaSesion}` (decisión 4.2.3): tomar/editar asistencia es un set() idempotente. */
export interface Asistencia {
  elencoId: string;
  alumnoId: string;
  profesorId: string;
  /** Formato YYYY-MM-DD: es el mismo string que compone el ID del documento. */
  fechaSesion: string;
  estado: EstadoAsistencia;
  observaciones?: string;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp() (decisión 4.2.9), nunca con Date del cliente. */
  fechaRegistro: Date;
}
