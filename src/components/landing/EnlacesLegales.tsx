"use client";

import { useCallback, useState } from "react";
import {
  POLITICA_PRIVACIDAD,
  TERMINOS_CONDICIONES,
  type DocumentoLegal,
} from "@/lib/legal/contenido";
import { ModalLegal } from "./ModalLegal";

/** Enlaces del footer a la Política de Privacidad y los Términos, que abren un pop-up. */
export function EnlacesLegales() {
  const [abierto, setAbierto] = useState<DocumentoLegal | null>(null);
  const cerrar = useCallback(() => setAbierto(null), []);

  const clase =
    "hover:text-white underline decoration-white/20 underline-offset-4 hover:decoration-white transition-colors";

  return (
    <>
      <nav aria-label="Información legal" className="flex items-center gap-3">
        <button type="button" onClick={() => setAbierto(POLITICA_PRIVACIDAD)} className={clase}>
          Política de Privacidad
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => setAbierto(TERMINOS_CONDICIONES)} className={clase}>
          Términos y Condiciones
        </button>
      </nav>
      <ModalLegal documento={abierto} onCerrar={cerrar} />
    </>
  );
}
