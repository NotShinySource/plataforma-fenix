import { AlertTriangle } from "lucide-react";

interface EstadoErrorProps {
  mensaje: string;
}

export function EstadoError({ mensaje }: EstadoErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center bg-red-50 border border-red-100 rounded-3xl">
      <AlertTriangle className="w-8 h-8 text-red-500" />
      <p className="text-sm font-bold text-red-600 max-w-sm">{mensaje}</p>
    </div>
  );
}
