import type { ReactNode } from "react";
import { IntranetHeader } from "@/components/intranet/shared/IntranetHeader";
import { IntranetFooter } from "@/components/intranet/shared/IntranetFooter";

const NAV_PROFESOR = [
  { href: "/profesor", label: "Mis Elencos" },
  { href: "/profesor/tareas", label: "Tareas" },
  { href: "/profesor/avisos", label: "Avisos" },
];

export default function ProfesorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <IntranetHeader nav={NAV_PROFESOR} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {children}
      </main>
      <IntranetFooter />
    </div>
  );
}
