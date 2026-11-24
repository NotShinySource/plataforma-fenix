"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { esFechaValida, formatearFechaNumerica, hoyEnChile } from "@/lib/clases/calendario";
import {
  descargarArchivo,
  filasInforme,
  generarExcelInforme,
  resumirAsistenciaInforme,
  type FilaAsistenciaAlumno,
} from "@/lib/clases/informe";
import { listarSesionesDictadas } from "@/services/clases.service";
import { listarElencos } from "@/services/elencos.service";
import { listarAsistenciasEnPeriodo } from "@/services/asistencias.service";
import { listarNombresUsuarios } from "@/services/usuarios.service";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import type { Asistencia, ConId, Elenco, SesionClase } from "@/types";
import { CLASE_ERROR } from "@/components/ui/estilos";

const CLASE_CAMPO =
  "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-text-dark";

interface Datos {
  elencos: ConId<Elenco>[];
  nombresUsuarios: Record<string, string>;
}

type AsistenciaPeriodo = { periodo: string } & (
  | { ok: true; registros: ConId<Asistencia>[]; sesiones: ConId<SesionClase>[] }
  | { ok: false }
);

export default function InformeClasesPage() {
  const [hoy] = useState(() => hoyEnChile());
  const [desde, setDesde] = useState(`${hoy.slice(0, 4)}-01-01`);
  const [hasta, setHasta] = useState(hoy);
  const [elencoId, setElencoId] = useState("");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [asistenciaPeriodo, setAsistenciaPeriodo] = useState<AsistenciaPeriodo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState<string | null>(null);
  const periodo = esFechaValida(desde) && esFechaValida(hasta) && desde <= hasta ? `${desde}/${hasta}` : null;
  const asistencia = asistenciaPeriodo?.periodo === periodo ? asistenciaPeriodo : null;

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarElencos(), listarNombresUsuarios()])
      .then(([elencos, nombresUsuarios]) => {
        if (!cancelado) {
          setDatos({ elencos: elencos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")), nombresUsuarios });
        }
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo cargar el informe.");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!periodo) return;
    let cancelado = false;
    Promise.all([listarAsistenciasEnPeriodo(desde, hasta), listarSesionesDictadas(desde, hasta)])
      .then(([registros, sesiones]) => {
        if (!cancelado) setAsistenciaPeriodo({ periodo, ok: true, registros, sesiones });
      })
      .catch(() => {
        if (!cancelado) setAsistenciaPeriodo({ periodo, ok: false });
      });
    return () => { cancelado = true; };
  }, [desde, hasta, periodo]);

  const nombresElencos = useMemo(
    () => Object.fromEntries((datos?.elencos ?? []).map((elenco) => [elenco.id, elenco.nombre])),
    [datos]
  );

  const informe = useMemo(() => {
    if (!datos || !asistencia?.ok) return null;
    const sesiones = elencoId ? asistencia.sesiones.filter((sesion) => sesion.elencoId === elencoId) : asistencia.sesiones;
    const registros = elencoId ? asistencia.registros.filter((registro) => registro.elencoId === elencoId) : asistencia.registros;
    const { porSesion, porAlumno } = resumirAsistenciaInforme(sesiones, registros, nombresElencos, datos.nombresUsuarios);
    return { clases: filasInforme(sesiones, nombresElencos, datos.nombresUsuarios, porSesion), alumnos: porAlumno };
  }, [datos, asistencia, elencoId, nombresElencos]);

  const puedeExportar = informe && (informe.clases.length > 0 || informe.alumnos.length > 0);

  async function exportar() {
    if (!informe) return;
    setExportando(true);
    setErrorExportar(null);
    try {
      const nombreElenco = elencoId ? (nombresElencos[elencoId] ?? "Elenco") : null;
      const archivo = await generarExcelInforme(informe.clases, { desde, hasta, elenco: nombreElenco }, informe.alumnos);
      const sufijo = nombreElenco ? `-${nombreElenco.replace(/\s+/g, "-")}` : "";
      descargarArchivo(archivo, `informe-clases${sufijo}-${desde}-a-${hasta}.xlsx`);
    } catch {
      setErrorExportar("No se pudo generar el Excel. Intenta de nuevo.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
      <Link
        href="/admin/clases"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al calendario
      </Link>

      <div className="flex items-center gap-3">
        <div className="bg-primary p-3 rounded-2xl text-white shadow-md shadow-primary/20 flex-shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest">
            Para la Corporación
          </p>
          <h1 className="text-2xl font-black text-text-dark leading-tight">Informe de clases</h1>
        </div>
      </div>

      {error && <EstadoError mensaje={error} />}
      {!error && !datos && <EstadoCargando texto="Cargando clases dictadas..." />}

      {!error && datos && (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] gap-4 items-end">
            <label className="text-xs font-bold text-slate-700 space-y-1.5">
              <span>Desde</span>
              <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className={CLASE_CAMPO} />
            </label>
            <label className="text-xs font-bold text-slate-700 space-y-1.5">
              <span>Hasta</span>
              <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className={CLASE_CAMPO} />
            </label>
            <label className="text-xs font-bold text-slate-700 space-y-1.5">
              <span>Elenco</span>
              <select value={elencoId} onChange={(e) => setElencoId(e.target.value)} className={CLASE_CAMPO}>
                <option value="">Todos los elencos</option>
                {datos.elencos.map((elenco) => (
                  <option key={elenco.id} value={elenco.id}>
                    {elenco.nombre}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={exportar}
              disabled={!puedeExportar || exportando}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> {exportando ? "Generando..." : "Descargar Excel"}
            </button>
          </div>

          {errorExportar && (
            <p role="alert" className={CLASE_ERROR}>
              {errorExportar}
            </p>
          )}

          {!periodo && <EstadoError mensaje="Selecciona un período válido." />}
          {periodo && !asistencia && <EstadoCargando texto="Cargando asistencias del período..." />}
          {asistencia?.ok === false && <EstadoError mensaje="No se pudo cargar la asistencia del período." />}
        </>
      )}

      {informe && (
        <>
          <TablaAsistenciaAlumnos filas={informe.alumnos} />
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-extrabold text-text-dark">Clases dictadas</h2>
              <span className="text-xs font-bold text-slate-600">{informe.clases.length} clases</span>
            </div>
            {informe.clases.length === 0 ? (
              <p className="text-sm font-semibold text-slate-600 px-5 py-10 text-center">
                No hay clases dictadas en este período.
              </p>
            ) : (
              <div className="overflow-x-auto scroll-fino">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-left text-xs font-bold text-white uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 whitespace-nowrap">Fecha</th>
                      <th className="px-5 py-3 whitespace-nowrap">Elenco</th>
                      <th className="px-5 py-3 whitespace-nowrap">Docente a cargo</th>
                      <th className="px-5 py-3 whitespace-nowrap text-center">Asistencia</th>
                      <th className="px-5 py-3">Qué se hizo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.clases.map((fila, indice) => (
                      <tr key={`${fila.fecha}-${indice}`} className={`align-top ${indice % 2 === 1 ? "bg-primary/[0.04]" : ""}`}>
                        <td className="px-5 py-3 font-semibold text-text-dark whitespace-nowrap tabular-nums">
                          {formatearFechaNumerica(fila.fecha)}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">{fila.elenco}</td>
                        <td className="px-5 py-3 font-medium text-slate-700 whitespace-nowrap">{fila.docente}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap text-center tabular-nums">
                          {fila.totalAlumnos > 0 ? `${fila.presentes} de ${fila.totalAlumnos}` : "—"}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700 whitespace-pre-line min-w-64">
                          {fila.queSeHizo || "—"}
                          {fila.incompleta && (
                            <span className="block mt-1 text-xs font-bold text-amber-700">
                              Incompleta: {fila.motivoIncompleta ?? "sin motivo"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function TablaAsistenciaAlumnos({ filas }: { filas: FilaAsistenciaAlumno[] }) {
  return (
    <section aria-labelledby="titulo-asistencia" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 id="titulo-asistencia" className="font-extrabold text-text-dark">Asistencia por alumno</h2>
        <p className="mt-1 text-sm text-slate-600">
          Porcentaje de presencias sobre el total registrado para cada alumno y elenco durante el período.
        </p>
      </div>
      {filas.length === 0 ? (
        <p className="text-sm font-semibold text-slate-600 px-5 py-8 text-center">
          No hay asistencias registradas con estos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto scroll-fino">
          <table aria-labelledby="titulo-asistencia" className="w-full text-sm">
            <thead className="bg-primary text-xs font-bold text-white uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3 text-left">Elenco</th>
                <th scope="col" className="px-5 py-3 text-left">Alumno</th>
                {["Presentes", "Ausencias", "Justificadas", "Total registrado", "Asistencia"].map((columna) => (
                  <th scope="col" key={columna} className="px-4 py-3 text-right whitespace-nowrap">{columna}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={JSON.stringify([fila.elencoId, fila.alumnoId])} className="even:bg-primary/[0.04]">
                  <td className="px-5 py-3 font-medium text-slate-700">{fila.elenco}</td>
                  <th scope="row" className="px-5 py-3 text-left font-semibold text-text-dark">{fila.alumno}</th>
                  <td className="px-4 py-3 text-right tabular-nums">{fila.presentes}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fila.ausencias}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fila.justificadas}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fila.total}</td>
                  <td className="px-4 py-3 text-right font-extrabold text-primary tabular-nums">{fila.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
