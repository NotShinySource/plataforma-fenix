import "server-only";
import { authAdmin } from "@/lib/firebase/admin";
import type { RolUsuario } from "@/types";

/**
 * Cookie de sesión del servidor. Firebase Auth en el navegador guarda su
 * sesión en IndexedDB, que el servidor no puede leer: esta cookie es lo que
 * permite a proxy.ts comprobar, antes de responder, que quien pide una ruta
 * de la intranet inició sesión y tiene el rol correcto.
 *
 * Se llama "__session" porque es el único nombre de cookie que Firebase
 * Hosting deja pasar hasta el servidor.
 */
export const NOMBRE_COOKIE_SESION = "__session";

/** Cuánto dura la sesión antes de pedir la contraseña otra vez. */
export const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Solo se acepta un inicio de sesión reciente para crear la cookie. Así, un
 * ID token robado (que vale una hora) no sirve para abrir una sesión de días.
 */
const ANTIGUEDAD_MAXIMA_LOGIN_SEGUNDOS = 5 * 60;

export interface SesionServidor {
  uid: string;
  rol: RolUsuario;
}

const ROLES: RolUsuario[] = ["alumno", "profesor", "administrador"];

function rolDe(claims: Record<string, unknown>): RolUsuario | null {
  return ROLES.includes(claims.rol as RolUsuario) ? (claims.rol as RolUsuario) : null;
}

/** Devuelve el valor de la cookie, o null si el ID token no sirve para abrir sesión. */
export async function crearCookieSesion(idToken: string): Promise<string | null> {
  try {
    const token = await authAdmin.verifyIdToken(idToken, true);
    const segundosDesdeLogin = Date.now() / 1000 - token.auth_time;
    if (segundosDesdeLogin > ANTIGUEDAD_MAXIMA_LOGIN_SEGUNDOS || !rolDe(token)) return null;
    return await authAdmin.createSessionCookie(idToken, { expiresIn: DURACION_SESION_MS });
  } catch {
    return null;
  }
}

/**
 * Verifica firma y vencimiento de la cookie. No consulta si la cuenta fue
 * revocada (eso costaría una llamada a Firebase en cada página): los datos
 * siguen protegidos por las reglas de Firestore y por cada Server Action,
 * que verifican el token en cada operación.
 */
export async function verificarCookieSesion(valor: string): Promise<SesionServidor | null> {
  try {
    const token = await authAdmin.verifySessionCookie(valor);
    const rol = rolDe(token);
    return rol ? { uid: token.uid, rol } : null;
  } catch {
    return null;
  }
}
