/**
 * Utilidades de calendario para las clases. Funciones puras, sin Firebase:
 * las usan tanto el navegador (calendario, listados) como los Server Actions.
 *
 * Las fechas son strings `YYYY-MM-DD` y las horas `HH:MM`. La aritmética de
 * días se hace en UTC a propósito: así un cambio de horario de verano nunca
 * corre una fecha un día.
 */
import type { LimitesGrupo } from "@/lib/elencos";
import type { Clase, ConId, Semestre, SesionClase } from "@/types";

const ZONA_HORARIA = "America/Santiago";

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function esFechaValida(fecha: string): boolean {
  if (!FORMATO_FECHA.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const comoFecha = new Date(Date.UTC(anio, mes - 1, dia));
  return comoFecha.getUTCMonth() === mes - 1 && comoFecha.getUTCDate() === dia;
}

export function esHoraValida(hora: string): boolean {
  return FORMATO_HORA.test(hora);
}

function aUtc(fecha: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function desdeUtc(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number): string {
  const resultado = aUtc(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return desdeUtc(resultado);
}

/** 0 = lunes … 6 = domingo. */
export function diaSemana(fecha: string): number {
  return (aUtc(fecha).getUTCDay() + 6) % 7;
}

/** Fecha de hoy en Chile, sin importar la zona horaria del servidor que ejecute el código. */
export function hoyEnChile(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(ahora);
}

/** "15:30" + 90 → "17:00". */
export function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = (((h * 60 + m + minutos) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** 90 → "1 h 30 min". */
export function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

export function idSesion(claseId: string, fechaProgramada: string): string {
  return `${claseId}_${fechaProgramada}`;
}

export function idSemestre(anio: number, numero: 1 | 2): string {
  return `${anio}-${numero}`;
}

/** Última fecha en que puede ocurrir la clase, o null si su semestre ya no existe. */
function fechaFinClase(clase: Clase, semestres: Record<string, Semestre>): string | null {
  if (clase.repeticion.tipo === "unica") return clase.fechaInicio;
  return semestres[clase.repeticion.semestreId]?.fechaFin ?? null;
}

/**
 * Fechas programadas de una clase dentro de [desde, hasta], ambos inclusive.
 * `limites` es el período en que el grupo admite clases: ninguna si está
 * archivado, y solo entre sus fechas si es una itinerancia que las tiene.
 */
export function fechasProgramadas(
  clase: Clase,
  semestres: Record<string, Semestre>,
  desde: string,
  hasta: string,
  limites?: LimitesGrupo
): string[] {
  if (limites?.archivado) return [];
  const fin = fechaFinClase(clase, semestres);
  if (!fin) return [];

  if (limites?.desde && limites.desde > desde) desde = limites.desde;
  if (limites?.hasta && limites.hasta < hasta) hasta = limites.hasta;
  const limite = fin < hasta ? fin : hasta;
  const fechas: string[] = [];

  if (clase.repeticion.tipo === "unica") {
    if (clase.fechaInicio >= desde && clase.fechaInicio <= limite) fechas.push(clase.fechaInicio);
    return fechas;
  }

  // Primera ocurrencia >= desde, avanzando de a semanas desde fechaInicio.
  let fecha = clase.fechaInicio;
  if (fecha < desde) {
    const dias = Math.round((aUtc(desde).getTime() - aUtc(fecha).getTime()) / 86_400_000);
    fecha = sumarDias(fecha, Math.ceil(dias / 7) * 7);
  }
  while (fecha <= limite) {
    fechas.push(fecha);
    fecha = sumarDias(fecha, 7);
  }
  return fechas;
}

/** Una ocurrencia lista para mostrar: la serie más lo que haya cambiado en su sesión. */
export interface Ocurrencia {
  sesionId: string;
  claseId: string;
  elencoId: string;
  fechaProgramada: string;
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
  estado: SesionClase["estado"];
  /** Documento de la sesión, si existe (se modificó, se canceló o ya se inició). */
  sesion?: ConId<SesionClase>;
  /** La serie, si todavía existe (una sesión realizada sobrevive a que se elimine su serie). */
  clase?: ConId<Clase>;
}

/**
 * Combina las series con los documentos de sesión para obtener las
 * ocurrencias cuya fecha efectiva cae en [desde, hasta]. Una sesión que se
 * movió de día aparece en su fecha nueva y no en la original.
 *
 * `limitesPorElenco` recorta las ocurrencias programadas de cada grupo
 * (archivado o itinerancia con fechas). Las sesiones que ya existen se
 * muestran igual: son registro de lo que pasó.
 */
export function construirOcurrencias(
  clases: ConId<Clase>[],
  sesiones: ConId<SesionClase>[],
  semestres: Record<string, Semestre>,
  desde: string,
  hasta: string,
  limitesPorElenco: Record<string, LimitesGrupo> = {}
): Ocurrencia[] {
  const sesionesPorId = new Map(sesiones.map((sesion) => [sesion.id, sesion]));
  const clasesPorId = new Map(clases.map((clase) => [clase.id, clase]));
  const resultado = new Map<string, Ocurrencia>();

  for (const clase of clases) {
    const limites = limitesPorElenco[clase.elencoId];
    for (const fechaProgramada of fechasProgramadas(clase, semestres, desde, hasta, limites)) {
      const id = idSesion(clase.id, fechaProgramada);
      if (sesionesPorId.has(id)) continue; // la sesión manda; se agrega abajo
      resultado.set(id, {
        sesionId: id,
        claseId: clase.id,
        elencoId: clase.elencoId,
        fechaProgramada,
        fecha: fechaProgramada,
        horaInicio: clase.horaInicio,
        duracionMinutos: clase.duracionMinutos,
        estado: "programada",
        clase,
      });
    }
  }

  for (const sesion of sesiones) {
    if (sesion.fecha < desde || sesion.fecha > hasta) continue;
    resultado.set(sesion.id, {
      sesionId: sesion.id,
      claseId: sesion.claseId,
      elencoId: sesion.elencoId,
      fechaProgramada: sesion.fechaProgramada,
      fecha: sesion.fecha,
      horaInicio: sesion.horaInicio,
      duracionMinutos: sesion.duracionMinutos,
      estado: sesion.estado,
      sesion,
      clase: clasesPorId.get(sesion.claseId),
    });
  }

  return Array.from(resultado.values()).sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio)
  );
}

/** Semanas (lunes a domingo) que cubren el mes, para dibujar el calendario. */
export function semanasDelMes(anio: number, mes: number): string[][] {
  const primero = desdeUtc(new Date(Date.UTC(anio, mes - 1, 1)));
  let fecha = sumarDias(primero, -diaSemana(primero));
  const semanas: string[][] = [];
  do {
    const semana: string[] = [];
    for (let i = 0; i < 7; i++) {
      semana.push(fecha);
      fecha = sumarDias(fecha, 1);
    }
    semanas.push(semana);
  } while (Number(fecha.slice(5, 7)) === mes);
  return semanas;
}

export const NOMBRES_DIA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** "2026-03-10" → "martes 10 de marzo". */
export function formatearFechaLegible(fecha: string): string {
  const [, mes, dia] = fecha.split("-").map(Number);
  return `${NOMBRES_DIA[diaSemana(fecha)].toLowerCase()} ${dia} de ${NOMBRES_MES[mes - 1].toLowerCase()}`;
}

/** "2026-03-10" → "10/03/2026", el formato que se usa en Chile. */
export function formatearFechaNumerica(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}
