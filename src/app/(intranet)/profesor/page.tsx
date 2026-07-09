"use client";

import { useEffect, useState } from "react";
import { Calendar, Music } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import { obtenerUsuario } from "@/services/usuarios.service";
import { ElencoCard } from "@/components/intranet/profesor/ElencoCard";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { ConId, Usuario } from "@/types";

export default function ProfesorDashboardPage() {
  const { usuario } = useAuth();
  const { elencos, cargando, error } = useElencos();
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

  const nombrePila = perfil?.nombres ?? "Profesor";

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-text-dark">
            ¡Hola, Profesor {nombrePila}!
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl font-medium">
            Desde aquí gestionas el material, la asistencia y los avisos de tus elencos.
          </p>
        </div>

        <div className="bg-terracotta/10 px-5 py-3 rounded-2xl flex items-center gap-3 border border-terracotta/10 flex-shrink-0 relative z-10">
          <Calendar className="w-5 h-5 text-terracotta" />
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-none">
              Año Académico
            </p>
            <p className="text-sm font-bold text-text-dark mt-1 leading-none">Calambanda 2026</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-dark">Mis Elencos</h3>
            <p className="text-xs text-slate-600 mt-0.5 font-semibold">
              Selecciona un elenco para gestionar material o tomar asistencia
            </p>
          </div>
          {!cargando && !error && (
            <span className="bg-slate-200/60 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {elencos.length} A cargo
            </span>
          )}
        </div>

        {cargando && <EstadoCargando texto="Cargando tus elencos..." />}
        {error && <EstadoError mensaje={error} />}
        {!cargando && !error && elencos.length === 0 && (
          <EstadoVacio
            icono={Music}
            titulo="Todavía no tienes elencos asignados"
            descripcion="Cuando el Administrador te asigne a un elenco, aparecerá aquí."
          />
        )}
        {!cargando && !error && elencos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {elencos.map((elenco) => (
              <ElencoCard key={elenco.id} elenco={elenco} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
