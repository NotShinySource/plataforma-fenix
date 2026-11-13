"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listarElencosPorUsuario } from "@/services/elencos.service";
import type { ConId, Elenco } from "@/types";

interface UseElencosResultado {
  elencos: ConId<Elenco>[];
  cargando: boolean;
  error: string | null;
}

/**
 * Elencos del usuario autenticado (alumno o profesor), vía miembros_elenco.
 * Sin los archivados, salvo que se pidan (historial de asistencia).
 */
export function useElencos({ incluirArchivados = false } = {}): UseElencosResultado {
  const { usuario } = useAuth();
  const [elencos, setElencos] = useState<ConId<Elenco>[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;

    let cancelado = false;

    listarElencosPorUsuario(usuario.uid, incluirArchivados)
      .then((resultado) => {
        if (cancelado) return;
        setElencos(resultado);
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar tus elencos.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [usuario, incluirArchivados]);

  if (!usuario) {
    return { elencos: [], cargando: false, error: null };
  }

  return { elencos, cargando, error };
}
