"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Circle } from "lucide-react";
import { formatearFechaLarga } from "@/lib/format";
import { marcarAvisoComoLeido } from "@/services/avisos.service";
import type { Aviso, ConId } from "@/types";

interface AvisoCardProps {
  aviso: ConId<Aviso>;
  nombreElenco: string;
  alumnoId: string;
  leidoInicial: boolean;
}

export function AvisoCard({ aviso, nombreElenco, alumnoId, leidoInicial }: AvisoCardProps) {
  const [abierto, setAbierto] = useState(false);
  const [leido, setLeido] = useState(leidoInicial);
  const [marcando, setMarcando] = useState(false);

  async function alAbrir() {
    const nuevoEstado = !abierto;
    setAbierto(nuevoEstado);

    if (nuevoEstado && !leido && !marcando) {
      setMarcando(true);
      try {
        await marcarAvisoComoLeido(aviso.id, alumnoId);
        setLeido(true);
      } finally {
        setMarcando(false);
      }
    }
  }

  return (
    <div
      className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
        aviso.urgente ? "border-terracotta/30" : "border-slate-100"
      }`}
    >
      <button
        type="button"
        onClick={alAbrir}
        className="w-full p-6 flex items-start justify-between gap-4 text-left hover:bg-slate-50/40 transition-colors"
      >
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={`p-3 rounded-2xl flex-shrink-0 ${
              aviso.urgente ? "bg-terracotta/10 text-terracotta" : "bg-primary/10 text-primary"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {aviso.urgente && (
                <span className="bg-terracotta text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Urgente
                </span>
              )}
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {nombreElenco}
              </span>
            </div>
            <h4 className="font-extrabold text-text-dark leading-snug">{aviso.titulo}</h4>
            <p className="text-xs text-slate-600 font-semibold">
              {formatearFechaLarga(aviso.fechaPublicacion)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {leido ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Leído
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
              <Circle className="w-3.5 h-3.5 fill-current" /> Nuevo
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${abierto ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {abierto && (
        <div className="px-6 pb-6 pt-4 border-t border-slate-50">
          <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
            {aviso.contenido}
          </p>
        </div>
      )}
    </div>
  );
}
