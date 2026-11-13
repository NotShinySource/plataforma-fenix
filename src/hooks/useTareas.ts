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
const SEPARADOR_ALUMNO = "#";

/**
 * Tareas de un conjunto de elencos, en tiempo real. `null` significa que
 * todavía no se sabe qué elencos son (siguen cargando); un arreglo vacío,
 * que no hay ninguno.
 *
 * El alumno pasa su `alumnoId`: recibe las tareas del elenco completo y las
 * dirigidas a él, nunca las individuales de sus compañeros. El docente lo
 * omite y recibe todas las de sus elencos.
 */
export function useTareas(elencoIds: string[] | null, alumnoId?: string): UseTareasResultado {
  // Clave estable: el efecto solo se reinicia si cambia el conjunto de
  // elencos o el alumno, no cada vez que el componente crea un arreglo nuevo.
  const elencos = elencoIds === null ? null : [...elencoIds].sort().join(SEPARADOR);
  const clave = elencos === null ? null : `${alumnoId ?? ""}${SEPARADOR_ALUMNO}${elencos}`;
  const [resultado, setResultado] = useState<ResultadoSuscripcion | null>(null);

  useEffect(() => {
    if (!clave) return;
    const [alumno, listaElencos] = clave.split(SEPARADOR_ALUMNO);
    if (!listaElencos) return;

    return suscribirTareasDeElencos(
      listaElencos.split(SEPARADOR),
      (tareas) => setResultado({ clave, tareas, error: false }),
      () => setResultado({ clave, tareas: [], error: true }),
      alumno || undefined
    );
  }, [clave]);

  if (elencos === null) return { tareas: [], cargando: true, error: null };
  if (elencos === "") return { tareas: [], cargando: false, error: null };

  // Un resultado de otra consulta ya no vale: se sigue cargando.
  if (resultado?.clave !== clave) return { tareas: [], cargando: true, error: null };

  return {
    tareas: resultado.tareas,
    cargando: false,
    error: resultado.error ? "No se pudieron cargar las tareas." : null,
  };
}
