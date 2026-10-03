"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Lock, Music } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { rutEsValido } from "@/lib/auth/rut";
import { formatearRutInput } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import type { RolUsuario } from "@/types";
import { obtenerIdentificadorAction } from "./actions";

const RUTA_POR_ROL: Record<RolUsuario, string> = {
  alumno: "/alumno",
  profesor: "/profesor",
  administrador: "/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const { usuario, rol, cargando: cargandoSesion } = useAuth();

  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión activa (p. ej. se llegó a /login por error), no mostrar
  // el formulario — mandar directo al dashboard que corresponde al rol.
  useEffect(() => {
    if (!cargandoSesion && usuario && rol) {
      router.replace(RUTA_POR_ROL[rol]);
    }
  }, [cargandoSesion, usuario, rol, router]);

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

      router.replace(rolUsuario ? RUTA_POR_ROL[rolUsuario] : "/");
    } catch {
      // Mensaje genérico a propósito: no distinguir "RUT no existe" de
      // "contraseña incorrecta" para no dejar enumerar RUTs registrados.
      setError("RUT o contraseña incorrectos.");
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-primary/10 p-3.5 rounded-2xl text-primary mb-4">
              <Music className="w-8 h-8" />
            </div>
            <h1 className="font-black text-2xl text-text-dark leading-tight">
              Portal Académico Fénix
            </h1>
            <p className="text-slate-600 text-sm mt-1.5 font-semibold uppercase tracking-wider">
              Acceso Intranet
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="rut"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
              >
                RUT
              </label>
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
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500"
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
              {enviando ? "Ingresando..." : "Iniciar Sesión"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/acceso"
                className="text-sm text-slate-600 hover:text-terracotta font-semibold transition-colors"
              >
                ¿Primera vez o olvidaste tu contraseña?
              </Link>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Conexión Segura SSL
          </span>
          <span>FÉNIX</span>
        </div>
      </div>
    </main>
  );
}
