import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type WithFieldValue,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { Archivo, ConId, TipoArchivo } from "@/types";

const COLECCION = "archivos";

function mapArchivo(id: string, data: DocumentData): ConId<Archivo> {
  return {
    id,
    elencoId: data.elencoId,
    profesorId: data.profesorId,
    tipo: data.tipo,
    categoria: data.categoria,
    titulo: data.titulo,
    nombreArchivo: data.nombreArchivo,
    urlStorage: data.urlStorage,
    tamanioBytes: data.tamanioBytes,
    fechaSubida: timestampADate(data.fechaSubida),
  };
}

/**
 * Material de un elenco (RF-06/RF-08: ver/descargar PDF, reproducir audio).
 * Sin orderBy en la query a propósito (no hay índices compuestos definidos
 * todavía): se ordena en cliente por fecha de subida, más reciente primero.
 */
export async function listarArchivosPorElenco(
  elencoId: string,
  tipo?: TipoArchivo
): Promise<ConId<Archivo>[]> {
  const snap = await getDocs(
    query(collection(db, COLECCION), where("elencoId", "==", elencoId))
  );
  const archivos = snap.docs
    .map((d) => mapArchivo(d.id, d.data()))
    .filter((archivo) => !tipo || archivo.tipo === tipo);

  return archivos.sort((a, b) => b.fechaSubida.getTime() - a.fechaSubida.getTime());
}

interface DatosSubidaArchivo {
  elencoId: string;
  profesorId: string;
  tipo: TipoArchivo;
  categoria: string;
  titulo: string;
  archivo: File;
}

/** Sube el binario a Storage y crea el documento en Firestore (RF-05/RF-07). */
export async function subirArchivo(datos: DatosSubidaArchivo): Promise<string> {
  const rutaStorage = `elencos/${datos.elencoId}/${datos.tipo}/${Date.now()}_${datos.archivo.name}`;
  const referenciaStorage = ref(storage, rutaStorage);

  await uploadBytes(referenciaStorage, datos.archivo);
  const urlStorage = await getDownloadURL(referenciaStorage);

  const nuevoArchivo: WithFieldValue<Archivo> = {
    elencoId: datos.elencoId,
    profesorId: datos.profesorId,
    tipo: datos.tipo,
    categoria: datos.categoria,
    titulo: datos.titulo,
    nombreArchivo: datos.archivo.name,
    urlStorage,
    tamanioBytes: datos.archivo.size,
    fechaSubida: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLECCION), nuevoArchivo);
  return docRef.id;
}

export async function eliminarArchivo(archivoId: string, urlStorage: string): Promise<void> {
  await deleteDoc(doc(db, COLECCION, archivoId));
  try {
    await deleteObject(ref(storage, urlStorage));
  } catch {
    // El documento ya se borró; si el objeto en Storage falla o ya no
    // existe, no bloqueamos la operación principal.
  }
}
