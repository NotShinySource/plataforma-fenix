"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { AudioLines, FileText, Paperclip, X } from "lucide-react";
import { actualizarTarea, crearTarea } from "@/services/tareas.service";
import { fechaAValorInput, valorInputAFinDeDia } from "@/lib/format";
import {
  ACCEPT_ADJUNTO,
  LONGITUD_MAXIMA_TITULO_TAREA,
  validarAdjunto,
} from "@/lib/validacion";
import {
  TIPOS_ADJUNTO_TAREA,
  type ConId,
  type Elenco,
  type Tarea,
  type TipoAdjuntoTarea,
} from "@/types";

interface PanelTareaProps {
  elencos: ConId<Elenco>[];
  profesorId: string;
  /** Si viene, el panel edita esa tarea (solo título y fecha límite) en vez de crear una nueva. */
  tareaAEditar?: ConId<Tarea>;
  onCerrar: () => void;
}

const ICONO_ADJUNTO = { Ninguno: null, PDF: FileText, Audio: AudioLines } as const;

const CLASE_CAMPO =
  "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500 disabled:opacity-60";

/** Panel lateral desplegable para asignar una tarea nueva o editar una existente. */
export function PanelTarea({ elencos, profesorId, tareaAEditar, onCerrar }: PanelTareaProps) {
  const editando = tareaAEditar !== undefined;

  const [titulo, setTitulo] = useState(tareaAEditar?.titulo ?? "");
  const [elencoId, setElencoId] = useState(tareaAEditar?.elencoId ?? "");
  const [fechaLimite, setFechaLimite] = useState(
    tareaAEditar?.fechaLimite ? fechaAValorInput(tareaAEditar.fechaLimite) : ""
  );
  const [tipoAdjunto, setTipoAdjunto] = useState<TipoAdjuntoTarea>("Ninguno");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !guardando) onCerrar();
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleTecla);

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", handleTecla);
    };
  }, [guardando, onCerrar]);

  function handleTipoAdjunto(tipo: TipoAdjuntoTarea) {
    setTipoAdjunto(tipo);
    setArchivo(null);
    setError(null);
  }

  function handleArchivo(seleccionado: File | null) {
    setError(null);
    if (!seleccionado || tipoAdjunto === "Ninguno") {
      setArchivo(null);
      return;
    }
    const problema = validarAdjunto(seleccionado, tipoAdjunto);
    if (problema) {
      setArchivo(null);
      setError(problema);
      return;
    }
    setArchivo(seleccionado);
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) {
      setError("Escribe un título para la tarea.");
      return;
    }
    if (!elencoId) {
      setError("Selecciona el elenco al que se asigna la tarea.");
      return;
    }
    if (!editando && tipoAdjunto !== "Ninguno" && !archivo) {
      setError(`Selecciona el archivo ${tipoAdjunto === "PDF" ? "PDF" : "de audio"} a adjuntar.`);
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const fecha = fechaLimite ? valorInputAFinDeDia(fechaLimite) : undefined;

      if (tareaAEditar) {
        await actualizarTarea(tareaAEditar.id, { titulo: tituloLimpio, fechaLimite: fecha ?? null });
      } else {
        await crearTarea({
          titulo: tituloLimpio,
          elencoId,
          profesorId,
          fechaLimite: fecha,
          tipoAdjunto,
          archivo: archivo ?? undefined,
        });
      }
      onCerrar();
    } catch {
      setError(
        editando
          ? "No se pudo guardar la tarea. Intenta de nuevo."
          : "No se pudo asignar la tarea. Intenta de nuevo."
      );
      setGuardando(false);
    }
  }

  const tituloPanel = editando ? "Editar Tarea" : "Nueva Tarea Asignada";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm"
      onClick={() => !guardando && onCerrar()}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={tituloPanel}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(evento) => evento.stopPropagation()}
        className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
      >
        <div className="bg-primary text-white px-6 py-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-lg leading-tight">{tituloPanel}</h2>
            <p className="text-sm text-blue-100 font-medium mt-0.5">
              {editando ? "Modifica el título o la fecha límite" : "Completa los datos para asignar"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="p-2 -m-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label
                htmlFor="tarea-titulo"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Título de la Tarea
              </label>
              <input
                id="tarea-titulo"
                type="text"
                required
                autoFocus
                maxLength={LONGITUD_MAXIMA_TITULO_TAREA}
                value={titulo}
                onChange={(evento) => setTitulo(evento.target.value)}
                disabled={guardando}
                placeholder="Ej. Estudiar escala de Sol Mayor"
                className={CLASE_CAMPO}
              />
            </div>

            <div>
              <label
                htmlFor="tarea-elenco"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Asignar a:
              </label>
              <select
                id="tarea-elenco"
                required
                value={elencoId}
                onChange={(evento) => setElencoId(evento.target.value)}
                disabled={guardando || editando}
                className={CLASE_CAMPO}
              >
                <option value="">Selecciona un elenco</option>
                {elencos.map((elenco) => (
                  <option key={elenco.id} value={elenco.id}>
                    {elenco.nombre}
                  </option>
                ))}
              </select>
              {editando && (
                <p className="text-xs font-semibold text-slate-600 mt-1.5">
                  El elenco no se puede cambiar una vez asignada la tarea.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tarea-fecha"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Fecha Límite <span className="font-medium text-slate-500">(Opcional)</span>
              </label>
              <input
                id="tarea-fecha"
                type="date"
                value={fechaLimite}
                min={editando ? undefined : fechaAValorInput(new Date())}
                onChange={(evento) => setFechaLimite(evento.target.value)}
                disabled={guardando}
                className={CLASE_CAMPO}
              />
            </div>

            {!editando && (
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5">
                  <Paperclip className="w-4 h-4" />
                  Material adjunto <span className="font-medium text-slate-500">(Opcional)</span>
                </p>
                <div role="radiogroup" aria-label="Material adjunto" className="grid grid-cols-3 gap-2">
                  {TIPOS_ADJUNTO_TAREA.map((tipo) => {
                    const Icono = ICONO_ADJUNTO[tipo];
                    const activo = tipoAdjunto === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        role="radio"
                        aria-checked={activo}
                        disabled={guardando}
                        onClick={() => handleTipoAdjunto(tipo)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                          activo
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-white border-slate-200 text-slate-600 hover:border-primary/40"
                        }`}
                      >
                        {Icono && <Icono className="w-4 h-4" />}
                        {tipo}
                      </button>
                    );
                  })}
                </div>

                {tipoAdjunto !== "Ninguno" && (
                  <div className="mt-3">
                    <input
                      // La key reinicia el input al cambiar de tipo, para no arrastrar un archivo del tipo anterior.
                      key={tipoAdjunto}
                      type="file"
                      aria-label={`Archivo ${tipoAdjunto}`}
                      accept={ACCEPT_ADJUNTO[tipoAdjunto]}
                      disabled={guardando}
                      onChange={(evento) => handleArchivo(evento.target.files?.[0] ?? null)}
                      className="w-full text-sm font-medium text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-xs font-semibold text-slate-600 mt-1.5">
                      {tipoAdjunto === "PDF"
                        ? "Archivo .pdf de hasta 25 MB."
                        : "Archivo .mp3 o .wav de hasta 50 MB."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                {error}
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 p-6 space-y-2">
            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {guardando
                ? archivo
                  ? "Subiendo material..."
                  : "Guardando..."
                : editando
                  ? "Guardar Cambios"
                  : "Asignar Tarea"}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="w-full px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </motion.aside>
    </div>
  );
}
