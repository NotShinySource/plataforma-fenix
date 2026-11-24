"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { agruparPorCategoria } from "@/lib/landing/preguntas";
import { Modal } from "@/components/ui/Modal";
import { CLASE_BOTON_SECUNDARIO, CLASE_ERROR } from "@/components/ui/estilos";
import { eliminarPreguntaAction, moverPreguntaAction } from "@/app/(intranet)/admin/landing/actions";
import type { ConId, PreguntaFrecuente } from "@/types";
import { ModalPregunta } from "./ModalPregunta";

type Ventana =
  | { tipo: "editar"; pregunta: ConId<PreguntaFrecuente> | null }
  | { tipo: "eliminar"; pregunta: ConId<PreguntaFrecuente> }
  | null;

interface ListaPreguntasProps {
  preguntas: ConId<PreguntaFrecuente>[];
  /** Vuelve a pedir la Landing al servidor después de un cambio. */
  onCambio: () => void;
}

/** Preguntas frecuentes agrupadas por categoría, con su orden y edición. */
export function ListaPreguntas({ preguntas, onCambio }: ListaPreguntasProps) {
  const [ventana, setVentana] = useState<Ventana>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grupos = agruparPorCategoria(preguntas);
  const categorias = grupos.map((grupo) => grupo.categoria);

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
          <h2 className="text-lg font-extrabold text-text-dark">Preguntas frecuentes</h2>
          <p className="text-sm text-slate-600 font-medium">
            Se muestran en la Landing agrupadas por categoría, en este orden.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVentana({ tipo: "editar", pregunta: null })}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Nueva pregunta
        </button>
      </div>

      {error && (
        <div className="px-6 pt-4">
          <p role="alert" className={CLASE_ERROR}>
            {error}
          </p>
        </div>
      )}

      {grupos.length === 0 ? (
        <p className="p-8 text-center text-sm font-semibold text-slate-600">
          Todavía no hay preguntas. La sección no aparece en el sitio hasta que agregues una.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {grupos.map((grupo) => (
            <div key={grupo.categoria}>
              <h3 className="px-6 sm:px-8 pt-5 pb-1 text-xs font-bold uppercase tracking-widest text-terracotta">
                {grupo.categoria}
              </h3>
              <ul className="divide-y divide-slate-50">
                {grupo.preguntas.map((pregunta, i) => (
                  <li
                    key={pregunta.id}
                    className="px-4 sm:px-8 py-3 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2"
                  >
                    <p className="flex-1 min-w-0 font-semibold text-text-dark">{pregunta.pregunta}</p>
                    {!pregunta.publicada && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                        Borrador
                      </span>
                    )}
                    <div className="flex items-center justify-end gap-1 flex-shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() =>
                          ejecutar(pregunta.id, (idTokenAdmin) =>
                            moverPreguntaAction({ idTokenAdmin, id: pregunta.id, direccion: -1 })
                          )
                        }
                        disabled={i === 0 || trabajando !== null}
                        aria-label={`Subir "${pregunta.pregunta}"`}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          ejecutar(pregunta.id, (idTokenAdmin) =>
                            moverPreguntaAction({ idTokenAdmin, id: pregunta.id, direccion: 1 })
                          )
                        }
                        disabled={i === grupo.preguntas.length - 1 || trabajando !== null}
                        aria-label={`Bajar "${pregunta.pregunta}"`}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setVentana({ tipo: "editar", pregunta })}
                        aria-label={`Editar "${pregunta.pregunta}"`}
                        className="p-2 rounded-xl text-primary hover:bg-primary/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setVentana({ tipo: "eliminar", pregunta })}
                        aria-label={`Eliminar "${pregunta.pregunta}"`}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {ventana?.tipo === "editar" && (
        <ModalPregunta
          pregunta={ventana.pregunta}
          categorias={categorias}
          onCerrar={() => setVentana(null)}
          onGuardada={() => {
            setVentana(null);
            onCambio();
          }}
        />
      )}

      {ventana?.tipo === "eliminar" && (
        <Modal
          titulo="Eliminar pregunta"
          subtitulo={ventana.pregunta.pregunta}
          icono={AlertTriangle}
          tono="peligro"
          ancho="sm"
          bloqueado={trabajando !== null}
          onCerrar={() => setVentana(null)}
        >
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Se quita del sitio. Esta acción no se puede deshacer; si solo quieres ocultarla, edítala
            y desmarca &quot;Publicada&quot;.
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
                ejecutar(ventana.pregunta.id, (idTokenAdmin) =>
                  eliminarPreguntaAction({ idTokenAdmin, id: ventana.pregunta.id })
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
