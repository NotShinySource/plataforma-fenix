import "server-only";
import { authAdmin, dbAdmin } from "@/lib/firebase/admin";
import type { RolUsuario } from "@/types";

export type VerificarUsuarioResultado =
  | { ok: true; uid: string; rol: RolUsuario }
  | { ok: false; error: string };

/**
 * Valida el ID token con el Admin SDK y devuelve el uid y el rol (del custom
 * claim, la misma fuente de verdad que usa verificarAdmin). Los Server
 * Actions son endpoints públicos: nunca confíes en un uid que mande el cliente.
 */
export async function verificarUsuario(idToken: string): Promise<VerificarUsuarioResultado> {
  try {
    const token = await authAdmin.verifyIdToken(idToken);
    const rol = token.rol as RolUsuario | undefined;
    if (!rol) return { ok: false, error: "No autorizado." };
    return { ok: true, uid: token.uid, rol };
  } catch {
    return { ok: false, error: "Sesión inválida. Vuelve a iniciar sesión." };
  }
}

/** ¿Tiene el usuario una membresía activa como profesor en ese elenco? */
export async function esProfesorDelElenco(uid: string, elencoId: string): Promise<boolean> {
  const membresia = await dbAdmin.collection("miembros_elenco").doc(`${elencoId}_${uid}`).get();
  const datos = membresia.data();
  return membresia.exists && datos?.activo === true && datos?.rolEnElenco === "profesor";
}
