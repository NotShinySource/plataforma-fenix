"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Music, Play, Repeat } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import {
  construirOcurrencias,
  formatearDuracion,
  formatearFechaLegible,
  hoyEnChile,
  sumarDias,
  sumarMinutos,
  type Ocurrencia,
} from "@/lib/clases/calendario";
import { useElencos } from "@/hooks/useElencos";
import {
  listarClasesDeElencos,
  listarSemestres,
  listarSesionesDeElencos,
} from "@/services/clases.service";
import {
  ESTILO_ESTADO_SESION,
  ETIQUETA_ESTADO_SESION,
} from "@/components/intranet/clases/estadoSesion";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { iniciarClaseAction } from "./actions";
import { limitesDeGrupo } from "@/lib/elencos";
import type { ConId, SesionClase } from "@/types";
import { CLASE_ERROR } from "@/components/ui/estilos";

const DIAS_PROXIMOS = 7;

export default function ProfesorClasesPage() {
  const router = useRouter();
  const { elencos, cargando: cargandoElencos, error: errorElencos } = useElencos();
  const [hoy] = useState(() => hoyEnChile());
  const [ocurrencias, setOcurrencias] = useState<Ocurrencia[] | null>(null);
  const [enCurso, setEnCurso] = useState<ConId<SesionClase>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState<string | null>(null);
  const [errorInicio, setErrorInicio] = useState<string | null>(null);

  const claveElencos = elencos.map((elenco) => elenco.id).join("|");
  // Una itinerancia con fechas solo tiene clases dentro de ellas.
  const limitesPorElenco = useMemo(
    () => Object.fromEntries(elencos.map((elenco) => [elenco.id, limitesDeGrupo(elenco)])),
    [elencos]
  );

  useEffect(() => {
    if (!claveElencos) return;
    let cancelado = false;
    const ids = claveElencos.split("|");

    Promise.all([listarClasesDeElencos(ids), listarSesionesDeElencos(ids), listarSemestres()])
      .then(([clases, sesiones, semestres]) => {
        if (cancelado) return;
        setOcurrencias(
          construirOcurrencias(
            clases,
            sesiones,
            semestres,
            hoy,
            sumarDias(hoy, DIAS_PROXIMOS),
            limitesPorElenco
          )
        );
        // Una clase que quedó abierta un día anterior también se muestra, para poder cerrarla.
        setEnCurso(sesiones.filter((sesion) => sesion.estado === "en_curso"));
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar tus clases.");
      });

    return () => {
      cancelado = true;
    };
  }, [claveElencos, hoy, limitesPorElenco]);

  const nombresElencos = useMemo(
    () => Object.fromEntries(elencos.map((elenco) => [elenco.id, elenco.nombre])),
    [elencos]
  );

  async function iniciar(ocurrencia: Ocurrencia) {
    const usuario = auth.currentUser;
    if (!usuario) return;
    setIniciando(ocurrencia.sesionId);
    setErrorInicio(null);
    try {
      const resultado = await iniciarClaseAction({
        idToken: await usuario.getIdToken(),
        claseId: ocurrencia.claseId,
        fechaProgramada: ocurrencia.fechaProgramada,
      });
      if (!resultado.ok) {
        setErrorInicio(resultado.error);
        setIniciando(null);
        return;
      }
      router.push(`/profesor/clases/${resultado.sesionId}`);
    } catch {
      setErrorInicio("No se pudo iniciar la clase. Intenta de nuevo.");
      setIniciando(null);
    }
  }

  if (cargandoElencos) return <EstadoCargando texto="Cargando tus elencos..." />;
  if (errorElencos) return <EstadoError mensaje={errorElencos} />;
  if (elencos.length === 0) {
    return (
      <EstadoVacio
        icono={Music}
        titulo="Sin elencos asignados"
        descripcion="Cuando el Administrador te asigne a un elenco, verás aquí sus clases."
      />
    );
  }

  const deHoy = (ocurrencias ?? []).filter(
    (ocurrencia) => ocurrencia.fecha === hoy && ocurrencia.estado !== "en_curso"
  );
  const proximas = (ocurrencias ?? []).filter(
    (ocurrencia) => ocurrencia.fecha > hoy && ocurrencia.estado !== "cancelada"
  );

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="bg-primary p-3 rounded-2xl text-white shadow-md shadow-primary/20 flex-shrink-0">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Asistencia</p>
          <h1 className="text-2xl font-black text-text-dark leading-tight">Mis clases</h1>
        </div>
      </div>

      {error && <EstadoError mensaje={error} />}
      {!error && ocurrencias === null && <EstadoCargando texto="Cargando tus clases..." />}

      {errorInicio && (
        <p role="alert" className={CLASE_ERROR}>
          {errorInicio}
        </p>
      )}

      {!error && ocurrencias !== null && (
        <div className="space-y-8">
          {enCurso.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">En curso</h2>
              {enCurso.map((sesion) => (
                <button
                  key={sesion.id}
                  type="button"
                  onClick={() => router.push(`/profesor/clases/${sesion.id}`)}
                  className="w-full flex items-center justify-between gap-4 bg-primary text-white rounded-3xl p-5 text-left shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors"
                >
                  <span>
                    <span className="block font-extrabold">{nombresElencos[sesion.elencoId] ?? "Elenco"}</span>
                    <span className="block text-sm text-blue-100 font-semibold first-letter:uppercase">
                      {formatearFechaLegible(sesion.fecha)} · iniciada a las{" "}
                      {sesion.inicioReal?.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                  </span>
                  <span className="bg-white/15 px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0">Continuar</span>
                </button>
              ))}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Hoy</h2>
            {deHoy.length === 0 ? (
              <p className="text-sm font-semibold text-slate-600 bg-white border border-slate-100 rounded-2xl px-5 py-4">
                No tienes clases programadas para hoy.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deHoy.map((ocurrencia) => (
                  <TarjetaClase
                    key={ocurrencia.sesionId}
                    ocurrencia={ocurrencia}
                    nombreElenco={nombresElencos[ocurrencia.elencoId] ?? "Elenco"}
                    accion={
                      ocurrencia.estado === "programada" ? (
                        <button
                          type="button"
                          onClick={() => iniciar(ocurrencia)}
                          disabled={iniciando !== null}
                          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60"
                        >
                          <Play className="w-4 h-4" />
                          {iniciando === ocurrencia.sesionId ? "Iniciando..." : "Iniciar clase"}
                        </button>
                      ) : ocurrencia.estado === "realizada" || ocurrencia.estado === "incompleta" ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/profesor/clases/${ocurrencia.sesionId}`)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-primary hover:border-primary/40 font-bold text-sm transition-all"
                        >
                          Ver registro
                        </button>
                      ) : null
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Próximos {DIAS_PROXIMOS} días
            </h2>
            {proximas.length === 0 ? (
              <p className="text-sm font-semibold text-slate-600 bg-white border border-slate-100 rounded-2xl px-5 py-4">
                No hay clases programadas en los próximos días.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proximas.map((ocurrencia) => (
                  <TarjetaClase
                    key={ocurrencia.sesionId}
                    ocurrencia={ocurrencia}
                    nombreElenco={nombresElencos[ocurrencia.elencoId] ?? "Elenco"}
                    mostrarFecha
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function TarjetaClase({
  ocurrencia,
  nombreElenco,
  mostrarFecha = false,
  accion,
}: {
  ocurrencia: Ocurrencia;
  nombreElenco: string;
  mostrarFecha?: boolean;
  accion?: ReactNode;
}) {
  return (
    <article className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-text-dark truncate">{nombreElenco}</h3>
          {ocurrencia.estado !== "programada" && (
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${ESTILO_ESTADO_SESION[ocurrencia.estado]}`}>
              {ETIQUETA_ESTADO_SESION[ocurrencia.estado]}
            </span>
          )}
        </div>
        {mostrarFecha && (
          <p className="text-sm font-semibold text-slate-700 first-letter:uppercase">
            {formatearFechaLegible(ocurrencia.fecha)}
          </p>
        )}
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          {ocurrencia.horaInicio} – {sumarMinutos(ocurrencia.horaInicio, ocurrencia.duracionMinutos)}
          <span>·</span>
          {formatearDuracion(ocurrencia.duracionMinutos)}
          {ocurrencia.clase?.repeticion.tipo === "semanal" && (
            <Repeat className="w-3.5 h-3.5" aria-label="Se repite cada semana" />
          )}
        </p>
      </div>
      {accion && <div className="flex-shrink-0">{accion}</div>}
    </article>
  );
}
