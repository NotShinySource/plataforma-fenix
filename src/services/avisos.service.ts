import {
  addDoc,
  collection,
  doc,
  getDoc,
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
import { compararAvisos } from "@/lib/avisos";
import type { Aviso, ConId, LecturaAviso } from "@/types";

const COLECCION = "avisos";

function mapAviso(id: string, data: DocumentData): ConId<Aviso> {
  return {
    id,
    // Los avisos anteriores a los de la Dirección no tienen estos campos:
    // todos eran de un grupo y los publicaba su docente.
    alcance: data.alcance === "escuela" ? "escuela" : "elenco",
    origen: data.origen === "direccion" ? "direccion" : "profesor",
    elencoId: data.elencoId ?? null,
    profesorId: data.profesorId,
    titulo: data.titulo,
    contenido: data.contenido,
    urgente: data.urgente,
    fechaPublicacion: timestampADate(data.fechaPublicacion),
  };
}

interface DatosNuevoAviso {
  elencoId: string;
  profesorId: string;
  titulo: string;
  contenido: string;
  urgente: boolean;
}

/**
 * RF-11 (publicar), lado profesor. No escribe `alcance` ni `origen`: las
 * reglas no los aceptan desde el navegador, y al leer se completan como
 * aviso de grupo publicado por un docente.
 */
export async function publicarAviso(datos: DatosNuevoAviso): Promise<string> {
  const nuevoAviso: WithFieldValue<Omit<Aviso, "alcance" | "origen">> = {
    elencoId: datos.elencoId,
    profesorId: datos.profesorId,
    titulo: datos.titulo,
    contenido: datos.contenido,
    urgente: datos.urgente,
    fechaPublicacion: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLECCION), nuevoAviso);
  return docRef.id;
}

/**
 * RF-11 (leer), lado alumno. Sin orderBy en la query a propósito (no hay
 * índices compuestos definidos todavía): se ordena en cliente, urgentes
 * primero y luego por fecha de publicación descendente.
 */
export async function listarAvisosPorElenco(elencoId: string): Promise<ConId<Aviso>[]> {
  const snap = await getDocs(
    query(collection(db, COLECCION), where("elencoId", "==", elencoId))
  );

  return snap.docs.map((d) => mapAviso(d.id, d.data())).sort(compararAvisos);
}

/** Avisos de la Dirección para toda la escuela: los ve cualquier usuario con sesión. */
export async function listarAvisosDeEscuela(): Promise<ConId<Aviso>[]> {
  const snap = await getDocs(
    query(collection(db, COLECCION), where("alcance", "==", "escuela"))
  );
  return snap.docs.map((d) => mapAviso(d.id, d.data())).sort(compararAvisos);
}

/** Todos los avisos, para el panel de la Dirección (las reglas lo permiten solo al Administrador). */
export async function listarTodosLosAvisos(): Promise<ConId<Aviso>[]> {
  const snap = await getDocs(collection(db, COLECCION));
  return snap.docs
    .map((d) => mapAviso(d.id, d.data()))
    .sort((a, b) => b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime());
}

/**
 * Marca el aviso como leído por el alumno: solo se escribe
 * cuando el alumno realmente lo abre, nunca de antemano para todos.
 */
export async function marcarAvisoComoLeido(avisoId: string, alumnoId: string): Promise<void> {
  const lectura: WithFieldValue<LecturaAviso> = {
    leido: true,
    fechaLectura: serverTimestamp(),
  };

  await setDoc(doc(db, COLECCION, avisoId, "lecturas", alumnoId), lectura);
}

export async function obtenerLecturaAviso(
  avisoId: string,
  alumnoId: string
): Promise<ConId<LecturaAviso> | null> {
  const snap = await getDoc(doc(db, COLECCION, avisoId, "lecturas", alumnoId));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    leido: data.leido,
    fechaLectura: timestampADate(data.fechaLectura),
  };
}
