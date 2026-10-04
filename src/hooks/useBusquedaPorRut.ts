"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { limpiarRut, rutEsValido } from "@/lib/auth/rut";
import { buscarUsuarioPorRutAction } from "@/app/(intranet)/admin/usuarios/actions";

interface BusquedaPorRut {
  /** El término escrito es un RUT completo y válido (se busca en el servidor, no por nombre). */
  esRut: boolean;
  buscando: boolean;
  /** uid de la cuenta con ese RUT, o `null` si no existe o todavía se está buscando. */
  uid: string | null;
}

/**
 * Búsqueda de usuarios por RUT para el panel de Administración. Los listados
 * solo traen el RUT enmascarado, así que no se puede filtrar en el navegador:
 * cuando el término es un RUT completo, se le pregunta al servidor a qué
 * cuenta corresponde.
 */
export function useBusquedaPorRut(termino: string): BusquedaPorRut {
  const rut = rutEsValido(termino.trim()) ? limpiarRut(termino.trim()) : null;
  const [resultado, setResultado] = useState<{ rut: string; uid: string | null } | null>(null);

  useEffect(() => {
    if (!rut) return;
    let cancelado = false;

    async function buscar(rutBuscado: string) {
      try {
        const idTokenAdmin = await auth.currentUser?.getIdToken();
        if (!idTokenAdmin) return;
        const respuesta = await buscarUsuarioPorRutAction({ rut: rutBuscado, idTokenAdmin });
        if (!cancelado) setResultado({ rut: rutBuscado, uid: respuesta.uid ?? null });
      } catch {
        if (!cancelado) setResultado({ rut: rutBuscado, uid: null });
      }
    }

    buscar(rut);

    return () => {
      cancelado = true;
    };
  }, [rut]);

  const vigente = rut !== null && resultado?.rut === rut;
  return {
    esRut: rut !== null,
    buscando: rut !== null && !vigente,
    uid: vigente ? resultado.uid : null,
  };
}
