import { describe, expect, it } from "vitest";
import {
  esEmailValido,
  esFechaNacimientoValida,
  normalizarEmail,
  validarAdjunto,
  validarArchivoMaterial,
  validarContenidoJpeg,
} from "@/lib/validacion";

const MEGABYTE = 1024 * 1024;

/** validarAdjunto solo mira nombre y tamaño: no hace falta crear un archivo real de 25 MB. */
function archivo(nombre: string, bytes: number): File {
  return { name: nombre, size: bytes } as File;
}

describe("esEmailValido / normalizarEmail", () => {
  it("acepta un correo común y rechaza formatos incompletos", () => {
    expect(esEmailValido("apoderado@gmail.com")).toBe(true);
    expect(esEmailValido("sin-arroba.cl")).toBe(false);
    expect(esEmailValido("a@b")).toBe(false);
    expect(esEmailValido("con espacio@gmail.com")).toBe(false);
  });

  it("rechaza correos más largos que el máximo", () => {
    expect(esEmailValido(`${"a".repeat(250)}@x.cl`)).toBe(false);
  });

  it("normaliza espacios y mayúsculas", () => {
    expect(normalizarEmail("  Apoderado@Gmail.COM ")).toBe("apoderado@gmail.com");
  });
});

describe("esFechaNacimientoValida", () => {
  it("acepta fechas reales del pasado", () => {
    expect(esFechaNacimientoValida("2012-05-17")).toBe(true);
    expect(esFechaNacimientoValida("2024-02-29")).toBe(true);
  });

  it.each([
    ["29 de febrero de un año no bisiesto", "2026-02-29"],
    ["mes inexistente", "2012-13-01"],
    ["anterior a 1900", "1899-12-31"],
    ["futura", "2999-01-01"],
    ["formato con barras", "17/05/2012"],
  ])("rechaza %s", (_caso, fecha) => expect(esFechaNacimientoValida(fecha)).toBe(false));
});

describe("validarAdjunto", () => {
  it("acepta PDF y audio dentro del límite, sin importar mayúsculas", () => {
    expect(validarAdjunto(archivo("partitura.PDF", 25 * MEGABYTE), "PDF")).toBeNull();
    expect(validarAdjunto(archivo("pista.mp3", 10 * MEGABYTE), "Audio")).toBeNull();
    expect(validarAdjunto(archivo("pista.wav", 50 * MEGABYTE), "Audio")).toBeNull();
  });

  it("rechaza archivos que superan el límite", () => {
    expect(validarAdjunto(archivo("partitura.pdf", 25 * MEGABYTE + 1), "PDF")).not.toBeNull();
    expect(validarAdjunto(archivo("pista.mp3", 50 * MEGABYTE + 1), "Audio")).not.toBeNull();
  });

  it("rechaza formatos no permitidos", () => {
    expect(validarAdjunto(archivo("partitura.sib", 1000), "PDF")).not.toBeNull();
    expect(validarAdjunto(archivo("pista.ogg", 1000), "Audio")).not.toBeNull();
    expect(validarAdjunto(archivo("partitura.pdf", 1000), "Audio")).not.toBeNull();
  });
});

describe("validarArchivoMaterial", () => {
  it("acepta cada formato dentro de su límite", () => {
    expect(validarArchivoMaterial(archivo("score.pdf", 25 * MEGABYTE), "pdf")).toBeNull();
    expect(validarArchivoMaterial(archivo("pista.MP3", 50 * MEGABYTE), "mp3")).toBeNull();
    expect(validarArchivoMaterial(archivo("pista.wav", 1000), "wav")).toBeNull();
  });

  it("rechaza tamaños excedidos y extensiones que no calzan con el tipo elegido", () => {
    expect(validarArchivoMaterial(archivo("score.pdf", 25 * MEGABYTE + 1), "pdf")).not.toBeNull();
    expect(validarArchivoMaterial(archivo("pista.wav", 1000), "mp3")).not.toBeNull();
    expect(validarArchivoMaterial(archivo("score.musx", 1000), "pdf")).not.toBeNull();
  });
});

describe("fotos JPEG de material y tareas", () => {
  it("acepta las extensiones JPG y JPEG hasta 25 MB en ambos formularios", () => {
    for (const nombre of ["ensayo.jpg", "ejercicio.JPEG"]) {
      const foto = archivo(nombre, 25 * MEGABYTE);
      expect(validarArchivoMaterial(foto, "jpeg")).toBeNull();
      expect(validarAdjunto(foto, "JPEG")).toBeNull();
    }
    for (const invalido of [archivo("foto.heic", 1000), archivo("foto.jpeg", 25 * MEGABYTE + 1)]) {
      expect(validarArchivoMaterial(invalido, "jpeg")).not.toBeNull();
      expect(validarAdjunto(invalido, "JPEG")).not.toBeNull();
    }
  });

  it("comprueba la firma binaria aunque el archivo no declare un tipo MIME", async () => {
    const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])]);
    await expect(validarContenidoJpeg(jpeg)).resolves.toBeUndefined();
    await expect(validarContenidoJpeg(new Blob(["texto renombrado"]))).rejects.toThrow("JPEG válido");
  });
});
