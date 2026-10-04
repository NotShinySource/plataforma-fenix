"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleCheck, ListChecks, Music, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import { useTareas } from "@/hooks/useTareas";
import { listarMiembrosDeElenco } from "@/services/elencos.service";
import { eliminarTarea } from "@/services/tareas.service";
import { PanelTarea } from "@/components/intranet/profesor/PanelTarea";
import { TareaCard } from "@/components/intranet/profesor/TareaCard";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Modal } from "@/components/ui/Modal";
import type { ConId, Tarea } from "@/types";

type EstadoPanel = { modo: "crear" } | { modo: "editar"; tarea: ConId<Tarea> } | null;

/** Lunes a las 00:00 de la semana en curso, en hora local. */
function inicioDeSemana(ahora: Date): Date {
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const diasDesdeLunes = (inicio.getDay() + 6) % 7;
  inicio.setDate(inicio.getDate() - diasDesdeLunes);
  return inicio;
}

export default function ProfesorTareasPage() {
  const { usuario } = useAuth();
  const { elencos, cargando: cargandoElencos, error: errorElencos } = useElencos();

  const elencoIds = useMemo(
    () => (cargandoElencos || errorElencos ? null : elencos.map((elenco) => elenco.id)),
    [elencos, cargandoElencos, errorElencos]
  );
  const { tareas, cargando: cargandoTareas, error: errorTareas } = useTareas(elencoIds);

  const [alumnosPorElenco, setAlumnosPorElenco] = useState<Record<string, string[]>>({});
  const [panel, setPanel] = useState<EstadoPanel>(null);
  const [tareaAEliminar, setTareaAEliminar] = useState<ConId<Tarea> | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  // Momento en que se abrió la página: referencia fija para "activa" y "esta semana".
  const [ahora] = useState(() => new Date());

  const claveElencos = elencoIds?.join("|") ?? "";

  // Alumnos activos de cada elenco: el denominador de la barra de avance.
  useEffect(() => {
    if (!claveElencos) return;
    let cancelado = false;

    Promise.all(
      claveElencos.split("|").map(async (elencoId) => {
        const alumnos = await listarMiembrosDeElenco(elencoId, "alumno");
        return [elencoId, alumnos.map((alumno) => alumno.usuarioId)] as const;
      })
    )
      .then((pares) => {
        if (!cancelado) setAlumnosPorElenco(Object.fromEntries(pares));
      })
      .catch(() => {
        // Sin la lista de alumnos las tarjetas siguen siendo útiles; solo el
        // avance queda en "Calculando avance...".
      });

    return () => {
      cancelado = true;
    };
  }, [claveElencos]);

  const nombresElencos = useMemo(
    () => Object.fromEntries(elencos.map((elenco) => [elenco.id, elenco.nombre])),
    [elencos]
  );

  const tareasOrdenadas = useMemo(
    () => [...tareas].sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime()),
    [tareas]
  );

  const { activas, completadasEstaSemana } = useMemo(() => {
    const desde = inicioDeSemana(ahora).getTime();
    return {
      // Activa: sin fecha límite, o con fecha límite que todavía no pasa.
      activas: tareas.filter(
        (tarea) => !tarea.fechaLimite || tarea.fechaLimite.getTime() >= ahora.getTime()
      ).length,
      completadasEstaSemana: tareas.reduce(
        (suma, tarea) =>
          suma +
          Object.values(tarea.completadoEn).filter((fecha) => fecha.getTime() >= desde).length,
        0
      ),
    };
  }, [tareas, ahora]);

  const cerrarPanel = useCallback(() => setPanel(null), []);

  const cerrarModalEliminar = useCallback(() => {
    setTareaAEliminar(null);
    setErrorEliminar(null);
  }, []);

  async function handleConfirmarEliminar() {
    if (!tareaAEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarTarea(tareaAEliminar);
      setTareaAEliminar(null);
    } catch {
      setErrorEliminar("No se pudo eliminar la tarea. Intenta de nuevo.");
    } finally {
      setEliminando(false);
    }
  }

  if (cargandoElencos) return <EstadoCargando texto="Cargando tus elencos..." />;
  if (errorElencos) return <EstadoError mensaje={errorElencos} />;

  if (elencos.length === 0) {
    return (
      <EstadoVacio
        icono={Music}
        titulo="Sin elencos asignados"
        descripcion="Necesitas al menos un elenco a cargo para asignar tareas."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-3 rounded-2xl text-white shadow-md shadow-primary/20 flex-shrink-0">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">
                  Módulo de tareas accionables
                </p>
                <h2 className="text-2xl font-black text-text-dark leading-tight">
                  Panel de Gestión de Tareas
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPanel({ modo: "crear" })}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Nueva Tarea Asignada
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-xl flex-shrink-0">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-text-dark leading-none tabular-nums">
                  {activas}
                </p>
                <p className="text-xs font-semibold text-slate-600 mt-1.5">Tareas activas</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-xl flex-shrink-0">
                <CircleCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-text-dark leading-none tabular-nums">
                  {completadasEstaSemana}
                </p>
                <p className="text-xs font-semibold text-slate-600 mt-1.5">
                  Completadas esta semana
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Tareas asignadas
              </h3>
              {!cargandoTareas && !errorTareas && (
                <span className="text-xs font-semibold text-slate-600">
                  {tareas.length} en seguimiento
                </span>
              )}
            </div>

            {cargandoTareas && <EstadoCargando texto="Cargando tareas..." />}
            {!cargandoTareas && errorTareas && <EstadoError mensaje={errorTareas} />}
            {!cargandoTareas && !errorTareas && tareas.length === 0 && (
              <EstadoVacio
                icono={ListChecks}
                titulo="Todavía no has asignado tareas"
                descripcion='Usa el botón "Nueva Tarea Asignada" para crear la primera.'
              />
            )}
            {!cargandoTareas && !errorTareas && tareas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tareasOrdenadas.map((tarea) => (
                  <TareaCard
                    key={tarea.id}
                    tarea={tarea}
                    nombreElenco={nombresElencos[tarea.elencoId] ?? "Elenco"}
                    alumnosDelElenco={alumnosPorElenco[tarea.elencoId] ?? null}
                    puedeGestionar={tarea.profesorId === usuario?.uid}
                    onEditar={(seleccionada) => setPanel({ modo: "editar", tarea: seleccionada })}
                    onEliminar={setTareaAEliminar}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="border border-dashed border-slate-300 rounded-3xl p-6 text-center space-y-2 bg-white/60">
          <h3 className="font-extrabold text-text-dark">Asignación de tareas</h3>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            Usa el botón &quot;Nueva Tarea Asignada&quot; para abrir el formulario y crear una
            tarea con material PDF o de audio. Tus alumnos la verán de inmediato en &quot;Mis
            Tareas&quot;.
          </p>
        </aside>
      </div>

      {panel && usuario && (
        <PanelTarea
          key={panel.modo === "editar" ? panel.tarea.id : "nueva"}
          elencos={elencos}
          profesorId={usuario.uid}
          tareaAEditar={panel.modo === "editar" ? panel.tarea : undefined}
          onCerrar={cerrarPanel}
        />
      )}

      {tareaAEliminar && (
        <Modal
          titulo="Eliminar tarea"
          subtitulo={tareaAEliminar.titulo}
          icono={Trash2}
          tono="peligro"
          ancho="sm"
          bloqueado={eliminando}
          onCerrar={cerrarModalEliminar}
        >
          <div className="space-y-5">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              La tarea desaparecerá para todos los alumnos del elenco, junto con su material
              adjunto y el registro de quiénes la completaron. Esta acción no se puede deshacer.
            </p>
            {errorEliminar && (
              <p
                role="alert"
                className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                {errorEliminar}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={cerrarModalEliminar}
                disabled={eliminando}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-all shadow-md disabled:opacity-60"
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
