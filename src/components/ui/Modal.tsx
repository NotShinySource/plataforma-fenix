"use client";

import { useEffect, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";

interface ModalProps {
  titulo: string;
  subtitulo?: string;
  icono?: LucideIcon;
  /** "peligro" tiñe el ícono de rojo, para acciones destructivas. */
  tono?: "primario" | "peligro";
  ancho?: "sm" | "md" | "lg";
  /** Mientras hay una operación en curso no se puede cerrar (ni con Escape ni con el fondo). */
  bloqueado?: boolean;
  onCerrar: () => void;
  children: ReactNode;
}

const ANCHO = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" };

/** Ventana modal accesible: cierra con Escape o al pulsar el fondo y bloquea el scroll de la página. */
export function Modal({
  titulo,
  subtitulo,
  icono: Icono,
  tono = "primario",
  ancho = "md",
  bloqueado = false,
  onCerrar,
  children,
}: ModalProps) {
  useEffect(() => {
    function handleTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !bloqueado) onCerrar();
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleTecla);

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", handleTecla);
    };
  }, [bloqueado, onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={() => !bloqueado && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
        className={`bg-white rounded-3xl shadow-2xl border border-slate-100 w-full ${ANCHO[ancho]} max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-3 p-6 sm:px-8 sm:pt-8 pb-0 sm:pb-0">
          <div className="flex items-center gap-3 min-w-0">
            {Icono && (
              <div
                className={`p-2.5 rounded-xl flex-shrink-0 ${
                  tono === "peligro" ? "bg-red-50 text-red-600" : "bg-primary/10 text-primary"
                }`}
              >
                <Icono className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-extrabold text-lg text-text-dark leading-tight">{titulo}</h2>
              {subtitulo && (
                <p className="text-sm text-slate-600 font-semibold truncate">{subtitulo}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={bloqueado}
            aria-label="Cerrar"
            className="p-2 -m-1 rounded-xl text-slate-500 hover:text-text-dark hover:bg-slate-100 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 pt-5 sm:pt-5">{children}</div>
      </div>
    </div>
  );
}
