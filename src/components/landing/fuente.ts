import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * Tipografía institucional de la Landing (Plus Jakarta Sans), aplicada solo
 * al sitio público para no afectar la intranet, que usa la fuente por
 * defecto del proyecto (Geist). Los pop-ups que se montan con un portal en
 * <body> quedan fuera del layout, así que también la aplican directamente.
 */
export const fuenteLanding = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
