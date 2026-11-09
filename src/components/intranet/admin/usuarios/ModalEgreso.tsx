"use client";

import { useState } from "react";
import { GraduationCap, RotateCcw } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { MESES_CONSERVACION_EGRESADOS } from "@/lib/egreso";
import { nombreCompleto } from "@/lib/usuarios";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_ERROR,
} from "@/components/ui/estilos";
import {
  egresarUsuarioAction,
  reactivarUsuarioAction,
} from "@/app/(intranet)/admin/usuarios/actions";
import type { UsuarioAdmin } from "@/types";
import { textoAccionEgreso } from "./etiquetas";

interface ModalEgresoProps {
  usuario: UsuarioAdmin;
  /** "egresar" bloquea la cuenta; "reactivar" la devuelve a su estado anterior. */
  accion: "egresar" | "reactivar";
  onCerrar: () => void;
  onListo: () => void;
}

/** Confirmación para egresar (o dar de baja) una cuenta, o para reactivarla. */
export function ModalEgreso({ usuario, accion, onCerrar, onListo }: ModalEgresoProps) {
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const egresar = accion === "egresar";
  const titulo = egresar ? textoAccionEgreso(usuario.rol) : "Reactivar cuenta";

  async function handleConfirmar() {
    const usuarioActual = auth.currentUser;
    if (!usuarioActual) return;

    setTrabajando(true);
    setError(null);
    try {
      const entrada = { uid: usuario.id, idTokenAdmin: await usuarioActual.getIdToken() };
      const resultado = egresar
        ? await egresarUsuarioAction(entrada)
        : await reactivarUsuarioAction(entrada);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo completar la acción.");
        setTrabajando(false);
        return;
      }
      onListo();
    } catch {
      setError("No se pudo completar la acción. Intenta de nuevo.");
      setTrabajando(false);
    }
  }

  return (
    <Modal
      titulo={titulo}
      subtitulo={nombreCompleto(usuario)}
      icono={egresar ? GraduationCap : RotateCcw}
      ancho="sm"
      bloqueado={trabajando}
      onCerrar={onCerrar}
    >
      {egresar ? (
        <ul className="text-sm text-slate-600 font-medium leading-relaxed space-y-2 mb-5 list-disc pl-5">
          <li>No podrá ingresar a la intranet y se cerrarán sus sesiones abiertas.</li>
          <li>Saldrá de sus elencos. Su historial de asistencia y clases se conserva.</li>
          <li>
            Pasados {MESES_CONSERVACION_EGRESADOS} meses, la cuenta y sus datos de contacto
            podrán eliminarse, como indica la Política de Privacidad.
          </li>
          <li>Si vuelve a matricularse, puedes reactivarla sin crearla de nuevo.</li>
        </ul>
      ) : (
        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-5">
          Podrá volver a ingresar con su misma contraseña y regresará a los elencos de los que
          salió al egresar, si todavía existen.
        </p>
      )}

      {error && (
        <p role="alert" className={`${CLASE_ERROR} mb-4`}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onCerrar} disabled={trabajando} className={CLASE_BOTON_SECUNDARIO}>
          Cancelar
        </button>
        <button type="button" onClick={handleConfirmar} disabled={trabajando} className={CLASE_BOTON_PRIMARIO}>
          {trabajando ? "Guardando..." : egresar ? textoAccionEgreso(usuario.rol) : "Reactivar"}
        </button>
      </div>
    </Modal>
  );
}
