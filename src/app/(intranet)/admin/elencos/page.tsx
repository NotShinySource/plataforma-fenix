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
import {
  INSTRUMENTOS,
  TIPOS_ELENCO,
  type CategoriaElenco,
  type ConId,
  type Elenco,
  type Instrumento,
  type TipoElenco,
} from "@/types";

const OPCIONES_CATEGORIA: { valor: CategoriaElenco; titulo: string; detalle: string }[] = [
  { valor: "elenco", titulo: "Elenco", detalle: "Coro, banda, orquesta..." },
  { valor: "instrumento", titulo: "Clase de instrumento", detalle: "Piano, guitarra..." },
];
import {
  CLASE_BOTON_PRIMARIO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/ui/estilos";

export default function AdminElencosPage() {
  const router = useRouter();

  const [elencos, setElencos] = useState<ConId<Elenco>[]>([]);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalCrear, setModalCrear] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaElenco>("elenco");
  const [tipoElenco, setTipoElenco] = useState<TipoElenco>(TIPOS_ELENCO[0]);
  const [instrumento, setInstrumento] = useState<Instrumento>(INSTRUMENTOS[0]);
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
        if (!cancelado) setError("No se pudieron cargar los elencos y clases.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, []);

  const listaElencos = elencos.filter((elenco) => elenco.categoria === "elenco");
  const listaClases = elencos.filter((elenco) => elenco.categoria === "instrumento");
  const cantidadElencos = listaElencos.length;
  const cantidadClases = listaClases.length;

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
      const resultado = await crearElencoAction({
        nombre,
        categoria,
        ...(categoria === "elenco" ? { tipoElenco } : { instrumento }),
        descripcion,
        idTokenAdmin,
      });

      if (!resultado.ok || !resultado.elencoId) {
        setErrorCrear(resultado.error ?? "No se pudo crear.");
        setEnviando(false);
        return;
      }

      router.push(`/admin/elencos/${resultado.elencoId}`);
    } catch {
      setErrorCrear("No se pudo crear. Intenta de nuevo.");
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
          <h1 className="text-2xl sm:text-3xl font-black text-text-dark mt-1">
            Elencos y clases
          </h1>
          <p className="text-slate-600 text-sm font-medium mt-1">
            {cargando
              ? "Cargando..."
              : `${cantidadElencos} ${cantidadElencos === 1 ? "elenco" : "elencos"} y ${cantidadClases} ${cantidadClases === 1 ? "clase de instrumento" : "clases de instrumento"}. Selecciona uno para asignar docentes y alumnos.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalCrear(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo elenco o clase
        </button>
      </div>

      {cargando && <EstadoCargando texto="Cargando elencos y clases..." />}
      {error && <EstadoError mensaje={error} />}
      {!cargando && !error && elencos.length === 0 && (
        <EstadoVacio
          icono={Music2}
          titulo="Todavía no hay elencos ni clases creados"
          descripcion={'Crea el primero con el botón "Nuevo elenco o clase".'}
        />
      )}
      {!cargando &&
        !error &&
        [
          { titulo: "Elencos", lista: listaElencos },
          { titulo: "Clases de instrumento", lista: listaClases },
        ]
          .filter((seccion) => seccion.lista.length > 0)
          .map((seccion) => (
            <section key={seccion.titulo} className="space-y-4">
              <h2 className="text-lg font-extrabold text-text-dark">{seccion.titulo}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {seccion.lista.map((elenco, indice) => (
                  <ElencoCard
                    key={elenco.id}
                    elenco={elenco}
                    indice={indice}
                    cantidadMiembros={conteos[elenco.id] ?? 0}
                  />
                ))}
              </div>
            </section>
          ))}

      {modalCrear && (
        <Modal
          titulo="Nuevo elenco o clase"
          subtitulo="Después podrás asignarle docentes y alumnos"
          icono={Music2}
          bloqueado={enviando}
          onCerrar={cerrarModalCrear}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <fieldset>
              <legend className={CLASE_ETIQUETA}>¿Qué vas a crear?</legend>
              <div className="grid grid-cols-2 gap-3">
                {OPCIONES_CATEGORIA.map((opcion) => {
                  const activa = categoria === opcion.valor;
                  return (
                    <label
                      key={opcion.valor}
                      className={`cursor-pointer rounded-2xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 ${
                        activa
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="categoria"
                        value={opcion.valor}
                        checked={activa}
                        onChange={() => setCategoria(opcion.valor)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-extrabold text-text-dark">
                        {opcion.titulo}
                      </span>
                      <span className="block text-xs font-semibold text-slate-600 mt-0.5">
                        {opcion.detalle}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="nombre" className={CLASE_ETIQUETA}>
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                placeholder={categoria === "elenco" ? "Ej: Coro Infantil" : "Ej: Piano Inicial"}
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                required
                maxLength={100}
                autoFocus
                className={CLASE_CAMPO}
              />
            </div>

            {categoria === "elenco" ? (
              <div>
                <label htmlFor="tipoElenco" className={CLASE_ETIQUETA}>
                  Tipo de elenco
                </label>
                <select
                  id="tipoElenco"
                  value={tipoElenco}
                  onChange={(evento) => setTipoElenco(evento.target.value as TipoElenco)}
                  required
                  className={CLASE_CAMPO}
                >
                  {TIPOS_ELENCO.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="instrumento" className={CLASE_ETIQUETA}>
                  Instrumento
                </label>
                <select
                  id="instrumento"
                  value={instrumento}
                  onChange={(evento) => setInstrumento(evento.target.value as Instrumento)}
                  required
                  className={CLASE_CAMPO}
                >
                  {INSTRUMENTOS.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="descripcion" className={CLASE_ETIQUETA}>
                Descripción{" "}
                <span className="normal-case font-semibold text-slate-600">(opcional)</span>
              </label>
              <textarea
                id="descripcion"
                placeholder={
                  categoria === "elenco"
                    ? "Breve descripción del elenco..."
                    : "Nivel, edades o detalles de la clase..."
                }
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                maxLength={500}
                rows={3}
                className={`${CLASE_CAMPO} resize-none`}
              />
            </div>

            {errorCrear && (
              <p
                role="alert"
                className={CLASE_ERROR}
              >
                {errorCrear}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={cerrarModalCrear}
                disabled={enviando}
                className={CLASE_BOTON_SECUNDARIO}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className={CLASE_BOTON_PRIMARIO}
              >
                {enviando ? "Creando..." : categoria === "elenco" ? "Crear elenco" : "Crear clase"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
