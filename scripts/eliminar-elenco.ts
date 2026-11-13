/**
 * Elimina un elenco y TODO lo que depende de él: membresías, clases y sus
 * sesiones, asistencias y observaciones, material (documentos y archivos de
 * Storage), avisos con sus lecturas, y tareas. Las cuentas de usuario no se
 * tocan.
 *
 * Es irreversible. Para el uso normal está "Archivar" en el panel, que
 * conserva el historial; este script es para limpiar datos de prueba.
 *
 * Sin `--confirmar` solo informa qué borraría (simulación).
 *
 * Uso:
 *   npm run eliminar:elenco -- --elenco=<id>                          (emulador, simulación)
 *   npm run eliminar:elenco -- --elenco=<id> --confirmar              (emulador)
 *   npm run eliminar:elenco -- --elenco=<id> --proyecto-real          (real, simulación)
 *   npm run eliminar:elenco -- --elenco=<id> --proyecto-real --confirmar
 */
import type { DocumentReference, Query } from "firebase-admin/firestore";
import { conectar, opcion } from "./conexion-admin";

/** Colecciones con un campo `elencoId` que apunta al elenco. */
const DEPENDIENTES = [
  "miembros_elenco",
  "clases",
  "sesiones_clase",
  "asistencias",
  "observaciones_asistencia",
  "archivos",
  "avisos",
  "tareas",
] as const;

/** Firestore acepta hasta 500 escrituras por lote. */
const TAMANO_LOTE = 400;

async function main(): Promise<void> {
  const { db, bucket, destino } = conectar();
  const elencoId = opcion("elenco");
  const confirmar = process.argv.includes("--confirmar");
  if (!elencoId) throw new Error("Indica el elenco con --elenco=<id>.");

  const elencoRef = db.collection("elencos").doc(elencoId);
  const elenco = await elencoRef.get();
  if (!elenco.exists) throw new Error(`No existe el elenco ${elencoId} en ${destino}.`);

  console.log(
    `${confirmar ? "ELIMINANDO" : "Simulación:"} "${elenco.data()?.nombre}" (${elencoId}) en ${destino}\n`
  );

  const porColeccion = new Map<string, DocumentReference[]>();
  for (const coleccion of DEPENDIENTES) {
    const consulta: Query = db.collection(coleccion).where("elencoId", "==", elencoId);
    porColeccion.set(coleccion, (await consulta.get()).docs.map((d) => d.ref));
  }
  let lecturas = 0;
  for (const aviso of porColeccion.get("avisos") ?? []) {
    lecturas += (await aviso.collection("lecturas").count().get()).data().count;
  }
  const [archivosStorage] = await bucket.getFiles({ prefix: `elencos/${elencoId}/` });

  for (const [coleccion, refs] of porColeccion) console.log(`  ${coleccion.padEnd(26)} ${refs.length}`);
  console.log(`  ${"lecturas de avisos".padEnd(26)} ${lecturas}`);
  console.log(`  ${"archivos en Storage".padEnd(26)} ${archivosStorage.length}`);
  console.log(`  ${"elenco".padEnd(26)} 1`);

  if (!confirmar) {
    console.log("\nNo se borró nada. Para eliminar de verdad, agrega --confirmar.");
    return;
  }

  // Avisos con su subcolección de lecturas.
  for (const aviso of porColeccion.get("avisos") ?? []) await db.recursiveDelete(aviso);
  porColeccion.delete("avisos");

  const resto = Array.from(porColeccion.values()).flat();
  for (let inicio = 0; inicio < resto.length; inicio += TAMANO_LOTE) {
    const lote = db.batch();
    resto.slice(inicio, inicio + TAMANO_LOTE).forEach((ref) => lote.delete(ref));
    await lote.commit();
  }
  await Promise.all(archivosStorage.map((archivo) => archivo.delete()));
  await elencoRef.delete();

  console.log("\nListo: el elenco y todo lo que dependía de él fue eliminado.");
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
