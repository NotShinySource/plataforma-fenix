import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { Clase, ConId, EstadoSesion, Semestre, SesionClase } from "@/types";

/*
 * Solo lecturas: crear, mover, cancelar, iniciar y finalizar clases pasa por
 * Server Actions, que verifican el rol en el servidor y usan la hora del
 * servidor (no la del navegador) para el inicio y el término reales.
 */

const COLECCION_SEMESTRES = "semestres";
const COLECCION_CLASES = "clases";
const COLECCION_SESIONES = "sesiones_clase";

function mapClase(id: string, data: DocumentData): ConId<Clase> {
  return {
    id,
    elencoId: data.elencoId,
    fechaInicio: data.fechaInicio,
    horaInicio: data.horaInicio,
    duracionMinutos: data.duracionMinutos,
    repeticion: data.repeticion ?? { tipo: "unica" },
    fechaCreacion: timestampADate(data.fechaCreacion),
  };
}

function mapSesion(id: string, data: DocumentData): ConId<SesionClase> {
  return {
    id,
    claseId: data.claseId,
    elencoId: data.elencoId,
    fechaProgramada: data.fechaProgramada,
    fecha: data.fecha,
    horaInicio: data.horaInicio,
    duracionMinutos: data.duracionMinutos,
    estado: data.estado,
    profesorId: data.profesorId,
    inicioReal: data.inicioReal ? timestampADate(data.inicioReal) : undefined,
    finReal: data.finReal ? timestampADate(data.finReal) : undefined,
    resumen: data.resumen,
    motivoIncompleta: data.motivoIncompleta,
    fechaActualizacion: timestampADate(data.fechaActualizacion),
  };
}

/** Semestres indexados por su ID (`{anio}-{numero}`). */
export async function listarSemestres(): Promise<Record<string, Semestre>> {
  const snap = await getDocs(collection(db, COLECCION_SEMESTRES));
  const semestres: Record<string, Semestre> = {};
  snap.docs.forEach((semestreDoc) => {
    const data = semestreDoc.data();
    semestres[semestreDoc.id] = {
      anio: data.anio,
      numero: data.numero,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
    };
  });
  return semestres;
}

export async function listarClases(): Promise<ConId<Clase>[]> {
  const snap = await getDocs(collection(db, COLECCION_CLASES));
  return snap.docs.map((claseDoc) => mapClase(claseDoc.id, claseDoc.data()));
}

/** Una consulta por elenco: solo `where` de igualdad, sin índices compuestos. */
export async function listarClasesDeElencos(elencoIds: string[]): Promise<ConId<Clase>[]> {
  const porElenco = await Promise.all(
    elencoIds.map((elencoId) =>
      getDocs(query(collection(db, COLECCION_CLASES), where("elencoId", "==", elencoId)))
    )
  );
  return porElenco.flatMap((snap) => snap.docs.map((d) => mapClase(d.id, d.data())));
}

/**
 * Sesiones relevantes para un rango de días: las que caen en el rango y las
 * que estaban programadas en él aunque se hayan movido a otro día (hacen
 * falta para no mostrar la ocurrencia original).
 */
export async function listarSesionesEnRango(
  desde: string,
  hasta: string
): Promise<ConId<SesionClase>[]> {
  const coleccion = collection(db, COLECCION_SESIONES);
  const [porFecha, porFechaProgramada] = await Promise.all([
    getDocs(query(coleccion, where("fecha", ">=", desde), where("fecha", "<=", hasta))),
    getDocs(
      query(coleccion, where("fechaProgramada", ">=", desde), where("fechaProgramada", "<=", hasta))
    ),
  ]);

  const sesiones = new Map<string, ConId<SesionClase>>();
  [...porFecha.docs, ...porFechaProgramada.docs].forEach((d) =>
    sesiones.set(d.id, mapSesion(d.id, d.data()))
  );
  return Array.from(sesiones.values());
}

export async function listarSesionesDeElencos(
  elencoIds: string[]
): Promise<ConId<SesionClase>[]> {
  const porElenco = await Promise.all(
    elencoIds.map((elencoId) =>
      getDocs(query(collection(db, COLECCION_SESIONES), where("elencoId", "==", elencoId)))
    )
  );
  return porElenco.flatMap((snap) => snap.docs.map((d) => mapSesion(d.id, d.data())));
}

/** Clases ya dictadas (realizadas o incompletas), para el informe a la Corporación. */
export async function listarSesionesDictadas(): Promise<ConId<SesionClase>[]> {
  const estados: EstadoSesion[] = ["realizada", "incompleta"];
  const porEstado = await Promise.all(
    estados.map((estado) =>
      getDocs(query(collection(db, COLECCION_SESIONES), where("estado", "==", estado)))
    )
  );
  return porEstado.flatMap((snap) => snap.docs.map((d) => mapSesion(d.id, d.data())));
}

/** La sesión en tiempo real, para la pantalla de la clase en curso. */
export function suscribirSesion(
  sesionId: string,
  onSesion: (sesion: ConId<SesionClase> | null) => void,
  onError: () => void
): Unsubscribe {
  return onSnapshot(
    doc(db, COLECCION_SESIONES, sesionId),
    (snap) => onSesion(snap.exists() ? mapSesion(snap.id, snap.data()) : null),
    onError
  );
}
