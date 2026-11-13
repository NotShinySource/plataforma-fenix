"use client";

import { useState, type FormEvent } from "react";
import { Route } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { LARGO_MAXIMO_NOMBRE_ITINERANCIA, validarDatosItinerancia } from "@/lib/elencos";
import { crearItineranciaAction } from "@/app/(intranet)/admin/elencos/actions";

interface ModalNuevaItineranciaProps {
  onCerrar: () => void;
  onCreada: (elencoId: string) => void;
}

/**
 * Alta de una itinerancia: grupo temporal con nombre libre (por ejemplo, el
 * elenco de un musical), con fechas opcionales.
 */
export function ModalNuevaItinerancia({ onCerrar, onCreada }: ModalNuevaItineranciaProps) {
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const validacion = validarDatosItinerancia({ nombre, fechaInicio, fechaTermino });
    if (!validacion.ok) {
      setError(validacion.error);
      return;
    }
    if (!auth.currentUser) return;

    setEnviando(true);
    setError(null);
    try {
      const resultado = await crearItineranciaAction({
        ...validacion.datos,
        descripcion,
        idTokenAdmin: await auth.currentUser.getIdToken(),
      });
      if (!resultado.ok || !resultado.elencoId) {
        setError(resultado.error ?? "No se pudo crear la itinerancia.");
        setEnviando(false);
        return;
      }
      onCreada(resultado.elencoId);
    } catch {
      setError("No se pudo crear la itinerancia. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo="Nueva itinerancia"
      subtitulo="Grupo temporal, con alumnos de varios elencos"
      icono={Route}
      bloqueado={enviando}
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="itinerancia-nombre" className={CLASE_ETIQUETA}>
            Nombre
          </label>
          <input
            id="itinerancia-nombre"
            type="text"
            placeholder="Ej: Musical El Rey León 2026"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            maxLength={LARGO_MAXIMO_NOMBRE_ITINERANCIA}
            autoFocus
            className={CLASE_CAMPO}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="itinerancia-inicio" className={CLASE_ETIQUETA}>
              Inicio <span className="normal-case font-semibold text-slate-600">(opcional)</span>
            </label>
            <input
              id="itinerancia-inicio"
              type="date"
              value={fechaInicio}
              onChange={(evento) => setFechaInicio(evento.target.value)}
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="itinerancia-termino" className={CLASE_ETIQUETA}>
              Término <span className="normal-case font-semibold text-slate-600">(opcional)</span>
            </label>
            <input
              id="itinerancia-termino"
              type="date"
              value={fechaTermino}
              min={fechaInicio || undefined}
              onChange={(evento) => setFechaTermino(evento.target.value)}
              className={CLASE_CAMPO}
            />
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-600 px-1 -mt-2">
          Si hay fechas, sus clases del horario solo se programan entre ellas. Al terminar,
          archívala para conservar su historial.
        </p>

        <div>
          <label htmlFor="itinerancia-descripcion" className={CLASE_ETIQUETA}>
            Descripción <span className="normal-case font-semibold text-slate-600">(opcional)</span>
          </label>
          <textarea
            id="itinerancia-descripcion"
            placeholder="Para qué actividad se forma..."
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            maxLength={500}
            rows={3}
            className={`${CLASE_CAMPO} resize-none`}
          />
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
            {enviando ? "Creando..." : "Crear itinerancia"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
