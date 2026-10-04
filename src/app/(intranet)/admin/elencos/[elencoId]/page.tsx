"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  GraduationCap,
  Music2,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { listarMiembrosDeElenco, obtenerElenco } from "@/services/elencos.service";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { Modal } from "@/components/ui/Modal";
import { useBusquedaPorRut } from "@/hooks/useBusquedaPorRut";
import { agregarMiembroAction, eliminarElencoAction, quitarMiembroAction } from "../actions";
import { listarUsuariosAction } from "../../usuarios/actions";
import type {
  CargoDocente,
  ConId,
  Elenco,
  MiembroElenco,
  UsuarioAdmin,
} from "@/types";

const ETIQUETA_CARGO: Record<CargoDocente, string> = {
  titular: "Titular",
  asistente: "Asistente",
};

/** Búsqueda por nombre. Por RUT completo se busca en el servidor (ver useBusquedaPorRut). */
function coincideNombre(usuario: UsuarioAdmin, termino: string): boolean {
  const t = termino.trim().toLowerCase();
  if (!t) return true;
  return `${usuario.nombres} ${usuario.apellidos}`.toLowerCase().includes(t);
}

export default function AdminElencoDetallePage() {
  const { elencoId } = useParams<{ elencoId: string }>();
  const router = useRouter();

  const [elenco, setElenco] = useState<ConId<Elenco> | null>(null);
  const [membresiasProfesor, setMembresiasProfesor] = useState<ConId<MiembroElenco>[]>([]);
  const [membresiasAlumno, setMembresiasAlumno] = useState<ConId<MiembroElenco>[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recargarContador, setRecargarContador] = useState(0);
  const [quitandoId, setQuitandoId] = useState<string | null>(null);

  const [busquedaProfesor, setBusquedaProfesor] = useState("");
  const [usuarioIdProfesor, setUsuarioIdProfesor] = useState("");
  const [cargoDocente, setCargoDocente] = useState<CargoDocente>("titular");
  const [enviandoProfesor, setEnviandoProfesor] = useState(false);
  const [errorProfesor, setErrorProfesor] = useState<string | null>(null);

  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [usuarioIdAlumno, setUsuarioIdAlumno] = useState("");
  const [enviandoAlumno, setEnviandoAlumno] = useState(false);
  const [errorAlumno, setErrorAlumno] = useState<string | null>(null);

  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [confirmacionNombre, setConfirmacionNombre] = useState("");
  const [eliminandoElenco, setEliminandoElenco] = useState(false);
  const [errorEliminarElenco, setErrorEliminarElenco] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const idTokenAdmin = await auth.currentUser?.getIdToken();
        if (!idTokenAdmin) throw new Error("Sin sesión");

        const [elencoResultado, profesoresResultado, alumnosResultado, usuariosResultado] =
          await Promise.all([
            obtenerElenco(elencoId),
            listarMiembrosDeElenco(elencoId, "profesor"),
            listarMiembrosDeElenco(elencoId, "alumno"),
            listarUsuariosAction(idTokenAdmin),
          ]);
        if (cancelado) return;

        if (!elencoResultado) {
          setError("El elenco no existe.");
          return;
        }
        if (!usuariosResultado.ok || !usuariosResultado.usuarios) {
          setError(usuariosResultado.error ?? "No se pudo cargar la lista de usuarios.");
          return;
        }

        setElenco(elencoResultado);
        setMembresiasProfesor(profesoresResultado);
        setMembresiasAlumno(alumnosResultado);
        setUsuarios(usuariosResultado.usuarios);
      } catch {
        if (!cancelado) setError("No se pudo cargar el elenco.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [elencoId, recargarContador]);

  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  const idsMiembros = useMemo(
    () => new Set([...membresiasProfesor, ...membresiasAlumno].map((m) => m.usuarioId)),
    [membresiasProfesor, membresiasAlumno]
  );

  const cantidadMiembrosActivos = membresiasProfesor.length + membresiasAlumno.length;

  // Los listados traen el RUT enmascarado: un RUT completo se resuelve en el servidor.
  const rutProfesor = useBusquedaPorRut(busquedaProfesor);
  const rutAlumno = useBusquedaPorRut(busquedaAlumno);

  const candidatosProfesor = useMemo(
    () =>
      usuarios.filter(
        (u) =>
          u.rol === "profesor" &&
          !idsMiembros.has(u.id) &&
          (rutProfesor.esRut ? u.id === rutProfesor.uid : coincideNombre(u, busquedaProfesor))
      ),
    [usuarios, idsMiembros, busquedaProfesor, rutProfesor.esRut, rutProfesor.uid]
  );

  const candidatosAlumno = useMemo(
    () =>
      usuarios.filter(
        (u) =>
          u.rol === "alumno" &&
          !idsMiembros.has(u.id) &&
          (rutAlumno.esRut ? u.id === rutAlumno.uid : coincideNombre(u, busquedaAlumno))
      ),
    [usuarios, idsMiembros, busquedaAlumno, rutAlumno.esRut, rutAlumno.uid]
  );

  async function handleAgregarProfesor(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorProfesor(null);

    if (!usuarioIdProfesor || !auth.currentUser) {
      setErrorProfesor("Selecciona un profesor.");
      return;
    }

    setEnviandoProfesor(true);

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await agregarMiembroAction({
        elencoId,
        usuarioId: usuarioIdProfesor,
        rol: "profesor",
        cargoDocente,
        idTokenAdmin,
      });

      if (!resultado.ok) {
        setErrorProfesor(resultado.error ?? "No se pudo agregar al profesor.");
        setEnviandoProfesor(false);
        return;
      }

      setUsuarioIdProfesor("");
      setBusquedaProfesor("");
      setCargoDocente("titular");
      setRecargarContador((contador) => contador + 1);
    } catch {
      setErrorProfesor("No se pudo agregar al profesor. Intenta de nuevo.");
    } finally {
      setEnviandoProfesor(false);
    }
  }

  async function handleAgregarAlumno(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorAlumno(null);

    if (!usuarioIdAlumno || !auth.currentUser) {
      setErrorAlumno("Selecciona un alumno.");
      return;
    }

    setEnviandoAlumno(true);

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await agregarMiembroAction({
        elencoId,
        usuarioId: usuarioIdAlumno,
        rol: "alumno",
        idTokenAdmin,
      });

      if (!resultado.ok) {
        setErrorAlumno(resultado.error ?? "No se pudo agregar al alumno.");
        setEnviandoAlumno(false);
        return;
      }

      setUsuarioIdAlumno("");
      setBusquedaAlumno("");
      setRecargarContador((contador) => contador + 1);
    } catch {
      setErrorAlumno("No se pudo agregar al alumno. Intenta de nuevo.");
    } finally {
      setEnviandoAlumno(false);
    }
  }

  async function handleQuitarMiembro(usuarioId: string, nombreCompleto: string) {
    if (!auth.currentUser) return;
    const confirmado = window.confirm(
      `¿Quitar a ${nombreCompleto} de este elenco? Esto no elimina su cuenta.`
    );
    if (!confirmado) return;

    setQuitandoId(usuarioId);

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await quitarMiembroAction({ elencoId, usuarioId, idTokenAdmin });

      if (!resultado.ok) {
        window.alert(resultado.error ?? "No se pudo quitar al usuario.");
        return;
      }

      setRecargarContador((contador) => contador + 1);
    } catch {
      window.alert("No se pudo quitar al usuario. Intenta de nuevo.");
    } finally {
      setQuitandoId(null);
    }
  }

  function abrirModalEliminar() {
    setConfirmacionNombre("");
    setErrorEliminarElenco(null);
    setMostrarModalEliminar(true);
  }

  function cerrarModalEliminar() {
    if (eliminandoElenco) return;
    setMostrarModalEliminar(false);
    setConfirmacionNombre("");
    setErrorEliminarElenco(null);
  }

  async function handleConfirmarEliminarElenco() {
    if (!auth.currentUser || !elenco) return;

    setEliminandoElenco(true);
    setErrorEliminarElenco(null);

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await eliminarElencoAction({ elencoId, idTokenAdmin });

      if (!resultado.ok) {
        setErrorEliminarElenco(resultado.error ?? "No se pudo eliminar el elenco.");
        setEliminandoElenco(false);
        return;
      }

      router.push("/admin/elencos");
    } catch {
      setErrorEliminarElenco("No se pudo eliminar el elenco. Intenta de nuevo.");
      setEliminandoElenco(false);
    }
  }

  if (cargando) {
    return <EstadoCargando texto="Cargando elenco..." />;
  }

  if (error || !elenco) {
    return <EstadoError mensaje={error ?? "El elenco no existe."} />;
  }

  return (
    <>
      <div className="space-y-6">
        <Link
          href="/admin/elencos"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Elencos
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-md shadow-primary/20 flex-shrink-0">
              <Music2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mb-1">
                {elenco.tipoElenco}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-text-dark leading-tight">
                {elenco.nombre}
              </h1>
              {elenco.descripcion && (
                <p className="text-slate-600 text-sm leading-relaxed font-medium mt-2 max-w-2xl">
                  {elenco.descripcion}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={abrirModalEliminar}
            disabled={cantidadMiembrosActivos > 0}
            title={
              cantidadMiembrosActivos > 0
                ? "Quita a todos los miembros antes de eliminar este elenco."
                : undefined
            }
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar elenco
          </button>
        </div>

        {cantidadMiembrosActivos > 0 && (
          <p className="text-xs text-slate-600 font-semibold px-1 -mt-2">
            Este elenco tiene {cantidadMiembrosActivos}{" "}
            {cantidadMiembrosActivos === 1 ? "miembro activo" : "miembros activos"}. Quita a
            todos los miembros para poder eliminarlo.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profesores */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h2 className="font-extrabold text-text-dark">Profesores Asignados</h2>
              <span className="bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {membresiasProfesor.length}
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
              {membresiasProfesor.length === 0 && (
                <p className="p-6 text-sm text-slate-600 font-semibold text-center">
                  Todavía no hay profesores asignados.
                </p>
              )}
              {membresiasProfesor.map((membresia) => {
                const usuarioMiembro = usuariosPorId.get(membresia.usuarioId);
                if (!usuarioMiembro) return null;
                const nombreCompleto = `${usuarioMiembro.nombres} ${usuarioMiembro.apellidos}`;
                return (
                  <div key={membresia.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-text-dark truncate">{nombreCompleto}</p>
                      <p className="text-xs text-slate-600 font-mono">{usuarioMiembro.rutEnmascarado ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-terracotta/10 text-terracotta px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {membresia.cargoDocente ? ETIQUETA_CARGO[membresia.cargoDocente] : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuitarMiembro(membresia.usuarioId, nombreCompleto)}
                        disabled={quitandoId === membresia.usuarioId}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all disabled:opacity-60"
                        aria-label={`Quitar a ${nombreCompleto}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleAgregarProfesor}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3"
            >
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Agregar profesor
              </p>
              <input
                type="text"
                placeholder="Buscar por nombre o RUT completo..."
                value={busquedaProfesor}
                onChange={(evento) => setBusquedaProfesor(evento.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
              />
              <select
                value={usuarioIdProfesor}
                onChange={(evento) => setUsuarioIdProfesor(evento.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark"
              >
                <option value="">
                  {candidatosProfesor.length === 0
                    ? "No hay profesores disponibles"
                    : "Selecciona un profesor..."}
                </option>
                {candidatosProfesor.map((candidato) => (
                  <option key={candidato.id} value={candidato.id}>
                    {candidato.nombres} {candidato.apellidos} — {candidato.rutEnmascarado ?? "sin RUT"}
                  </option>
                ))}
              </select>
              <select
                value={cargoDocente}
                onChange={(evento) => setCargoDocente(evento.target.value as CargoDocente)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark"
              >
                <option value="titular">Titular</option>
                <option value="asistente">Asistente</option>
              </select>

              {errorProfesor && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                >
                  {errorProfesor}
                </p>
              )}

              <button
                type="submit"
                disabled={enviandoProfesor || !usuarioIdProfesor}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                {enviandoProfesor ? "Agregando..." : "Agregar Profesor"}
              </button>
            </form>
          </div>

          {/* Alumnos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-terracotta" />
              <h2 className="font-extrabold text-text-dark">Alumnos Asignados</h2>
              <span className="bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {membresiasAlumno.length}
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
              {membresiasAlumno.length === 0 && (
                <p className="p-6 text-sm text-slate-600 font-semibold text-center">
                  Todavía no hay alumnos asignados.
                </p>
              )}
              {membresiasAlumno.map((membresia) => {
                const usuarioMiembro = usuariosPorId.get(membresia.usuarioId);
                if (!usuarioMiembro) return null;
                const nombreCompleto = `${usuarioMiembro.nombres} ${usuarioMiembro.apellidos}`;
                return (
                  <div key={membresia.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-text-dark truncate">{nombreCompleto}</p>
                      <p className="text-xs text-slate-600 font-mono">{usuarioMiembro.rutEnmascarado ?? "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuitarMiembro(membresia.usuarioId, nombreCompleto)}
                      disabled={quitandoId === membresia.usuarioId}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all disabled:opacity-60 flex-shrink-0"
                      aria-label={`Quitar a ${nombreCompleto}`}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleAgregarAlumno}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3"
            >
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Agregar alumno
              </p>
              <input
                type="text"
                placeholder="Buscar por nombre o RUT completo..."
                value={busquedaAlumno}
                onChange={(evento) => setBusquedaAlumno(evento.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
              />
              <select
                value={usuarioIdAlumno}
                onChange={(evento) => setUsuarioIdAlumno(evento.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark"
              >
                <option value="">
                  {candidatosAlumno.length === 0
                    ? "No hay alumnos disponibles"
                    : "Selecciona un alumno..."}
                </option>
                {candidatosAlumno.map((candidato) => (
                  <option key={candidato.id} value={candidato.id}>
                    {candidato.nombres} {candidato.apellidos} — {candidato.rutEnmascarado ?? "sin RUT"}
                  </option>
                ))}
              </select>

              {errorAlumno && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                >
                  {errorAlumno}
                </p>
              )}

              <button
                type="submit"
                disabled={enviandoAlumno || !usuarioIdAlumno}
                className="w-full flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                {enviandoAlumno ? "Agregando..." : "Agregar Alumno"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {mostrarModalEliminar && elenco && (
        <Modal
          titulo="Eliminar elenco"
          subtitulo={elenco.nombre}
          icono={AlertTriangle}
          tono="peligro"
          ancho="sm"
          bloqueado={eliminandoElenco}
          onCerrar={cerrarModalEliminar}
        >
            <p className="text-sm text-slate-600 mb-4">
              Esta acción no se puede deshacer. Escribe{" "}
              <span className="font-bold text-text-dark">{elenco.nombre}</span> para confirmar.
            </p>

            <label
              htmlFor="confirmacionNombre"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              Nombre del elenco
            </label>
            <input
              id="confirmacionNombre"
              type="text"
              value={confirmacionNombre}
              onChange={(evento) => setConfirmacionNombre(evento.target.value)}
              autoFocus
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500 mb-4"
            />

            {errorEliminarElenco && (
              <p
                role="alert"
                className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4"
              >
                {errorEliminarElenco}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cerrarModalEliminar}
                disabled={eliminandoElenco}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarElenco}
                disabled={eliminandoElenco || confirmacionNombre !== elenco.nombre}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {eliminandoElenco ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
        </Modal>
      )}
    </>
  );
}
