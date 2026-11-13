import Link from "next/link";
import { CalendarRange, ChevronRight, Users } from "lucide-react";
import { etiquetaTipoGrupo, textoPeriodoItinerancia } from "@/lib/elencos";
import type { ConId, Elenco } from "@/types";
import { VARIANTES_ELENCO } from "@/components/ui/estilos";

interface ElencoCardProps {
  elenco: ConId<Elenco>;
  cantidadMiembros: number;
  indice: number;
}

export function ElencoCard({ elenco, cantidadMiembros, indice }: ElencoCardProps) {
  const variante = elenco.activo
    ? VARIANTES_ELENCO[indice % VARIANTES_ELENCO.length]
    : { fondo: "bg-slate-50", borde: "border-slate-200" };
  const periodo = textoPeriodoItinerancia(elenco);

  return (
    <Link
      href={`/admin/elencos/${elenco.id}`}
      className={`${variante.fondo} ${variante.borde} border rounded-3xl p-6 flex flex-col justify-between gap-6 min-h-[190px] hover:shadow-lg hover:-translate-y-0.5 transition-all group`}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-text-dark uppercase tracking-wider border border-slate-100 shadow-sm inline-block">
            {etiquetaTipoGrupo(elenco)}
          </span>
          {!elenco.activo && (
            <span className="bg-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-700 uppercase tracking-wider inline-block">
              Archivado
            </span>
          )}
        </div>
        <h3 className="font-extrabold text-xl text-text-dark break-words">{elenco.nombre}</h3>
        {periodo && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <CalendarRange className="w-3.5 h-3.5" />
            {periodo}
          </p>
        )}
        {elenco.descripcion && (
          <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-2">
            {elenco.descripcion}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Users className="w-3.5 h-3.5" />
          {cantidadMiembros} {cantidadMiembros === 1 ? "miembro" : "miembros"}
        </span>
        <span className="text-xs font-bold text-primary flex items-center gap-1">
          Gestionar
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
