import { Download, FileText, Volume2 } from "lucide-react";
import { formatearFecha, formatearTamanioArchivo } from "@/lib/format";
import type { Archivo, ConId } from "@/types";

interface ArchivoItemProps {
  archivo: ConId<Archivo>;
}

export function ArchivoItem({ archivo }: ArchivoItemProps) {
  const esAudio = archivo.tipo === "mp3" || archivo.tipo === "wav";

  return (
    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/40 transition-colors">
      <div className="flex items-start gap-4">
        <div
          className={`p-3.5 rounded-2xl flex-shrink-0 ${
            esAudio ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
          }`}
        >
          {esAudio ? <Volume2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
        </div>
        <div>
          <h4 className="font-bold text-text-dark leading-snug">{archivo.titulo}</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-1 font-semibold uppercase tracking-wider">
            <span>{archivo.categoria}</span>
            <span>•</span>
            <span>{archivo.tipo.toUpperCase()}</span>
            <span>•</span>
            <span>{formatearFecha(archivo.fechaSubida)}</span>
            <span>•</span>
            <span>{formatearTamanioArchivo(archivo.tamanioBytes)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {esAudio ? (
          <div className="w-full md:w-64 flex flex-col items-center gap-1">
            {/* Riesgo R-01: <audio> HTML5 nativo, con enlace de
                descarga directa como respaldo si la reproducción inline falla
                (típico en iOS/Safari). */}
            <audio controls preload="none" src={archivo.urlStorage} className="w-full h-9" />
            <a
              href={archivo.urlStorage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-600 hover:text-primary transition-colors"
            >
              ¿No se reproduce? Descargar audio
            </a>
          </div>
        ) : (
          <a
            href={archivo.urlStorage}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all shadow-md flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PDF</span>
          </a>
        )}
      </div>
    </div>
  );
}
