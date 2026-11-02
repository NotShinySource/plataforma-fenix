"use client";

import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { nombreCompleto } from "@/lib/usuarios";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { eliminarUsuarioAction } from "@/app/(intranet)/admin/usuarios/actions";
import type { UsuarioAdmin } from "@/types";

interface ModalEliminarUsuarioProps {
  usuario: UsuarioAdmin;
  onCerrar: () => void;
  onEliminado: () => void;
}

/**
 * Eliminar exige la contraseña del administrador: se reautentica en el
 * navegador con Firebase Auth y solo si es correcta se llama al servidor.
 * Así, una sesión abierta y desatendida no basta para borrar cuentas.
 */
export function ModalEliminarUsuario({ usuario, onCerrar, onEliminado }: ModalEliminarUsuarioProps) {
  const [password, setPassword] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmar() {
    if (!auth.currentUser?.email) return;

    setEliminando(true);
    setError(null);

    try {
      const credencial = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credencial);
    } catch {
      setError("Contraseña incorrecta.");
      setEliminando(false);
      return;
    }

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await eliminarUsuarioAction({ uid: usuario.id, idTokenAdmin });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo eliminar el usuario.");
        return;
      }
      onEliminado();
    } catch {
      setError("No se pudo eliminar el usuario. Intenta de nuevo.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <Modal
      titulo="Eliminar usuario"
      subtitulo={nombreCompleto(usuario)}
      icono={AlertTriangle}
      tono="peligro"
      ancho="sm"
      bloqueado={eliminando}
      onCerrar={onCerrar}
    >
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
        Esta acción no se puede deshacer. Ingresa tu contraseña de administrador para confirmar.
      </p>

      <label htmlFor="passwordAdmin" className={CLASE_ETIQUETA}>
        Tu contraseña
      </label>
      <input
        id="passwordAdmin"
        type="password"
        value={password}
        onChange={(evento) => setPassword(evento.target.value)}
        autoComplete="current-password"
        autoFocus
        className={`${CLASE_CAMPO} mb-4`}
      />

      {error && (
        <p role="alert" className={`${CLASE_ERROR} mb-4`}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onCerrar} disabled={eliminando} className={CLASE_BOTON_SECUNDARIO}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={eliminando || !password}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {eliminando ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </Modal>
  );
}
