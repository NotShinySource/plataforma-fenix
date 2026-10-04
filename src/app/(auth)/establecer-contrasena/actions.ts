"use server";

import { authAdmin, dbAdmin } from "@/lib/firebase/admin";

/**
 * Marca la cuenta como activada después de que el usuario creó su contraseña
 * e inició sesión con ella. Se verifica con su propio ID token: solo puede
 * activar su propia cuenta, y solo quien ya demostró conocer la contraseña.
 */
export async function confirmarActivacionAction(idToken: string): Promise<{ ok: boolean }> {
  try {
    const { uid } = await authAdmin.verifyIdToken(idToken);
    const usuarioRef = dbAdmin.collection("usuarios").doc(uid);
    const usuarioDoc = await usuarioRef.get();

    if (usuarioDoc.exists && usuarioDoc.data()?.estadoActivacion !== "activada") {
      await usuarioRef.update({ estadoActivacion: "activada" });
    }
    return { ok: true };
  } catch (error) {
    console.error("No se pudo confirmar la activación de la cuenta:", error);
    return { ok: false };
  }
}
