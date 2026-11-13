/**
 * Crea las escuelas de la institución con sus niveles, tal como las informó
 * la Dirección. Las que ya existen (mismo nombre, sin importar mayúsculas ni
 * tildes) no se tocan, así que se puede correr más de una vez.
 *
 * Las escuelas de instrumento (piano, guitarra...) las crea la Dirección
 * desde el panel.
 *
 * Uso:
 *   npm run seed:escuelas -- --simular                  (emulador, solo informa)
 *   npm run seed:escuelas                               (emulador)
 *   npm run seed:escuelas -- --proyecto-real --simular
 *   npm run seed:escuelas -- --proyecto-real            (proyecto real)
 */
import { FieldValue, type WithFieldValue } from "firebase-admin/firestore";
import { claveComparacion } from "../src/lib/elencos";
import type { Escuela } from "../src/types/elenco";
import { conectar } from "./conexion-admin";

const ESCUELAS: Array<Pick<Escuela, "nombre" | "tipo" | "niveles">> = [
  { nombre: "Coro", tipo: "conjunto", niveles: ["Niños", "Jóvenes", "Adultos"] },
  {
    nombre: "Iniciación Musical Temprana",
    tipo: "conjunto",
    niveles: ["4-5 años", "6-7 años", "8-9 años"],
  },
  { nombre: "Banda de Concierto", tipo: "conjunto", niveles: ["Inicial", "Intermedio", "Avanzado"] },
  { nombre: "Orquesta de Cuerdas", tipo: "conjunto", niveles: ["Inicial", "Intermedio", "Avanzado"] },
  {
    nombre: "Folklore Latinoamericano",
    tipo: "conjunto",
    niveles: ["Inicial", "Intermedio", "Avanzado"],
  },
];

async function main(): Promise<void> {
  const { db, destino } = conectar();
  const simular = process.argv.includes("--simular");
  console.log(`${simular ? "Simulando la creación" : "Creando"} de escuelas en ${destino}...\n`);

  const existentes = new Set(
    (await db.collection("escuelas").get()).docs.map((d) => claveComparacion(String(d.data().nombre ?? "")))
  );

  let creadas = 0;
  for (const escuela of ESCUELAS) {
    if (existentes.has(claveComparacion(escuela.nombre))) {
      console.log(`  = ${escuela.nombre}: ya existe, no se toca`);
      continue;
    }
    if (!simular) {
      const documento: WithFieldValue<Escuela> = {
        ...escuela,
        activo: true,
        fechaCreacion: FieldValue.serverTimestamp(),
      };
      await db.collection("escuelas").add(documento);
    }
    creadas++;
    console.log(`  + ${escuela.nombre} (${escuela.niveles.join(", ")})`);
  }

  console.log(
    simular
      ? `\nModo simulación: se crearían ${creadas} escuelas; no se escribió nada.`
      : `\nListo: ${creadas} escuelas creadas.`
  );
}

main().catch((error) => {
  console.error("Error al crear las escuelas:", error);
  process.exit(1);
});
