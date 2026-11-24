"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Megaphone, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { destinoAviso, validarAvisoDireccion } from "@/lib/avisos";
import { LONGITUD_MAXIMA_CONTENIDO_AVISO, LONGITUD_MAXIMA_TITULO_AVISO } from "@/lib/validacion";
import { listarTodosLosAvisos } from "@/services/avisos.service";
import { listarElencos } from "@/services/elencos.service";
import { FilaAviso } from "@/components/intranet/shared/FilaAviso";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Modal } from "@/components/ui/Modal";
import {
  CLASE_AREA_TEXTO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";
import { eliminarAvisoAction, publicarAvisoDireccionAction } from "./actions";
import type { AlcanceAviso, Aviso, ConId, Elenco } from "@/types";

const OPCIONES_ALCANCE: { valor: AlcanceAviso; titulo: string; detalle: string }[] = [
  { valor: "escuela", titulo: "Toda la escuela", detalle: "Todos los alumnos y docentes" },
  { valor: "elenco", titulo: "Un grupo", detalle: "Solo los miembros de un elenco" },
];

/**
 * RF-11, lado Dirección: publicar avisos para toda la escuela o para un
 * grupo, y ver o eliminar cualquier aviso publicado.
 */
export default function AdminAvisosPage() {
  const [avisos, setAvisos] = useState<ConId<Aviso>[] | null>(null);
  const [grupos, setGrupos] = useState<ConId<Elenco>[]>([]);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [alcance, setAlcance] = useState<AlcanceAviso>("escuela");
  const [elencoId, setElencoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null);

  const [avisoAEliminar, setAvisoAEliminar] = useState<ConId<Aviso> | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarTodosLosAvisos(), listarElencos()])
      .then(([listaAvisos, listaGrupos]) => {
        if (cancelado) return;
        setAvisos(listaAvisos);
        setGrupos(listaGrupos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
        setErrorCarga(null);
      })
      .catch(() => {
        if (!cancelado) setErrorCarga("No se pudieron cargar los avisos.");
      });
    return () => {
      cancelado = true;
    };
  }, [version]);

  const nombresGrupos = useMemo(
    () => Object.fromEntries(grupos.map((grupo) => [grupo.id, grupo.nombre])),
    [grupos]
  );
  // En un grupo archivado no se publican avisos nuevos.
  const gruposActivos = grupos.filter((grupo) => grupo.activo);
  const elencoElegido = elencoId || gruposActivos[0]?.id || "";

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = { alcance, elencoId: alcance === "elenco" ? elencoElegido : null, titulo, contenido, urgente };
    const validacion = validarAvisoDireccion(datos);
    if (!validacion.ok) {
      setErrorPublicar(validacion.error);
      return;
    }
    if (!auth.currentUser) return;

    setPublicando(true);
    setErrorPublicar(null);
    try {
      const resultado = await publicarAvisoDireccionAction({
        idTokenAdmin: await auth.currentUser.getIdToken(),
        aviso: validacion.valor,
      });
      if (!resultado.ok) {
        setErrorPublicar(resultado.error);
        return;
      }
      setTitulo("");
      setContenido("");
      setUrgente(false);
      setVersion((v) => v + 1);
    } catch {
      setErrorPublicar("No se pudo publicar el aviso. Revisa tu conexión.");
    } finally {
      setPublicando(false);
    }
  }

  async function eliminar() {
    if (!avisoAEliminar || !auth.currentUser) return;
    setEliminando(true);
    setErrorEliminar(null);
    try {
      const resultado = await eliminarAvisoAction({
        idTokenAdmin: await auth.currentUser.getIdToken(),
        avisoId: avisoAEliminar.id,
      });
      if (!resultado.ok) {
        setErrorEliminar(resultado.error);
        return;
      }
      setAvisoAEliminar(null);
      setVersion((v) => v + 1);
    } catch {
      setErrorEliminar("No se pudo eliminar el aviso. Revisa tu conexión.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <div>
        <span className="text-terracotta text-xs font-bold uppercase tracking-widest">Administración</span>
        <h1 className="text-2xl sm:text-3xl font-black text-text-dark mt-1">Avisos</h1>
        <p className="text-slate-600 text-sm font-medium mt-1">
          Publica comunicados de la Dirección para toda la escuela o para un grupo.
        </p>
      </div>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-extrabold text-text-dark">Publicar nuevo aviso</h2>
        <form onSubmit={publicar} className="space-y-4" noValidate>
          <fieldset>
            <legend className={CLASE_ETIQUETA}>Para</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OPCIONES_ALCANCE.map((opcion) => {
                const activa = alcance === opcion.valor;
                return (
                  <label
                    key={opcion.valor}
                    className={`cursor-pointer rounded-2xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 ${
                      activa ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="alcance"
                      value={opcion.valor}
                      checked={activa}
                      onChange={() => setAlcance(opcion.valor)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-extrabold text-text-dark">{opcion.titulo}</span>
                    <span className="block text-xs font-semibold text-slate-600 mt-0.5">{opcion.detalle}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {alcance === "elenco" && (
            <div>
              <label htmlFor="aviso-grupo" className={CLASE_ETIQUETA}>
                Grupo
              </label>
              {gruposActivos.length === 0 ? (
                <p className="text-sm font-semibold text-slate-600 px-1">No hay grupos activos.</p>
              ) : (
                <select
                  id="aviso-grupo"
                  value={elencoElegido}
                  onChange={(evento) => setElencoId(evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  {gruposActivos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label htmlFor="aviso-titulo" className={CLASE_ETIQUETA}>
              Título
            </label>
            <input
              id="aviso-titulo"
              type="text"
              maxLength={LONGITUD_MAXIMA_TITULO_AVISO}
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder="Ej: Suspensión de clases el lunes"
              className={CLASE_CAMPO}
            />
          </div>

          <div>
            <label htmlFor="aviso-contenido" className={CLASE_ETIQUETA}>
              Contenido
            </label>
            <textarea
              id="aviso-contenido"
              rows={4}
              maxLength={LONGITUD_MAXIMA_CONTENIDO_AVISO}
              value={contenido}
              onChange={(evento) => setContenido(evento.target.value)}
              placeholder="Detalle del aviso..."
              className={CLASE_AREA_TEXTO}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={urgente}
              onChange={(evento) => setUrgente(evento.target.checked)}
              className="w-4 h-4 accent-terracotta"
            />
            Marcar como urgente
          </label>

          {errorPublicar && (
            <p role="alert" className={CLASE_ERROR}>
              {errorPublicar}
            </p>
          )}

          <button
            type="submit"
            disabled={publicando || (alcance === "elenco" && gruposActivos.length === 0)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Megaphone className="w-4 h-4" />
            {publicando ? "Publicando..." : "Publicar aviso"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-text-dark">Avisos publicados</h2>
        {!avisos && !errorCarga && <EstadoCargando texto="Cargando avisos..." />}
        {errorCarga && <EstadoError mensaje={errorCarga} />}
        {avisos && avisos.length === 0 && (
          <EstadoVacio
            icono={Megaphone}
            titulo="Todavía no hay avisos"
            descripcion="Los avisos de la Dirección y de los docentes aparecerán aquí."
          />
        )}
        {avisos && avisos.length > 0 && (
          <div className="space-y-3">
            {avisos.map((aviso) => (
              <FilaAviso
                key={aviso.id}
                aviso={aviso}
                destino={destinoAviso(aviso, aviso.elencoId ? nombresGrupos[aviso.elencoId] : undefined)}
                acciones={
                  <button
                    type="button"
                    onClick={() => {
                      setErrorEliminar(null);
                      setAvisoAEliminar(aviso);
                    }}
                    aria-label={`Eliminar "${aviso.titulo}"`}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      {avisoAEliminar && (
        <Modal
          titulo="Eliminar aviso"
          subtitulo={avisoAEliminar.titulo}
          icono={AlertTriangle}
          tono="peligro"
          ancho="sm"
          bloqueado={eliminando}
          onCerrar={() => setAvisoAEliminar(null)}
        >
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Deja de verse para todos los destinatarios y se borra el registro de quién lo leyó. Esta
            acción no se puede deshacer.
          </p>
          {errorEliminar && (
            <p role="alert" className={`${CLASE_ERROR} mb-4`}>
              {errorEliminar}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAvisoAEliminar(null)}
              disabled={eliminando}
              className={CLASE_BOTON_SECUNDARIO}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={eliminar}
              disabled={eliminando}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
