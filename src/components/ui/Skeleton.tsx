/**
 * Marcadores de carga con la forma aproximada del contenido que va a
 * aparecer. Evitan los saltos de diseño y los textos de reemplazo que se ven
 * un instante antes de que lleguen los datos.
 *
 * Son decorativos (`aria-hidden`): quien los usa anuncia la carga a los
 * lectores de pantalla con un texto propio (ver EstadoCargando).
 */

interface SkeletonProps {
  className?: string;
}

/** Bloque base. El tamaño y la forma se dan con `className`. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

/** Grilla de tarjetas, como las de elencos. */
export function SkeletonTarjetas({ cantidad = 2 }: { cantidad?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: cantidad }, (_, indice) => (
        <div key={indice} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkeletonListaProps {
  filas?: number;
  /** Con marco propio (tarjeta blanca) o sin él, para usarla dentro de otra tarjeta. */
  enmarcada?: boolean;
}

/** Filas con avatar y dos líneas de texto, como listas de usuarios, avisos o material. */
export function SkeletonLista({ filas = 4, enmarcada = true }: SkeletonListaProps) {
  return (
    <ul
      aria-hidden="true"
      className={`divide-y divide-slate-100 ${
        enmarcada ? "bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" : ""
      }`}
    >
      {Array.from({ length: filas }, (_, indice) => (
        <li key={indice} className="px-6 py-5 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className={`h-4 ${indice % 2 === 0 ? "w-1/2" : "w-2/5"}`} />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full flex-shrink-0 hidden sm:block" />
        </li>
      ))}
    </ul>
  );
}

/** Un bloque grande, para calendarios o formularios extensos. */
export function SkeletonBloque() {
  return (
    <div aria-hidden="true" className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }, (_, indice) => (
          <Skeleton key={indice} className="h-14 sm:h-20" />
        ))}
      </div>
    </div>
  );
}

/** La tarjeta de bienvenida de los paneles de cada rol. */
export function SkeletonSaludo() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <div className="space-y-3 flex-1">
        <Skeleton className="h-8 w-2/3 max-w-sm" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-3/4 max-w-md" />
      </div>
      <Skeleton className="h-14 w-44 rounded-2xl flex-shrink-0" />
    </div>
  );
}

/** Contenido típico de un panel: bienvenida, título de sección y tarjetas. */
export function SkeletonContenido() {
  return (
    <div role="status" aria-live="polite" className="space-y-10">
      <span className="sr-only">Cargando...</span>
      <SkeletonSaludo />
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <SkeletonTarjetas />
      </div>
    </div>
  );
}

/**
 * La página completa de la intranet (encabezado y contenido), para el momento
 * en que todavía se está confirmando la sesión.
 */
export function SkeletonPagina() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="hidden lg:flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-10 w-10 sm:w-36" />
        </div>
      </div>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <SkeletonContenido />
      </main>
    </div>
  );
}
