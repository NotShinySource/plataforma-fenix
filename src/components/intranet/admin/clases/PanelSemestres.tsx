"use client";

import { useState, type FormEvent } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { formatearFechaNumerica, idSemestre } from "@/lib/clases/calendario";
import { guardarSemestresAction } from "@/app/(intranet)/admin/clases/actions";
import type { Semestre } from "@/types";

interface PanelSemestresProps {
  anio: number;
  semestres: Record<string, Semestre>;
  onGuardado: () => void;
}

const CLASE_CAMPO =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark";

/** Fechas de inicio y término de cada semestre: hasta ahí se repiten las clases semanales. */
export function PanelSemestres({ anio, semestres, onGuardado }: PanelSemestresProps) {
  const primero = semestres[idSemestre(anio, 1)];
  const segundo = semestres[idSemestre(anio, 2)];
  const configurados = Boolean(primero && segundo);

  const [abierto, setAbierto] = useState(!configurados);
  const [inicio1, setInicio1] = useState(primero?.fechaInicio ?? "");
  const [fin1, setFin1] = useState(primero?.fechaFin ?? "");
  const [inicio2, setInicio2] = useState(segundo?.fechaInicio ?? "");
  const [fin2, setFin2] = useState(segundo?.fechaFin ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const usuario = auth.currentUser;
    if (!usuario) return;

    setGuardando(true);
    setError(null);
    try {
      const resultado = await guardarSemestresAction({
        idTokenAdmin: await usuario.getIdToken(),
        anio,
        primero: { fechaInicio: inicio1, fechaFin: fin1 },
        segundo: { fechaInicio: inicio2, fechaFin: fin2 },
      });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudieron guardar los semestres.");
        return;
      }
      setAbierto(false);
      onGuardado();
    } catch {
      setError("No se pudieron guardar los semestres. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="bg-primary/10 text-primary p-2.5 rounded-xl flex-shrink-0">
            <CalendarRange className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-extrabold text-text-dark">Semestres {anio}</span>
            <span className="block text-xs font-semibold text-slate-600 truncate">
              {configurados
                ? `1°: ${formatearFechaNumerica(primero.fechaInicio)} – ${formatearFechaNumerica(primero.fechaFin)} · 2°: ${formatearFechaNumerica(segundo.fechaInicio)} – ${formatearFechaNumerica(segundo.fechaFin)}`
                : "Sin configurar: defínelos para poder repetir clases cada semana"}
            </span>
          </span>
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <form onSubmit={handleSubmit} className="px-5 sm:px-6 pb-5 space-y-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { titulo: "1er semestre", inicio: inicio1, fin: fin1, setInicio: setInicio1, setFin: setFin1 },
              { titulo: "2do semestre", inicio: inicio2, fin: fin2, setInicio: setInicio2, setFin: setFin2 },
            ].map((semestre) => (
              <fieldset key={semestre.titulo} className="space-y-2">
                <legend className="text-sm font-bold text-slate-700">{semestre.titulo}</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-slate-600 space-y-1">
                    <span>Inicio</span>
                    <input
                      type="date"
                      required
                      value={semestre.inicio}
                      min={`${anio}-01-01`}
                      max={`${anio}-12-31`}
                      onChange={(evento) => semestre.setInicio(evento.target.value)}
                      className={CLASE_CAMPO}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600 space-y-1">
                    <span>Término</span>
                    <input
                      type="date"
                      required
                      value={semestre.fin}
                      min={`${anio}-01-01`}
                      max={`${anio}-12-31`}
                      onChange={(evento) => semestre.setFin(evento.target.value)}
                      className={CLASE_CAMPO}
                    />
                  </label>
                </div>
              </fieldset>
            ))}
          </div>

          {error && (
            <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar semestres"}
            </button>
            <p className="text-xs font-semibold text-slate-600">
              Si cambias el término de un semestre, sus clases semanales se ajustan solas.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
