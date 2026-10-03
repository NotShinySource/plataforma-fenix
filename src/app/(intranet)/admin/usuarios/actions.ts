"use server";

import { randomBytes } from "crypto";
import { FieldValue, type WithFieldValue } from "firebase-admin/firestore";
import { authAdmin, dbAdmin } from "@/lib/firebase/admin";
import { timestampADate } from "@/lib/firebase/converters";
import { rutEsValido } from "@/lib/auth/rut";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import { formatearRutInput } from "@/lib/format";
import { identificadorDesdeRut } from "@/lib/seguridad/cifrado";
import {
  cifrarDatosPrivados,
  descifrarDatosPrivados,
  type DatosPrivadosParaGuardar,
} from "@/lib/seguridad/datos-privados";
import { esEmailValido, esFechaNacimientoValida, normalizarEmail } from "@/lib/validacion";
import type {
  DatosPrivados,
  RolUsuario,
  Usuario,
  UsuarioConDatosPrivados,
} from "@/types";

export type RolCreable = "alumno" | "profesor";

const LONGITUD_MAXIMA_NOMBRE = 100;

function esErrorConCodigo(error: unknown, codigo: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === codigo
  );
}

interface DatosPersonalesInput {
  fechaNacimiento: string;
  email?: string;
  emailApoderado?: string;
}

type ResultadoValidacion =
  | { ok: true; datos: Omit<DatosPrivados, "rut"> }
  | { ok: false; error: string };

/**
 * Reglas de los datos de contacto según el rol:
 * - alumno: correo del apoderado obligatorio, correo propio opcional;
 * - profesor/administrador: correo propio obligatorio, sin apoderado.
 * Sin correo no hay a dónde enviar el enlace de activación de la cuenta.
 */
function validarDatosPersonales(rol: RolUsuario, input: DatosPersonalesInput): ResultadoValidacion {
  const fechaNacimiento = input.fechaNacimiento.trim();
  const email = normalizarEmail(input.email ?? "");
  const emailApoderado = normalizarEmail(input.emailApoderado ?? "");

  if (!esFechaNacimientoValida(fechaNacimiento)) {
    return { ok: false, error: "La fecha de nacimiento no es válida." };
  }
  if (email && !esEmailValido(email)) {
    return { ok: false, error: "El correo ingresado no es válido." };
  }
  if (emailApoderado && !esEmailValido(emailApoderado)) {
    return { ok: false, error: "El correo del apoderado no es válido." };
  }

  if (rol === "alumno") {
    if (!emailApoderado) {
      return { ok: false, error: "El correo del apoderado es obligatorio para alumnos." };
    }
  } else {
    if (!email) {
      return { ok: false, error: "El correo es obligatorio para profesores y administradores." };
    }
    if (emailApoderado) {
      return { ok: false, error: "Solo los alumnos tienen correo de apoderado." };
    }
  }

  return {
    ok: true,
    datos: {
      fechaNacimiento,
      ...(email ? { email } : {}),
      ...(emailApoderado ? { emailApoderado } : {}),
    },
  };
}

function validarNombres(nombres: string, apellidos: string): string | null {
  if (!nombres || !apellidos) return "Nombres y apellidos son obligatorios.";
  if (nombres.length > LONGITUD_MAXIMA_NOMBRE || apellidos.length > LONGITUD_MAXIMA_NOMBRE) {
    return `Nombres y apellidos no pueden superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`;
  }
  return null;
}

function documentoPrivado(datos: DatosPrivados): WithFieldValue<DatosPrivadosParaGuardar & { fechaActualizacion: Date }> {
  return { ...cifrarDatosPrivados(datos), fechaActualizacion: FieldValue.serverTimestamp() };
}

export interface CrearUsuarioInput extends DatosPersonalesInput {
  nombres: string;
  apellidos: string;
  rut: string;
  rol: RolCreable;
  idTokenAdmin: string;
}

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

/**
 * Crea un usuario alumno o profesor (nunca administrador: el primero se crea
 * vía script). La cuenta de Firebase Auth usa el identificador derivado del
 * RUT, sin nombre, con una contraseña aleatoria que nadie conoce: queda
 * "pendiente" hasta que el usuario cree la suya desde el enlace de
 * activación. RUT, correos y fecha de nacimiento se guardan cifrados en
 * datos_privados/{uid}.
 */
export async function crearUsuarioAction(input: CrearUsuarioInput): Promise<ResultadoAccion> {
  // Primero quién llama: un Server Action es un endpoint público.
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  const nombres = input.nombres.trim();
  const apellidos = input.apellidos.trim();
  const rol = input.rol;

  const errorNombres = validarNombres(nombres, apellidos);
  if (errorNombres) return { ok: false, error: errorNombres };
  if (rol !== "alumno" && rol !== "profesor") {
    return { ok: false, error: "Rol inválido." };
  }
  if (!rutEsValido(input.rut)) {
    return { ok: false, error: "El RUT ingresado no es válido (dígito verificador incorrecto)." };
  }
  const validacion = validarDatosPersonales(rol, input);
  if (!validacion.ok) return { ok: false, error: validacion.error };

  const rut = formatearRutInput(input.rut);

  let uid: string;
  try {
    const usuarioCreado = await authAdmin.createUser({
      email: identificadorDesdeRut(rut),
      password: randomBytes(32).toString("base64url"),
    });
    uid = usuarioCreado.uid;
  } catch (error) {
    if (esErrorConCodigo(error, "auth/email-already-exists")) {
      return { ok: false, error: "Ya existe un usuario registrado con ese RUT." };
    }
    console.error("Error creando la cuenta de Auth desde Admin:", error);
    return { ok: false, error: "No se pudo crear el usuario. Intenta de nuevo." };
  }

  try {
    await authAdmin.setCustomUserClaims(uid, { rol });

    const usuario: WithFieldValue<Usuario> = {
      nombres,
      apellidos,
      rol,
      activo: true,
      estadoActivacion: "pendiente",
      fechaCreacion: FieldValue.serverTimestamp(),
    };

    const batch = dbAdmin.batch();
    batch.set(dbAdmin.collection("usuarios").doc(uid), usuario);
    batch.set(
      dbAdmin.collection("datos_privados").doc(uid),
      documentoPrivado({ rut, ...validacion.datos })
    );
    await batch.commit();

    return { ok: true };
  } catch (error) {
    // Sin esto quedaría una cuenta de Auth sin documentos, que además
    // bloquearía volver a crear a esa persona ("ya existe").
    await authAdmin.deleteUser(uid).catch(() => undefined);
    console.error("Error guardando los datos del usuario desde Admin:", error);
    return { ok: false, error: "No se pudo crear el usuario. Intenta de nuevo." };
  }
}

export interface ListarUsuariosResultado extends ResultadoAccion {
  usuarios?: UsuarioConDatosPrivados[];
}

/**
 * Listado completo para el panel de Administración, con RUT y correos
 * descifrados en el servidor. Reemplaza la lectura directa desde el
 * navegador: así los RUT nunca viajan al cliente salvo para el Administrador.
 */
export async function listarUsuariosConDatosAction(
  idTokenAdmin: string
): Promise<ListarUsuariosResultado> {
  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  try {
    const [usuariosSnap, privadosSnap] = await Promise.all([
      dbAdmin.collection("usuarios").get(),
      dbAdmin.collection("datos_privados").get(),
    ]);

    const privadosPorUid = new Map(privadosSnap.docs.map((d) => [d.id, d.data()]));

    const usuarios = usuariosSnap.docs.map((usuarioDoc): UsuarioConDatosPrivados => {
      const data = usuarioDoc.data();
      const privado = privadosPorUid.get(usuarioDoc.id);

      let datos: DatosPrivados | null = null;
      if (privado) {
        try {
          datos = descifrarDatosPrivados(privado);
        } catch (error) {
          console.error(`No se pudieron descifrar los datos privados de ${usuarioDoc.id}:`, error);
        }
      }

      return {
        id: usuarioDoc.id,
        nombres: data.nombres,
        apellidos: data.apellidos,
        rol: data.rol,
        activo: data.activo,
        estadoActivacion: data.estadoActivacion ?? "pendiente",
        fechaCreacion: timestampADate(data.fechaCreacion),
        datos,
      };
    });

    return { ok: true, usuarios };
  } catch (error) {
    console.error("Error listando usuarios desde Admin:", error);
    return { ok: false, error: "No se pudo cargar la lista de usuarios." };
  }
}

export interface EditarUsuarioInput extends DatosPersonalesInput {
  uid: string;
  nombres: string;
  apellidos: string;
  idTokenAdmin: string;
}

/**
 * Edita nombres, apellidos, correos y fecha de nacimiento. El RUT no es
 * editable a propósito: define el identificador de la cuenta de Auth, y
 * cambiarlo implicaría recrearla. El rol tampoco se edita aquí.
 */
export async function editarUsuarioAction(input: EditarUsuarioInput): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  const nombres = input.nombres.trim();
  const apellidos = input.apellidos.trim();
  const { uid } = input;

  if (!uid) return { ok: false, error: "Solicitud inválida." };
  const errorNombres = validarNombres(nombres, apellidos);
  if (errorNombres) return { ok: false, error: errorNombres };

  try {
    // El rol sale del custom claim (fuente de verdad), no del documento.
    const usuarioAuth = await authAdmin.getUser(uid);
    const rol = usuarioAuth.customClaims?.rol as RolUsuario | undefined;
    if (!rol) {
      return { ok: false, error: "El usuario no tiene un rol asignado." };
    }

    const validacion = validarDatosPersonales(rol, input);
    if (!validacion.ok) return { ok: false, error: validacion.error };

    const usuarioRef = dbAdmin.collection("usuarios").doc(uid);
    const privadoRef = dbAdmin.collection("datos_privados").doc(uid);
    const [usuarioDoc, privadoDoc] = await Promise.all([usuarioRef.get(), privadoRef.get()]);

    if (!usuarioDoc.exists) {
      return { ok: false, error: "El usuario ya no existe." };
    }
    if (!privadoDoc.exists) {
      return {
        ok: false,
        error: "Este usuario no tiene datos privados registrados (cuenta antigua). Debe recrearse.",
      };
    }

    const { rut } = descifrarDatosPrivados(privadoDoc.data()!);

    const batch = dbAdmin.batch();
    batch.update(usuarioRef, { nombres, apellidos });
    // set (no merge): si se borró un correo opcional, desaparece del documento.
    batch.set(privadoRef, documentoPrivado({ rut, ...validacion.datos }));
    await batch.commit();

    // Por si es una cuenta creada antes de este cambio: los nombres ya no
    // deben quedar visibles en la consola de Firebase Authentication.
    if (usuarioAuth.displayName) {
      await authAdmin.updateUser(uid, { displayName: null });
    }

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
  /** ID token del administrador que ejecuta la acción. */
  idTokenAdmin: string;
}

/**
 * Elimina un usuario: cuenta de Auth (con sus custom claims), usuarios/{uid},
 * datos_privados/{uid}, solicitudes_acceso/{uid} y sus membresías en
 * miembros_elenco. NO borra asistencias ni archivos: quedan como registro
 * histórico (pedido explícito).
 */
export async function eliminarUsuarioAction(input: EliminarUsuarioInput): Promise<ResultadoAccion> {
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
  // claim vía Admin SDK, no el documento de Firestore).
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
    batch.delete(dbAdmin.collection("datos_privados").doc(uid));
    batch.delete(dbAdmin.collection("solicitudes_acceso").doc(uid));
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
