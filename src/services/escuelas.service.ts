import { collection, getDocs, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { ConId, Escuela } from "@/types";

const COLECCION_ESCUELAS = "escuelas";

function mapEscuela(id: string, data: DocumentData): ConId<Escuela> {
  return {
    id,
    nombre: data.nombre,
    tipo: data.tipo === "instrumento" ? "instrumento" : "conjunto",
    niveles: Array.isArray(data.niveles) ? data.niveles : [],
    activo: data.activo !== false,
    fechaCreacion: timestampADate(data.fechaCreacion),
  };
}

/** Todas las escuelas, ordenadas por nombre. Las escribe solo el servidor. */
export async function listarEscuelas(): Promise<ConId<Escuela>[]> {
  const snap = await getDocs(collection(db, COLECCION_ESCUELAS));
  return snap.docs
    .map((escuelaDoc) => mapEscuela(escuelaDoc.id, escuelaDoc.data()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
