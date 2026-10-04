import type { Usuario } from "./usuario";

/**
 * Datos personales sensibles de un usuario, ya descifrados. Se guardan en
 * `datos_privados/{uid}` (mismo uid que `usuarios/{uid}`), cifrados campo por
 * campo, y solo se leen y escriben desde el servidor: las reglas de Firestore
 * bloquean todo acceso desde el navegador.
 */
export interface DatosPrivados {
  rut: string;
  /** Correo propio: del estudiante (opcional) o del profesor/administrador. */
  email?: string;
  /** Solo alumnos: correo del apoderado (obligatorio para ellos). */
  emailApoderado?: string;
  /**
   * Formato YYYY-MM-DD. Excepción a la regla de usar `Date` en los tipos de
   * dominio: es una fecha de calendario sin hora, y como texto no sufre
   * corrimientos por zona horaria al cifrarla y descifrarla.
   */
  fechaNacimiento: string;
}

/**
 * Fila de los listados del panel de Administración. El servidor NO envía el
 * RUT ni los correos completos: solo versiones enmascaradas, suficientes
 * para reconocer a la persona. Los datos completos se piden de un usuario a
 * la vez (obtenerDatosPrivadosAction).
 */
export type UsuarioAdmin = Usuario & {
  id: string;
  /** Por ejemplo "••.•••.678-5". `null` si la cuenta no tiene datos privados. */
  rutEnmascarado: string | null;
  /** Correo al que llegan los enlaces (apoderado en alumnos), por ejemplo "ap•••••@gmail.com". */
  correoEnmascarado: string | null;
  tieneDatosPrivados: boolean;
};

/** Forma en que se guarda en Firestore: cada dato cifrado con AES-256-GCM. */
export interface DatosPrivadosCifrados {
  rutCifrado: string;
  emailCifrado?: string;
  emailApoderadoCifrado?: string;
  fechaNacimientoCifrada: string;
  /** Se escribe con FieldValue.serverTimestamp(), nunca con Date del cliente. */
  fechaActualizacion: Date;
}
