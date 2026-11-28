"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { puedeEntrarA, rolRequeridoParaRuta, RUTA_POR_ROL } from "@/lib/auth/rutas";
import { SkeletonPagina } from "@/components/ui/Skeleton";

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
    if (!puedeEntrarA(rol, rolRequerido)) {
      router.replace(RUTA_POR_ROL[rol]);
    }
  }, [cargando, usuario, rol, pathname, router]);

  const rolRequerido = rolRequeridoParaRuta(pathname);
  const sesionValida =
    !cargando && usuario && rol && puedeEntrarA(rol, rolRequerido);

  if (!sesionValida) {
    return <SkeletonPagina />;
  }

  return <>{children}</>;
}
