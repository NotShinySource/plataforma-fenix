"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { IdCard, Lock, Music } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { rutEsValido } from "@/lib/auth/rut";
import { formatearRutInput } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { MarcoAuth } from "@/components/auth/MarcoAuth";
import { destinoTrasLogin, RUTA_POR_ROL } from "@/lib/auth/rutas";
import type { RolUsuario } from "@/types";
import { obtenerIdentificadorAction } from "./actions";
import { haySesionServidorAction, iniciarSesionServidorAction } from "../sesion-actions";
import { CLASE_CAMPO_ACCESO } from "@/components/ui/estilos";

const CLASE_LABEL = "block text-sm font-bold text-slate-700 mb-2 px-1";

export default function LoginPage() {
  const router = useRouter();
  const { usuario, rol, cargando: cargandoSesion } = useAuth();

  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión activa (p. ej. se llegó a /login por error), mandar
  // directo al panel del rol. Pero solo si el servidor también tiene la
  // sesión: si el navegador conserva una sesión sin cookie (por ejemplo,
  // abierta antes de que existiera la cookie, o la cookie venció), proxy.ts
  // devolvería al usuario aquí en un ciclo. En ese caso se cierra la sesión
  // del navegador y se pide la contraseña de nuevo.
  // Mientras se envía el formulario no se revisa: la sesión del navegador ya
  // existe pero la cookie todavía se está creando.
  useEffect(() => {
    if (cargandoSesion || enviando || !usuario || !rol) return;
    let cancelado = false;
    haySesionServidorAction().then((hay) => {
      if (cancelado) return;
      if (hay) router.replace(RUTA_POR_ROL[rol]);
      else signOut(auth);
    });
    return () => {
      cancelado = true;
    };
  }, [cargandoSesion, enviando, usuario, rol, router]);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!rutEsValido(rut)) {
      setError("El RUT ingresado no es válido.");
      return;
    }

    setEnviando(true);

    try {
      // El identificador de la cuenta se deriva del RUT en el servidor (usa
      // una clave secreta): así la consola de Firebase no muestra RUT.
      const resultado = await obtenerIdentificadorAction(rut);
      if (!resultado.ok) throw new Error("RUT inválido");
      const credencial = await signInWithEmailAndPassword(auth, resultado.identificador, password);
      const resultadoToken = await credencial.user.getIdTokenResult();
      const rolUsuario = resultadoToken.claims.rol as RolUsuario | undefined;

      // Sin la cookie del servidor no se puede entrar a la intranet.
      const sesion = await iniciarSesionServidorAction(resultadoToken.token);
      if (!rolUsuario || !sesion.ok) {
        await signOut(auth);
        throw new Error("Sin sesión en el servidor");
      }

      const siguiente = new URLSearchParams(window.location.search).get("siguiente");
      router.replace(destinoTrasLogin(rolUsuario, siguiente));
    } catch (error) {
      // Firebase solo informa que la cuenta está inhabilitada si la
      // contraseña es correcta, así que decirlo no revela qué RUT existen.
      if ((error as { code?: string })?.code === "auth/user-disabled") {
        setError("Tu cuenta está inhabilitada. Si sigues en la escuela, contacta a la administración.");
        setEnviando(false);
        return;
      }
      // Mensaje genérico a propósito: no distinguir "RUT no existe" de
      // "contraseña incorrecta" para no dejar enumerar RUTs registrados.
      setError("RUT o contraseña incorrectos.");
      setEnviando(false);
    }
  }

  return (
    <MarcoAuth
      icono={Music}
      titulo="Ingresa a tu intranet"
      subtitulo="Usa tu RUT y la contraseña que creaste."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="rut" className={CLASE_LABEL}>
            RUT
          </label>
          <div className="relative">
            <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            <input
              id="rut"
              name="rut"
              type="text"
              placeholder="Ej: 21.345.678-9"
              value={rut}
              onChange={(evento) => setRut(formatearRutInput(evento.target.value))}
              required
              autoComplete="username"
              maxLength={12}
              inputMode="text"
              className={CLASE_CAMPO_ACCESO}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className={CLASE_LABEL}>
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
              autoComplete="current-password"
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
          disabled={enviando}
          className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enviando ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600 font-medium">¿Primera vez o olvidaste tu contraseña?</p>
          <Link
            href="/acceso"
            className="inline-block mt-1 text-sm font-bold text-terracotta hover:text-terracotta-dark transition-colors"
          >
            Crear o recuperar contraseña
          </Link>
        </div>
      </form>
    </MarcoAuth>
  );
}
