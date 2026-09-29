"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, MapPin, X } from "lucide-react";

export type EnlaceActuacion = {
  etiqueta: string;
  url: string;
};

export type Actuacion = {
  id: number;
  titulo: string;
  fecha: string;
  lugar: string;
  descripcion: string;
  /** La primera imagen se usa como portada de la tarjeta. */
  imagenes: string[];
  enlaces?: EnlaceActuacion[];
};

type Props = {
  actuacion: Actuacion | null;
  onCerrar: () => void;
};

const suscribirseNoop = () => () => {};

export function ActuacionModal({ actuacion, onCerrar }: Props) {
  // En el servidor no existe `document`: el portal solo se monta en el cliente.
  const enCliente = useSyncExternalStore(suscribirseNoop, () => true, () => false);
  if (!enCliente) return null;

  // Portal a <body> para escapar del stacking context de la sección (z-10),
  // que si no deja al footer por encima del pop-up.
  return createPortal(
    <AnimatePresence>
      {actuacion && <ContenidoModal key={actuacion.id} actuacion={actuacion} onCerrar={onCerrar} />}
    </AnimatePresence>,
    document.body,
  );
}

function ContenidoModal({ actuacion, onCerrar }: { actuacion: Actuacion; onCerrar: () => void }) {
  const [indice, setIndice] = useState(0);
  const [direccion, setDireccion] = useState(1);
  const inicioToqueX = useRef<number | null>(null);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);

  const total = actuacion.imagenes.length;

  const irA = useCallback(
    (nuevoIndice: number) => {
      if (total === 0) return;
      setDireccion(nuevoIndice > indice ? 1 : -1);
      setIndice((nuevoIndice + total) % total);
    },
    [indice, total],
  );

  const anterior = useCallback(() => {
    setDireccion(-1);
    setIndice((actual) => (actual - 1 + total) % total);
  }, [total]);

  const siguiente = useCallback(() => {
    setDireccion(1);
    setIndice((actual) => (actual + 1) % total);
  }, [total]);

  useEffect(() => {
    function handleTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCerrar();
      else if (evento.key === "ArrowLeft" && total > 1) anterior();
      else if (evento.key === "ArrowRight" && total > 1) siguiente();
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleTecla);
    botonCerrarRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", handleTecla);
    };
  }, [onCerrar, anterior, siguiente, total]);

  function handleToqueInicio(evento: React.TouchEvent) {
    inicioToqueX.current = evento.touches[0].clientX;
  }

  function handleToqueFin(evento: React.TouchEvent) {
    if (inicioToqueX.current === null || total < 2) return;
    const delta = evento.changedTouches[0].clientX - inicioToqueX.current;
    if (delta > 50) anterior();
    else if (delta < -50) siguiente();
    inicioToqueX.current = null;
  }

  const enlaces = actuacion.enlaces ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`actuacion-titulo-${actuacion.id}`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        onClick={(evento) => evento.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
      >
        <button
          ref={botonCerrarRef}
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-600 hover:text-primary shadow-sm border border-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Carrusel */}
        <div
          className="relative aspect-[16/10] bg-slate-900 overflow-hidden rounded-t-3xl"
          onTouchStart={handleToqueInicio}
          onTouchEnd={handleToqueFin}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={indice}
              src={actuacion.imagenes[indice]}
              alt={`${actuacion.titulo} — imagen ${indice + 1} de ${total}`}
              initial={{ opacity: 0, x: direccion * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direccion * -60 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          </AnimatePresence>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={anterior}
                aria-label="Imagen anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-text-dark shadow-md transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={siguiente}
                aria-label="Imagen siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-text-dark shadow-md transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {actuacion.imagenes.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => irA(i)}
                    aria-label={`Ir a la imagen ${i + 1}`}
                    aria-current={i === indice}
                    className={`h-2 rounded-full transition-all ${
                      i === indice ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Miniaturas */}
        {total > 1 && (
          <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
            {actuacion.imagenes.map((imagen, i) => (
              <button
                key={imagen + i}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className={`shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === indice ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- imagen externa, sin next.config.remotePatterns configurado para este dominio todavía */}
                <img src={imagen} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Información del evento */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                {actuacion.fecha}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {actuacion.lugar}
              </span>
            </div>
            <h3
              id={`actuacion-titulo-${actuacion.id}`}
              className="text-2xl md:text-3xl font-black text-text-dark leading-tight"
            >
              {actuacion.titulo}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">{actuacion.descripcion}</p>
          </div>

          {enlaces.length > 0 && (
            <div className="pt-5 border-t border-slate-100 space-y-3">
              <span className="text-primary font-extrabold tracking-widest uppercase text-xs block">
                Enlaces relacionados
              </span>
              <div className="flex flex-wrap gap-3">
                {enlaces.map((enlace) => (
                  <a
                    key={enlace.url}
                    href={enlace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-sm transition-all"
                  >
                    {enlace.etiqueta}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
