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
import { validarArchivoMaterial, validarContenidoJpeg } from "@/lib/validacion";
import type { Archivo, ConId, TipoArchivo } from "@/types";

const COLECCION = "archivos";

const CONTENT_TYPE: Record<TipoArchivo, string> = {
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  jpeg: "image/jpeg",
};

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
  const problema = validarArchivoMaterial(datos.archivo, datos.tipo);
  if (problema) throw new Error(problema);
  const esJpeg = datos.tipo === "jpeg";
  if (esJpeg) await validarContenidoJpeg(datos.archivo);

  const rutaStorage = `elencos/${datos.elencoId}/${datos.tipo}/${Date.now()}_${datos.archivo.name}`;
  const referenciaStorage = ref(storage, rutaStorage);

  // El tipo se fija desde el formato ya validado: el navegador a veces lo deja
  // vacío (sobre todo con archivos elegidos desde una carpeta) y storage.rules
  // rechaza la subida si no coincide.
  await uploadBytes(referenciaStorage, datos.archivo, { contentType: CONTENT_TYPE[datos.tipo] });
  try {
    const nuevoArchivo: WithFieldValue<Archivo> = {
      elencoId: datos.elencoId,
      profesorId: datos.profesorId,
      tipo: datos.tipo,
      categoria: datos.categoria,
      titulo: datos.titulo,
      nombreArchivo: datos.archivo.name,
      urlStorage: await getDownloadURL(referenciaStorage),
      tamanioBytes: datos.archivo.size,
      fechaSubida: serverTimestamp(),
    };
    return (await addDoc(collection(db, COLECCION), nuevoArchivo)).id;
  } catch (error) {
    await deleteObject(referenciaStorage).catch(() => undefined);
    throw error;
  }
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
