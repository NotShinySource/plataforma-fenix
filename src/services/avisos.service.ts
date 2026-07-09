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
import type { Aviso, ConId, LecturaAviso } from "@/types";

const COLECCION = "avisos";

function mapAviso(id: string, data: DocumentData): ConId<Aviso> {
  return {
    id,
    elencoId: data.elencoId,
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

/** RF-11 (publicar), lado profesor. */
export async function publicarAviso(datos: DatosNuevoAviso): Promise<string> {
  const nuevoAviso: WithFieldValue<Aviso> = {
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

  return snap.docs
    .map((d) => mapAviso(d.id, d.data()))
    .sort((a, b) => {
      if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
      return b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime();
    });
}

/**
 * Marca el aviso como leído por el alumno (decisión 4.2.4): solo se escribe
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
