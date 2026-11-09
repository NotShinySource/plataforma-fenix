"use client";

import { useMemo, useState, type FormEvent } from "react";
import { GraduationCap, UserMinus, UserPlus, Users } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { coincideNombre, nombreCompleto } from "@/lib/usuarios";
import { CLASE_CAMPO } from "@/components/ui/estilos";
import { useBusquedaPorRut } from "@/hooks/useBusquedaPorRut";
import { agregarMiembroAction } from "@/app/(intranet)/admin/elencos/actions";
import type { CargoDocente, ConId, MiembroElenco, UsuarioAdmin } from "@/types";

const ETIQUETA_CARGO: Record<CargoDocente, string> = {
  titular: "Titular",
  asistente: "Asistente",
};

/** Lo único que cambia entre la columna de profesores y la de alumnos. */
const CONFIGURACION = {
  profesor: {
    titulo: "Profesores Asignados",
    icono: GraduationCap,
    colorIcono: "text-primary",
    vacio: "Todavía no hay profesores asignados.",
    agregar: "Agregar profesor",
    seleccionar: "Selecciona un profesor...",
    sinCandidatos: "No hay profesores disponibles",
    boton: "Agregar Profesor",
    colorBoton: "bg-primary hover:bg-primary-dark",
    error: "No se pudo agregar al profesor.",
  },
  alumno: {
    titulo: "Alumnos Asignados",
    icono: Users,
    colorIcono: "text-terracotta",
    vacio: "Todavía no hay alumnos asignados.",
    agregar: "Agregar alumno",
    seleccionar: "Selecciona un alumno...",
    sinCandidatos: "No hay alumnos disponibles",
    boton: "Agregar Alumno",
    colorBoton: "bg-terracotta hover:bg-terracotta-dark",
    error: "No se pudo agregar al alumno.",
  },
} as const;

interface ColumnaMiembrosProps {
  elencoId: string;
  rol: "profesor" | "alumno";
  membresias: ConId<MiembroElenco>[];
  /** Todas las cuentas, para mostrar nombres y elegir a quién agregar. */
  usuarios: UsuarioAdmin[];
  /** Miembros actuales del elenco (de ambos roles): no se ofrecen para agregar. */
  idsMiembros: Set<string>;
  quitandoId: string | null;
  onQuitar: (usuarioId: string, nombre: string) => void;
  onAgregado: () => void;
}

/**
 * Lista de miembros de un rol y el formulario para agregar más. Para
 * profesores se elige además el cargo en este elenco: el titular queda como
 * docente responsable del elenco.
 */
export function ColumnaMiembros({
  elencoId,
  rol,
  membresias,
  usuarios,
  idsMiembros,
  quitandoId,
  onQuitar,
  onAgregado,
}: ColumnaMiembrosProps) {
  const configuracion = CONFIGURACION[rol];
  const Icono = configuracion.icono;

  const [busqueda, setBusqueda] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [cargoDocente, setCargoDocente] = useState<CargoDocente>("titular");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Los listados traen el RUT enmascarado: un RUT completo se resuelve en el servidor.
  const busquedaRut = useBusquedaPorRut(busqueda);

  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  const candidatos = useMemo(
    () =>
      usuarios.filter(
        (u) =>
          u.rol === rol &&
          u.activo !== false &&
          !idsMiembros.has(u.id) &&
          (busquedaRut.esRut ? u.id === busquedaRut.uid : coincideNombre(u, busqueda))
      ),
    [usuarios, rol, idsMiembros, busqueda, busquedaRut.esRut, busquedaRut.uid]
  );

  async function handleAgregar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!usuarioId || !auth.currentUser) {
      setError(configuracion.seleccionar.replace("...", "."));
      return;
    }

    setEnviando(true);
    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await agregarMiembroAction({
        elencoId,
        usuarioId,
        rol,
        ...(rol === "profesor" ? { cargoDocente } : {}),
        idTokenAdmin,
      });

      if (!resultado.ok) {
        setError(resultado.error ?? configuracion.error);
        return;
      }

      setUsuarioId("");
      setBusqueda("");
      setCargoDocente("titular");
      onAgregado();
    } catch {
      setError(`${configuracion.error} Intenta de nuevo.`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icono className={`w-5 h-5 ${configuracion.colorIcono}`} />
        <h2 className="font-extrabold text-text-dark">{configuracion.titulo}</h2>
        <span className="bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
          {membresias.length}
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
        {membresias.length === 0 && (
          <p className="p-6 text-sm text-slate-600 font-semibold text-center">{configuracion.vacio}</p>
        )}
        {membresias.map((membresia) => {
          const miembro = usuariosPorId.get(membresia.usuarioId);
          if (!miembro) return null;
          const nombre = nombreCompleto(miembro);
          return (
            <div key={membresia.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-text-dark truncate">{nombre}</p>
                <p className="text-xs text-slate-600 font-mono">{miembro.rutEnmascarado ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {rol === "profesor" && (
                  <span className="bg-terracotta/10 text-terracotta px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {membresia.cargoDocente ? ETIQUETA_CARGO[membresia.cargoDocente] : "—"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onQuitar(membresia.usuarioId, nombre)}
                  disabled={quitandoId === membresia.usuarioId}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all disabled:opacity-60"
                  aria-label={`Quitar a ${nombre}`}
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAgregar} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{configuracion.agregar}</p>
        <input
          type="text"
          placeholder="Buscar por nombre o RUT completo..."
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          aria-label={`Buscar para ${configuracion.agregar.toLowerCase()}`}
          className={CLASE_CAMPO}
        />
        <select
          value={usuarioId}
          onChange={(evento) => setUsuarioId(evento.target.value)}
          aria-label={configuracion.seleccionar}
          className={CLASE_CAMPO}
        >
          <option value="">{candidatos.length === 0 ? configuracion.sinCandidatos : configuracion.seleccionar}</option>
          {candidatos.map((candidato) => (
            <option key={candidato.id} value={candidato.id}>
              {nombreCompleto(candidato)} — {candidato.rutEnmascarado ?? "sin RUT"}
            </option>
          ))}
        </select>
        {rol === "profesor" && (
          <select
            value={cargoDocente}
            onChange={(evento) => setCargoDocente(evento.target.value as CargoDocente)}
            aria-label="Cargo en este elenco"
            className={CLASE_CAMPO}
          >
            <option value="titular">Titular</option>
            <option value="asistente">Asistente</option>
          </select>
        )}

        {error && (
          <p
            role="alert"
            className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando || !usuarioId}
          className={`w-full flex items-center justify-center gap-2 ${configuracion.colorBoton} text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <UserPlus className="w-4 h-4" />
          {enviando ? "Agregando..." : configuracion.boton}
        </button>
      </form>
    </div>
  );
}
