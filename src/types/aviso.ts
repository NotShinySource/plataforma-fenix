export interface Aviso {
  elencoId: string;
  profesorId: string;
  titulo: string;
  contenido: string;
  urgente: boolean;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp(), nunca con Date del cliente: la fecha la fija el servidor. */
  fechaPublicacion: Date;
}

/**
 * Subcolección `avisos/{avisoId}/lecturas/{alumnoId}`. Solo se
 * escribe cuando el alumno abre el aviso, nunca de antemano para todos. El ID
 * del documento ya es el alumnoId, por eso no se repite como campo.
 */
export interface LecturaAviso {
  leido: boolean;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp(), nunca con Date del cliente: la fecha la fija el servidor. */
  fechaLectura: Date;
}
