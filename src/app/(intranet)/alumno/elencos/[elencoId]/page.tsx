"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { esMiembroDeElenco, obtenerElenco } from "@/services/elencos.service";
import { listarArchivosPorElenco } from "@/services/archivos.service";
import { ArchivoItem } from "@/components/intranet/alumno/ArchivoItem";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Archivo, ConId, Elenco, TipoArchivo } from "@/types";

type FiltroTipo = "todos" | TipoArchivo;

const OPCIONES_FILTRO: FiltroTipo[] = ["todos", "pdf", "mp3", "wav"];

export default function AlumnoElencoPage() {
  const { elencoId } = useParams<{ elencoId: string }>();
  const { usuario } = useAuth();

  const [elenco, setElenco] = useState<ConId<Elenco> | null>(null);
  const [archivos, setArchivos] = useState<ConId<Archivo>[]>([]);
  const [accesoPermitido, setAccesoPermitido] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");

  useEffect(() => {
    if (!usuario) return;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const esMiembro = await esMiembroDeElenco(elencoId, usuario!.uid);
        if (cancelado) return;
        setAccesoPermitido(esMiembro);

        if (!esMiembro) {
          setCargando(false);
          return;
        }

        const [elencoEncontrado, archivosEncontrados] = await Promise.all([
          obtenerElenco(elencoId),
          listarArchivosPorElenco(elencoId),
        ]);
        if (cancelado) return;
        setElenco(elencoEncontrado);
        setArchivos(archivosEncontrados);
      } catch {
        if (!cancelado) setError("No se pudo cargar la información del elenco.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [usuario, elencoId]);

  const archivosFiltrados = useMemo(() => {
    return archivos
      .filter((archivo) => filtroTipo === "todos" || archivo.tipo === filtroTipo)
      .filter((archivo) => archivo.titulo.toLowerCase().includes(busqueda.toLowerCase()));
  }, [archivos, filtroTipo, busqueda]);

  if (cargando) return <EstadoCargando texto="Cargando elenco..." />;
  if (error) return <EstadoError mensaje={error} />;

  if (accesoPermitido === false) {
    return (
      <EstadoVacio
        icono={Music}
        titulo="No tienes acceso a este elenco"
        descripcion="Este elenco no está entre tus inscripciones activas."
      />
    );
  }

  if (!elenco) {
    return (
      <EstadoVacio
        icono={Music}
        titulo="Elenco no encontrado"
        descripcion="Puede que ya no exista o el enlace esté mal escrito."
      />
    );
  }

  return (
    <>
      <Link
        href="/alumno"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a mis elencos
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-2">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
          {elenco.tipoElenco}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-text-dark">{elenco.nombre}</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-2xl font-medium">
          {elenco.descripcion}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-terracotta text-xs font-bold uppercase tracking-widest">
              Material Disponible
            </span>
            <h3 className="text-xl font-extrabold text-text-dark mt-1">Estudios autorizados</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 gap-1">
              {OPCIONES_FILTRO.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setFiltroTipo(opcion)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                    filtroTipo === opcion
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-600 hover:text-primary"
                  }`}
                >
                  {opcion}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Buscar por título..."
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                className="w-full bg-slate-50 border border-slate-100 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {archivosFiltrados.length > 0 ? (
            archivosFiltrados.map((archivo) => <ArchivoItem key={archivo.id} archivo={archivo} />)
          ) : (
            <EstadoVacio
              icono={Music}
              titulo="No se encontraron archivos"
              descripcion="Prueba con otro filtro o palabra de búsqueda."
            />
          )}
        </div>
      </div>
    </>
  );
}
