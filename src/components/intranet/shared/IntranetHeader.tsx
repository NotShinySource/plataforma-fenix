"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Music } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePerfilPropio } from "@/hooks/usePerfilPropio";
import { Skeleton } from "@/components/ui/Skeleton";

interface ItemNav {
  href: string;
  label: string;
  contador?: number;
  etiquetaContador?: string;
}

interface IntranetHeaderProps {
  nav: ItemNav[];
}

export function IntranetHeader({ nav }: IntranetHeaderProps) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { perfil, cargando: cargandoPerfil } = usePerfilPropio();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const nombreMostrado = perfil ? `${perfil.nombres} ${perfil.apellidos}` : null;

  function estaActivo(href: string): boolean {
    return href === nav[0]?.href ? pathname === href : pathname.startsWith(href);
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-primary p-2.5 rounded-xl text-white shadow-md shadow-primary/20 flex-shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xl tracking-tighter text-text-dark block">
                FÉNIX INTRANET
              </span>
              {cargandoPerfil ? (
                <Skeleton className="h-3 w-32 mt-1.5" />
              ) : (
                <span className="text-xs font-bold tracking-widest text-slate-600 uppercase mt-0.5 block truncate">
                  {nombreMostrado ? `Hola, ${nombreMostrado}` : "Calambanda"}
                </span>
              )}
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.etiquetaContador ? `${item.label}, ${item.etiquetaContador}` : undefined}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  estaActivo(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <EtiquetaNav item={item} />
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold text-xs transition-all border border-slate-100 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>

        <nav className="flex lg:hidden items-center gap-1 pb-3 -mt-1 overflow-x-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.etiquetaContador ? `${item.label}, ${item.etiquetaContador}` : undefined}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                estaActivo(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <EtiquetaNav item={item} />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function EtiquetaNav({ item }: { item: ItemNav }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {item.label}
      {Boolean(item.contador) && (
        <span aria-hidden="true" className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums">
          {item.contador}
        </span>
      )}
    </span>
  );
}
