"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { leerPerfilPropio } from "@/lib/perfil-propio";
import type { ConId, Usuario } from "@/types";

interface PerfilPropio {
  perfil: ConId<Usuario> | null;
  /** Mientras es `true`, hay que mostrar un skeleton y no un texto de reemplazo. */
  cargando: boolean;
}

export function usePerfilPropio(): PerfilPropio {
  const { usuario } = useAuth();
  const [resultado, setResultado] = useState<{ uid: string; perfil: ConId<Usuario> | null } | null>(
    null
  );

  useEffect(() => {
    if (!usuario) return;
    let cancelado = false;
    const uid = usuario.uid;

    leerPerfilPropio(uid).then((perfil) => {
      if (!cancelado) setResultado({ uid, perfil });
    });

    return () => {
      cancelado = true;
    };
  }, [usuario]);

  const vigente = usuario && resultado?.uid === usuario.uid ? resultado : null;
  return { perfil: vigente?.perfil ?? null, cargando: Boolean(usuario) && !vigente };
}
