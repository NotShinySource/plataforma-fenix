/**
 * Preguntas frecuentes de la Landing. Funciones puras: las usa el servidor
 * para validar lo que llega del panel (fuente de verdad) y la página pública
 * para mostrarlo. Todo termina en una página pública, así que el texto nunca
 * se interpreta como HTML.
 */
import type { PreguntaFrecuente } from "@/types";

export const LIMITES_PREGUNTAS = {
  categoria: 60,
  pregunta: 200,
  respuesta: 2000,
  maximoPreguntas: 100,
} as const;

type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

export type DatosPregunta = Omit<PreguntaFrecuente, "orden">;

function limpiar(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/** Normaliza los saltos de línea y quita los espacios sobrantes de cada línea. */
function limpiarRespuesta(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((linea) => linea.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Valida una pregunta enviada desde el panel. El orden lo asigna el servidor. */
export function validarPregunta(entrada: unknown): Resultado<DatosPregunta> {
  if (!entrada || typeof entrada !== "object") return { ok: false, error: "Datos inválidos." };
  const datos = entrada as Record<string, unknown>;

  const categoria = limpiar(datos.categoria).replace(/\s+/g, " ");
  const pregunta = limpiar(datos.pregunta).replace(/\s+/g, " ");
  const respuesta = limpiarRespuesta(datos.respuesta);

  if (!categoria) return { ok: false, error: "La categoría no puede quedar vacía." };
  if (categoria.length > LIMITES_PREGUNTAS.categoria) {
    return { ok: false, error: `La categoría puede tener hasta ${LIMITES_PREGUNTAS.categoria} caracteres.` };
  }
  if (!pregunta) return { ok: false, error: "La pregunta no puede quedar vacía." };
  if (pregunta.length > LIMITES_PREGUNTAS.pregunta) {
    return { ok: false, error: `La pregunta puede tener hasta ${LIMITES_PREGUNTAS.pregunta} caracteres.` };
  }
  if (!respuesta) return { ok: false, error: "La respuesta no puede quedar vacía." };
  if (respuesta.length > LIMITES_PREGUNTAS.respuesta) {
    return { ok: false, error: `La respuesta puede tener hasta ${LIMITES_PREGUNTAS.respuesta} caracteres.` };
  }
  if (typeof datos.publicada !== "boolean") return { ok: false, error: "Falta indicar si se publica." };

  return { ok: true, valor: { categoria, pregunta, respuesta, publicada: datos.publicada } };
}

export type BloqueRespuesta = { tipo: "parrafo"; texto: string } | { tipo: "lista"; elementos: string[] };

/**
 * Convierte la respuesta en párrafos y listas. Las líneas seguidas de un
 * mismo párrafo se unen con un espacio: así un texto pegado con saltos de
 * línea a mitad de frase se lee de corrido.
 */
export function bloquesRespuesta(respuesta: string): BloqueRespuesta[] {
  const bloques: BloqueRespuesta[] = [];
  let parrafo: string[] = [];
  let lista: string[] = [];

  const cerrarParrafo = () => {
    if (parrafo.length) bloques.push({ tipo: "parrafo", texto: parrafo.join(" ") });
    parrafo = [];
  };
  const cerrarLista = () => {
    if (lista.length) bloques.push({ tipo: "lista", elementos: lista });
    lista = [];
  };

  for (const linea of respuesta.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim())) {
    if (!linea) {
      cerrarParrafo();
      cerrarLista();
    } else if (/^[-•]\s+/.test(linea)) {
      cerrarParrafo();
      lista.push(linea.replace(/^[-•]\s+/, ""));
    } else {
      cerrarLista();
      parrafo.push(linea);
    }
  }
  cerrarParrafo();
  cerrarLista();
  return bloques;
}

export interface GrupoPreguntas<T> {
  categoria: string;
  preguntas: T[];
}

/**
 * Agrupa por categoría respetando el orden: cada categoría aparece donde está
 * su primera pregunta, y dentro de ella las preguntas siguen su orden.
 */
export function agruparPorCategoria<T extends Pick<PreguntaFrecuente, "categoria" | "orden">>(
  preguntas: T[]
): GrupoPreguntas<T>[] {
  const grupos = new Map<string, T[]>();
  for (const pregunta of [...preguntas].sort((a, b) => a.orden - b.orden)) {
    const lista = grupos.get(pregunta.categoria) ?? [];
    lista.push(pregunta);
    grupos.set(pregunta.categoria, lista);
  }
  return Array.from(grupos, ([categoria, lista]) => ({ categoria, preguntas: lista }));
}

/**
 * Datos estructurados (schema.org FAQPage) para que los buscadores puedan
 * mostrar las preguntas. Se escapan "<" y ">" para que ningún texto pueda
 * cerrar la etiqueta <script> en la que se insertan.
 */
export function jsonLdPreguntas(preguntas: Pick<PreguntaFrecuente, "pregunta" | "respuesta">[]): string {
  const datos = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((p) => ({
      "@type": "Question",
      name: p.pregunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: bloquesRespuesta(p.respuesta)
          .map((b) => (b.tipo === "parrafo" ? b.texto : b.elementos.join("; ")))
          .join(" "),
      },
    })),
  };
  return JSON.stringify(datos).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}
