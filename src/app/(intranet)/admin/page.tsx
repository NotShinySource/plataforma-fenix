"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Music, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { obtenerUsuario } from "@/services/usuarios.service";
import type { ConId, Usuario } from "@/types";

export default function AdminDashboardPage() {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const [perfil, setPerfil] = useState<ConId<Usuario> | null>(null);

  useEffect(() => {
    if (!usuario) return;
    let cancelado = false;

    obtenerUsuario(usuario.uid).then((resultado) => {
      if (!cancelado) setPerfil(resultado);
    });

    return () => {
      cancelado = true;
    };
  }, [usuario]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const nombrePila = perfil?.nombres ?? "Administrador";

  return (
    <main className="min-h-screen bg-surface p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-md shadow-primary/20 flex-shrink-0">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-text-dark leading-tight">
                Hola, {nombrePila}
              </h1>
              <p className="text-slate-600 text-sm font-semibold mt-0.5">
                Panel de administración — Plataforma Fénix
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold text-xs transition-all border border-slate-100 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/usuarios"
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all"
          >
            <div className="bg-primary/10 p-3 rounded-2xl text-primary flex-shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-text-dark">Crear Usuario</h4>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Alta y listado de alumnos y profesores
              </p>
            </div>
          </Link>

          <Link
            href="/admin/elencos"
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all"
          >
            <div className="bg-terracotta/10 p-3 rounded-2xl text-terracotta flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-text-dark">Elencos</h4>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Gestiona elencos y sus miembros
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
