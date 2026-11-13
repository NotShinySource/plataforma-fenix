/**
 * Todo el alcance real de la institución hoy es música — Danza y Teatro
 * quedaban contemplados como enum genérico en el diagrama de clases original,
 * pero nunca se activaron como rol/producto real.
 * `disciplina` queda fija en "musica", ya no es un campo elegible en el
 * formulario de creación.
 */
export const DISCIPLINA_ELENCO = "musica" as const;

/** Niveles que se proponen al crear una escuela; se pueden quitar o reemplazar. */
export const NIVELES_PREDETERMINADOS = ["Inicial", "Intermedio", "Avanzado"] as const;

/**
 * "conjunto": coro, banda, orquesta... "instrumento": clases de un solo
 * instrumento (piano, guitarra...), que no pertenecen a un conjunto.
 */
export type TipoEscuela = "conjunto" | "instrumento";

/**
 * Colección raíz `escuelas`: las escuelas de la institución y sus niveles.
 * Los niveles se definen al crearla y después no cambian, para que los
 * nombres de sus elencos sigan siendo válidos. El nombre sí se puede
 * corregir: el servidor actualiza el nombre de todos sus elencos.
 */
export interface Escuela {
  nombre: string;
  tipo: TipoEscuela;
  niveles: string[];
  /** `false` = archivada: no se pueden crear elencos nuevos en ella. */
  activo: boolean;
  /** Se escribe con FieldValue.serverTimestamp(), nunca con Date del cliente. */
  fechaCreacion: Date;
}

/**
 * "escuela": grupo estable de una escuela y un nivel (su nombre se arma con
 * ellos). "itinerancia": grupo temporal con nombre libre (por ejemplo, el
 * elenco de un musical), cuyos miembros pueden venir de varios elencos.
 */
export type TipoGrupo = "escuela" | "itinerancia";

/**
 * Colección raíz `elencos`: todo grupo con miembros, material, asistencia,
 * horario, tareas y avisos (aulas_virtuales queda fusionada aquí: era 1:1
 * sin identidad propia y separarla solo agregaba una lectura).
 *
 * `nombre` se guarda aunque en un grupo de escuela se arme solo, porque lo
 * muestran muchas pantallas (horario, tareas, avisos, informe) sin tener que
 * leer la escuela.
 */
export interface Elenco {
  nombre: string;
  disciplina: typeof DISCIPLINA_ELENCO;
  tipoGrupo: TipoGrupo;
  /** Solo en grupos de escuela. */
  escuelaId?: string;
  nivel?: string;
  /** Distingue dos grupos de la misma escuela y nivel (por ejemplo, "Grupo A"). */
  complemento?: string;
  /** Copia del tipo de la escuela, para la etiqueta de las tarjetas. */
  tipoEscuela?: TipoEscuela;
  /** Solo en itinerancias, ambas opcionales (`YYYY-MM-DD`). */
  fechaInicio?: string;
  fechaTermino?: string;
  descripcion: string;
  docenteResponsableId: string;
  /**
   * `false` = archivado: deja de aparecer en los paneles y no admite clases,
   * material, avisos ni tareas nuevos, pero conserva todo su historial.
   */
  activo: boolean;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp(), nunca con Date del cliente: la fecha la fija el servidor. */
  fechaCreacion: Date;
}

export type RolEnElenco = "alumno" | "profesor";

/**
 * Cargo del profesor dentro de ESE elenco específico (un mismo profesor puede
 * ser titular en un elenco y asistente en otro). Campo nuevo y separado de
 * `rolEnElenco` a propósito: `rolEnElenco` ya tiene un significado cerrado
 * (tipo de membresía alumno/profesor) del que dependen `storage.rules`
 * (`esProfesorDelElenco`) y el filtro de `listarMiembrosDeElenco` para tomar
 * asistencia — sobrecargarlo con titular/asistente los habría roto.
 */
export type CargoDocente = "titular" | "asistente";

/**
 * Colección raíz `miembros_elenco`, ID determinístico `{elencoId}_{usuarioId}`
 * para garantizar unicidad sin transacciones. elencoId y usuarioId se repiten como campos para permitir
 * queries de un solo campo en ambas direcciones sin índices compuestos.
 */
export interface MiembroElenco {
  elencoId: string;
  usuarioId: string;
  rolEnElenco: RolEnElenco;
  /** Solo aplica cuando rolEnElenco === "profesor". */
  cargoDocente?: CargoDocente;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp(), nunca con Date del cliente: la fecha la fija el servidor. */
  fechaIngreso: Date;
  activo: boolean;
  /**
   * true si la membresía se desactivó porque el usuario egresó: al
   * reactivar la cuenta, vuelve a su elenco automáticamente.
   */
  bajaPorEgreso?: boolean;
}
