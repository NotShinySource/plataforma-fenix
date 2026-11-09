import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

/**
 * Escenario común de las pruebas de reglas:
 * - elenco e1: profesor "profe", alumno "alumno" y alumno "inactivo" (membresía desactivada);
 * - elenco e2: profesor "profe2";
 * - "ajeno": alumno sin elencos; "admin": la Dirección.
 */
export const USUARIOS = {
  admin: { uid: "admin", rol: "administrador" },
  profe: { uid: "profe", rol: "profesor" },
  profe2: { uid: "profe2", rol: "profesor" },
  alumno: { uid: "alumno", rol: "alumno" },
  inactivo: { uid: "inactivo", rol: "alumno" },
  ajeno: { uid: "ajeno", rol: "alumno" },
} as const;

export type NombreUsuario = keyof typeof USUARIOS;

/** Proyecto "demo-": el emulador no intenta conectarse a ningún proyecto real. */
const PROYECTO = process.env.GCLOUD_PROJECT ?? "demo-fenix";

export async function crearEntorno(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROYECTO,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
}

export function como(entorno: RulesTestEnvironment, nombre: NombreUsuario): RulesTestContext {
  const { uid, rol } = USUARIOS[nombre];
  return entorno.authenticatedContext(uid, { rol });
}

function membresia(elencoId: string, usuarioId: string, rolEnElenco: string, activo = true) {
  return { elencoId, usuarioId, rolEnElenco, activo, fechaIngreso: new Date() };
}

/** Carga los datos del escenario sin pasar por las reglas. */
export async function cargarEscenario(entorno: RulesTestEnvironment): Promise<void> {
  await entorno.withSecurityRulesDisabled(async (contexto) => {
    const db = contexto.firestore();
    const escrituras: Array<[string, Record<string, unknown>]> = [
      ["usuarios/alumno", { nombres: "Ana", apellidos: "Rojas", rol: "alumno" }],
      ["usuarios/profe", { nombres: "Pedro", apellidos: "Soto", rol: "profesor" }],
      ["elencos/e1", { nombre: "Coro", activo: true }],
      ["elencos/e2", { nombre: "Banda", activo: true }],
      ["miembros_elenco/e1_profe", membresia("e1", "profe", "profesor")],
      ["miembros_elenco/e1_alumno", membresia("e1", "alumno", "alumno")],
      ["miembros_elenco/e1_inactivo", membresia("e1", "inactivo", "alumno", false)],
      ["miembros_elenco/e2_profe2", membresia("e2", "profe2", "profesor")],
      ["archivos/a1", { elencoId: "e1", profesorId: "profe", tipo: "pdf", titulo: "Partitura" }],
      ["avisos/v1", { elencoId: "e1", profesorId: "profe", titulo: "Ensayo", contenido: "Sábado", urgente: false }],
      ["asistencias/s1_alumno", { elencoId: "e1", alumnoId: "alumno", sesionId: "s1", estado: "presente" }],
      ["observaciones_asistencia/s1_alumno", { elencoId: "e1", alumnoId: "alumno", sesionId: "s1", texto: "Llegó tarde" }],
      [
        "tareas/t1",
        {
          titulo: "Estudiar compás 12",
          elencoId: "e1",
          profesorId: "profe",
          tipoAdjunto: "Ninguno",
          completadoPor: [],
          completadoEn: {},
        },
      ],
      ["semestres/2026-1", { anio: 2026, numero: 1, fechaInicio: "2026-03-02", fechaFin: "2026-07-10" }],
      ["clases/c1", { elencoId: "e1", fechaInicio: "2026-03-02", horaInicio: "17:00" }],
      ["sesiones_clase/c1_2026-03-02", { claseId: "c1", elencoId: "e1", fecha: "2026-03-02", estado: "realizada" }],
      ["datos_privados/alumno", { rutCifrado: "v1:xxx" }],
    ];
    await Promise.all(escrituras.map(([ruta, datos]) => db.doc(ruta).set(datos)));
  });
}
