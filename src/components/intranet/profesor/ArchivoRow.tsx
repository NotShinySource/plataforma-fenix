"use client";

import { useState } from "react";
import { ExternalLink, FileText, ImageIcon, Trash2, Volume2 } from "lucide-react";
import { ReproductorAudio } from "@/components/intranet/shared/ReproductorAudio";
import { formatearFecha, formatearTamanioArchivo } from "@/lib/format";
import { eliminarArchivo } from "@/services/archivos.service";
import type { Archivo, ConId } from "@/types";

interface ArchivoRowProps {
  archivo: ConId<Archivo>;
  onEliminado: (archivoId: string) => void;
}

export function ArchivoRow({ archivo, onEliminado }: ArchivoRowProps) {
  const [eliminando, setEliminando] = useState(false);
  const esAudio = archivo.tipo === "mp3" || archivo.tipo === "wav";
  const esFoto = archivo.tipo === "jpeg";
  const Icono = esAudio ? Volume2 : esFoto ? ImageIcon : FileText;

  async function handleEliminar() {
    if (!confirm(`¿Eliminar "${archivo.titulo}"? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    try {
      await eliminarArchivo(archivo.id, archivo.urlStorage);
      onEliminado(archivo.id);
    } catch {
      alert("No se pudo eliminar el archivo. Intenta de nuevo.");
      setEliminando(false);
    }
  }

  return (
    <div className="p-5 hover:bg-slate-50/40 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-xl flex-shrink-0 ${
              esAudio || esFoto ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
            }`}
          >
            <Icono className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-text-dark text-sm truncate">{archivo.titulo}</h4>
            <div className="flex flex-wrap gap-x-3 text-xs text-slate-600 font-semibold uppercase tracking-wider">
              <span>{archivo.categoria}</span>
              <span>{archivo.tipo.toUpperCase()}</span>
              <span>{formatearFecha(archivo.fechaSubida)}</span>
              <span>{formatearTamanioArchivo(archivo.tamanioBytes)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!esAudio && (
            <a
              href={archivo.urlStorage}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${esFoto ? "Abrir foto" : "Abrir PDF"} ${archivo.titulo}`}
              className="flex items-center gap-1.5 rounded-xl p-2.5 sm:px-3 sm:py-2 text-xs font-bold text-primary hover:bg-primary/10"
            >
              <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{esFoto ? "Abrir foto" : "Abrir PDF"}</span>
            </a>
          )}
          <button
            type="button"
            onClick={handleEliminar}
            disabled={eliminando}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
            aria-label={`Eliminar ${archivo.titulo}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* El docente escucha su audio con el mismo reproductor que el alumno,
          para revisar lo que publicó tal como lo verán sus estudiantes. */}
      {esAudio && (
        <div className="mt-3">
          <ReproductorAudio url={archivo.urlStorage} nombre={archivo.titulo} />
        </div>
      )}
    </div>
  );
}
