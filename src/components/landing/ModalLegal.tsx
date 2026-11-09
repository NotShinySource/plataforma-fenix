"use client";

import { Fragment, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { FileText, X } from "lucide-react";
import type { BloqueLegal, DocumentoLegal } from "@/lib/legal/contenido";
import { fuenteLanding } from "./fuente";

/** "Texto con **negrita**" → nodos con <strong> en las partes marcadas. */
function conNegritas(texto: string): ReactNode {
  return texto.split("**").map((parte, indice) =>
    indice % 2 === 1 ? (
      <strong key={indice} className="font-bold text-text-dark">
        {parte}
      </strong>
    ) : (
      <Fragment key={indice}>{parte}</Fragment>
    )
  );
}

function Bloque({ bloque }: { bloque: BloqueLegal }) {
  if (bloque.tipo === "parrafo") {
    return <p className="leading-relaxed">{conNegritas(bloque.texto)}</p>;
  }
  if (bloque.tipo === "lista") {
    return (
      <ul className="list-disc pl-5 space-y-1.5 marker:text-primary/60">
        {bloque.items.map((item) => (
          <li key={item} className="leading-relaxed pl-1">
            {conNegritas(item)}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="overflow-x-auto scroll-fino rounded-2xl border border-slate-100">
      <table className="w-full text-sm text-left">
        {bloque.encabezados && (
          <thead className="bg-primary/5 text-primary">
            <tr>
              {bloque.encabezados.map((encabezado) => (
                <th key={encabezado} className="px-3 sm:px-4 py-2.5 font-bold sm:whitespace-nowrap">
                  {encabezado}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100">
          {bloque.filas.map((fila) => (
            <tr key={fila.join("|")} className="align-top">
              {fila.map((celda, indice) => (
                <td
                  key={indice}
                  className={`px-3 sm:px-4 py-2.5 [overflow-wrap:anywhere] ${
                    indice === 0 ? "font-semibold text-text-dark sm:min-w-32" : "sm:min-w-48"
                  }`}
                >
                  {conNegritas(celda)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ModalLegalProps {
  documento: DocumentoLegal | null;
  onCerrar: () => void;
}

const suscribirseNoop = () => () => {};

/**
 * Pop-up para leer un texto legal. Se monta con un portal en <body> para que
 * ninguna sección de la página (el footer tiene su propio z-index) quede
 * por encima.
 */
export function ModalLegal({ documento, onCerrar }: ModalLegalProps) {
  // En el servidor no existe `document`: el portal solo se monta en el cliente.
  const enCliente = useSyncExternalStore(suscribirseNoop, () => true, () => false);
  if (!enCliente) return null;

  return createPortal(
    <AnimatePresence>
      {documento && <Contenido key={documento.titulo} documento={documento} onCerrar={onCerrar} />}
    </AnimatePresence>,
    document.body
  );
}

function Contenido({ documento, onCerrar }: { documento: DocumentoLegal; onCerrar: () => void }) {
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const idTitulo = `legal-${documento.titulo.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    function handleTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCerrar();
    }
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleTecla);
    botonCerrarRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", handleTecla);
    };
  }, [onCerrar]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`${fuenteLanding.className} fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm`}
      onClick={onCerrar}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        onClick={(evento) => evento.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden bg-white rounded-3xl shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-primary/10 text-primary p-2.5 rounded-xl flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id={idTitulo} className="text-xl sm:text-2xl font-black text-text-dark leading-tight">
                {documento.titulo}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Plataforma Fénix · Última actualización: {documento.actualizado}
              </p>
            </div>
          </div>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* El scroll va en este contenedor interior, no en el marco redondeado. */}
        <div className="overflow-y-auto scroll-fino px-6 sm:px-8 py-6 space-y-7 text-sm text-slate-600 font-medium">
          <div className="space-y-4">
            {documento.introduccion.map((bloque, indice) => (
              <Bloque key={indice} bloque={bloque} />
            ))}
          </div>
          {documento.secciones.map((seccion) => (
            <section key={seccion.titulo} className="space-y-3">
              <h3 className="text-base font-extrabold text-text-dark">{seccion.titulo}</h3>
              {seccion.bloques.map((bloque, indice) => (
                <Bloque key={indice} bloque={bloque} />
              ))}
            </section>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
