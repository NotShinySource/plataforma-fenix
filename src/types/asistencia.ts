/**
 * La toma de asistencia dentro de una clase solo usa "presente" y "ausente".
 * "justificado" se conserva para leer registros anteriores a ese flujo.
 */
export type EstadoAsistencia = "presente" | "ausente" | "justificado";

/**
 * ID determinístico, así tomar o corregir la asistencia es un set() idempotente:
 * - asistencia tomada dentro de una clase: `{sesionId}_{alumnoId}`, porque un
 *   elenco puede tener más de una clase el mismo día;
 * - registros anteriores a las clases: `{elencoId}_{alumnoId}_{fechaSesion}`.
 */
export interface Asistencia {
  elencoId: string;
  alumnoId: string;
  profesorId: string;
  /** Día de la clase, formato YYYY-MM-DD. */
  fechaSesion: string;
  estado: EstadoAsistencia;
  /** Sesión de clase en que se tomó (ausente en los registros antiguos). */
  sesionId?: string;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp(), nunca con Date del cliente: la fecha la fija el servidor. */
  fechaRegistro: Date;
}

/**
 * Colección raíz `observaciones_asistencia`, con el mismo ID que la
 * asistencia a la que corresponde. Es lo que el docente registra con el
 * "ojito": un incidente o falta durante la clase. Uso interno de docentes y
 * administración: va en un documento aparte porque el alumno sí puede leer
 * su asistencia, y las reglas de Firestore no pueden ocultar un solo campo.
 */
export interface ObservacionAsistencia {
  elencoId: string;
  sesionId: string;
  alumnoId: string;
  profesorId: string;
  texto: string;
  /** Se escribe con FieldValue.serverTimestamp(), nunca con Date del cliente. */
  fechaRegistro: Date;
}
