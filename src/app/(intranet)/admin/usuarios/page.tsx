"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { formatearRutInput } from "@/lib/format";
import { rutEsValido } from "@/lib/auth/rut";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  crearUsuarioAction,
  editarUsuarioAction,
  eliminarUsuarioAction,
  listarUsuariosConDatosAction,
  type RolCreable,
} from "./actions";
import type { EstadoActivacion, RolUsuario, UsuarioConDatosPrivados } from "@/types";

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  alumno: "Alumno",
  profesor: "Docente",
  administrador: "Administrador",
};

const ETIQUETA_ESTADO: Record<EstadoActivacion, { texto: string; estilo: string }> = {
  pendiente: { texto: "Pendiente", estilo: "bg-amber-50 text-amber-700" },
  activada: { texto: "Activa", estilo: "bg-emerald-50 text-emerald-700" },
};

const CLASE_INPUT =
  "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500";
const CLASE_LABEL = "block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1";

/** Fecha de hoy en formato YYYY-MM-DD, para el máximo del selector de fecha. */
function hoyIso(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

interface CamposContactoProps {
  rol: RolUsuario;
  prefijoId: string;
  email: string;
  emailApoderado: string;
  onEmail: (valor: string) => void;
  onEmailApoderado: (valor: string) => void;
}

/** Correos según el rol: alumno → apoderado obligatorio + propio opcional; resto → propio obligatorio. */
function CamposContacto({
  rol,
  prefijoId,
  email,
  emailApoderado,
  onEmail,
  onEmailApoderado,
}: CamposContactoProps) {
  if (rol === "alumno") {
    return (
      <>
        <div>
          <label htmlFor={`${prefijoId}-emailApoderado`} className={CLASE_LABEL}>
            Correo del apoderado
          </label>
          <input
            id={`${prefijoId}-emailApoderado`}
            type="email"
            value={emailApoderado}
            onChange={(evento) => onEmailApoderado(evento.target.value)}
            required
            maxLength={254}
            placeholder="apoderado@gmail.com"
            className={CLASE_INPUT}
          />
        </div>
        <div>
          <label htmlFor={`${prefijoId}-email`} className={CLASE_LABEL}>
            Correo del estudiante <span className="normal-case font-semibold">(opcional)</span>
          </label>
          <input
            id={`${prefijoId}-email`}
            type="email"
            value={email}
            onChange={(evento) => onEmail(evento.target.value)}
            maxLength={254}
            placeholder="estudiante@gmail.com"
            className={CLASE_INPUT}
          />
        </div>
      </>
    );
  }

  return (
    <div>
      <label htmlFor={`${prefijoId}-email`} className={CLASE_LABEL}>
        Correo
      </label>
      <input
        id={`${prefijoId}-email`}
        type="email"
        value={email}
        onChange={(evento) => onEmail(evento.target.value)}
        required
        maxLength={254}
        placeholder="docente@gmail.com"
        className={CLASE_INPUT}
      />
    </div>
  );
}

export default function AdminUsuariosPage() {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rut, setRut] = useState("");
  const [rol, setRol] = useState<RolCreable>("alumno");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [email, setEmail] = useState("");
  const [emailApoderado, setEmailApoderado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creadoNombre, setCreadoNombre] = useState<string | null>(null);

  const [usuarios, setUsuarios] = useState<UsuarioConDatosPrivados[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null);
  const [recargarContador, setRecargarContador] = useState(0);

  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioConDatosPrivados | null>(null);
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const [usuarioAEditar, setUsuarioAEditar] = useState<UsuarioConDatosPrivados | null>(null);
  const [nombresEditar, setNombresEditar] = useState("");
  const [apellidosEditar, setApellidosEditar] = useState("");
  const [fechaEditar, setFechaEditar] = useState("");
  const [emailEditar, setEmailEditar] = useState("");
  const [emailApoderadoEditar, setEmailApoderadoEditar] = useState("");
  const [editando, setEditando] = useState(false);
  const [errorEditar, setErrorEditar] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargandoUsuarios(true);
      setErrorUsuarios(null);
      try {
        const idTokenAdmin = await auth.currentUser?.getIdToken();
        if (!idTokenAdmin) throw new Error("Sin sesión");
        const resultado = await listarUsuariosConDatosAction(idTokenAdmin);
        if (cancelado) return;
        if (!resultado.ok || !resultado.usuarios) {
          setErrorUsuarios(resultado.error ?? "No se pudo cargar la lista de usuarios.");
          return;
        }
        setUsuarios(resultado.usuarios);
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
    setCreadoNombre(null);

    if (!rutEsValido(rut)) {
      setError("El RUT ingresado no es válido (dígito verificador incorrecto).");
      return;
    }
    if (!auth.currentUser) return;

    setEnviando(true);
    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await crearUsuarioAction({
        nombres,
        apellidos,
        rut,
        rol,
        fechaNacimiento,
        email,
        emailApoderado: rol === "alumno" ? emailApoderado : "",
        idTokenAdmin,
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo crear el usuario.");
        return;
      }

      setCreadoNombre(`${nombres.trim()} ${apellidos.trim()}`);
      setNombres("");
      setApellidos("");
      setRut("");
      setRol("alumno");
      setFechaNacimiento("");
      setEmail("");
      setEmailApoderado("");
      setRecargarContador((contador) => contador + 1);
    } catch {
      setError("No se pudo crear el usuario. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function abrirModalEliminar(usuarioObjetivo: UsuarioConDatosPrivados) {
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

  function abrirModalEditar(usuarioObjetivo: UsuarioConDatosPrivados) {
    setUsuarioAEditar(usuarioObjetivo);
    setNombresEditar(usuarioObjetivo.nombres);
    setApellidosEditar(usuarioObjetivo.apellidos);
    setFechaEditar(usuarioObjetivo.datos?.fechaNacimiento ?? "");
    setEmailEditar(usuarioObjetivo.datos?.email ?? "");
    setEmailApoderadoEditar(usuarioObjetivo.datos?.emailApoderado ?? "");
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
        fechaNacimiento: fechaEditar,
        email: emailEditar,
        emailApoderado: usuarioAEditar.rol === "alumno" ? emailApoderadoEditar : "",
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
            <h1 className="font-black text-xl text-text-dark leading-tight">Crear Usuario</h1>
            <p className="text-slate-600 text-sm font-semibold">Alta de alumnos y profesores</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[24px] shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5"
          noValidate
        >
          <div>
            <label htmlFor="rol" className={CLASE_LABEL}>
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              value={rol}
              onChange={(evento) => setRol(evento.target.value as RolCreable)}
              required
              className={CLASE_INPUT}
            >
              <option value="alumno">Alumno</option>
              <option value="profesor">Profesor</option>
            </select>
          </div>

          <div>
            <label htmlFor="nombres" className={CLASE_LABEL}>
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
              className={CLASE_INPUT}
            />
          </div>

          <div>
            <label htmlFor="apellidos" className={CLASE_LABEL}>
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
              className={CLASE_INPUT}
            />
          </div>

          <div>
            <label htmlFor="rut" className={CLASE_LABEL}>
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
              className={CLASE_INPUT}
            />
          </div>

          <div>
            <label htmlFor="fechaNacimiento" className={CLASE_LABEL}>
              Fecha de nacimiento
            </label>
            <input
              id="fechaNacimiento"
              name="fechaNacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(evento) => setFechaNacimiento(evento.target.value)}
              required
              min="1900-01-01"
              max={hoyIso()}
              className={CLASE_INPUT}
            />
          </div>

          <CamposContacto
            rol={rol}
            prefijoId="crear"
            email={email}
            emailApoderado={emailApoderado}
            onEmail={setEmail}
            onEmailApoderado={setEmailApoderado}
          />

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

        {creadoNombre && (
          <div
            role="status"
            className="mt-6 bg-white rounded-[24px] shadow-xl border border-emerald-100 p-6 sm:p-8 flex gap-3"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h2 className="font-black text-lg text-text-dark mb-1">
                {creadoNombre} fue creado correctamente
              </h2>
              <p className="text-sm text-slate-600 font-semibold">
                La cuenta queda pendiente de activación. Para crear su contraseña, el usuario
                debe ingresar su RUT en &quot;Primera vez / Olvidé mi contraseña&quot; del inicio
                de sesión: recibirá un enlace en el correo registrado.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-xl text-text-dark leading-tight">Usuarios Registrados</h2>
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
                    <th className="text-left font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-4">
                      Estado
                    </th>
                    <th className="text-right font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-4">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuarioFila) => {
                    const estado = ETIQUETA_ESTADO[usuarioFila.estadoActivacion];
                    return (
                      <tr key={usuarioFila.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-6 py-4 font-semibold text-text-dark">
                          {usuarioFila.nombres} {usuarioFila.apellidos}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          {usuarioFila.datos?.rut ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                            {ETIQUETA_ROL[usuarioFila.rol]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${estado.estilo}`}>
                            {estado.texto}
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
                    );
                  })}
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
                <h2 className="font-black text-lg text-text-dark leading-tight">Eliminar usuario</h2>
                <p className="text-sm text-slate-600 font-semibold truncate">
                  {usuarioAEliminar.nombres} {usuarioAEliminar.apellidos}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Esta acción no se puede deshacer. Ingresa tu contraseña de administrador para confirmar.
            </p>

            <label htmlFor="passwordAdmin" className={CLASE_LABEL}>
              Tu contraseña
            </label>
            <input
              id="passwordAdmin"
              type="password"
              value={passwordAdmin}
              onChange={(evento) => setPasswordAdmin(evento.target.value)}
              autoComplete="current-password"
              autoFocus
              className={`${CLASE_INPUT} mb-4`}
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary flex-shrink-0">
                <Pencil className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-lg text-text-dark leading-tight">Editar usuario</h2>
                <p className="text-sm text-slate-600 font-semibold truncate">
                  {usuarioAEditar.datos?.rut ?? "Sin RUT registrado"} ·{" "}
                  {ETIQUETA_ROL[usuarioAEditar.rol]}
                </p>
              </div>
            </div>

            {!usuarioAEditar.datos && (
              <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-4">
                Esta cuenta no tiene datos privados registrados (fue creada antes del cambio de
                modelo). No se puede editar: debe eliminarse y crearse de nuevo.
              </p>
            )}

            <div className="space-y-4 mb-4">
              <div>
                <label htmlFor="nombresEditar" className={CLASE_LABEL}>
                  Nombres
                </label>
                <input
                  id="nombresEditar"
                  type="text"
                  value={nombresEditar}
                  onChange={(evento) => setNombresEditar(evento.target.value)}
                  maxLength={100}
                  autoFocus
                  className={CLASE_INPUT}
                />
              </div>

              <div>
                <label htmlFor="apellidosEditar" className={CLASE_LABEL}>
                  Apellidos
                </label>
                <input
                  id="apellidosEditar"
                  type="text"
                  value={apellidosEditar}
                  onChange={(evento) => setApellidosEditar(evento.target.value)}
                  maxLength={100}
                  className={CLASE_INPUT}
                />
              </div>

              <div>
                <label htmlFor="fechaEditar" className={CLASE_LABEL}>
                  Fecha de nacimiento
                </label>
                <input
                  id="fechaEditar"
                  type="date"
                  value={fechaEditar}
                  onChange={(evento) => setFechaEditar(evento.target.value)}
                  min="1900-01-01"
                  max={hoyIso()}
                  className={CLASE_INPUT}
                />
              </div>

              <CamposContacto
                rol={usuarioAEditar.rol}
                prefijoId="editar"
                email={emailEditar}
                emailApoderado={emailApoderadoEditar}
                onEmail={setEmailEditar}
                onEmailApoderado={setEmailApoderadoEditar}
              />
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
                disabled={
                  editando ||
                  !usuarioAEditar.datos ||
                  !nombresEditar.trim() ||
                  !apellidosEditar.trim()
                }
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
