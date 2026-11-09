"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Plus, Theater, Trash2, X } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { sinOptimizar } from "@/lib/landing/imagen";
import { LIMITES_LANDING } from "@/lib/landing/validacion";
import { descartarImagenSubida } from "@/services/landing.service";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_AREA_TEXTO,
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { guardarActuacionAction } from "@/app/(intranet)/admin/landing/actions";
import type { ActuacionLanding, ConId, EnlaceActuacion, ImagenLanding } from "@/types";
import { BotonSubirImagen } from "./BotonSubirImagen";

type Formulario = Omit<ActuacionLanding, "orden">;

const VACIA: Formulario = {
  titulo: "",
  fecha: "",
  lugar: "",
  descripcion: "",
  imagenes: [],
  enlaces: [],
  publicada: true,
};

interface ModalActuacionProps {
  /** Sin actuación, la ventana crea una nueva. */
  actuacion: ConId<ActuacionLanding> | null;
  onCerrar: () => void;
  onGuardada: () => void;
}

export function ModalActuacion({ actuacion, onCerrar, onGuardada }: ModalActuacionProps) {
  const [datos, setDatos] = useState<Formulario>(() =>
    actuacion
      ? {
          titulo: actuacion.titulo,
          fecha: actuacion.fecha,
          lugar: actuacion.lugar,
          descripcion: actuacion.descripcion,
          imagenes: actuacion.imagenes,
          enlaces: actuacion.enlaces,
          publicada: actuacion.publicada,
        }
      : VACIA
  );
  // Fotos subidas en esta ventana: si se cancela, se borran de Storage.
  const [subidasNuevas, setSubidasNuevas] = useState<ImagenLanding[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
  }

  function moverImagen(indice: number, direccion: -1 | 1) {
    const imagenes = [...datos.imagenes];
    [imagenes[indice], imagenes[indice + direccion]] = [imagenes[indice + direccion], imagenes[indice]];
    cambiar("imagenes", imagenes);
  }

  function quitarImagen(imagen: ImagenLanding) {
    cambiar(
      "imagenes",
      datos.imagenes.filter((i) => i !== imagen)
    );
    // Una foto recién subida y quitada antes de guardar no la va a borrar nadie más.
    if (subidasNuevas.includes(imagen)) {
      setSubidasNuevas((previas) => previas.filter((i) => i !== imagen));
      descartarImagenSubida(imagen);
    }
  }

  function cambiarEnlace(indice: number, enlace: EnlaceActuacion) {
    cambiar(
      "enlaces",
      datos.enlaces.map((e, i) => (i === indice ? enlace : e))
    );
  }

  function cancelar() {
    if (guardando) return;
    subidasNuevas.forEach(descartarImagenSubida);
    onCerrar();
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!auth.currentUser) return;
    setGuardando(true);
    setError(null);
    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await guardarActuacionAction({ idTokenAdmin, id: actuacion?.id, actuacion: datos });
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      onGuardada();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const disponibles = LIMITES_LANDING.maximoImagenes - datos.imagenes.length;

  return (
    <Modal
      titulo={actuacion ? "Editar actuación" : "Nueva actuación"}
      subtitulo={actuacion?.titulo}
      icono={Theater}
      ancho="lg"
      bloqueado={guardando}
      onCerrar={cancelar}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="actuacion-titulo" className={CLASE_ETIQUETA}>
            Título
          </label>
          <input
            id="actuacion-titulo"
            value={datos.titulo}
            maxLength={LIMITES_LANDING.tituloActuacion}
            onChange={(e) => cambiar("titulo", e.target.value)}
            autoFocus
            className={CLASE_CAMPO}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="actuacion-fecha" className={CLASE_ETIQUETA}>
              Fecha
            </label>
            <input
              id="actuacion-fecha"
              type="date"
              value={datos.fecha}
              onChange={(e) => cambiar("fecha", e.target.value)}
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="actuacion-lugar" className={CLASE_ETIQUETA}>
              Lugar
            </label>
            <input
              id="actuacion-lugar"
              value={datos.lugar}
              maxLength={LIMITES_LANDING.lugar}
              onChange={(e) => cambiar("lugar", e.target.value)}
              className={CLASE_CAMPO}
            />
          </div>
        </div>
        <div>
          <label htmlFor="actuacion-descripcion" className={CLASE_ETIQUETA}>
            Descripción
          </label>
          <textarea
            id="actuacion-descripcion"
            rows={3}
            value={datos.descripcion}
            maxLength={LIMITES_LANDING.descripcionActuacion}
            onChange={(e) => cambiar("descripcion", e.target.value)}
            className={CLASE_AREA_TEXTO}
          />
        </div>

        <div className="space-y-3">
          <span className={CLASE_ETIQUETA}>
            Fotos ({datos.imagenes.length} de {LIMITES_LANDING.maximoImagenes}) · la primera es la portada
          </span>
          {datos.imagenes.length > 0 && (
            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {datos.imagenes.map((imagen, i) => (
                <li key={imagen.url} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[4/3]">
                  <Image
                    src={imagen.url}
                    alt={`Foto ${i + 1}`}
                    fill
                    sizes="140px"
                    unoptimized={sinOptimizar(imagen.url)}
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Portada
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                    <button
                      type="button"
                      onClick={() => moverImagen(i, -1)}
                      disabled={i === 0}
                      aria-label={`Mover la foto ${i + 1} antes`}
                      className="p-1 text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => quitarImagen(imagen)}
                      aria-label={`Quitar la foto ${i + 1}`}
                      className="p-1 text-white hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moverImagen(i, 1)}
                      disabled={i === datos.imagenes.length - 1}
                      aria-label={`Mover la foto ${i + 1} después`}
                      className="p-1 text-white disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <BotonSubirImagen
            carpeta="actuaciones"
            etiqueta="Agregar fotos"
            multiple
            disponibles={disponibles}
            onSubidas={(nuevas) => {
              setDatos((actual) => ({ ...actual, imagenes: [...actual.imagenes, ...nuevas] }));
              setSubidasNuevas((previas) => [...previas, ...nuevas]);
            }}
          />
        </div>

        <div className="space-y-2">
          <span className={CLASE_ETIQUETA}>Enlaces (video, prensa…), opcionales</span>
          {datos.enlaces.map((enlace, i) => (
            <div key={i} className="flex gap-2">
              <input
                aria-label={`Enlace ${i + 1}: texto`}
                placeholder="Ver video"
                value={enlace.etiqueta}
                maxLength={LIMITES_LANDING.enlaceEtiqueta}
                onChange={(e) => cambiarEnlace(i, { ...enlace, etiqueta: e.target.value })}
                className={`${CLASE_CAMPO} sm:max-w-[10rem]`}
              />
              <input
                aria-label={`Enlace ${i + 1}: dirección`}
                placeholder="https://..."
                type="url"
                value={enlace.url}
                maxLength={LIMITES_LANDING.enlaceUrl}
                onChange={(e) => cambiarEnlace(i, { ...enlace, url: e.target.value })}
                className={CLASE_CAMPO}
              />
              <button
                type="button"
                onClick={() => cambiar("enlaces", datos.enlaces.filter((_, j) => j !== i))}
                aria-label={`Quitar el enlace ${i + 1}`}
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {datos.enlaces.length < LIMITES_LANDING.maximoEnlaces && (
            <button
              type="button"
              onClick={() => cambiar("enlaces", [...datos.enlaces, { etiqueta: "", url: "" }])}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              <Plus className="w-4 h-4" /> Agregar enlace
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={datos.publicada}
            onChange={(e) => cambiar("publicada", e.target.checked)}
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
          <button type="button" onClick={cancelar} disabled={guardando} className={CLASE_BOTON_SECUNDARIO}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className={CLASE_BOTON_PRIMARIO}>
            {guardando ? "Guardando..." : "Guardar actuación"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
