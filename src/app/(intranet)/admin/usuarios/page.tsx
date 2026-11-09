"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Search, UserPlus, Users, X } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { egresoVencido, MESES_CONSERVACION_EGRESADOS } from "@/lib/egreso";
import { coincideNombre, compararPorApellido } from "@/lib/usuarios";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { ListaUsuarios } from "@/components/intranet/admin/usuarios/ListaUsuarios";
import {
  BORRADOR_VACIO,
  ModalCrearUsuario,
  type BorradorUsuario,
} from "@/components/intranet/admin/usuarios/ModalCrearUsuario";
import { ModalEditarUsuario } from "@/components/intranet/admin/usuarios/ModalEditarUsuario";
import { ModalEliminarUsuario } from "@/components/intranet/admin/usuarios/ModalEliminarUsuario";
import { ModalEnlaceAcceso } from "@/components/intranet/admin/usuarios/ModalEnlaceAcceso";
import { ModalEgreso } from "@/components/intranet/admin/usuarios/ModalEgreso";
import { ModalEliminarEgresados } from "@/components/intranet/admin/usuarios/ModalEliminarEgresados";
import { useBusquedaPorRut } from "@/hooks/useBusquedaPorRut";
import { listarUsuariosAction } from "./actions";
import type { EstadoActivacion, RolUsuario, UsuarioAdmin } from "@/types";

type FiltroRol = "todos" | RolUsuario;
/** "pendiente" y "activada" se refieren a cuentas vigentes; las egresadas tienen su propio filtro. */
type FiltroEstado = "todos" | EstadoActivacion | "egresado";

const OPCIONES_ROL: { valor: FiltroRol; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "alumno", etiqueta: "Alumnos" },
  { valor: "profesor", etiqueta: "Docentes" },
  { valor: "administrador", etiqueta: "Administradores" },
];

/** Qué ventana está abierta y sobre qué usuario. Solo puede haber una a la vez. */
type Ventana =
  | { tipo: "crear" }
  | { tipo: "editar" | "enlace" | "eliminar" | "egresar" | "reactivar"; usuario: UsuarioAdmin }
  | { tipo: "eliminar-egresados" }
  | null;

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null);
  const [recargarContador, setRecargarContador] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const busquedaRut = useBusquedaPorRut(busqueda);

  const [ventana, setVentana] = useState<Ventana>(null);
  const [borrador, setBorrador] = useState<BorradorUsuario>(BORRADOR_VACIO);
  const [creadoNombre, setCreadoNombre] = useState<string | null>(null);
  const [eliminadosCantidad, setEliminadosCantidad] = useState<number | null>(null);
  // Momento en que se abrió la página: referencia fija para saber qué egresos vencieron.
  const [ahora] = useState(() => new Date());

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargandoUsuarios(true);
      setErrorUsuarios(null);
      try {
        const idTokenAdmin = await auth.currentUser?.getIdToken();
        if (!idTokenAdmin) throw new Error("Sin sesión");
        const resultado = await listarUsuariosAction(idTokenAdmin);
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
        .filter((u) =>
          filtroEstado === "todos"
            ? true
            : filtroEstado === "egresado"
              ? u.activo === false
              : u.activo !== false && u.estadoActivacion === filtroEstado
        )
        // Un RUT completo se resuelve en el servidor; cualquier otro texto busca por nombre.
        .filter((u) => (busquedaRut.esRut ? u.id === busquedaRut.uid : coincideNombre(u, busqueda)))
        .sort(compararPorApellido),
    [usuarios, filtroRol, filtroEstado, busqueda, busquedaRut.esRut, busquedaRut.uid]
  );

  const totalPendientes = usuarios.filter(
    (u) => u.activo !== false && u.estadoActivacion === "pendiente"
  ).length;
  const totalEgresados = usuarios.filter((u) => u.activo === false).length;
  const egresadosVencidos = useMemo(
    () =>
      usuarios
        .filter((u) => u.activo === false && u.fechaEgreso && egresoVencido(u.fechaEgreso, ahora))
        .sort(compararPorApellido),
    [usuarios, ahora]
  );
  const hayFiltros = busqueda.trim() !== "" || filtroRol !== "todos" || filtroEstado !== "todos";

  function cerrarVentana() {
    setVentana(null);
  }

  /** Tras crear, editar o eliminar: cierra la ventana y vuelve a pedir la lista. */
  function cerrarYRecargar() {
    setVentana(null);
    setRecargarContador((contador) => contador + 1);
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
                }${totalEgresados > 0 ? ` · ${totalEgresados} egresadas` : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVentana({ tipo: "crear" })}
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

      {eliminadosCantidad !== null && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="flex-1 font-bold text-emerald-900 text-sm">
            Se {eliminadosCantidad === 1 ? "eliminó 1 cuenta egresada" : `eliminaron ${eliminadosCantidad} cuentas egresadas`}.
          </p>
          <button
            type="button"
            onClick={() => setEliminadosCantidad(null)}
            aria-label="Cerrar aviso"
            className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!cargandoUsuarios && egresadosVencidos.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 hidden sm:block" />
          <p className="flex-1 text-sm font-semibold text-amber-900 leading-relaxed">
            {egresadosVencidos.length === 1
              ? "1 cuenta egresada"
              : `${egresadosVencidos.length} cuentas egresadas`}{" "}
            ya cumplieron {MESES_CONSERVACION_EGRESADOS} meses. Según la Política de Privacidad,
            deben eliminarse.
          </p>
          <button
            type="button"
            onClick={() => setVentana({ tipo: "eliminar-egresados" })}
            className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap"
          >
            Revisar y eliminar
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar por nombre o RUT completo..."
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
            <option value="egresado">Egresadas</option>
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
                busquedaRut.buscando
                  ? "Buscando ese RUT..."
                  : hayFiltros
                  ? "Prueba con otro nombre, con el RUT completo o cambia los filtros."
                  : "Crea el primero con el botón \"Nuevo usuario\"."
              }
            />
          </div>
        )}

        {!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length > 0 && (
          <ListaUsuarios
            usuarios={usuariosFiltrados}
            total={usuarios.length}
            onEditar={(usuario) => setVentana({ tipo: "editar", usuario })}
            onEnlace={(usuario) => setVentana({ tipo: "enlace", usuario })}
            onEliminar={(usuario) => setVentana({ tipo: "eliminar", usuario })}
            onEgresar={(usuario) => setVentana({ tipo: "egresar", usuario })}
            onReactivar={(usuario) => setVentana({ tipo: "reactivar", usuario })}
          />
        )}
      </div>

      {ventana?.tipo === "crear" && (
        <ModalCrearUsuario
          borrador={borrador}
          onBorrador={setBorrador}
          onCerrar={cerrarVentana}
          onCreado={(nombre) => {
            setCreadoNombre(nombre);
            setBorrador(BORRADOR_VACIO);
            cerrarYRecargar();
          }}
        />
      )}
      {ventana?.tipo === "editar" && (
        <ModalEditarUsuario usuario={ventana.usuario} onCerrar={cerrarVentana} onGuardado={cerrarYRecargar} />
      )}
      {ventana?.tipo === "enlace" && <ModalEnlaceAcceso usuario={ventana.usuario} onCerrar={cerrarVentana} />}
      {ventana?.tipo === "eliminar" && (
        <ModalEliminarUsuario
          usuario={ventana.usuario}
          onCerrar={cerrarVentana}
          onEliminado={cerrarYRecargar}
        />
      )}
      {(ventana?.tipo === "egresar" || ventana?.tipo === "reactivar") && (
        <ModalEgreso
          usuario={ventana.usuario}
          accion={ventana.tipo}
          onCerrar={cerrarVentana}
          onListo={cerrarYRecargar}
        />
      )}
      {ventana?.tipo === "eliminar-egresados" && (
        <ModalEliminarEgresados
          vencidos={egresadosVencidos}
          onCerrar={cerrarVentana}
          onEliminados={(cantidad) => {
            setEliminadosCantidad(cantidad);
            cerrarYRecargar();
          }}
        />
      )}
    </>
  );
}
