/**
 * Período académico. ID del documento: `{anio}-{numero}` (p. ej. "2026-1").
 * Las fechas van como `YYYY-MM-DD`: son días de calendario, sin hora ni zona
 * horaria, igual que `fechaSesion` en las asistencias.
 */
export interface Semestre {
  anio: number;
  numero: 1 | 2;
  fechaInicio: string;
  fechaFin: string;
}

/**
 * Cómo se repite una clase. "unica" ocurre solo en `fechaInicio`. "semanal"
 * se repite el mismo día de la semana hasta el fin del semestre indicado: se
 * guarda el semestre y no la fecha de término, para que si la
 * administración corrige el fin del semestre, las clases se ajusten solas.
 */
export type RepeticionClase = { tipo: "unica" } | { tipo: "semanal"; semestreId: string };

/**
 * Colección raíz `clases`: el horario de un elenco (la "serie"). Las
 * ocurrencias concretas no se guardan una por una: se calculan a partir de
 * `fechaInicio` y la repetición. Solo cuando una ocurrencia cambia (se
 * mueve, se cancela o el docente la inicia) se crea su documento en
 * `sesiones_clase`.
 */
export interface Clase {
  elencoId: string;
  /** Fecha de la primera ocurrencia (`YYYY-MM-DD`); fija el día de la semana. */
  fechaInicio: string;
  /** `HH:MM`, hora de Chile. */
  horaInicio: string;
  /** Lo que debe durar la clase desde que el docente la inicia. */
  duracionMinutos: number;
  repeticion: RepeticionClase;
  /** Se escribe con FieldValue.serverTimestamp(), nunca con Date del cliente. */
  fechaCreacion: Date;
}

export type EstadoSesion = "programada" | "cancelada" | "en_curso" | "realizada" | "incompleta";

/**
 * Colección raíz `sesiones_clase`: una ocurrencia concreta de una clase.
 * ID determinístico `{claseId}_{fechaProgramada}`, así cada ocurrencia tiene
 * un único documento aunque se mueva de día.
 *
 * `fecha`, `horaInicio` y `duracionMinutos` son los valores efectivos de esa
 * ocurrencia (pueden diferir de la serie si se modificó "solo esta"). Al
 * iniciarla quedan congelados: editar la serie después no cambia el historial.
 */
export interface SesionClase {
  claseId: string;
  elencoId: string;
  /** Fecha original según la serie; forma parte del ID. */
  fechaProgramada: string;
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
  estado: EstadoSesion;
  /** Docente que la inició. */
  profesorId?: string;
  /** Hora del servidor al iniciar y al finalizar. */
  inicioReal?: Date;
  finReal?: Date;
  /** Qué se hizo en la clase. */
  resumen?: string;
  /** Obligatorio si se finalizó antes de cumplir la duración. */
  motivoIncompleta?: string;
  /** Se escribe con FieldValue.serverTimestamp(), nunca con Date del cliente. */
  fechaActualizacion: Date;
}
