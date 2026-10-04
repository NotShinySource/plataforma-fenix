"use client";

import { useRef, useState, type MouseEvent } from "react";
import { Download, Pause, Play } from "lucide-react";

interface ReproductorAudioProps {
  url: string;
  nombre: string;
}

function formatearTiempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const minutos = Math.floor(segundos / 60);
  const resto = Math.floor(segundos % 60);
  return `${minutos}:${String(resto).padStart(2, "0")}`;
}

/**
 * Reproductor compacto sobre un <audio> HTML5 nativo (sin librerías), que es
 * lo que mejor se comporta en iOS/Safari. El botón de descarga queda siempre
 * a la vista como respaldo si el navegador no logra reproducir el archivo.
 * preload="none": el audio no se descarga hasta que el usuario pulsa reproducir.
 */
export function ReproductorAudio({ url, nombre }: ReproductorAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [actual, setActual] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [fallo, setFallo] = useState(false);

  async function alternar() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      setFallo(true);
    }
  }

  function saltar(evento: MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) return;
    const caja = evento.currentTarget.getBoundingClientRect();
    const fraccion = Math.min(1, Math.max(0, (evento.clientX - caja.left) / caja.width));
    audio.currentTime = fraccion * audio.duration;
  }

  const porcentaje = duracion > 0 ? Math.min(100, (actual / duracion) * 100) : 0;

  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3">
      <audio
        ref={audioRef}
        src={url}
        preload="none"
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        onEnded={() => {
          setReproduciendo(false);
          setActual(0);
        }}
        onTimeUpdate={(evento) => setActual(evento.currentTarget.currentTime)}
        onLoadedMetadata={(evento) => {
          const total = evento.currentTarget.duration;
          setDuracion(Number.isFinite(total) ? total : 0);
        }}
        onError={() => setFallo(true)}
      />

      <button
        type="button"
        onClick={alternar}
        disabled={fallo}
        aria-label={reproduciendo ? `Pausar ${nombre}` : `Reproducir ${nombre}`}
        className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {reproduciendo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-text-dark truncate">{nombre}</p>
        {fallo ? (
          <p className="text-xs font-semibold text-red-600 mt-1">
            No se pudo reproducir. Descárgalo para escucharlo.
          </p>
        ) : (
          <div
            onClick={saltar}
            className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-200"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        )}
      </div>

      {!fallo && (
        <span className="text-xs font-semibold text-slate-600 tabular-nums flex-shrink-0">
          {formatearTiempo(reproduciendo || actual > 0 ? actual : duracion)}
        </span>
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Descargar ${nombre}`}
        className="p-2 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}
