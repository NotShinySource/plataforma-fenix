import { LONGITUD_MAXIMA_CONTENIDO_AVISO, LONGITUD_MAXIMA_TITULO_AVISO } from "@/lib/validacion";
import type { AlcanceAviso, Aviso } from "@/types";

/**
 * Reglas de los avisos que publica la Dirección. Funciones puras: las usa el
 * servidor para validar lo que llega del panel y la interfaz para mostrar
 * los avisos.
 */

export interface DatosAvisoDireccion {
  alcance: AlcanceAviso;
  /** Solo cuando el alcance es "elenco". */
  elencoId: string | null;
  titulo: string;
  contenido: string;
  urgente: boolean;
}

type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

export function validarAvisoDireccion(entrada: unknown): Resultado<DatosAvisoDireccion> {
  if (!entrada || typeof entrada !== "object") return { ok: false, error: "Datos inválidos." };
  const datos = entrada as Record<string, unknown>;

  if (datos.alcance !== "elenco" && datos.alcance !== "escuela") {
    return { ok: false, error: "Elige a quién va dirigido el aviso." };
  }
  const elencoId = typeof datos.elencoId === "string" ? datos.elencoId.trim() : "";
  if (datos.alcance === "elenco" && !elencoId) return { ok: false, error: "Elige el grupo." };

  const titulo = typeof datos.titulo === "string" ? datos.titulo.trim() : "";
  const contenido = typeof datos.contenido === "string" ? datos.contenido.trim() : "";
  if (!titulo) return { ok: false, error: "El título no puede quedar vacío." };
  if (titulo.length > LONGITUD_MAXIMA_TITULO_AVISO) {
    return { ok: false, error: `El título puede tener hasta ${LONGITUD_MAXIMA_TITULO_AVISO} caracteres.` };
  }
  if (!contenido) return { ok: false, error: "El contenido no puede quedar vacío." };
  if (contenido.length > LONGITUD_MAXIMA_CONTENIDO_AVISO) {
    return { ok: false, error: `El contenido puede tener hasta ${LONGITUD_MAXIMA_CONTENIDO_AVISO} caracteres.` };
  }
  if (typeof datos.urgente !== "boolean") return { ok: false, error: "Falta indicar si es urgente." };

  return {
    ok: true,
    valor: {
      alcance: datos.alcance,
      elencoId: datos.alcance === "elenco" ? elencoId : null,
      titulo,
      contenido,
      urgente: datos.urgente,
    },
  };
}

/** Urgentes primero y, dentro de cada grupo, los más nuevos arriba. */
export function compararAvisos(
  a: Pick<Aviso, "urgente" | "fechaPublicacion">,
  b: Pick<Aviso, "urgente" | "fechaPublicacion">
): number {
  if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
  return b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime();
}

/** Texto del destino que se muestra en la tarjeta: el grupo o "Toda la escuela". */
export function destinoAviso(aviso: Pick<Aviso, "alcance">, nombreElenco?: string): string {
  return aviso.alcance === "escuela" ? "Toda la escuela" : (nombreElenco ?? "Grupo");
}
