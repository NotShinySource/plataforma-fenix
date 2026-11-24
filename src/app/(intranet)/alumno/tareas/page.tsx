"use client";

import { useMemo, useState } from "react";
import { Bell, CircleCheck, ListChecks, Music } from "lucide-react";
import { useTareasAlumno } from "@/context/TareasAlumnoContext";
import { marcarTareasVistas } from "@/services/tareas.service";
import { ListaTareas } from "@/components/intranet/alumno/ListaTareas";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";

export default function AlumnoTareasPage() {
  const { alumnoId, elencos, tareas, nuevas, cargando, error, errorVistas } = useTareasAlumno();
  const [guardandoVistas, setGuardandoVistas] = useState(false);
  const [errorGuardarVistas, setErrorGuardarVistas] = useState<string | null>(null);

  const nombresElencos = useMemo(
    () => Object.fromEntries(elencos.map((elenco) => [elenco.id, elenco.nombre])),
    [elencos]
  );
  const nuevasIds = useMemo(() => new Set(nuevas.map(({ id }) => id)), [nuevas]);

  const total = tareas.length;
  const hechas = tareas.filter((tarea) => tarea.completadoPor.includes(alumnoId)).length;
  const pendientes = total - hechas;
  const porcentaje = total > 0 ? Math.round((hechas / total) * 100) : 0;

  async function confirmarTareasVistas() {
    const ids = nuevas.map(({ id }) => id);
    if (!alumnoId || ids.length === 0 || guardandoVistas) return;
    setGuardandoVistas(true);
    setErrorGuardarVistas(null);
    try {
      await marcarTareasVistas(alumnoId, ids);
    } catch {
      setErrorGuardarVistas("No se pudieron marcar todas las tareas como vistas. Intenta de nuevo.");
    } finally {
      setGuardandoVistas(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-8 items-start">
      <aside className="bg-primary text-white rounded-3xl p-6 space-y-6 shadow-lg shadow-primary/20 lg:sticky lg:top-28">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 p-2.5 rounded-xl flex-shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-100">Plataforma Fénix</p>
            <h2 className="font-extrabold text-lg leading-tight">Mis Tareas</h2>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 space-y-3">
          <p className="text-4xl font-black leading-none tabular-nums">{porcentaje}%</p>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-blue-100">Progreso general</span>
            <span className="tabular-nums">
              {hechas} de {total}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Progreso general de tareas"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 bg-white/20 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-[width] duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
              <ListChecks className="w-4 h-4" /> Pendientes
            </p>
            <p className="text-2xl font-black mt-2 tabular-nums">{pendientes}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
              <CircleCheck className="w-4 h-4" /> Hechas
            </p>
            <p className="text-2xl font-black mt-2 tabular-nums">{hechas}</p>
          </div>
        </div>
      </aside>

      <section className="space-y-6 min-w-0">
        <div>
          <h2 className="text-2xl font-black text-text-dark">Tareas por hacer</h2>
          <p className="text-slate-600 text-sm font-medium mt-1">
            Actividades asignadas por tus profesores y elencos
          </p>
        </div>

        {cargando && <EstadoCargando texto="Cargando tus tareas..." />}
        {!cargando && error && <EstadoError mensaje={error} />}
        {!cargando && !error && (
          <>
            {errorVistas && <EstadoError mensaje="No se pudieron cargar los avisos de tareas nuevas." />}
            {errorGuardarVistas && <EstadoError mensaje={errorGuardarVistas} />}
            {nuevas.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  {nuevas.length === 1 ? "Tienes 1 tarea nueva" : `Tienes ${nuevas.length} tareas nuevas`}
                </p>
                <button
                  type="button"
                  onClick={confirmarTareasVistas}
                  disabled={guardandoVistas}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-primary ring-1 ring-primary/20 transition-colors hover:bg-primary/10 disabled:opacity-60"
                >
                  {guardandoVistas ? "Guardando..." : "Marcar como vistas"}
                </button>
              </div>
            )}
            <ListaTareas tareas={tareas} alumnoId={alumnoId} nombresElencos={nombresElencos} nuevasIds={nuevasIds} />
          </>
        )}
      </section>
    </div>
  );
}
