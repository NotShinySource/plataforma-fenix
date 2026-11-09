"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, IdCard, KeyRound, MailCheck } from "lucide-react";
import { rutEsValido } from "@/lib/auth/rut";
import { valorDelCampo } from "@/lib/formulario";
import { formatearRutInput } from "@/lib/format";
import { MarcoAuth } from "@/components/auth/MarcoAuth";
import { useHidratado } from "@/hooks/useHidratado";
import { solicitarAccesoAction } from "./actions";
import { CLASE_CAMPO_ACCESO } from "@/components/ui/estilos";

export default function AccesoPage() {
  const hidratado = useHidratado();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    const rutIngresado = valorDelCampo(evento.currentTarget, "rut");

    if (!rutEsValido(rutIngresado)) {
      setError("El RUT ingresado no es válido.");
      return;
    }

    setEnviando(true);
    try {
      await solicitarAccesoAction(rutIngresado);
      setEnviado(true);
    } catch {
      setError("No se pudo procesar la solicitud. Intenta de nuevo en unos minutos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoAuth
      icono={enviado ? MailCheck : KeyRound}
      titulo={enviado ? "Revisa tu correo" : "Crear o recuperar contraseña"}
      subtitulo={
        enviado
          ? undefined
          : "Si es tu primera vez o olvidaste tu contraseña, ingresa tu RUT y te enviaremos un enlace al correo registrado en la escuela."
      }
    >
      {enviado ? (
        <div className="space-y-5">
          <p
            role="status"
            className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 leading-relaxed"
          >
            Si el RUT está registrado y tiene un correo asociado, enviamos un enlace para crear
            tu contraseña. En el caso de los alumnos, también llega al correo del apoderado.
          </p>
          <p className="text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 leading-relaxed">
            Si no lo ves en unos minutos, revisa la carpeta de spam.
          </p>
          <p className="text-xs text-slate-600 font-medium leading-relaxed px-1">
            ¿No llega nada? Puede que la escuela no tenga un correo registrado para tu cuenta:
            pide ayuda en la administración de Calambanda.
          </p>
        </div>
      ) : (
        // method="post": si se enviara antes de que cargue el JavaScript, los datos
        // no quedan en la URL. El botón además está desactivado hasta entonces.
        <form method="post" onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="rut" className="block text-sm font-bold text-slate-700 mb-2 px-1">
              RUT
            </label>
            <div className="relative">
              <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              <input
                id="rut"
                name="rut"
                type="text"
                placeholder="Ej: 21.345.678-9"
                // Campo no controlado, por el mismo motivo que en el login.
                onChange={(evento) => (evento.target.value = formatearRutInput(evento.target.value))}
                required
                autoComplete="username"
                maxLength={12}
                className={CLASE_CAMPO_ACCESO}
              />
            </div>
          </div>

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
            disabled={enviando || !hidratado}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      )}

      <div className="text-center pt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a iniciar sesión
        </Link>
      </div>
    </MarcoAuth>
  );
}
