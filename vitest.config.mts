import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

/**
 * Dos grupos de pruebas:
 * - unidad: lógica pura (RUT, cifrado, calendario…), sin Firebase. `npm test`.
 * - reglas: firestore.rules y storage.rules contra el emulador, que levanta
 *   `npm run test:reglas` con `firebase emulators:exec`.
 */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unidad",
          include: ["tests/unidad/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          name: "reglas",
          include: ["tests/reglas/**/*.test.ts"],
          environment: "node",
          // Las pruebas comparten el mismo emulador: en paralelo se pisarían los datos.
          fileParallelism: false,
          testTimeout: 15_000,
        },
      },
    ],
  },
});
