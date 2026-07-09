"use client";

import { motion } from "motion/react";
import { CheckCircle2, Volume2 } from "lucide-react";

export function Organizacion() {
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
                Misión, historia y rescate cultural en Calama
              </h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                La Escuela de Música Infanto Juvenil{" "}
                <strong className="text-text-dark">Calambanda</strong> nació bajo la convicción de
                que el arte es un motor de cambio social invaluable. Operamos activamente en los
                espacios patrimoniales restaurados de nuestra comuna, llevando alegría, educación
                y valores a familias enteras.
              </p>
              <p className="text-slate-600 leading-relaxed font-medium">
                Nuestra misión central es fomentar el talento artístico local, ofreciendo un
                entorno seguro, inclusivo y profesional para que los niños y jóvenes desarrollen
                habilidades musicales óptimas. Rescatamos el patrimonio del desierto de Atacama
                mediante repertorios inspirados en nuestras raíces.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-2xl font-black text-primary block">12</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                    Docentes Expertos
                  </span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-2xl font-black text-terracotta block">700+</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                    Alumnos Activos
                  </span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm col-span-2 md:col-span-1">
                  <span className="text-2xl font-black text-indigo-600 block">Ex Lolos</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                    Sede Histórica
                  </span>
                </div>
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
                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark text-lg">Inclusión Total</h4>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                      No exigimos conocimientos previos. Todo joven con ganas de aprender es
                      bienvenido en nuestra familia.
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
                  <div className="bg-terracotta/10 p-3 rounded-2xl text-terracotta flex-shrink-0">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark text-lg">Rescate Patrimonial</h4>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                      Nuestros ensambles tocan melodías tradicionales del norte de Chile y la
                      cosmovisión andina.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
