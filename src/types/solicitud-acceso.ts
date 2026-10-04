/**
 * `solicitudes_acceso/{uid}`: contador para limitar cuántos enlaces de
 * activación o recuperación de contraseña se envían por cuenta (ventana fija
 * de una hora). Solo lo lee y escribe el servidor.
 */
export interface SolicitudAcceso {
  /** Momento en que empezó la ventana actual, según el reloj del servidor. */
  inicioVentana: Date;
  /** Solicitudes hechas dentro de la ventana actual. */
  cantidad: number;
}
