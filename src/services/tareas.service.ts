import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
  type WithFieldValue,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { timestampADate, type TimestampDeCualquierSdk } from "@/lib/firebase/converters";
import type { ConId, Tarea, TipoAdjuntoTarea } from "@/types";

const COLECCION = "tareas";

function mapTarea(id: string, data: DocumentData): ConId<Tarea> {
  const completadoEn: Record<string, Date> = {};
  Object.entries((data.completadoEn ?? {}) as Record<string, TimestampDeCualquierSdk>).forEach(
    ([alumnoId, fecha]) => {
      completadoEn[alumnoId] = timestampADate(fecha);
    }
  );

  return {
    id,
    titulo: data.titulo,
    elencoId: data.elencoId,
    profesorId: data.profesorId,
    fechaLimite: data.fechaLimite ? timestampADate(data.fechaLimite) : undefined,
    tipoAdjunto: data.tipoAdjunto ?? "Ninguno",
    urlAdjunto: data.urlAdjunto,
    nombreAdjunto: data.nombreAdjunto,
    completadoPor: data.completadoPor ?? [],
    completadoEn,
    fechaCreacion: timestampADate(data.fechaCreacion),
  };
}

/**
 * Escucha en tiempo real las tareas de uno o más elencos. Una suscripción por
 * elenco (solo `where` de igualdad, sin índices compuestos); el resultado se
 * entrega combinado y recién cuando todos los elencos respondieron al menos
 * una vez, para no mostrar listas parciales.
 */
export function suscribirTareasDeElencos(
  elencoIds: string[],
  onTareas: (tareas: ConId<Tarea>[]) => void,
  onError: () => void
): Unsubscribe {
  const porElenco = new Map<string, ConId<Tarea>[]>();

  const cancelaciones = elencoIds.map((elencoId) =>
    onSnapshot(
      query(collection(db, COLECCION), where("elencoId", "==", elencoId)),
      (snap) => {
        porElenco.set(
          elencoId,
          // "estimate": mientras el servidor no confirma un serverTimestamp()
          // recién escrito, se usa la hora local en vez de null.
          snap.docs.map((d) => mapTarea(d.id, d.data({ serverTimestamps: "estimate" })))
        );
        if (porElenco.size === elencoIds.length) {
          onTareas(Array.from(porElenco.values()).flat());
        }
      },
      onError
    )
  );

  return () => cancelaciones.forEach((cancelar) => cancelar());
}

interface DatosNuevaTarea {
  titulo: string;
  elencoId: string;
  profesorId: string;
  fechaLimite?: Date;
  tipoAdjunto: TipoAdjuntoTarea;
  /** Obligatorio cuando tipoAdjunto no es "Ninguno". */
  archivo?: File;
}

/** Sube el adjunto (si hay) a la carpeta del elenco en Storage y crea la tarea. */
export async function crearTarea(datos: DatosNuevaTarea): Promise<string> {
  let adjunto: { urlAdjunto: string; nombreAdjunto: string } | null = null;

  if (datos.tipoAdjunto !== "Ninguno" && datos.archivo) {
    const referencia = ref(
      storage,
      `elencos/${datos.elencoId}/tareas/${Date.now()}_${datos.archivo.name}`
    );
    await uploadBytes(referencia, datos.archivo);
    adjunto = {
      urlAdjunto: await getDownloadURL(referencia),
      nombreAdjunto: datos.archivo.name,
    };
  }

  const nuevaTarea: WithFieldValue<Tarea> = {
    titulo: datos.titulo,
    elencoId: datos.elencoId,
    profesorId: datos.profesorId,
    tipoAdjunto: adjunto ? datos.tipoAdjunto : "Ninguno",
    completadoPor: [],
    completadoEn: {},
    fechaCreacion: serverTimestamp(),
    ...(datos.fechaLimite ? { fechaLimite: datos.fechaLimite } : {}),
    ...(adjunto ?? {}),
  };

  const docRef = await addDoc(collection(db, COLECCION), nuevaTarea);
  return docRef.id;
}

/** Solo título y fecha límite: el elenco y el adjunto no cambian una vez asignada. */
export async function actualizarTarea(
  tareaId: string,
  cambios: { titulo: string; fechaLimite: Date | null }
): Promise<void> {
  await updateDoc(doc(db, COLECCION, tareaId), {
    titulo: cambios.titulo,
    fechaLimite: cambios.fechaLimite ?? deleteField(),
  });
}

export async function eliminarTarea(tarea: ConId<Tarea>): Promise<void> {
  await deleteDoc(doc(db, COLECCION, tarea.id));
  if (!tarea.urlAdjunto) return;
  try {
    await deleteObject(ref(storage, tarea.urlAdjunto));
  } catch {
    // La tarea ya se borró; si el adjunto falla o ya no existe en Storage,
    // no se bloquea la operación principal.
  }
}

/**
 * El alumno marca o desmarca la tarea como cumplida. arrayUnion/arrayRemove
 * hacen la operación atómica aunque varios alumnos marquen a la vez.
 */
export async function marcarTarea(
  tareaId: string,
  alumnoId: string,
  completada: boolean
): Promise<void> {
  await updateDoc(doc(db, COLECCION, tareaId), {
    completadoPor: completada ? arrayUnion(alumnoId) : arrayRemove(alumnoId),
    [`completadoEn.${alumnoId}`]: completada ? serverTimestamp() : deleteField(),
  });
}
