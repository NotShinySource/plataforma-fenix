import { collection, getDocs, query, where, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { Asistencia, ConId } from "@/types";

/*
 * Solo lecturas: la asistencia se registra dentro de una clase en curso, a
 * través de un Server Action que verifica al docente en el servidor.
 */
const COLECCION = "asistencias";

function mapAsistencia(id: string, data: DocumentData): ConId<Asistencia> {
  return {
    id,
    elencoId: data.elencoId,
    alumnoId: data.alumnoId,
    profesorId: data.profesorId,
    fechaSesion: data.fechaSesion,
    estado: data.estado,
    observaciones: data.observaciones,
    sesionId: data.sesionId,
    fechaRegistro: timestampADate(data.fechaRegistro),
  };
}

/** Asistencia tomada en una sesión de clase (incluye las observaciones del docente). */
export async function listarAsistenciasPorSesion(sesionId: string): Promise<ConId<Asistencia>[]> {
  const snap = await getDocs(query(collection(db, COLECCION), where("sesionId", "==", sesionId)));
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
