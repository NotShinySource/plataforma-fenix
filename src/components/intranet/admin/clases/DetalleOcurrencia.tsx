"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Eye, Pencil, Repeat, RotateCcw, Trash2, XCircle } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import {
  formatearDuracion,
  formatearFechaLegible,
  sumarMinutos,
  type Ocurrencia,
} from "@/lib/clases/calendario";
import {
  cancelarOcurrenciaAction,
  editarOcurrenciaAction,
  eliminarSerieAction,
} from "@/app/(intranet)/admin/clases/actions";
import { listarAsistenciasPorSesion } from "@/services/asistencias.service";
import { obtenerUsuario } from "@/services/usuarios.service";
import {
  ESTILO_ESTADO_SESION,
  ETIQUETA_ESTADO_SESION,
} from "@/components/intranet/clases/estadoSesion";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { Modal } from "@/components/ui/Modal";
import type { ModoFormularioClase } from "./FormularioClase";
import { CLASE_ERROR } from "@/components/ui/estilos";

interface DetalleOcurrenciaProps {
  ocurrencia: Ocurrencia;
  nombreElenco: string;
  onCerrar: () => void;
  onEditar: (config: ModoFormularioClase) => void;
  onCambio: () => void;
}

interface FilaAsistencia {
  id: string;
  nombre: string;
  estado: string;
  observaciones?: string;
}

function horaDe(fecha?: Date): string {
  return fecha ? fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—";
}

export function DetalleOcurrencia({
  ocurrencia,
  nombreElenco,
  onCerrar,
  onEditar,
  onCambio,
}: DetalleOcurrenciaProps) {
  const [confirmando, setConfirmando] = useState<"cancelar" | "serie" | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asistencia, setAsistencia] = useState<FilaAsistencia[] | null>(null);

  const dictada = ocurrencia.estado === "realizada" || ocurrencia.estado === "incompleta";
  const editable = ocurrencia.estado === "programada" || ocurrencia.estado === "cancelada";
  const sesion = ocurrencia.sesion;

  useEffect(() => {
    if (!dictada && ocurrencia.estado !== "en_curso") return;
    let cancelado = false;

    listarAsistenciasPorSesion(ocurrencia.sesionId)
      .then((registros) =>
        Promise.all(
          registros.map(async (registro) => {
            const alumno = await obtenerUsuario(registro.alumnoId).catch(() => null);
            return {
              id: registro.id,
              nombre: alumno ? `${alumno.nombres} ${alumno.apellidos}` : "Alumno",
              estado: registro.estado,
              observaciones: registro.observaciones,
            };
          })
        )
      )
      .then((filas) => {
        if (!cancelado) setAsistencia(filas.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
      .catch(() => {
        if (!cancelado) setAsistencia([]);
      });

    return () => {
      cancelado = true;
    };
  }, [dictada, ocurrencia.estado, ocurrencia.sesionId]);

  async function ejecutar(accion: (idTokenAdmin: string) => Promise<{ ok: boolean; error?: string }>) {
    const usuario = auth.currentUser;
    if (!usuario) return;
    setTrabajando(true);
    setError(null);
    try {
      const resultado = await accion(await usuario.getIdToken());
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo completar la acción.");
        setTrabajando(false);
        return;
      }
      onCambio();
    } catch {
      setError("No se pudo completar la acción. Intenta de nuevo.");
      setTrabajando(false);
    }
  }

  const ocurrenciaRef = { claseId: ocurrencia.claseId, fechaProgramada: ocurrencia.fechaProgramada };

  return (
    <Modal
      titulo={nombreElenco}
      subtitulo={formatearFechaLegible(ocurrencia.fecha)}
      icono={CalendarClock}
      ancho="lg"
      bloqueado={trabajando}
      onCerrar={onCerrar}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${ESTILO_ESTADO_SESION[ocurrencia.estado]}`}>
            {ETIQUETA_ESTADO_SESION[ocurrencia.estado]}
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {ocurrencia.horaInicio} – {sumarMinutos(ocurrencia.horaInicio, ocurrencia.duracionMinutos)} ·{" "}
            {formatearDuracion(ocurrencia.duracionMinutos)}
          </span>
          {ocurrencia.clase?.repeticion.tipo === "semanal" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600">
              <Repeat className="w-3.5 h-3.5" /> Semanal
            </span>
          )}
          {ocurrencia.fecha !== ocurrencia.fechaProgramada && (
            <span className="text-xs font-semibold text-slate-600">
              (movida desde el {formatearFechaLegible(ocurrencia.fechaProgramada)})
            </span>
          )}
        </div>

        {(dictada || ocurrencia.estado === "en_curso") && sesion && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-3">
              <p className="text-xs font-bold text-slate-600">Inicio real</p>
              <p className="text-sm font-extrabold text-text-dark">{horaDe(sesion.inicioReal)}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3">
              <p className="text-xs font-bold text-slate-600">Término real</p>
              <p className="text-sm font-extrabold text-text-dark">{horaDe(sesion.finReal)}</p>
            </div>
          </div>
        )}

        {dictada && sesion && (
          <div className="space-y-3">
            {sesion.motivoIncompleta && (
              <p className="text-sm font-semibold text-amber-800 bg-amber-50 rounded-2xl px-4 py-3">
                Finalizada antes de cumplir la duración: {sesion.motivoIncompleta}
              </p>
            )}
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Qué se hizo
              </p>
              <p className="text-sm font-medium text-text-dark whitespace-pre-line">
                {sesion.resumen || "—"}
              </p>
            </div>
          </div>
        )}

        {(dictada || ocurrencia.estado === "en_curso") && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Asistencia</p>
            {asistencia === null ? (
              <EstadoCargando texto="Cargando asistencia..." />
            ) : asistencia.length === 0 ? (
              <p className="text-sm font-semibold text-slate-600">Sin registros todavía.</p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl">
                {asistencia.map((fila) => (
                  <li key={fila.id} className="px-4 py-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-text-dark">{fila.nombre}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          fila.estado === "presente" ? "bg-primary/10 text-primary" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {fila.estado === "presente" ? "Presente" : "Ausente"}
                      </span>
                    </div>
                    {fila.observaciones && (
                      <p className="flex items-start gap-1.5 text-xs font-medium text-slate-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                        <Eye className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-700" />
                        {fila.observaciones}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className={CLASE_ERROR}>
            {error}
          </p>
        )}

        {editable && confirmando === null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {ocurrencia.estado === "programada" ? (
              <>
                <BotonAccion
                  icono={Pencil}
                  texto="Modificar solo esta"
                  onClick={() => onEditar({ modo: "ocurrencia", ocurrencia })}
                />
                <BotonAccion icono={XCircle} texto="Cancelar solo esta" onClick={() => setConfirmando("cancelar")} />
              </>
            ) : (
              <BotonAccion
                icono={RotateCcw}
                texto="Restaurar esta clase"
                disabled={trabajando}
                onClick={() =>
                  ejecutar((idTokenAdmin) =>
                    editarOcurrenciaAction({
                      idTokenAdmin,
                      ...ocurrenciaRef,
                      fecha: ocurrencia.fecha,
                      horaInicio: ocurrencia.horaInicio,
                      duracionMinutos: ocurrencia.duracionMinutos,
                    })
                  )
                }
              />
            )}
            {ocurrencia.clase && (
              <>
                <BotonAccion
                  icono={Repeat}
                  texto="Modificar toda la serie"
                  onClick={() => onEditar({ modo: "serie", ocurrencia })}
                />
                <BotonAccion
                  icono={Trash2}
                  texto="Eliminar toda la serie"
                  peligro
                  onClick={() => setConfirmando("serie")}
                />
              </>
            )}
          </div>
        )}

        {confirmando && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700">
              {confirmando === "cancelar"
                ? "Se cancela solo esta clase; el resto de la serie sigue igual. Puedes restaurarla después."
                : "Se eliminan todas las clases pendientes de la serie. Las ya dictadas se conservan en el informe. No se puede deshacer."}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                disabled={trabajando}
                className="flex-1 px-4 py-2 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={trabajando}
                onClick={() =>
                  ejecutar((idTokenAdmin) =>
                    confirmando === "cancelar"
                      ? cancelarOcurrenciaAction({ idTokenAdmin, ...ocurrenciaRef })
                      : eliminarSerieAction({ idTokenAdmin, claseId: ocurrencia.claseId })
                  )
                }
                className="flex-1 px-4 py-2 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {trabajando ? "Procesando..." : confirmando === "cancelar" ? "Cancelar clase" : "Eliminar serie"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function BotonAccion({
  icono: Icono,
  texto,
  peligro = false,
  disabled = false,
  onClick,
}: {
  icono: typeof Pencil;
  texto: string;
  peligro?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all disabled:opacity-60 ${
        peligro
          ? "border-red-100 text-red-600 hover:bg-red-50"
          : "border-slate-200 text-slate-700 hover:border-primary/40 hover:text-primary"
      }`}
    >
      <Icono className="w-4 h-4" />
      {texto}
    </button>
  );
}
