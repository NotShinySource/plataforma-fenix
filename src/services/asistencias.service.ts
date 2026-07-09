import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type WithFieldValue,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { Asistencia, ConId, EstadoAsistencia } from "@/types";

const COLECCION = "asistencias";

function idAsistencia(elencoId: string, alumnoId: string, fechaSesion: string): string {
  return `${elencoId}_${alumnoId}_${fechaSesion}`;
}

function mapAsistencia(id: string, data: DocumentData): ConId<Asistencia> {
  return {
    id,
    elencoId: data.elencoId,
    alumnoId: data.alumnoId,
    profesorId: data.profesorId,
    fechaSesion: data.fechaSesion,
    estado: data.estado,
    observaciones: data.observaciones,
    fechaRegistro: timestampADate(data.fechaRegistro),
  };
}

interface DatosAsistencia {
  elencoId: string;
  alumnoId: string;
  profesorId: string;
  fechaSesion: string;
  estado: EstadoAsistencia;
  observaciones?: string;
}

/** Upsert idempotente sobre el ID determinístico (decisión 4.2.3). RF-09. */
export async function registrarAsistencia(datos: DatosAsistencia): Promise<void> {
  const id = idAsistencia(datos.elencoId, datos.alumnoId, datos.fechaSesion);

  const nuevaAsistencia: WithFieldValue<Asistencia> = {
    elencoId: datos.elencoId,
    alumnoId: datos.alumnoId,
    profesorId: datos.profesorId,
    fechaSesion: datos.fechaSesion,
    estado: datos.estado,
    ...(datos.observaciones ? { observaciones: datos.observaciones } : {}),
    fechaRegistro: serverTimestamp(),
  };

  await setDoc(doc(db, COLECCION, id), nuevaAsistencia);
}

/** Asistencia de todo un elenco en una sesión puntual, para la planilla del profesor. */
export async function listarAsistenciasPorElencoYFecha(
  elencoId: string,
  fechaSesion: string
): Promise<ConId<Asistencia>[]> {
  const snap = await getDocs(
    query(
      collection(db, COLECCION),
      where("elencoId", "==", elencoId),
      where("fechaSesion", "==", fechaSesion)
    )
  );
  return snap.docs.map((d) => mapAsistencia(d.id, d.data()));
}

/** Historial completo de un alumno en un elenco, para calcular % de asistencia (RF-10). */
export async function listarAsistenciasPorAlumno(
  elencoId: string,
  alumnoId: string
): Promise<ConId<Asistencia>[]> {
  const snap = await getDocs(
    query(
      collection(db, COLECCION),
      where("elencoId", "==", elencoId),
      where("alumnoId", "==", alumnoId)
    )
  );
  return snap.docs.map((d) => mapAsistencia(d.id, d.data()));
}

/** % de sesiones registradas como "presente" sobre el total (RF-10). */
export function calcularPorcentajeAsistencia(asistencias: ConId<Asistencia>[]): number {
  if (asistencias.length === 0) return 0;
  const presentes = asistencias.filter((a) => a.estado === "presente").length;
  return Math.round((presentes / asistencias.length) * 100);
}
