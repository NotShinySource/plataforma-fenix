/**
 * Seed de la colección raíz `tareas` (al mismo nivel que `usuarios` y
 * `elencos`, nunca como subcolección). Firestore crea la colección al
 * escribir su primer documento, así que este script la deja inicializada
 * con algunas tareas de prueba repartidas entre los elencos existentes,
 * incluyendo una con PDF y otra con audio adjuntos.
 *
 * Las tareas de prueba usan IDs que empiezan con "seed-tarea-", para poder
 * volver a ejecutar el script sin duplicarlas y para borrarlas después.
 *
 * Uso:
 *   npm run seed:tareas
 *       Contra el emulador local (NEXT_PUBLIC_USE_FIREBASE_EMULATOR="true").
 *       Necesita al menos un elenco con un profesor: ejecuta antes `npm run seed`.
 *
 *   npm run seed:tareas -- --proyecto-real
 *       Contra el proyecto real de Firebase. Hay que pedirlo explícitamente
 *       con esta opción; sin ella el script se niega a escribir fuera del
 *       emulador. Usa las credenciales FIREBASE_ADMIN_*.
 *
 *   npm run seed:tareas -- --borrar            (o con --proyecto-real)
 *       Elimina las tareas de prueba y sus archivos adjuntos.
 *
 * No reutiliza src/lib/firebase/admin.ts porque ese módulo importa
 * "server-only", que falla fuera del bundler de Next.js.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  FieldPath,
  FieldValue,
  getFirestore,
  type WithFieldValue,
} from "firebase-admin/firestore";
import { getDownloadURL, getStorage } from "firebase-admin/storage";
import type { Tarea, TipoAdjuntoTarea } from "../src/types/tarea";

const PREFIJO_ID = "seed-tarea-";
const COLECCION = "tareas";

const usarEmulador = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const proyectoRealPedido = process.argv.includes("--proyecto-real");
const borrar = process.argv.includes("--borrar");

if (!usarEmulador && !proyectoRealPedido) {
  console.error(
    "NEXT_PUBLIC_USE_FIREBASE_EMULATOR no está en 'true', así que este script\n" +
      "escribiría en el proyecto REAL de Firebase. Abortando por seguridad.\n\n" +
      "  - Para usar el emulador: pon la variable en \"true\" y levanta los emuladores.\n" +
      "  - Para escribir en el proyecto real a propósito: npm run seed:tareas -- --proyecto-real"
  );
  process.exit(1);
}

if (usarEmulador) {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= "127.0.0.1:9199";
}

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId) {
  throw new Error("Falta FIREBASE_ADMIN_PROJECT_ID o NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
}
if (!usarEmulador && (!clientEmail || !privateKey)) {
  throw new Error("Faltan FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY.");
}

// Contra el emulador no se necesitan credenciales reales, basta el projectId.
const app =
  getApps()[0] ??
  initializeApp(
    usarEmulador
      ? { projectId, storageBucket }
      : {
          credential: cert({ projectId, clientEmail: clientEmail!, privateKey: privateKey! }),
          storageBucket,
        }
  );
const dbAdmin = getFirestore(app);
const bucket = getStorage(app).bucket();

/** PDF mínimo válido de una página, con las posiciones de la tabla xref calculadas. */
function generarPdfDePrueba(texto: string): Buffer {
  const contenido = `BT /F1 20 Tf 72 720 Td (${texto}) Tj ET`;
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const posiciones: number[] = [];
  objetos.forEach((objeto, indice) => {
    posiciones.push(pdf.length);
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
  });

  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  posiciones.forEach((posicion) => {
    pdf += `${String(posicion).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

/** WAV PCM de 8 bits mono: un La (440 Hz) de 3 segundos, suficiente para probar el reproductor. */
function generarWavDePrueba(): Buffer {
  const frecuenciaMuestreo = 8000;
  const muestras = frecuenciaMuestreo * 3;
  const buffer = Buffer.alloc(44 + muestras);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + muestras, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); // tamaño del bloque fmt
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(frecuenciaMuestreo, 24);
  buffer.writeUInt32LE(frecuenciaMuestreo, 28); // bytes por segundo
  buffer.writeUInt16LE(1, 32); // bytes por muestra
  buffer.writeUInt16LE(8, 34); // bits por muestra
  buffer.write("data", 36);
  buffer.writeUInt32LE(muestras, 40);
  for (let i = 0; i < muestras; i++) {
    buffer[44 + i] = 128 + Math.round(50 * Math.sin((2 * Math.PI * 440 * i) / frecuenciaMuestreo));
  }

  return buffer;
}

interface PlantillaTarea {
  titulo: string;
  /** Días desde hoy hasta la fecha límite; null = sin fecha límite. */
  diasParaVencer: number | null;
  tipoAdjunto: TipoAdjuntoTarea;
}

const PLANTILLAS: PlantillaTarea[] = [
  { titulo: "Estudiar escala de Sol Mayor (2 octavas)", diasParaVencer: 7, tipoAdjunto: "PDF" },
  {
    titulo: "Practicar articulación staccato — Compases 12 al 28",
    diasParaVencer: 4,
    tipoAdjunto: "Audio",
  },
  { titulo: "Memorizar entrada del segundo movimiento", diasParaVencer: null, tipoAdjunto: "Ninguno" },
  { titulo: "Afinar y limpiar el instrumento antes del ensayo", diasParaVencer: 0, tipoAdjunto: "Ninguno" },
  { titulo: "Leer la partitura del himno institucional", diasParaVencer: 12, tipoAdjunto: "Ninguno" },
];

const ADJUNTOS = {
  PDF: {
    nombre: "escala-sol-mayor.pdf",
    tipoMime: "application/pdf",
    generar: () => generarPdfDePrueba("Escala de Sol Mayor - material de prueba"),
  },
  Audio: {
    nombre: "referencia-staccato.wav",
    tipoMime: "audio/wav",
    generar: generarWavDePrueba,
  },
} as const;

function rutaAdjunto(elencoId: string, tareaId: string, nombre: string): string {
  return `elencos/${elencoId}/tareas/${tareaId}_${nombre}`;
}

function finDelDia(diasDesdeHoy: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  fecha.setHours(23, 59, 59, 0);
  return fecha;
}

interface ElencoConDocente {
  elencoId: string;
  nombre: string;
  profesorId: string;
  alumnos: string[];
}

/** Elencos activos que tienen al menos un profesor asignado (hasta 3). */
async function buscarElencosConDocente(): Promise<ElencoConDocente[]> {
  const elencosSnap = await dbAdmin.collection("elencos").where("activo", "==", true).get();
  const resultado: ElencoConDocente[] = [];

  for (const elencoDoc of elencosSnap.docs) {
    if (resultado.length === 3) break;

    const miembrosSnap = await dbAdmin
      .collection("miembros_elenco")
      .where("elencoId", "==", elencoDoc.id)
      .where("activo", "==", true)
      .get();
    const miembros = miembrosSnap.docs.map((miembroDoc) => miembroDoc.data());
    const profesores = miembros.filter((miembro) => miembro.rolEnElenco === "profesor");
    if (profesores.length === 0) continue;

    const titular = elencoDoc.data().docenteResponsableId as string | undefined;
    resultado.push({
      elencoId: elencoDoc.id,
      nombre: elencoDoc.data().nombre,
      profesorId:
        profesores.find((profesor) => profesor.usuarioId === titular)?.usuarioId ??
        profesores[0].usuarioId,
      alumnos: miembros
        .filter((miembro) => miembro.rolEnElenco === "alumno")
        .map((miembro) => miembro.usuarioId as string),
    });
  }

  return resultado;
}

async function sembrar(): Promise<void> {
  const elencos = await buscarElencosConDocente();
  if (elencos.length === 0) {
    console.error(
      "No hay ningún elenco activo con un profesor asignado. Crea uno desde el panel\n" +
        "de Administración (o ejecuta `npm run seed` en el emulador) y vuelve a intentarlo."
    );
    process.exit(1);
  }

  for (const [indice, plantilla] of PLANTILLAS.entries()) {
    const elenco = elencos[indice % elencos.length];
    const tareaId = `${PREFIJO_ID}${indice + 1}`;

    let adjunto: { urlAdjunto: string; nombreAdjunto: string } | null = null;
    if (plantilla.tipoAdjunto !== "Ninguno") {
      const definicion = ADJUNTOS[plantilla.tipoAdjunto];
      const archivo = bucket.file(rutaAdjunto(elenco.elencoId, tareaId, definicion.nombre));
      await archivo.save(definicion.generar(), { contentType: definicion.tipoMime });
      adjunto = { urlAdjunto: await getDownloadURL(archivo), nombreAdjunto: definicion.nombre };
    }

    // Solo en el emulador se marca una tarea como cumplida por un alumno, para
    // ver una barra de avance con datos. En el proyecto real no se inventa
    // que un alumno de verdad completó una tarea de prueba.
    const alumnoQueCumplio = usarEmulador && indice === 4 ? elenco.alumnos[0] : undefined;

    const tarea: WithFieldValue<Tarea> = {
      titulo: plantilla.titulo,
      elencoId: elenco.elencoId,
      profesorId: elenco.profesorId,
      tipoAdjunto: plantilla.tipoAdjunto,
      completadoPor: alumnoQueCumplio ? [alumnoQueCumplio] : [],
      completadoEn: alumnoQueCumplio ? { [alumnoQueCumplio]: FieldValue.serverTimestamp() } : {},
      // Fecha de creación: la define el servidor, nunca el reloj de quien ejecuta el script.
      fechaCreacion: FieldValue.serverTimestamp(),
      ...(plantilla.diasParaVencer !== null
        ? { fechaLimite: finDelDia(plantilla.diasParaVencer) }
        : {}),
      ...(adjunto ?? {}),
    };

    await dbAdmin.collection(COLECCION).doc(tareaId).set(tarea);
    console.log(`  ✓ ${tareaId} → ${elenco.nombre}: ${plantilla.titulo}`);
  }
}

async function borrarSemilla(): Promise<void> {
  // Rango sobre el ID del documento: todo lo que empieza con el prefijo.
  const snap = await dbAdmin
    .collection(COLECCION)
    .where(FieldPath.documentId(), ">=", PREFIJO_ID)
    .where(FieldPath.documentId(), "<", `${PREFIJO_ID}`)
    .get();

  for (const tareaDoc of snap.docs) {
    const { elencoId, nombreAdjunto } = tareaDoc.data();
    if (nombreAdjunto) {
      await bucket
        .file(rutaAdjunto(elencoId, tareaDoc.id, nombreAdjunto))
        .delete({ ignoreNotFound: true });
    }
    await tareaDoc.ref.delete();
    console.log(`  ✗ ${tareaDoc.id} eliminada`);
  }

  if (snap.empty) console.log("  No había tareas de prueba que eliminar.");
}

async function main() {
  const destino = usarEmulador ? "el emulador de Firebase" : `el proyecto REAL (${projectId})`;

  if (borrar) {
    console.log(`Eliminando tareas de prueba en ${destino}...\n`);
    await borrarSemilla();
  } else {
    console.log(`Creando tareas de prueba en la colección "${COLECCION}" de ${destino}...\n`);
    await sembrar();
  }

  console.log("\nListo.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error al ejecutar el seed de tareas:", error);
  process.exit(1);
});
