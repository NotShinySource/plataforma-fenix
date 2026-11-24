"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { dbAdmin, storageAdmin } from "@/lib/firebase/admin";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import {
  coleccionActuaciones,
  coleccionPreguntas,
  documentoContenido,
  documentoMarcaPreguntas,
  leerLanding,
  leerPreguntas,
} from "@/lib/landing/leer";
import { ACTUACIONES_PREDETERMINADAS, CONTENIDO_PREDETERMINADO } from "@/lib/landing/predeterminado";
import { PREGUNTAS_PREDETERMINADAS } from "@/lib/landing/preguntas-predeterminadas";
import { LIMITES_PREGUNTAS, validarPregunta } from "@/lib/landing/preguntas";
import {
  imagenesDescartadas,
  validarActuacion,
  validarContenidoLanding,
} from "@/lib/landing/validacion";
import type { ActuacionLanding, ConId, ContenidoLanding, ImagenLanding, PreguntaFrecuente } from "@/types";

export type ResultadoLanding = { ok: true } | { ok: false; error: string };

/**
 * La primera vez, copia a Firestore el contenido que la Landing mostraba
 * fijo en el código. create() falla si el documento ya existe, y como va en
 * el mismo lote que las actuaciones, dos administradores abriendo el panel a
 * la vez no las duplican.
 */
async function asegurarInicializada(): Promise<void> {
  if ((await documentoContenido().get()).exists) return;

  const lote = dbAdmin.batch();
  lote.create(documentoContenido(), {
    contenido: CONTENIDO_PREDETERMINADO,
    fechaActualizacion: FieldValue.serverTimestamp(),
  });
  for (const actuacion of ACTUACIONES_PREDETERMINADAS) {
    lote.set(coleccionActuaciones().doc(), {
      ...actuacion,
      fechaActualizacion: FieldValue.serverTimestamp(),
    });
  }
  try {
    await lote.commit();
  } catch (error) {
    // Otro administrador la inicializó al mismo tiempo: no hay nada que hacer.
    if (!(await documentoContenido().get()).exists) throw error;
  }
}

/**
 * La primera vez, copia a Firestore las preguntas frecuentes iniciales. La
 * marca se crea con create() en el mismo lote: si dos administradores abren
 * el panel a la vez, solo uno las copia.
 */
async function asegurarPreguntasInicializadas(): Promise<void> {
  if ((await documentoMarcaPreguntas().get()).exists) return;

  const lote = dbAdmin.batch();
  lote.create(documentoMarcaPreguntas(), { fechaCreacion: FieldValue.serverTimestamp() });
  for (const pregunta of PREGUNTAS_PREDETERMINADAS) {
    lote.set(coleccionPreguntas().doc(), {
      ...pregunta,
      fechaActualizacion: FieldValue.serverTimestamp(),
    });
  }
  try {
    await lote.commit();
  } catch (error) {
    if (!(await documentoMarcaPreguntas().get()).exists) throw error;
  }
}

/** Comprueba que cada imagen de Storage referenciada exista de verdad en la carpeta landing/. */
async function imagenesExisten(imagenes: ImagenLanding[]): Promise<boolean> {
  const bucket = storageAdmin.bucket();
  const subidas = imagenes.filter((imagen) => imagen.ruta);
  const existen = await Promise.all(subidas.map((imagen) => bucket.file(imagen.ruta).exists()));
  return existen.every(([existe]) => existe);
}

/**
 * Borra de Storage las imágenes que ya no usa nadie. Si falla, la Landing no
 * se ve afectada: solo queda un archivo sin uso en el bucket.
 */
async function borrarImagenes(rutas: string[]): Promise<void> {
  const bucket = storageAdmin.bucket();
  await Promise.all(
    rutas.map((ruta) =>
      bucket
        .file(ruta)
        .delete()
        .catch((error) => console.error(`No se pudo borrar ${ruta}:`, error))
    )
  );
}

/** Las páginas públicas se arman con caché: esto hace que el cambio se vea de inmediato. */
function publicarCambios() {
  revalidatePath("/");
  revalidatePath("/preguntas-frecuentes");
}

export type LandingAdminResultado =
  | {
      ok: true;
      contenido: ContenidoLanding;
      actuaciones: ConId<ActuacionLanding>[];
      preguntas: ConId<PreguntaFrecuente>[];
    }
  | { ok: false; error: string };

export async function obtenerLandingAdminAction(idTokenAdmin: string): Promise<LandingAdminResultado> {
  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  try {
    await asegurarInicializada();
    await asegurarPreguntasInicializadas();
    const { contenido, actuaciones, preguntas } = await leerLanding();
    return { ok: true, contenido, actuaciones, preguntas };
  } catch (error) {
    console.error("No se pudo cargar la Landing:", error);
    return { ok: false, error: "No se pudo cargar el contenido de la Landing." };
  }
}

export async function guardarContenidoLandingAction(input: {
  idTokenAdmin: string;
  contenido: unknown;
}): Promise<ResultadoLanding> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  const validacion = validarContenidoLanding(input.contenido);
  if (!validacion.ok) return validacion;
  const contenido = validacion.valor;

  try {
    if (!(await imagenesExisten([contenido.portada.imagen]))) {
      return { ok: false, error: "La foto de la portada no se encontró. Súbela de nuevo." };
    }
    await asegurarInicializada();
    const anterior = (await documentoContenido().get()).data()?.contenido as ContenidoLanding;

    await documentoContenido().set({ contenido, fechaActualizacion: FieldValue.serverTimestamp() });
    await borrarImagenes(imagenesDescartadas([anterior.portada.imagen], [contenido.portada.imagen]));
    publicarCambios();
    return { ok: true };
  } catch (error) {
    console.error("No se pudo guardar el contenido de la Landing:", error);
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  }
}

export async function guardarActuacionAction(input: {
  idTokenAdmin: string;
  /** Sin id se crea una actuación nueva, al final del carrusel. */
  id?: string;
  actuacion: unknown;
}): Promise<ResultadoLanding> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  const validacion = validarActuacion(input.actuacion);
  if (!validacion.ok) return validacion;
  const datos = validacion.valor;

  try {
    if (!(await imagenesExisten(datos.imagenes))) {
      return { ok: false, error: "Alguna foto no se encontró. Vuelve a subirla." };
    }
    await asegurarInicializada();

    if (input.id) {
      const referencia = coleccionActuaciones().doc(input.id);
      const existente = await referencia.get();
      if (!existente.exists) return { ok: false, error: "La actuación ya no existe." };
      const anteriores = (existente.data()!.imagenes ?? []) as ImagenLanding[];

      await referencia.update({ ...datos, fechaActualizacion: FieldValue.serverTimestamp() });
      await borrarImagenes(imagenesDescartadas(anteriores, datos.imagenes));
    } else {
      const ultima = await coleccionActuaciones().orderBy("orden", "desc").limit(1).get();
      const orden = ultima.empty ? 1 : (ultima.docs[0].data().orden as number) + 1;
      await coleccionActuaciones().add({
        ...datos,
        orden,
        fechaActualizacion: FieldValue.serverTimestamp(),
      });
    }
    publicarCambios();
    return { ok: true };
  } catch (error) {
    console.error("No se pudo guardar la actuación:", error);
    return { ok: false, error: "No se pudo guardar la actuación. Intenta de nuevo." };
  }
}

export async function eliminarActuacionAction(input: {
  idTokenAdmin: string;
  id: string;
}): Promise<ResultadoLanding> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  try {
    const referencia = coleccionActuaciones().doc(input.id);
    const existente = await referencia.get();
    if (!existente.exists) return { ok: false, error: "La actuación ya no existe." };
    const imagenes = (existente.data()!.imagenes ?? []) as ImagenLanding[];

    await referencia.delete();
    await borrarImagenes(imagenesDescartadas(imagenes, []));
    publicarCambios();
    return { ok: true };
  } catch (error) {
    console.error("No se pudo eliminar la actuación:", error);
    return { ok: false, error: "No se pudo eliminar la actuación. Intenta de nuevo." };
  }
}

/** Intercambia la posición de una actuación con la anterior (-1) o la siguiente (1). */
export async function moverActuacionAction(input: {
  idTokenAdmin: string;
  id: string;
  direccion: -1 | 1;
}): Promise<ResultadoLanding> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;
  if (input.direccion !== -1 && input.direccion !== 1) return { ok: false, error: "Dirección inválida." };

  try {
    const { actuaciones } = await leerLanding();
    const indice = actuaciones.findIndex((a) => a.id === input.id);
    const vecina = actuaciones[indice + input.direccion];
    if (indice === -1 || !vecina) return { ok: true };

    // Se renumeran todas para corregir órdenes repetidos que pudieran existir.
    const nuevoOrden = actuaciones.map((a) => a.id);
    [nuevoOrden[indice], nuevoOrden[indice + input.direccion]] = [vecina.id, input.id];
    const lote = dbAdmin.batch();
    nuevoOrden.forEach((id, i) => lote.update(coleccionActuaciones().doc(id), { orden: i + 1 }));
    await lote.commit();
    publicarCambios();
    return { ok: true };
  } catch (error) {
    console.error("No se pudo reordenar:", error);
    return { ok: false, error: "No se pudo cambiar el orden. Intenta de nuevo." };
  }
}

/* ------------------------------------------------------------------ */
/* Preguntas frecuentes                                                 */
/* ------------------------------------------------------------------ */

export async function guardarPreguntaAction(input: {
  idTokenAdmin: string;
  /** Sin id se crea una pregunta nueva, al final de su categoría. */
  id?: string;
  pregunta: unknown;
}): Promise<ResultadoLanding> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  const validacion = validarPregunta(input.pregunta);
  if (!validacion.ok) return validacion;
  const datos = validacion.valor;

  try {
    await asegurarPreguntasInicializadas();

    if (input.id) {
      const referencia = coleccionPreguntas().doc(String(input.id));
      if (!(await referencia.get()).exists) return { ok: false, error: "La pregunta ya no existe." };
      await referencia.update({ ...datos, fechaActualizacion: FieldValue.serverTimestamp() });
    } else {
      const existentes = await leerPreguntas();
      if (existentes.length >= LIMITES_PREGUNTAS.maximoPreguntas) {
        return { ok: false, error: `Se admiten hasta ${LIMITES_PREGUNTAS.maximoPreguntas} preguntas.` };
      }
      // Una pregunta nueva va al final de su categoría; si la categoría es
      // nueva, al final de la sección. Se renumeran todas para dejarle espacio.
      const ultimaDeCategoria = existentes.map((p) => p.categoria).lastIndexOf(datos.categoria);
      const posicion = ultimaDeCategoria === -1 ? existentes.length : ultimaDeCategoria + 1;
      const nueva = coleccionPreguntas().doc();
      const ordenados = [...existentes.map((p) => p.id)];
      ordenados.splice(posicion, 0, nueva.id);

      const lote = dbAdmin.batch();
      ordenados.forEach((id, i) => {
        if (id === nueva.id) {
          lote.set(nueva, { ...datos, orden: i + 1, fechaActualizacion: FieldValue.serverTimestamp() });
        } else {
          lote.update(coleccionPreguntas().doc(id), { orden: i + 1 });
        }
      });
      await lote.commit();
    }
    publicarCambios();
    return { ok: true };
  } catch (error) {
    console.error("No se pudo guardar la pregunta:", error);
    return { ok: false, error: "No se pudo guardar la pregunta. Intenta de nuevo." };
  }
}

export async function eliminarPreguntaAction(input: {
  idTokenAdmin: string;
  id: string;
}): Promise<ResultadoLanding> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  try {
    const referencia = coleccionPreguntas().doc(String(input.id));
    if (!(await referencia.get()).exists) return { ok: false, error: "La pregunta ya no existe." };
    await referencia.delete();
    publicarCambios();
    return { ok: true };
  } catch (error) {
    console.error("No se pudo eliminar la pregunta:", error);
    return { ok: false, error: "No se pudo eliminar la pregunta. Intenta de nuevo." };
  }
}

/**
 * Intercambia una pregunta con la anterior (-1) o la siguiente (1) de su
 * misma categoría. No cruza categorías: así el orden de los grupos no cambia.
 */
export async function moverPreguntaAction(input: {
  idTokenAdmin: string;
  id: string;
  direccion: -1 | 1;
}): Promise<ResultadoLanding> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return verificacion;
  if (input.direccion !== -1 && input.direccion !== 1) return { ok: false, error: "Dirección inválida." };

  try {
    const preguntas = await leerPreguntas();
    const actual = preguntas.find((p) => p.id === input.id);
    if (!actual) return { ok: false, error: "La pregunta ya no existe." };
    const misma = preguntas.filter((p) => p.categoria === actual.categoria);
    const vecina = misma[misma.indexOf(actual) + input.direccion];
    if (!vecina) return { ok: true };

    // Se renumeran todas para corregir órdenes repetidos que pudieran existir.
    const nuevoOrden = preguntas.map((p) => p.id);
    const a = nuevoOrden.indexOf(actual.id);
    const b = nuevoOrden.indexOf(vecina.id);
    [nuevoOrden[a], nuevoOrden[b]] = [vecina.id, actual.id];
    const lote = dbAdmin.batch();
    nuevoOrden.forEach((id, i) => lote.update(coleccionPreguntas().doc(id), { orden: i + 1 }));
    await lote.commit();
    publicarCambios();
    return { ok: true };
  } catch (error) {
    console.error("No se pudo reordenar la pregunta:", error);
    return { ok: false, error: "No se pudo cambiar el orden. Intenta de nuevo." };
  }
}
