"use client";

import { motion } from "motion/react";
import { Drama, Drum, Footprints, Guitar, Music, Sparkles, type LucideIcon } from "lucide-react";

type Escuela = {
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
};

/**
 * Contenido estático a propósito (sin Firestore), igual que Actuaciones.
 * Las descripciones son un borrador: reemplazar por el texto oficial de cada elenco.
 */
const ESCUELAS_ARTISTICAS: Escuela[] = [
  {
    nombre: "Teatro",
    descripcion:
      "Expresión corporal, voz e improvisación para crear montajes escénicos que desarrollan la confianza y el trabajo en equipo.",
    icono: Drama,
  },
  {
    nombre: "Danza",
    descripcion:
      "Formación en técnica, ritmo y coreografía, explorando el movimiento como lenguaje artístico y medio de expresión.",
    icono: Footprints,
  },
];

const ELENCOS_MUSICALES: Escuela[] = [
  {
    nombre: "Folklore",
    descripcion:
      "Rescate y difusión de la música tradicional del norte de Chile y la cosmovisión andina con instrumentos autóctonos.",
    icono: Guitar,
  },
  {
    nombre: "Banda Musical",
    descripcion:
      "Ensamble de bronces, maderas y percusión que interpreta repertorio sinfónico, popular y de marcha en eventos de la comuna.",
    icono: Drum,
  },
  {
    nombre: "Orquesta de Cuerdas",
    descripcion:
      "Violines, violas, violonchelos y contrabajos que trabajan repertorio clásico y latinoamericano en formato orquestal.",
    icono: Music,
  },
  {
    nombre: "Iniciación Musical",
    descripcion:
      "Primer acercamiento a la música para los más pequeños: ritmo, lectura musical y exploración de instrumentos a través del juego.",
    icono: Sparkles,
  },
];

function TarjetaEscuela({
  escuela,
  indice,
  acento,
}: {
  escuela: Escuela;
  indice: number;
  acento: "primary" | "terracotta";
}) {
  const Icono = escuela.icono;
  const colorIcono =
    acento === "primary" ? "bg-primary/10 text-primary" : "bg-terracotta/10 text-terracotta";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: indice * 0.1, duration: 0.5 }}
      className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col gap-4"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorIcono}`}>
        <Icono className="w-6 h-6" />
      </div>
      <div className="space-y-2">
        <h4 className="font-extrabold text-lg text-text-dark">{escuela.nombre}</h4>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">{escuela.descripcion}</p>
      </div>
    </motion.div>
  );
}

export function Escuelas() {
  return (
    <section id="escuelas" className="pb-24 bg-white relative z-10 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
        >
          <span className="text-terracotta font-extrabold tracking-widest uppercase text-xs">
            Nuestras Escuelas
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-text-dark leading-tight">
            Escuelas Artísticas
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Calambanda reúne distintas disciplinas para que cada niño y joven encuentre su forma de
            expresarse a través del arte.
          </p>
        </motion.div>

        <div className="space-y-14">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black text-text-dark whitespace-nowrap">
                Artes Escénicas
              </h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ESCUELAS_ARTISTICAS.map((escuela, indice) => (
                <TarjetaEscuela
                  key={escuela.nombre}
                  escuela={escuela}
                  indice={indice}
                  acento="terracotta"
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black text-text-dark whitespace-nowrap">
                Elencos Musicales
              </h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ELENCOS_MUSICALES.map((escuela, indice) => (
                <TarjetaEscuela
                  key={escuela.nombre}
                  escuela={escuela}
                  indice={indice}
                  acento="primary"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
