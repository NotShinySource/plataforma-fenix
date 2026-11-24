import type { ReactNode } from "react";
import Image from "next/image";
import { fuenteLanding } from "@/components/landing/fuente";

interface PantallaEstadoProps {
  /** Texto grande de fondo, por ejemplo "404". */
  codigo: string;
  titulo: string;
  descripcion: string;
  /** Botones o enlaces de salida. */
  acciones: ReactNode;
  /** Dato pequeño para soporte, por ejemplo el identificador de un error. */
  detalle?: string;
}

/**
 * Pantalla completa para páginas de error y de "no encontrado", con la
 * identidad visual de la escuela en vez de la página genérica del framework.
 */
export function PantallaEstado({ codigo, titulo, descripcion, acciones, detalle }: PantallaEstadoProps) {
  return (
    <main
      className={`${fuenteLanding.className} relative min-h-screen flex-1 flex items-center justify-center overflow-hidden bg-slate-50 px-4 py-16`}
    >
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-terracotta/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative w-full max-w-xl text-center">
        <Image
          src="/imagenes/inicio/CALAMABANDA.png"
          alt="Escuela de Música Calambanda"
          width={1179}
          height={435}
          priority
          className="mx-auto w-48 sm:w-56 h-auto"
        />

        <p
          aria-hidden="true"
          className="mt-8 text-[7rem] sm:text-[9rem] font-extrabold leading-none tracking-tighter text-primary/15 select-none"
        >
          {codigo}
        </p>

        <div className="-mt-5 sm:-mt-7 bg-white/80 backdrop-blur rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-dark">{titulo}</h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">{descripcion}</p>
          <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">{acciones}</div>
          {detalle && <p className="pt-2 text-xs text-slate-500 font-semibold">{detalle}</p>}
        </div>
      </div>
    </main>
  );
}

export const CLASE_ACCION_PRIMARIA =
  "inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition-all";

export const CLASE_ACCION_SECUNDARIA =
  "inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm border border-slate-200 transition-all";
