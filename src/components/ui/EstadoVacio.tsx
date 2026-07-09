import type { LucideIcon } from "lucide-react";

interface EstadoVacioProps {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
}

export function EstadoVacio({ icono: Icono, titulo, descripcion }: EstadoVacioProps) {
  return (
    <div className="p-12 text-center space-y-2 bg-white border border-slate-100 rounded-3xl">
      <Icono className="w-12 h-12 mx-auto text-slate-300" />
      <p className="font-bold text-text-dark text-base">{titulo}</p>
      <p className="text-sm text-slate-600">{descripcion}</p>
    </div>
  );
}
