"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FilePlus2, FolderUp, Loader2, Upload, XCircle } from "lucide-react";
import { subirArchivo } from "@/services/archivos.service";
import { formatearTamanioArchivo } from "@/lib/format";
import { ERROR_CONTENIDO_JPEG, LONGITUD_MAXIMA_CATEGORIA_MATERIAL } from "@/lib/validacion";
import {
  MAXIMO_ARCHIVOS_LOTE,
  claveArchivo,
  prepararLote,
  type ArchivoAceptado,
} from "@/lib/material/lote";
import { CLASE_CAMPO, CLASE_ERROR } from "@/components/ui/estilos";
import type { Archivo, ConId } from "@/types";

type EstadoEnvio = "pendiente" | "subiendo" | "listo" | "error";

interface ItemEnvio {
  item: ArchivoAceptado<File>;
  estado: EstadoEnvio;
  error?: string;
}

interface SubidaMultipleProps {
  elencoId: string;
  profesorId: string;
  archivosPublicados: ConId<Archivo>[];
  /** Se llama al terminar el lote, para recargar la lista de material. */
  onTerminado: () => Promise<void>;
}

const CLASE_BOTON_ELEGIR =
  "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-sm font-bold text-primary hover:bg-primary/10 cursor-pointer transition-colors";

const ETIQUETA_TIPO = { pdf: "PDF", mp3: "MP3", wav: "WAV", jpeg: "JPG" } as const;

/**
 * Sube varios archivos, o una carpeta completa, en una sola operación.
 * Cada archivo toma su título del nombre y su tipo de la extensión; se suben
 * de a uno para no saturar la conexión (en la escuela se usan datos móviles).
 */
export function SubidaMultiple({ elencoId, profesorId, archivosPublicados, onTerminado }: SubidaMultipleProps) {
  const [seleccion, setSeleccion] = useState<File[]>([]);
  const [categoria, setCategoria] = useState("");
  const [envio, setEnvio] = useState<ItemEnvio[] | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [claveInputs, setClaveInputs] = useState(0);

  const publicados = useMemo(
    () => new Set(archivosPublicados.map((archivo) => claveArchivo(archivo.nombreArchivo, archivo.tamanioBytes))),
    [archivosPublicados],
  );
  const lote = useMemo(() => prepararLote(seleccion, categoria, publicados), [seleccion, categoria, publicados]);
  const bytesLote = lote.aceptados.reduce((total, item) => total + item.archivo.size, 0);

  // Avisa antes de cerrar la pestaña con una subida a medias.
  useEffect(() => {
    if (!subiendo) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [subiendo]);

  function agregar(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return;
    setEnvio(null);
    setSeleccion((previos) => [...previos, ...Array.from(archivos)]);
  }

  function limpiar() {
    setSeleccion([]);
    setEnvio(null);
    setClaveInputs((clave) => clave + 1);
  }

  async function subirLote() {
    if (lote.aceptados.length === 0) return;
    const items: ItemEnvio[] = lote.aceptados.map((item) => ({ item, estado: "pendiente" }));
    setEnvio(items);
    setSubiendo(true);

    for (let indice = 0; indice < items.length; indice++) {
      const actualizar = (cambio: Partial<ItemEnvio>) =>
        setEnvio((previos) => previos?.map((it, i) => (i === indice ? { ...it, ...cambio } : it)) ?? null);

      actualizar({ estado: "subiendo" });
      const { item } = items[indice];
      try {
        await subirArchivo({
          elencoId,
          profesorId,
          tipo: item.tipo,
          categoria: item.categoria,
          titulo: item.titulo,
          archivo: item.archivo,
        });
        actualizar({ estado: "listo" });
      } catch (error) {
        actualizar({
          estado: "error",
          error:
            error instanceof Error && error.message === ERROR_CONTENIDO_JPEG
              ? ERROR_CONTENIDO_JPEG
              : "No se pudo subir. Revisa tu conexión e inténtalo de nuevo.",
        });
      }
    }

    setSubiendo(false);
    setSeleccion([]);
    setClaveInputs((clave) => clave + 1);
    await onTerminado().catch(() => undefined);
  }

  const listos = envio?.filter((it) => it.estado === "listo").length ?? 0;
  const conError = envio?.filter((it) => it.estado === "error").length ?? 0;
  const terminado = envio !== null && !subiendo;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={`${CLASE_BOTON_ELEGIR} ${subiendo ? "pointer-events-none opacity-60" : ""}`}>
          <FilePlus2 className="w-5 h-5" />
          Elegir archivos
          <input
            key={`archivos-${claveInputs}`}
            type="file"
            multiple
            accept=".pdf,.mp3,.wav,.jpg,.jpeg,application/pdf,audio/mpeg,audio/wav,image/jpeg"
            className="sr-only"
            disabled={subiendo}
            onChange={(evento) => agregar(evento.target.files)}
          />
        </label>
        <label className={`${CLASE_BOTON_ELEGIR} ${subiendo ? "pointer-events-none opacity-60" : ""}`}>
          <FolderUp className="w-5 h-5" />
          Elegir una carpeta
          <input
            key={`carpeta-${claveInputs}`}
            type="file"
            multiple
            className="sr-only"
            disabled={subiendo}
            // webkitdirectory no está en los tipos de React, pero lo admiten
            // Chrome, Edge, Firefox y Safari.
            ref={(input) => input?.setAttribute("webkitdirectory", "")}
            onChange={(evento) => agregar(evento.target.files)}
          />
        </label>
      </div>

      <p className="text-xs font-semibold text-slate-600">
        Hasta {MAXIMO_ARCHIVOS_LOTE} archivos o 300 MB por vez · PDF o JPG hasta 25 MB · MP3 o WAV hasta 50 MB.
        El título de cada material será el nombre del archivo. Si vuelves a subir una carpeta, se omiten los
        archivos que ya estaban publicados.
      </p>

      {seleccion.length > 0 && !subiendo && (
        <div>
          <label htmlFor="categoria-lote" className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Categoría para todo el lote{" "}
            <span className="normal-case font-semibold text-slate-600">(opcional)</span>
          </label>
          <input
            id="categoria-lote"
            type="text"
            maxLength={LONGITUD_MAXIMA_CATEGORIA_MATERIAL}
            value={categoria}
            onChange={(evento) => setCategoria(evento.target.value)}
            placeholder="Si la dejas vacía, se usa el nombre de la carpeta de cada archivo"
            className={CLASE_CAMPO}
          />
        </div>
      )}

      {envio === null && lote.aceptados.length > 0 && (
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <p className="px-4 py-3 bg-slate-50 text-sm font-bold text-text-dark">
            Listos para subir: {lote.aceptados.length} ({formatearTamanioArchivo(bytesLote)})
          </p>
          <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {lote.aceptados.map((item, indice) => (
              <li key={indice} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-text-dark">{item.titulo}</span>
                <span className="shrink-0 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {item.categoria} · {ETIQUETA_TIPO[item.tipo]} · {formatearTamanioArchivo(item.archivo.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {envio !== null && (
        <div className="rounded-2xl border border-slate-100 overflow-hidden" aria-live="polite">
          <p className="px-4 py-3 bg-slate-50 text-sm font-bold text-text-dark">
            {subiendo
              ? `Subiendo ${listos + conError + 1} de ${envio.length}… no cierres esta página.`
              : `Listo: ${listos} de ${envio.length} subidos${conError ? `, ${conError} con error` : ""}.`}
          </p>
          <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {envio.map(({ item, estado, error }, indice) => (
              <li key={indice} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                {estado === "listo" && <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />}
                {estado === "error" && <XCircle className="w-4 h-4 shrink-0 text-red-600" />}
                {estado === "subiendo" && <Loader2 className="w-4 h-4 shrink-0 text-primary animate-spin" />}
                {estado === "pendiente" && <span className="w-4 h-4 shrink-0 rounded-full border-2 border-slate-200" />}
                <span className="min-w-0 truncate font-semibold text-text-dark">{item.titulo}</span>
                {error && <span className="ml-auto shrink-0 text-xs font-semibold text-red-600">{error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lote.rechazados.length > 0 && envio === null && (
        <div className={CLASE_ERROR} role="alert">
          <p className="font-bold mb-1">No se subirán {lote.rechazados.length} archivo(s):</p>
          <ul className="space-y-0.5 max-h-40 overflow-y-auto">
            {lote.rechazados.map((rechazado, indice) => (
              <li key={indice}>
                <span className="font-semibold">{rechazado.nombre}</span>: {rechazado.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(seleccion.length > 0 || terminado) && (
        <div className="flex flex-wrap gap-3">
          {envio === null && (
            <button
              type="button"
              onClick={subirLote}
              disabled={lote.aceptados.length === 0}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Subir {lote.aceptados.length} archivo{lote.aceptados.length === 1 ? "" : "s"}
            </button>
          )}
          <button
            type="button"
            onClick={limpiar}
            disabled={subiendo}
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            {terminado ? "Subir más archivos" : "Limpiar selección"}
          </button>
        </div>
      )}
    </div>
  );
}
