"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import { listarAsistenciasPorAlumno } from "@/services/asistencias.service";
import { AsistenciaElencoCard } from "@/components/intranet/alumno/AsistenciaElencoCard";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Asistencia, ConId, Elenco } from "@/types";

interface AsistenciaPorElenco {
  elenco: ConId<Elenco>;
  asistencias: ConId<Asistencia>[];
}

export default function AlumnoAsistenciaPage() {
  const { usuario } = useAuth();
  const { elencos, cargando: cargandoElencos, error: errorElencos } = useElencos();
  const [datos, setDatos] = useState<AsistenciaPorElenco[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario || cargandoElencos || errorElencos || elencos.length === 0) return;

    let cancelado = false;
    const uid = usuario.uid;

    Promise.all(
      elencos.map(async (elenco) => ({
        elenco,
        asistencias: await listarAsistenciasPorAlumno(elenco.id, uid),
      }))
    )
      .then((resultado) => {
        if (cancelado) return;
        setDatos(resultado);
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo cargar tu asistencia.");
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
  const datosMostrados = elencos.length === 0 ? [] : datos;

  return (
    <>
      <div>
        <h2 className="text-2xl font-black text-text-dark">Mi Asistencia</h2>
        <p className="text-slate-600 text-sm font-medium mt-1">
          Porcentaje histórico acumulado por cada elenco en el que participas.
        </p>
      </div>

      {estaCargando && <EstadoCargando texto="Calculando tu asistencia..." />}
      {!estaCargando && mensajeError && <EstadoError mensaje={mensajeError} />}
      {!estaCargando && !mensajeError && datosMostrados.length === 0 && (
        <EstadoVacio
          icono={ClipboardCheck}
          titulo="Sin registros aún"
          descripcion="Cuando tus docentes tomen asistencia, tu historial aparecerá aquí."
        />
      )}
      {!estaCargando && !mensajeError && datosMostrados.length > 0 && (
        <div className="space-y-6">
          {datosMostrados.map(({ elenco, asistencias }) => (
            <AsistenciaElencoCard key={elenco.id} elenco={elenco} asistencias={asistencias} />
          ))}
        </div>
      )}
    </>
  );
}
