import { NextResponse, type NextRequest } from "next/server";
import { NOMBRE_COOKIE_SESION, verificarCookieSesion } from "@/lib/auth/sesion";
import { rolRequeridoParaRuta, RUTA_POR_ROL } from "@/lib/auth/rutas";

/**
 * Protección de la intranet en el servidor: antes de responder una ruta de
 * /alumno, /profesor o /admin, se verifica la cookie de sesión y el rol.
 * Sin sesión válida se redirige al login; con otro rol, a su propio panel.
 *
 * No reemplaza las demás capas: las reglas de Firestore y Storage protegen
 * los datos, y cada Server Action verifica el token de quien la llama.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const valor = request.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const sesion = valor ? await verificarCookieSesion(valor) : null;

  if (!sesion) {
    const login = new URL("/login", request.url);
    login.searchParams.set("siguiente", `${pathname}${search}`);
    const respuesta = NextResponse.redirect(login);
    if (valor) respuesta.cookies.delete(NOMBRE_COOKIE_SESION);
    return respuesta;
  }

  const rolRequerido = rolRequeridoParaRuta(pathname);
  if (rolRequerido && rolRequerido !== sesion.rol) {
    return NextResponse.redirect(new URL(RUTA_POR_ROL[sesion.rol], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/alumno/:path*", "/profesor/:path*", "/admin/:path*"],
};
