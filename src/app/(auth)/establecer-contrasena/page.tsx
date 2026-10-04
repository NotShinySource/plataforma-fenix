"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  confirmPasswordReset,
  signInWithEmailAndPassword,
  verifyPasswordResetCode,
} from "firebase/auth";
import { Lock, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { LONGITUD_MINIMA_PASSWORD } from "@/lib/validacion";
import { MarcoAuth } from "@/components/auth/MarcoAuth";
import type { RolUsuario } from "@/types";
import { confirmarActivacionAction } from "./actions";

const RUTA_POR_ROL: Record<RolUsuario, string> = {
  alumno: "/alumno",
  profesor: "/profesor",
  administrador: "/admin",
};

const CLASE_INPUT =
  "w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500";
const CLASE_LABEL = "block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1";

type EstadoEnlace = "verificando" | "valido" | "invalido";

function FormularioEstablecerContrasena() {
  const router = useRouter();
  const codigo = useSearchParams().get("codigo");

  const [estadoEnlace, setEstadoEnlace] = useState<EstadoEnlace>("verificando");
  // Identificador interno de la cuenta a la que pertenece el enlace.
  const [identificador, setIdentificador] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listoSinSesion, setListoSinSesion] = useState(false);

  useEffect(() => {
    if (!codigo) return;
    let cancelado = false;

    // Firebase valida que el código exista, no haya vencido ni se haya usado.
    verifyPasswordResetCode(auth, codigo)
      .then((identificadorCuenta) => {
        if (cancelado) return;
        setIdentificador(identificadorCuenta);
        setEstadoEnlace("valido");
      })
      .catch(() => {
        if (!cancelado) setEstadoEnlace("invalido");
      });

    return () => {
      cancelado = true;
    };
  }, [codigo]);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    if (!codigo || !identificador) return;

    if (password.length < LONGITUD_MINIMA_PASSWORD) {
      setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      await confirmPasswordReset(auth, codigo, password);
    } catch {
      setError("El enlace venció o ya fue usado. Solicita uno nuevo.");
      setEstadoEnlace("invalido");
      setGuardando(false);
      return;
    }

    // La contraseña ya quedó guardada. Entrar de inmediato evita que el
    // usuario tenga que volver a escribir su RUT y su clave recién creada.
    try {
      const credencial = await signInWithEmailAndPassword(auth, identificador, password);
      await confirmarActivacionAction(await credencial.user.getIdToken());
      const token = await credencial.user.getIdTokenResult();
      const rol = token.claims.rol as RolUsuario | undefined;
      router.replace(rol ? RUTA_POR_ROL[rol] : "/login");
    } catch {
      setListoSinSesion(true);
      setGuardando(false);
    }
  }

  const enlaceInvalido = !codigo || estadoEnlace === "invalido";

  if (listoSinSesion) {
    return (
      <div className="space-y-6 text-center">
        <p
          role="status"
          className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 leading-relaxed"
        >
          Tu contraseña quedó guardada. Ya puedes iniciar sesión con tu RUT.
        </p>
        <Link
          href="/login"
          className="inline-block w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-primary/25"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  if (enlaceInvalido) {
    return (
      <div className="space-y-6 text-center">
        <p
          role="alert"
          className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 leading-relaxed"
        >
          Este enlace no es válido: venció o ya fue usado.
        </p>
        <Link
          href="/acceso"
          className="inline-block w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-primary/25"
        >
          Solicitar un enlace nuevo
        </Link>
      </div>
    );
  }

  if (estadoEnlace === "verificando") {
    return (
      <p className="text-center text-slate-600 text-sm font-semibold py-6">Verificando enlace...</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="password" className={CLASE_LABEL}>
          Nueva contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            required
            minLength={LONGITUD_MINIMA_PASSWORD}
            autoComplete="new-password"
            autoFocus
            className={CLASE_INPUT}
          />
        </div>
        <p className="text-xs text-slate-600 font-medium mt-2 px-1">
          Mínimo {LONGITUD_MINIMA_PASSWORD} caracteres.
        </p>
      </div>

      <div>
        <label htmlFor="confirmacion" className={CLASE_LABEL}>
          Repite la contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="confirmacion"
            type="password"
            value={confirmacion}
            onChange={(evento) => setConfirmacion(evento.target.value)}
            required
            autoComplete="new-password"
            className={CLASE_INPUT}
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
        disabled={guardando}
        className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {guardando ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}

export default function EstablecerContrasenaPage() {
  return (
    <MarcoAuth
      icono={ShieldCheck}
      titulo="Crea tu contraseña"
      subtitulo="Elige una contraseña que puedas recordar. La usarás junto a tu RUT para entrar."
    >
      {/* useSearchParams exige un límite de Suspense para el build estático. */}
      <Suspense
        fallback={
          <p className="text-center text-slate-600 text-sm font-semibold py-6">Cargando...</p>
        }
      >
        <FormularioEstablecerContrasena />
      </Suspense>
    </MarcoAuth>
  );
}
