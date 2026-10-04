import type { ReactNode } from "react";
import { IntranetHeader } from "@/components/intranet/shared/IntranetHeader";
import { IntranetFooter } from "@/components/intranet/shared/IntranetFooter";

const NAV_ALUMNO = [
  { href: "/alumno", label: "Mis Elencos" },
  { href: "/alumno/tareas", label: "Tareas" },
  { href: "/alumno/avisos", label: "Avisos" },
  { href: "/alumno/asistencia", label: "Asistencia" },
];

export default function AlumnoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <IntranetHeader nav={NAV_ALUMNO} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {children}
      </main>
      <IntranetFooter />
    </div>
  );
}
