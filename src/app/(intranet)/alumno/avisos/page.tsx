"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import { listarAvisosPorElenco, obtenerLecturaAviso } from "@/services/avisos.service";
import { AvisoCard } from "@/components/intranet/alumno/AvisoCard";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Aviso, ConId, Elenco } from "@/types";

interface AvisoConLectura {
  aviso: ConId<Aviso>;
  elenco: ConId<Elenco>;
  leido: boolean;
}

export default function AlumnoAvisosPage() {
  const { usuario } = useAuth();
  const { elencos, cargando: cargandoElencos, error: errorElencos } = useElencos();
  const [avisos, setAvisos] = useState<AvisoConLectura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario || cargandoElencos || errorElencos || elencos.length === 0) return;

    let cancelado = false;
    const uid = usuario.uid;

    Promise.all(
      elencos.map(async (elenco) => {
        const avisosDelElenco = await listarAvisosPorElenco(elenco.id);
        return Promise.all(
          avisosDelElenco.map(async (aviso) => {
            const lectura = await obtenerLecturaAviso(aviso.id, uid);
            return { aviso, elenco, leido: lectura?.leido ?? false };
          })
        );
      })
    )
      .then((porElenco) => {
        if (cancelado) return;
        const combinados = porElenco.flat().sort((a, b) => {
          if (a.aviso.urgente !== b.aviso.urgente) return a.aviso.urgente ? -1 : 1;
          return b.aviso.fechaPublicacion.getTime() - a.aviso.fechaPublicacion.getTime();
        });
        setAvisos(combinados);
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar los avisos.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [usuario, elencos, cargandoElencos, errorElencos]);

  const mensajeError = error ?? errorElencos;
  const estaCargando = cargandoElencos || (elencos.length > 0 && cargando);
  const avisosMostrados = elencos.length === 0 ? [] : avisos;

  return (
    <>
      <div>
        <h2 className="text-2xl font-black text-text-dark">Mural de Avisos</h2>
        <p className="text-slate-600 text-sm font-medium mt-1">
          Comunicados de tus docentes, más recientes y urgentes primero.
        </p>
      </div>

      {estaCargando && <EstadoCargando texto="Cargando avisos..." />}
      {!estaCargando && mensajeError && <EstadoError mensaje={mensajeError} />}
      {!estaCargando && !mensajeError && avisosMostrados.length === 0 && (
        <EstadoVacio
          icono={Megaphone}
          titulo="Sin avisos por ahora"
          descripcion="Cuando tus docentes publiquen novedades, aparecerán aquí."
        />
      )}
      {!estaCargando && !mensajeError && avisosMostrados.length > 0 && usuario && (
        <div className="space-y-4">
          {avisosMostrados.map(({ aviso, elenco, leido }) => (
            <AvisoCard
              key={aviso.id}
              aviso={aviso}
              nombreElenco={elenco.nombre}
              alumnoId={usuario.uid}
              leidoInicial={leido}
            />
          ))}
        </div>
      )}
    </>
  );
}
