import { useSyncExternalStore } from "react";

const sinSuscripcion = () => () => {};

/**
 * false en el HTML que entrega el servidor y true en cuanto React toma el
 * control de la página en el navegador.
 *
 * Sirve para desactivar el envío de un formulario mientras el JavaScript
 * todavía no carga: en ese momento el navegador lo enviaría como un
 * formulario HTML común, sin pasar por nuestro código.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false
  );
}
