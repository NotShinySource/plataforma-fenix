"use client";

import { useEffect, useState } from "react";
import { suscribirTareasDeElencos } from "@/services/tareas.service";
import type { ConId, Tarea } from "@/types";

interface UseTareasResultado {
  tareas: ConId<Tarea>[];
  cargando: boolean;
  error: string | null;
}

interface ResultadoSuscripcion {
  clave: string;
  tareas: ConId<Tarea>[];
  error: boolean;
}

const SEPARADOR = "|";

/**
 * Tareas de un conjunto de elencos, en tiempo real. `null` significa que
 * todavía no se sabe qué elencos son (siguen cargando); un arreglo vacío,
 * que no hay ninguno.
 */
export function useTareas(elencoIds: string[] | null): UseTareasResultado {
  // Clave estable: el efecto solo se reinicia si cambia el conjunto de
  // elencos, no cada vez que el componente crea un arreglo nuevo.
  const clave = elencoIds === null ? null : [...elencoIds].sort().join(SEPARADOR);
  const [resultado, setResultado] = useState<ResultadoSuscripcion | null>(null);

  useEffect(() => {
    if (!clave) return;

    return suscribirTareasDeElencos(
      clave.split(SEPARADOR),
      (tareas) => setResultado({ clave, tareas, error: false }),
      () => setResultado({ clave, tareas: [], error: true })
    );
  }, [clave]);

  if (clave === null) return { tareas: [], cargando: true, error: null };
  if (clave === "") return { tareas: [], cargando: false, error: null };

  // Un resultado de otro conjunto de elencos ya no vale: se sigue cargando.
  if (resultado?.clave !== clave) return { tareas: [], cargando: true, error: null };

  return {
    tareas: resultado.tareas,
    cargando: false,
    error: resultado.error ? "No se pudieron cargar las tareas." : null,
  };
}
