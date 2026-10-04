"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  GraduationCap,
  Music2,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { obtenerUsuario } from "@/services/usuarios.service";
import { EstadoError } from "@/components/ui/EstadoError";
import { obtenerResumenAdminAction, type ResumenAdmin } from "./actions";
import type { ConId, RolUsuario, Usuario } from "@/types";

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  alumno: "Alumno",
  profesor: "Docente",
  administrador: "Administrador",
};

interface TarjetaCifraProps {
  icono: LucideIcon;
  etiqueta: string;
  valor: number | null;
  estilo: string;
  href: string;
}

function TarjetaCifra({ icono: Icono, etiqueta, valor, estilo, href }: TarjetaCifraProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
    >
      <div className={`p-3 rounded-2xl flex-shrink-0 ${estilo}`}>
        <Icono className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-3xl font-black text-text-dark leading-none tabular-nums">
          {valor === null ? (
            <span className="inline-block w-10 h-7 bg-slate-100 rounded-lg animate-pulse align-middle" />
          ) : (
            valor
          )}
        </p>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-1.5 truncate">
          {etiqueta}
        </p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState<ConId<Usuario> | null>(null);
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;
    let cancelado = false;

    obtenerUsuario(usuario.uid)
      .then((resultado) => {
        if (!cancelado) setPerfil(resultado);
      })
      .catch(() => undefined);

    usuario
      .getIdToken()
      .then((idTokenAdmin) => obtenerResumenAdminAction(idTokenAdmin))
      .then((resultado) => {
        if (cancelado) return;
        if (resultado.ok) setResumen(resultado.resumen);
        else setError(resultado.error);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo cargar el resumen.");
      });

    return () => {
      cancelado = true;
    };
  }, [usuario]);

  const nombrePila = perfil?.nombres.split(" ")[0] ?? "Administrador";

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-text-dark">Hola, {nombrePila}</h1>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl font-medium">
            Desde aquí administras las cuentas de la escuela y la conformación de los elencos.
          </p>
        </div>
        <div className="bg-primary/10 px-5 py-3 rounded-2xl flex items-center gap-3 border border-primary/10 flex-shrink-0 relative z-10">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-none">
              Tu rol
            </p>
            <p className="text-sm font-bold text-text-dark mt-1 leading-none">Administración</p>
          </div>
        </div>
      </div>

      {error && <EstadoError mensaje={error} />}

      {!error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TarjetaCifra
            icono={Users}
            etiqueta="Alumnos"
            valor={resumen?.alumnos ?? null}
            estilo="bg-primary/10 text-primary"
            href="/admin/usuarios"
          />
          <TarjetaCifra
            icono={GraduationCap}
            etiqueta="Docentes"
            valor={resumen?.profesores ?? null}
            estilo="bg-indigo-50 text-indigo-600"
            href="/admin/usuarios"
          />
          <TarjetaCifra
            icono={Music2}
            etiqueta="Elencos"
            valor={resumen?.elencos ?? null}
            estilo="bg-terracotta/10 text-terracotta"
            href="/admin/elencos"
          />
          <TarjetaCifra
            icono={Clock}
            etiqueta="Sin activar"
            valor={resumen?.pendientes ?? null}
            estilo="bg-amber-50 text-amber-600"
            href="/admin/usuarios"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 sm:px-8 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-terracotta text-xs font-bold uppercase tracking-widest">
                Seguimiento
              </span>
              <h2 className="text-lg font-extrabold text-text-dark mt-1">
                Cuentas pendientes de activación
              </h2>
            </div>
            <Link
              href="/admin/usuarios"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 flex-shrink-0"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {!resumen && !error && (
            <p className="p-8 text-sm text-slate-600 font-semibold text-center">Cargando...</p>
          )}
          {resumen && resumen.cuentasPendientes.length === 0 && (
            <div className="p-10 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="font-bold text-text-dark">Todas las cuentas están activas</p>
              <p className="text-sm text-slate-600">
                Cuando crees usuarios nuevos, aparecerán aquí hasta que definan su contraseña.
              </p>
            </div>
          )}
          {resumen && resumen.cuentasPendientes.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {resumen.cuentasPendientes.map((cuenta) => (
                <li key={cuenta.id} className="px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {cuenta.nombres.charAt(0)}
                      {cuenta.apellidos.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-dark text-sm truncate">
                        {cuenta.nombres} {cuenta.apellidos}
                      </p>
                      <p className="text-xs text-slate-600 font-semibold">
                        {ETIQUETA_ROL[cuenta.rol]}
                      </p>
                    </div>
                  </div>
                  <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0">
                    Pendiente
                  </span>
                </li>
              ))}
              {resumen.pendientes > resumen.cuentasPendientes.length && (
                <li className="px-6 sm:px-8 py-3 text-xs font-semibold text-slate-600">
                  y {resumen.pendientes - resumen.cuentasPendientes.length} más
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <Link
            href="/admin/usuarios"
            className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-4 group"
          >
            <div className="bg-white/15 p-3 rounded-2xl flex-shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold">Usuarios</h3>
              <p className="text-xs text-white/80 font-semibold mt-0.5">
                Crear, editar y entregar accesos
              </p>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/admin/elencos"
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="bg-terracotta/10 p-3 rounded-2xl text-terracotta flex-shrink-0">
              <Music2 className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-text-dark">Elencos</h3>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Crear elencos y asignar miembros
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </>
  );
}
