"use client";

import { motion } from "motion/react";
import { CheckCircle2, Volume2 } from "lucide-react";
import type { ContenidoLanding } from "@/types";
import { TextoDestacado } from "./TextoDestacado";

/** Colores de las tres cifras, en el mismo orden en que se editan. */
const COLOR_CIFRA = ["text-primary", "text-terracotta", "text-indigo-600"];

/** Ícono y color de los dos pilares, en el mismo orden en que se editan. */
const ESTILO_PILAR = [
  { icono: CheckCircle2, clase: "bg-primary/10 text-primary" },
  { icono: Volume2, clase: "bg-terracotta/10 text-terracotta" },
];

export function Organizacion({ organizacion }: { organizacion: ContenidoLanding["organizacion"] }) {
  return (
    <section id="organizacion" className="py-24 bg-white relative z-10 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-[40px] p-8 md:p-16 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-terracotta/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6"
            >
              <span className="text-terracotta font-extrabold tracking-widest uppercase text-xs">
                Nuestra Organización
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-text-dark leading-tight">
                <TextoDestacado texto={organizacion.titulo} claseDestacado="text-primary" />
              </h2>
              {organizacion.parrafos.map((parrafo, indice) => (
                <p key={indice} className="text-slate-600 leading-relaxed font-medium">
                  <TextoDestacado texto={parrafo} claseDestacado="text-text-dark" como="strong" />
                </p>
              ))}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                {organizacion.cifras.map((cifra, indice) => (
                  <div
                    key={indice}
                    className={`p-4 bg-white rounded-2xl border border-slate-100 shadow-sm ${
                      indice === 2 ? "col-span-2 md:col-span-1" : ""
                    }`}
                  >
                    <span className={`text-2xl font-black block ${COLOR_CIFRA[indice]}`}>{cifra.valor}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                      {cifra.etiqueta}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-5"
            >
              <div className="space-y-4">
                {organizacion.pilares.map((pilar, indice) => {
                  const { icono: Icono, clase } = ESTILO_PILAR[indice];
                  return (
                    <div
                      key={indice}
                      className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start"
                    >
                      <div className={`p-3 rounded-2xl flex-shrink-0 ${clase}`}>
                        <Icono className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-dark text-lg">{pilar.titulo}</h4>
                        <p className="text-slate-500 text-sm mt-1 leading-relaxed">{pilar.texto}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
