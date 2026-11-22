"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import {
  CLASE_ACCION_PRIMARIA,
  CLASE_ACCION_SECUNDARIA,
  PantallaEstado,
} from "@/components/ui/PantallaEstado";

/**
 * Error inesperado en cualquier pantalla. No muestra el mensaje técnico (puede
 * contener detalles internos); solo el identificador que Next.js asocia al
 * registro del servidor, para poder buscarlo si alguien lo reporta.
 */
export default function ErrorInesperado({
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
    <PantallaEstado
      codigo="Ups"
      titulo="Algo desafinó"
      descripcion="Ocurrió un error inesperado. Intenta de nuevo; si el problema sigue, avísale a la Dirección de la escuela."
      detalle={error.digest ? `Código de referencia: ${error.digest}` : undefined}
      acciones={
        <>
          <button type="button" onClick={reset} className={CLASE_ACCION_PRIMARIA}>
            <RotateCcw className="w-4 h-4" /> Reintentar
          </button>
          <Link href="/" className={CLASE_ACCION_SECUNDARIA}>
            <Home className="w-4 h-4" /> Volver al inicio
          </Link>
        </>
      }
    />
  );
}
