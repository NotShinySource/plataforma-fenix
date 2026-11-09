import "server-only";
import { authAdmin } from "@/lib/firebase/admin";

export type VerificarAdminResultado =
  | { ok: true; uid: string }
  | { ok: false; error: string };

/**
 * Reverifica en el servidor, con el Admin SDK, que un ID token pertenezca a
 * un administrador. Los Server Actions son endpoints públicos: cada uno de
 * Admin debe llamar esto antes de escribir nada con el Admin SDK, en vez de
 * confiar en que solo se llega ahí desde la pantalla de Admin o en que
 * proxy.ts ya revisó la sesión.
 */
export async function verificarAdmin(idToken: string): Promise<VerificarAdminResultado> {
  try {
    const tokenDecodificado = await authAdmin.verifyIdToken(idToken);
    if (tokenDecodificado.rol !== "administrador") {
      return { ok: false, error: "No autorizado." };
    }
    return { ok: true, uid: tokenDecodificado.uid };
  } catch {
    return { ok: false, error: "Sesión inválida. Vuelve a iniciar sesión." };
  }
}
