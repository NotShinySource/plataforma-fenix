"use server";

import { randomInt } from "crypto";
import { FieldValue, type WithFieldValue } from "firebase-admin/firestore";
import { authAdmin, dbAdmin } from "@/lib/firebase/admin";
import { emailSinteticoDesdeRut, rutEsValido } from "@/lib/auth/rut";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import type { Usuario } from "@/types";

export type RolCreable = "alumno" | "profesor";

export interface CrearUsuarioInput {
  nombres: string;
  apellidos: string;
  rut: string;
  rol: RolCreable;
}

export interface CrearUsuarioResultado {
  ok: boolean;
  error?: string;
  email?: string;
  password?: string;
}

function esErrorConCodigo(error: unknown, codigo: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === codigo
  );
}

const LONGITUD_MAXIMA_NOMBRE = 100;

const ALFABETO_PASSWORD =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generarPassword(): string {
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += ALFABETO_PASSWORD[randomInt(ALFABETO_PASSWORD.length)];
  }
  return password;
}

/**
 * Crea un usuario (Auth + custom claim de rol + doc en usuarios/{uid}). Solo
 * permite 'alumno' o 'profesor' — nunca 'administrador' desde este formulario
 * (el primer Admin se crea aparte, vía script con el Admin SDK).
 */
export async function crearUsuarioAction(
  input: CrearUsuarioInput
): Promise<CrearUsuarioResultado> {
  const nombres = input.nombres.trim();
  const apellidos = input.apellidos.trim();
  const rut = input.rut.trim();
  const rol = input.rol;

  if (!nombres || !apellidos || !rut) {
    return { ok: false, error: "Todos los campos son obligatorios." };
  }
  if (nombres.length > LONGITUD_MAXIMA_NOMBRE || apellidos.length > LONGITUD_MAXIMA_NOMBRE) {
    return {
      ok: false,
      error: `Nombres y apellidos no pueden superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`,
    };
  }
  if (rol !== "alumno" && rol !== "profesor") {
    return { ok: false, error: "Rol inválido." };
  }
  // Revalidado en el servidor a propósito: el formulario ya lo valida, pero
  // un Server Action es un endpoint público invocable sin pasar por la UI.
  if (!rutEsValido(rut)) {
    return {
      ok: false,
      error: "El RUT ingresado no es válido (dígito verificador incorrecto).",
    };
  }

  const email = emailSinteticoDesdeRut(rut);
  const password = generarPassword();

  try {
    const usuarioCreado = await authAdmin.createUser({
      email,
      password,
      displayName: `${nombres} ${apellidos}`,
    });

    await authAdmin.setCustomUserClaims(usuarioCreado.uid, { rol });

    const usuario: WithFieldValue<Usuario> = {
      rut,
      nombres,
      apellidos,
      email,
      rol,
      activo: true,
      fechaNacimiento: new Date("2000-01-01"),
      fechaCreacion: FieldValue.serverTimestamp(),
    };

    await dbAdmin.collection("usuarios").doc(usuarioCreado.uid).set(usuario);

    return { ok: true, email, password };
  } catch (error) {
    if (esErrorConCodigo(error, "auth/email-already-exists")) {
      return { ok: false, error: "Ya existe un usuario registrado con ese RUT." };
    }
    console.error("Error creando usuario desde Admin:", error);
    return { ok: false, error: "No se pudo crear el usuario. Intenta de nuevo." };
  }
}

export interface EditarUsuarioInput {
  uid: string;
  nombres: string;
  apellidos: string;
  idTokenAdmin: string;
}

export interface EditarUsuarioResultado {
  ok: boolean;
  error?: string;
}

/**
 * Edita nombres/apellidos de un usuario existente. RUT y rol no son
 * editables desde este formulario a propósito: el RUT determina el correo
 * sintético (decisión 4.2.8) y cambiarlo requeriría recrear la cuenta de
 * Auth; el rol se cambia, si acaso, recreando el usuario, no editándolo.
 */
export async function editarUsuarioAction(
  input: EditarUsuarioInput
): Promise<EditarUsuarioResultado> {
  const nombres = input.nombres.trim();
  const apellidos = input.apellidos.trim();
  const { uid, idTokenAdmin } = input;

  if (!uid || !nombres || !apellidos) {
    return { ok: false, error: "Todos los campos son obligatorios." };
  }
  if (nombres.length > LONGITUD_MAXIMA_NOMBRE || apellidos.length > LONGITUD_MAXIMA_NOMBRE) {
    return {
      ok: false,
      error: `Nombres y apellidos no pueden superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`,
    };
  }

  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  try {
    const usuarioRef = dbAdmin.collection("usuarios").doc(uid);
    const usuarioDoc = await usuarioRef.get();
    if (!usuarioDoc.exists) {
      return { ok: false, error: "El usuario ya no existe." };
    }

    await Promise.all([
      usuarioRef.update({ nombres, apellidos }),
      authAdmin.updateUser(uid, { displayName: `${nombres} ${apellidos}` }),
    ]);

    return { ok: true };
  } catch (error) {
    if (esErrorConCodigo(error, "auth/user-not-found")) {
      return { ok: false, error: "El usuario ya no existe." };
    }
    console.error("Error editando usuario desde Admin:", error);
    return { ok: false, error: "No se pudo editar el usuario. Intenta de nuevo." };
  }
}

export interface EliminarUsuarioInput {
  uid: string;
  /** ID token del administrador que ejecuta la acción (ver nota abajo). */
  idTokenAdmin: string;
}

export interface EliminarUsuarioResultado {
  ok: boolean;
  error?: string;
}

/**
 * Elimina un usuario: cuenta de Auth, custom claims (se van con la cuenta),
 * doc en usuarios/{uid} y sus membresías en miembros_elenco donde aparezca
 * como usuarioId. NO borra asistencias ni archivos — quedan como registro
 * histórico (pedido explícito).
 *
 * Los Server Actions son endpoints públicos y la protección de rutas hoy es
 * solo del lado del cliente (proxy.ts real queda pendiente) — por eso esta
 * acción reverifica en el servidor, con el Admin
 * SDK, que quien la invoca sea realmente un administrador, en vez de confiar
 * en que solo se llega aquí desde la pantalla de Admin.
 */
export async function eliminarUsuarioAction(
  input: EliminarUsuarioInput
): Promise<EliminarUsuarioResultado> {
  const { uid, idTokenAdmin } = input;

  if (!uid || !idTokenAdmin) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  // Guard explícito e independiente contra la auto-eliminación: aunque ya
  // quedaría cubierto indirectamente (todo administrador cae en el bloqueo
  // de abajo), se verifica a propósito para que no sea un efecto colateral.
  if (verificacion.uid === uid) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta." };
  }

  // Misma fuente de verdad que se usó para verificar a quien llama (custom
  // claim vía Admin SDK, no el documento de Firestore, que podría estar
  // desactualizado respecto al claim real del token del usuario objetivo).
  let usuarioObjetivo;
  try {
    usuarioObjetivo = await authAdmin.getUser(uid);
  } catch {
    return { ok: false, error: "El usuario ya no existe." };
  }
  if (usuarioObjetivo.customClaims?.rol === "administrador") {
    return { ok: false, error: "No se puede eliminar a un administrador." };
  }

  try {
    // Revocar antes de borrar: una vez borrada la cuenta, revokeRefreshTokens
    // fallaría con auth/user-not-found.
    await authAdmin.revokeRefreshTokens(uid);
    await authAdmin.deleteUser(uid);

    const membresiasSnap = await dbAdmin
      .collection("miembros_elenco")
      .where("usuarioId", "==", uid)
      .get();

    const batch = dbAdmin.batch();
    batch.delete(dbAdmin.collection("usuarios").doc(uid));
    membresiasSnap.docs.forEach((membresiaDoc) => batch.delete(membresiaDoc.ref));
    await batch.commit();

    return { ok: true };
  } catch (error) {
    if (esErrorConCodigo(error, "auth/user-not-found")) {
      return { ok: false, error: "El usuario ya no existe." };
    }
    console.error("Error eliminando usuario desde Admin:", error);
    return { ok: false, error: "No se pudo eliminar el usuario. Intenta de nuevo." };
  }
}
