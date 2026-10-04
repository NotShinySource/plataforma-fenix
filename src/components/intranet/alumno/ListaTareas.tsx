"use client";

import { useEffect, useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { marcarTarea } from "@/services/tareas.service";
import { obtenerUsuario } from "@/services/usuarios.service";
import { TareaItem } from "@/components/intranet/alumno/TareaItem";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { ConId, Tarea } from "@/types";

interface ListaTareasProps {
  tareas: ConId<Tarea>[];
  alumnoId: string;
  /** Nombre de cada elenco por ID. Si se omite, no se muestra la etiqueta de elenco. */
  nombresElencos?: Record<string, string>;
  /** 2 reparte las tarjetas en dos columnas en pantallas anchas; 1 las apila (p. ej. dentro de un modal). */
  columnas?: 1 | 2;
}

/** Pendientes: primero las que vencen antes; las sin fecha límite van al final. */
function compararPendientes(a: ConId<Tarea>, b: ConId<Tarea>): number {
  if (a.fechaLimite && b.fechaLimite) return a.fechaLimite.getTime() - b.fechaLimite.getTime();
  if (a.fechaLimite) return -1;
  if (b.fechaLimite) return 1;
  return b.fechaCreacion.getTime() - a.fechaCreacion.getTime();
}

/**
 * Lista de tareas del alumno separada en PENDIENTES y COMPLETADAS. Marcar el
 * checkbox escribe en Firestore; como las tareas llegan por suscripción en
 * tiempo real, la tarjeta cambia de sección sola al confirmarse el cambio.
 */
export function ListaTareas({ tareas, alumnoId, nombresElencos, columnas = 2 }: ListaTareasProps) {
  const [nombresProfesores, setNombresProfesores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Fin del día en que se abrió la lista: toda fecha límite hasta ese momento
  // cuenta como "vence hoy o ya venció".
  const [finDeHoy] = useState(() => new Date().setHours(23, 59, 59, 999));

  const idsProfesores = useMemo(
    () => Array.from(new Set(tareas.map((tarea) => tarea.profesorId))).sort().join("|"),
    [tareas]
  );

  useEffect(() => {
    if (!idsProfesores) return;
    let cancelado = false;

    Promise.all(
      idsProfesores.split("|").map(async (profesorId) => {
        const profesor = await obtenerUsuario(profesorId).catch(() => null);
        return [profesorId, profesor ? `${profesor.nombres} ${profesor.apellidos}` : ""] as const;
      })
    ).then((pares) => {
      if (!cancelado) setNombresProfesores(Object.fromEntries(pares));
    });

    return () => {
      cancelado = true;
    };
  }, [idsProfesores]);

  const { pendientes, completadas } = useMemo(() => {
    const hechas = tareas.filter((tarea) => tarea.completadoPor.includes(alumnoId));
    const porHacer = tareas.filter((tarea) => !tarea.completadoPor.includes(alumnoId));
    return {
      pendientes: porHacer.sort(compararPendientes),
      completadas: hechas.sort(
        (a, b) =>
          (b.completadoEn[alumnoId]?.getTime() ?? 0) - (a.completadoEn[alumnoId]?.getTime() ?? 0)
      ),
    };
  }, [tareas, alumnoId]);

  async function handleAlternar(tarea: ConId<Tarea>, completada: boolean) {
    setGuardando(tarea.id);
    setError(null);
    try {
      await marcarTarea(tarea.id, alumnoId, completada);
    } catch {
      setError("No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(null);
    }
  }

  if (tareas.length === 0) {
    return (
      <EstadoVacio
        icono={ListChecks}
        titulo="No tienes tareas asignadas"
        descripcion="Cuando un profesor te asigne una tarea, aparecerá aquí."
      />
    );
  }

  const claseGrilla =
    columnas === 2 ? "grid grid-cols-1 xl:grid-cols-2 gap-4 items-start" : "space-y-3";

  function renderTarea(tarea: ConId<Tarea>, completada: boolean) {
    return (
      <TareaItem
        key={tarea.id}
        tarea={tarea}
        completada={completada}
        urgente={
          !completada && tarea.fechaLimite !== undefined && tarea.fechaLimite.getTime() <= finDeHoy
        }
        nombreElenco={nombresElencos?.[tarea.elencoId]}
        nombreProfesor={nombresProfesores[tarea.profesorId] || undefined}
        guardando={guardando === tarea.id}
        onAlternar={handleAlternar}
      />
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <p
          role="alert"
          className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
        >
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
          Pendientes · {pendientes.length}
        </h3>
        {pendientes.length > 0 ? (
          <div className={claseGrilla}>{pendientes.map((tarea) => renderTarea(tarea, false))}</div>
        ) : (
          <p className="text-sm font-semibold text-slate-600 bg-white border border-slate-100 rounded-2xl px-5 py-4">
            ¡Estás al día! No te queda ninguna tarea pendiente.
          </p>
        )}
      </section>

      {completadas.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Completadas · {completadas.length}
          </h3>
          <div className={claseGrilla}>{completadas.map((tarea) => renderTarea(tarea, true))}</div>
        </section>
      )}
    </div>
  );
}
