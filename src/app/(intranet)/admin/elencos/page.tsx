"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Music2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { contarMiembrosPorElenco, listarElencos } from "@/services/elencos.service";
import { ElencoCard } from "@/components/intranet/admin/ElencoCard";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { crearElencoAction } from "./actions";
import { TIPOS_ELENCO, type ConId, type Elenco, type TipoElenco } from "@/types";

export default function AdminElencosPage() {
  const router = useRouter();

  const [elencos, setElencos] = useState<ConId<Elenco>[]>([]);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [tipoElenco, setTipoElenco] = useState<TipoElenco>(TIPOS_ELENCO[0]);
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const [elencosResultado, conteosResultado] = await Promise.all([
          listarElencos(),
          contarMiembrosPorElenco(),
        ]);
        if (!cancelado) {
          setElencos(elencosResultado);
          setConteos(conteosResultado);
        }
      } catch {
        if (!cancelado) setError("No se pudieron cargar los elencos.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, []);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorCrear(null);

    if (!auth.currentUser) return;

    setEnviando(true);

    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await crearElencoAction({ nombre, tipoElenco, descripcion, idTokenAdmin });

      if (!resultado.ok || !resultado.elencoId) {
        setErrorCrear(resultado.error ?? "No se pudo crear el elenco.");
        setEnviando(false);
        return;
      }

      router.push(`/admin/elencos/${resultado.elencoId}`);
    } catch {
      setErrorCrear("No se pudo crear el elenco. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface p-4 sm:p-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Music2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl text-text-dark leading-tight">Crear Elenco</h1>
            <p className="text-slate-600 text-sm font-semibold">
              Alta de nuevos elencos institucionales
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[24px] shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ej: Coro Infantil"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              required
              maxLength={100}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="tipoElenco"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              Tipo de Elenco
            </label>
            <select
              id="tipoElenco"
              name="tipoElenco"
              value={tipoElenco}
              onChange={(evento) => setTipoElenco(evento.target.value as TipoElenco)}
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark"
            >
              {TIPOS_ELENCO.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 px-1"
            >
              Descripción <span className="normal-case text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              placeholder="Breve descripción del elenco..."
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-base font-medium text-text-dark placeholder:text-slate-500 resize-none"
            />
          </div>

          {errorCrear && (
            <p
              role="alert"
              className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3"
            >
              {errorCrear}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? "Creando..." : "Crear Elenco"}
          </button>
        </form>
      </div>

      <div className="max-w-3xl mx-auto mt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Music2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-xl text-text-dark leading-tight">
              Elencos Existentes
            </h2>
            <p className="text-slate-600 text-sm font-semibold">
              Selecciona uno para asignar profesores y alumnos
            </p>
          </div>
        </div>

        {cargando && <EstadoCargando texto="Cargando elencos..." />}
        {error && <EstadoError mensaje={error} />}
        {!cargando && !error && elencos.length === 0 && (
          <EstadoVacio
            icono={Music2}
            titulo="Todavía no hay elencos creados"
            descripcion="Los elencos que crees aparecerán aquí."
          />
        )}
        {!cargando && !error && elencos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {elencos.map((elenco) => (
              <ElencoCard
                key={elenco.id}
                elenco={elenco}
                cantidadMiembros={conteos[elenco.id] ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
