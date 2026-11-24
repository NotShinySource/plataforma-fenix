"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Megaphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useElencos } from "@/hooks/useElencos";
import {
  listarAvisosDeEscuela,
  listarAvisosPorElenco,
  publicarAviso,
} from "@/services/avisos.service";
import { destinoAviso } from "@/lib/avisos";
import { FilaAviso } from "@/components/intranet/shared/FilaAviso";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Aviso, ConId } from "@/types";
import { CLASE_CAMPO, CLASE_ERROR } from "@/components/ui/estilos";
import { LONGITUD_MAXIMA_CONTENIDO_AVISO, LONGITUD_MAXIMA_TITULO_AVISO } from "@/lib/validacion";

interface AvisoConDestino {
  aviso: ConId<Aviso>;
  /** El grupo o "Toda la escuela". */
  destino: string;
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

  const [avisos, setAvisos] = useState<AvisoConDestino[]>([]);
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
        // Los de sus grupos y los de la Dirección para toda la escuela.
        const porElenco = await Promise.all([
          listarAvisosDeEscuela().then((lista) =>
            lista.map((aviso) => ({ aviso, destino: destinoAviso(aviso) }))
          ),
          ...elencos.map(async (elenco) => {
            const avisosDelElenco = await listarAvisosPorElenco(elenco.id);
            return avisosDelElenco.map((aviso) => ({ aviso, destino: elenco.nombre }));
          }),
        ]);
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
                <label htmlFor="elencoAviso" className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Elenco
                </label>
                <select
                  id="elencoAviso"
                  value={elencoIdFinal}
                  onChange={(evento) => setElencoSeleccionado(evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  {elencos.map((elenco) => (
                    <option key={elenco.id} value={elenco.id}>
                      {elenco.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tituloAviso" className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título
                </label>
                <input
                  id="tituloAviso"
                  type="text"
                  required
                  maxLength={LONGITUD_MAXIMA_TITULO_AVISO}
                  value={titulo}
                  onChange={(evento) => setTitulo(evento.target.value)}
                  placeholder="Ej: Ensayo general este sábado"
                  className={CLASE_CAMPO}
                />
              </div>

              <div>
                <label htmlFor="contenidoAviso" className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contenido
                </label>
                <textarea
                  id="contenidoAviso"
                  required
                  maxLength={LONGITUD_MAXIMA_CONTENIDO_AVISO}
                  rows={4}
                  value={contenido}
                  onChange={(evento) => setContenido(evento.target.value)}
                  placeholder="Detalle del aviso..."
                  className={`${CLASE_CAMPO} resize-none`}
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
                <p className={CLASE_ERROR}>
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
            <h3 className="text-lg font-extrabold text-text-dark">Avisos de tus grupos y de la Dirección</h3>

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
                {avisos.map(({ aviso, destino }) => (
                  <FilaAviso key={aviso.id} aviso={aviso} destino={destino} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
