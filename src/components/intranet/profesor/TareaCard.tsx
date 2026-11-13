import {
  AudioLines,
  CalendarDays,
  Download,
  FileText,
  Pencil,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { formatearDiaMes } from "@/lib/format";
import { ReproductorAudio } from "@/components/intranet/shared/ReproductorAudio";
import type { ConId, Tarea } from "@/types";

/** Alumno activo de un elenco, con el nombre que se muestra al docente. */
export interface AlumnoDeElenco {
  id: string;
  nombre: string;
}

interface TareaCardProps {
  tarea: ConId<Tarea>;
  nombreElenco: string;
  /** Alumnos activos del elenco; `null` mientras todavía se están cargando. */
  alumnosDelElenco: AlumnoDeElenco[] | null;
  /** Solo el docente que asignó la tarea puede editarla o eliminarla. */
  puedeGestionar: boolean;
  onEditar: (tarea: ConId<Tarea>) => void;
  onEliminar: (tarea: ConId<Tarea>) => void;
}

export function TareaCard({
  tarea,
  nombreElenco,
  alumnosDelElenco,
  puedeGestionar,
  onEditar,
  onEliminar,
}: TareaCardProps) {
  const individual = tarea.alumnoId !== null;
  const destinatario = individual
    ? alumnosDelElenco?.find((alumno) => alumno.id === tarea.alumnoId)
    : undefined;

  // Solo cuentan los alumnos que siguen en el elenco: si alguien que ya había
  // cumplido la tarea fue retirado, no debe inflar el porcentaje. Una tarea
  // individual cuenta solo a su destinatario.
  const considerados = individual ? (destinatario ? [destinatario] : []) : (alumnosDelElenco ?? []);
  const total = considerados.length;
  const completaron = considerados.filter((alumno) =>
    tarea.completadoPor.includes(alumno.id)
  ).length;
  const porcentaje = total > 0 ? Math.round((completaron / total) * 100) : 0;

  let textoAvance: string;
  if (alumnosDelElenco === null) textoAvance = "Calculando avance...";
  else if (!individual) textoAvance = `${completaron} de ${total} alumnos completaron`;
  else if (!destinatario) textoAvance = "El alumno ya no está en el elenco";
  else textoAvance = completaron > 0 ? "Completada" : "Pendiente";

  return (
    <article className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            {nombreElenco}
          </span>
          {individual && (
            <span className="inline-flex items-center gap-1.5 bg-terracotta/10 text-terracotta px-2.5 py-1 rounded-full text-xs font-bold max-w-full">
              <UserRound className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                Para {destinatario?.nombre ?? (alumnosDelElenco === null ? "..." : "alumno retirado")}
              </span>
            </span>
          )}
          {tarea.tipoAdjunto !== "Ninguno" && (
            <span className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">
              {tarea.tipoAdjunto === "PDF" ? (
                <FileText className="w-3.5 h-3.5" />
              ) : (
                <AudioLines className="w-3.5 h-3.5" />
              )}
              {tarea.tipoAdjunto}
            </span>
          )}
        </div>

        {puedeGestionar && (
          <div className="flex items-center gap-1 flex-shrink-0 -mt-1 -mr-1">
            <button
              type="button"
              onClick={() => onEditar(tarea)}
              aria-label={`Editar ${tarea.titulo}`}
              className="p-2 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEliminar(tarea)}
              aria-label={`Eliminar ${tarea.titulo}`}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <h4 className="font-extrabold text-text-dark leading-snug">{tarea.titulo}</h4>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <CalendarDays className="w-4 h-4" />
          {tarea.fechaLimite ? formatearDiaMes(tarea.fechaLimite) : "Sin fecha límite"}
        </p>
      </div>

      {tarea.urlAdjunto && tarea.tipoAdjunto === "Audio" && (
        <ReproductorAudio url={tarea.urlAdjunto} nombre={tarea.nombreAdjunto ?? "Audio"} />
      )}

      {tarea.urlAdjunto && tarea.tipoAdjunto === "PDF" && (
        <a
          href={tarea.urlAdjunto}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-slate-50 hover:bg-primary/5 border border-slate-100 rounded-2xl p-3 transition-colors group"
        >
          <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </span>
          <span className="min-w-0 flex-1 text-xs font-bold text-text-dark truncate">
            {tarea.nombreAdjunto ?? "Documento PDF"}
          </span>
          <Download className="w-4 h-4 text-slate-500 group-hover:text-primary flex-shrink-0" />
        </a>
      )}

      <div className="mt-auto space-y-2 pt-1">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold">
          <span className="text-slate-700">{textoAvance}</span>
          <span className="font-extrabold text-primary tabular-nums">{porcentaje}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`Avance de ${tarea.titulo}`}
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 bg-slate-100 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    </article>
  );
}
