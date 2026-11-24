"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { CLASE_CAMPO, CLASE_ETIQUETA } from "@/components/ui/estilos";
import { sinOptimizar } from "@/lib/landing/imagen";
import { LIMITES_LANDING } from "@/lib/landing/validacion";
import type { ImagenLanding, ImagenPortada } from "@/types";
import { BotonSubirImagen } from "./BotonSubirImagen";

interface FotosPortadaProps {
  fotos: ImagenPortada[];
  onCambio: (fotos: ImagenPortada[]) => void;
  onAgregar: (subidas: ImagenLanding[]) => void;
  onQuitar: (foto: ImagenPortada) => void;
  onEstadoSubida: (subiendo: boolean) => void;
}

const CLASE_ACCION = "rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30";

export function FotosPortada({ fotos, onCambio, onAgregar, onQuitar, onEstadoSubida }: FotosPortadaProps) {
  function mover(indice: number, destino: number) {
    const reordenadas = [...fotos];
    [reordenadas[indice], reordenadas[destino]] = [reordenadas[destino], reordenadas[indice]];
    onCambio(reordenadas);
  }

  return (
    <div className="space-y-3">
      <h3 className={CLASE_ETIQUETA}>Fotos del carrusel</h3>
      <p className="text-xs text-slate-600">La primera se muestra al abrir el sitio. Puedes agregar hasta {LIMITES_LANDING.maximoFotosPortada} fotos.</p>
      <ol className="space-y-3">
        {fotos.map((foto, i) => (
          <li key={foto.ruta || foto.url} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <Image src={foto.url} alt="" fill sizes="80px" unoptimized={sinOptimizar(foto.url)} className="object-cover" />
              </div>
              <div className="flex flex-wrap justify-end">
                <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label={`Subir foto ${i + 1}`} className={CLASE_ACCION}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => mover(i, i + 1)} disabled={i === fotos.length - 1} aria-label={`Bajar foto ${i + 1}`} className={CLASE_ACCION}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCambio(fotos.filter((_, indice) => i !== indice));
                    onQuitar(foto);
                  }}
                  disabled={fotos.length === 1}
                  aria-label={`Quitar foto ${i + 1}`}
                  className={`${CLASE_ACCION} text-red-600 hover:bg-red-50`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <label className="mt-2 block text-xs font-semibold text-slate-700">
              Descripción de la foto {i + 1}
              <input
                value={foto.alt ?? ""}
                maxLength={LIMITES_LANDING.altFotoPortada}
                onChange={(e) => onCambio(fotos.map((anterior, indice) => i === indice ? { ...anterior, alt: e.target.value } : anterior))}
                placeholder="Ej. Alumnos tocando en el teatro"
                className={`${CLASE_CAMPO} mt-1`}
              />
            </label>
          </li>
        ))}
      </ol>
      <BotonSubirImagen
        carpeta="portada"
        etiqueta="Agregar fotos"
        multiple
        disponibles={LIMITES_LANDING.maximoFotosPortada - fotos.length}
        onEstadoSubida={onEstadoSubida}
        onSubidas={onAgregar}
      />
    </div>
  );
}
