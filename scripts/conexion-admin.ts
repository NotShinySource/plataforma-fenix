/**
 * Conexión del Admin SDK para los scripts de mantenimiento (Node plano, fuera
 * de Next.js). No reutiliza src/lib/firebase/admin.ts porque ese módulo
 * importa "server-only", que falla fuera del bundler.
 *
 * El destino lo decide solo la opción `--proyecto-real`: sin ella, el script
 * trabaja contra el EMULADOR aunque haya credenciales reales a mano. Así un
 * script nunca toca producción por una variable de entorno olvidada.
 *
 * Credenciales del proyecto real: FIREBASE_ADMIN_PROJECT_ID,
 * FIREBASE_ADMIN_CLIENT_EMAIL y FIREBASE_ADMIN_PRIVATE_KEY (en `.env`).
 */
import { config } from "dotenv";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

config({ path: [".env.local", ".env"], quiet: true });

export interface Conexion {
  app: App;
  db: Firestore;
  bucket: ReturnType<ReturnType<typeof getStorage>["bucket"]>;
  /** Texto para los mensajes: "el EMULADOR" o "el proyecto REAL (id)". */
  destino: string;
  proyectoReal: boolean;
}

export function conectar(): Conexion {
  const proyectoReal = process.argv.includes("--proyecto-real");
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!projectId) throw new Error("Falta FIREBASE_ADMIN_PROJECT_ID o NEXT_PUBLIC_FIREBASE_PROJECT_ID.");

  let app: App;
  if (proyectoReal) {
    // Nada de emuladores: aunque estén definidas, estas variables desviarían
    // el Admin SDK al emulador.
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!clientEmail || !privateKey) {
      throw new Error("Faltan FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY (archivo .env).");
    }
    app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket });
  } else {
    process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
    process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
    app = getApps()[0] ?? initializeApp({ projectId, storageBucket });
  }

  return {
    app,
    db: getFirestore(app),
    bucket: getStorage(app).bucket(),
    destino: proyectoReal ? `el proyecto REAL (${projectId})` : "el EMULADOR",
    proyectoReal,
  };
}

/** Valor de una opción `--nombre=valor` de la línea de comandos. */
export function opcion(nombre: string): string | undefined {
  const prefijo = `--${nombre}=`;
  return process.argv.find((arg) => arg.startsWith(prefijo))?.slice(prefijo.length);
}
