"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { CLASE_ACCION_PRIMARIA, PantallaEstado } from "@/components/ui/PantallaEstado";
import "./globals.css";

/**
 * Último recurso: reemplaza al layout raíz cuando es el propio layout el que
 * falla, así que debe traer su propio <html> y <body>.
 */
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-full flex flex-col antialiased">
        <PantallaEstado
          codigo="Ups"
          titulo="La plataforma no pudo cargar"
          descripcion="Ocurrió un error al abrir el sitio. Intenta de nuevo en unos segundos."
          detalle={error.digest ? `Código de referencia: ${error.digest}` : undefined}
          acciones={
            <button type="button" onClick={reset} className={CLASE_ACCION_PRIMARIA}>
              <RotateCcw className="w-4 h-4" /> Reintentar
            </button>
          }
        />
      </body>
    </html>
  );
}
