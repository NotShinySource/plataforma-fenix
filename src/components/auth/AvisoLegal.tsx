"use client";

import { useCallback, useState } from "react";
import {
  POLITICA_PRIVACIDAD,
  TERMINOS_CONDICIONES,
  type DocumentoLegal,
} from "@/lib/legal/contenido";
import { ModalLegal } from "@/components/landing/ModalLegal";

/**
 * Aviso de aceptación bajo el formulario de creación de contraseña: los
 * Términos indican que al activar la cuenta se aceptan, así que se avisa en
 * ese momento, con los dos textos a un clic (se abren en un pop-up, sin
 * salir de la página ni perder lo escrito).
 */
export function AvisoLegal() {
  const [abierto, setAbierto] = useState<DocumentoLegal | null>(null);
  const cerrar = useCallback(() => setAbierto(null), []);

  const claseEnlace =
    "font-bold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary transition-colors";

  return (
    <>
      <p className="text-xs text-slate-600 font-medium leading-relaxed text-center px-1">
        Al guardar tu contraseña aceptas los{" "}
        <button type="button" onClick={() => setAbierto(TERMINOS_CONDICIONES)} className={claseEnlace}>
          Términos y Condiciones
        </button>{" "}
        y la{" "}
        <button type="button" onClick={() => setAbierto(POLITICA_PRIVACIDAD)} className={claseEnlace}>
          Política de Privacidad
        </button>{" "}
        de la Plataforma Fénix.
      </p>
      <ModalLegal documento={abierto} onCerrar={cerrar} />
    </>
  );
}
