"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Music, X } from "lucide-react";

const ENLACES = [
  { label: "Inicio", href: "#inicio" },
  { label: "Nuestra Organización", href: "#organizacion" },
  { label: "Escuelas", href: "#escuelas" },
  { label: "Actuaciones", href: "#actuaciones" },
];

export function Navbar() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <a
            href="#inicio"
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(evento) => {
              evento.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="bg-primary p-2.5 rounded-xl shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tighter text-text-dark block leading-none">
                CALAMBANDA
              </span>
              <span className="text-[10px] font-bold tracking-widest text-terracotta block mt-0.5 uppercase">
                Escuela de Música
              </span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {ENLACES.map((enlace) => (
              <a
                key={enlace.label}
                href={enlace.href}
                className="text-sm font-semibold text-text-dark/80 hover:text-primary transition-colors py-2"
              >
                {enlace.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-tight transition-all shadow-md shadow-primary/15 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Ingresar a Intranet
            </Link>
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              className="text-text-dark p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Abrir menú"
            >
              {menuMovilAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuMovilAbierto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {ENLACES.map((enlace) => (
                <a
                  key={enlace.label}
                  href={enlace.href}
                  onClick={() => setMenuMovilAbierto(false)}
                  className="block text-base font-bold text-text-dark/80 hover:text-primary py-2 px-3 hover:bg-slate-50 rounded-xl transition-all"
                >
                  {enlace.label}
                </a>
              ))}
              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/login"
                  onClick={() => setMenuMovilAbierto(false)}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-center transition-all shadow-md block"
                >
                  Ingresar a Intranet
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
