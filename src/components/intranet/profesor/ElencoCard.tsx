import Link from "next/link";
import { ClipboardList, FolderUp } from "lucide-react";
import type { ConId, Elenco } from "@/types";

interface ElencoCardProps {
  elenco: ConId<Elenco>;
}

export function ElencoCard({ elenco }: ElencoCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="space-y-2">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
          {elenco.tipoElenco}
        </span>
        <h4 className="font-extrabold text-xl text-text-dark">{elenco.nombre}</h4>
        <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-2">
          {elenco.descripcion}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
        <Link
          href={`/profesor/elencos/${elenco.id}/material`}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-primary/10 text-slate-600 hover:text-primary px-4 py-2.5 rounded-xl font-bold text-xs transition-all border border-slate-100"
        >
          <FolderUp className="w-4 h-4" /> Material
        </Link>
        <Link
          href={`/profesor/elencos/${elenco.id}/asistencia`}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-terracotta/10 text-slate-600 hover:text-terracotta px-4 py-2.5 rounded-xl font-bold text-xs transition-all border border-slate-100"
        >
          <ClipboardList className="w-4 h-4" /> Asistencia
        </Link>
      </div>
    </div>
  );
}
