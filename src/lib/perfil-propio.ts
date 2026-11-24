import { obtenerUsuario } from "@/services/usuarios.service";
import type { ConId, Usuario } from "@/types";

/**
 * Una sola lectura del perfil por sesión, compartida por el encabezado y el
 * panel: antes cada uno pedía el mismo documento por separado.
 */
const lecturas = new Map<string, Promise<ConId<Usuario> | null>>();

export function leerPerfilPropio(uid: string): Promise<ConId<Usuario> | null> {
  let lectura = lecturas.get(uid);
  if (!lectura) {
    lectura = obtenerUsuario(uid).catch(() => {
      // Un fallo no queda guardado: la próxima pantalla lo vuelve a intentar.
      lecturas.delete(uid);
      return null;
    });
    lecturas.set(uid, lectura);
  }
  return lectura;
}

/**
 * Descarta lo leído. Se llama al cerrar sesión, para que otra cuenta en el
 * mismo navegador no vea datos ajenos.
 */
export function olvidarPerfilPropio(): void {
  lecturas.clear();
}
