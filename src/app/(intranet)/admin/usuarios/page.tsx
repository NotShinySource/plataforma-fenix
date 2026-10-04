"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Mail,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { formatearRutInput } from "@/lib/format";
import { rutEsValido } from "@/lib/auth/rut";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Modal } from "@/components/ui/Modal";
import {
  crearUsuarioAction,
  editarUsuarioAction,
  eliminarUsuarioAction,
  generarEnlaceAccesoAction,
  listarUsuariosConDatosAction,
  type RolCreable,
} from "./actions";
import type { EstadoActivacion, RolUsuario, UsuarioConDatosPrivados } from "@/types";

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  alumno: "Alumno",
  profesor: "Docente",
  administrador: "Administrador",
};

const ESTILO_ROL: Record<RolUsuario, string> = {
  alumno: "bg-primary/10 text-primary",
  profesor: "bg-indigo-50 text-indigo-700",
  administrador: "bg-slate-200/70 text-slate-700",
};

const ETIQUETA_ESTADO: Record<EstadoActivacion, { texto: string; estilo: string }> = {
  pendiente: { texto: "Pendiente", estilo: "bg-amber-50 text-amber-700" },
  activada: { texto: "Activa", estilo: "bg-emerald-50 text-emerald-700" },
};

type FiltroRol = "todos" | RolUsuario;
type FiltroEstado = "todos" | EstadoActivacion;

const OPCIONES_ROL: { valor: FiltroRol; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "alumno", etiqueta: "Alumnos" },
  { valor: "profesor", etiqueta: "Docentes" },
  { valor: "administrador", etiqueta: "Administradores" },
];

const CLASE_INPUT =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500";
const CLASE_LABEL = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 px-1";
const CLASE_BOTON_SECUNDARIO =
  "flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60";
const CLASE_ERROR =
  "text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3";

/** Fecha de hoy en formato YYYY-MM-DD, para el máximo del selector de fecha. */
function hoyIso(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function iniciales(usuario: UsuarioConDatosPrivados): string {
  return `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase();
}

/** Correo al que llegan los enlaces: el del apoderado para alumnos, el propio para el resto. */
function correoPrincipal(usuario: UsuarioConDatosPrivados): string | null {
  return usuario.datos?.emailApoderado ?? usuario.datos?.email ?? null;
}

function coincideBusqueda(usuario: UsuarioConDatosPrivados, termino: string): boolean {
  const t = termino.trim().toLowerCase();
  if (!t) return true;
  const rut = usuario.datos?.rut ?? "";
  return (
    `${usuario.nombres} ${usuario.apellidos}`.toLowerCase().includes(t) ||
    rut.toLowerCase().includes(t) ||
    rut.replace(/[.\-]/g, "").toLowerCase().includes(t.replace(/[.\-]/g, ""))
  );
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
            Correo del estudiante{" "}
            <span className="normal-case font-semibold text-slate-600">(opcional)</span>
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

interface AccionesFilaProps {
  usuario: UsuarioConDatosPrivados;
  onEditar: () => void;
  onEnlace: () => void;
  onEliminar: () => void;
}

/** Acciones por usuario. Enlace y Eliminar no aplican a administradores. */
function AccionesFila({ usuario, onEditar, onEnlace, onEliminar }: AccionesFilaProps) {
  const nombre = `${usuario.nombres} ${usuario.apellidos}`;
  const base = "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all";
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onEditar}
        aria-label={`Editar a ${nombre}`}
        className={`${base} bg-primary/10 hover:bg-primary/20 text-primary`}
      >
        <Pencil className="w-3.5 h-3.5" />
        Editar
      </button>
      {usuario.rol !== "administrador" && (
        <>
          <button
            type="button"
            onClick={onEnlace}
            aria-label={`Generar enlace de acceso para ${nombre}`}
            className={`${base} bg-slate-100 hover:bg-slate-200 text-slate-700`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Enlace
          </button>
          <button
            type="button"
            onClick={onEliminar}
            aria-label={`Eliminar a ${nombre}`}
            className={`${base} bg-red-50 hover:bg-red-100 text-red-600`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
        </>
      )}
    </div>
  );
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioConDatosPrivados[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null);
  const [recargarContador, setRecargarContador] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  const [modalCrear, setModalCrear] = useState(false);
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

  // Alternativa al correo: enlace de acceso generado para entregar en persona.
  const [usuarioEnlace, setUsuarioEnlace] = useState<UsuarioConDatosPrivados | null>(null);
  const [enlace, setEnlace] = useState<{ url: string; esActivacion: boolean } | null>(null);
  const [generandoEnlace, setGenerandoEnlace] = useState(false);
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

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

  const usuariosFiltrados = useMemo(
    () =>
      usuarios
        .filter((u) => filtroRol === "todos" || u.rol === filtroRol)
        .filter((u) => filtroEstado === "todos" || u.estadoActivacion === filtroEstado)
        .filter((u) => coincideBusqueda(u, busqueda))
        .sort((a, b) =>
          `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`, "es")
        ),
    [usuarios, filtroRol, filtroEstado, busqueda]
  );

  const totalPendientes = usuarios.filter((u) => u.estadoActivacion === "pendiente").length;
  const hayFiltros = busqueda.trim() !== "" || filtroRol !== "todos" || filtroEstado !== "todos";

  function abrirModalCrear() {
    setError(null);
    setModalCrear(true);
  }

  function cerrarModalCrear() {
    if (enviando) return;
    setModalCrear(false);
    setError(null);
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

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
      setModalCrear(false);
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

  async function handleConfirmarEditar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
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

  async function abrirModalEnlace(usuarioObjetivo: UsuarioConDatosPrivados) {
    if (!auth.currentUser) return;

    setUsuarioEnlace(usuarioObjetivo);
    setEnlace(null);
    setErrorEnlace(null);
    setEnlaceCopiado(false);
    setGenerandoEnlace(true);

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await generarEnlaceAccesoAction({ uid: usuarioObjetivo.id, idTokenAdmin });

      if (!resultado.ok || !resultado.enlace) {
        setErrorEnlace(resultado.error ?? "No se pudo generar el enlace.");
        return;
      }
      setEnlace({ url: resultado.enlace, esActivacion: resultado.esActivacion ?? false });
    } catch {
      setErrorEnlace("No se pudo generar el enlace. Intenta de nuevo.");
    } finally {
      setGenerandoEnlace(false);
    }
  }

  function cerrarModalEnlace() {
    setUsuarioEnlace(null);
    setEnlace(null);
    setErrorEnlace(null);
  }

  async function copiarEnlace() {
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace.url);
      setEnlaceCopiado(true);
      setTimeout(() => setEnlaceCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace sigue visible para copiarlo a mano.
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-terracotta text-xs font-bold uppercase tracking-widest">
            Administración
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-text-dark mt-1">Usuarios</h1>
          <p className="text-slate-600 text-sm font-medium mt-1">
            {cargandoUsuarios
              ? "Cargando..."
              : `${usuarios.length} ${usuarios.length === 1 ? "cuenta registrada" : "cuentas registradas"}${
                  totalPendientes > 0 ? ` · ${totalPendientes} sin activar` : ""
                }`}
          </p>
        </div>
        <button
          type="button"
          onClick={abrirModalCrear}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {creadoNombre && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-emerald-900 text-sm">{creadoNombre} fue creado correctamente</p>
            <p className="text-sm text-emerald-800 font-medium mt-0.5 leading-relaxed">
              La cuenta queda pendiente de activación. Para crear su contraseña, debe ingresar su
              RUT en &quot;Crear o recuperar contraseña&quot; del inicio de sesión: recibirá un
              enlace en el correo registrado.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreadoNombre(null)}
            aria-label="Cerrar aviso"
            className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar por nombre o RUT..."
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              aria-label="Buscar usuarios"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
            />
          </div>

          <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1 overflow-x-auto">
            {OPCIONES_ROL.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setFiltroRol(opcion.valor)}
                aria-pressed={filtroRol === opcion.valor}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filtroRol === opcion.valor
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-600 hover:text-primary"
                }`}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>

          <select
            value={filtroEstado}
            onChange={(evento) => setFiltroEstado(evento.target.value as FiltroEstado)}
            aria-label="Filtrar por estado"
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-bold text-slate-700"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Sin activar</option>
            <option value="activada">Activas</option>
          </select>
        </div>

        {cargandoUsuarios && <EstadoCargando texto="Cargando usuarios..." />}
        {errorUsuarios && (
          <div className="p-6">
            <EstadoError mensaje={errorUsuarios} />
          </div>
        )}
        {!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length === 0 && (
          <div className="p-6">
            <EstadoVacio
              icono={Users}
              titulo={hayFiltros ? "Ningún usuario coincide" : "Todavía no hay usuarios registrados"}
              descripcion={
                hayFiltros
                  ? "Prueba con otra búsqueda o cambia los filtros."
                  : "Crea el primero con el botón \"Nuevo usuario\"."
              }
            />
          </div>
        )}

        {!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length > 0 && (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                    <th className="font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-3.5">
                      Usuario
                    </th>
                    <th className="font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-3.5">
                      RUT
                    </th>
                    <th className="font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-3.5">
                      Rol
                    </th>
                    <th className="font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-3.5">
                      Estado
                    </th>
                    <th className="font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-3.5 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuariosFiltrados.map((usuarioFila) => {
                    const estado = ETIQUETA_ESTADO[usuarioFila.estadoActivacion];
                    const correo = correoPrincipal(usuarioFila);
                    return (
                      <tr key={usuarioFila.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {iniciales(usuarioFila)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-text-dark truncate">
                                {usuarioFila.nombres} {usuarioFila.apellidos}
                              </p>
                              <p className="text-xs text-slate-600 font-medium truncate flex items-center gap-1">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                {correo ?? "Sin correo registrado"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs whitespace-nowrap">
                          {usuarioFila.datos?.rut ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${ESTILO_ROL[usuarioFila.rol]}`}
                          >
                            {ETIQUETA_ROL[usuarioFila.rol]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${estado.estilo}`}>
                            {estado.texto}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <AccionesFila
                            usuario={usuarioFila}
                            onEditar={() => abrirModalEditar(usuarioFila)}
                            onEnlace={() => abrirModalEnlace(usuarioFila)}
                            onEliminar={() => abrirModalEliminar(usuarioFila)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <ul className="md:hidden divide-y divide-slate-100">
              {usuariosFiltrados.map((usuarioFila) => {
                const estado = ETIQUETA_ESTADO[usuarioFila.estadoActivacion];
                return (
                  <li key={usuarioFila.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {iniciales(usuarioFila)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-dark truncate">
                          {usuarioFila.nombres} {usuarioFila.apellidos}
                        </p>
                        <p className="text-xs text-slate-700 font-mono">
                          {usuarioFila.datos?.rut ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${ESTILO_ROL[usuarioFila.rol]}`}
                      >
                        {ETIQUETA_ROL[usuarioFila.rol]}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${estado.estilo}`}>
                        {estado.texto}
                      </span>
                    </div>
                    <AccionesFila
                      usuario={usuarioFila}
                      onEditar={() => abrirModalEditar(usuarioFila)}
                      onEnlace={() => abrirModalEnlace(usuarioFila)}
                      onEliminar={() => abrirModalEliminar(usuarioFila)}
                    />
                  </li>
                );
              })}
            </ul>

            <p className="px-6 py-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
              Mostrando {usuariosFiltrados.length} de {usuarios.length}
            </p>
          </>
        )}
      </div>

      {modalCrear && (
        <Modal
          titulo="Nuevo usuario"
          subtitulo="Alta de alumnos y docentes"
          icono={UserPlus}
          ancho="lg"
          bloqueado={enviando}
          onCerrar={cerrarModalCrear}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <span className={CLASE_LABEL}>Rol</span>
              <div className="grid grid-cols-2 gap-2">
                {(["alumno", "profesor"] as const).map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    onClick={() => setRol(opcion)}
                    aria-pressed={rol === opcion}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                      rol === opcion
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-primary/40"
                    }`}
                  >
                    {ETIQUETA_ROL[opcion]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombres" className={CLASE_LABEL}>
                  Nombres
                </label>
                <input
                  id="nombres"
                  type="text"
                  value={nombres}
                  onChange={(evento) => setNombres(evento.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                  className={CLASE_INPUT}
                />
              </div>
              <div>
                <label htmlFor="apellidos" className={CLASE_LABEL}>
                  Apellidos
                </label>
                <input
                  id="apellidos"
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
                  type="date"
                  value={fechaNacimiento}
                  onChange={(evento) => setFechaNacimiento(evento.target.value)}
                  required
                  min="1900-01-01"
                  max={hoyIso()}
                  className={CLASE_INPUT}
                />
              </div>
            </div>

            <CamposContacto
              rol={rol}
              prefijoId="crear"
              email={email}
              emailApoderado={emailApoderado}
              onEmail={setEmail}
              onEmailApoderado={setEmailApoderado}
            />

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              No se define una contraseña aquí: el usuario la crea con el enlace que recibe en
              el correo registrado.
            </p>

            {error && (
              <p role="alert" className={CLASE_ERROR}>
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={cerrarModalCrear}
                disabled={enviando}
                className={CLASE_BOTON_SECUNDARIO}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {usuarioAEditar && (
        <Modal
          titulo="Editar usuario"
          subtitulo={`${usuarioAEditar.datos?.rut ?? "Sin RUT registrado"} · ${ETIQUETA_ROL[usuarioAEditar.rol]}`}
          icono={Pencil}
          ancho="lg"
          bloqueado={editando}
          onCerrar={cerrarModalEditar}
        >
          <form onSubmit={handleConfirmarEditar} className="space-y-4" noValidate>
            {!usuarioAEditar.datos && (
              <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                Esta cuenta no tiene datos privados registrados (fue creada antes del cambio de
                modelo). No se puede editar: debe eliminarse y crearse de nuevo.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {errorEditar && (
              <p role="alert" className={CLASE_ERROR}>
                {errorEditar}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={cerrarModalEditar}
                disabled={editando}
                className={CLASE_BOTON_SECUNDARIO}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  editando ||
                  !usuarioAEditar.datos ||
                  !nombresEditar.trim() ||
                  !apellidosEditar.trim()
                }
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {usuarioEnlace && (
        <Modal
          titulo="Enlace de acceso"
          subtitulo={`${usuarioEnlace.nombres} ${usuarioEnlace.apellidos}`}
          icono={KeyRound}
          onCerrar={cerrarModalEnlace}
        >
          {generandoEnlace && (
            <p className="text-sm text-slate-600 font-semibold py-4 text-center">
              Generando enlace...
            </p>
          )}

          {errorEnlace && (
            <p role="alert" className={`${CLASE_ERROR} mb-4`}>
              {errorEnlace}
            </p>
          )}

          {enlace && (
            <>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Con este enlace el usuario puede{" "}
                {enlace.esActivacion ? "crear su contraseña" : "restablecer su contraseña"} sin
                usar el correo. Entrégalo solo a esa persona o a su apoderado: funciona una sola
                vez y vence en poco tiempo.
              </p>

              <div className="flex items-start gap-2 mb-4">
                <p className="font-mono text-xs text-text-dark bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex-1 break-all">
                  {enlace.url}
                </p>
                <button
                  type="button"
                  onClick={copiarEnlace}
                  className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary p-2.5 rounded-xl transition-all"
                  aria-label="Copiar enlace"
                >
                  {enlaceCopiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}

          <button type="button" onClick={cerrarModalEnlace} className={`${CLASE_BOTON_SECUNDARIO} w-full`}>
            Cerrar
          </button>
        </Modal>
      )}

      {usuarioAEliminar && (
        <Modal
          titulo="Eliminar usuario"
          subtitulo={`${usuarioAEliminar.nombres} ${usuarioAEliminar.apellidos}`}
          icono={AlertTriangle}
          tono="peligro"
          ancho="sm"
          bloqueado={eliminando}
          onCerrar={cerrarModalEliminar}
        >
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Esta acción no se puede deshacer. Ingresa tu contraseña de administrador para
            confirmar.
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
            <p role="alert" className={`${CLASE_ERROR} mb-4`}>
              {errorEliminar}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={cerrarModalEliminar}
              disabled={eliminando}
              className={CLASE_BOTON_SECUNDARIO}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarEliminar}
              disabled={eliminando || !passwordAdmin}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
