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
 * El destino lo decide solo `--proyecto-real` (ver scripts/conexion-admin.ts):
 * sin esa opción trabaja contra el emulador.
 */
import { conectar } from "./conexion-admin";

const COLECCION = "tareas";
/** Firestore acepta hasta 500 escrituras por lote. */
const TAMANO_LOTE = 400;

const simular = process.argv.includes("--simular");
const { db: dbAdmin, destino } = conectar();

async function migrar(): Promise<void> {
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
