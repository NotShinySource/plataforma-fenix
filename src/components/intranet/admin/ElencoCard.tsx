import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import type { ConId, Elenco } from "@/types";

// Mismas variantes de color que las tarjetas de elenco de Alumno, para que
// las tres secciones de la intranet se lean como una sola plataforma.
const VARIANTES = [
  { fondo: "bg-gradient-to-br from-primary/10 to-primary-light/10", borde: "border-primary/10" },
  { fondo: "bg-gradient-to-br from-terracotta/10 to-orange-500/10", borde: "border-terracotta/10" },
  { fondo: "bg-gradient-to-br from-indigo-500/10 to-blue-500/10", borde: "border-indigo-100" },
  { fondo: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10", borde: "border-emerald-100" },
];

interface ElencoCardProps {
  elenco: ConId<Elenco>;
  cantidadMiembros: number;
  indice: number;
}

export function ElencoCard({ elenco, cantidadMiembros, indice }: ElencoCardProps) {
  const variante = VARIANTES[indice % VARIANTES.length];

  return (
    <Link
      href={`/admin/elencos/${elenco.id}`}
      className={`${variante.fondo} ${variante.borde} border rounded-3xl p-6 flex flex-col justify-between gap-6 min-h-[190px] hover:shadow-lg hover:-translate-y-0.5 transition-all group`}
    >
      <div className="space-y-3">
        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-text-dark uppercase tracking-wider border border-slate-100 shadow-sm inline-block">
          {elenco.tipoElenco}
        </span>
        <h3 className="font-extrabold text-xl text-text-dark">{elenco.nombre}</h3>
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
