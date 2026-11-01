"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCheck, Clock, Eye, Music, Save, Square } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import { formatearDuracion, formatearFechaLegible } from "@/lib/clases/calendario";
import { suscribirSesion } from "@/services/clases.service";
import { esMiembroDeElenco, listarMiembrosDeElenco, obtenerElenco } from "@/services/elencos.service";
import { listarAsistenciasPorSesion } from "@/services/asistencias.service";
import { obtenerUsuario } from "@/services/usuarios.service";
import {
  ESTILO_ESTADO_SESION,
  ETIQUETA_ESTADO_SESION,
} from "@/components/intranet/clases/estadoSesion";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Modal } from "@/components/ui/Modal";
import { guardarClaseAction } from "../actions";
import type { ConId, SesionClase } from "@/types";

type EstadoMarcado = "presente" | "ausente" | null;

interface FilaAlumno {
  alumnoId: string;
  nombre: string;
  estado: EstadoMarcado;
  observaciones: string;
}

const LONGITUD_MAXIMA_RESUMEN = 2000;
const LONGITUD_MAXIMA_OBSERVACION = 500;

function hora(fecha: Date): string {
  return fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function ClaseEnCursoPage() {
  const { sesionId } = useParams<{ sesionId: string }>();
  const { usuario } = useAuth();

  const [sesion, setSesion] = useState<ConId<SesionClase> | null | undefined>(undefined);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [nombreElenco, setNombreElenco] = useState("");
  const [acceso, setAcceso] = useState<boolean | null>(null);
  const [filas, setFilas] = useState<FilaAlumno[] | null>(null);
  const [resumen, setResumen] = useState("");
  const [ahora, setAhora] = useState(() => Date.now());

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [observando, setObservando] = useState<FilaAlumno | null>(null);
  const [textoObservacion, setTextoObservacion] = useState("");
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");

  useEffect(
    () =>
      suscribirSesion(
        sesionId,
        (resultado) => setSesion(resultado),
        () => setErrorCarga("No se pudo cargar la clase.")
      ),
    [sesionId]
  );

  const elencoId = sesion?.elencoId;

  // Alumnos del elenco + lo ya guardado de esta sesión (si se recargó la página o se vuelve a abrir).
  useEffect(() => {
    if (!elencoId || !usuario) return;
    let cancelado = false;

    async function cargar() {
      try {
        const esMiembro = await esMiembroDeElenco(elencoId!, usuario!.uid);
        if (cancelado) return;
        setAcceso(esMiembro);
        if (!esMiembro) return;

        const [elenco, membresias, registros] = await Promise.all([
          obtenerElenco(elencoId!),
          listarMiembrosDeElenco(elencoId!, "alumno"),
          listarAsistenciasPorSesion(sesionId),
        ]);
        const porAlumno = new Map(registros.map((registro) => [registro.alumnoId, registro]));

        const alumnos = await Promise.all(
          membresias.map(async (membresia) => {
            const alumno = await obtenerUsuario(membresia.usuarioId).catch(() => null);
            const registro = porAlumno.get(membresia.usuarioId);
            return {
              alumnoId: membresia.usuarioId,
              nombre: alumno ? `${alumno.nombres} ${alumno.apellidos}` : "Alumno",
              estado:
                registro?.estado === "presente" || registro?.estado === "ausente" ? registro.estado : null,
              observaciones: registro?.observaciones ?? "",
            };
          })
        );
        if (cancelado) return;
        setNombreElenco(elenco?.nombre ?? "Elenco");
        setFilas(alumnos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } catch {
        if (!cancelado) setErrorCarga("No se pudo cargar la lista de alumnos.");
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [elencoId, usuario, sesionId]);

  // El resumen guardado se carga una sola vez; después manda lo que escribe el docente.
  const [resumenCargado, setResumenCargado] = useState(false);
  if (sesion && !resumenCargado) {
    setResumenCargado(true);
    setResumen(sesion.resumen ?? "");
  }

  // Reloj para el contador de la clase.
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 15_000);
    return () => clearInterval(intervalo);
  }, []);

  const termino = useMemo(
    () =>
      sesion?.inicioReal
        ? new Date(sesion.inicioReal.getTime() + sesion.duracionMinutos * 60_000)
        : null,
    [sesion]
  );
  const minutosRestantes = termino ? Math.max(0, Math.ceil((termino.getTime() - ahora) / 60_000)) : 0;
  const cumplida = termino !== null && ahora >= termino.getTime();
  const progreso =
    sesion?.inicioReal && termino
      ? Math.min(100, ((ahora - sesion.inicioReal.getTime()) / (termino.getTime() - sesion.inicioReal.getTime())) * 100)
      : 0;

  const enCurso = sesion?.estado === "en_curso";
  const marcados = filas?.filter((fila) => fila.estado !== null).length ?? 0;

  function marcar(alumnoId: string, estado: EstadoMarcado) {
    setFilas((actuales) =>
      actuales?.map((fila) => (fila.alumnoId === alumnoId ? { ...fila, estado } : fila)) ?? null
    );
  }

  function marcarTodosPresentes() {
    setFilas(
      (actuales) =>
        actuales?.map((fila) => (fila.estado === null ? { ...fila, estado: "presente" } : fila)) ?? null
    );
  }

  function abrirObservacion(fila: FilaAlumno) {
    setObservando(fila);
    setTextoObservacion(fila.observaciones);
  }

  function guardarObservacion() {
    if (!observando) return;
    const texto = textoObservacion.trim();
    setFilas(
      (actuales) =>
        actuales?.map((fila) =>
          fila.alumnoId === observando.alumnoId ? { ...fila, observaciones: texto } : fila
        ) ?? null
    );
    setObservando(null);
  }

  const cerrarObservacion = useCallback(() => setObservando(null), []);
  const cerrarMotivo = useCallback(() => setPidiendoMotivo(false), []);

  async function guardar(finalizar: boolean, motivoFin?: string) {
    const usuarioActual = auth.currentUser;
    if (!usuarioActual || !filas) return;

    setGuardando(true);
    setMensaje(null);
    try {
      const resultado = await guardarClaseAction({
        idToken: await usuarioActual.getIdToken(),
        sesionId,
        registros: filas.map(({ alumnoId, estado, observaciones }) => ({ alumnoId, estado, observaciones })),
        resumen,
        finalizar,
        motivo: motivoFin,
      });

      if (!resultado.ok) {
        if (resultado.requiereMotivo) {
          setPidiendoMotivo(true);
        } else {
          setMensaje({ tipo: "error", texto: resultado.error });
          setPidiendoMotivo(false);
        }
        return;
      }
      setPidiendoMotivo(false);
      setMensaje({
        tipo: "ok",
        texto: finalizar ? "Clase finalizada y asistencia registrada." : "Avance guardado.",
      });
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo guardar. Revisa tu conexión e intenta de nuevo." });
    } finally {
      setGuardando(false);
    }
  }

  function handleFinalizar() {
    if (cumplida) guardar(true);
    else setPidiendoMotivo(true);
  }

  if (errorCarga) return <EstadoError mensaje={errorCarga} />;
  if (sesion === undefined) return <EstadoCargando texto="Cargando clase..." />;
  if (sesion === null) {
    return (
      <EstadoVacio icono={Music} titulo="Clase no encontrada" descripcion="Puede que la hayan eliminado." />
    );
  }
  if (acceso === false) {
    return (
      <EstadoVacio
        icono={Music}
        titulo="No tienes acceso a esta clase"
        descripcion="Solo los docentes del elenco pueden tomar su asistencia."
      />
    );
  }
  if (filas === null) return <EstadoCargando texto="Cargando alumnos..." />;

  return (
    <>
      <Link
        href="/profesor/clases"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a mis clases
      </Link>

      {/* Encabezado con el contador de la clase */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${ESTILO_ESTADO_SESION[sesion.estado]}`}>
              {ETIQUETA_ESTADO_SESION[sesion.estado]}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-text-dark">{nombreElenco}</h1>
            <p className="text-sm font-semibold text-slate-600 first-letter:uppercase">
              {formatearFechaLegible(sesion.fecha)} · programada a las {sesion.horaInicio} ·{" "}
              {formatearDuracion(sesion.duracionMinutos)}
            </p>
          </div>

          {sesion.inicioReal && termino && (
            <div className="flex gap-3">
              <div className="bg-slate-50 rounded-2xl px-4 py-3 text-center">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Inicio</p>
                <p className="text-lg font-black text-text-dark tabular-nums">{hora(sesion.inicioReal)}</p>
              </div>
              <div className="bg-primary/5 rounded-2xl px-4 py-3 text-center">
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  {enCurso ? "Termina" : "Término"}
                </p>
                <p className="text-lg font-black text-primary tabular-nums">
                  {sesion.finReal && !enCurso ? hora(sesion.finReal) : hora(termino)}
                </p>
              </div>
            </div>
          )}
        </div>

        {enCurso && termino && (
          <div className="space-y-2">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-[width] duration-1000" style={{ width: `${progreso}%` }} />
            </div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
              <Clock className="w-4 h-4" />
              {cumplida
                ? "La clase ya cumplió su duración. Puedes finalizarla."
                : `Faltan ${formatearDuracion(minutosRestantes)} para cumplir la duración.`}
            </p>
          </div>
        )}

        {sesion.estado === "incompleta" && sesion.motivoIncompleta && (
          <p className="text-sm font-semibold text-amber-800 bg-amber-50 rounded-2xl px-4 py-3">
            Finalizada antes de cumplir la duración: {sesion.motivoIncompleta}
          </p>
        )}
      </div>

      {/* Asistencia */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-text-dark">Asistencia</h2>
            <p className="text-xs font-semibold text-slate-600">
              {marcados} de {filas.length} marcados · el ojo registra un incidente o falta
            </p>
          </div>
          {enCurso && filas.length > 0 && (
            <button
              type="button"
              onClick={marcarTodosPresentes}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:border-primary/40 hover:text-primary transition-all"
            >
              <CheckCheck className="w-4 h-4" /> Marcar el resto presentes
            </button>
          )}
        </div>

        {filas.length === 0 ? (
          <p className="text-sm font-semibold text-slate-600 px-6 py-8 text-center">
            Este elenco no tiene alumnos asignados.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filas.map((fila) => (
              <li key={fila.alumnoId} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                <span className="flex-1 min-w-0 text-sm font-semibold text-text-dark truncate">{fila.nombre}</span>

                <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 gap-1" role="radiogroup" aria-label={`Asistencia de ${fila.nombre}`}>
                  {(["presente", "ausente"] as const).map((estado) => {
                    const activo = fila.estado === estado;
                    return (
                      <button
                        key={estado}
                        type="button"
                        role="radio"
                        aria-checked={activo}
                        disabled={!enCurso}
                        onClick={() => marcar(fila.alumnoId, activo ? null : estado)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:cursor-default ${
                          activo
                            ? estado === "presente"
                              ? "bg-primary text-white shadow-sm"
                              : "bg-red-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-primary"
                        }`}
                      >
                        {estado === "presente" ? "Presente" : "Ausente"}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => abrirObservacion(fila)}
                  disabled={!enCurso && !fila.observaciones}
                  aria-label={
                    fila.observaciones
                      ? `Ver observación de ${fila.nombre}`
                      : `Agregar observación para ${fila.nombre}`
                  }
                  className={`p-2 rounded-xl transition-colors disabled:opacity-30 ${
                    fila.observaciones
                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "text-slate-400 hover:text-primary hover:bg-primary/10"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Qué se hizo */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
        <label htmlFor="resumen-clase" className="block font-extrabold text-text-dark">
          ¿Qué se hizo en la clase?
        </label>
        <textarea
          id="resumen-clase"
          rows={5}
          maxLength={LONGITUD_MAXIMA_RESUMEN}
          value={resumen}
          onChange={(evento) => setResumen(evento.target.value)}
          disabled={!enCurso}
          placeholder="Ej: Repaso de escalas, lectura de los compases 1 al 32 de la obra nueva y ensamble por secciones."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500 resize-none disabled:opacity-80"
        />
        <p className="text-xs font-semibold text-slate-600">
          Esto es lo que aparece en el informe que se envía a la Corporación.
        </p>
      </div>

      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`text-sm font-semibold rounded-xl px-4 py-3 ${
            mensaje.tipo === "error"
              ? "text-red-600 bg-red-50 border border-red-100"
              : "text-primary bg-primary/5 border border-primary/10"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {enCurso && (
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => guardar(false)}
            disabled={guardando}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-primary hover:border-primary/40 font-bold text-sm transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> Guardar avance
          </button>
          <button
            type="button"
            onClick={handleFinalizar}
            disabled={guardando}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60"
          >
            <Square className="w-4 h-4" /> {guardando ? "Guardando..." : "Finalizar clase"}
          </button>
        </div>
      )}

      {observando && (
        <Modal
          titulo="Observación"
          subtitulo={observando.nombre}
          icono={Eye}
          ancho="md"
          onCerrar={cerrarObservacion}
        >
          <div className="space-y-4">
            <textarea
              rows={4}
              autoFocus
              maxLength={LONGITUD_MAXIMA_OBSERVACION}
              value={textoObservacion}
              onChange={(evento) => setTextoObservacion(evento.target.value)}
              disabled={!enCurso}
              placeholder="Describe el incidente, la falta o lo que haya que informar."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary text-sm font-medium text-text-dark placeholder:text-slate-500 resize-none"
            />
            <p className="text-xs font-semibold text-slate-600">
              Solo la ven los docentes y la administración; el alumno no la ve. Se guarda al
              guardar el avance o finalizar la clase.
            </p>
            {enCurso && (
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={cerrarObservacion}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarObservacion}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-dark shadow-md"
                >
                  {textoObservacion.trim() ? "Listo" : "Quitar observación"}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {pidiendoMotivo && (
        <Modal
          titulo="Finalizar antes de tiempo"
          subtitulo={`Faltan ${formatearDuracion(minutosRestantes)} para cumplir la duración`}
          icono={Clock}
          ancho="md"
          bloqueado={guardando}
          onCerrar={cerrarMotivo}
        >
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-600">
              La clase quedará marcada como <strong>incompleta</strong> en el informe. Indica el motivo.
            </p>
            <textarea
              rows={3}
              autoFocus
              maxLength={500}
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Ej: Suspensión por corte de luz en la sede."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary text-sm font-medium text-text-dark placeholder:text-slate-500 resize-none"
            />
            {mensaje?.tipo === "error" && (
              <p role="alert" className="text-sm font-semibold text-red-600">{mensaje.texto}</p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={cerrarMotivo}
                disabled={guardando}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 disabled:opacity-60"
              >
                Seguir en clase
              </button>
              <button
                type="button"
                onClick={() => guardar(true, motivo)}
                disabled={guardando || !motivo.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-dark shadow-md disabled:opacity-50"
              >
                {guardando ? "Finalizando..." : "Finalizar igual"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
