"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Landmark, Music2, Plus, Route, type LucideIcon } from "lucide-react";
import { contarMiembrosPorElenco, listarElencos } from "@/services/elencos.service";
import { listarEscuelas } from "@/services/escuelas.service";
import { ElencoCard } from "@/components/intranet/admin/ElencoCard";
import { TarjetaEscuela } from "@/components/intranet/admin/elencos/TarjetaEscuela";
import { ModalNuevaEscuela } from "@/components/intranet/admin/elencos/ModalNuevaEscuela";
import { ModalNuevoElenco } from "@/components/intranet/admin/elencos/ModalNuevoElenco";
import { ModalNuevaItinerancia } from "@/components/intranet/admin/elencos/ModalNuevaItinerancia";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { ConId, Elenco, Escuela } from "@/types";

type Vista = "escuelas" | "elencos" | "itinerancias" | "archivados";

const VISTAS: { valor: Vista; etiqueta: string; icono: LucideIcon }[] = [
  { valor: "elencos", etiqueta: "Elencos", icono: Music2 },
  { valor: "itinerancias", etiqueta: "Itinerancias", icono: Route },
  { valor: "escuelas", etiqueta: "Escuelas", icono: Landmark },
  { valor: "archivados", etiqueta: "Archivados", icono: Archive },
];

const BOTON_CREAR: Partial<Record<Vista, string>> = {
  escuelas: "Nueva escuela",
  elencos: "Nuevo elenco",
  itinerancias: "Nueva itinerancia",
};

interface Datos {
  escuelas: ConId<Escuela>[];
  elencos: ConId<Elenco>[];
  conteos: Record<string, number>;
}

const porNombre = (a: { nombre: string }, b: { nombre: string }) =>
  a.nombre.localeCompare(b.nombre, "es");

export default function AdminElencosPage() {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("elencos");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [modal, setModal] = useState<Vista | null>(null);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarEscuelas(), listarElencos(), contarMiembrosPorElenco()])
      .then(([escuelas, elencos, conteos]) => {
        if (cancelado) return;
        setDatos({ escuelas, elencos: elencos.sort(porNombre), conteos });
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar los elencos.");
      });
    return () => {
      cancelado = true;
    };
  }, [recarga]);

  const resumen = useMemo(() => {
    const elencos = datos?.elencos ?? [];
    const activos = elencos.filter((elenco) => elenco.activo);
    const gruposPorEscuela = new Map<string, ConId<Elenco>[]>();
    activos
      .filter((elenco) => elenco.tipoGrupo === "escuela")
      .forEach((elenco) => {
        const clave = elenco.escuelaId ?? "";
        gruposPorEscuela.set(clave, [...(gruposPorEscuela.get(clave) ?? []), elenco]);
      });
    return {
      gruposPorEscuela,
      itinerancias: activos.filter((elenco) => elenco.tipoGrupo === "itinerancia"),
      archivados: elencos.filter((elenco) => !elenco.activo),
      escuelasActivas: (datos?.escuelas ?? []).filter((escuela) => escuela.activo),
      escuelasArchivadas: (datos?.escuelas ?? []).filter((escuela) => !escuela.activo),
    };
  }, [datos]);

  function cerrarModalYRecargar() {
    setModal(null);
    recargar();
  }

  function irAlGrupo(elencoId: string) {
    router.push(`/admin/elencos/${elencoId}`);
  }

  const tarjetas = (lista: ConId<Elenco>[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {lista.map((elenco, indice) => (
        <ElencoCard
          key={elenco.id}
          elenco={elenco}
          indice={indice}
          cantidadMiembros={datos?.conteos[elenco.id] ?? 0}
        />
      ))}
    </div>
  );

  const textoCrear = BOTON_CREAR[vista];
  const sinEscuelasParaElencos = vista === "elencos" && resumen.escuelasActivas.length === 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-terracotta text-xs font-bold uppercase tracking-widest">
            Administración
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-text-dark mt-1">
            Elencos y clases
          </h1>
          <p className="text-slate-600 text-sm font-medium mt-1">
            Escuelas con sus niveles, sus elencos y las itinerancias. Selecciona un grupo para
            asignar docentes y alumnos.
          </p>
        </div>
        {textoCrear && (
          <button
            type="button"
            onClick={() => setModal(vista)}
            disabled={!datos || sinEscuelasParaElencos}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {textoCrear}
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Secciones"
        className="flex gap-1 overflow-x-auto bg-slate-100 p-1 rounded-2xl w-full sm:w-fit"
      >
        {VISTAS.map(({ valor, etiqueta, icono: Icono }) => {
          const activa = vista === valor;
          return (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setVista(valor)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activa ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-text-dark"
              }`}
            >
              <Icono className="w-4 h-4" />
              {etiqueta}
            </button>
          );
        })}
      </div>

      {!datos && !error && <EstadoCargando texto="Cargando elencos..." />}
      {error && <EstadoError mensaje={error} />}

      {datos && vista === "elencos" && (
        <div className="space-y-8">
          {sinEscuelasParaElencos && (
            <EstadoVacio
              icono={Landmark}
              titulo="Primero crea una escuela"
              descripcion='Cada elenco pertenece a una escuela y un nivel. Créala en la pestaña "Escuelas".'
            />
          )}
          {!sinEscuelasParaElencos && resumen.gruposPorEscuela.size === 0 && (
            <EstadoVacio
              icono={Music2}
              titulo="Todavía no hay elencos"
              descripcion={'Crea el primero con el botón "Nuevo elenco".'}
            />
          )}
          {datos.escuelas
            .filter((escuela) => resumen.gruposPorEscuela.has(escuela.id))
            .map((escuela) => (
              <section key={escuela.id} className="space-y-4">
                <h2 className="text-lg font-extrabold text-text-dark">
                  {escuela.nombre}
                  <span className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    {escuela.tipo === "instrumento" ? "Instrumento" : "Conjunto"}
                  </span>
                </h2>
                {tarjetas(resumen.gruposPorEscuela.get(escuela.id)!)}
              </section>
            ))}
          {/* Grupos creados antes de existir las escuelas, o cuya escuela ya no existe. */}
          {(() => {
            const idsEscuelas = new Set(datos.escuelas.map((escuela) => escuela.id));
            const sueltos = Array.from(resumen.gruposPorEscuela.entries())
              .filter(([escuelaId]) => !idsEscuelas.has(escuelaId))
              .flatMap(([, grupos]) => grupos);
            return sueltos.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-lg font-extrabold text-text-dark">Sin escuela</h2>
                {tarjetas(sueltos)}
              </section>
            ) : null;
          })()}
        </div>
      )}

      {datos && vista === "itinerancias" &&
        (resumen.itinerancias.length === 0 ? (
          <EstadoVacio
            icono={Route}
            titulo="No hay itinerancias activas"
            descripcion="Una itinerancia es un grupo temporal, por ejemplo el elenco de un musical, con integrantes de varios elencos."
          />
        ) : (
          tarjetas(resumen.itinerancias)
        ))}

      {datos && vista === "escuelas" &&
        (datos.escuelas.length === 0 ? (
          <EstadoVacio
            icono={Landmark}
            titulo="Todavía no hay escuelas"
            descripcion={'Crea la primera con el botón "Nueva escuela".'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {resumen.escuelasActivas.map((escuela) => (
              <TarjetaEscuela
                key={escuela.id}
                escuela={escuela}
                cantidadGrupos={resumen.gruposPorEscuela.get(escuela.id)?.length ?? 0}
                onCambio={recargar}
              />
            ))}
          </div>
        ))}

      {datos && vista === "archivados" && (
        <div className="space-y-8">
          {resumen.archivados.length === 0 && resumen.escuelasArchivadas.length === 0 && (
            <EstadoVacio
              icono={Archive}
              titulo="No hay nada archivado"
              descripcion="Los grupos y escuelas archivados conservan su historial y se pueden reactivar."
            />
          )}
          {resumen.archivados.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold text-text-dark">Grupos archivados</h2>
              {tarjetas(resumen.archivados)}
            </section>
          )}
          {resumen.escuelasArchivadas.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold text-text-dark">Escuelas archivadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {resumen.escuelasArchivadas.map((escuela) => (
                  <TarjetaEscuela key={escuela.id} escuela={escuela} cantidadGrupos={0} onCambio={recargar} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {modal === "escuelas" && (
        <ModalNuevaEscuela onCerrar={() => setModal(null)} onCreada={cerrarModalYRecargar} />
      )}
      {modal === "elencos" && (
        <ModalNuevoElenco
          escuelas={resumen.escuelasActivas}
          onCerrar={() => setModal(null)}
          onCreado={irAlGrupo}
        />
      )}
      {modal === "itinerancias" && (
        <ModalNuevaItinerancia onCerrar={() => setModal(null)} onCreada={irAlGrupo} />
      )}
    </>
  );
}
