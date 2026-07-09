export interface Aviso {
  elencoId: string;
  profesorId: string;
  titulo: string;
  contenido: string;
  urgente: boolean;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp() (decisión 4.2.9), nunca con Date del cliente. */
  fechaPublicacion: Date;
}

/**
 * Subcolección `avisos/{avisoId}/lecturas/{alumnoId}` (decisión 4.2.4). Solo se
 * escribe cuando el alumno abre el aviso, nunca de antemano para todos. El ID
 * del documento ya es el alumnoId, por eso no se repite como campo.
 */
export interface LecturaAviso {
  leido: boolean;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp() (decisión 4.2.9), nunca con Date del cliente. */
  fechaLectura: Date;
}
