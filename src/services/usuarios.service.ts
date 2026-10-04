import { doc, getDoc, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { timestampADate } from "@/lib/firebase/converters";
import type { ConId, Usuario } from "@/types";

const COLECCION = "usuarios";

function mapUsuario(id: string, data: DocumentData): ConId<Usuario> {
  return {
    id,
    nombres: data.nombres,
    apellidos: data.apellidos,
    rol: data.rol,
    activo: data.activo,
    estadoActivacion: data.estadoActivacion ?? "pendiente",
    fechaCreacion: timestampADate(data.fechaCreacion),
  };
}

/**
 * El ID del documento es el UID de Firebase Auth (decisión 4.2.5). Solo trae
 * datos no sensibles: RUT y correos los entrega el servidor al Administrador,
 * enmascarados en los listados (listarUsuariosAction) y completos de a un
 * usuario (obtenerDatosPrivadosAction).
 */
export async function obtenerUsuario(uid: string): Promise<ConId<Usuario> | null> {
  const snap = await getDoc(doc(db, COLECCION, uid));
  return snap.exists() ? mapUsuario(snap.id, snap.data()) : null;
}
