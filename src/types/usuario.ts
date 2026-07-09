export type RolUsuario = "alumno" | "profesor" | "administrador";

/** El ID del documento es el UID de Firebase Auth (decisión 4.2.5), no un campo propio. */
export interface Usuario {
  rut: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fechaNacimiento: Date;
  /** Se escribe con serverTimestamp()/FieldValue.serverTimestamp() (decisión 4.2.9), nunca con Date del cliente. */
  fechaCreacion: Date;
}
