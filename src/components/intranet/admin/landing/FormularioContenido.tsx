"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { sinOptimizar } from "@/lib/landing/imagen";
import { LIMITES_LANDING } from "@/lib/landing/validacion";
import { CLASE_AREA_TEXTO, CLASE_BOTON_PRIMARIO, CLASE_CAMPO, CLASE_ERROR, CLASE_ETIQUETA } from "@/components/ui/estilos";
import { guardarContenidoLandingAction } from "@/app/(intranet)/admin/landing/actions";
import type { CifraLanding, ContenidoLanding } from "@/types";
import { BotonSubirImagen } from "./BotonSubirImagen";

function Campo({ id, etiqueta, ayuda, children }: { id: string; etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className="text-xs font-medium text-slate-600 mt-1 px-1">{ayuda}</p>}
    </div>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
      <h2 className="text-lg font-extrabold text-text-dark">{titulo}</h2>
      {children}
    </section>
  );
}

const AYUDA_DESTACADO = "Lo que escribas entre asteriscos se destaca. Ejemplo: en la *comunidad* loína.";

interface FormularioContenidoProps {
  inicial: ContenidoLanding;
}

/** Portada y "Nuestra Organización" de la Landing. Se guardan juntas. */
export function FormularioContenido({ inicial }: FormularioContenidoProps) {
  const [contenido, setContenido] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  /** Modifica una copia del contenido: el estado de React no se cambia en el lugar. */
  function cambiar(modificar: (borrador: ContenidoLanding) => void) {
    setContenido((actual) => {
      const copia = structuredClone(actual);
      modificar(copia);
      return copia;
    });
    setGuardado(false);
  }

  function campoCifra(prefijo: string, cifra: CifraLanding, alCambiar: (c: CifraLanding) => void) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <input
          aria-label={`${prefijo}: valor`}
          value={cifra.valor}
          maxLength={LIMITES_LANDING.cifraValor}
          onChange={(e) => alCambiar({ ...cifra, valor: e.target.value })}
          className={CLASE_CAMPO}
        />
        <input
          aria-label={`${prefijo}: texto`}
          value={cifra.etiqueta}
          maxLength={LIMITES_LANDING.cifraEtiqueta}
          onChange={(e) => alCambiar({ ...cifra, etiqueta: e.target.value })}
          className={CLASE_CAMPO}
        />
      </div>
    );
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!auth.currentUser) return;
    setGuardando(true);
    setError(null);
    try {
      const idTokenAdmin = await auth.currentUser.getIdToken();
      const resultado = await guardarContenidoLandingAction({ idTokenAdmin, contenido });
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setGuardado(true);
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const { portada, organizacion } = contenido;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tarjeta titulo="Portada">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            <Campo id="portada-etiqueta" etiqueta="Etiqueta superior">
              <input
                id="portada-etiqueta"
                value={portada.etiqueta}
                maxLength={LIMITES_LANDING.etiqueta}
                onChange={(e) => cambiar((c) => void (c.portada.etiqueta = e.target.value))}
                className={CLASE_CAMPO}
              />
            </Campo>
            <Campo id="portada-titulo" etiqueta="Título" ayuda={AYUDA_DESTACADO}>
              <input
                id="portada-titulo"
                value={portada.titulo}
                maxLength={LIMITES_LANDING.titulo}
                onChange={(e) => cambiar((c) => void (c.portada.titulo = e.target.value))}
                className={CLASE_CAMPO}
              />
            </Campo>
            <Campo id="portada-descripcion" etiqueta="Descripción">
              <textarea
                id="portada-descripcion"
                rows={3}
                value={portada.descripcion}
                maxLength={LIMITES_LANDING.descripcionPortada}
                onChange={(e) => cambiar((c) => void (c.portada.descripcion = e.target.value))}
                className={CLASE_AREA_TEXTO}
              />
            </Campo>
            <div>
              <span className={CLASE_ETIQUETA}>Tarjetas sobre la foto (valor y texto)</span>
              <div className="space-y-2">
                {portada.tarjetas.map((tarjeta, i) => (
                  <div key={i}>
                    {campoCifra(`Tarjeta ${i + 1}`, tarjeta, (nueva) =>
                      cambiar((c) => void (c.portada.tarjetas[i] = nueva))
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className={CLASE_ETIQUETA}>Foto</span>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
              <Image
                src={portada.imagen.url}
                alt="Foto actual de la portada"
                fill
                sizes="280px"
                unoptimized={sinOptimizar(portada.imagen.url)}
                className="object-cover"
              />
            </div>
            <BotonSubirImagen
              carpeta="portada"
              etiqueta="Cambiar foto"
              onSubidas={([imagen]) => cambiar((c) => void (c.portada.imagen = imagen))}
            />
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Nuestra Organización">
        <Campo id="organizacion-titulo" etiqueta="Título" ayuda={AYUDA_DESTACADO}>
          <input
            id="organizacion-titulo"
            value={organizacion.titulo}
            maxLength={LIMITES_LANDING.titulo}
            onChange={(e) => cambiar((c) => void (c.organizacion.titulo = e.target.value))}
            className={CLASE_CAMPO}
          />
        </Campo>

        <div className="space-y-3">
          <span className={CLASE_ETIQUETA}>Párrafos (misión e historia)</span>
          {organizacion.parrafos.map((parrafo, i) => (
            <div key={i} className="flex gap-2 items-start">
              <textarea
                aria-label={`Párrafo ${i + 1}`}
                rows={4}
                value={parrafo}
                maxLength={LIMITES_LANDING.parrafo}
                onChange={(e) => cambiar((c) => void (c.organizacion.parrafos[i] = e.target.value))}
                className={CLASE_AREA_TEXTO}
              />
              <button
                type="button"
                onClick={() => cambiar((c) => void c.organizacion.parrafos.splice(i, 1))}
                disabled={organizacion.parrafos.length === 1}
                aria-label={`Quitar el párrafo ${i + 1}`}
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <p className="text-xs font-medium text-slate-600 px-1">
            En los párrafos, lo que va entre asteriscos aparece en negrita.
          </p>
          {organizacion.parrafos.length < LIMITES_LANDING.maximoParrafos && (
            <button
              type="button"
              onClick={() => cambiar((c) => void c.organizacion.parrafos.push(""))}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              <Plus className="w-4 h-4" /> Agregar párrafo
            </button>
          )}
        </div>

        <div>
          <span className={CLASE_ETIQUETA}>Cifras (valor y texto)</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {organizacion.cifras.map((cifra, i) => (
              <div key={i}>
                {campoCifra(`Cifra ${i + 1}`, cifra, (nueva) => cambiar((c) => void (c.organizacion.cifras[i] = nueva)))}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizacion.pilares.map((pilar, i) => (
            <div key={i} className="space-y-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className={CLASE_ETIQUETA}>Recuadro {i + 1}</span>
              <input
                aria-label={`Recuadro ${i + 1}: título`}
                value={pilar.titulo}
                maxLength={LIMITES_LANDING.pilarTitulo}
                onChange={(e) => cambiar((c) => void (c.organizacion.pilares[i].titulo = e.target.value))}
                className={CLASE_CAMPO}
              />
              <textarea
                aria-label={`Recuadro ${i + 1}: texto`}
                rows={3}
                value={pilar.texto}
                maxLength={LIMITES_LANDING.pilarTexto}
                onChange={(e) => cambiar((c) => void (c.organizacion.pilares[i].texto = e.target.value))}
                className={CLASE_AREA_TEXTO}
              />
            </div>
          ))}
        </div>
      </Tarjeta>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sticky bottom-4">
        <button type="submit" disabled={guardando} className={`${CLASE_BOTON_PRIMARIO} sm:flex-none sm:px-8 shadow-lg shadow-primary/25`}>
          {guardando ? "Guardando..." : "Guardar portada y organización"}
        </button>
        {guardado && (
          <p role="status" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-white/90 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4" /> Guardado. Ya se ve en el sitio.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className={CLASE_ERROR}>
          {error}
        </p>
      )}
    </form>
  );
}
