import "server-only";
import { authAdmin } from "@/lib/firebase/admin";

/**
 * Dirección pública de la aplicación, para armar los enlaces que se envían
 * por correo. Sale de la configuración del servidor y nunca de la cabecera
 * Host de la petición: si dependiera de ella, alguien podría forzar correos
 * con enlaces que apunten a un sitio falso.
 */
export function urlBaseApp(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");

  // Variables que Vercel define solas en cada despliegue.
  const dominioVercel =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;
  if (dominioVercel) return `https://${dominioVercel}`;

  if (process.env.NODE_ENV === "development") return "http://localhost:3000";

  throw new Error("Falta APP_URL: no se puede armar el enlace de acceso.");
}

/**
 * Enlace para crear o restablecer la contraseña de una cuenta. Firebase
 * genera el código (de un solo uso y con vencimiento); aquí solo se cambia
 * el destino, de la página genérica de Firebase a la página propia
 * /establecer-contrasena.
 */
export async function generarEnlaceEstablecerContrasena(identificador: string): Promise<string> {
  const enlaceFirebase = await authAdmin.generatePasswordResetLink(identificador);
  const codigo = new URL(enlaceFirebase).searchParams.get("oobCode");
  if (!codigo) {
    throw new Error("Firebase no devolvió un código de restablecimiento.");
  }
  return `${urlBaseApp()}/establecer-contrasena?codigo=${encodeURIComponent(codigo)}`;
}
