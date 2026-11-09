export type RolUsuario = "alumno" | "profesor" | "administrador";

/**
 * "pendiente": la cuenta existe pero el usuario todavía no creó su contraseña
 * (lo hace desde el enlace de activación). "activada": ya la creó.
 */
export type EstadoActivacion = "pendiente" | "activada";

/**
 * El ID del documento es el UID de Firebase Auth (decisión 4.2.5), no un campo propio.
 * RUT, correos y fecha de nacimiento NO están aquí: viven cifrados en
 * `datos_privados/{uid}` (ver src/types/datos-privados.ts), porque esta
 * colección la puede leer cualquier usuario con sesión.
 */
export interface Usuario {
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
  /**
   * false cuando la cuenta egresó (o el docente se dio de baja): no puede
   * ingresar y no aparece en los elencos. Se puede reactivar.
   */
  activo: boolean;
  /** Cuándo egresó. Pasados 12 meses, la cuenta puede eliminarse (ver src/lib/egreso.ts). */
  fechaEgreso?: Date;
  estadoActivacion: EstadoActivacion;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp() (decisión 4.2.9), nunca con Date del cliente. */
  fechaCreacion: Date;
}
