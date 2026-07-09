"use client";

import { useState } from "react";
import { FileText, Trash2, Volume2 } from "lucide-react";
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
    <div className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`p-2.5 rounded-xl flex-shrink-0 ${
            esAudio ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
          }`}
        >
          {esAudio ? <Volume2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
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

      <button
        type="button"
        onClick={handleEliminar}
        disabled={eliminando}
        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 flex-shrink-0"
        aria-label={`Eliminar ${archivo.titulo}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
