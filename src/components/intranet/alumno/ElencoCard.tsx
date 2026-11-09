import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ConId, Elenco } from "@/types";
import { VARIANTES_ELENCO } from "@/components/ui/estilos";

interface ElencoCardProps {
  elenco: ConId<Elenco>;
  indice: number;
  href: string;
}

export function ElencoCard({ elenco, indice, href }: ElencoCardProps) {
  const variante = VARIANTES_ELENCO[indice % VARIANTES_ELENCO.length];

  return (
    <Link
      href={href}
      className={`p-6 rounded-[28px] border transition-all flex flex-col justify-between gap-4 relative overflow-hidden group hover:shadow-md ${variante.fondo} ${variante.borde}`}
    >
      <div className="space-y-3 relative z-10">
        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-text-dark uppercase tracking-wider border border-slate-100 shadow-sm inline-block">
          {elenco.tipoElenco}
        </span>
        <h4 className="font-extrabold text-xl text-text-dark">{elenco.nombre}</h4>
        <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-2">
          {elenco.descripcion}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100/50 relative z-10">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
          {elenco.activo ? "Activo" : "Inactivo"}
        </span>
        <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
          Ver material <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
