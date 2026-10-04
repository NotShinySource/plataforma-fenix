import { cifrar, descifrar } from "@/lib/seguridad/cifrado";
import type { DatosPrivados, DatosPrivadosCifrados } from "@/types";

/** Lo que se escribe en `datos_privados/{uid}`, sin la fecha de actualización (la pone quien escribe). */
export type DatosPrivadosParaGuardar = Omit<DatosPrivadosCifrados, "fechaActualizacion">;

/**
 * Convierte los datos legibles a su forma cifrada para guardarlos. Los campos
 * opcionales ausentes se omiten (Firestore rechaza `undefined`).
 *
 * Funciones puras, sin acceso a Firestore: las usan tanto los Server Actions
 * (con el Admin SDK de src/lib/firebase/admin.ts) como los scripts de seed
 * (con su propia instancia del Admin SDK).
 */
export function cifrarDatosPrivados(datos: DatosPrivados): DatosPrivadosParaGuardar {
  return {
    rutCifrado: cifrar(datos.rut),
    ...(datos.email ? { emailCifrado: cifrar(datos.email) } : {}),
    ...(datos.emailApoderado ? { emailApoderadoCifrado: cifrar(datos.emailApoderado) } : {}),
    fechaNacimientoCifrada: cifrar(datos.fechaNacimiento),
  };
}

/** Descifra un documento leído de `datos_privados/{uid}`. Falla si falta un campo obligatorio. */
export function descifrarDatosPrivados(documento: Partial<DatosPrivadosParaGuardar>): DatosPrivados {
  if (!documento.rutCifrado || !documento.fechaNacimientoCifrada) {
    throw new Error("Documento de datos privados incompleto.");
  }

  return {
    rut: descifrar(documento.rutCifrado),
    ...(documento.emailCifrado ? { email: descifrar(documento.emailCifrado) } : {}),
    ...(documento.emailApoderadoCifrado
      ? { emailApoderado: descifrar(documento.emailApoderadoCifrado) }
      : {}),
    fechaNacimiento: descifrar(documento.fechaNacimientoCifrada),
  };
}
