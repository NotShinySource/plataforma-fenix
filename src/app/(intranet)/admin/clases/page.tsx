"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, FileSpreadsheet, Plus, Repeat } from "lucide-react";
import {
  construirOcurrencias,
  formatearDuracion,
  formatearFechaLegible,
  hoyEnChile,
  semanasDelMes,
  sumarMinutos,
  type Ocurrencia,
} from "@/lib/clases/calendario";
import { listarClases, listarSemestres, listarSesionesEnRango } from "@/services/clases.service";
import { listarElencos } from "@/services/elencos.service";
import { CalendarioMensual } from "@/components/intranet/admin/clases/CalendarioMensual";
import { DetalleOcurrencia } from "@/components/intranet/admin/clases/DetalleOcurrencia";
import {
  FormularioClase,
  type ModoFormularioClase,
} from "@/components/intranet/admin/clases/FormularioClase";
import { PanelSemestres } from "@/components/intranet/admin/clases/PanelSemestres";
import {
  ESTILO_ESTADO_SESION,
  ETIQUETA_ESTADO_SESION,
} from "@/components/intranet/clases/estadoSesion";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import type { Clase, ConId, Elenco, Semestre, SesionClase } from "@/types";

interface Datos {
  elencos: ConId<Elenco>[];
  semestres: Record<string, Semestre>;
  clases: ConId<Clase>[];
  sesiones: ConId<SesionClase>[];
}

export default function AdminClasesPage() {
  const [hoy] = useState(() => hoyEnChile());
  const [vista, setVista] = useState(() => ({
    anio: Number(hoy.slice(0, 4)),
    mes: Number(hoy.slice(5, 7)),
  }));
  const [seleccionada, setSeleccionada] = useState(hoy);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [formulario, setFormulario] = useState<ModoFormularioClase | null>(null);
  const [detalle, setDetalle] = useState<Ocurrencia | null>(null);

  const semanas = useMemo(() => semanasDelMes(vista.anio, vista.mes), [vista]);
  const desde = semanas[0][0];
  const hasta = semanas[semanas.length - 1][6];

  useEffect(() => {
    let cancelado = false;

    Promise.all([listarElencos(), listarSemestres(), listarClases(), listarSesionesEnRango(desde, hasta)])
      .then(([elencos, semestres, clases, sesiones]) => {
        if (cancelado) return;
        setDatos({
          elencos: elencos.sort((a, b) => a.nombre.localeCompare(b.nombre)),
          semestres,
          clases,
          sesiones,
        });
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar las clases.");
      });

    return () => {
      cancelado = true;
    };
  }, [desde, hasta, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const nombresElencos = useMemo(
    () => Object.fromEntries((datos?.elencos ?? []).map((elenco) => [elenco.id, elenco.nombre])),
    [datos]
  );

  const ocurrencias = useMemo(
    () =>
      datos ? construirOcurrencias(datos.clases, datos.sesiones, datos.semestres, desde, hasta) : [],
    [datos, desde, hasta]
  );

  const delDia = ocurrencias.filter((ocurrencia) => ocurrencia.fecha === seleccionada);

  function seleccionarDia(fecha: string) {
    setSeleccionada(fecha);
    const anio = Number(fecha.slice(0, 4));
    const mes = Number(fecha.slice(5, 7));
    if (anio !== vista.anio || mes !== vista.mes) setVista({ anio, mes });
  }

  const cerrarFormulario = useCallback(() => setFormulario(null), []);
  const cerrarDetalle = useCallback(() => setDetalle(null), []);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-3 rounded-2xl text-white shadow-md shadow-primary/20 flex-shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Horarios</p>
            <h1 className="text-2xl font-black text-text-dark leading-tight">Clases</h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/admin/clases/informe"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary font-bold text-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Informe de clases
          </Link>
          <button
            type="button"
            onClick={() => setFormulario({ modo: "crear", fecha: seleccionada })}
            disabled={!datos}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Nueva clase
          </button>
        </div>
      </div>

      {error && <EstadoError mensaje={error} />}
      {!error && !datos && <EstadoCargando texto="Cargando calendario..." />}

      {!error && datos && (
        <>
          <PanelSemestres
            key={`${vista.anio}-${JSON.stringify(datos.semestres)}`}
            anio={vista.anio}
            semestres={datos.semestres}
            onGuardado={recargar}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            <CalendarioMensual
              anio={vista.anio}
              mes={vista.mes}
              hoy={hoy}
              seleccionada={seleccionada}
              ocurrencias={ocurrencias}
              nombresElencos={nombresElencos}
              onSeleccionar={seleccionarDia}
              onCambiarMes={(anio, mes) => setVista({ anio, mes })}
            />

            <aside className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-28">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Agenda</p>
                  <h2 className="font-extrabold text-text-dark first-letter:uppercase">
                    {formatearFechaLegible(seleccionada)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFormulario({ modo: "crear", fecha: seleccionada })}
                  aria-label="Agregar clase en este día"
                  className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {delDia.length === 0 ? (
                <p className="text-sm font-semibold text-slate-600 bg-slate-50 rounded-2xl px-4 py-6 text-center">
                  No hay clases este día.
                </p>
              ) : (
                <ul className="space-y-2">
                  {delDia.map((ocurrencia) => (
                    <li key={ocurrencia.sesionId}>
                      <button
                        type="button"
                        onClick={() => setDetalle(ocurrencia)}
                        className="w-full text-left rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 p-3.5 transition-all"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-text-dark truncate">
                            {nombresElencos[ocurrencia.elencoId] ?? "Elenco"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex-shrink-0 ${
                              ESTILO_ESTADO_SESION[ocurrencia.estado]
                            }`}
                          >
                            {ETIQUETA_ESTADO_SESION[ocurrencia.estado]}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-600">
                          {ocurrencia.horaInicio} – {sumarMinutos(ocurrencia.horaInicio, ocurrencia.duracionMinutos)}
                          <span>·</span>
                          {formatearDuracion(ocurrencia.duracionMinutos)}
                          {ocurrencia.clase?.repeticion.tipo === "semanal" && (
                            <Repeat className="w-3.5 h-3.5" aria-label="Se repite cada semana" />
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        </>
      )}

      {formulario && datos && (
        <FormularioClase
          key={JSON.stringify(formulario.modo === "crear" ? formulario : formulario.ocurrencia.sesionId + formulario.modo)}
          config={formulario}
          elencos={datos.elencos}
          semestres={datos.semestres}
          onCerrar={cerrarFormulario}
          onGuardado={() => {
            setFormulario(null);
            recargar();
          }}
        />
      )}

      {detalle && !formulario && (
        <DetalleOcurrencia
          ocurrencia={detalle}
          nombreElenco={nombresElencos[detalle.elencoId] ?? "Elenco"}
          onCerrar={cerrarDetalle}
          onEditar={(config) => {
            setDetalle(null);
            setFormulario(config);
          }}
          onCambio={() => {
            setDetalle(null);
            recargar();
          }}
        />
      )}
    </>
  );
}
