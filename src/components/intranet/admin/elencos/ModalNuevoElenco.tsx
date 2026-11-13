"use client";

import { useState, type FormEvent } from "react";
import { Music2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { LARGO_MAXIMO_COMPLEMENTO, nombreGrupoEscuela, normalizarEspacios } from "@/lib/elencos";
import { crearGrupoEscuelaAction } from "@/app/(intranet)/admin/elencos/actions";
import type { ConId, Escuela } from "@/types";

interface ModalNuevoElencoProps {
  /** Solo las escuelas activas: en una archivada no se crean elencos. */
  escuelas: ConId<Escuela>[];
  onCerrar: () => void;
  onCreado: (elencoId: string) => void;
}

/** Alta de un elenco: escuela, nivel y un complemento opcional. El nombre se arma solo. */
export function ModalNuevoElenco({ escuelas, onCerrar, onCreado }: ModalNuevoElencoProps) {
  const [escuelaId, setEscuelaId] = useState(escuelas[0]?.id ?? "");
  const escuela = escuelas.find((opcion) => opcion.id === escuelaId);
  const [nivel, setNivel] = useState(escuelas[0]?.niveles[0] ?? "");
  const [complemento, setComplemento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vistaPrevia = escuela
    ? nombreGrupoEscuela(escuela.nombre, nivel, normalizarEspacios(complemento))
    : "";

  function cambiarEscuela(id: string) {
    setEscuelaId(id);
    // Cada escuela tiene sus propios niveles: se parte por el primero.
    setNivel(escuelas.find((opcion) => opcion.id === id)?.niveles[0] ?? "");
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!escuela || !nivel) {
      setError("Elige la escuela y el nivel.");
      return;
    }
    if (!auth.currentUser) return;

    setEnviando(true);
    setError(null);
    try {
      const resultado = await crearGrupoEscuelaAction({
        escuelaId,
        nivel,
        complemento: normalizarEspacios(complemento) || undefined,
        descripcion,
        idTokenAdmin: await auth.currentUser.getIdToken(),
      });
      if (!resultado.ok || !resultado.elencoId) {
        setError(resultado.error ?? "No se pudo crear el elenco.");
        setEnviando(false);
        return;
      }
      onCreado(resultado.elencoId);
    } catch {
      setError("No se pudo crear el elenco. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo="Nuevo elenco"
      subtitulo="Después podrás asignarle docentes y alumnos"
      icono={Music2}
      bloqueado={enviando}
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="elenco-escuela" className={CLASE_ETIQUETA}>
              Escuela
            </label>
            <select
              id="elenco-escuela"
              value={escuelaId}
              onChange={(evento) => cambiarEscuela(evento.target.value)}
              className={CLASE_CAMPO}
            >
              {escuelas.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="elenco-nivel" className={CLASE_ETIQUETA}>
              Nivel
            </label>
            <select
              id="elenco-nivel"
              value={nivel}
              onChange={(evento) => setNivel(evento.target.value)}
              className={CLASE_CAMPO}
            >
              {(escuela?.niveles ?? []).map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="elenco-complemento" className={CLASE_ETIQUETA}>
            Complemento <span className="normal-case font-semibold text-slate-600">(opcional)</span>
          </label>
          <input
            id="elenco-complemento"
            type="text"
            placeholder="Ej: Grupo A, Martes"
            value={complemento}
            onChange={(evento) => setComplemento(evento.target.value)}
            maxLength={LARGO_MAXIMO_COMPLEMENTO}
            className={CLASE_CAMPO}
          />
          <p className="text-xs font-semibold text-slate-600 mt-1.5 px-1">
            Úsalo solo para distinguir dos grupos de la misma escuela y nivel.
          </p>
        </div>

        <div>
          <label htmlFor="elenco-descripcion" className={CLASE_ETIQUETA}>
            Descripción <span className="normal-case font-semibold text-slate-600">(opcional)</span>
          </label>
          <textarea
            id="elenco-descripcion"
            placeholder="Breve descripción del elenco..."
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            maxLength={500}
            rows={3}
            className={`${CLASE_CAMPO} resize-none`}
          />
        </div>

        {vistaPrevia && (
          <p className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            Se llamará <span className="font-extrabold text-text-dark">{vistaPrevia}</span>
          </p>
        )}

        {error && (
          <p role="alert" className={CLASE_ERROR}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCerrar} disabled={enviando} className={CLASE_BOTON_SECUNDARIO}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className={CLASE_BOTON_PRIMARIO}>
            {enviando ? "Creando..." : "Crear elenco"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
