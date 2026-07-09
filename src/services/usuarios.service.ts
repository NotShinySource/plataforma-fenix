import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { ConId, Usuario } from "@/types";

const COLECCION = "usuarios";

function mapUsuario(id: string, data: DocumentData): ConId<Usuario> {
  return {
    id,
    rut: data.rut,
    nombres: data.nombres,
    apellidos: data.apellidos,
    email: data.email,
    rol: data.rol,
    activo: data.activo,
    fechaNacimiento: timestampADate(data.fechaNacimiento),
    fechaCreacion: timestampADate(data.fechaCreacion),
  };
}

/** El ID del documento es el UID de Firebase Auth (decisión 4.2.5). */
export async function obtenerUsuario(uid: string): Promise<ConId<Usuario> | null> {
  const snap = await getDoc(doc(db, COLECCION, uid));
  return snap.exists() ? mapUsuario(snap.id, snap.data()) : null;
}

/** Listado completo para la tabla de usuarios del Admin. */
export async function listarUsuarios(): Promise<ConId<Usuario>[]> {
  const snap = await getDocs(collection(db, COLECCION));
  return snap.docs.map((usuarioDoc) => mapUsuario(usuarioDoc.id, usuarioDoc.data()));
}

/**
 * Actualiza solo los campos editables por el propio usuario. La creación de
 * usuarios (Auth + custom claim + doc) requiere Admin SDK, no vive aquí
 * (ver scripts/seed-test-users.ts) porque el rol de Admin liviano todavía no
 * tiene una pantalla propia.
 */
export async function actualizarPerfilUsuario(
  uid: string,
  cambios: Partial<Pick<Usuario, "nombres" | "apellidos" | "fechaNacimiento">>
): Promise<void> {
  await setDoc(doc(db, COLECCION, uid), cambios, { merge: true });
}
