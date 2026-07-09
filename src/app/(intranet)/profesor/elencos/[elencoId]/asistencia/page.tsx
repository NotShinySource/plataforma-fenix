"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Music, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  esMiembroDeElenco,
  listarMiembrosDeElenco,
  obtenerElenco,
} from "@/services/elencos.service";
import { obtenerUsuario } from "@/services/usuarios.service";
import { listarAsistenciasPorElencoYFecha, registrarAsistencia } from "@/services/asistencias.service";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { ConId, Elenco, EstadoAsistencia } from "@/types";

interface AlumnoElenco {
  uid: string;
  nombre: string;
}

interface RegistroLocal {
  estado: EstadoAsistencia;
  observaciones: string;
}

function fechaHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

const OPCIONES_ESTADO: { valor: EstadoAsistencia; etiqueta: string; estilo: string }[] = [
  { valor: "presente", etiqueta: "Presente", estilo: "bg-emerald-500 text-white" },
  { valor: "ausente", etiqueta: "Ausente", estilo: "bg-red-500 text-white" },
  { valor: "justificado", etiqueta: "Justificado", estilo: "bg-amber-500 text-white" },
];

export default function ProfesorAsistenciaPage() {
  const { elencoId } = useParams<{ elencoId: string }>();
  const { usuario } = useAuth();

  const [elenco, setElenco] = useState<ConId<Elenco> | null>(null);
  const [alumnos, setAlumnos] = useState<AlumnoElenco[]>([]);
  const [accesoPermitido, setAccesoPermitido] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fecha, setFecha] = useState(fechaHoy());
  const [registros, setRegistros] = useState<Record<string, RegistroLocal>>({});
  const [cargandoFecha, setCargandoFecha] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

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

        const [elencoEncontrado, miembros] = await Promise.all([
          obtenerElenco(elencoId),
          listarMiembrosDeElenco(elencoId, "alumno"),
        ]);
        if (cancelado) return;

        const alumnosConNombre = await Promise.all(
          miembros.map(async (miembro) => {
            const perfil = await obtenerUsuario(miembro.usuarioId);
            return {
              uid: miembro.usuarioId,
              nombre: perfil ? `${perfil.nombres} ${perfil.apellidos}` : miembro.usuarioId,
            };
          })
        );
        if (cancelado) return;

        alumnosConNombre.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setElenco(elencoEncontrado);
        setAlumnos(alumnosConNombre);
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

  useEffect(() => {
    if (alumnos.length === 0) return;
    let cancelado = false;

    async function cargarAsistenciaDeFecha() {
      setCargandoFecha(true);
      setMensajeGuardado(null);
      try {
        const existentes = await listarAsistenciasPorElencoYFecha(elencoId, fecha);
        if (cancelado) return;

        const mapaExistentes = new Map(existentes.map((registro) => [registro.alumnoId, registro]));
        const nuevosRegistros: Record<string, RegistroLocal> = {};
        for (const alumno of alumnos) {
          const existente = mapaExistentes.get(alumno.uid);
          nuevosRegistros[alumno.uid] = {
            estado: existente?.estado ?? "presente",
            observaciones: existente?.observaciones ?? "",
          };
        }
        setRegistros(nuevosRegistros);
      } catch {
        if (!cancelado) setMensajeGuardado("No se pudieron cargar los registros de esta fecha.");
      } finally {
        if (!cancelado) setCargandoFecha(false);
      }
    }

    cargarAsistenciaDeFecha();
    return () => {
      cancelado = true;
    };
  }, [alumnos, elencoId, fecha]);

  function actualizarEstado(uid: string, estado: EstadoAsistencia) {
    setRegistros((previos) => ({
      ...previos,
      [uid]: { ...(previos[uid] ?? { observaciones: "" }), estado },
    }));
  }

  function actualizarObservaciones(uid: string, observaciones: string) {
    setRegistros((previos) => ({
      ...previos,
      [uid]: { ...(previos[uid] ?? { estado: "presente" }), observaciones },
    }));
  }

  async function handleGuardar() {
    if (!usuario) return;
    setGuardando(true);
    setMensajeGuardado(null);
    try {
      await Promise.all(
        alumnos.map((alumno) =>
          registrarAsistencia({
            elencoId,
            alumnoId: alumno.uid,
            profesorId: usuario.uid,
            fechaSesion: fecha,
            estado: registros[alumno.uid]?.estado ?? "presente",
            observaciones: registros[alumno.uid]?.observaciones || undefined,
          })
        )
      );
      setMensajeGuardado("Asistencia guardada correctamente.");
    } catch {
      setMensajeGuardado("No se pudo guardar la asistencia. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
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

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
            {elenco.tipoElenco}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-text-dark">{elenco.nombre}</h2>
          <p className="text-slate-600 text-sm font-medium">Toma de asistencia por sesión.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Fecha de la sesión
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <h3 className="text-lg font-extrabold text-text-dark">Alumnos ({alumnos.length})</h3>
          {cargandoFecha && (
            <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando registros...
            </span>
          )}
        </div>

        {alumnos.length === 0 ? (
          <EstadoVacio
            icono={Music}
            titulo="Sin alumnos inscritos"
            descripcion="Este elenco todavía no tiene alumnos asignados."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {alumnos.map((alumno) => {
              const registro = registros[alumno.uid] ?? {
                estado: "presente" as EstadoAsistencia,
                observaciones: "",
              };
              return (
                <div key={alumno.uid} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-dark text-sm">{alumno.nombre}</p>
                  </div>

                  <div className="flex gap-2">
                    {OPCIONES_ESTADO.map((opcion) => (
                      <button
                        key={opcion.valor}
                        type="button"
                        onClick={() => actualizarEstado(alumno.uid, opcion.valor)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                          registro.estado === opcion.valor
                            ? opcion.estilo
                            : "bg-slate-50 text-slate-600 hover:text-primary"
                        }`}
                      >
                        {opcion.etiqueta}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Observaciones (opcional)"
                    value={registro.observaciones}
                    onChange={(evento) => actualizarObservaciones(alumno.uid, evento.target.value)}
                    className="w-full sm:w-56 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-text-dark placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                  />
                </div>
              );
            })}
          </div>
        )}

        {alumnos.length > 0 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-4">
            {mensajeGuardado && <p className="text-xs font-bold text-slate-600">{mensajeGuardado}</p>}
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando || cargandoFecha}
              className="ml-auto flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {guardando ? "Guardando..." : "Guardar asistencia"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
