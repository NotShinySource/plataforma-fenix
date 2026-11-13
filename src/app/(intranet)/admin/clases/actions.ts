"use server";

import { FieldValue, type WithFieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase/admin";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import {
  esFechaValida,
  esHoraValida,
  fechasProgramadas,
  idSemestre,
  idSesion,
} from "@/lib/clases/calendario";
import { fechaDentroDeLimites, limitesDeGrupo, type LimitesGrupo } from "@/lib/elencos";
import type { Clase, Elenco, Semestre, SesionClase } from "@/types";

const DURACION_MINIMA = 15;
const DURACION_MAXIMA = 8 * 60;

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

const coleccionSemestres = () => dbAdmin.collection("semestres");
const coleccionClases = () => dbAdmin.collection("clases");
const coleccionSesiones = () => dbAdmin.collection("sesiones_clase");

async function cargarSemestres(): Promise<Record<string, Semestre>> {
  const snap = await coleccionSemestres().get();
  const semestres: Record<string, Semestre> = {};
  snap.docs.forEach((d) => {
    semestres[d.id] = d.data() as Semestre;
  });
  return semestres;
}

async function cargarClase(claseId: string): Promise<Clase | null> {
  const snap = await coleccionClases().doc(claseId).get();
  return snap.exists ? (snap.data() as Clase) : null;
}

/**
 * Período en que el grupo admite clases (ninguno si está archivado), o null
 * si el grupo ya no existe.
 */
async function cargarLimitesGrupo(elencoId: string): Promise<LimitesGrupo | null> {
  const snap = await dbAdmin.collection("elencos").doc(elencoId).get();
  if (!snap.exists) return null;
  const datos = snap.data() as Partial<Elenco>;
  return limitesDeGrupo({
    activo: datos.activo !== false,
    tipoGrupo: datos.tipoGrupo === "itinerancia" ? "itinerancia" : "escuela",
    fechaInicio: datos.fechaInicio,
    fechaTermino: datos.fechaTermino,
  });
}

/** Mensaje si la fecha no cabe en el período del grupo; null si cabe. */
function problemaConLimites(fecha: string, limites: LimitesGrupo): string | null {
  if (limites.archivado) return "El grupo está archivado: no admite clases nuevas.";
  if (!fechaDentroDeLimites(fecha, limites)) {
    return "La fecha está fuera del período de la itinerancia.";
  }
  return null;
}

function validarHorario(horaInicio: string, duracionMinutos: number): string | null {
  if (!esHoraValida(horaInicio)) return "La hora de inicio no es válida.";
  if (
    !Number.isInteger(duracionMinutos) ||
    duracionMinutos < DURACION_MINIMA ||
    duracionMinutos > DURACION_MAXIMA
  ) {
    return `La duración debe estar entre ${DURACION_MINIMA} minutos y ${DURACION_MAXIMA / 60} horas.`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Semestres                                                            */
/* ------------------------------------------------------------------ */

export interface GuardarSemestresInput {
  idTokenAdmin: string;
  anio: number;
  primero: { fechaInicio: string; fechaFin: string };
  segundo: { fechaInicio: string; fechaFin: string };
}

export async function guardarSemestresAction(
  input: GuardarSemestresInput
): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  const { anio, primero, segundo } = input;
  if (!Number.isInteger(anio) || anio < 2020 || anio > 2100) {
    return { ok: false, error: "Año inválido." };
  }

  const fechas = [primero.fechaInicio, primero.fechaFin, segundo.fechaInicio, segundo.fechaFin];
  if (!fechas.every(esFechaValida)) {
    return { ok: false, error: "Completa las cuatro fechas con un formato válido." };
  }
  if (!fechas.every((fecha) => fecha.startsWith(`${anio}-`))) {
    return { ok: false, error: `Todas las fechas deben ser del año ${anio}.` };
  }
  if (primero.fechaInicio > primero.fechaFin || segundo.fechaInicio > segundo.fechaFin) {
    return { ok: false, error: "En cada semestre, el inicio debe ser anterior al término." };
  }
  if (primero.fechaFin >= segundo.fechaInicio) {
    return { ok: false, error: "El segundo semestre debe comenzar después del fin del primero." };
  }

  try {
    const batch = dbAdmin.batch();
    const semestres: Semestre[] = [
      { anio, numero: 1, ...primero },
      { anio, numero: 2, ...segundo },
    ];
    semestres.forEach((semestre) =>
      batch.set(coleccionSemestres().doc(idSemestre(anio, semestre.numero)), semestre)
    );
    await batch.commit();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudieron guardar los semestres. Intenta de nuevo." };
  }
}

/* ------------------------------------------------------------------ */
/* Series (clases)                                                      */
/* ------------------------------------------------------------------ */

export type RepetirClase = "no" | "semestre1" | "semestre2";

export interface CrearClaseInput {
  idTokenAdmin: string;
  elencoId: string;
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
  repetir: RepetirClase;
}

export async function crearClaseAction(input: CrearClaseInput): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  if (!esFechaValida(input.fecha)) return { ok: false, error: "La fecha no es válida." };
  const problemaHorario = validarHorario(input.horaInicio, input.duracionMinutos);
  if (problemaHorario) return { ok: false, error: problemaHorario };
  if (!["no", "semestre1", "semestre2"].includes(input.repetir)) {
    return { ok: false, error: "Opción de repetición inválida." };
  }

  try {
    const limites = await cargarLimitesGrupo(String(input.elencoId));
    if (!limites) return { ok: false, error: "El elenco no existe." };
    const problemaFecha = problemaConLimites(input.fecha, limites);
    if (problemaFecha) return { ok: false, error: problemaFecha };

    let repeticion: Clase["repeticion"] = { tipo: "unica" };

    if (input.repetir !== "no") {
      const numero = input.repetir === "semestre1" ? 1 : 2;
      const semestreId = idSemestre(Number(input.fecha.slice(0, 4)), numero);
      const semestre = await coleccionSemestres().doc(semestreId).get();
      if (!semestre.exists) {
        return {
          ok: false,
          error: `Primero configura las fechas del ${numero}° semestre ${input.fecha.slice(0, 4)}.`,
        };
      }
      const { fechaInicio, fechaFin } = semestre.data() as Semestre;
      if (input.fecha < fechaInicio || input.fecha > fechaFin) {
        return {
          ok: false,
          error: `La fecha elegida está fuera del ${numero}° semestre (${fechaInicio} a ${fechaFin}).`,
        };
      }
      repeticion = { tipo: "semanal", semestreId };
    }

    const clase: WithFieldValue<Clase> = {
      elencoId: input.elencoId,
      fechaInicio: input.fecha,
      horaInicio: input.horaInicio,
      duracionMinutos: input.duracionMinutos,
      repeticion,
      fechaCreacion: FieldValue.serverTimestamp(),
    };
    await coleccionClases().add(clase);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo crear la clase. Intenta de nuevo." };
  }
}

export interface EditarSerieInput {
  idTokenAdmin: string;
  claseId: string;
  horaInicio: string;
  duracionMinutos: number;
}

/**
 * Cambia hora y duración de toda la serie. Las ocurrencias ya iniciadas o
 * dictadas conservan sus valores (quedaron congelados en su sesión), y las
 * que se modificaron "solo esta" también.
 */
export async function editarSerieAction(input: EditarSerieInput): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  const problemaHorario = validarHorario(input.horaInicio, input.duracionMinutos);
  if (problemaHorario) return { ok: false, error: problemaHorario };

  try {
    const referencia = coleccionClases().doc(input.claseId);
    if (!(await referencia.get()).exists) return { ok: false, error: "La clase ya no existe." };
    await referencia.update({
      horaInicio: input.horaInicio,
      duracionMinutos: input.duracionMinutos,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo modificar la serie. Intenta de nuevo." };
  }
}

/**
 * Elimina la serie y sus ocurrencias pendientes. Las clases ya dictadas (y
 * una en curso) se conservan: son el registro que va en el informe.
 */
export async function eliminarSerieAction(input: {
  idTokenAdmin: string;
  claseId: string;
}): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  try {
    const sesiones = await coleccionSesiones().where("claseId", "==", input.claseId).get();
    const batch = dbAdmin.batch();
    sesiones.docs
      .filter((d) => ["programada", "cancelada"].includes(d.data().estado))
      .forEach((d) => batch.delete(d.ref));
    batch.delete(coleccionClases().doc(input.claseId));
    await batch.commit();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la serie. Intenta de nuevo." };
  }
}

/* ------------------------------------------------------------------ */
/* Una sola ocurrencia                                                  */
/* ------------------------------------------------------------------ */

interface OcurrenciaInput {
  idTokenAdmin: string;
  claseId: string;
  fechaProgramada: string;
}

/**
 * Comprueba que la fecha sea realmente una ocurrencia de la serie y que no
 * se haya iniciado todavía. Devuelve la clase para tomar sus valores.
 */
async function validarOcurrenciaEditable(
  claseId: string,
  fechaProgramada: string
): Promise<{ ok: true; clase: Clase } | { ok: false; error: string }> {
  const clase = await cargarClase(claseId);
  if (!clase) return { ok: false, error: "La clase ya no existe." };

  const [semestres, limites] = await Promise.all([
    cargarSemestres(),
    cargarLimitesGrupo(clase.elencoId),
  ]);
  if (!limites) return { ok: false, error: "El grupo de esta clase ya no existe." };
  if (limites.archivado) return { ok: false, error: "El grupo está archivado: su horario no se modifica." };
  const esOcurrencia = fechasProgramadas(
    clase,
    semestres,
    fechaProgramada,
    fechaProgramada,
    limites
  ).length;
  if (!esOcurrencia) return { ok: false, error: "Esa fecha no corresponde a la clase." };

  const sesion = await coleccionSesiones().doc(idSesion(claseId, fechaProgramada)).get();
  const estado = sesion.data()?.estado;
  if (sesion.exists && !["programada", "cancelada"].includes(estado)) {
    return { ok: false, error: "La clase ya se inició o se dictó; no se puede modificar." };
  }
  return { ok: true, clase };
}

export interface EditarOcurrenciaInput extends OcurrenciaInput {
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
}

/** Mueve o ajusta solo esta ocurrencia. También sirve para restaurar una cancelada. */
export async function editarOcurrenciaAction(
  input: EditarOcurrenciaInput
): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  if (!esFechaValida(input.fecha)) return { ok: false, error: "La fecha no es válida." };
  const problemaHorario = validarHorario(input.horaInicio, input.duracionMinutos);
  if (problemaHorario) return { ok: false, error: problemaHorario };

  try {
    const validacion = await validarOcurrenciaEditable(input.claseId, input.fechaProgramada);
    if (!validacion.ok) return validacion;

    // Mover una clase de una itinerancia no puede sacarla de su período.
    const limites = await cargarLimitesGrupo(validacion.clase.elencoId);
    const problemaFecha = limites ? problemaConLimites(input.fecha, limites) : null;
    if (problemaFecha) return { ok: false, error: problemaFecha };

    const sesion: WithFieldValue<SesionClase> = {
      claseId: input.claseId,
      elencoId: validacion.clase.elencoId,
      fechaProgramada: input.fechaProgramada,
      fecha: input.fecha,
      horaInicio: input.horaInicio,
      duracionMinutos: input.duracionMinutos,
      estado: "programada",
      fechaActualizacion: FieldValue.serverTimestamp(),
    };
    await coleccionSesiones().doc(idSesion(input.claseId, input.fechaProgramada)).set(sesion);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo modificar la clase. Intenta de nuevo." };
  }
}

/** Cancela solo esta ocurrencia (el resto de la serie sigue igual). */
export async function cancelarOcurrenciaAction(input: OcurrenciaInput): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  try {
    const validacion = await validarOcurrenciaEditable(input.claseId, input.fechaProgramada);
    if (!validacion.ok) return validacion;

    const referencia = coleccionSesiones().doc(idSesion(input.claseId, input.fechaProgramada));
    const existente = await referencia.get();

    if (existente.exists) {
      await referencia.update({
        estado: "cancelada",
        fechaActualizacion: FieldValue.serverTimestamp(),
      });
    } else {
      const sesion: WithFieldValue<SesionClase> = {
        claseId: input.claseId,
        elencoId: validacion.clase.elencoId,
        fechaProgramada: input.fechaProgramada,
        fecha: input.fechaProgramada,
        horaInicio: validacion.clase.horaInicio,
        duracionMinutos: validacion.clase.duracionMinutos,
        estado: "cancelada",
        fechaActualizacion: FieldValue.serverTimestamp(),
      };
      await referencia.set(sesion);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo cancelar la clase. Intenta de nuevo." };
  }
}
