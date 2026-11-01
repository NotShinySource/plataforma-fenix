"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { formatearFechaNumerica, hoyEnChile } from "@/lib/clases/calendario";
import { descargarArchivo, filasInforme, generarCsvInforme } from "@/lib/clases/informe";
import { listarSesionesDictadas } from "@/services/clases.service";
import { listarElencos } from "@/services/elencos.service";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import type { ConId, Elenco, SesionClase } from "@/types";

const CLASE_CAMPO =
  "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-text-dark";

export default function InformeClasesPage() {
  const [hoy] = useState(() => hoyEnChile());
  const [desde, setDesde] = useState(`${hoy.slice(0, 4)}-01-01`);
  const [hasta, setHasta] = useState(hoy);
  const [elencoId, setElencoId] = useState("");
  const [datos, setDatos] = useState<{ elencos: ConId<Elenco>[]; sesiones: ConId<SesionClase>[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarElencos(), listarSesionesDictadas()])
      .then(([elencos, sesiones]) => {
        if (!cancelado) {
          setDatos({ elencos: elencos.sort((a, b) => a.nombre.localeCompare(b.nombre)), sesiones });
        }
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo cargar el informe.");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const nombresElencos = useMemo(
    () => Object.fromEntries((datos?.elencos ?? []).map((elenco) => [elenco.id, elenco.nombre])),
    [datos]
  );

  const filas = useMemo(() => {
    if (!datos) return [];
    const filtradas = datos.sesiones.filter(
      (sesion) =>
        sesion.fecha >= desde && sesion.fecha <= hasta && (!elencoId || sesion.elencoId === elencoId)
    );
    return filasInforme(filtradas, nombresElencos);
  }, [datos, desde, hasta, elencoId, nombresElencos]);

  function exportar() {
    const sufijoElenco = elencoId ? `-${(nombresElencos[elencoId] ?? "elenco").replace(/\s+/g, "-")}` : "";
    descargarArchivo(
      generarCsvInforme(filas),
      `informe-clases${sufijoElenco}-${desde}-a-${hasta}.csv`,
      "text/csv;charset=utf-8"
    );
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
              disabled={filas.length === 0}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> Descargar Excel
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-extrabold text-text-dark">Clases dictadas</h2>
              <span className="text-xs font-bold text-slate-600">{filas.length} clases</span>
            </div>
            {filas.length === 0 ? (
              <p className="text-sm font-semibold text-slate-600 px-5 py-10 text-center">
                No hay clases dictadas en este período.
              </p>
            ) : (
              <div className="overflow-x-auto scroll-fino">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 whitespace-nowrap">Fecha</th>
                      <th className="px-5 py-3 whitespace-nowrap">Elenco</th>
                      <th className="px-5 py-3">Qué se hizo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filas.map((fila, indice) => (
                      <tr key={`${fila.fecha}-${indice}`} className="align-top">
                        <td className="px-5 py-3 font-semibold text-text-dark whitespace-nowrap tabular-nums">
                          {formatearFechaNumerica(fila.fecha)}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">{fila.elenco}</td>
                        <td className="px-5 py-3 font-medium text-slate-700 whitespace-pre-line min-w-64">
                          {fila.queSeHizo || "—"}
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
