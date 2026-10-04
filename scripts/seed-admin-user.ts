/**
 * Crea un único usuario con rol 'administrador' (cuenta de Auth con el
 * identificador derivado del RUT + custom claim + usuarios/{uid} +
 * datos_privados/{uid} cifrado). Necesario porque el primer Admin no puede autocrearse
 * desde la pantalla de Admin (esa pantalla solo permite crear
 * 'alumno'/'profesor', ver src/app/(intranet)/admin/usuarios/actions.ts).
 *
 * Uso normal (bloqueado contra producción por defecto):
 *   npm run seed:admin
 *     -> corre contra el emulador local, con datos de prueba fijos.
 *
 * Uso contra el proyecto real de Firebase (una sola vez, para crear el
 * Admin real):
 *   npm run seed:admin -- --confirm-produccion
 *     -> requiere ADMIN_RUT, ADMIN_NOMBRES, ADMIN_APELLIDOS, ADMIN_PASSWORD,
 *        ADMIN_EMAIL y ADMIN_FECHA_NACIMIENTO (YYYY-MM-DD) como variables de
 *        entorno — nunca se usan los datos de prueba hardcodeados contra
 *        producción. También requiere FIREBASE_ADMIN_CLIENT_EMAIL/PRIVATE_KEY
 *        en .env.local (credenciales reales del service account) y las claves
 *        FENIX_CLAVE_HMAC/FENIX_CLAVE_CIFRADO de producción.
 *
 * Mismo patrón que scripts/seed-test-users.ts: no reutiliza
 * src/lib/firebase/admin.ts porque ese módulo importa "server-only", y este
 * script corre como Node/tsx plano, fuera del bundler de Next.js.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
  type WithFieldValue,
} from "firebase-admin/firestore";
import { rutEsValido } from "../src/lib/auth/rut";
import { identificadorDesdeRut } from "../src/lib/seguridad/cifrado";
import { cifrarDatosPrivados } from "../src/lib/seguridad/datos-privados";
import { esEmailValido, esFechaNacimientoValida, normalizarEmail } from "../src/lib/validacion";
import type { Usuario } from "../src/types/usuario";

const FLAG_CONFIRMAR_PRODUCCION = "--confirm-produccion";
const modoProduccion = process.argv
  .slice(2)
  .includes(FLAG_CONFIRMAR_PRODUCCION);

if (!modoProduccion && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "true") {
  console.error(
    "NEXT_PUBLIC_USE_FIREBASE_EMULATOR no está en 'true' en .env.local.\n" +
      "Este script solo debe correr contra el emulador local. Si de verdad " +
      `quieres correrlo contra el proyecto real, usa el flag exacto ` +
      `${FLAG_CONFIRMAR_PRODUCCION} (npm run seed:admin -- ${FLAG_CONFIRMAR_PRODUCCION}). ` +
      "Abortando por seguridad."
  );
  process.exit(1);
}

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Falta FIREBASE_ADMIN_PROJECT_ID o NEXT_PUBLIC_FIREBASE_PROJECT_ID — revisa .env.local"
  );
}

let app;
if (modoProduccion) {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Faltan FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY en " +
        ".env.local — son las credenciales reales del service account, " +
        "necesarias para escribir contra el proyecto real."
    );
  }

  console.warn(
    `⚠️  Corriendo contra el proyecto REAL de Firebase: "${projectId}" (no el emulador).\n`
  );

  app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
} else {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";

  // Contra el emulador no se necesitan credenciales reales, basta el projectId.
  app = getApps()[0] ?? initializeApp({ projectId });
}

const authAdmin = getAuth(app);
const dbAdmin = getFirestore(app);

interface DatosAdmin {
  rut: string;
  nombres: string;
  apellidos: string;
  password: string;
  email: string;
  /** YYYY-MM-DD */
  fechaNacimiento: string;
}

const ADMIN_DATOS_PRUEBA: DatosAdmin = {
  rut: "33.333.333-3",
  nombres: "Admin",
  apellidos: "De Prueba",
  password: "Admin123!",
  email: "admin.prueba@example.com",
  fechaNacimiento: "1990-01-01",
};

function datosAdminDesdeEnv(): DatosAdmin {
  const rut = process.env.ADMIN_RUT;
  const nombres = process.env.ADMIN_NOMBRES;
  const apellidos = process.env.ADMIN_APELLIDOS;
  const password = process.env.ADMIN_PASSWORD;
  const email = normalizarEmail(process.env.ADMIN_EMAIL ?? "");
  const fechaNacimientoStr = process.env.ADMIN_FECHA_NACIMIENTO;

  const faltantes = [
    !rut && "ADMIN_RUT",
    !nombres && "ADMIN_NOMBRES",
    !apellidos && "ADMIN_APELLIDOS",
    !password && "ADMIN_PASSWORD",
    !email && "ADMIN_EMAIL",
    !fechaNacimientoStr && "ADMIN_FECHA_NACIMIENTO",
  ].filter((v): v is string => Boolean(v));

  if (faltantes.length > 0) {
    console.error(
      `Faltan variables de entorno para crear el admin real: ${faltantes.join(", ")}.\n` +
        "Nunca se usan los datos de prueba hardcodeados (RUT 33.333.333-3 / " +
        "Admin123!) contra el proyecto real. Abortando."
    );
    process.exit(1);
  }

  if (!esFechaNacimientoValida(fechaNacimientoStr!)) {
    console.error(
      "ADMIN_FECHA_NACIMIENTO no es una fecha válida — usa formato YYYY-MM-DD."
    );
    process.exit(1);
  }
  if (!rutEsValido(rut!)) {
    console.error("ADMIN_RUT no es un RUT válido (dígito verificador incorrecto).");
    process.exit(1);
  }
  if (!esEmailValido(email)) {
    console.error("ADMIN_EMAIL no es un correo válido.");
    process.exit(1);
  }

  return {
    rut: rut!,
    nombres: nombres!,
    apellidos: apellidos!,
    password: password!,
    email,
    fechaNacimiento: fechaNacimientoStr!,
  };
}

const ADMIN_DATOS = modoProduccion ? datosAdminDesdeEnv() : ADMIN_DATOS_PRUEBA;

function esErrorConCodigo(error: unknown, codigo: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === codigo
  );
}

async function main() {
  // Sin displayName a propósito: el nombre no debe verse en la consola de Authentication.
  const identificador = identificadorDesdeRut(ADMIN_DATOS.rut);

  let uid: string;
  try {
    const usuarioCreado = await authAdmin.createUser({
      email: identificador,
      password: ADMIN_DATOS.password,
    });
    uid = usuarioCreado.uid;
  } catch (error) {
    if (esErrorConCodigo(error, "auth/email-already-exists")) {
      const usuarioExistente = await authAdmin.getUserByEmail(identificador);
      await authAdmin.updateUser(usuarioExistente.uid, {
        password: ADMIN_DATOS.password,
        displayName: null,
      });
      uid = usuarioExistente.uid;
    } else {
      throw error;
    }
  }

  await authAdmin.setCustomUserClaims(uid, { rol: "administrador" });

  const usuario: WithFieldValue<Usuario> = {
    nombres: ADMIN_DATOS.nombres,
    apellidos: ADMIN_DATOS.apellidos,
    rol: "administrador",
    activo: true,
    // Se crea con contraseña conocida, así que no pasa por la activación.
    estadoActivacion: "activada",
    fechaCreacion: FieldValue.serverTimestamp(),
  };

  const batch = dbAdmin.batch();
  batch.set(dbAdmin.collection("usuarios").doc(uid), usuario);
  batch.set(dbAdmin.collection("datos_privados").doc(uid), {
    ...cifrarDatosPrivados({
      rut: ADMIN_DATOS.rut,
      email: ADMIN_DATOS.email,
      fechaNacimiento: ADMIN_DATOS.fechaNacimiento,
    }),
    fechaActualizacion: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  console.log("Listo. Datos para probar el login manualmente:\n");
  console.log("── Administrador ───────────────────");
  console.log(`  RUT:           ${ADMIN_DATOS.rut}`);
  if (!modoProduccion) {
    console.log(`  Contraseña:    ${ADMIN_DATOS.password}`);
  }
  console.log(`  Identificador: ${identificador}`);
  console.log(`  UID:           ${uid}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Error al ejecutar el seed de administrador:", error);
  process.exit(1);
});
