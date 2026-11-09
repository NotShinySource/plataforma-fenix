"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { dbAdmin, storageAdmin } from "@/lib/firebase/admin";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import { coleccionActuaciones, documentoContenido, leerLanding } from "@/lib/landing/leer";
import { ACTUACIONES_PREDETERMINADAS, CONTENIDO_PREDETERMINADO } from "@/lib/landing/predeterminado";
import {
  imagenesDescartadas,
  validarActuacion,
  validarContenidoLanding,
} from "@/lib/landing/validacion";
import type { ActuacionLanding, ConId, ContenidoLanding, ImagenLanding } from "@/types";

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

/** La Landing pública se arma con caché: esto hace que el cambio se vea de inmediato. */
function publicarCambios() {
  revalidatePath("/");
}

export type LandingAdminResultado =
  | { ok: true; contenido: ContenidoLanding; actuaciones: ConId<ActuacionLanding>[] }
  | { ok: false; error: string };

export async function obtenerLandingAdminAction(idTokenAdmin: string): Promise<LandingAdminResultado> {
  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) return verificacion;

  try {
    await asegurarInicializada();
    const { contenido, actuaciones } = await leerLanding();
    return { ok: true, contenido, actuaciones };
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
