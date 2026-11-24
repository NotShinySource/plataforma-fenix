import "server-only";
import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase/admin";
import { ACTUACIONES_PREDETERMINADAS, CONTENIDO_PREDETERMINADO } from "@/lib/landing/predeterminado";
import { PREGUNTAS_PREDETERMINADAS } from "@/lib/landing/preguntas-predeterminadas";
import { validarContenidoLanding } from "@/lib/landing/validacion";
import type { ActuacionLanding, ConId, ContenidoLanding, PreguntaFrecuente } from "@/types";

export const coleccionActuaciones = () => dbAdmin.collection("actuaciones_landing");
export const documentoContenido = () => dbAdmin.collection("contenido_landing").doc("general");
export const coleccionPreguntas = () => dbAdmin.collection("preguntas_landing");

export function versionDeContenido(ultimaEscritura?: Timestamp): string {
  return ultimaEscritura ? `${ultimaEscritura.seconds}.${ultimaEscritura.nanoseconds}` : "";
}
/**
 * Marca de que las preguntas ya se copiaron a Firestore. Es aparte del
 * contenido general porque la sección llegó después: en un sitio ya
 * configurado, las preguntas se copian la primera vez que se abre el panel.
 * Si el Administrador las borra todas, la marca evita que vuelvan a aparecer.
 */
export const documentoMarcaPreguntas = () => dbAdmin.collection("contenido_landing").doc("preguntas");

export interface Landing {
  contenido: ContenidoLanding;
  versionContenido: string;
  actuaciones: ConId<ActuacionLanding>[];
  preguntas: ConId<PreguntaFrecuente>[];
  /** false mientras el Administrador no haya abierto el panel: se usa el contenido predeterminado. */
  configurada: boolean;
}

function preguntasPredeterminadas(): ConId<PreguntaFrecuente>[] {
  return PREGUNTAS_PREDETERMINADAS.map((pregunta, i) => ({
    ...pregunta,
    id: `predeterminada-pregunta-${i + 1}`,
  }));
}

function predeterminada(): Landing {
  return {
    contenido: CONTENIDO_PREDETERMINADO,
    versionContenido: "",
    actuaciones: ACTUACIONES_PREDETERMINADAS.map((actuacion, i) => ({
      ...actuacion,
      id: `predeterminada-${i + 1}`,
    })),
    preguntas: preguntasPredeterminadas(),
    configurada: false,
  };
}

function mapActuacion(id: string, data: DocumentData): ConId<ActuacionLanding> {
  return {
    id,
    titulo: data.titulo,
    fecha: data.fecha,
    lugar: data.lugar,
    descripcion: data.descripcion,
    imagenes: data.imagenes ?? [],
    enlaces: data.enlaces ?? [],
    orden: data.orden ?? 0,
    publicada: data.publicada === true,
  };
}

function mapPregunta(id: string, data: DocumentData): ConId<PreguntaFrecuente> {
  return {
    id,
    categoria: data.categoria,
    pregunta: data.pregunta,
    respuesta: data.respuesta,
    orden: data.orden ?? 0,
    publicada: data.publicada === true,
  };
}

/** Preguntas frecuentes, incluidos los borradores; las predeterminadas si todavía no se copiaron. */
export async function leerPreguntas(): Promise<ConId<PreguntaFrecuente>[]> {
  const [marca, preguntas] = await Promise.all([
    documentoMarcaPreguntas().get(),
    coleccionPreguntas().get(),
  ]);
  if (!marca.exists) return preguntasPredeterminadas();
  return preguntas.docs.map((d) => mapPregunta(d.id, d.data())).sort((a, b) => a.orden - b.orden);
}

/** Toda la Landing, incluidos los borradores, ordenada como en el carrusel. */
export async function leerLanding(): Promise<Landing> {
  const [general, actuaciones, preguntas] = await Promise.all([
    documentoContenido().get(),
    coleccionActuaciones().get(),
    leerPreguntas(),
  ]);
  if (!general.exists) return { ...predeterminada(), preguntas };
  const contenido = validarContenidoLanding(general.data()?.contenido);
  if (!contenido.ok) throw new Error(contenido.error);

  return {
    contenido: contenido.valor,
    versionContenido: versionDeContenido(general.updateTime),
    actuaciones: actuaciones.docs
      .map((d) => mapActuacion(d.id, d.data()))
      .sort((a, b) => a.orden - b.orden),
    preguntas,
    configurada: true,
  };
}

/**
 * Lo que ve el público: solo actuaciones y preguntas publicadas. Si Firestore no responde,
 * se muestra el contenido predeterminado: la Landing nunca queda en blanco.
 */
export async function leerLandingPublica(): Promise<Landing> {
  try {
    const landing = await leerLanding();
    return {
      ...landing,
      actuaciones: landing.actuaciones.filter((a) => a.publicada),
      preguntas: landing.preguntas.filter((p) => p.publicada),
    };
  } catch (error) {
    console.error("No se pudo leer el contenido de la Landing:", error);
    return predeterminada();
  }
}

/**
 * Preguntas publicadas, para la página de preguntas frecuentes. Si Firestore
 * no responde, se muestran las iniciales: la página nunca queda en blanco.
 */
export async function leerPreguntasPublicas(): Promise<ConId<PreguntaFrecuente>[]> {
  try {
    return (await leerPreguntas()).filter((p) => p.publicada);
  } catch (error) {
    console.error("No se pudieron leer las preguntas frecuentes:", error);
    return preguntasPredeterminadas();
  }
}
