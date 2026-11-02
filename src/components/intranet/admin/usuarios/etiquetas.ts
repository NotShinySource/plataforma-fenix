import type { EstadoActivacion, RolUsuario } from "@/types";

/** El rol técnico es "profesor"; en pantalla se muestra "Docente". */
export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  alumno: "Alumno",
  profesor: "Docente",
  administrador: "Administrador",
};

export const ESTILO_ROL: Record<RolUsuario, string> = {
  alumno: "bg-primary/10 text-primary",
  profesor: "bg-indigo-50 text-indigo-700",
  administrador: "bg-slate-200/70 text-slate-700",
};

export const ETIQUETA_ESTADO: Record<EstadoActivacion, { texto: string; estilo: string }> = {
  pendiente: { texto: "Pendiente", estilo: "bg-amber-50 text-amber-700" },
  activada: { texto: "Activa", estilo: "bg-emerald-50 text-emerald-700" },
};
