import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import type { ImagenLanding } from "@/types";

/*
 * Solo las imágenes se manejan desde el navegador: el contenido de la Landing
 * se lee y se guarda con Server Actions. storage.rules deja subir a landing/
 * únicamente al Administrador, con formato y tamaño válidos.
 */

/** Nombre seguro para la ruta: sin espacios, tildes ni símbolos. */
function nombreSeguro(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .slice(-80);
}

export async function subirImagenLanding(
  archivo: File,
  carpeta: "portada" | "actuaciones"
): Promise<ImagenLanding> {
  const ruta = `landing/${carpeta}/${Date.now()}_${nombreSeguro(archivo.name)}`;
  const referencia = ref(storage, ruta);
  await uploadBytes(referencia, archivo, { contentType: archivo.type });
  return { ruta, url: await getDownloadURL(referencia) };
}

/**
 * Borra una imagen recién subida que al final no se guardó (por ejemplo, si
 * se cancela el formulario). Las imágenes ya guardadas las borra el servidor.
 */
export async function descartarImagenSubida(imagen: ImagenLanding): Promise<void> {
  if (!imagen.ruta) return;
  try {
    await deleteObject(ref(storage, imagen.ruta));
  } catch {
    // Si no se pudo borrar, solo queda un archivo sin uso en el bucket.
  }
}
