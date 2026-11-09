import "server-only";
import type { DocumentData } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase/admin";
import { ACTUACIONES_PREDETERMINADAS, CONTENIDO_PREDETERMINADO } from "@/lib/landing/predeterminado";
import type { ActuacionLanding, ConId, ContenidoLanding } from "@/types";

export const coleccionActuaciones = () => dbAdmin.collection("actuaciones_landing");
export const documentoContenido = () => dbAdmin.collection("contenido_landing").doc("general");

export interface Landing {
  contenido: ContenidoLanding;
  actuaciones: ConId<ActuacionLanding>[];
  /** false mientras el Administrador no haya abierto el panel: se usa el contenido predeterminado. */
  configurada: boolean;
}

function predeterminada(): Landing {
  return {
    contenido: CONTENIDO_PREDETERMINADO,
    actuaciones: ACTUACIONES_PREDETERMINADAS.map((actuacion, i) => ({
      ...actuacion,
      id: `predeterminada-${i + 1}`,
    })),
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

/** Toda la Landing, incluidos los borradores, ordenada como en el carrusel. */
export async function leerLanding(): Promise<Landing> {
  const [general, actuaciones] = await Promise.all([
    documentoContenido().get(),
    coleccionActuaciones().get(),
  ]);
  if (!general.exists) return predeterminada();

  return {
    contenido: general.data()!.contenido as ContenidoLanding,
    actuaciones: actuaciones.docs
      .map((d) => mapActuacion(d.id, d.data()))
      .sort((a, b) => a.orden - b.orden),
    configurada: true,
  };
}

/**
 * Lo que ve el público: solo actuaciones publicadas. Si Firestore no responde,
 * se muestra el contenido predeterminado: la Landing nunca queda en blanco.
 */
export async function leerLandingPublica(): Promise<Landing> {
  try {
    const landing = await leerLanding();
    return { ...landing, actuaciones: landing.actuaciones.filter((a) => a.publicada) };
  } catch (error) {
    console.error("No se pudo leer el contenido de la Landing:", error);
    return predeterminada();
  }
}
