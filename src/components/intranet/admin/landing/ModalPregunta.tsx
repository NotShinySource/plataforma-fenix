"use client";

import { useState, type FormEvent } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_AREA_TEXTO,
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { LIMITES_PREGUNTAS, validarPregunta } from "@/lib/landing/preguntas";
import { guardarPreguntaAction } from "@/app/(intranet)/admin/landing/actions";
import type { ConId, PreguntaFrecuente } from "@/types";

interface ModalPreguntaProps {
  /** null para crear una pregunta nueva. */
  pregunta: ConId<PreguntaFrecuente> | null;
  /** Categorías existentes, para sugerirlas al escribir. */
  categorias: string[];
  onCerrar: () => void;
  onGuardada: () => void;
}

/** Alta y edición de una pregunta frecuente. */
export function ModalPregunta({ pregunta, categorias, onCerrar, onGuardada }: ModalPreguntaProps) {
  const [categoria, setCategoria] = useState(pregunta?.categoria ?? categorias[0] ?? "");
  const [texto, setTexto] = useState(pregunta?.pregunta ?? "");
  const [respuesta, setRespuesta] = useState(pregunta?.respuesta ?? "");
  const [publicada, setPublicada] = useState(pregunta?.publicada ?? true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = { categoria, pregunta: texto, respuesta, publicada };
    const validacion = validarPregunta(datos);
    if (!validacion.ok) {
      setError(validacion.error);
      return;
    }
    if (!auth.currentUser) return;

    setGuardando(true);
    setError(null);
    try {
      const resultado = await guardarPreguntaAction({
        idTokenAdmin: await auth.currentUser.getIdToken(),
        id: pregunta?.id,
        pregunta: validacion.valor,
      });
      if (!resultado.ok) {
        setError(resultado.error);
        setGuardando(false);
        return;
      }
      onGuardada();
    } catch {
      setError("No se pudo guardar la pregunta. Revisa tu conexión.");
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo={pregunta ? "Editar pregunta" : "Nueva pregunta"}
      subtitulo={pregunta?.pregunta}
      icono={MessageCircleQuestion}
      ancho="lg"
      bloqueado={guardando}
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="pregunta-categoria" className={CLASE_ETIQUETA}>
            Categoría
          </label>
          <input
            id="pregunta-categoria"
            type="text"
            list="pregunta-categorias"
            placeholder="Ej: Matrículas e inscripciones"
            value={categoria}
            onChange={(evento) => setCategoria(evento.target.value)}
            maxLength={LIMITES_PREGUNTAS.categoria}
            className={CLASE_CAMPO}
          />
          <datalist id="pregunta-categorias">
            {categorias.map((opcion) => (
              <option key={opcion} value={opcion} />
            ))}
          </datalist>
          <p className="text-xs font-semibold text-slate-600 mt-1.5 px-1">
            Elige una existente o escribe una nueva para crear otro grupo.
          </p>
        </div>

        <div>
          <label htmlFor="pregunta-texto" className={CLASE_ETIQUETA}>
            Pregunta
          </label>
          <input
            id="pregunta-texto"
            type="text"
            placeholder="Ej: ¿Desde qué edad se puede ingresar?"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            maxLength={LIMITES_PREGUNTAS.pregunta}
            className={CLASE_CAMPO}
          />
        </div>

        <div>
          <label htmlFor="pregunta-respuesta" className={CLASE_ETIQUETA}>
            Respuesta
          </label>
          <textarea
            id="pregunta-respuesta"
            rows={7}
            value={respuesta}
            onChange={(evento) => setRespuesta(evento.target.value)}
            maxLength={LIMITES_PREGUNTAS.respuesta}
            className={CLASE_AREA_TEXTO}
          />
          <p className="text-xs font-semibold text-slate-600 mt-1.5 px-1">
            Deja una línea en blanco para separar párrafos. Empieza una línea con &quot;- &quot; para
            hacer una lista.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={publicada}
            onChange={(evento) => setPublicada(evento.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          Publicada (si no, queda como borrador y no aparece en el sitio)
        </label>

        {error && (
          <p role="alert" className={CLASE_ERROR}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCerrar} disabled={guardando} className={CLASE_BOTON_SECUNDARIO}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className={CLASE_BOTON_PRIMARIO}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
