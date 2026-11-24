"use client";

import type { ReactNode } from "react";
import { IntranetHeader } from "@/components/intranet/shared/IntranetHeader";
import { IntranetFooter } from "@/components/intranet/shared/IntranetFooter";
import { TareasAlumnoProvider, useTareasAlumno } from "@/context/TareasAlumnoContext";

const NAV_ALUMNO = [
  { href: "/alumno", label: "Mis Elencos" },
  { href: "/alumno/tareas", label: "Tareas" },
  { href: "/alumno/avisos", label: "Avisos" },
  { href: "/alumno/asistencia", label: "Asistencia" },
];

export default function AlumnoLayout({ children }: { children: ReactNode }) {
  return (
    <TareasAlumnoProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <EncabezadoAlumno />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
          {children}
        </main>
        <IntranetFooter />
      </div>
    </TareasAlumnoProvider>
  );
}

function EncabezadoAlumno() {
  const { nuevas } = useTareasAlumno();
  const aviso = nuevas.length === 1 ? "1 tarea nueva" : `${nuevas.length} tareas nuevas`;
  const nav = NAV_ALUMNO.map((item) => item.href === "/alumno/tareas" && nuevas.length > 0
    ? { ...item, contador: nuevas.length, etiquetaContador: aviso }
    : item);

  return (
    <>
      <IntranetHeader nav={nav} />
      <span role="status" className="sr-only">{nuevas.length > 0 ? aviso : ""}</span>
    </>
  );
}
