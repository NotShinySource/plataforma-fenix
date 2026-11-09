"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, ChevronRight, Users } from "lucide-react";
import Image from "next/image";
import { sinOptimizar } from "@/lib/landing/imagen";
import type { ContenidoLanding } from "@/types";
import { TextoDestacado } from "./TextoDestacado";

export function Hero({ portada }: { portada: ContenidoLanding["portada"] }) {
  const [tarjetaAlumnos, tarjetaMatricula] = portada.tarjetas;
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
              {portada.etiqueta}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-text-dark tracking-tight leading-[1.1]">
              <TextoDestacado texto={portada.titulo} claseDestacado="text-primary" />
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {portada.descripcion}
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
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-inner">
                  <Image
                    src={portada.imagen.url}
                    alt="Elencos de Calambanda en concierto"
                    fill
                    preload
                    unoptimized={sinOptimizar(portada.imagen.url)}
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3">
                  <div className="bg-terracotta/10 p-2.5 rounded-xl text-terracotta">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-text-dark leading-none">{tarjetaAlumnos.valor}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {tarjetaAlumnos.etiqueta}
                    </p>
                  </div>
                </div>

                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-dark leading-none">{tarjetaMatricula.valor}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {tarjetaMatricula.etiqueta}
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
