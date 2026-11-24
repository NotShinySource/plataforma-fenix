"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { sinOptimizar } from "@/lib/landing/imagen";
import type { ImagenPortada } from "@/types";

const INTERVALO_MS = 6000;
const DURACION_FUNDIDO = 0.6;
const TAMANIO_IMAGEN = "(min-width: 1280px) 468px, (min-width: 1024px) 40vw, (min-width: 480px) 416px, calc(100vw - 64px)";
const CLASE_CONTROL = "inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function CarruselPortada({ fotos }: { fotos: ImagenPortada[] }) {
  const [indice, setIndice] = useState(0);
  const [rotacionElegida, setRotacionElegida] = useState<boolean | null>(null);
  const [focoDentro, setFocoDentro] = useState(false);
  const movimientoReducido = useReducedMotion();
  const cantidad = fotos.length;
  const activa = indice % cantidad;
  const siguiente = (activa + 1) % cantidad;
  const rotacionActiva = rotacionElegida ?? !movimientoReducido;
  const rotando = cantidad > 1 && rotacionActiva && !focoDentro;
  const foto = fotos[activa];
  const duracionFundido = movimientoReducido ? 0 : DURACION_FUNDIDO;

  useEffect(() => {
    if (!rotando) return;
    const temporizador = window.setTimeout(() => setIndice(siguiente), INTERVALO_MS);
    return () => window.clearTimeout(temporizador);
  }, [rotando, siguiente]);

  return (
    <div
      role={cantidad > 1 ? "region" : undefined}
      aria-label={cantidad > 1 ? "Fotos de Calambanda" : undefined}
      aria-roledescription={cantidad > 1 ? "carrusel" : undefined}
      onFocusCapture={() => setFocoDentro(true)}
      onBlurCapture={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) setFocoDentro(false);
      }}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 shadow-inner"
    >
      <div role="img" aria-label={foto.alt || "Fotografía de Calambanda"} className="absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={foto.url}
            className="absolute inset-0"
            initial={{ opacity: movimientoReducido ? 1 : 0 }}
            animate={{ opacity: 1, transition: { duration: duracionFundido, ease: "easeInOut" } }}
            exit={{ opacity: 0, transition: { delay: duracionFundido, duration: 0 } }}
          >
            <Image
              src={foto.url}
              alt=""
              fill
              preload={indice === 0}
              unoptimized={sinOptimizar(foto.url)}
              sizes={TAMANIO_IMAGEN}
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {cantidad > 1 && (
        <>
          <Image
            key={fotos[siguiente].url}
            src={fotos[siguiente].url}
            alt=""
            aria-hidden="true"
            fill
            unoptimized={sinOptimizar(fotos[siguiente].url)}
            sizes={TAMANIO_IMAGEN}
            className="pointer-events-none opacity-0 object-cover"
          />
          <span className="sr-only" aria-live={rotando ? "off" : "polite"}>
            Foto {activa + 1} de {cantidad}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-7 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100">
            <button type="button" aria-label="Foto anterior" className={CLASE_CONTROL} onClick={() => setIndice((activa + cantidad - 1) % cantidad)}>
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Foto siguiente" className={CLASE_CONTROL} onClick={() => setIndice(siguiente)}>
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={rotacionActiva ? "Pausar rotación automática" : "Reproducir rotación automática"}
              className={CLASE_CONTROL}
              onClick={() => setRotacionElegida(!rotacionActiva)}
            >
              {rotacionActiva ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
