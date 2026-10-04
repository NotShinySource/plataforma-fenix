"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Music2, Plus } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { contarMiembrosPorElenco, listarElencos } from "@/services/elencos.service";
import { ElencoCard } from "@/components/intranet/admin/ElencoCard";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Modal } from "@/components/ui/Modal";
import { crearElencoAction } from "./actions";
import { TIPOS_ELENCO, type ConId, type Elenco, type TipoElenco } from "@/types";

const CLASE_INPUT =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500";
const CLASE_LABEL = "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 px-1";

export default function AdminElencosPage() {
  const router = useRouter();

  const [elencos, setElencos] = useState<ConId<Elenco>[]>([]);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalCrear, setModalCrear] = useState(false);
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
          setElencos(
            elencosResultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
          );
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

  function cerrarModalCrear() {
    if (enviando) return;
    setModalCrear(false);
    setErrorCrear(null);
  }

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
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-terracotta text-xs font-bold uppercase tracking-widest">
            Administración
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-text-dark mt-1">Elencos</h1>
          <p className="text-slate-600 text-sm font-medium mt-1">
            {cargando
              ? "Cargando..."
              : `${elencos.length} ${elencos.length === 1 ? "elenco creado" : "elencos creados"}. Selecciona uno para asignar docentes y alumnos.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalCrear(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo elenco
        </button>
      </div>

      {cargando && <EstadoCargando texto="Cargando elencos..." />}
      {error && <EstadoError mensaje={error} />}
      {!cargando && !error && elencos.length === 0 && (
        <EstadoVacio
          icono={Music2}
          titulo="Todavía no hay elencos creados"
          descripcion={'Crea el primero con el botón "Nuevo elenco".'}
        />
      )}
      {!cargando && !error && elencos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {elencos.map((elenco, indice) => (
            <ElencoCard
              key={elenco.id}
              elenco={elenco}
              indice={indice}
              cantidadMiembros={conteos[elenco.id] ?? 0}
            />
          ))}
        </div>
      )}

      {modalCrear && (
        <Modal
          titulo="Nuevo elenco"
          subtitulo="Después podrás asignarle docentes y alumnos"
          icono={Music2}
          bloqueado={enviando}
          onCerrar={cerrarModalCrear}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="nombre" className={CLASE_LABEL}>
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                placeholder="Ej: Coro Infantil"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                required
                maxLength={100}
                autoFocus
                className={CLASE_INPUT}
              />
            </div>

            <div>
              <label htmlFor="tipoElenco" className={CLASE_LABEL}>
                Tipo de elenco
              </label>
              <select
                id="tipoElenco"
                value={tipoElenco}
                onChange={(evento) => setTipoElenco(evento.target.value as TipoElenco)}
                required
                className={CLASE_INPUT}
              >
                {TIPOS_ELENCO.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="descripcion" className={CLASE_LABEL}>
                Descripción{" "}
                <span className="normal-case font-semibold text-slate-600">(opcional)</span>
              </label>
              <textarea
                id="descripcion"
                placeholder="Breve descripción del elenco..."
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                maxLength={500}
                rows={3}
                className={`${CLASE_INPUT} resize-none`}
              />
            </div>

            {errorCrear && (
              <p
                role="alert"
                className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                {errorCrear}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={cerrarModalCrear}
                disabled={enviando}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? "Creando..." : "Crear elenco"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
