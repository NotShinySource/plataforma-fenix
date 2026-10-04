"use server";

import { after } from "next/server";
import { procesarSolicitudAcceso } from "@/lib/auth/solicitud-acceso";

/**
 * "Primera vez / Olvidé mi contraseña". Responde siempre lo mismo, exista o
 * no una cuenta con ese RUT, para no revelar qué RUT están registrados. Los
 * correos se envían después de responder (after), así el tiempo de respuesta
 * tampoco lo delata.
 */
export async function solicitarAccesoAction(rut: string): Promise<{ ok: true }> {
  try {
    await procesarSolicitudAcceso(rut, (tarea) => after(tarea));
  } catch (error) {
    console.error("Error procesando una solicitud de acceso:", error);
  }
  return { ok: true };
}
