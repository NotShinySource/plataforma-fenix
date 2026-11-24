"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

/*
 * Las secciones de la Landing se enlazan como "/#seccion": desde la Landing
 * solo desplazan la página, y desde otra página (preguntas frecuentes)
 * vuelven a la Landing en esa sección.
 */
const ENLACES = [
  { label: "Inicio", href: "/#inicio" },
  { label: "Nuestra Organización", href: "/#organizacion" },
  { label: "Escuelas", href: "/#escuelas" },
  { label: "Actuaciones", href: "/#actuaciones" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
];

export function Navbar() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const ruta = usePathname();
  const enLanding = ruta === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link
            href="/#inicio"
            aria-label="Calambanda, Escuela de Música: volver al inicio"
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(evento) => {
              // En la Landing solo se sube; desde otra página, el enlace lleva a ella.
              if (!enLanding) return;
              evento.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <Image
              src="/imagenes/inicio/CALAMABANDA.png"
              alt="Calambanda"
              width={1179}
              height={435}
              priority
              className="h-11 sm:h-12 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="hidden sm:block lg:hidden xl:block border-l border-slate-200 pl-3 text-[10px] font-bold tracking-widest text-terracotta uppercase leading-tight">
              Escuela
              <br />
              de Música
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.label}
                href={enlace.href}
                aria-current={enlace.href === ruta ? "page" : undefined}
                className="text-sm font-semibold text-text-dark/80 hover:text-primary aria-[current=page]:text-primary transition-colors py-2 whitespace-nowrap"
              >
                {enlace.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/login"
              className="bg-primary hover:bg-primary-dark text-white px-5 lg:px-6 py-2.5 rounded-xl font-bold text-sm tracking-tight whitespace-nowrap transition-all shadow-md shadow-primary/15 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Ingresar a Intranet
            </Link>
          </div>

          <div className="flex lg:hidden">
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
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {ENLACES.map((enlace) => (
                <Link
                  key={enlace.label}
                  href={enlace.href}
                  aria-current={enlace.href === ruta ? "page" : undefined}
                  onClick={() => setMenuMovilAbierto(false)}
                  className="block text-base font-bold text-text-dark/80 hover:text-primary py-2 px-3 hover:bg-slate-50 rounded-xl transition-all"
                >
                  {enlace.label}
                </Link>
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
