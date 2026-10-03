"use server";

import { rutEsValido } from "@/lib/auth/rut";
import { identificadorDesdeRut } from "@/lib/seguridad/cifrado";

export type IdentificadorResultado = { ok: true; identificador: string } | { ok: false };

/**
 * Traduce el RUT ingresado al identificador interno de la cuenta de Firebase
 * Auth. Tiene que ocurrir en el servidor porque usa la clave del HMAC, que
 * nunca llega al navegador.
 *
 * No revela si el RUT está registrado: el identificador se calcula igual
 * para cualquier RUT válido, exista o no la cuenta.
 */
export async function obtenerIdentificadorAction(rut: string): Promise<IdentificadorResultado> {
  if (typeof rut !== "string" || !rutEsValido(rut)) {
    return { ok: false };
  }
  return { ok: true, identificador: identificadorDesdeRut(rut) };
}
