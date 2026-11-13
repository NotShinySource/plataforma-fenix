"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Landmark, Plus, X } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import {
  claveComparacion,
  normalizarEspacios,
  validarDatosEscuela,
  LARGO_MAXIMO_NIVEL,
  LARGO_MAXIMO_NOMBRE_ESCUELA,
  MAXIMO_NIVELES,
} from "@/lib/elencos";
import { crearEscuelaAction } from "@/app/(intranet)/admin/elencos/actions";
import { NIVELES_PREDETERMINADOS, type TipoEscuela } from "@/types";

const OPCIONES_TIPO: { valor: TipoEscuela; titulo: string; detalle: string }[] = [
  { valor: "conjunto", titulo: "Conjunto", detalle: "Coro, banda, orquesta..." },
  { valor: "instrumento", titulo: "Instrumento", detalle: "Piano, guitarra..." },
];

interface ModalNuevaEscuelaProps {
  onCerrar: () => void;
  onCreada: () => void;
}

/** Alta de una escuela con sus niveles, que después ya no se pueden cambiar. */
export function ModalNuevaEscuela({ onCerrar, onCreada }: ModalNuevaEscuelaProps) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoEscuela>("conjunto");
  const [niveles, setNiveles] = useState<string[]>([...NIVELES_PREDETERMINADOS]);
  const [nivelNuevo, setNivelNuevo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function agregarNivel() {
    const nivel = normalizarEspacios(nivelNuevo);
    if (!nivel) return;
    if (niveles.some((existente) => claveComparacion(existente) === claveComparacion(nivel))) {
      setError("Ese nivel ya está en la lista.");
      return;
    }
    if (niveles.length >= MAXIMO_NIVELES) {
      setError(`Una escuela puede tener hasta ${MAXIMO_NIVELES} niveles.`);
      return;
    }
    setNiveles([...niveles, nivel]);
    setNivelNuevo("");
    setError(null);
  }

  function handleTeclaNivel(evento: KeyboardEvent<HTMLInputElement>) {
    // Enter agrega el nivel en vez de enviar el formulario.
    if (evento.key === "Enter") {
      evento.preventDefault();
      agregarNivel();
    }
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const validacion = validarDatosEscuela({ nombre, tipo, niveles });
    if (!validacion.ok) {
      setError(validacion.error);
      return;
    }
    if (!auth.currentUser) return;

    setEnviando(true);
    setError(null);
    try {
      const resultado = await crearEscuelaAction({
        ...validacion.datos,
        idTokenAdmin: await auth.currentUser.getIdToken(),
      });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo crear la escuela.");
        setEnviando(false);
        return;
      }
      onCreada();
    } catch {
      setError("No se pudo crear la escuela. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo="Nueva escuela"
      subtitulo="Sus niveles no se podrán cambiar después"
      icono={Landmark}
      bloqueado={enviando}
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="escuela-nombre" className={CLASE_ETIQUETA}>
            Nombre
          </label>
          <input
            id="escuela-nombre"
            type="text"
            placeholder={tipo === "conjunto" ? "Ej: Banda de Concierto" : "Ej: Piano"}
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            maxLength={LARGO_MAXIMO_NOMBRE_ESCUELA}
            autoFocus
            className={CLASE_CAMPO}
          />
        </div>

        <fieldset>
          <legend className={CLASE_ETIQUETA}>Tipo</legend>
          <div className="grid grid-cols-2 gap-3">
            {OPCIONES_TIPO.map((opcion) => {
              const activa = tipo === opcion.valor;
              return (
                <label
                  key={opcion.valor}
                  className={`cursor-pointer rounded-2xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 ${
                    activa ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="escuela-tipo"
                    value={opcion.valor}
                    checked={activa}
                    onChange={() => setTipo(opcion.valor)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-extrabold text-text-dark">{opcion.titulo}</span>
                  <span className="block text-xs font-semibold text-slate-600 mt-0.5">
                    {opcion.detalle}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="escuela-nivel-nuevo" className={CLASE_ETIQUETA}>
            Niveles
          </label>
          <ul className="flex flex-wrap gap-2 mb-2" aria-label="Niveles de la escuela">
            {niveles.map((nivel) => (
              <li
                key={nivel}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary pl-3 pr-1 py-1 rounded-full text-xs font-bold"
              >
                {nivel}
                <button
                  type="button"
                  onClick={() => setNiveles(niveles.filter((otro) => otro !== nivel))}
                  aria-label={`Quitar el nivel ${nivel}`}
                  className="p-0.5 rounded-full hover:bg-primary/20"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
            {niveles.length === 0 && (
              <li className="text-xs font-semibold text-slate-600">Agrega al menos un nivel.</li>
            )}
          </ul>
          <div className="flex gap-2">
            <input
              id="escuela-nivel-nuevo"
              type="text"
              placeholder="Ej: Niños"
              value={nivelNuevo}
              onChange={(evento) => setNivelNuevo(evento.target.value)}
              onKeyDown={handleTeclaNivel}
              maxLength={LARGO_MAXIMO_NIVEL}
              className={CLASE_CAMPO}
            />
            <button
              type="button"
              onClick={agregarNivel}
              className="inline-flex items-center gap-1 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1.5 px-1">
            Vienen Inicial, Intermedio y Avanzado. Quita o agrega los que use esta escuela.
          </p>
        </div>

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
            {enviando ? "Creando..." : "Crear escuela"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
