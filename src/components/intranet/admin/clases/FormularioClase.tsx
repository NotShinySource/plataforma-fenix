"use client";

import { useState, type FormEvent } from "react";
import { CalendarPlus, Pencil, Repeat } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import {
  formatearDuracion,
  formatearFechaLegible,
  formatearFechaNumerica,
  idSemestre,
  NOMBRES_DIA,
  diaSemana,
  sumarMinutos,
  type Ocurrencia,
} from "@/lib/clases/calendario";
import {
  crearClaseAction,
  editarOcurrenciaAction,
  editarSerieAction,
  type RepetirClase,
} from "@/app/(intranet)/admin/clases/actions";
import { Modal } from "@/components/ui/Modal";
import type { ConId, Elenco, Semestre } from "@/types";
import { CLASE_CAMPO, CLASE_ERROR } from "@/components/ui/estilos";

export type ModoFormularioClase =
  | { modo: "crear"; fecha: string }
  | { modo: "ocurrencia"; ocurrencia: Ocurrencia }
  | { modo: "serie"; ocurrencia: Ocurrencia };

interface FormularioClaseProps {
  config: ModoFormularioClase;
  elencos: ConId<Elenco>[];
  semestres: Record<string, Semestre>;
  onCerrar: () => void;
  onGuardado: () => void;
}

const DURACIONES_RAPIDAS = [45, 60, 90, 120];

const TITULOS = {
  crear: "Nueva clase",
  ocurrencia: "Modificar solo esta clase",
  serie: "Modificar toda la serie",
};

/** Crear una clase (única o semanal) o modificar una ocurrencia / una serie existente. */
export function FormularioClase({
  config,
  elencos,
  semestres,
  onCerrar,
  onGuardado,
}: FormularioClaseProps) {
  const base = config.modo === "crear" ? null : config.ocurrencia;

  const [elencoId, setElencoId] = useState("");
  const [fecha, setFecha] = useState(config.modo === "crear" ? config.fecha : base!.fecha);
  const [horaInicio, setHoraInicio] = useState(
    config.modo === "serie" ? (base!.clase?.horaInicio ?? base!.horaInicio) : (base?.horaInicio ?? "")
  );
  const [duracion, setDuracion] = useState(
    config.modo === "serie"
      ? (base!.clase?.duracionMinutos ?? base!.duracionMinutos)
      : (base?.duracionMinutos ?? 60)
  );
  const [repetir, setRepetir] = useState<RepetirClase>("no");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anio = Number(fecha.slice(0, 4));
  const opcionesSemestre = ([1, 2] as const).map((numero) => {
    const semestre = semestres[idSemestre(anio, numero)];
    const dentro = semestre && fecha >= semestre.fechaInicio && fecha <= semestre.fechaFin;
    return { numero, semestre, dentro };
  });

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const usuario = auth.currentUser;
    if (!usuario) return;

    if (config.modo === "crear" && !elencoId) {
      setError("Selecciona el elenco.");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const idTokenAdmin = await usuario.getIdToken();
      const duracionMinutos = Number(duracion);

      const resultado =
        config.modo === "crear"
          ? await crearClaseAction({ idTokenAdmin, elencoId, fecha, horaInicio, duracionMinutos, repetir })
          : config.modo === "ocurrencia"
            ? await editarOcurrenciaAction({
                idTokenAdmin,
                claseId: config.ocurrencia.claseId,
                fechaProgramada: config.ocurrencia.fechaProgramada,
                fecha,
                horaInicio,
                duracionMinutos,
              })
            : await editarSerieAction({
                idTokenAdmin,
                claseId: config.ocurrencia.claseId,
                horaInicio,
                duracionMinutos,
              });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar la clase.");
        setGuardando(false);
        return;
      }
      onGuardado();
    } catch {
      setError("No se pudo guardar la clase. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo={TITULOS[config.modo]}
      subtitulo={config.modo === "crear" ? formatearFechaLegible(fecha) : undefined}
      icono={config.modo === "crear" ? CalendarPlus : config.modo === "serie" ? Repeat : Pencil}
      ancho="md"
      bloqueado={guardando}
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {config.modo === "crear" && (
          <div>
            <label htmlFor="clase-elenco" className="block text-sm font-bold text-slate-700 mb-1.5">
              Elenco
            </label>
            <select
              id="clase-elenco"
              required
              value={elencoId}
              onChange={(evento) => setElencoId(evento.target.value)}
              disabled={guardando}
              className={CLASE_CAMPO}
            >
              <option value="">Selecciona un elenco</option>
              {elencos.map((elenco) => (
                <option key={elenco.id} value={elenco.id}>
                  {elenco.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={`grid gap-4 ${config.modo === "serie" ? "grid-cols-1" : "grid-cols-2"}`}>
          {config.modo !== "serie" && (
            <div>
              <label htmlFor="clase-fecha" className="block text-sm font-bold text-slate-700 mb-1.5">
                Fecha
              </label>
              <input
                id="clase-fecha"
                type="date"
                required
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
                disabled={guardando}
                className={CLASE_CAMPO}
              />
            </div>
          )}
          <div>
            <label htmlFor="clase-hora" className="block text-sm font-bold text-slate-700 mb-1.5">
              Hora de inicio
            </label>
            <input
              id="clase-hora"
              type="time"
              required
              value={horaInicio}
              onChange={(evento) => setHoraInicio(evento.target.value)}
              disabled={guardando}
              className={CLASE_CAMPO}
            />
          </div>
        </div>

        <div>
          <p className="block text-sm font-bold text-slate-700 mb-1.5">Duración</p>
          <div className="flex flex-wrap items-center gap-2">
            {DURACIONES_RAPIDAS.map((minutos) => (
              <button
                key={minutos}
                type="button"
                onClick={() => setDuracion(minutos)}
                disabled={guardando}
                aria-pressed={Number(duracion) === minutos}
                className={`px-3.5 py-2 rounded-xl border text-sm font-bold transition-all ${
                  Number(duracion) === minutos
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-white border-slate-200 text-slate-600 hover:border-primary/40"
                }`}
              >
                {formatearDuracion(minutos)}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="number"
                min={15}
                max={480}
                step={5}
                required
                value={duracion}
                onChange={(evento) => setDuracion(Number(evento.target.value))}
                disabled={guardando}
                aria-label="Duración en minutos"
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              min
            </label>
          </div>
          {horaInicio && Number(duracion) > 0 && (
            <p className="text-xs font-semibold text-slate-600 mt-2">
              Termina a las {sumarMinutos(horaInicio, Number(duracion))} si comienza a la hora. Si el
              docente la inicia tarde, el término se corre para cumplir la duración completa.
            </p>
          )}
        </div>

        {config.modo === "crear" && (
          <fieldset>
            <legend className="block text-sm font-bold text-slate-700 mb-1.5">Repetir</legend>
            <div className="space-y-2">
              <OpcionRepetir
                activa={repetir === "no"}
                onElegir={() => setRepetir("no")}
                titulo="No se repite"
                detalle="Solo este día."
              />
              {opcionesSemestre.map(({ numero, semestre, dentro }) => (
                <OpcionRepetir
                  key={numero}
                  activa={repetir === (numero === 1 ? "semestre1" : "semestre2")}
                  onElegir={() => setRepetir(numero === 1 ? "semestre1" : "semestre2")}
                  deshabilitada={!dentro}
                  titulo={`Cada ${NOMBRES_DIA[diaSemana(fecha)].toLowerCase()} del ${numero}° semestre`}
                  detalle={
                    !semestre
                      ? `Configura primero el ${numero}° semestre ${anio}.`
                      : dentro
                        ? `Hasta el ${formatearFechaNumerica(semestre.fechaFin)}.`
                        : `La fecha está fuera del ${numero}° semestre (${formatearFechaNumerica(semestre.fechaInicio)} – ${formatearFechaNumerica(semestre.fechaFin)}).`
                  }
                />
              ))}
            </div>
          </fieldset>
        )}

        {config.modo === "serie" && (
          <p className="text-xs font-semibold text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
            Se aplica a todas las clases pendientes de la serie. Las ya dictadas y las que
            modificaste por separado no cambian.
          </p>
        )}

        {error && (
          <p role="alert" className={CLASE_ERROR}>
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-dark transition-all shadow-md disabled:opacity-60"
          >
            {guardando ? "Guardando..." : config.modo === "crear" ? "Crear clase" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function OpcionRepetir({
  activa,
  deshabilitada = false,
  titulo,
  detalle,
  onElegir,
}: {
  activa: boolean;
  deshabilitada?: boolean;
  titulo: string;
  detalle: string;
  onElegir: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activa}
      disabled={deshabilitada}
      onClick={onElegir}
      className={`w-full flex items-start gap-3 text-left px-4 py-3 rounded-2xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        activa ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40"
      }`}
    >
      <span
        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
          activa ? "border-primary bg-primary shadow-[inset_0_0_0_3px_white]" : "border-slate-300"
        }`}
      />
      <span>
        <span className="block text-sm font-bold text-text-dark">{titulo}</span>
        <span className="block text-xs font-semibold text-slate-600 mt-0.5">{detalle}</span>
      </span>
    </button>
  );
}
