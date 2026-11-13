"use server";

import { FieldValue, type Timestamp, type WithFieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase/admin";
import { esProfesorDelElenco, verificarUsuario } from "@/lib/auth/verificar-usuario";
import { fechasProgramadas, hoyEnChile, idSesion } from "@/lib/clases/calendario";
import { limitesDeGrupo } from "@/lib/elencos";
import type {
  Asistencia,
  Clase,
  Elenco,
  ObservacionAsistencia,
  Semestre,
  SesionClase,
} from "@/types";

const LONGITUD_MAXIMA_RESUMEN = 2000;
const LONGITUD_MAXIMA_OBSERVACION = 500;
const LONGITUD_MAXIMA_MOTIVO = 500;

const coleccionSesiones = () => dbAdmin.collection("sesiones_clase");

async function verificarProfesor(idToken: string) {
  const verificacion = await verificarUsuario(idToken);
  if (!verificacion.ok) return verificacion;
  if (verificacion.rol !== "profesor") return { ok: false as const, error: "No autorizado." };
  return verificacion;
}

/* ------------------------------------------------------------------ */
/* Iniciar                                                              */
/* ------------------------------------------------------------------ */

export type IniciarClaseResultado = { ok: true; sesionId: string } | { ok: false; error: string };

/**
 * Inicia una ocurrencia del día. La hora de inicio la pone el servidor: desde
 * ese momento corre la duración completa de la clase, aunque haya empezado
 * tarde. Si ya estaba en curso (otro docente del elenco la inició, o se
 * recargó la página), simplemente devuelve la misma sesión.
 */
export async function iniciarClaseAction(input: {
  idToken: string;
  claseId: string;
  fechaProgramada: string;
}): Promise<IniciarClaseResultado> {
  const verificacion = await verificarProfesor(input.idToken);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  const sesionId = idSesion(input.claseId, input.fechaProgramada);
  const referencia = coleccionSesiones().doc(sesionId);

  try {
    const claseSnap = await dbAdmin.collection("clases").doc(input.claseId).get();
    const clase = claseSnap.exists ? (claseSnap.data() as Clase) : null;

    return await dbAdmin.runTransaction(async (transaccion) => {
      const sesionSnap = await transaccion.get(referencia);
      const existente = sesionSnap.exists ? (sesionSnap.data() as SesionClase) : null;

      const elencoId = existente?.elencoId ?? clase?.elencoId;
      if (!elencoId) return { ok: false as const, error: "La clase ya no existe." };
      if (!(await esProfesorDelElenco(verificacion.uid, elencoId))) {
        return { ok: false as const, error: "No eres docente de este elenco." };
      }

      if (existente?.estado === "en_curso") return { ok: true as const, sesionId };
      if (existente?.estado === "realizada" || existente?.estado === "incompleta") {
        return { ok: false as const, error: "Esta clase ya se finalizó." };
      }
      if (existente?.estado === "cancelada") {
        return { ok: false as const, error: "Esta clase fue cancelada por la administración." };
      }

      // Un grupo archivado no admite clases nuevas.
      const grupoSnap = await transaccion.get(dbAdmin.collection("elencos").doc(elencoId));
      const grupo = grupoSnap.data() as Partial<Elenco> | undefined;
      if (!grupo || grupo.activo === false) {
        return { ok: false as const, error: "El grupo está archivado: no se pueden iniciar clases." };
      }

      // Sin documento previo, la fecha tiene que ser una ocurrencia real de la serie.
      if (!existente) {
        if (!clase) return { ok: false as const, error: "La clase ya no existe." };
        const semestresSnap = await transaccion.get(dbAdmin.collection("semestres"));
        const semestres: Record<string, Semestre> = {};
        semestresSnap.docs.forEach((d) => (semestres[d.id] = d.data() as Semestre));
        const limites = limitesDeGrupo({
          activo: true,
          tipoGrupo: grupo.tipoGrupo === "itinerancia" ? "itinerancia" : "escuela",
          fechaInicio: grupo.fechaInicio,
          fechaTermino: grupo.fechaTermino,
        });
        const fechas = fechasProgramadas(
          clase,
          semestres,
          input.fechaProgramada,
          input.fechaProgramada,
          limites
        );
        if (fechas.length === 0) {
          return { ok: false as const, error: "Esa fecha no corresponde a la clase." };
        }
      }

      const fecha = existente?.fecha ?? input.fechaProgramada;
      if (fecha !== hoyEnChile()) {
        return { ok: false as const, error: "Solo puedes iniciar las clases del día de hoy." };
      }

      const sesion: WithFieldValue<SesionClase> = {
        claseId: input.claseId,
        elencoId,
        fechaProgramada: input.fechaProgramada,
        fecha,
        horaInicio: existente?.horaInicio ?? clase!.horaInicio,
        duracionMinutos: existente?.duracionMinutos ?? clase!.duracionMinutos,
        estado: "en_curso",
        profesorId: verificacion.uid,
        inicioReal: FieldValue.serverTimestamp(),
        fechaActualizacion: FieldValue.serverTimestamp(),
      };
      transaccion.set(referencia, sesion);
      return { ok: true as const, sesionId };
    });
  } catch {
    return { ok: false, error: "No se pudo iniciar la clase. Intenta de nuevo." };
  }
}

/* ------------------------------------------------------------------ */
/* Guardar asistencia / finalizar                                       */
/* ------------------------------------------------------------------ */

export interface RegistroAsistenciaInput {
  alumnoId: string;
  estado: "presente" | "ausente" | null;
  observaciones: string;
}

export interface GuardarClaseInput {
  idToken: string;
  sesionId: string;
  registros: RegistroAsistenciaInput[];
  resumen: string;
  /** false: guardar avance. true: finalizar la clase. */
  finalizar: boolean;
  /** Obligatorio si se finaliza antes de cumplir la duración. */
  motivo?: string;
}

export type GuardarClaseResultado =
  | { ok: true; estado: SesionClase["estado"] }
  | { ok: false; error: string; requiereMotivo?: boolean };

export async function guardarClaseAction(input: GuardarClaseInput): Promise<GuardarClaseResultado> {
  const verificacion = await verificarProfesor(input.idToken);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  const resumen = input.resumen.trim();
  const motivo = input.motivo?.trim() ?? "";

  if (resumen.length > LONGITUD_MAXIMA_RESUMEN) {
    return { ok: false, error: `El resumen no puede superar ${LONGITUD_MAXIMA_RESUMEN} caracteres.` };
  }
  if (motivo.length > LONGITUD_MAXIMA_MOTIVO) {
    return { ok: false, error: `El motivo no puede superar ${LONGITUD_MAXIMA_MOTIVO} caracteres.` };
  }

  try {
    const referenciaSesion = coleccionSesiones().doc(input.sesionId);
    const sesionSnap = await referenciaSesion.get();
    if (!sesionSnap.exists) return { ok: false, error: "La clase no existe." };
    const sesion = sesionSnap.data() as Omit<SesionClase, "inicioReal"> & { inicioReal?: Timestamp };

    if (!(await esProfesorDelElenco(verificacion.uid, sesion.elencoId))) {
      return { ok: false, error: "No eres docente de este elenco." };
    }
    if (sesion.estado !== "en_curso" || !sesion.inicioReal) {
      return { ok: false, error: "La clase no está en curso." };
    }

    // Solo se aceptan alumnos que de verdad pertenecen al elenco.
    const alumnosSnap = await dbAdmin
      .collection("miembros_elenco")
      .where("elencoId", "==", sesion.elencoId)
      .where("activo", "==", true)
      .where("rolEnElenco", "==", "alumno")
      .get();
    const alumnosDelElenco = new Set(alumnosSnap.docs.map((d) => d.data().usuarioId as string));

    for (const registro of input.registros) {
      if (!alumnosDelElenco.has(registro.alumnoId)) {
        return { ok: false, error: "La lista incluye a alguien que no es alumno del elenco." };
      }
      if (registro.estado !== null && !["presente", "ausente"].includes(registro.estado)) {
        return { ok: false, error: "Estado de asistencia inválido." };
      }
      if (registro.observaciones.trim().length > LONGITUD_MAXIMA_OBSERVACION) {
        return {
          ok: false,
          error: `Cada observación puede tener hasta ${LONGITUD_MAXIMA_OBSERVACION} caracteres.`,
        };
      }
    }

    let estadoFinal: SesionClase["estado"] = "en_curso";

    if (input.finalizar) {
      const marcados = new Set(
        input.registros.filter((r) => r.estado !== null).map((r) => r.alumnoId)
      );
      if ([...alumnosDelElenco].some((alumnoId) => !marcados.has(alumnoId))) {
        return { ok: false, error: "Marca presente o ausente a todos los alumnos antes de finalizar." };
      }
      if (!resumen) {
        return { ok: false, error: "Escribe qué se hizo en la clase antes de finalizar." };
      }

      const terminoMinimo =
        sesion.inicioReal.toMillis() + sesion.duracionMinutos * 60_000;
      const cumplioDuracion = Date.now() >= terminoMinimo;
      if (!cumplioDuracion && !motivo) {
        return {
          ok: false,
          requiereMotivo: true,
          error: "La clase aún no cumple su duración. Indica el motivo para finalizarla antes.",
        };
      }
      estadoFinal = cumplioDuracion ? "realizada" : "incompleta";
    }

    const batch = dbAdmin.batch();

    for (const registro of input.registros) {
      if (registro.estado === null) continue;
      const idAsistencia = `${input.sesionId}_${registro.alumnoId}`;
      const asistencia: WithFieldValue<Asistencia> = {
        elencoId: sesion.elencoId,
        alumnoId: registro.alumnoId,
        profesorId: verificacion.uid,
        fechaSesion: sesion.fecha,
        estado: registro.estado,
        sesionId: input.sesionId,
        fechaRegistro: FieldValue.serverTimestamp(),
      };
      batch.set(dbAdmin.collection("asistencias").doc(idAsistencia), asistencia);

      // La observación va aparte: el alumno puede leer su asistencia, pero no esto.
      const referenciaObservacion = dbAdmin.collection("observaciones_asistencia").doc(idAsistencia);
      const texto = registro.observaciones.trim();
      if (texto) {
        const observacion: WithFieldValue<ObservacionAsistencia> = {
          elencoId: sesion.elencoId,
          sesionId: input.sesionId,
          alumnoId: registro.alumnoId,
          profesorId: verificacion.uid,
          texto,
          fechaRegistro: FieldValue.serverTimestamp(),
        };
        batch.set(referenciaObservacion, observacion);
      } else {
        batch.delete(referenciaObservacion);
      }
    }

    batch.update(referenciaSesion, {
      resumen,
      estado: estadoFinal,
      fechaActualizacion: FieldValue.serverTimestamp(),
      ...(input.finalizar ? { finReal: FieldValue.serverTimestamp() } : {}),
      ...(estadoFinal === "incompleta" ? { motivoIncompleta: motivo } : {}),
    });

    await batch.commit();
    return { ok: true, estado: estadoFinal };
  } catch {
    return { ok: false, error: "No se pudo guardar. Revisa tu conexión e intenta de nuevo." };
  }
}
