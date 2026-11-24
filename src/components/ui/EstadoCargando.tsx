import { SkeletonBloque, SkeletonLista, SkeletonTarjetas } from "./Skeleton";

interface EstadoCargandoProps {
  /** Lo lee el lector de pantalla; no se muestra. */
  texto?: string;
  /** Forma del contenido que se está cargando. */
  variante?: "lista" | "tarjetas" | "bloque";
}

export function EstadoCargando({ texto = "Cargando...", variante = "lista" }: EstadoCargandoProps) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{texto}</span>
      {variante === "tarjetas" && <SkeletonTarjetas />}
      {variante === "lista" && <SkeletonLista />}
      {variante === "bloque" && <SkeletonBloque />}
    </div>
  );
}
