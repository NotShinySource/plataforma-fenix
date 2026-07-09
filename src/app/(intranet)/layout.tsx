"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { RolUsuario } from "@/types";

const RUTA_POR_ROL: Record<RolUsuario, string> = {
  alumno: "/alumno",
  profesor: "/profesor",
  administrador: "/admin",
};

function rolRequeridoParaRuta(pathname: string): RolUsuario | null {
  if (pathname.startsWith("/alumno")) return "alumno";
  if (pathname.startsWith("/profesor")) return "profesor";
  if (pathname.startsWith("/admin")) return "administrador";
  return null;
}

/**
 * Protección de rutas del lado del cliente (provisional): la verificación
 * real con cookie de sesión en proxy.ts queda pendiente antes del despliegue
 * final — sin ella, esta protección
 * solo evita que la UI se muestre, no impide pedir el HTML de la ruta.
 */
export default function IntranetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, rol, cargando } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;

    if (!usuario || !rol) {
      router.replace("/login");
      return;
    }

    const rolRequerido = rolRequeridoParaRuta(pathname);
    if (rolRequerido && rolRequerido !== rol) {
      router.replace(RUTA_POR_ROL[rol]);
    }
  }, [cargando, usuario, rol, pathname, router]);

  const rolRequerido = rolRequeridoParaRuta(pathname);
  const sesionValida =
    !cargando && usuario && rol && (!rolRequerido || rolRequerido === rol);

  if (!sesionValida) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-600 text-sm font-semibold">
        Cargando...
      </main>
    );
  }

  return <>{children}</>;
}
