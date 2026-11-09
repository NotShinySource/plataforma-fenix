import type { EstadoActivacion, RolUsuario, UsuarioAdmin } from "@/types";

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

export const ESTADO_EGRESADO = { texto: "Egresado", estilo: "bg-slate-200/70 text-slate-700" };

/** Estado que se muestra en la lista: una cuenta egresada lo dice antes que su activación. */
export function estadoDe(usuario: UsuarioAdmin): { texto: string; estilo: string } {
  return usuario.activo === false ? ESTADO_EGRESADO : ETIQUETA_ESTADO[usuario.estadoActivacion];
}

/** Un alumno egresa; un docente se da de baja. */
export function textoAccionEgreso(rol: RolUsuario): string {
  return rol === "alumno" ? "Egresar" : "Dar de baja";
}
