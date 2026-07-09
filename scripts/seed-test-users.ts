/**
 * Seed de datos de prueba para desarrollo local contra el EMULADOR de Firebase.
 * Crea un usuario alumno y un usuario profesor (Auth + usuarios/{uid} + custom
 * claim de rol), un elenco de prueba y las membresías en miembros_elenco que
 * conectan a ambos con ese elenco, según el modelo de datos del proyecto.
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
import { emailSinteticoDesdeRut } from "../src/lib/auth/rut";
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

interface DatosUsuarioPrueba {
  rut: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
  password: string;
  fechaNacimiento: Date;
}

function esErrorConCodigo(error: unknown, codigo: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === codigo
  );
}

async function crearOActualizarUsuarioAuth(
  datos: DatosUsuarioPrueba,
  email: string
): Promise<string> {
  const displayName = `${datos.nombres} ${datos.apellidos}`;
  try {
    const usuarioCreado = await authAdmin.createUser({
      email,
      password: datos.password,
      displayName,
    });
    return usuarioCreado.uid;
  } catch (error) {
    if (esErrorConCodigo(error, "auth/email-already-exists")) {
      const usuarioExistente = await authAdmin.getUserByEmail(email);
      await authAdmin.updateUser(usuarioExistente.uid, {
        password: datos.password,
        displayName,
      });
      return usuarioExistente.uid;
    }
    throw error;
  }
}

async function seedUsuario(
  datos: DatosUsuarioPrueba
): Promise<{ uid: string; email: string }> {
  const email = emailSinteticoDesdeRut(datos.rut);
  const uid = await crearOActualizarUsuarioAuth(datos, email);

  await authAdmin.setCustomUserClaims(uid, { rol: datos.rol });

  const usuario: WithFieldValue<Usuario> = {
    rut: datos.rut,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    email,
    rol: datos.rol,
    activo: true,
    // Dato provisto por el usuario, no de creación: Date directo, ambos SDKs
    // lo serializan como Timestamp automáticamente al escribir.
    fechaNacimiento: datos.fechaNacimiento,
    // Fecha de creación: la define el servidor,
    // nunca el reloj de quien ejecuta este script.
    fechaCreacion: FieldValue.serverTimestamp(),
  };

  await dbAdmin.collection("usuarios").doc(uid).set(usuario);

  return { uid, email };
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
    fechaNacimiento: new Date("2014-03-15"),
  };

  const profesorDatos: DatosUsuarioPrueba = {
    rut: "22.222.222-2",
    nombres: "Profesor",
    apellidos: "De Prueba",
    rol: "profesor",
    password: "Profesor123!",
    fechaNacimiento: new Date("1988-07-20"),
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
  console.log(`  Email interno: ${alumno.email}`);
  console.log(`  UID:           ${alumno.uid}`);
  console.log("\n── Profesor ────────────────────────");
  console.log(`  RUT:           ${profesorDatos.rut}`);
  console.log(`  Contraseña:    ${profesorDatos.password}`);
  console.log(`  Email interno: ${profesor.email}`);
  console.log(`  UID:           ${profesor.uid}`);
  console.log(`\nElenco de prueba: ${elencoId} (ambos usuarios son miembros)`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Error al ejecutar el seed:", error);
  process.exit(1);
});
