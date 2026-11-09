import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import "firebase/compat/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { cargarEscenario, como, crearEntorno, type NombreUsuario } from "./entorno";

let entorno: RulesTestEnvironment;

const MEGABYTE = 1024 * 1024;
const PDF = { contentType: "application/pdf" };
const MP3 = { contentType: "audio/mpeg" };

beforeAll(async () => {
  entorno = await crearEntorno();
});

beforeEach(async () => {
  await entorno.clearFirestore();
  await entorno.clearStorage();
  await cargarEscenario(entorno);
  await entorno.withSecurityRulesDisabled(async (contexto) => {
    await contexto.storage().ref("elencos/e1/pdf/existente.pdf").put(new Uint8Array(10), PDF);
  });
});

afterAll(async () => {
  await entorno.cleanup();
});

const ref = (nombre: NombreUsuario, ruta: string) => como(entorno, nombre).storage().ref(ruta);
const bytes = (cantidad: number) => new Uint8Array(cantidad);

/** put() devuelve una UploadTask: se puede esperar, pero no es una Promise para TypeScript. */
const subir = (nombre: NombreUsuario, ruta: string, datos: Uint8Array, metadatos: { contentType: string }) =>
  Promise.resolve(ref(nombre, ruta).put(datos, metadatos));

describe("subida de material", () => {
  it("el docente del elenco sube un PDF y un audio", async () => {
    await assertSucceeds(subir("profe", "elencos/e1/pdf/score.pdf", bytes(1000), PDF));
    await assertSucceeds(subir("profe", "elencos/e1/mp3/pista.mp3", bytes(1000), MP3));
    await assertSucceeds(subir("profe", "elencos/e1/wav/pista.wav", bytes(1000), { contentType: "audio/wav" }));
  });
  it("no suben alumnos ni docentes de otro elenco", async () => {
    await assertFails(subir("alumno", "elencos/e1/pdf/score.pdf", bytes(1000), PDF));
    await assertFails(subir("profe2", "elencos/e1/pdf/score.pdf", bytes(1000), PDF));
  });
  it("se rechaza un formato que no corresponde a la carpeta", async () => {
    await assertFails(subir("profe", "elencos/e1/pdf/pista.mp3", bytes(1000), MP3));
    await assertFails(subir("profe", "elencos/e1/pdf/programa.exe", bytes(1000), { contentType: "application/octet-stream" }));
    await assertFails(subir("profe", "elencos/e1/otra/score.pdf", bytes(1000), PDF));
  });
  it("se rechaza un PDF de más de 25 MB", async () => {
    await assertFails(subir("profe", "elencos/e1/pdf/grande.pdf", bytes(25 * MEGABYTE + 1), PDF));
  });
  it("un adjunto de tarea puede ser PDF o audio", async () => {
    await assertSucceeds(subir("profe", "elencos/e1/tareas/guia.pdf", bytes(1000), PDF));
    await assertSucceeds(subir("profe", "elencos/e1/tareas/pista.mp3", bytes(1000), MP3));
  });
  it("un archivo subido no se reemplaza", async () => {
    await assertFails(subir("profe", "elencos/e1/pdf/existente.pdf", bytes(20), PDF));
  });
});

describe("lectura y eliminación", () => {
  it("leen los miembros del elenco y la Dirección", async () => {
    await assertSucceeds(ref("alumno", "elencos/e1/pdf/existente.pdf").getMetadata());
    await assertSucceeds(ref("admin", "elencos/e1/pdf/existente.pdf").getMetadata());
    await assertFails(ref("ajeno", "elencos/e1/pdf/existente.pdf").getMetadata());
    await assertFails(ref("inactivo", "elencos/e1/pdf/existente.pdf").getMetadata());
  });
  it("elimina el docente del elenco; un alumno no", async () => {
    await assertFails(ref("alumno", "elencos/e1/pdf/existente.pdf").delete());
    await assertSucceeds(ref("profe", "elencos/e1/pdf/existente.pdf").delete());
  });
  it("cualquier otra ruta está cerrada", async () => {
    await assertFails(subir("alumno", "usuarios/alumno/foto.png", bytes(10), { contentType: "image/png" }));
    await assertFails(subir("admin", "otra/ruta.pdf", bytes(10), PDF));
  });
});

describe("imágenes de la Landing", () => {
  const JPG = { contentType: "image/jpeg" };

  it("cualquiera puede verlas, incluso sin sesión", async () => {
    await entorno.withSecurityRulesDisabled(async (contexto) => {
      await contexto.storage().ref("landing/portada/foto.jpg").put(bytes(10), JPG);
    });
    await assertSucceeds(entorno.unauthenticatedContext().storage().ref("landing/portada/foto.jpg").getMetadata());
  });
  it("solo la Dirección sube imágenes, en las carpetas previstas", async () => {
    await assertSucceeds(subir("admin", "landing/actuaciones/nueva.jpg", bytes(1000), JPG));
    await assertFails(subir("profe", "landing/actuaciones/nueva2.jpg", bytes(1000), JPG));
    await assertFails(subir("admin", "landing/otra/nueva.jpg", bytes(1000), JPG));
  });
  it("solo JPG, PNG o WebP de hasta 5 MB", async () => {
    await assertSucceeds(subir("admin", "landing/portada/a.webp", bytes(1000), { contentType: "image/webp" }));
    await assertFails(subir("admin", "landing/portada/b.gif", bytes(1000), { contentType: "image/gif" }));
    await assertFails(subir("admin", "landing/portada/c.svg", bytes(1000), { contentType: "image/svg+xml" }));
    await assertFails(subir("admin", "landing/portada/d.jpg", bytes(5 * MEGABYTE + 1), JPG));
  });
  it("un alumno no borra imágenes de la Landing", async () => {
    await entorno.withSecurityRulesDisabled(async (contexto) => {
      await contexto.storage().ref("landing/portada/foto.jpg").put(bytes(10), JPG);
    });
    await assertFails(ref("alumno", "landing/portada/foto.jpg").delete());
    await assertSucceeds(ref("admin", "landing/portada/foto.jpg").delete());
  });
});
