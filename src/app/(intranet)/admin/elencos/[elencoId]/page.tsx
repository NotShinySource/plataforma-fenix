"use client";

import { etiquetaTipoGrupo } from "@/lib/elencos";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music2, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { listarMiembrosDeElenco, obtenerElenco } from "@/services/elencos.service";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { ColumnaMiembros } from "@/components/intranet/admin/elencos/ColumnaMiembros";
import { ModalEliminarElenco } from "@/components/intranet/admin/elencos/ModalEliminarElenco";
import { quitarMiembroAction } from "../actions";
import { listarUsuariosAction } from "../../usuarios/actions";
import type { ConId, Elenco, MiembroElenco, UsuarioAdmin } from "@/types";

export default function AdminElencoDetallePage() {
  const { elencoId } = useParams<{ elencoId: string }>();

  const [elenco, setElenco] = useState<ConId<Elenco> | null>(null);
  const [membresiasProfesor, setMembresiasProfesor] = useState<ConId<MiembroElenco>[]>([]);
  const [membresiasAlumno, setMembresiasAlumno] = useState<ConId<MiembroElenco>[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recargarContador, setRecargarContador] = useState(0);
  const [quitandoId, setQuitandoId] = useState<string | null>(null);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);

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

  const idsMiembros = useMemo(
    () => new Set([...membresiasProfesor, ...membresiasAlumno].map((m) => m.usuarioId)),
    [membresiasProfesor, membresiasAlumno]
  );

  const cantidadMiembrosActivos = membresiasProfesor.length + membresiasAlumno.length;

  function recargar() {
    setRecargarContador((contador) => contador + 1);
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

      recargar();
    } catch {
      window.alert("No se pudo quitar al usuario. Intenta de nuevo.");
    } finally {
      setQuitandoId(null);
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
                {etiquetaTipoGrupo(elenco)}
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
            onClick={() => setMostrarModalEliminar(true)}
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
          {(["profesor", "alumno"] as const).map((rol) => (
            <ColumnaMiembros
              key={rol}
              elencoId={elencoId}
              rol={rol}
              membresias={rol === "profesor" ? membresiasProfesor : membresiasAlumno}
              usuarios={usuarios}
              idsMiembros={idsMiembros}
              quitandoId={quitandoId}
              onQuitar={handleQuitarMiembro}
              onAgregado={recargar}
            />
          ))}
        </div>
      </div>

      {mostrarModalEliminar && (
        <ModalEliminarElenco elenco={elenco} onCerrar={() => setMostrarModalEliminar(false)} />
      )}
    </>
  );
}
