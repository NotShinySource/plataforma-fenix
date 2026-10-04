import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { limpiarRut } from "@/lib/auth/rut";

/**
 * Protección de datos personales de menores (Ley 19.628) frente a quien tenga
 * acceso a la consola de Firebase: ni Authentication ni Firestore deben
 * mostrar RUT, correos ni fechas de nacimiento legibles.
 *
 * Solo debe usarse en el servidor (Server Actions y scripts): las claves no
 * llevan prefijo NEXT_PUBLIC_, así que en el navegador no existen y las
 * funciones fallan. No importa "server-only" a propósito, para que los
 * scripts de seed (Node plano, fuera de Next.js) también puedan usarlo.
 */

const DOMINIO_IDENTIFICADOR = "fenix.local";
const VERSION_CIFRADO = "v1";
const LARGO_IV = 12;
const LARGO_TAG = 16;

function obtenerClave(nombreVariable: "FENIX_CLAVE_HMAC" | "FENIX_CLAVE_CIFRADO"): Buffer {
  const valor = process.env[nombreVariable];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombreVariable}.`);
  }
  const clave = Buffer.from(valor, "base64");
  if (clave.length !== 32) {
    throw new Error(`${nombreVariable} debe ser de 32 bytes codificados en base64.`);
  }
  return clave;
}

/**
 * Correo interno de la cuenta de Firebase Auth derivado del RUT con HMAC-SHA256.
 * Determinístico (el mismo RUT siempre da el mismo identificador, así se puede
 * iniciar sesión por RUT) pero irreversible sin la clave: en la consola de
 * Firebase no se puede leer el RUT. Se calcula igual para cualquier RUT,
 * exista o no la cuenta, así que tampoco sirve para averiguar qué RUT están
 * registrados.
 */
export function identificadorDesdeRut(rut: string): string {
  const hmac = createHmac("sha256", obtenerClave("FENIX_CLAVE_HMAC"))
    .update(limpiarRut(rut.trim()))
    .digest("hex");
  return `${hmac}@${DOMINIO_IDENTIFICADOR}`;
}

/**
 * Cifra un texto con AES-256-GCM. Formato: `v1:` + base64url(iv | tag | texto
 * cifrado). El prefijo de versión permite rotar la clave o el algoritmo más
 * adelante sin ambigüedad sobre cómo descifrar los datos antiguos.
 */
export function cifrar(texto: string): string {
  const iv = randomBytes(LARGO_IV);
  const cifrador = createCipheriv("aes-256-gcm", obtenerClave("FENIX_CLAVE_CIFRADO"), iv);
  const cifrado = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  return `${VERSION_CIFRADO}:${Buffer.concat([iv, tag, cifrado]).toString("base64url")}`;
}

/**
 * Descifra un valor producido por `cifrar`. Falla si el dato fue alterado o si
 * se usa una clave distinta: GCM verifica la integridad, no devuelve basura.
 */
export function descifrar(valor: string): string {
  const [version, contenido] = valor.split(":");
  if (version !== VERSION_CIFRADO || !contenido) {
    throw new Error("Formato de dato cifrado no reconocido.");
  }

  const datos = Buffer.from(contenido, "base64url");
  if (datos.length < LARGO_IV + LARGO_TAG) {
    throw new Error("Dato cifrado incompleto.");
  }

  const iv = datos.subarray(0, LARGO_IV);
  const tag = datos.subarray(LARGO_IV, LARGO_IV + LARGO_TAG);
  const cifrado = datos.subarray(LARGO_IV + LARGO_TAG);

  const descifrador = createDecipheriv("aes-256-gcm", obtenerClave("FENIX_CLAVE_CIFRADO"), iv);
  descifrador.setAuthTag(tag);
  try {
    return Buffer.concat([descifrador.update(cifrado), descifrador.final()]).toString("utf8");
  } catch {
    throw new Error("No se pudo descifrar: dato alterado o clave incorrecta.");
  }
}
