"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  ArrowLeft,
  AlertTriangle,
  UserPlus,
  Copy,
  Check,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { formatearRutInput } from "@/lib/format";
import { rutEsValido } from "@/lib/auth/rut";
import { listarUsuarios } from "@/services/usuarios.service";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  crearUsuarioAction,
  editarUsuarioAction,
  eliminarUsuarioAction,
  type RolCreable,
} from "./actions";
import type { ConId, RolUsuario, Usuario } from "@/types";

interface UsuarioCreado {
  email: string;
  password: string;
}

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  alumno: "Alumno",
  profesor: "Docente",
  administrador: "Administrador",
};

export default function AdminUsuariosPage() {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rut, setRut] = useState("");
  const [rol, setRol] = useState<RolCreable>("alumno");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<UsuarioCreado | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [usuarios, setUsuarios] = useState<ConId<Usuario>[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null);
  const [recargarContador, setRecargarContador] = useState(0);

  const [usuarioAEliminar, setUsuarioAEliminar] = useState<ConId<Usuario> | null>(null);
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const [usuarioAEditar, setUsuarioAEditar] = useState<ConId<Usuario> | null>(null);
  const [nombresEditar, setNombresEditar] = useState("");
  const [apellidosEditar, setApellidosEditar] = useState("");
  const [editando, setEditando] = useState(false);
  const [errorEditar, setErrorEditar] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargandoUsuarios(true);
      setErrorUsuarios(null);
      try {
        const resultado = await listarUsuarios();
        if (!cancelado) setUsuarios(resultado);
      } catch {
        if (!cancelado) setErrorUsuarios("No se pudo cargar la lista de usuarios.");
      } finally {
        if (!cancelado) setCargandoUsuarios(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [recargarContador]);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setCreado(null);

    if (!rutEsValido(rut)) {
      setError("El RUT ingresado no es válido (dígito verificador incorrecto).");
      return;
    }

    setEnviando(true);

    const resultado = await crearUsuarioAction({ nombres, apellidos, rut, rol });

    if (!resultado.ok || !resultado.email || !resultado.password) {
      setError(resultado.error ?? "No se pudo crear el usuario.");
      setEnviando(false);
      return;
    }

    setCreado({ email: resultado.email, password: resultado.password });
    setNombres("");
    setApellidos("");
    setRut("");
    setRol("alumno");
    setEnviando(false);
    setRecargarContador((contador) => contador + 1);
  }

  function abrirModalEliminar(usuarioObjetivo: ConId<Usuario>) {
    setUsuarioAEliminar(usuarioObjetivo);
    setPasswordAdmin("");
    setErrorEliminar(null);
  }

  function cerrarModalEliminar() {
    if (eliminando) return;
    setUsuarioAEliminar(null);
    setPasswordAdmin("");
    setErrorEliminar(null);
  }

  async function handleConfirmarEliminar() {
    if (!usuarioAEliminar || !auth.currentUser?.email) return;

    setEliminando(true);
    setErrorEliminar(null);

    try {
      const credencial = EmailAuthProvider.credential(auth.currentUser.email, passwordAdmin);
      await reauthenticateWithCredential(auth.currentUser, credencial);
    } catch {
      setErrorEliminar("Contraseña incorrecta.");
      setEliminando(false);
      return;
    }

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await eliminarUsuarioAction({
        uid: usuarioAEliminar.id,
        idTokenAdmin,
      });

      if (!resultado.ok) {
        setErrorEliminar(resultado.error ?? "No se pudo eliminar el usuario.");
        setEliminando(false);
        return;
      }

      setUsuarioAEliminar(null);
      setPasswordAdmin("");
      setRecargarContador((contador) => contador + 1);
    } catch {
      setErrorEliminar("No se pudo eliminar el usuario. Intenta de nuevo.");
    } finally {
      setEliminando(false);
    }
  }

  function abrirModalEditar(usuarioObjetivo: ConId<Usuario>) {
    setUsuarioAEditar(usuarioObjetivo);
    setNombresEditar(usuarioObjetivo.nombres);
    setApellidosEditar(usuarioObjetivo.apellidos);
    setErrorEditar(null);
  }

  function cerrarModalEditar() {
    if (editando) return;
    setUsuarioAEditar(null);
    setErrorEditar(null);
  }

  async function handleConfirmarEditar() {
    if (!usuarioAEditar || !auth.currentUser) return;

    setEditando(true);
    setErrorEditar(null);

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await editarUsuarioAction({
        uid: usuarioAEditar.id,
        nombres: nombresEditar,
        apellidos: apellidosEditar,
        idTokenAdmin,
      });

      if (!resultado.ok) {
        setErrorEditar(resultado.error ?? "No se pudo editar el usuario.");
        setEditando(false);
        return;
      }

      setUsuarioAEditar(null);
      setRecargarContador((contador) => contador + 1);
    } catch {
      setErrorEditar("No se pudo editar el usuario. Intenta de nuevo.");
    } finally {
      setEditando(false);
    }
  }

  async function copiarPassword() {
    if (!creado) return;
    try {
      await navigator.clipboard.writeText(creado.password);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: la contraseña sigue visible en pantalla.
    }
  }

  return (
    <main className="min-h-screen bg-surface p-4 sm:p-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl text-text-dark leading-tight">
              Crear Usuario
            </h1>
            <p className="text-slate-600 text-sm font-semibold">
              Alta de alumnos y profesores
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[24px] shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="nombres"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              Nombres
            </label>
            <input
              id="nombres"
              name="nombres"
              type="text"
              value={nombres}
              onChange={(evento) => setNombres(evento.target.value)}
              required
              maxLength={100}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="apellidos"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              Apellidos
            </label>
            <input
              id="apellidos"
              name="apellidos"
              type="text"
              value={apellidos}
              onChange={(evento) => setApellidos(evento.target.value)}
              required
              maxLength={100}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="rut"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              RUT
            </label>
            <input
              id="rut"
              name="rut"
              type="text"
              placeholder="Ej: 21.345.678-9"
              value={rut}
              onChange={(evento) => setRut(formatearRutInput(evento.target.value))}
              required
              maxLength={12}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="rol"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              value={rol}
              onChange={(evento) => setRol(evento.target.value as RolCreable)}
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark"
            >
              <option value="alumno">Alumno</option>
              <option value="profesor">Profesor</option>
            </select>
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? "Creando..." : "Crear Usuario"}
          </button>
        </form>

        {creado && (
          <div className="mt-6 bg-white rounded-[24px] shadow-xl border border-emerald-100 p-6 sm:p-8">
            <h2 className="font-black text-lg text-text-dark mb-1">
              Usuario creado correctamente
            </h2>
            <p className="text-sm text-slate-600 font-semibold mb-4">
              Copia la contraseña ahora — no se volverá a mostrar.
            </p>

            <div className="space-y-3">
              <div>
                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Correo interno
                </span>
                <p className="font-mono text-sm text-text-dark bg-slate-50 rounded-xl px-4 py-2.5 break-all">
                  {creado.email}
                </p>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Contraseña generada
                </span>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-text-dark bg-slate-50 rounded-xl px-4 py-2.5 flex-1 break-all">
                    {creado.password}
                  </p>
                  <button
                    type="button"
                    onClick={copiarPassword}
                    className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary p-2.5 rounded-xl transition-all"
                    aria-label="Copiar contraseña"
                  >
                    {copiado ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto mt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-xl text-text-dark leading-tight">
              Usuarios Registrados
            </h2>
            <p className="text-slate-600 text-sm font-semibold">
              Alumnos y profesores en la plataforma
            </p>
          </div>
        </div>

        {cargandoUsuarios && <EstadoCargando texto="Cargando usuarios..." />}
        {errorUsuarios && <EstadoError mensaje={errorUsuarios} />}
        {!cargandoUsuarios && !errorUsuarios && usuarios.length === 0 && (
          <EstadoVacio
            icono={Users}
            titulo="Todavía no hay usuarios registrados"
            descripcion="Los alumnos y profesores que crees aparecerán aquí."
          />
        )}
        {!cargandoUsuarios && !errorUsuarios && usuarios.length > 0 && (
          <div className="bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-4">
                      Nombre
                    </th>
                    <th className="text-left font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-4">
                      RUT
                    </th>
                    <th className="text-left font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-4">
                      Rol
                    </th>
                    <th className="text-right font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-4">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuarioFila) => (
                    <tr key={usuarioFila.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-4 font-semibold text-text-dark">
                        {usuarioFila.nombres} {usuarioFila.apellidos}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                        {usuarioFila.rut}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                          {ETIQUETA_ROL[usuarioFila.rol]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(usuarioFila)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          {usuarioFila.rol !== "administrador" && (
                            <button
                              type="button"
                              onClick={() => abrirModalEliminar(usuarioFila)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {usuarioAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-50 p-2.5 rounded-xl text-red-600 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-lg text-text-dark leading-tight">
                  Eliminar usuario
                </h2>
                <p className="text-sm text-slate-600 font-semibold truncate">
                  {usuarioAEliminar.nombres} {usuarioAEliminar.apellidos}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Esta acción no se puede deshacer. Ingresa tu contraseña de administrador
              para confirmar.
            </p>

            <label
              htmlFor="passwordAdmin"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              Tu contraseña
            </label>
            <input
              id="passwordAdmin"
              type="password"
              value={passwordAdmin}
              onChange={(evento) => setPasswordAdmin(evento.target.value)}
              autoComplete="current-password"
              autoFocus
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500 mb-4"
            />

            {errorEliminar && (
              <p
                role="alert"
                className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4"
              >
                {errorEliminar}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cerrarModalEliminar}
                disabled={eliminando}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={eliminando || !passwordAdmin}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {usuarioAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary flex-shrink-0">
                <Pencil className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-lg text-text-dark leading-tight">
                  Editar usuario
                </h2>
                <p className="text-sm text-slate-600 font-semibold truncate">
                  {usuarioAEditar.nombres} {usuarioAEditar.apellidos}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label
                  htmlFor="nombresEditar"
                  className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
                >
                  Nombres
                </label>
                <input
                  id="nombresEditar"
                  type="text"
                  value={nombresEditar}
                  onChange={(evento) => setNombresEditar(evento.target.value)}
                  maxLength={100}
                  autoFocus
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500"
                />
              </div>

              <div>
                <label
                  htmlFor="apellidosEditar"
                  className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
                >
                  Apellidos
                </label>
                <input
                  id="apellidosEditar"
                  type="text"
                  value={apellidosEditar}
                  onChange={(evento) => setApellidosEditar(evento.target.value)}
                  maxLength={100}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500"
                />
              </div>
            </div>

            {errorEditar && (
              <p
                role="alert"
                className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4"
              >
                {errorEditar}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cerrarModalEditar}
                disabled={editando}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEditar}
                disabled={editando || !nombresEditar.trim() || !apellidosEditar.trim()}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
