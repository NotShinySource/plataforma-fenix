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

/** Forma en que se guarda en Firestore: cada dato cifrado con AES-256-GCM. */
export interface DatosPrivadosCifrados {
  rutCifrado: string;
  emailCifrado?: string;
  emailApoderadoCifrado?: string;
  fechaNacimientoCifrada: string;
  /** Se escribe con FieldValue.serverTimestamp(), nunca con Date del cliente. */
  fechaActualizacion: Date;
}
