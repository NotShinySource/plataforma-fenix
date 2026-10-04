import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

interface MarcoAuthProps {
  icono: LucideIcon;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}

/**
 * Marco común de las pantallas de acceso (login, crear o recuperar
 * contraseña). En escritorio: panel institucional con la foto y los logos a
 * la izquierda y el formulario a la derecha. En móvil solo queda el
 * formulario, con una franja superior de marca, para no restar espacio al
 * teclado.
 */
export function MarcoAuth({ icono: Icono, titulo, subtitulo, children }: MarcoAuthProps) {
  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-surface">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary-dark p-12 xl:p-16 text-white">
        <Image
          src="/imagenes/inicio/principal.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 0px"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/80 to-primary-dark/40"
          aria-hidden="true"
        />

        <Link href="/" className="relative z-10 w-fit" aria-label="Ir al sitio de Calambanda">
          <Image
            src="/imagenes/inicio/CALAMABANDA.png"
            alt="Calambanda"
            width={1179}
            height={435}
            className="h-16 w-auto drop-shadow-lg"
          />
        </Link>

        <div className="relative z-10 space-y-6 max-w-lg">
          <span className="inline-block bg-white/10 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            Plataforma Fénix
          </span>
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
            Tu música, tus partituras y tus ensayos en un solo lugar.
          </h2>
          <p className="text-white/80 font-medium leading-relaxed">
            Intranet de la Escuela de Música Infanto Juvenil Calambanda para estudiantes,
            docentes y administración.
          </p>
          <div className="flex items-center gap-4 pt-6 border-t border-white/15">
            <Image
              src="/imagenes/inicio/Cultura-Bl.png"
              alt="Corporación de Cultura y Turismo de Calama"
              width={1201}
              height={666}
              className="h-12 w-auto opacity-90"
            />
          </div>
        </div>
      </aside>

      <section className="flex flex-col min-h-screen">
        <div className="lg:hidden bg-primary-dark px-6 py-5 flex justify-center">
          <Image
            src="/imagenes/inicio/CALAMABANDA.png"
            alt="Calambanda"
            width={1179}
            height={435}
            className="h-11 w-auto"
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="bg-primary/10 p-3.5 rounded-2xl text-primary mb-4">
                  <Icono className="w-8 h-8" />
                </div>
                <h1 className="font-extrabold text-2xl text-text-dark leading-tight">{titulo}</h1>
                {subtitulo && (
                  <p className="text-slate-600 text-sm mt-2 font-medium leading-relaxed">
                    {subtitulo}
                  </p>
                )}
              </div>
              {children}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-600 px-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al sitio
              </Link>
              <span>Escuela de Música Calambanda</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
