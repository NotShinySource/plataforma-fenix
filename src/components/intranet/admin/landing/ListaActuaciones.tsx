"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { formatearFechaSesion } from "@/lib/format";
import { sinOptimizar } from "@/lib/landing/imagen";
import { Modal } from "@/components/ui/Modal";
import { CLASE_BOTON_SECUNDARIO, CLASE_ERROR } from "@/components/ui/estilos";
import { eliminarActuacionAction, moverActuacionAction } from "@/app/(intranet)/admin/landing/actions";
import type { ActuacionLanding, ConId } from "@/types";
import { ModalActuacion } from "./ModalActuacion";

type Ventana =
  | { tipo: "editar"; actuacion: ConId<ActuacionLanding> | null }
  | { tipo: "eliminar"; actuacion: ConId<ActuacionLanding> }
  | null;

interface ListaActuacionesProps {
  actuaciones: ConId<ActuacionLanding>[];
  /** Vuelve a pedir la Landing al servidor después de un cambio. */
  onCambio: () => void;
}

export function ListaActuaciones({ actuaciones, onCambio }: ListaActuacionesProps) {
  const [ventana, setVentana] = useState<Ventana>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(id: string, accion: (idTokenAdmin: string) => Promise<{ ok: boolean; error?: string }>) {
    if (!auth.currentUser) return;
    setTrabajando(id);
    setError(null);
    try {
      const resultado = await accion(await auth.currentUser.getIdToken());
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo completar la acción.");
        return;
      }
      setVentana(null);
      onCambio();
    } catch {
      setError("No se pudo completar la acción. Revisa tu conexión.");
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-extrabold text-text-dark">Actuaciones</h2>
          <p className="text-sm text-slate-600 font-medium">
            Se muestran en el carrusel de la Landing en este orden.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVentana({ tipo: "editar", actuacion: null })}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Nueva actuación
        </button>
      </div>

      {error && (
        <div className="px-6 pt-4">
          <p role="alert" className={CLASE_ERROR}>
            {error}
          </p>
        </div>
      )}

      {actuaciones.length === 0 ? (
        <p className="p-8 text-center text-sm font-semibold text-slate-600">
          Todavía no hay actuaciones. La sección aparece vacía en el sitio hasta que agregues una.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {actuaciones.map((actuacion, i) => (
            <li key={actuacion.id} className="p-4 sm:px-8 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2">
              <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                {actuacion.imagenes[0] && (
                  <Image
                    src={actuacion.imagenes[0].url}
                    alt=""
                    fill
                    sizes="80px"
                    unoptimized={sinOptimizar(actuacion.imagenes[0].url)}
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-dark truncate">{actuacion.titulo}</p>
                <p className="text-xs text-slate-600 font-medium truncate">
                  {formatearFechaSesion(actuacion.fecha)} · {actuacion.lugar} · {actuacion.imagenes.length}{" "}
                  {actuacion.imagenes.length === 1 ? "foto" : "fotos"}
                </p>
              </div>
              <span
                className={`hidden sm:inline px-3 py-1 rounded-full text-xs font-bold ${
                  actuacion.publicada ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {actuacion.publicada ? "Publicada" : "Borrador"}
              </span>
              <div className="flex items-center justify-end gap-1 flex-shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => ejecutar(actuacion.id, (idTokenAdmin) => moverActuacionAction({ idTokenAdmin, id: actuacion.id, direccion: -1 }))}
                  disabled={i === 0 || trabajando !== null}
                  aria-label={`Subir "${actuacion.titulo}"`}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => ejecutar(actuacion.id, (idTokenAdmin) => moverActuacionAction({ idTokenAdmin, id: actuacion.id, direccion: 1 }))}
                  disabled={i === actuaciones.length - 1 || trabajando !== null}
                  aria-label={`Bajar "${actuacion.titulo}"`}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setVentana({ tipo: "editar", actuacion })}
                  aria-label={`Editar "${actuacion.titulo}"`}
                  className="p-2 rounded-xl text-primary hover:bg-primary/10"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setVentana({ tipo: "eliminar", actuacion })}
                  aria-label={`Eliminar "${actuacion.titulo}"`}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {ventana?.tipo === "editar" && (
        <ModalActuacion
          actuacion={ventana.actuacion}
          onCerrar={() => setVentana(null)}
          onGuardada={() => {
            setVentana(null);
            onCambio();
          }}
        />
      )}

      {ventana?.tipo === "eliminar" && (
        <Modal
          titulo="Eliminar actuación"
          subtitulo={ventana.actuacion.titulo}
          icono={AlertTriangle}
          tono="peligro"
          ancho="sm"
          bloqueado={trabajando !== null}
          onCerrar={() => setVentana(null)}
        >
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Se quita del sitio y se borran sus fotos subidas. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVentana(null)}
              disabled={trabajando !== null}
              className={CLASE_BOTON_SECUNDARIO}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() =>
                ejecutar(ventana.actuacion.id, (idTokenAdmin) =>
                  eliminarActuacionAction({ idTokenAdmin, id: ventana.actuacion.id })
                )
              }
              disabled={trabajando !== null}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
            >
              {trabajando ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
