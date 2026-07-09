import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
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

if (!useEmulator && (!projectId || !clientEmail || !privateKey)) {
  throw new Error(
    "Faltan variables de entorno FIREBASE_ADMIN_* — revisa .env.local"
  );
}

if (!projectId) {
  throw new Error(
    "Falta FIREBASE_ADMIN_PROJECT_ID o NEXT_PUBLIC_FIREBASE_PROJECT_ID — revisa .env.local"
  );
}

const app: App =
  getApps()[0] ??
  initializeApp(
    useEmulator
      ? {
          projectId,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }
      : {
          credential: cert({
            projectId,
            clientEmail: clientEmail!,
            privateKey: privateKey!,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }
  );

export const authAdmin: Auth = getAuth(app);
export const dbAdmin: Firestore = getFirestore(app);
export const storageAdmin: Storage = getStorage(app);

export default app;
