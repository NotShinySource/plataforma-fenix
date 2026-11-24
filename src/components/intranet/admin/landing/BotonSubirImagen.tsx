"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { ACCEPT_IMAGEN_LANDING, validarImagenLanding } from "@/lib/validacion";
import { subirImagenLanding } from "@/services/landing.service";
import type { ImagenLanding } from "@/types";

interface BotonSubirImagenProps {
  carpeta: "portada" | "actuaciones";
  etiqueta: string;
  /** Permite elegir varias fotos a la vez (galería). */
  multiple?: boolean;
  /** Cuántas más se pueden agregar, para no pasarse del máximo de la galería. */
  disponibles?: number;
  onEstadoSubida?: (subiendo: boolean) => void;
  onSubidas: (imagenes: ImagenLanding[]) => void;
}

/**
 * Elige una o varias imágenes, las valida (JPG, PNG o WebP de hasta 5 MB) y
 * las sube a Storage. Las reglas de Storage vuelven a exigir lo mismo.
 */
export function BotonSubirImagen({
  carpeta,
  etiqueta,
  multiple = false,
  disponibles = Infinity,
  onEstadoSubida,
  onSubidas,
}: BotonSubirImagenProps) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function alElegir(lista: File[]) {
    if (!lista.length) return;
    setError(null);

    if (lista.length > disponibles) {
      setError(`Puedes agregar ${disponibles} ${disponibles === 1 ? "foto más" : "fotos más"}.`);
      return;
    }
    for (const archivo of lista) {
      const problema = validarImagenLanding(archivo);
      if (problema) {
        setError(`${archivo.name}: ${problema}`);
        return;
      }
    }

    const subidas: ImagenLanding[] = [];
    onEstadoSubida?.(true);
    try {
      for (const [indice, archivo] of lista.entries()) {
        setSubiendo(lista.length > 1 ? `Subiendo ${indice + 1} de ${lista.length}...` : "Subiendo...");
        subidas.push(await subirImagenLanding(archivo, carpeta));
      }
    } catch {
      setError("No se pudo subir la imagen. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setSubiendo(null);
      if (subidas.length) onSubidas(subidas);
      onEstadoSubida?.(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={subiendo !== null || disponibles <= 0}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-primary/10 hover:bg-primary/20 text-primary transition-all disabled:opacity-60"
      >
        <ImagePlus className="w-4 h-4" />
        {subiendo ?? etiqueta}
      </button>
      <input
        ref={entrada}
        type="file"
        accept={ACCEPT_IMAGEN_LANDING}
        multiple={multiple}
        onChange={(evento) => {
          const archivos = Array.from(evento.currentTarget.files ?? []);
          evento.currentTarget.value = "";
          void alElegir(archivos);
        }}
        className="hidden"
        aria-label={etiqueta}
      />
      <p className="text-xs font-semibold text-slate-600">JPG, PNG o WebP, de hasta 5 MB.</p>
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
