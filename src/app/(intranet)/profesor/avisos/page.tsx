"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Megaphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import { listarAvisosPorElenco, publicarAviso } from "@/services/avisos.service";
import { formatearFechaLarga } from "@/lib/format";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Aviso, ConId, Elenco } from "@/types";

interface AvisoConElenco {
  aviso: ConId<Aviso>;
  elenco: ConId<Elenco>;
}

export default function ProfesorAvisosPage() {
  const { usuario } = useAuth();
  const { elencos, cargando: cargandoElencos, error: errorElencos } = useElencos();

  const [elencoSeleccionado, setElencoSeleccionado] = useState("");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null);

  const [avisos, setAvisos] = useState<AvisoConElenco[]>([]);
  const [cargandoAvisos, setCargandoAvisos] = useState(true);
  const [errorAvisos, setErrorAvisos] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const elencoIdFinal = elencoSeleccionado || elencos[0]?.id || "";

  useEffect(() => {
    if (cargandoElencos || errorElencos || elencos.length === 0) return;
    let cancelado = false;

    async function cargar() {
      setCargandoAvisos(true);
      setErrorAvisos(null);
      try {
        const porElenco = await Promise.all(
          elencos.map(async (elenco) => {
            const avisosDelElenco = await listarAvisosPorElenco(elenco.id);
            return avisosDelElenco.map((aviso) => ({ aviso, elenco }));
          })
        );
        if (cancelado) return;
        const combinados = porElenco
          .flat()
          .sort((a, b) => b.aviso.fechaPublicacion.getTime() - a.aviso.fechaPublicacion.getTime());
        setAvisos(combinados);
      } catch {
        if (!cancelado) setErrorAvisos("No se pudieron cargar los avisos publicados.");
      } finally {
        if (!cancelado) setCargandoAvisos(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [elencos, cargandoElencos, errorElencos, version]);

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario || !elencoIdFinal) return;

    setPublicando(true);
    setErrorPublicar(null);
    try {
      await publicarAviso({
        elencoId: elencoIdFinal,
        profesorId: usuario.uid,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        urgente,
      });
      setTitulo("");
      setContenido("");
      setUrgente(false);
      setVersion((v) => v + 1);
    } catch {
      setErrorPublicar("No se pudo publicar el aviso. Intenta de nuevo.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-black text-text-dark">Mural de Avisos</h2>
        <p className="text-slate-600 text-sm font-medium mt-1">
          Publica comunicados para los alumnos de tus elencos.
        </p>
      </div>

      {cargandoElencos && <EstadoCargando texto="Cargando tus elencos..." />}
      {errorElencos && <EstadoError mensaje={errorElencos} />}

      {!cargandoElencos && !errorElencos && elencos.length === 0 && (
        <EstadoVacio
          icono={Megaphone}
          titulo="Sin elencos asignados"
          descripcion="Necesitas al menos un elenco a cargo para publicar avisos."
        />
      )}

      {!cargandoElencos && !errorElencos && elencos.length > 0 && (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
            <h3 className="text-lg font-extrabold text-text-dark">Publicar nuevo aviso</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Elenco
                </label>
                <select
                  value={elencoIdFinal}
                  onChange={(evento) => setElencoSeleccionado(evento.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
                >
                  {elencos.map((elenco) => (
                    <option key={elenco.id} value={elenco.id}>
                      {elenco.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(evento) => setTitulo(evento.target.value)}
                  placeholder="Ej: Ensayo general este sábado"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contenido
                </label>
                <textarea
                  required
                  rows={4}
                  value={contenido}
                  onChange={(evento) => setContenido(evento.target.value)}
                  placeholder="Detalle del aviso..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium text-text-dark placeholder:text-slate-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={urgente}
                  onChange={(evento) => setUrgente(evento.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-terracotta focus:ring-terracotta/30"
                />
                Marcar como urgente
              </label>

              {errorPublicar && (
                <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {errorPublicar}
                </p>
              )}

              <button
                type="submit"
                disabled={publicando}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {publicando ? "Publicando..." : "Publicar aviso"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-text-dark">Avisos publicados</h3>

            {cargandoAvisos && <EstadoCargando texto="Cargando avisos..." />}
            {!cargandoAvisos && errorAvisos && <EstadoError mensaje={errorAvisos} />}
            {!cargandoAvisos && !errorAvisos && avisos.length === 0 && (
              <EstadoVacio
                icono={Megaphone}
                titulo="Todavía no has publicado avisos"
                descripcion="Usa el formulario de arriba para publicar el primero."
              />
            )}
            {!cargandoAvisos && !errorAvisos && avisos.length > 0 && (
              <div className="space-y-3">
                {avisos.map(({ aviso, elenco }) => (
                  <div
                    key={aviso.id}
                    className={`bg-white rounded-2xl border p-5 flex items-start gap-4 ${
                      aviso.urgente ? "border-terracotta/30" : "border-slate-100"
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        aviso.urgente ? "bg-terracotta/10 text-terracotta" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {aviso.urgente && (
                          <span className="bg-terracotta text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Urgente
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                          {elenco.nombre}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-text-dark leading-snug mt-1">{aviso.titulo}</h4>
                      <p className="text-sm text-slate-600 font-medium mt-1">{aviso.contenido}</p>
                      <p className="text-xs text-slate-600 font-semibold mt-2">
                        {formatearFechaLarga(aviso.fechaPublicacion)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
