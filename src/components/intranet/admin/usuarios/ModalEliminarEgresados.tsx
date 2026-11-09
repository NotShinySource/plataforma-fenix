"use client";

import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { formatearFecha } from "@/lib/format";
import { MESES_CONSERVACION_EGRESADOS } from "@/lib/egreso";
import { nombreCompleto } from "@/lib/usuarios";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { eliminarEgresadosVencidosAction } from "@/app/(intranet)/admin/usuarios/actions";
import type { UsuarioAdmin } from "@/types";

interface ModalEliminarEgresadosProps {
  /** Cuentas egresadas hace más del plazo, según la lista cargada. */
  vencidos: UsuarioAdmin[];
  onCerrar: () => void;
  onEliminados: (cantidad: number) => void;
}

/**
 * Elimina de una vez las cuentas egresadas que ya cumplieron el plazo de
 * conservación. Como no se puede deshacer, pide la contraseña del
 * administrador, igual que eliminar una cuenta individual.
 */
export function ModalEliminarEgresados({ vencidos, onCerrar, onEliminados }: ModalEliminarEgresadosProps) {
  const [password, setPassword] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmar() {
    const usuarioActual = auth.currentUser;
    if (!usuarioActual?.email) return;

    setEliminando(true);
    setError(null);
    try {
      await reauthenticateWithCredential(
        usuarioActual,
        EmailAuthProvider.credential(usuarioActual.email, password)
      );
    } catch {
      setError("Contraseña incorrecta.");
      setEliminando(false);
      return;
    }

    try {
      const resultado = await eliminarEgresadosVencidosAction(await usuarioActual.getIdToken());
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudieron eliminar las cuentas.");
        setEliminando(false);
        return;
      }
      onEliminados(resultado.eliminados ?? 0);
    } catch {
      setError("No se pudieron eliminar las cuentas. Intenta de nuevo.");
      setEliminando(false);
    }
  }

  return (
    <Modal
      titulo="Eliminar cuentas egresadas"
      subtitulo={`${vencidos.length} ${vencidos.length === 1 ? "cuenta" : "cuentas"} con más de ${MESES_CONSERVACION_EGRESADOS} meses de egreso`}
      icono={AlertTriangle}
      tono="peligro"
      ancho="md"
      bloqueado={eliminando}
      onCerrar={onCerrar}
    >
      <p className="text-sm text-slate-600 font-medium leading-relaxed mb-3">
        Se eliminarán su cuenta de acceso y sus datos personales (RUT, correos y fecha de
        nacimiento). Su historial de asistencia y clases se conserva. Esta acción no se puede
        deshacer.
      </p>

      <ul className="max-h-48 overflow-y-auto scroll-fino divide-y divide-slate-100 border border-slate-100 rounded-2xl mb-4">
        {vencidos.map((usuario) => (
          <li key={usuario.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-text-dark truncate">{nombreCompleto(usuario)}</span>
            {usuario.fechaEgreso && (
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                egresó el {formatearFecha(usuario.fechaEgreso)}
              </span>
            )}
          </li>
        ))}
      </ul>

      <label htmlFor="passwordAdminEgresados" className={CLASE_ETIQUETA}>
        Tu contraseña
      </label>
      <input
        id="passwordAdminEgresados"
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
