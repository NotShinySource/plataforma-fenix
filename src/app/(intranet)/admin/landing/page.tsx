"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { EstadoCargando } from "@/components/ui/EstadoCargando";
import { EstadoError } from "@/components/ui/EstadoError";
import { FormularioContenido } from "@/components/intranet/admin/landing/FormularioContenido";
import { ListaActuaciones } from "@/components/intranet/admin/landing/ListaActuaciones";
import { ListaPreguntas } from "@/components/intranet/admin/landing/ListaPreguntas";
import { obtenerLandingAdminAction } from "./actions";
import type { ActuacionLanding, ConId, ContenidoLanding, PreguntaFrecuente } from "@/types";

/**
 * Panel para editar la Landing (RF-14): portada, organización, actuaciones
 * y preguntas frecuentes. La sección de Escuelas y el pie de página siguen fijos.
 */
export default function AdminLandingPage() {
  const [edicion, setEdicion] = useState<{ contenido: ContenidoLanding; versionContenido: string } | null>(null);
  const [actuaciones, setActuaciones] = useState<ConId<ActuacionLanding>[]>([]);
  const [preguntas, setPreguntas] = useState<ConId<PreguntaFrecuente>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const idTokenAdmin = await auth.currentUser?.getIdToken();
        if (!idTokenAdmin) throw new Error("Sin sesión");
        const resultado = await obtenerLandingAdminAction(idTokenAdmin);
        if (cancelado) return;
        if (!resultado.ok) {
          setError(resultado.error);
          return;
        }
        setEdicion((actual) => actual ?? { contenido: resultado.contenido, versionContenido: resultado.versionContenido });
        setActuaciones(resultado.actuaciones);
        setPreguntas(resultado.preguntas);
      } catch {
        if (!cancelado) setError("No se pudo cargar el contenido de la Landing.");
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [version]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-terracotta text-xs font-bold uppercase tracking-widest">Administración</span>
          <h1 className="text-2xl sm:text-3xl font-black text-text-dark mt-1">Sitio web</h1>
          <p className="text-slate-600 text-sm font-medium mt-1">
            Lo que guardes aquí se ve de inmediato en la página pública.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-text-dark px-5 py-3 rounded-2xl font-bold text-sm transition-all"
        >
          Ver sitio <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {error && <EstadoError mensaje={error} />}
      {!error && !edicion && <EstadoCargando texto="Cargando el contenido del sitio..." variante="bloque" />}

      {edicion && (
        <>
          <FormularioContenido inicial={edicion.contenido} versionInicial={edicion.versionContenido} />
          <ListaActuaciones actuaciones={actuaciones} onCambio={() => setVersion((v) => v + 1)} />
          <ListaPreguntas preguntas={preguntas} onCambio={() => setVersion((v) => v + 1)} />
        </>
      )}
    </>
  );
}
