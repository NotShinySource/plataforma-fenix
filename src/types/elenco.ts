/**
 * Todo el alcance real de la institución hoy es música — Danza y Teatro
 * quedaban contemplados como enum genérico en el diagrama de clases original,
 * pero nunca se activaron como rol/producto real.
 * `disciplina` queda fija en "musica", ya no es un campo elegible en el
 * formulario de creación.
 */
export const DISCIPLINA_ELENCO = "musica" as const;

export const TIPOS_ELENCO = [
  "Folklore",
  "Banda",
  "Orquesta de Cuerdas",
  "Coro Adultos",
  "Coro Juvenil",
  "Coro de Niños",
] as const;

export type TipoElenco = (typeof TIPOS_ELENCO)[number];

/** aulas_virtuales queda fusionada aquí: era 1:1 sin identidad propia (decisión 4.2.1). */
export interface Elenco {
  nombre: string;
  disciplina: typeof DISCIPLINA_ELENCO;
  tipoElenco: TipoElenco;
  descripcion: string;
  docenteResponsableId: string;
  activo: boolean;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp() (decisión 4.2.9), nunca con Date del cliente. */
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
 * (decisión 4.2.2). elencoId y usuarioId se repiten como campos para permitir
 * queries de un solo campo en ambas direcciones sin índices compuestos.
 */
export interface MiembroElenco {
  elencoId: string;
  usuarioId: string;
  rolEnElenco: RolEnElenco;
  /** Solo aplica cuando rolEnElenco === "profesor". */
  cargoDocente?: CargoDocente;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp() (decisión 4.2.9), nunca con Date del cliente. */
  fechaIngreso: Date;
  activo: boolean;
}
