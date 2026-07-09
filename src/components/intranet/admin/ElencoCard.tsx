import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import type { ConId, Elenco } from "@/types";

interface ElencoCardProps {
  elenco: ConId<Elenco>;
  cantidadMiembros: number;
}

export function ElencoCard({ elenco, cantidadMiembros }: ElencoCardProps) {
  return (
    <Link
      href={`/admin/elencos/${elenco.id}`}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-all"
    >
      <div className="space-y-2">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
          {elenco.tipoElenco}
        </span>
        <h4 className="font-extrabold text-xl text-text-dark">{elenco.nombre}</h4>
        {elenco.descripcion && (
          <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-2">
            {elenco.descripcion}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Users className="w-3.5 h-3.5" />
          {cantidadMiembros} {cantidadMiembros === 1 ? "miembro" : "miembros"}
        </span>
        <span className="text-xs font-bold text-primary flex items-center gap-1">
          Ver detalle <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
