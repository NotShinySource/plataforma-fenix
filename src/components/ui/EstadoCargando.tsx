interface EstadoCargandoProps {
  texto?: string;
}

export function EstadoCargando({ texto = "Cargando..." }: EstadoCargandoProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-semibold">{texto}</p>
    </div>
  );
}
