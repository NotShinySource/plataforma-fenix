import type { ReactNode } from "react";
import { AlertTriangle, Landmark } from "lucide-react";
import { formatearFechaLarga } from "@/lib/format";
import type { Aviso, ConId } from "@/types";

interface FilaAvisoProps {
  aviso: ConId<Aviso>;
  /** El grupo o "Toda la escuela". */
  destino: string;
  /** Botones a la derecha (por ejemplo, eliminar en el panel de la Dirección). */
  acciones?: ReactNode;
}

/** Un aviso publicado, en las listas del docente y de la Dirección. */
export function FilaAviso({ aviso, destino, acciones }: FilaAvisoProps) {
  return (
    <div
      className={`bg-white rounded-2xl border p-5 flex items-start gap-4 ${
        aviso.urgente ? "border-terracotta/30" : "border-slate-100"
      }`}
    >
      <div
        className={`p-2.5 rounded-xl flex-shrink-0 ${
          aviso.urgente ? "bg-terracotta/10 text-terracotta" : "bg-primary/10 text-primary"
        }`}
      >
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {aviso.urgente && (
            <span className="bg-terracotta text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Urgente
            </span>
          )}
          {aviso.origen === "direccion" && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Landmark className="w-3 h-3" /> Dirección
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{destino}</span>
        </div>
        <h4 className="font-extrabold text-text-dark leading-snug mt-1 break-words">{aviso.titulo}</h4>
        <p className="text-sm text-slate-600 font-medium mt-1 whitespace-pre-line break-words">{aviso.contenido}</p>
        <p className="text-xs text-slate-600 font-semibold mt-2">{formatearFechaLarga(aviso.fechaPublicacion)}</p>
      </div>
      {acciones && <div className="flex-shrink-0">{acciones}</div>}
    </div>
  );
}
