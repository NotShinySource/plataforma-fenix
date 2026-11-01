"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { NOMBRES_MES, semanasDelMes, type Ocurrencia } from "@/lib/clases/calendario";
import { ESTILO_ESTADO_SESION } from "@/components/intranet/clases/estadoSesion";

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface CalendarioMensualProps {
  anio: number;
  mes: number;
  hoy: string;
  seleccionada: string;
  ocurrencias: Ocurrencia[];
  nombresElencos: Record<string, string>;
  onSeleccionar: (fecha: string) => void;
  onCambiarMes: (anio: number, mes: number) => void;
}

/** Calendario de mes, lunes a domingo. Al tocar un día se muestra su agenda al lado. */
export function CalendarioMensual({
  anio,
  mes,
  hoy,
  seleccionada,
  ocurrencias,
  nombresElencos,
  onSeleccionar,
  onCambiarMes,
}: CalendarioMensualProps) {
  const semanas = semanasDelMes(anio, mes);

  const porDia = new Map<string, Ocurrencia[]>();
  ocurrencias.forEach((ocurrencia) => {
    const lista = porDia.get(ocurrencia.fecha) ?? [];
    lista.push(ocurrencia);
    porDia.set(ocurrencia.fecha, lista);
  });

  function moverMes(delta: number) {
    const indice = anio * 12 + (mes - 1) + delta;
    onCambiarMes(Math.floor(indice / 12), (indice % 12) + 1);
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-extrabold text-text-dark">
          {NOMBRES_MES[mes - 1]} <span className="text-slate-500 font-bold">{anio}</span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSeleccionar(hoy)}
            className="px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => moverMes(-1)}
            aria-label="Mes anterior"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => moverMes(1)}
            aria-label="Mes siguiente"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {DIAS_CORTOS.map((dia) => (
          <div
            key={dia}
            className="py-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider"
          >
            {dia}
          </div>
        ))}
      </div>

      <div role="grid" aria-label={`${NOMBRES_MES[mes - 1]} ${anio}`}>
        {semanas.map((semana) => (
          <div key={semana[0]} role="row" className="grid grid-cols-7">
            {semana.map((fecha) => {
              const delMes = Number(fecha.slice(5, 7)) === mes;
              const clasesDelDia = porDia.get(fecha) ?? [];
              const activa = fecha === seleccionada;
              const esHoy = fecha === hoy;

              return (
                <button
                  key={fecha}
                  type="button"
                  role="gridcell"
                  aria-selected={activa}
                  aria-label={`${Number(fecha.slice(8))} — ${clasesDelDia.length} clases`}
                  onClick={() => onSeleccionar(fecha)}
                  className={`min-h-16 sm:min-h-24 p-1.5 sm:p-2 border-b border-r last:border-r-0 border-slate-100 text-left flex flex-col gap-1 transition-colors ${
                    activa ? "bg-primary/5" : "hover:bg-slate-50"
                  } ${delMes ? "" : "bg-slate-50/60"}`}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                      esHoy
                        ? "bg-primary text-white"
                        : activa
                          ? "text-primary"
                          : delMes
                            ? "text-text-dark"
                            : "text-slate-400"
                    }`}
                  >
                    {Number(fecha.slice(8))}
                  </span>

                  {/* En pantallas chicas solo puntos; desde sm, la hora y el elenco. */}
                  <span className="flex flex-wrap gap-1 sm:hidden">
                    {clasesDelDia.slice(0, 4).map((ocurrencia) => (
                      <span
                        key={ocurrencia.sesionId}
                        className={`w-1.5 h-1.5 rounded-full ${
                          ocurrencia.estado === "cancelada" ? "bg-slate-300" : "bg-primary"
                        }`}
                      />
                    ))}
                  </span>
                  <span className="hidden sm:flex flex-col gap-1 min-w-0">
                    {clasesDelDia.slice(0, 2).map((ocurrencia) => (
                      <span
                        key={ocurrencia.sesionId}
                        className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                          ESTILO_ESTADO_SESION[ocurrencia.estado]
                        }`}
                      >
                        {ocurrencia.horaInicio} {nombresElencos[ocurrencia.elencoId] ?? "Elenco"}
                      </span>
                    ))}
                    {clasesDelDia.length > 2 && (
                      <span className="text-[11px] font-bold text-slate-500 px-1">
                        +{clasesDelDia.length - 2} más
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
