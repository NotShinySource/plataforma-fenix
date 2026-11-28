import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

const useEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
  process.env.NODE_ENV === "development";

if (useEmulator) {
  // El Admin SDK se conecta a los emuladores con solo detectar estas variables
  // de entorno (deben existir ANTES de initializeApp) — no requiere credenciales
  // reales, así que las FIREBASE_ADMIN_* de más abajo pueden faltar en este modo.
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";
}

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

/**
 * Dentro de Google Cloud (Firebase App Hosting corre sobre Cloud Run, que
 * define K_SERVICE) el servidor se autentica con la cuenta de servicio del
 * propio proyecto, sin guardar ninguna clave privada. Fuera de Google Cloud
 * (desarrollo con el proyecto real, o Vercel) se usa la clave de FIREBASE_ADMIN_*.
 */
const enGoogleCloud = Boolean(process.env.K_SERVICE);

if (!projectId) {
  throw new Error(
    "Falta FIREBASE_ADMIN_PROJECT_ID o NEXT_PUBLIC_FIREBASE_PROJECT_ID — revisa .env.local"
  );
}

if (!useEmulator && !enGoogleCloud && (!clientEmail || !privateKey)) {
  throw new Error(
    "Faltan variables de entorno FIREBASE_ADMIN_* — revisa .env.local"
  );
}

function credencial() {
  if (clientEmail && privateKey) return cert({ projectId, clientEmail, privateKey });
  return applicationDefault();
}

const app: App =
  getApps()[0] ??
  initializeApp(
    useEmulator
      ? { projectId, storageBucket }
      : { credential: credencial(), projectId, storageBucket }
  );

export const authAdmin: Auth = getAuth(app);
export const dbAdmin: Firestore = getFirestore(app);
export const storageAdmin: Storage = getStorage(app);
