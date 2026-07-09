"use client";

import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

/**
 * Contenido estático a propósito (sin Firestore): la gestión dinámica de la
 * Landing Page es responsabilidad del Admin completo, fuera de alcance hoy.
 */
const ACTUACIONES = [
  {
    id: 1,
    titulo: "Concierto Aniversario X",
    fecha: "12 Noviembre, 2025",
    lugar: "Teatro Municipal de Calama",
    imagen:
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
    descripcion:
      "Celebración de nuestra primera década fomentando el arte y la música en la juventud loína.",
  },
  {
    id: 2,
    titulo: "Presentación Teatro Municipal",
    fecha: "28 Septiembre, 2025",
    lugar: "Gran Sala de Calama",
    imagen:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=800",
    descripcion:
      "Nuestros elencos de bronces y coro deleitaron con un repertorio sinfónico latinoamericano.",
  },
  {
    id: 3,
    titulo: "Encuentro de Orquestas del Norte",
    fecha: "04 Julio, 2025",
    lugar: "Ex Parque de los Lolos",
    imagen:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800",
    descripcion:
      "Anfitriones del encuentro regional que congregó a más de 300 jóvenes músicos nortinos.",
  },
  {
    id: 4,
    titulo: "Concierto de Navidad Patrimonial",
    fecha: "20 Diciembre, 2025",
    lugar: "Parque José Saavedra",
    imagen:
      "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=800",
    descripcion:
      "Villancicos andinos y clásicos universales interpretados bajo las estrellas para la comunidad de Calama.",
  },
];

export function Actuaciones() {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {ACTUACIONES.map((actuacion, indice) => (
            <motion.div
              key={actuacion.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: indice * 0.1, duration: 0.5 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:shadow-primary/5 transition-all group"
            >
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagen externa, sin next.config.remotePatterns configurado para este dominio todavía */}
                <img
                  src={actuacion.imagen}
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
                <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between text-primary text-xs font-bold group-hover:text-primary-dark cursor-pointer">
                  <span>Ver registro fotográfico</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
