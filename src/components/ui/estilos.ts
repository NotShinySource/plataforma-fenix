/**
 * Clases de Tailwind que se repiten en muchas pantallas. Tenerlas en un solo
 * lugar mantiene los formularios iguales en toda la intranet y permite
 * ajustar, por ejemplo, el contraste de un campo una sola vez.
 */

/** Campo de formulario de la intranet: input, select o textarea. */
export const CLASE_CAMPO =
  "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500 disabled:opacity-60";

/** Área de texto amplia (resumen de una clase, observaciones). */
export const CLASE_AREA_TEXTO =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500 resize-none disabled:opacity-80";

/** Etiqueta sobre un campo de formulario de la intranet. */
export const CLASE_ETIQUETA = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 px-1";

/** Mensaje de error bajo un formulario. */
export const CLASE_ERROR =
  "text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3";

/** Botón principal de una ventana o formulario (Crear, Guardar). Ocupa el espacio disponible. */
export const CLASE_BOTON_PRIMARIO =
  "flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed";

/** Botón secundario al lado del principal (Cancelar, Cerrar). */
export const CLASE_BOTON_SECUNDARIO =
  "flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60";

/**
 * Campo grande de las pantallas de acceso (login, solicitud de enlace,
 * creación de contraseña), con espacio a la izquierda para un ícono.
 */
export const CLASE_CAMPO_ACCESO =
  "w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500";

/** Fondos de las tarjetas de elenco, que se alternan para distinguirlas de un vistazo. */
export const VARIANTES_ELENCO = [
  { fondo: "bg-gradient-to-br from-primary/10 to-primary-light/10", borde: "border-primary/10" },
  { fondo: "bg-gradient-to-br from-terracotta/10 to-orange-500/10", borde: "border-terracotta/10" },
  { fondo: "bg-gradient-to-br from-indigo-500/10 to-blue-500/10", borde: "border-indigo-100" },
  { fondo: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10", borde: "border-emerald-100" },
];
