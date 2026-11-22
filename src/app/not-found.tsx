import type { Metadata } from "next";
import Link from "next/link";
import { Home, LogIn } from "lucide-react";
import {
  CLASE_ACCION_PRIMARIA,
  CLASE_ACCION_SECUNDARIA,
  PantallaEstado,
} from "@/components/ui/PantallaEstado";

export const metadata: Metadata = {
  title: "Página no encontrada — Escuela de Música Calambanda",
};

export default function NoEncontrada() {
  return (
    <PantallaEstado
      codigo="404"
      titulo="Esta página se salió de la partitura"
      descripcion="No encontramos lo que buscabas. Puede que el enlace esté mal escrito o que la página ya no exista."
      acciones={
        <>
          <Link href="/" className={CLASE_ACCION_PRIMARIA}>
            <Home className="w-4 h-4" /> Volver al inicio
          </Link>
          <Link href="/login" className={CLASE_ACCION_SECUNDARIA}>
            <LogIn className="w-4 h-4" /> Ingresar a la intranet
          </Link>
        </>
      }
    />
  );
}
