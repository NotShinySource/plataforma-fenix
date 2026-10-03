/**
 * Seed de datos de prueba para desarrollo local contra el EMULADOR de Firebase.
 * Crea un usuario alumno y un usuario profesor (cuenta de Auth con el
 * identificador derivado del RUT + custom claim de rol + usuarios/{uid} +
 * datos_privados/{uid} cifrado), un elenco de prueba y las membresías en
 * miembros_elenco que conectan a ambos con ese elenco.
 *
 * Las cuentas quedan "activadas" con contraseña conocida, para probar el
 * login sin pasar por el flujo de activación.
 *
 * Uso: npm run seed
 *
 * No reutiliza src/lib/firebase/admin.ts porque ese módulo importa
 * "server-only", que revienta fuera del bundler de Next.js — este script
 * corre como Node/tsx plano, así que inicializa su propia instancia mínima
 * del Admin SDK.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
  type WithFieldValue,
} from "firebase-admin/firestore";
import { identificadorDesdeRut } from "../src/lib/seguridad/cifrado";
import { cifrarDatosPrivados } from "../src/lib/seguridad/datos-privados";
import type { DatosPrivados } from "../src/types/datos-privados";
import type { Elenco, MiembroElenco, RolEnElenco } from "../src/types/elenco";
import type { RolUsuario, Usuario } from "../src/types/usuario";

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "true") {
  console.error(
    "NEXT_PUBLIC_USE_FIREBASE_EMULATOR no está en 'true' en .env.local.\n" +
      "Este script solo debe correr contra el emulador local — nunca contra " +
      "el proyecto real de Firebase. Abortando por seguridad."
  );
  process.exit(1);
}

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Falta FIREBASE_ADMIN_PROJECT_ID o NEXT_PUBLIC_FIREBASE_PROJECT_ID — revisa .env.local"
  );
}

// Contra el emulador no se necesitan credenciales reales, basta el projectId.
const app = getApps()[0] ?? initializeApp({ projectId });
const authAdmin = getAuth(app);
const dbAdmin = getFirestore(app);

const ELENCO_ID_PRUEBA = "elenco-seed-prueba";

interface DatosUsuarioPrueba extends DatosPrivados {
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
  password: string;
}

function esErrorConCodigo(error: unknown, codigo: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === codigo
  );
}

/** Sin displayName a propósito: el nombre no debe verse en la consola de Authentication. */
async function crearOActualizarUsuarioAuth(
  datos: DatosUsuarioPrueba,
  identificador: string
): Promise<string> {
  try {
    const usuarioCreado = await authAdmin.createUser({
      email: identificador,
      password: datos.password,
    });
    return usuarioCreado.uid;
  } catch (error) {
    if (esErrorConCodigo(error, "auth/email-already-exists")) {
      const usuarioExistente = await authAdmin.getUserByEmail(identificador);
      await authAdmin.updateUser(usuarioExistente.uid, {
        password: datos.password,
        displayName: null,
      });
      return usuarioExistente.uid;
    }
    throw error;
  }
}

async function seedUsuario(
  datos: DatosUsuarioPrueba
): Promise<{ uid: string; identificador: string }> {
  const identificador = identificadorDesdeRut(datos.rut);
  const uid = await crearOActualizarUsuarioAuth(datos, identificador);

  await authAdmin.setCustomUserClaims(uid, { rol: datos.rol });

  const usuario: WithFieldValue<Usuario> = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    rol: datos.rol,
    activo: true,
    estadoActivacion: "activada",
    // Fecha de creación: la define el servidor,
    // nunca el reloj de quien ejecuta este script.
    fechaCreacion: FieldValue.serverTimestamp(),
  };

  const privados: DatosPrivados = {
    rut: datos.rut,
    fechaNacimiento: datos.fechaNacimiento,
    ...(datos.email ? { email: datos.email } : {}),
    ...(datos.emailApoderado ? { emailApoderado: datos.emailApoderado } : {}),
  };

  const batch = dbAdmin.batch();
  batch.set(dbAdmin.collection("usuarios").doc(uid), usuario);
  batch.set(dbAdmin.collection("datos_privados").doc(uid), {
    ...cifrarDatosPrivados(privados),
    fechaActualizacion: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { uid, identificador };
}

async function seedElenco(docenteResponsableId: string): Promise<string> {
  const elenco: WithFieldValue<Elenco> = {
    nombre: "Elenco de Prueba",
    disciplina: "musica",
    tipoElenco: "Coro Adultos",
    descripcion:
      "Elenco creado por scripts/seed-test-users.ts para pruebas locales.",
    docenteResponsableId,
    activo: true,
    fechaCreacion: FieldValue.serverTimestamp(),
  };

  await dbAdmin.collection("elencos").doc(ELENCO_ID_PRUEBA).set(elenco);
  return ELENCO_ID_PRUEBA;
}

async function seedMembresia(
  elencoId: string,
  usuarioId: string,
  rolEnElenco: RolEnElenco
): Promise<void> {
  const membresia: WithFieldValue<MiembroElenco> = {
    elencoId,
    usuarioId,
    rolEnElenco,
    fechaIngreso: FieldValue.serverTimestamp(),
    activo: true,
  };

  await dbAdmin
    .collection("miembros_elenco")
    .doc(`${elencoId}_${usuarioId}`)
    .set(membresia);
}

async function main() {
  const alumnoDatos: DatosUsuarioPrueba = {
    rut: "11.111.111-1",
    nombres: "Alumno",
    apellidos: "De Prueba",
    rol: "alumno",
    password: "Alumno123!",
    fechaNacimiento: "2014-03-15",
    email: "alumno.prueba@example.com",
    emailApoderado: "apoderado.prueba@example.com",
  };

  const profesorDatos: DatosUsuarioPrueba = {
    rut: "22.222.222-2",
    nombres: "Profesor",
    apellidos: "De Prueba",
    rol: "profesor",
    password: "Profesor123!",
    fechaNacimiento: "1988-07-20",
    email: "profesor.prueba@example.com",
  };

  console.log("Creando usuarios de prueba en el emulador de Firebase...\n");

  const alumno = await seedUsuario(alumnoDatos);
  const profesor = await seedUsuario(profesorDatos);

  const elencoId = await seedElenco(profesor.uid);
  await seedMembresia(elencoId, profesor.uid, "profesor");
  await seedMembresia(elencoId, alumno.uid, "alumno");

  console.log("Listo. Datos para probar el login manualmente:\n");
  console.log("── Alumno ──────────────────────────");
  console.log(`  RUT:           ${alumnoDatos.rut}`);
  console.log(`  Contraseña:    ${alumnoDatos.password}`);
  console.log(`  Identificador: ${alumno.identificador}`);
  console.log(`  UID:           ${alumno.uid}`);
  console.log("\n── Profesor ────────────────────────");
  console.log(`  RUT:           ${profesorDatos.rut}`);
  console.log(`  Contraseña:    ${profesorDatos.password}`);
  console.log(`  Identificador: ${profesor.identificador}`);
  console.log(`  UID:           ${profesor.uid}`);
  console.log(`\nElenco de prueba: ${elencoId} (ambos usuarios son miembros)`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Error al ejecutar el seed:", error);
  process.exit(1);
});
