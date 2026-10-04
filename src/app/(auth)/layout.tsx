import { Plus_Jakarta_Sans } from "next/font/google";

// Las pantallas de acceso usan la misma tipografía que la Landing (Plus
// Jakarta Sans): son la continuación visual del sitio público, a diferencia
// de la intranet, que sigue con la fuente por defecto del proyecto.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={plusJakartaSans.className}>{children}</div>;
}
