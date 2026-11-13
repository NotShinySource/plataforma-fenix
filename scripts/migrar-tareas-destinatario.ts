/**
 * Migración de la colección `tareas`: agrega `alumnoId: null` a las tareas
 * creadas antes de que existieran las tareas individuales.
 *
 * Por qué hace falta: el alumno consulta las tareas de su elenco con
 * `where("alumnoId", "==", null)`, y Firestore no devuelve documentos donde
 * el campo no existe. Sin esta migración, las tareas antiguas dejan de verse
 * en la vista del alumno (el docente las sigue viendo).
 *
 * Es idempotente: solo toca documentos sin el campo, así que se puede correr
 * más de una vez sin efectos.
 *
 * Uso:
 *   npm run migrar:tareas -- --simular            (emulador, solo informa)
 *   npm run migrar:tareas                          (emulador)
 *   npm run migrar:tareas -- --proyecto-real --simular
 *   npm run migrar:tareas -- --proyecto-real       (proyecto real)
 *
 * Igual que los seeds, no usa src/lib/firebase/admin.ts porque ese módulo
 * importa "server-only", que falla fuera del bundler de Next.js.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const COLECCION = "tareas";
/** Firestore acepta hasta 500 escrituras por lote. */
const TAMANO_LOTE = 400;

const usarEmulador = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const proyectoRealPedido = process.argv.includes("--proyecto-real");
const simular = process.argv.includes("--simular");

if (!usarEmulador && !proyectoRealPedido) {
  console.error(
    "NEXT_PUBLIC_USE_FIREBASE_EMULATOR no está en 'true', así que este script\n" +
      "escribiría en el proyecto REAL de Firebase. Abortando por seguridad.\n\n" +
      "  - Para usar el emulador: pon la variable en \"true\" y levanta los emuladores.\n" +
      "  - Para migrar el proyecto real a propósito: npm run migrar:tareas -- --proyecto-real"
  );
  process.exit(1);
}

if (usarEmulador) {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
}

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId) {
  throw new Error("Falta FIREBASE_ADMIN_PROJECT_ID o NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
}
if (!usarEmulador && (!clientEmail || !privateKey)) {
  throw new Error("Faltan FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY.");
}

const app =
  getApps()[0] ??
  initializeApp(
    usarEmulador
      ? { projectId }
      : { credential: cert({ projectId, clientEmail: clientEmail!, privateKey: privateKey! }) }
  );
const dbAdmin = getFirestore(app);

async function migrar(): Promise<void> {
  const destino = usarEmulador ? "el EMULADOR" : `el proyecto REAL (${projectId})`;
  console.log(`${simular ? "Simulando la migración" : "Migrando"} de "${COLECCION}" en ${destino}...\n`);

  const snap = await dbAdmin.collection(COLECCION).get();
  const pendientes = snap.docs.filter((documento) => !("alumnoId" in documento.data()));

  console.log(`  Tareas en total: ${snap.size}`);
  console.log(`  Sin destinatario (a migrar): ${pendientes.length}`);

  if (simular || pendientes.length === 0) {
    console.log(simular ? "\nModo simulación: no se escribió nada." : "\nNada que migrar.");
    return;
  }

  for (let inicio = 0; inicio < pendientes.length; inicio += TAMANO_LOTE) {
    const lote = dbAdmin.batch();
    pendientes
      .slice(inicio, inicio + TAMANO_LOTE)
      .forEach((documento) => lote.update(documento.ref, { alumnoId: null }));
    await lote.commit();
  }

  console.log(`\n  ✓ ${pendientes.length} tareas quedaron como "para todo el elenco".`);
}

migrar().catch((error) => {
  console.error("Error al migrar las tareas:", error);
  process.exit(1);
});
