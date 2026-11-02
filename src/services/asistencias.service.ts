import { collection, getDocs, query, where, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { Asistencia, ConId } from "@/types";

/*
 * Solo lecturas: la asistencia se registra dentro de una clase en curso, a
 * través de un Server Action que verifica al docente en el servidor.
 */
const COLECCION = "asistencias";
const COLECCION_OBSERVACIONES = "observaciones_asistencia";

function mapAsistencia(id: string, data: DocumentData): ConId<Asistencia> {
  return {
    id,
    elencoId: data.elencoId,
    alumnoId: data.alumnoId,
    profesorId: data.profesorId,
    fechaSesion: data.fechaSesion,
    estado: data.estado,
    sesionId: data.sesionId,
    fechaRegistro: timestampADate(data.fechaRegistro),
  };
}

/**
 * Asistencia tomada en una sesión de clase. Se filtra también por elenco
 * porque las reglas dejan leerla según el elenco: sin ese filtro, Firestore
 * no puede garantizar que todos los resultados sean de un elenco del docente.
 */
export async function listarAsistenciasPorSesion(
  elencoId: string,
  sesionId: string
): Promise<ConId<Asistencia>[]> {
  const snap = await getDocs(
    query(
      collection(db, COLECCION),
      where("elencoId", "==", elencoId),
      where("sesionId", "==", sesionId)
    )
  );
  return snap.docs.map((d) => mapAsistencia(d.id, d.data()));
}

/** Observaciones internas del docente en una sesión, por alumno (solo docentes y Dirección). */
export async function listarObservacionesPorSesion(
  elencoId: string,
  sesionId: string
): Promise<Record<string, string>> {
  const snap = await getDocs(
    query(
      collection(db, COLECCION_OBSERVACIONES),
      where("elencoId", "==", elencoId),
      where("sesionId", "==", sesionId)
    )
  );
  const porAlumno: Record<string, string> = {};
  snap.docs.forEach((d) => (porAlumno[d.data().alumnoId as string] = d.data().texto as string));
  return porAlumno;
}

/**
 * Asistencia de varias sesiones a la vez, para el informe. Firestore admite
 * hasta 30 valores en un filtro "in", así que se consulta por tandas.
 */
export async function listarAsistenciasDeSesiones(
  sesionIds: string[]
): Promise<ConId<Asistencia>[]> {
  const tandas: string[][] = [];
  for (let i = 0; i < sesionIds.length; i += 30) tandas.push(sesionIds.slice(i, i + 30));

  const resultados = await Promise.all(
    tandas.map((tanda) =>
      getDocs(query(collection(db, COLECCION), where("sesionId", "in", tanda)))
    )
  );
  return resultados.flatMap((snap) => snap.docs.map((d) => mapAsistencia(d.id, d.data())));
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
