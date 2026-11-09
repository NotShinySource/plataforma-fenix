"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { fechaAValorInput } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import {
  editarUsuarioAction,
  obtenerDatosPrivadosAction,
} from "@/app/(intranet)/admin/usuarios/actions";
import type { UsuarioAdmin } from "@/types";
import { CamposContacto } from "./CamposContacto";
import { ETIQUETA_ROL } from "./etiquetas";

interface ModalEditarUsuarioProps {
  usuario: UsuarioAdmin;
  onCerrar: () => void;
  onGuardado: () => void;
}

/**
 * El listado no trae los datos personales completos: al abrir la ventana se
 * piden al servidor los de esta persona, y no se deja guardar hasta tenerlos
 * (si no, se perderían los correos y la fecha de nacimiento).
 */
export function ModalEditarUsuario({ usuario, onCerrar, onGuardado }: ModalEditarUsuarioProps) {
  const [nombres, setNombres] = useState(usuario.nombres);
  const [apellidos, setApellidos] = useState(usuario.apellidos);
  const [fecha, setFecha] = useState("");
  const [email, setEmail] = useState("");
  const [emailApoderado, setEmailApoderado] = useState("");
  const [rut, setRut] = useState<string | null>(null);
  const [errorFicha, setErrorFicha] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargandoFicha = usuario.tieneDatosPrivados && rut === null && errorFicha === null;

  useEffect(() => {
    if (!usuario.tieneDatosPrivados) return;
    let cancelado = false;

    async function cargarFicha() {
      try {
        const idTokenAdmin = await auth.currentUser?.getIdToken();
        if (!idTokenAdmin) throw new Error("Sin sesión");
        const resultado = await obtenerDatosPrivadosAction({ uid: usuario.id, idTokenAdmin });
        if (cancelado) return;
        if (!resultado.ok || !resultado.datos) {
          setErrorFicha(resultado.error ?? "No se pudieron cargar los datos del usuario.");
          return;
        }
        setRut(resultado.datos.rut);
        setFecha(resultado.datos.fechaNacimiento);
        setEmail(resultado.datos.email ?? "");
        setEmailApoderado(resultado.datos.emailApoderado ?? "");
      } catch {
        if (!cancelado) setErrorFicha("No se pudieron cargar los datos del usuario.");
      }
    }

    cargarFicha();
    return () => {
      cancelado = true;
    };
  }, [usuario.id, usuario.tieneDatosPrivados]);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!auth.currentUser) return;

    setGuardando(true);
    setError(null);
    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await editarUsuarioAction({
        uid: usuario.id,
        nombres,
        apellidos,
        fechaNacimiento: fecha,
        email,
        emailApoderado: usuario.rol === "alumno" ? emailApoderado : "",
        idTokenAdmin,
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo editar el usuario.");
        return;
      }
      onGuardado();
    } catch {
      setError("No se pudo editar el usuario. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const mensajeError = error ?? errorFicha;

  return (
    <Modal
      titulo="Editar usuario"
      subtitulo={`${rut ?? usuario.rutEnmascarado ?? "Sin RUT registrado"} · ${ETIQUETA_ROL[usuario.rol]}`}
      icono={Pencil}
      ancho="lg"
      bloqueado={guardando}
      onCerrar={onCerrar}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {cargandoFicha && (
          <p className="text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            Cargando los datos del usuario...
          </p>
        )}

        {!usuario.tieneDatosPrivados && (
          <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            Esta cuenta no tiene datos privados registrados (fue creada antes del cambio de
            modelo). No se puede editar: debe eliminarse y crearse de nuevo.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombresEditar" className={CLASE_ETIQUETA}>
              Nombres
            </label>
            <input
              id="nombresEditar"
              type="text"
              value={nombres}
              onChange={(evento) => setNombres(evento.target.value)}
              maxLength={100}
              autoFocus
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="apellidosEditar" className={CLASE_ETIQUETA}>
              Apellidos
            </label>
            <input
              id="apellidosEditar"
              type="text"
              value={apellidos}
              onChange={(evento) => setApellidos(evento.target.value)}
              maxLength={100}
              className={CLASE_CAMPO}
            />
          </div>
        </div>

        <div>
          <label htmlFor="fechaEditar" className={CLASE_ETIQUETA}>
            Fecha de nacimiento
          </label>
          <input
            id="fechaEditar"
            type="date"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            min="1900-01-01"
            max={fechaAValorInput(new Date())}
            className={CLASE_CAMPO}
          />
        </div>

        <CamposContacto
          rol={usuario.rol}
          prefijoId="editar"
          email={email}
          emailApoderado={emailApoderado}
          onEmail={setEmail}
          onEmailApoderado={setEmailApoderado}
        />

        {mensajeError && (
          <p role="alert" className={CLASE_ERROR}>
            {mensajeError}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCerrar} disabled={guardando} className={CLASE_BOTON_SECUNDARIO}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || rut === null || !nombres.trim() || !apellidos.trim()}
            className={CLASE_BOTON_PRIMARIO}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
