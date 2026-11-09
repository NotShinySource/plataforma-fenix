"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { rolRequeridoParaRuta, RUTA_POR_ROL } from "@/lib/auth/rutas";

/**
 * Segunda capa, del lado del cliente: proxy.ts ya impide en el servidor que
 * se responda una ruta sin cookie de sesión o con otro rol. Esto cubre el
 * caso en que la sesión de Firebase en el navegador se cerró o cambió
 * mientras la cookie seguía vigente, y evita mostrar la interfaz sin datos.
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
