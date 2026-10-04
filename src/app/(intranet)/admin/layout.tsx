import type { ReactNode } from "react";
import { IntranetHeader } from "@/components/intranet/shared/IntranetHeader";
import { IntranetFooter } from "@/components/intranet/shared/IntranetFooter";

const NAV_ADMIN = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/elencos", label: "Elencos" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <IntranetHeader nav={NAV_ADMIN} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {children}
      </main>
      <IntranetFooter />
    </div>
  );
}
