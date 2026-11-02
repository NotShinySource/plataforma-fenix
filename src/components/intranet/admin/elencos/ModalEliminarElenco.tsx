"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { eliminarElencoAction } from "@/app/(intranet)/admin/elencos/actions";
import type { ConId, Elenco } from "@/types";

interface ModalEliminarElencoProps {
  elenco: ConId<Elenco>;
  onCerrar: () => void;
}

/**
 * Para eliminar hay que escribir el nombre exacto del elenco. Solo se ofrece
 * cuando el elenco ya no tiene miembros, y el servidor lo vuelve a comprobar.
 */
export function ModalEliminarElenco({ elenco, onCerrar }: ModalEliminarElencoProps) {
  const router = useRouter();
  const [confirmacion, setConfirmacion] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmar() {
    if (!auth.currentUser) return;

    setEliminando(true);
    setError(null);
    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await eliminarElencoAction({ elencoId: elenco.id, idTokenAdmin });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo eliminar el elenco.");
        setEliminando(false);
        return;
      }
      router.push("/admin/elencos");
    } catch {
      setError("No se pudo eliminar el elenco. Intenta de nuevo.");
      setEliminando(false);
    }
  }

  return (
    <Modal
      titulo="Eliminar elenco"
      subtitulo={elenco.nombre}
      icono={AlertTriangle}
      tono="peligro"
      ancho="sm"
      bloqueado={eliminando}
      onCerrar={onCerrar}
    >
      <p className="text-sm text-slate-600 mb-4">
        Esta acción no se puede deshacer. Escribe{" "}
        <span className="font-bold text-text-dark">{elenco.nombre}</span> para confirmar.
      </p>

      <label htmlFor="confirmacionNombre" className={CLASE_ETIQUETA}>
        Nombre del elenco
      </label>
      <input
        id="confirmacionNombre"
        type="text"
        value={confirmacion}
        onChange={(evento) => setConfirmacion(evento.target.value)}
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
          disabled={eliminando || confirmacion !== elenco.nombre}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {eliminando ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </Modal>
  );
}
