"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Mail, Pencil, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { iniciales, nombreCompleto } from "@/lib/usuarios";
import { obtenerDatosPrivadosAction } from "@/app/(intranet)/admin/usuarios/actions";
import type { UsuarioAdmin } from "@/types";
import { ESTILO_ROL, ETIQUETA_ESTADO, ETIQUETA_ROL } from "./etiquetas";

interface RutProtegidoProps {
  usuario: UsuarioAdmin;
  /** RUT completo, si el Administrador pidió verlo. */
  revelado: string | undefined;
  cargando: boolean;
  onAlternar: () => void;
}

/**
 * RUT enmascarado por defecto, con un botón para ver el completo de esa
 * persona. El completo se pide al servidor solo en ese momento.
 */
function RutProtegido({ usuario, revelado, cargando, onAlternar }: RutProtegidoProps) {
  if (!usuario.rutEnmascarado) {
    return <span className="text-slate-600 font-mono text-xs">—</span>;
  }

  const nombre = nombreCompleto(usuario);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-slate-700 font-mono text-xs whitespace-nowrap">
        {revelado ?? usuario.rutEnmascarado}
      </span>
      <button
        type="button"
        onClick={onAlternar}
        disabled={cargando}
        aria-label={revelado ? `Ocultar el RUT de ${nombre}` : `Ver el RUT completo de ${nombre}`}
        aria-pressed={Boolean(revelado)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
      >
        {revelado ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </span>
  );
}

export interface AccionesUsuario {
  onEditar: (usuario: UsuarioAdmin) => void;
  onEnlace: (usuario: UsuarioAdmin) => void;
  onEliminar: (usuario: UsuarioAdmin) => void;
}

/** Acciones por usuario. Enlace y Eliminar no aplican a administradores. */
function AccionesFila({ usuario, onEditar, onEnlace, onEliminar }: AccionesUsuario & { usuario: UsuarioAdmin }) {
  const nombre = nombreCompleto(usuario);
  const base = "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all";
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => onEditar(usuario)}
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
            onClick={() => onEnlace(usuario)}
            aria-label={`Generar enlace de acceso para ${nombre}`}
            className={`${base} bg-slate-100 hover:bg-slate-200 text-slate-700`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Enlace
          </button>
          <button
            type="button"
            onClick={() => onEliminar(usuario)}
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

function Avatar({ usuario }: { usuario: UsuarioAdmin }) {
  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
      {iniciales(usuario)}
    </div>
  );
}

interface ListaUsuariosProps extends AccionesUsuario {
  /** Usuarios ya filtrados y ordenados. */
  usuarios: UsuarioAdmin[];
  total: number;
}

const CLASE_ENCABEZADO = "font-bold text-slate-600 uppercase tracking-wider text-xs px-6 py-3.5";

/** Tabla en escritorio y tarjetas en móvil, con el mismo contenido. */
export function ListaUsuarios({ usuarios, total, ...acciones }: ListaUsuariosProps) {
  // RUT completos que el Administrador pidió ver, por uid. Se piden de a uno.
  const [rutsRevelados, setRutsRevelados] = useState<Record<string, string>>({});
  const [revelandoId, setRevelandoId] = useState<string | null>(null);

  async function alternarRut(usuario: UsuarioAdmin) {
    if (rutsRevelados[usuario.id]) {
      setRutsRevelados((previos) => {
        const siguientes = { ...previos };
        delete siguientes[usuario.id];
        return siguientes;
      });
      return;
    }
    if (!auth.currentUser) return;

    setRevelandoId(usuario.id);
    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await obtenerDatosPrivadosAction({ uid: usuario.id, idTokenAdmin });
      if (resultado.ok && resultado.datos) {
        const rutCompleto = resultado.datos.rut;
        setRutsRevelados((previos) => ({ ...previos, [usuario.id]: rutCompleto }));
      }
    } catch {
      // Si falla, el RUT simplemente sigue enmascarado.
    } finally {
      setRevelandoId(null);
    }
  }

  function rutDe(usuario: UsuarioAdmin) {
    return (
      <RutProtegido
        usuario={usuario}
        revelado={rutsRevelados[usuario.id]}
        cargando={revelandoId === usuario.id}
        onAlternar={() => alternarRut(usuario)}
      />
    );
  }

  return (
    <>
      {/* Escritorio (desde 1024 px): tabla */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
              <th className={CLASE_ENCABEZADO}>Usuario</th>
              <th className={CLASE_ENCABEZADO}>RUT</th>
              <th className={CLASE_ENCABEZADO}>Rol</th>
              <th className={CLASE_ENCABEZADO}>Estado</th>
              <th className={`${CLASE_ENCABEZADO} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((usuario) => {
              const estado = ETIQUETA_ESTADO[usuario.estadoActivacion];
              return (
                <tr key={usuario.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar usuario={usuario} />
                      <div className="min-w-0">
                        <p className="font-bold text-text-dark truncate">{nombreCompleto(usuario)}</p>
                        <p className="text-xs text-slate-600 font-medium truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {usuario.correoEnmascarado ?? "Sin correo registrado"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{rutDe(usuario)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${ESTILO_ROL[usuario.rol]}`}
                    >
                      {ETIQUETA_ROL[usuario.rol]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${estado.estilo}`}>
                      {estado.texto}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <AccionesFila usuario={usuario} {...acciones} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Móvil y tablet: tarjetas, con las acciones siempre a la vista */}
      <ul className="lg:hidden divide-y divide-slate-100">
        {usuarios.map((usuario) => {
          const estado = ETIQUETA_ESTADO[usuario.estadoActivacion];
          return (
            <li key={usuario.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar usuario={usuario} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-dark truncate">{nombreCompleto(usuario)}</p>
                  {rutDe(usuario)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ESTILO_ROL[usuario.rol]}`}>
                  {ETIQUETA_ROL[usuario.rol]}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${estado.estilo}`}>
                  {estado.texto}
                </span>
              </div>
              <AccionesFila usuario={usuario} {...acciones} />
            </li>
          );
        })}
      </ul>

      <p className="px-6 py-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
        Mostrando {usuarios.length} de {total}
      </p>
    </>
  );
}
