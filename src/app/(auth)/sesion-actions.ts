"use server";

import { cookies } from "next/headers";
import {
  crearCookieSesion,
  DURACION_SESION_MS,
  NOMBRE_COOKIE_SESION,
  verificarCookieSesion,
} from "@/lib/auth/sesion";

/**
 * Abre la sesión del servidor justo después de iniciar sesión en el
 * navegador. Si falla, quien llama debe cerrar también la sesión del
 * navegador: sin cookie, proxy.ts no deja entrar a la intranet.
 */
export async function iniciarSesionServidorAction(idToken: string): Promise<{ ok: boolean }> {
  if (typeof idToken !== "string" || !idToken) return { ok: false };

  const valor = await crearCookieSesion(idToken);
  if (!valor) return { ok: false };

  (await cookies()).set(NOMBRE_COOKIE_SESION, valor, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_MS / 1000,
  });
  return { ok: true };
}

export async function cerrarSesionServidorAction(): Promise<void> {
  (await cookies()).delete(NOMBRE_COOKIE_SESION);
}

/** ¿Tiene este navegador una cookie de sesión válida? */
export async function haySesionServidorAction(): Promise<boolean> {
  const valor = (await cookies()).get(NOMBRE_COOKIE_SESION)?.value;
  return Boolean(valor && (await verificarCookieSesion(valor)));
}
