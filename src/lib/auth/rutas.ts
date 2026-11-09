import type { RolUsuario } from "@/types";

/** Panel de inicio de cada rol. */
export const RUTA_POR_ROL: Record<RolUsuario, string> = {
  alumno: "/alumno",
  profesor: "/profesor",
  administrador: "/admin",
};

/** Rol que exige una ruta de la intranet, o null si la ruta no es de la intranet. */
export function rolRequeridoParaRuta(pathname: string): RolUsuario | null {
  for (const [rol, ruta] of Object.entries(RUTA_POR_ROL) as [RolUsuario, string][]) {
    if (pathname === ruta || pathname.startsWith(`${ruta}/`)) return rol;
  }
  return null;
}

/**
 * Adónde ir después de iniciar sesión: la ruta que se quería visitar si es
 * del área de ese rol, o su panel. Nunca una dirección externa: solo rutas
 * internas que empiezan con "/".
 */
export function destinoTrasLogin(rol: RolUsuario, siguiente: string | null): string {
  if (siguiente && siguiente.startsWith("/") && !siguiente.startsWith("//")) {
    if (rolRequeridoParaRuta(siguiente) === rol) return siguiente;
  }
  return RUTA_POR_ROL[rol];
}
