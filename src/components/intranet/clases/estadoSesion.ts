import type { EstadoSesion } from "@/types";

export const ETIQUETA_ESTADO_SESION: Record<EstadoSesion, string> = {
  programada: "Programada",
  cancelada: "Cancelada",
  en_curso: "En curso",
  realizada: "Realizada",
  incompleta: "Incompleta",
};

/** Paleta azul y blanco; solo "incompleta" usa ámbar, porque requiere atención. */
export const ESTILO_ESTADO_SESION: Record<EstadoSesion, string> = {
  programada: "bg-primary/10 text-primary",
  cancelada: "bg-slate-100 text-slate-500 line-through",
  en_curso: "bg-primary text-white",
  realizada: "bg-slate-100 text-slate-700",
  incompleta: "bg-amber-50 text-amber-700",
};
