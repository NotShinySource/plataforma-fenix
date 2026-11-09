import type { Timestamp as TimestampCliente } from "firebase/firestore";
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
