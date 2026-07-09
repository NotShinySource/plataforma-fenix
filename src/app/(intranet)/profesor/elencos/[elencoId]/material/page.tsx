"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { esMiembroDeElenco, obtenerElenco } from "@/services/elencos.service";
import { listarArchivosPorElenco, subirArchivo } from "@/services/archivos.service";
import { ArchivoRow } from "@/components/intranet/profesor/ArchivoRow";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Archivo, ConId, Elenco, TipoArchivo } from "@/types";

export default function ProfesorMaterialPage() {
  const { elencoId } = useParams<{ elencoId: string }>();
  const { usuario } = useAuth();

  const [elenco, setElenco] = useState<ConId<Elenco> | null>(null);
  const [archivos, setArchivos] = useState<ConId<Archivo>[]>([]);
  const [accesoPermitido, setAccesoPermitido] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState<TipoArchivo>("pdf");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [inputFileKey, setInputFileKey] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);

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

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario || !archivoSeleccionado) return;

    setSubiendo(true);
    setErrorSubida(null);
    try {
      await subirArchivo({
        elencoId,
        profesorId: usuario.uid,
        tipo,
        categoria: categoria.trim() || "General",
        titulo: titulo.trim(),
        archivo: archivoSeleccionado,
      });

      const listaActualizada = await listarArchivosPorElenco(elencoId);
      setArchivos(listaActualizada);

      setTitulo("");
      setCategoria("");
      setTipo("pdf");
      setArchivoSeleccionado(null);
      setInputFileKey((clave) => clave + 1);
    } catch {
      setErrorSubida("No se pudo subir el archivo. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  function handleEliminado(archivoId: string) {
    setArchivos((previos) => previos.filter((archivo) => archivo.id !== archivoId));
  }

  if (cargando) return <EstadoCargando texto="Cargando elenco..." />;
  if (error) return <EstadoError mensaje={error} />;

  if (accesoPermitido === false) {
    return (
      <EstadoVacio
        icono={Music}
        titulo="No tienes acceso a este elenco"
        descripcion="Este elenco no está entre tus asignaciones activas."
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
        href="/profesor"
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
          Gestión de material de estudio para este elenco.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
        <h3 className="text-lg font-extrabold text-text-dark">Subir nuevo material</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Título
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder="Ej: Score General - Sinfonía del Desierto"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Categoría
            </label>
            <input
              type="text"
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
              placeholder="Ej: Partitura"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as TipoArchivo)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
            >
              <option value="pdf">PDF</option>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Archivo
            </label>
            <input
              key={inputFileKey}
              type="file"
              required
              accept={tipo === "pdf" ? "application/pdf" : "audio/*"}
              onChange={(evento) => setArchivoSeleccionado(evento.target.files?.[0] ?? null)}
              className="w-full text-sm font-medium text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
            />
          </div>

          {errorSubida && (
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {errorSubida}
              </p>
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={subiendo}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {subiendo ? "Subiendo..." : "Subir material"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-extrabold text-text-dark">
            Material publicado ({archivos.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {archivos.length > 0 ? (
            archivos.map((archivo) => (
              <ArchivoRow key={archivo.id} archivo={archivo} onEliminado={handleEliminado} />
            ))
          ) : (
            <EstadoVacio
              icono={Music}
              titulo="Sin material todavía"
              descripcion="Sube el primer archivo con el formulario de arriba."
            />
          )}
        </div>
      </div>
    </>
  );
}
