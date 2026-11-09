import { fuenteLanding } from "@/components/landing/fuente";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={fuenteLanding.className}>{children}</div>;
}
