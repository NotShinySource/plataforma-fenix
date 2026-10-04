"use client";

import { CalendarDays, Check, Download, FileText } from "lucide-react";
import { formatearFechaCorta } from "@/lib/format";
import { ReproductorAudio } from "@/components/intranet/shared/ReproductorAudio";
import type { ConId, Tarea } from "@/types";

interface TareaItemProps {
  tarea: ConId<Tarea>;
  completada: boolean;
  /** Vence hoy o ya venció: la fecha se destaca en rojo mientras siga pendiente. */
  urgente: boolean;
  nombreElenco?: string;
  nombreProfesor?: string;
  guardando: boolean;
  onAlternar: (tarea: ConId<Tarea>, completada: boolean) => void;
}

export function TareaItem({
  tarea,
  completada,
  urgente,
  nombreElenco,
  nombreProfesor,
  guardando,
  onAlternar,
}: TareaItemProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex items-start gap-3 transition-opacity ${
        completada ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={completada}
        aria-label={
          completada
            ? `Marcar "${tarea.titulo}" como pendiente`
            : `Marcar "${tarea.titulo}" como hecha`
        }
        disabled={guardando}
        onClick={() => onAlternar(tarea, !completada)}
        className={`w-6 h-6 mt-0.5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          completada
            ? "bg-primary border-primary text-white"
            : "bg-white border-slate-300 hover:border-primary text-transparent"
        }`}
      >
        <Check className="w-4 h-4" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1 space-y-2">
        <p
          className={`font-bold text-sm leading-snug ${
            completada ? "line-through text-slate-600" : "text-text-dark"
          }`}
        >
          {tarea.titulo}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {nombreProfesor && (
            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
              Prof. {nombreProfesor}
            </span>
          )}
          {nombreElenco && (
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {nombreElenco}
            </span>
          )}
          {tarea.fechaLimite && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold ${
                urgente ? "text-red-600" : "text-slate-600"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {formatearFechaCorta(tarea.fechaLimite)}
            </span>
          )}
        </div>

        {!completada && tarea.urlAdjunto && tarea.tipoAdjunto === "Audio" && (
          <ReproductorAudio url={tarea.urlAdjunto} nombre={tarea.nombreAdjunto ?? "Audio"} />
        )}

        {!completada && tarea.urlAdjunto && tarea.tipoAdjunto === "PDF" && (
          <a
            href={tarea.urlAdjunto}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-slate-50 hover:bg-primary/5 border border-slate-100 rounded-2xl p-3 transition-colors group"
          >
            <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-text-dark truncate">
                {tarea.nombreAdjunto ?? "Documento PDF"}
              </span>
              <span className="block text-xs font-semibold text-slate-600">Toca para abrir</span>
            </span>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-primary flex-shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}
