"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatearFechaSesion } from "@/lib/format";
import { calcularPorcentajeAsistencia } from "@/services/asistencias.service";
import type { Asistencia, ConId, Elenco, EstadoAsistencia } from "@/types";

const ESTILO_ESTADO: Record<EstadoAsistencia, string> = {
  presente: "bg-emerald-50 text-emerald-600",
  ausente: "bg-red-50 text-red-600",
  justificado: "bg-amber-50 text-amber-600",
};

const ETIQUETA_ESTADO: Record<EstadoAsistencia, string> = {
  presente: "Presente",
  ausente: "Ausente",
  justificado: "Justificado",
};

interface AsistenciaElencoCardProps {
  elenco: ConId<Elenco>;
  asistencias: ConId<Asistencia>[];
}

export function AsistenciaElencoCard({ elenco, asistencias }: AsistenciaElencoCardProps) {
  const [expandido, setExpandido] = useState(false);
  const porcentaje = calcularPorcentajeAsistencia(asistencias);

  const conteos = asistencias.reduce(
    (acumulado, asistencia) => {
      acumulado[asistencia.estado] += 1;
      return acumulado;
    },
    { presente: 0, ausente: 0, justificado: 0 } as Record<EstadoAsistencia, number>
  );

  const colorPorcentaje =
    porcentaje >= 75 ? "text-emerald-600" : porcentaje >= 50 ? "text-amber-600" : "text-red-600";

  const sesionesOrdenadas = [...asistencias].sort((a, b) =>
    b.fechaSesion.localeCompare(a.fechaSesion)
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-terracotta text-xs font-bold uppercase tracking-widest">
            {elenco.tipoElenco}
          </span>
          <h3 className="text-xl font-extrabold text-text-dark mt-1">{elenco.nombre}</h3>
          <p className="text-xs text-slate-600 font-semibold mt-1">
            {asistencias.length} sesiones registradas
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className={`text-3xl font-black ${colorPorcentaje}`}>{porcentaje}%</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">
              Asistencia
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
              {conteos.presente} P
            </span>
            <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
              {conteos.justificado} J
            </span>
            <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
              {conteos.ausente} A
            </span>
          </div>
        </div>
      </div>

      {asistencias.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpandido(!expandido)}
            className="w-full px-6 sm:px-8 py-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50/40 transition-all"
          >
            {expandido ? "Ocultar detalle de sesiones" : "Ver detalle de sesiones"}
            <ChevronDown className={`w-4 h-4 transition-transform ${expandido ? "rotate-180" : ""}`} />
          </button>

          {expandido && (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {sesionesOrdenadas.map((asistencia) => (
                <div
                  key={asistencia.id}
                  className="px-6 sm:px-8 py-3 flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-semibold text-text-dark">
                    {formatearFechaSesion(asistencia.fechaSesion)}
                  </span>
                  <div className="flex items-center gap-3">
                    {asistencia.observaciones && (
                      <span className="text-xs text-slate-600 italic hidden sm:inline">
                        {asistencia.observaciones}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${ESTILO_ESTADO[asistencia.estado]}`}
                    >
                      {ETIQUETA_ESTADO[asistencia.estado]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
