import { esFechaValida } from "@/lib/clases/calendario";
import type { Elenco, Escuela, TipoEscuela } from "@/types";

/**
 * Reglas de escuelas, elencos e itinerancias compartidas por el panel del
 * Admin y los Server Actions. Funciones puras: el servidor vuelve a validar
 * todo lo que llega del navegador con estas mismas funciones.
 */

export const LARGO_MAXIMO_NOMBRE_ESCUELA = 60;
export const LARGO_MAXIMO_NIVEL = 40;
export const LARGO_MAXIMO_COMPLEMENTO = 40;
export const LARGO_MAXIMO_NOMBRE_ITINERANCIA = 100;
export const MAXIMO_NIVELES = 12;

const SEPARADOR_NOMBRE = " · ";

/** Quita espacios al inicio y al final y deja uno solo entre palabras. */
export function normalizarEspacios(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}

/**
 * Forma de comparar dos textos sin que importen mayúsculas, tildes ni
 * espacios repetidos: "Coro  Niños" y "coro ninos" son el mismo nombre.
 */
export function claveComparacion(texto: string): string {
  return normalizarEspacios(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** "Coro · Niños" o "Piano · Inicial · Martes". */
export function nombreGrupoEscuela(nombreEscuela: string, nivel: string, complemento?: string): string {
  return [nombreEscuela, nivel, complemento].filter(Boolean).join(SEPARADOR_NOMBRE);
}

/** Identifica un grupo de escuela para impedir duplicados. */
export function claveGrupoEscuela(escuelaId: string, nivel: string, complemento?: string): string {
  return [escuelaId, claveComparacion(nivel), claveComparacion(complemento ?? "")].join("|");
}

type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

const esTexto = (valor: unknown): valor is string => typeof valor === "string";

export interface DatosEscuela {
  nombre: string;
  tipo: TipoEscuela;
  niveles: string[];
}

export function validarDatosEscuela(entrada: {
  nombre: unknown;
  tipo: unknown;
  niveles: unknown;
}): Resultado<DatosEscuela> {
  const nombre = esTexto(entrada.nombre) ? normalizarEspacios(entrada.nombre) : "";
  if (!nombre) return { ok: false, error: "El nombre de la escuela es obligatorio." };
  if (nombre.length > LARGO_MAXIMO_NOMBRE_ESCUELA) {
    return {
      ok: false,
      error: `El nombre no puede superar los ${LARGO_MAXIMO_NOMBRE_ESCUELA} caracteres.`,
    };
  }
  if (entrada.tipo !== "conjunto" && entrada.tipo !== "instrumento") {
    return { ok: false, error: "Tipo de escuela inválido." };
  }
  if (!Array.isArray(entrada.niveles) || !entrada.niveles.every(esTexto)) {
    return { ok: false, error: "Los niveles no son válidos." };
  }

  const niveles = entrada.niveles.map(normalizarEspacios).filter(Boolean);
  if (niveles.length === 0) return { ok: false, error: "La escuela necesita al menos un nivel." };
  if (niveles.length > MAXIMO_NIVELES) {
    return { ok: false, error: `Una escuela puede tener hasta ${MAXIMO_NIVELES} niveles.` };
  }
  if (niveles.some((nivel) => nivel.length > LARGO_MAXIMO_NIVEL)) {
    return {
      ok: false,
      error: `Cada nivel puede tener hasta ${LARGO_MAXIMO_NIVEL} caracteres.`,
    };
  }
  if (new Set(niveles.map(claveComparacion)).size !== niveles.length) {
    return { ok: false, error: "Hay niveles repetidos." };
  }

  return { ok: true, datos: { nombre, tipo: entrada.tipo, niveles } };
}

export interface DatosGrupoEscuela {
  nivel: string;
  complemento?: string;
}

/**
 * El nivel tiene que ser uno de los de la escuela; se devuelve escrito como
 * en la escuela, aunque llegue con otras mayúsculas.
 */
export function validarDatosGrupoEscuela(
  entrada: { nivel: unknown; complemento?: unknown },
  escuela: Pick<Escuela, "niveles">
): Resultado<DatosGrupoEscuela> {
  const pedido = esTexto(entrada.nivel) ? claveComparacion(entrada.nivel) : "";
  const nivel = escuela.niveles.find((opcion) => claveComparacion(opcion) === pedido);
  if (!nivel) return { ok: false, error: "Ese nivel no pertenece a la escuela." };

  if (entrada.complemento !== undefined && !esTexto(entrada.complemento)) {
    return { ok: false, error: "El complemento no es válido." };
  }
  const complemento = esTexto(entrada.complemento) ? normalizarEspacios(entrada.complemento) : "";
  if (complemento.length > LARGO_MAXIMO_COMPLEMENTO) {
    return {
      ok: false,
      error: `El complemento puede tener hasta ${LARGO_MAXIMO_COMPLEMENTO} caracteres.`,
    };
  }

  return { ok: true, datos: complemento ? { nivel, complemento } : { nivel } };
}

export interface DatosItinerancia {
  nombre: string;
  fechaInicio?: string;
  fechaTermino?: string;
}

/** Nombre libre; las dos fechas son opcionales, pero si van las dos, en orden. */
export function validarDatosItinerancia(entrada: {
  nombre: unknown;
  fechaInicio?: unknown;
  fechaTermino?: unknown;
}): Resultado<DatosItinerancia> {
  const nombre = esTexto(entrada.nombre) ? normalizarEspacios(entrada.nombre) : "";
  if (!nombre) return { ok: false, error: "El nombre de la itinerancia es obligatorio." };
  if (nombre.length > LARGO_MAXIMO_NOMBRE_ITINERANCIA) {
    return {
      ok: false,
      error: `El nombre no puede superar los ${LARGO_MAXIMO_NOMBRE_ITINERANCIA} caracteres.`,
    };
  }

  const fechas: { fechaInicio?: string; fechaTermino?: string } = {};
  for (const campo of ["fechaInicio", "fechaTermino"] as const) {
    const valor = entrada[campo];
    if (valor === undefined || valor === null || valor === "") continue;
    if (!esTexto(valor) || !esFechaValida(valor)) {
      return { ok: false, error: "Alguna de las fechas no es válida." };
    }
    fechas[campo] = valor;
  }
  if (fechas.fechaInicio && fechas.fechaTermino && fechas.fechaTermino < fechas.fechaInicio) {
    return { ok: false, error: "La fecha de término no puede ser anterior a la de inicio." };
  }

  return { ok: true, datos: { nombre, ...fechas } };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "12 mar 2026", a partir de `YYYY-MM-DD`, sin depender de la zona horaria. */
function fechaBreve(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

/**
 * Período de una itinerancia para mostrarlo: "12 mar 2026 – 30 abr 2026",
 * "Desde 12 mar 2026" o "Hasta 30 abr 2026". `null` si no es itinerancia o
 * no tiene fechas.
 */
export function textoPeriodoItinerancia(
  grupo: Pick<Elenco, "tipoGrupo" | "fechaInicio" | "fechaTermino">
): string | null {
  if (grupo.tipoGrupo !== "itinerancia") return null;
  const { fechaInicio, fechaTermino } = grupo;
  if (fechaInicio && fechaTermino) return `${fechaBreve(fechaInicio)} – ${fechaBreve(fechaTermino)}`;
  if (fechaInicio) return `Desde ${fechaBreve(fechaInicio)}`;
  if (fechaTermino) return `Hasta ${fechaBreve(fechaTermino)}`;
  return null;
}

/** Texto de la etiqueta de las tarjetas. */
export function etiquetaTipoGrupo(grupo: Pick<Elenco, "tipoGrupo" | "tipoEscuela">): string {
  if (grupo.tipoGrupo === "itinerancia") return "Itinerancia";
  return grupo.tipoEscuela === "instrumento" ? "Clase de instrumento" : "Elenco";
}

/**
 * Hasta dónde puede haber clases programadas de un grupo: ninguna si está
 * archivado, y dentro de sus fechas si es una itinerancia que las tiene.
 */
export interface LimitesGrupo {
  archivado: boolean;
  desde?: string;
  hasta?: string;
}

export function limitesDeGrupo(
  grupo: Pick<Elenco, "activo" | "tipoGrupo" | "fechaInicio" | "fechaTermino">
): LimitesGrupo {
  if (grupo.tipoGrupo !== "itinerancia") return { archivado: !grupo.activo };
  return { archivado: !grupo.activo, desde: grupo.fechaInicio, hasta: grupo.fechaTermino };
}

/** ¿La fecha cae dentro de los límites? Un grupo archivado no admite ninguna. */
export function fechaDentroDeLimites(fecha: string, limites: LimitesGrupo): boolean {
  if (limites.archivado) return false;
  if (limites.desde && fecha < limites.desde) return false;
  if (limites.hasta && fecha > limites.hasta) return false;
  return true;
}
