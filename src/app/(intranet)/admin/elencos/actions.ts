"use server";

import { FieldValue, type WithFieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase/admin";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import {
  DISCIPLINA_ELENCO,
  TIPOS_ELENCO,
  type CargoDocente,
  type Elenco,
  type MiembroElenco,
  type RolEnElenco,
  type TipoElenco,
} from "@/types";

const LONGITUD_MAXIMA_NOMBRE = 100;
const LONGITUD_MAXIMA_DESCRIPCION = 500;

export interface CrearElencoInput {
  nombre: string;
  tipoElenco: TipoElenco;
  descripcion: string;
  idTokenAdmin: string;
}

export interface CrearElencoResultado {
  ok: boolean;
  error?: string;
  elencoId?: string;
}

/**
 * Crea un elenco (panel de Admin). `disciplina` queda
 * fija en "musica" (único alcance real de la institución hoy, ver
 * DISCIPLINA_ELENCO) — ya no se pide en el formulario. `docenteResponsableId`
 * queda "" hasta que se asigne un profesor con cargo "titular" desde
 * agregarMiembroAction, que lo completa automáticamente.
 */
export async function crearElencoAction(
  input: CrearElencoInput
): Promise<CrearElencoResultado> {
  const nombre = input.nombre.trim();
  const descripcion = input.descripcion.trim();
  const tipoElenco = input.tipoElenco;

  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  if (!nombre) {
    return { ok: false, error: "El nombre del elenco es obligatorio." };
  }
  if (nombre.length > LONGITUD_MAXIMA_NOMBRE) {
    return {
      ok: false,
      error: `El nombre no puede superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`,
    };
  }
  if (!TIPOS_ELENCO.includes(tipoElenco)) {
    return { ok: false, error: "Tipo de elenco inválido." };
  }
  if (descripcion.length > LONGITUD_MAXIMA_DESCRIPCION) {
    return {
      ok: false,
      error: `La descripción no puede superar los ${LONGITUD_MAXIMA_DESCRIPCION} caracteres.`,
    };
  }

  try {
    // Sin índice/constraint de unicidad en Firestore para esto — se compara
    // en memoria contra todos los elencos (mismo criterio pragmático que
    // contarMiembrosPorElenco). No es 100% atómico ante dos creaciones
    // simultáneas con el mismo nombre, pero el Admin liviano no opera así.
    const elencosSnap = await dbAdmin.collection("elencos").get();
    const nombreNormalizado = nombre.toLowerCase();
    const yaExiste = elencosSnap.docs.some(
      (elencoDoc) =>
        String(elencoDoc.data().nombre ?? "").trim().toLowerCase() === nombreNormalizado
    );
    if (yaExiste) {
      return { ok: false, error: "Ya existe un elenco con ese nombre." };
    }

    const elenco: WithFieldValue<Elenco> = {
      nombre,
      disciplina: DISCIPLINA_ELENCO,
      tipoElenco,
      descripcion,
      docenteResponsableId: "",
      activo: true,
      fechaCreacion: FieldValue.serverTimestamp(),
    };

    const elencoRef = await dbAdmin.collection("elencos").add(elenco);
    return { ok: true, elencoId: elencoRef.id };
  } catch (error) {
    console.error("Error creando elenco desde Admin:", error);
    return { ok: false, error: "No se pudo crear el elenco. Intenta de nuevo." };
  }
}

export interface AgregarMiembroInput {
  elencoId: string;
  usuarioId: string;
  rol: RolEnElenco;
  /** Obligatorio cuando rol === "profesor", ignorado si rol === "alumno". */
  cargoDocente?: CargoDocente;
  idTokenAdmin: string;
}

export interface AgregarMiembroResultado {
  ok: boolean;
  error?: string;
}

/**
 * Agrega un usuario existente a un elenco: crea miembros_elenco/{elencoId}_{usuarioId}
 * (ID determinístico, decisión 4.2.2). Si es profesor con cargo "titular",
 * también actualiza elencos/{elencoId}.docenteResponsableId.
 */
export async function agregarMiembroAction(
  input: AgregarMiembroInput
): Promise<AgregarMiembroResultado> {
  const { elencoId, usuarioId, rol, cargoDocente, idTokenAdmin } = input;

  if (!elencoId || !usuarioId) {
    return { ok: false, error: "Solicitud inválida." };
  }
  if (rol !== "alumno" && rol !== "profesor") {
    return { ok: false, error: "Rol inválido." };
  }
  // cargoDocente solo tiene sentido para profesores — se rechaza
  // explícitamente en vez de ignorarlo en silencio si llega para un alumno.
  if (rol === "alumno" && cargoDocente !== undefined) {
    return { ok: false, error: "cargoDocente solo aplica a profesores." };
  }
  if (rol === "profesor" && cargoDocente !== "titular" && cargoDocente !== "asistente") {
    return { ok: false, error: "Selecciona el cargo del profesor (titular o asistente)." };
  }

  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  const elencoRef = dbAdmin.collection("elencos").doc(elencoId);
  const usuarioRef = dbAdmin.collection("usuarios").doc(usuarioId);
  const membresiaRef = dbAdmin.collection("miembros_elenco").doc(`${elencoId}_${usuarioId}`);

  const [elencoDoc, usuarioDoc, membresiaDoc] = await Promise.all([
    elencoRef.get(),
    usuarioRef.get(),
    membresiaRef.get(),
  ]);

  if (!elencoDoc.exists) {
    return { ok: false, error: "El elenco no existe." };
  }
  if (!usuarioDoc.exists || usuarioDoc.data()?.rol !== rol) {
    return { ok: false, error: "El usuario no existe o no tiene el rol esperado." };
  }
  if (membresiaDoc.exists && membresiaDoc.data()?.activo === true) {
    return { ok: false, error: "El usuario ya es miembro de este elenco." };
  }

  try {
    const membresia: WithFieldValue<MiembroElenco> = {
      elencoId,
      usuarioId,
      rolEnElenco: rol,
      ...(rol === "profesor" ? { cargoDocente: cargoDocente! } : {}),
      fechaIngreso: FieldValue.serverTimestamp(),
      activo: true,
    };

    const batch = dbAdmin.batch();
    batch.set(membresiaRef, membresia);
    if (rol === "profesor" && cargoDocente === "titular") {
      batch.update(elencoRef, { docenteResponsableId: usuarioId });
    }
    await batch.commit();

    return { ok: true };
  } catch (error) {
    console.error("Error agregando miembro al elenco desde Admin:", error);
    return { ok: false, error: "No se pudo agregar al usuario. Intenta de nuevo." };
  }
}

export interface QuitarMiembroInput {
  elencoId: string;
  usuarioId: string;
  idTokenAdmin: string;
}

export interface QuitarMiembroResultado {
  ok: boolean;
  error?: string;
}

/**
 * Quita a un miembro del elenco: borra solo la membresía, nunca al usuario
 * (pedido explícito). Si era el profesor titular, limpia
 * docenteResponsableId de vuelta a "".
 */
export async function quitarMiembroAction(
  input: QuitarMiembroInput
): Promise<QuitarMiembroResultado> {
  const { elencoId, usuarioId, idTokenAdmin } = input;

  if (!elencoId || !usuarioId) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  const elencoRef = dbAdmin.collection("elencos").doc(elencoId);
  const membresiaRef = dbAdmin.collection("miembros_elenco").doc(`${elencoId}_${usuarioId}`);

  const [elencoDoc, membresiaDoc] = await Promise.all([elencoRef.get(), membresiaRef.get()]);

  if (!membresiaDoc.exists) {
    return { ok: false, error: "Esa membresía ya no existe." };
  }

  try {
    const batch = dbAdmin.batch();
    batch.delete(membresiaRef);
    if (elencoDoc.exists && elencoDoc.data()?.docenteResponsableId === usuarioId) {
      batch.update(elencoRef, { docenteResponsableId: "" });
    }
    await batch.commit();

    return { ok: true };
  } catch (error) {
    console.error("Error quitando miembro del elenco desde Admin:", error);
    return { ok: false, error: "No se pudo quitar al usuario. Intenta de nuevo." };
  }
}

export interface EliminarElencoInput {
  elencoId: string;
  idTokenAdmin: string;
}

export interface EliminarElencoResultado {
  ok: boolean;
  error?: string;
}

/**
 * Elimina el documento del elenco. Solo permitido si no tiene miembros
 * activos (el llamador ya lo bloquea en la UI, pero se revalida aquí porque
 * el Server Action es un endpoint público). No toca archivos, asistencias ni
 * avisos que referencien este elencoId — quedan como registro histórico,
 * mismo criterio que eliminarUsuarioAction.
 */
export async function eliminarElencoAction(
  input: EliminarElencoInput
): Promise<EliminarElencoResultado> {
  const { elencoId, idTokenAdmin } = input;

  if (!elencoId) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  const elencoRef = dbAdmin.collection("elencos").doc(elencoId);
  const elencoDoc = await elencoRef.get();
  if (!elencoDoc.exists) {
    return { ok: false, error: "El elenco ya no existe." };
  }

  const miembrosActivosSnap = await dbAdmin
    .collection("miembros_elenco")
    .where("elencoId", "==", elencoId)
    .where("activo", "==", true)
    .get();

  if (!miembrosActivosSnap.empty) {
    return {
      ok: false,
      error: "Este elenco tiene miembros activos. Quita a todos los miembros antes de eliminarlo.",
    };
  }

  try {
    await elencoRef.delete();
    return { ok: true };
  } catch (error) {
    console.error("Error eliminando elenco desde Admin:", error);
    return { ok: false, error: "No se pudo eliminar el elenco. Intenta de nuevo." };
  }
}
