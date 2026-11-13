"use server";

import { FieldValue, type WithFieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase/admin";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import {
  claveComparacion,
  claveGrupoEscuela,
  nombreGrupoEscuela,
  normalizarEspacios,
  validarDatosEscuela,
  validarDatosGrupoEscuela,
  validarDatosItinerancia,
  LARGO_MAXIMO_NOMBRE_ESCUELA,
} from "@/lib/elencos";
import {
  DISCIPLINA_ELENCO,
  type CargoDocente,
  type Elenco,
  type Escuela,
  type MiembroElenco,
  type RolEnElenco,
  type TipoEscuela,
} from "@/types";

const LONGITUD_MAXIMA_DESCRIPCION = 500;

const coleccionEscuelas = () => dbAdmin.collection("escuelas");
const coleccionElencos = () => dbAdmin.collection("elencos");

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

export interface CrearElencoResultado extends ResultadoAccion {
  elencoId?: string;
}

function validarDescripcion(
  valor: unknown
): { ok: true; descripcion: string } | { ok: false; error: string } {
  const descripcion = typeof valor === "string" ? valor.trim() : "";
  if (descripcion.length > LONGITUD_MAXIMA_DESCRIPCION) {
    return {
      ok: false,
      error: `La descripción no puede superar los ${LONGITUD_MAXIMA_DESCRIPCION} caracteres.`,
    };
  }
  return { ok: true, descripcion };
}

/** Compara nombres sin importar mayúsculas, tildes ni espacios repetidos. */
function mismoNombre(a: unknown, b: string): boolean {
  return claveComparacion(String(a ?? "")) === claveComparacion(b);
}

/* ------------------------------------------------------------------ */
/* Escuelas                                                             */
/* ------------------------------------------------------------------ */

export interface CrearEscuelaInput {
  nombre: string;
  tipo: TipoEscuela;
  niveles: string[];
  idTokenAdmin: string;
}

/** Crea una escuela con sus niveles. Los niveles no se pueden cambiar después. */
export async function crearEscuelaAction(input: CrearEscuelaInput): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  const validacion = validarDatosEscuela(input);
  if (!validacion.ok) return validacion;

  try {
    // Sin restricción de unicidad en Firestore: se compara en memoria contra
    // todas las escuelas (son pocas). Un solo administrador no crea dos a la vez.
    const existentes = await coleccionEscuelas().get();
    if (existentes.docs.some((d) => mismoNombre(d.data().nombre, validacion.datos.nombre))) {
      return { ok: false, error: "Ya existe una escuela con ese nombre." };
    }

    const escuela: WithFieldValue<Escuela> = {
      ...validacion.datos,
      activo: true,
      fechaCreacion: FieldValue.serverTimestamp(),
    };
    await coleccionEscuelas().add(escuela);
    return { ok: true };
  } catch (error) {
    console.error("Error creando escuela:", error);
    return { ok: false, error: "No se pudo crear la escuela. Intenta de nuevo." };
  }
}

/**
 * Corrige el nombre de una escuela y el de todos sus grupos, que lo llevan
 * al inicio ("Coro · Niños").
 */
export async function renombrarEscuelaAction(input: {
  escuelaId: string;
  nombre: string;
  idTokenAdmin: string;
}): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  const nombre = typeof input.nombre === "string" ? normalizarEspacios(input.nombre) : "";
  if (!nombre) return { ok: false, error: "El nombre de la escuela es obligatorio." };
  if (nombre.length > LARGO_MAXIMO_NOMBRE_ESCUELA) {
    return {
      ok: false,
      error: `El nombre no puede superar los ${LARGO_MAXIMO_NOMBRE_ESCUELA} caracteres.`,
    };
  }

  try {
    const referencia = coleccionEscuelas().doc(String(input.escuelaId));
    const [escuelaDoc, todas, grupos] = await Promise.all([
      referencia.get(),
      coleccionEscuelas().get(),
      coleccionElencos().where("escuelaId", "==", String(input.escuelaId)).get(),
    ]);
    if (!escuelaDoc.exists) return { ok: false, error: "La escuela ya no existe." };

    if (todas.docs.some((d) => d.id !== escuelaDoc.id && mismoNombre(d.data().nombre, nombre))) {
      return { ok: false, error: "Ya existe una escuela con ese nombre." };
    }

    // Un lote admite 500 escrituras: una escuela no tiene tantos grupos.
    const lote = dbAdmin.batch();
    lote.update(referencia, { nombre });
    grupos.docs.forEach((grupo) => {
      const datos = grupo.data();
      lote.update(grupo.ref, {
        nombre: nombreGrupoEscuela(nombre, datos.nivel, datos.complemento),
      });
    });
    await lote.commit();
    return { ok: true };
  } catch (error) {
    console.error("Error renombrando escuela:", error);
    return { ok: false, error: "No se pudo renombrar la escuela. Intenta de nuevo." };
  }
}

/**
 * Archiva o reactiva una escuela. Solo se archiva si no le quedan grupos
 * activos: así ningún elenco en uso queda colgando de una escuela cerrada.
 */
export async function cambiarEstadoEscuelaAction(input: {
  escuelaId: string;
  activo: boolean;
  idTokenAdmin: string;
}): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };
  if (typeof input.activo !== "boolean") return { ok: false, error: "Solicitud inválida." };

  try {
    const referencia = coleccionEscuelas().doc(String(input.escuelaId));
    if (!(await referencia.get()).exists) return { ok: false, error: "La escuela ya no existe." };

    if (!input.activo) {
      const activos = await coleccionElencos()
        .where("escuelaId", "==", referencia.id)
        .where("activo", "==", true)
        .limit(1)
        .get();
      if (!activos.empty) {
        return {
          ok: false,
          error: "La escuela tiene elencos activos. Archívalos antes de archivar la escuela.",
        };
      }
    }

    await referencia.update({ activo: input.activo });
    return { ok: true };
  } catch (error) {
    console.error("Error cambiando el estado de la escuela:", error);
    return { ok: false, error: "No se pudo actualizar la escuela. Intenta de nuevo." };
  }
}

/* ------------------------------------------------------------------ */
/* Grupos: elencos de escuela e itinerancias                            */
/* ------------------------------------------------------------------ */

export interface CrearGrupoEscuelaInput {
  escuelaId: string;
  nivel: string;
  complemento?: string;
  descripcion: string;
  idTokenAdmin: string;
}

/**
 * Crea un elenco de una escuela y un nivel. El nombre se arma solo. No se
 * permite repetir escuela + nivel + complemento, tampoco con un grupo
 * archivado (en ese caso, conviene reactivarlo).
 */
export async function crearGrupoEscuelaAction(
  input: CrearGrupoEscuelaInput
): Promise<CrearElencoResultado> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  const descripcion = validarDescripcion(input.descripcion);
  if (!descripcion.ok) return descripcion;

  try {
    const escuelaDoc = await coleccionEscuelas().doc(String(input.escuelaId)).get();
    if (!escuelaDoc.exists) return { ok: false, error: "La escuela no existe." };
    const escuela = escuelaDoc.data() as Escuela;
    if (escuela.activo === false) {
      return { ok: false, error: "La escuela está archivada. Reactívala para crear elencos." };
    }

    const grupo = validarDatosGrupoEscuela(input, escuela);
    if (!grupo.ok) return grupo;
    const { nivel, complemento } = grupo.datos;

    const hermanos = await coleccionElencos().where("escuelaId", "==", escuelaDoc.id).get();
    const clave = claveGrupoEscuela(escuelaDoc.id, nivel, complemento);
    const repetido = hermanos.docs.find(
      (d) => claveGrupoEscuela(escuelaDoc.id, d.data().nivel, d.data().complemento) === clave
    );
    if (repetido) {
      return {
        ok: false,
        error:
          repetido.data().activo === false
            ? "Ese elenco ya existe y está archivado. Reactívalo en vez de crear otro."
            : "Ese elenco ya existe. Usa el complemento para distinguir otro grupo del mismo nivel.",
      };
    }

    const elenco: WithFieldValue<Elenco> = {
      nombre: nombreGrupoEscuela(escuela.nombre, nivel, complemento),
      disciplina: DISCIPLINA_ELENCO,
      tipoGrupo: "escuela",
      escuelaId: escuelaDoc.id,
      nivel,
      ...(complemento ? { complemento } : {}),
      tipoEscuela: escuela.tipo,
      descripcion: descripcion.descripcion,
      docenteResponsableId: "",
      activo: true,
      fechaCreacion: FieldValue.serverTimestamp(),
    };
    const referencia = await coleccionElencos().add(elenco);
    return { ok: true, elencoId: referencia.id };
  } catch (error) {
    console.error("Error creando elenco de escuela:", error);
    return { ok: false, error: "No se pudo crear el elenco. Intenta de nuevo." };
  }
}

export interface CrearItineranciaInput {
  nombre: string;
  fechaInicio?: string;
  fechaTermino?: string;
  descripcion: string;
  idTokenAdmin: string;
}

/** Itinerancias activas con ese nombre, sin contar `excluirId`. */
async function hayItineranciaActivaConNombre(nombre: string, excluirId?: string): Promise<boolean> {
  const activas = await coleccionElencos()
    .where("tipoGrupo", "==", "itinerancia")
    .where("activo", "==", true)
    .get();
  return activas.docs.some((d) => d.id !== excluirId && mismoNombre(d.data().nombre, nombre));
}

/**
 * Crea una itinerancia: un grupo temporal con nombre libre (por ejemplo, el
 * elenco de un musical). Sus miembros se agregan igual que en un elenco y
 * pueden venir de varios. El nombre no se repite entre las activas.
 */
export async function crearItineranciaAction(
  input: CrearItineranciaInput
): Promise<CrearElencoResultado> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };

  const datos = validarDatosItinerancia(input);
  if (!datos.ok) return datos;
  const descripcion = validarDescripcion(input.descripcion);
  if (!descripcion.ok) return descripcion;

  try {
    if (await hayItineranciaActivaConNombre(datos.datos.nombre)) {
      return { ok: false, error: "Ya hay una itinerancia activa con ese nombre." };
    }

    const elenco: WithFieldValue<Elenco> = {
      ...datos.datos,
      disciplina: DISCIPLINA_ELENCO,
      tipoGrupo: "itinerancia",
      descripcion: descripcion.descripcion,
      docenteResponsableId: "",
      activo: true,
      fechaCreacion: FieldValue.serverTimestamp(),
    };
    const referencia = await coleccionElencos().add(elenco);
    return { ok: true, elencoId: referencia.id };
  } catch (error) {
    console.error("Error creando itinerancia:", error);
    return { ok: false, error: "No se pudo crear la itinerancia. Intenta de nuevo." };
  }
}

/**
 * Archiva o reactiva un grupo. Archivado, conserva miembros, material,
 * asistencia y avisos, pero deja de aparecer en los paneles y no admite
 * clases, material, avisos ni tareas nuevos. Para reactivar un grupo de
 * escuela, su escuela tiene que estar activa.
 */
export async function cambiarEstadoElencoAction(input: {
  elencoId: string;
  activo: boolean;
  idTokenAdmin: string;
}): Promise<ResultadoAccion> {
  const verificacion = await verificarAdmin(input.idTokenAdmin);
  if (!verificacion.ok) return { ok: false, error: verificacion.error };
  if (typeof input.activo !== "boolean") return { ok: false, error: "Solicitud inválida." };

  try {
    const referencia = coleccionElencos().doc(String(input.elencoId));
    const elencoDoc = await referencia.get();
    if (!elencoDoc.exists) return { ok: false, error: "El grupo ya no existe." };
    const elenco = elencoDoc.data() as Partial<Elenco>;

    if (input.activo && elenco.escuelaId) {
      const escuela = await coleccionEscuelas().doc(elenco.escuelaId).get();
      if (escuela.exists && escuela.data()?.activo === false) {
        return { ok: false, error: "Su escuela está archivada. Reactiva primero la escuela." };
      }
    }
    if (
      input.activo &&
      elenco.tipoGrupo === "itinerancia" &&
      (await hayItineranciaActivaConNombre(String(elenco.nombre ?? ""), elencoDoc.id))
    ) {
      return { ok: false, error: "Ya hay una itinerancia activa con ese nombre." };
    }

    await referencia.update({ activo: input.activo });
    return { ok: true };
  } catch (error) {
    console.error("Error cambiando el estado del grupo:", error);
    return { ok: false, error: "No se pudo actualizar el grupo. Intenta de nuevo." };
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
 * (ID determinístico, sin duplicados posibles). Si es profesor con cargo "titular",
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
  if (elencoDoc.data()?.activo === false) {
    return { ok: false, error: "El grupo está archivado. Reactívalo para agregar miembros." };
  }
  if (!usuarioDoc.exists || usuarioDoc.data()?.rol !== rol) {
    return { ok: false, error: "El usuario no existe o no tiene el rol esperado." };
  }
  if (usuarioDoc.data()?.activo === false) {
    return { ok: false, error: "La cuenta está egresada. Reactívala antes de agregarla a un elenco." };
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
