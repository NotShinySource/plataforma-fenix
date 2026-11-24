"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import { compararAvisos, destinoAviso } from "@/lib/avisos";
import {
  listarAvisosDeEscuela,
  listarAvisosPorElenco,
  obtenerLecturaAviso,
} from "@/services/avisos.service";
import { AvisoCard } from "@/components/intranet/alumno/AvisoCard";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Aviso, ConId } from "@/types";

interface AvisoConLectura {
  aviso: ConId<Aviso>;
  /** El grupo o "Toda la escuela". */
  destino: string;
  leido: boolean;
}

/** Avisos de los grupos del alumno y los de la Dirección para toda la escuela. */
export default function AlumnoAvisosPage() {
  const { usuario } = useAuth();
  const { elencos, cargando: cargandoElencos, error: errorElencos } = useElencos();
  const [avisos, setAvisos] = useState<AvisoConLectura[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario || cargandoElencos || errorElencos) return;

    let cancelado = false;
    const uid = usuario.uid;

    async function conLectura(aviso: ConId<Aviso>, destino: string): Promise<AvisoConLectura> {
      const lectura = await obtenerLecturaAviso(aviso.id, uid);
      return { aviso, destino, leido: lectura?.leido ?? false };
    }

    Promise.all([
      listarAvisosDeEscuela().then((lista) =>
        Promise.all(lista.map((aviso) => conLectura(aviso, destinoAviso(aviso))))
      ),
      ...elencos.map(async (elenco) => {
        const avisosDelElenco = await listarAvisosPorElenco(elenco.id);
        return Promise.all(avisosDelElenco.map((aviso) => conLectura(aviso, elenco.nombre)));
      }),
    ])
      .then((porOrigen) => {
        if (cancelado) return;
        setAvisos(porOrigen.flat().sort((a, b) => compararAvisos(a.aviso, b.aviso)));
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar los avisos.");
      });

    return () => {
      cancelado = true;
    };
  }, [usuario, elencos, cargandoElencos, errorElencos]);

  const mensajeError = error ?? errorElencos;
  const estaCargando = !mensajeError && (cargandoElencos || avisos === null);

  return (
    <>
      <div>
        <h2 className="text-2xl font-black text-text-dark">Mural de Avisos</h2>
        <p className="text-slate-600 text-sm font-medium mt-1">
          Comunicados de tus docentes y de la Dirección, urgentes y más recientes primero.
        </p>
      </div>

      {estaCargando && <EstadoCargando texto="Cargando avisos..." />}
      {mensajeError && <EstadoError mensaje={mensajeError} />}
      {!estaCargando && !mensajeError && avisos?.length === 0 && (
        <EstadoVacio
          icono={Megaphone}
          titulo="Sin avisos por ahora"
          descripcion="Cuando tus docentes o la Dirección publiquen novedades, aparecerán aquí."
        />
      )}
      {!estaCargando && !mensajeError && avisos && avisos.length > 0 && usuario && (
        <div className="space-y-4">
          {avisos.map(({ aviso, destino, leido }) => (
            <AvisoCard
              key={aviso.id}
              aviso={aviso}
              nombreElenco={destino}
              alumnoId={usuario.uid}
              leidoInicial={leido}
            />
          ))}
        </div>
      )}
    </>
  );
}
