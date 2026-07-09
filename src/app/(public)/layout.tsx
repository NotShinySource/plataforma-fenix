import { Plus_Jakarta_Sans } from "next/font/google";

// Tipografía institucional de la Landing (Plus Jakarta Sans), aplicada solo
// a este grupo de rutas para no afectar la intranet, que ya está construida
// con la fuente por defecto del proyecto (Geist).
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={plusJakartaSans.className}>{children}</div>;
}
