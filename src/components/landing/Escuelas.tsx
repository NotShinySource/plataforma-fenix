"use client";

import { motion } from "motion/react";
import {
  Drama,
  Drum,
  Footprints,
  Guitar,
  MicVocal,
  Music,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type Escuela = {
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
  /** Agrupaciones dentro de la misma escuela (p. ej. los coros por edad). */
  grupos?: string[];
};

/**
 * Contenido estático a propósito (sin Firestore), igual que Actuaciones.
 * Las descripciones son un borrador: reemplazar por el texto oficial de cada elenco.
 */
const ELENCOS_MUSICALES: Escuela[] = [
  {
    nombre: "Banda de Concierto",
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
    nombre: "Folklore Latinoamericano",
    descripcion:
      "Rescate y difusión de la música tradicional del norte de Chile y de Latinoamérica, con instrumentos autóctonos.",
    icono: Guitar,
  },
  {
    nombre: "Coro",
    descripcion:
      "Canto coral y técnica vocal para todas las edades, con repertorio a varias voces y presentaciones junto a los demás elencos.",
    icono: MicVocal,
    grupos: ["Niños", "Jóvenes", "Adultos"],
  },
  {
    nombre: "Iniciación Musical",
    descripcion:
      "Primer acercamiento a la música para los más pequeños: ritmo, lectura musical y exploración de instrumentos a través del juego.",
    icono: Sparkles,
  },
];

const ESCUELAS_COLABORATIVAS: Escuela[] = [
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
      {escuela.grupos && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {escuela.grupos.map((grupo) => (
            <span
              key={grupo}
              className={`px-3 py-1 rounded-full text-xs font-bold ${colorIcono}`}
            >
              {grupo}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function EncabezadoGrupo({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-black text-text-dark whitespace-nowrap">{titulo}</h3>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      {descripcion && (
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
          {descripcion}
        </p>
      )}
    </div>
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
            Calambanda reúne distintas disciplinas para que cada persona, a cualquier edad, encuentre su forma de
            expresarse a través del arte.
          </p>
        </motion.div>

        <div className="space-y-14">
          <div className="space-y-6">
            <EncabezadoGrupo titulo="Elencos Musicales" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

          <div className="space-y-6">
            <EncabezadoGrupo
              titulo="Escuelas Colaborativas"
              descripcion="Las artes escénicas trabajan junto a Calambanda como escuelas colaborativas, compartiendo escenario y proyectos con nuestros elencos."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ESCUELAS_COLABORATIVAS.map((escuela, indice) => (
                <TarjetaEscuela
                  key={escuela.nombre}
                  escuela={escuela}
                  indice={indice}
                  acento="terracotta"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
