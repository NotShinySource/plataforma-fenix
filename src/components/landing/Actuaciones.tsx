"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActuacionModal, type Actuacion } from "./ActuacionModal";

/**
 * Contenido estático a propósito (sin Firestore): la gestión dinámica de la
 * Landing Page es responsabilidad del Admin completo, fuera de alcance hoy.
 *
 * - `imagenes`: la primera es la portada de la tarjeta; el resto aparece en el carrusel del pop-up.
 * - `enlaces` (opcional): links relacionados (video, nota de prensa, álbum, etc.).
 *   Si se omite o queda vacío, la sección no se muestra.
 */
const ACTUACIONES: Actuacion[] = [
  {
    id: 1,
    titulo: "Concierto Aniversario X",
    fecha: "12 Noviembre, 2025",
    lugar: "Teatro Municipal de Calama",
    imagenes: [
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=1200",
    ],
    descripcion:
      "Celebración de nuestra primera década fomentando el arte y la música en la juventud loína.",
    // TODO: reemplazar por el link real de la presentación.
    enlaces: [{ etiqueta: "Ver video de la presentación", url: "https://www.youtube.com/" }],
  },
  {
    id: 2,
    titulo: "Presentación Teatro Municipal",
    fecha: "28 Septiembre, 2025",
    lugar: "Gran Sala de Calama",
    imagenes: [
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200",
    ],
    descripcion:
      "Nuestros elencos de bronces y coro deleitaron con un repertorio sinfónico latinoamericano.",
  },
  {
    id: 3,
    titulo: "Encuentro de Orquestas del Norte",
    fecha: "04 Julio, 2025",
    lugar: "Ex Parque de los Lolos",
    imagenes: [
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=1200",
    ],
    descripcion:
      "Anfitriones del encuentro regional que congregó a más de 300 jóvenes músicos nortinos.",
  },
  {
    id: 4,
    titulo: "Concierto de Navidad Patrimonial",
    fecha: "20 Diciembre, 2025",
    lugar: "Parque José Saavedra",
    imagenes: [
      "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200",
    ],
    descripcion:
      "Villancicos andinos y clásicos universales interpretados bajo las estrellas para la comunidad de Calama.",
  },
  {
    id: 5,
    titulo: "Muestra de Fin de Año Calambanda",
    fecha: "15 Enero, 2026",
    lugar: "Sede Ex Parque de los Lolos",
    imagenes: [
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200",
    ],
    descripcion:
      "Todas nuestras escuelas artísticas compartieron escenario para mostrar a las familias el trabajo de todo un año.",
  },
  {
    id: 6,
    titulo: "Festival Andino del Loa",
    fecha: "22 Marzo, 2026",
    lugar: "Plaza 23 de Marzo",
    imagenes: [
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=1200",
    ],
    descripcion:
      "El elenco de Folklore y la Banda Musical celebraron el aniversario de Calama con repertorio tradicional nortino.",
  },
];

export function Actuaciones() {
  const [seleccionada, setSeleccionada] = useState<Actuacion | null>(null);
  const cerrarModal = useCallback(() => setSeleccionada(null), []);

  const carruselRef = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(0);

  const actualizarPaginacion = useCallback(() => {
    const carrusel = carruselRef.current;
    if (!carrusel) return;
    const total = Math.max(1, Math.ceil(carrusel.scrollWidth / carrusel.clientWidth - 0.01));
    const maxScroll = carrusel.scrollWidth - carrusel.clientWidth;
    const actual =
      maxScroll <= 0 ? 0 : Math.round((carrusel.scrollLeft / maxScroll) * (total - 1));
    setPaginas(total);
    setPaginaActual(actual);
  }, []);

  useEffect(() => {
    const carrusel = carruselRef.current;
    if (!carrusel) return;
    const observador = new ResizeObserver(actualizarPaginacion);
    observador.observe(carrusel);
    carrusel.addEventListener("scroll", actualizarPaginacion, { passive: true });
    return () => {
      observador.disconnect();
      carrusel.removeEventListener("scroll", actualizarPaginacion);
    };
  }, [actualizarPaginacion]);

  function desplazar(direccion: 1 | -1) {
    const carrusel = carruselRef.current;
    if (!carrusel) return;
    carrusel.scrollBy({ left: direccion * carrusel.clientWidth, behavior: "smooth" });
  }

  function irAPagina(pagina: number) {
    const carrusel = carruselRef.current;
    if (!carrusel) return;
    const maxScroll = carrusel.scrollWidth - carrusel.clientWidth;
    carrusel.scrollTo({ left: (maxScroll * pagina) / Math.max(1, paginas - 1), behavior: "smooth" });
  }

  return (
    <section id="actuaciones" className="py-24 bg-slate-50/50 relative z-10 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
        >
          <span className="text-primary font-extrabold tracking-widest uppercase text-xs">
            Galería de Impacto
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-text-dark leading-tight">
            Actuaciones Destacadas
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Nuestros alumnos brillan en escenarios locales y regionales, compartiendo el fruto de
            su esfuerzo con la comunidad.
          </p>
        </motion.div>

        <motion.div
          ref={carruselRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth py-4 -my-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ACTUACIONES.map((actuacion) => (
            <button
              type="button"
              key={actuacion.id}
              onClick={() => setSeleccionada(actuacion)}
              className="shrink-0 snap-start w-full md:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-6rem)/4)] text-left bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagen externa, sin next.config.remotePatterns configurado para este dominio todavía */}
                <img
                  src={actuacion.imagenes[0]}
                  alt={actuacion.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider shadow-sm border border-slate-100">
                  {actuacion.lugar}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    {actuacion.fecha}
                  </span>
                  <h3 className="font-extrabold text-lg text-text-dark group-hover:text-primary transition-colors line-clamp-1">
                    {actuacion.titulo}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 font-medium">
                    {actuacion.descripcion}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between text-primary text-xs font-bold group-hover:text-primary-dark">
                  <span>Ver registro fotográfico</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </motion.div>

        {paginas > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => desplazar(-1)}
              disabled={paginaActual === 0}
              aria-label="Actuaciones anteriores"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-slate-200 text-primary shadow-sm hover:bg-primary hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: paginas }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => irAPagina(i)}
                  aria-label={`Ir a la página ${i + 1}`}
                  aria-current={i === paginaActual}
                  className={`h-2 rounded-full transition-all ${
                    i === paginaActual ? "w-6 bg-primary" : "w-2 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => desplazar(1)}
              disabled={paginaActual === paginas - 1}
              aria-label="Actuaciones siguientes"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-slate-200 text-primary shadow-sm hover:bg-primary hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <ActuacionModal actuacion={seleccionada} onCerrar={cerrarModal} />
    </section>
  );
}
