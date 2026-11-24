/**
 * "elenco": el aviso es para los miembros de un grupo. "escuela": lo ven
 * todos los alumnos y docentes (por ejemplo, la suspensión de clases por un
 * feriado). Solo la Dirección publica avisos para toda la escuela.
 */
export type AlcanceAviso = "elenco" | "escuela";

/** Quién lo publicó: el docente del grupo o la Dirección (el Administrador). */
export type OrigenAviso = "profesor" | "direccion";

export interface Aviso {
  alcance: AlcanceAviso;
  origen: OrigenAviso;
  /** Grupo destinatario; `null` en un aviso para toda la escuela. */
  elencoId: string | null;
  /** Autor: el docente o el Administrador que lo publicó. */
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
