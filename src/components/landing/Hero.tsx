"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, ChevronRight, Users } from "lucide-react";

export function Hero() {
  return (
    <section
      id="inicio"
      className="pt-32 pb-20 md:py-40 bg-gradient-to-b from-blue-50/40 via-white to-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-terracotta/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 text-center lg:text-left space-y-6"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              Música para el Futuro
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-text-dark tracking-tight leading-[1.1]">
              El impacto del arte en la <span className="text-primary">juventud</span> loína
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Transformamos vidas a través de la educación musical gratuita y de excelencia.
              Fomentando el compañerismo, la disciplina y el rescate cultural en Calama.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <a
                href="#organizacion"
                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-bold text-center transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Conoce nuestra escuela
              </a>
              <Link
                href="/login"
                className="bg-white hover:bg-slate-50 text-text-dark border border-slate-200 px-8 py-4 rounded-xl font-bold text-center transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Acceso Intranet Estudiante <ChevronRight className="w-5 h-5 text-terracotta" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 relative mt-8 lg:mt-0"
          >
            <div className="relative group mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-terracotta/10 to-primary-light/10 blur-2xl opacity-60 rounded-[40px] group-hover:scale-105 transition-transform duration-500" />

              <div className="relative bg-white p-4 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagen externa, sin next.config.remotePatterns configurado para este dominio todavía */}
                <img
                  src="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200"
                  alt="Orquesta Juvenil de Calama"
                  className="w-full h-auto rounded-2xl object-cover aspect-[4/3] shadow-inner"
                />

                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3">
                  <div className="bg-terracotta/10 p-2.5 rounded-xl text-terracotta">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-text-dark leading-none">700+</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Estudiantes activos
                    </p>
                  </div>
                </div>

                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-dark leading-none">Matrícula 100%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Gratuita
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
