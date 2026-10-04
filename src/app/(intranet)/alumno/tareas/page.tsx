"use client";

import { useMemo } from "react";
import { CircleCheck, ListChecks, Music } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import { useTareas } from "@/hooks/useTareas";
import { ListaTareas } from "@/components/intranet/alumno/ListaTareas";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";

export default function AlumnoTareasPage() {
  const { usuario } = useAuth();
  const { elencos, cargando: cargandoElencos, error: errorElencos } = useElencos();

  const elencoIds = useMemo(
    () => (cargandoElencos || errorElencos ? null : elencos.map((elenco) => elenco.id)),
    [elencos, cargandoElencos, errorElencos]
  );
  const { tareas, cargando: cargandoTareas, error: errorTareas } = useTareas(elencoIds);

  const nombresElencos = useMemo(
    () => Object.fromEntries(elencos.map((elenco) => [elenco.id, elenco.nombre])),
    [elencos]
  );

  const alumnoId = usuario?.uid ?? "";
  const total = tareas.length;
  const hechas = tareas.filter((tarea) => tarea.completadoPor.includes(alumnoId)).length;
  const pendientes = total - hechas;
  const porcentaje = total > 0 ? Math.round((hechas / total) * 100) : 0;

  const cargando = !errorElencos && (cargandoElencos || cargandoTareas);
  const error = errorElencos ?? errorTareas;

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
          <ListaTareas tareas={tareas} alumnoId={alumnoId} nombresElencos={nombresElencos} />
        )}
      </section>
    </div>
  );
}
