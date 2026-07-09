import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { ConId, Elenco, MiembroElenco, RolEnElenco } from "@/types";

const COLECCION_ELENCOS = "elencos";
const COLECCION_MIEMBROS = "miembros_elenco";

function mapElenco(id: string, data: DocumentData): ConId<Elenco> {
  return {
    id,
    nombre: data.nombre,
    disciplina: data.disciplina,
    tipoElenco: data.tipoElenco,
    descripcion: data.descripcion,
    docenteResponsableId: data.docenteResponsableId,
    activo: data.activo,
    fechaCreacion: timestampADate(data.fechaCreacion),
  };
}

function mapMiembro(id: string, data: DocumentData): ConId<MiembroElenco> {
  return {
    id,
    elencoId: data.elencoId,
    usuarioId: data.usuarioId,
    rolEnElenco: data.rolEnElenco,
    cargoDocente: data.cargoDocente,
    fechaIngreso: timestampADate(data.fechaIngreso),
    activo: data.activo,
  };
}

export async function obtenerElenco(elencoId: string): Promise<ConId<Elenco> | null> {
  const snap = await getDoc(doc(db, COLECCION_ELENCOS, elencoId));
  return snap.exists() ? mapElenco(snap.id, snap.data()) : null;
}

/** Todos los elencos, para el listado del Admin. */
export async function listarElencos(): Promise<ConId<Elenco>[]> {
  const snap = await getDocs(collection(db, COLECCION_ELENCOS));
  return snap.docs.map((elencoDoc) => mapElenco(elencoDoc.id, elencoDoc.data()));
}

/** Cantidad de miembros activos por elenco, para la columna del listado del Admin. */
export async function contarMiembrosPorElenco(): Promise<Record<string, number>> {
  const snap = await getDocs(
    query(collection(db, COLECCION_MIEMBROS), where("activo", "==", true))
  );

  const conteo: Record<string, number> = {};
  snap.docs.forEach((membresiaDoc) => {
    const elencoId = membresiaDoc.data().elencoId as string;
    conteo[elencoId] = (conteo[elencoId] ?? 0) + 1;
  });
  return conteo;
}

/**
 * get() directo sobre el ID determinístico `{elencoId}_{usuarioId}` (decisión
 * 4.2.2) — para que la UI pueda verificar pertenencia real a un elenco antes
 * de mostrar su contenido, incluso mientras las Security Rules sigan en su
 * versión temporal simplificada (no validan esto todavía).
 */
export async function esMiembroDeElenco(elencoId: string, usuarioId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, COLECCION_MIEMBROS, `${elencoId}_${usuarioId}`));
  return snap.exists() && snap.data().activo === true;
}

/** Elencos de los que el usuario es miembro (alumno o profesor), vía miembros_elenco (decisión 4.2.2). */
export async function listarElencosPorUsuario(usuarioId: string): Promise<ConId<Elenco>[]> {
  const membresiasSnap = await getDocs(
    query(
      collection(db, COLECCION_MIEMBROS),
      where("usuarioId", "==", usuarioId),
      where("activo", "==", true)
    )
  );

  const elencos = await Promise.all(
    membresiasSnap.docs.map((membresiaDoc) =>
      obtenerElenco(membresiaDoc.data().elencoId as string)
    )
  );

  return elencos.filter((elenco): elenco is ConId<Elenco> => elenco !== null);
}

/** Miembros de un elenco, opcionalmente filtrados por rol (p. ej. solo alumnos para tomar asistencia). */
export async function listarMiembrosDeElenco(
  elencoId: string,
  rolEnElenco?: RolEnElenco
): Promise<ConId<MiembroElenco>[]> {
  const condiciones: QueryConstraint[] = [
    where("elencoId", "==", elencoId),
    where("activo", "==", true),
  ];
  if (rolEnElenco) condiciones.push(where("rolEnElenco", "==", rolEnElenco));

  const snap = await getDocs(query(collection(db, COLECCION_MIEMBROS), ...condiciones));
  return snap.docs.map((d) => mapMiembro(d.id, d.data()));
}
