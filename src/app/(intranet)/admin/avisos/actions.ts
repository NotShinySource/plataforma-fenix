"use server";

import { FieldValue, type WithFieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase/admin";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import { validarAvisoDireccion } from "@/lib/avisos";
import type { Aviso } from "@/types";

export type ResultadoAviso = { ok: true } | { ok: false; error: string };

const coleccionAvisos = () => dbAdmin.collection("avisos");

/**
 * RF-11, lado Dirección: publica un aviso para toda la escuela o para un
 * grupo. Se escribe desde el servidor porque las reglas solo dejan publicar
 * desde el navegador al docente de cada grupo.
 */
export async function publicarAvisoDireccionAction(input: {
  idTokenAdmin: string;
  aviso: unknown;
}): Promise<ResultadoAviso> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  const validacion = validarAvisoDireccion(input.aviso);
  if (!validacion.ok) return validacion;
  const datos = validacion.valor;

  try {
    if (datos.alcance === "elenco") {
      const grupo = await dbAdmin.collection("elencos").doc(datos.elencoId!).get();
      if (!grupo.exists) return { ok: false, error: "El grupo ya no existe." };
      if (grupo.data()?.activo === false) {
        return { ok: false, error: "El grupo está archivado: no admite avisos nuevos." };
      }
    }

    const aviso: WithFieldValue<Aviso> = {
      ...datos,
      origen: "direccion",
      profesorId: verificacion.uid,
      fechaPublicacion: FieldValue.serverTimestamp(),
    };
    await coleccionAvisos().add(aviso);
    return { ok: true };
  } catch (error) {
    console.error("No se pudo publicar el aviso:", error);
    return { ok: false, error: "No se pudo publicar el aviso. Intenta de nuevo." };
  }
}

/**
 * Borra un aviso (de la Dirección o de un docente) junto con sus lecturas.
 * Sirve para corregir errores o moderar; no se puede deshacer.
 */
export async function eliminarAvisoAction(input: {
  idTokenAdmin: string;
  avisoId: string;
}): Promise<ResultadoAviso> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  try {
    const referencia = coleccionAvisos().doc(String(input.avisoId));
    if (!(await referencia.get()).exists) return { ok: false, error: "El aviso ya no existe." };
    await dbAdmin.recursiveDelete(referencia);
    return { ok: true };
  } catch (error) {
    console.error("No se pudo eliminar el aviso:", error);
    return { ok: false, error: "No se pudo eliminar el aviso. Intenta de nuevo." };
  }
}
