"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import { useTareas } from "@/hooks/useTareas";
import { tareasNuevasParaAlumno } from "@/lib/tareas";
import { suscribirTareasVistas } from "@/services/tareas.service";
import type { ConId, Elenco, Tarea } from "@/types";

interface DatosTareasAlumno {
  alumnoId: string;
  elencos: ConId<Elenco>[];
  tareas: ConId<Tarea>[];
  nuevas: ConId<Tarea>[];
  cargando: boolean;
  error: string | null;
  errorVistas: boolean;
}

type VistasAlumno = { alumnoId: string; ids: ReadonlySet<string> | null };

const TareasAlumnoContext = createContext<DatosTareasAlumno | null>(null);

export function TareasAlumnoProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const alumnoId = usuario?.uid ?? "";
  const { elencos, cargando: cargandoElencos, error: errorElencos } = useElencos();
  const elencoIds = alumnoId && !cargandoElencos && !errorElencos ? elencos.map(({ id }) => id) : null;
  const { tareas, cargando: cargandoTareas, error: errorTareas } = useTareas(elencoIds, alumnoId);
  const [vistas, setVistas] = useState<VistasAlumno | null>(null);

  useEffect(() => {
    if (!alumnoId) return;
    return suscribirTareasVistas(
      alumnoId,
      (ids) => setVistas({ alumnoId, ids }),
      () => setVistas({ alumnoId, ids: null }),
    );
  }, [alumnoId]);

  const vistasActuales = vistas?.alumnoId === alumnoId ? vistas : null;
  const nuevas = vistasActuales?.ids ? tareasNuevasParaAlumno(tareas, alumnoId, vistasActuales.ids) : [];
  const datos = {
    alumnoId,
    elencos,
    tareas,
    nuevas,
    cargando: !errorElencos && (cargandoElencos || cargandoTareas),
    error: errorElencos ?? errorTareas,
    errorVistas: vistasActuales?.ids === null,
  };

  return <TareasAlumnoContext.Provider value={datos}>{children}</TareasAlumnoContext.Provider>;
}

export function useTareasAlumno(): DatosTareasAlumno {
  const datos = useContext(TareasAlumnoContext);
  if (!datos) throw new Error("useTareasAlumno debe usarse dentro de TareasAlumnoProvider.");
  return datos;
}
