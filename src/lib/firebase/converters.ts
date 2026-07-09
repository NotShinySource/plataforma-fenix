import { Timestamp as TimestampCliente } from "firebase/firestore";
import type { Timestamp as TimestampAdmin } from "firebase-admin/firestore";

/**
 * Un Timestamp de Firestore leído por el SDK de cliente o por el Admin SDK.
 * Son clases distintas (paquetes distintos) pero exponen la misma forma
 * (toDate(), seconds, nanoseconds). Por diseño, los tipos de
 * dominio en src/types/ solo conocen `Date`, nunca estas clases directamente.
 */
export type TimestampDeCualquierSdk = TimestampCliente | TimestampAdmin;

/**
 * Convierte un Timestamp de Firestore (cliente o Admin SDK, da igual cuál)
 * a Date, para poblar los tipos de dominio al leer un documento.
 */
export function timestampADate(timestamp: TimestampDeCualquierSdk): Date {
  return timestamp.toDate();
}

/**
 * Convierte un Date a Timestamp del SDK de cliente. Úsalo solo para campos
 * que representan un dato provisto por el usuario o la aplicación (p. ej.
 * `fechaNacimiento`), típicamente al construir constraints de queries
 * (`where(campo, '>=', dateATimestamp(fecha))`) — para escribir un documento
 * completo basta con asignar el `Date` directo, ambos SDKs lo serializan
 * como Timestamp automáticamente.
 *
 * Para campos de "fecha de creación" (`fechaCreacion` y análogos: fecha en
 * que se creó/registró el documento) NUNCA uses esta función — usa
 * `serverTimestamp()` (SDK cliente) o `FieldValue.serverTimestamp()` (Admin
 * SDK) al escribir, para que el valor lo defina el servidor de Firestore y
 * no el reloj de quien está escribiendo.
 */
export function dateATimestamp(fecha: Date): TimestampCliente {
  return TimestampCliente.fromDate(fecha);
}
