"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { nombreCompleto } from "@/lib/usuarios";
import { Modal } from "@/components/ui/Modal";
import { CLASE_BOTON_SECUNDARIO, CLASE_ERROR } from "@/components/ui/estilos";
import { generarEnlaceAccesoAction } from "@/app/(intranet)/admin/usuarios/actions";
import type { UsuarioAdmin } from "@/types";

interface ModalEnlaceAccesoProps {
  usuario: UsuarioAdmin;
  onCerrar: () => void;
}

/**
 * Alternativa al correo: genera el mismo enlace de un solo uso que se envía
 * por correo, para entregarlo en persona (por ejemplo, si el apoderado ya no
 * tiene acceso a su correo). El enlace se genera al abrir la ventana.
 */
export function ModalEnlaceAcceso({ usuario, onCerrar }: ModalEnlaceAccesoProps) {
  const [enlace, setEnlace] = useState<{ url: string; esActivacion: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const generando = enlace === null && error === null;

  useEffect(() => {
    let cancelado = false;

    async function generar() {
      try {
        const idTokenAdmin = await auth.currentUser?.getIdToken();
        if (!idTokenAdmin) throw new Error("Sin sesión");
        const resultado = await generarEnlaceAccesoAction({ uid: usuario.id, idTokenAdmin });
        if (cancelado) return;
        if (!resultado.ok || !resultado.enlace) {
          setError(resultado.error ?? "No se pudo generar el enlace.");
          return;
        }
        setEnlace({ url: resultado.enlace, esActivacion: resultado.esActivacion ?? false });
      } catch {
        if (!cancelado) setError("No se pudo generar el enlace. Intenta de nuevo.");
      }
    }

    generar();
    return () => {
      cancelado = true;
    };
  }, [usuario.id]);

  async function copiarEnlace() {
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace sigue visible para copiarlo a mano.
    }
  }

  return (
    <Modal titulo="Enlace de acceso" subtitulo={nombreCompleto(usuario)} icono={KeyRound} onCerrar={onCerrar}>
      {generando && (
        <p className="text-sm text-slate-600 font-semibold py-4 text-center">Generando enlace...</p>
      )}

      {error && (
        <p role="alert" className={`${CLASE_ERROR} mb-4`}>
          {error}
        </p>
      )}

      {enlace && (
        <>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Con este enlace el usuario puede{" "}
            {enlace.esActivacion ? "crear su contraseña" : "restablecer su contraseña"} sin usar
            el correo. Entrégalo solo a esa persona o a su apoderado: funciona una sola vez y
            vence en poco tiempo.
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
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}

      <button type="button" onClick={onCerrar} className={`${CLASE_BOTON_SECUNDARIO} w-full`}>
        Cerrar
      </button>
    </Modal>
  );
}
