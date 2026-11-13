"use client";

import { useState, type FormEvent } from "react";
import { Archive, ArchiveRestore, Landmark, Pencil } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { LARGO_MAXIMO_NOMBRE_ESCUELA } from "@/lib/elencos";
import {
  cambiarEstadoEscuelaAction,
  renombrarEscuelaAction,
} from "@/app/(intranet)/admin/elencos/actions";
import type { ConId, Escuela } from "@/types";

interface TarjetaEscuelaProps {
  escuela: ConId<Escuela>;
  /** Grupos activos de la escuela. */
  cantidadGrupos: number;
  /** Se llama después de renombrar, archivar o reactivar, para recargar. */
  onCambio: () => void;
}

/** Escuela con sus niveles (fijos), y las acciones de renombrar y archivar. */
export function TarjetaEscuela({ escuela, cantidadGrupos, onCambio }: TarjetaEscuelaProps) {
  const [renombrando, setRenombrando] = useState(false);
  const [nombre, setNombre] = useState(escuela.nombre);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRenombrar, setErrorRenombrar] = useState<string | null>(null);

  async function cambiarEstado() {
    if (!auth.currentUser) return;
    setOcupado(true);
    setError(null);
    try {
      const resultado = await cambiarEstadoEscuelaAction({
        escuelaId: escuela.id,
        activo: !escuela.activo,
        idTokenAdmin: await auth.currentUser.getIdToken(),
      });
      if (!resultado.ok) setError(resultado.error ?? "No se pudo actualizar la escuela.");
      else onCambio();
    } catch {
      setError("No se pudo actualizar la escuela. Intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  async function renombrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!auth.currentUser) return;
    setOcupado(true);
    setErrorRenombrar(null);
    try {
      const resultado = await renombrarEscuelaAction({
        escuelaId: escuela.id,
        nombre,
        idTokenAdmin: await auth.currentUser.getIdToken(),
      });
      if (!resultado.ok) {
        setErrorRenombrar(resultado.error ?? "No se pudo renombrar la escuela.");
        return;
      }
      setRenombrando(false);
      onCambio();
    } catch {
      setErrorRenombrar("No se pudo renombrar la escuela. Intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta">
            {escuela.tipo === "instrumento" ? "Instrumento" : "Conjunto"}
            {!escuela.activo && " · Archivada"}
          </span>
          <h3 className="font-extrabold text-lg text-text-dark break-words">{escuela.nombre}</h3>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">
            {cantidadGrupos} {cantidadGrupos === 1 ? "grupo activo" : "grupos activos"}
          </p>
        </div>
        <Landmark className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label={`Niveles de ${escuela.nombre}`}>
        {escuela.niveles.map((nivel) => (
          <li key={nivel} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">
            {nivel}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className={CLASE_ERROR}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            setNombre(escuela.nombre);
            setErrorRenombrar(null);
            setRenombrando(true);
          }}
          disabled={ocupado}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-60"
        >
          <Pencil className="w-3.5 h-3.5" />
          Renombrar
        </button>
        <button
          type="button"
          onClick={cambiarEstado}
          disabled={ocupado}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-60"
        >
          {escuela.activo ? <Archive className="w-3.5 h-3.5" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
          {escuela.activo ? "Archivar" : "Reactivar"}
        </button>
      </div>

      {renombrando && (
        <Modal
          titulo="Renombrar escuela"
          subtitulo="También cambia el nombre de todos sus elencos"
          icono={Pencil}
          bloqueado={ocupado}
          onCerrar={() => setRenombrando(false)}
        >
          <form onSubmit={renombrar} className="space-y-4" noValidate>
            <div>
              <label htmlFor={`renombrar-${escuela.id}`} className={CLASE_ETIQUETA}>
                Nombre
              </label>
              <input
                id={`renombrar-${escuela.id}`}
                type="text"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                maxLength={LARGO_MAXIMO_NOMBRE_ESCUELA}
                autoFocus
                className={CLASE_CAMPO}
              />
            </div>
            {errorRenombrar && (
              <p role="alert" className={CLASE_ERROR}>
                {errorRenombrar}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRenombrando(false)}
                disabled={ocupado}
                className={CLASE_BOTON_SECUNDARIO}
              >
                Cancelar
              </button>
              <button type="submit" disabled={ocupado} className={CLASE_BOTON_PRIMARIO}>
                {ocupado ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </article>
  );
}
