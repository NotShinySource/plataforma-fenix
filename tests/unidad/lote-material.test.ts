import { describe, expect, it } from "vitest";
import {
  MAXIMO_ARCHIVOS_LOTE,
  carpetaDelArchivo,
  claveArchivo,
  prepararLote,
  tipoDesdeNombre,
  tituloDesdeNombre,
} from "@/lib/material/lote";

const MB = 1024 * 1024;

function archivo(name: string, size = 1 * MB, webkitRelativePath = "") {
  return { name, size, webkitRelativePath };
}

describe("tipoDesdeNombre", () => {
  it("reconoce los formatos admitidos sin importar mayúsculas", () => {
    expect(tipoDesdeNombre("Score.PDF")).toBe("pdf");
    expect(tipoDesdeNombre("pista.mp3")).toBe("mp3");
    expect(tipoDesdeNombre("pista.Wav")).toBe("wav");
    expect(tipoDesdeNombre("foto.jpg")).toBe("jpeg");
    expect(tipoDesdeNombre("foto.JPEG")).toBe("jpeg");
  });

  it("rechaza formatos de edición y otros", () => {
    expect(tipoDesdeNombre("partitura.sib")).toBeNull();
    expect(tipoDesdeNombre("partitura.musx")).toBeNull();
    expect(tipoDesdeNombre("foto.png")).toBeNull();
    expect(tipoDesdeNombre("sin-extension")).toBeNull();
  });
});

describe("tituloDesdeNombre", () => {
  it("quita la extensión y los guiones bajos", () => {
    expect(tituloDesdeNombre("Sinfonia_del_Desierto - Violin 1.pdf")).toBe("Sinfonia del Desierto - Violin 1");
  });

  it("respeta el largo máximo del título", () => {
    expect(tituloDesdeNombre(`${"a".repeat(200)}.pdf`)).toHaveLength(150);
  });
});

describe("carpetaDelArchivo", () => {
  it("devuelve la carpeta inmediata", () => {
    expect(carpetaDelArchivo("Repertorio/Partituras/obra.pdf")).toBe("Partituras");
    expect(carpetaDelArchivo("Repertorio/obra.pdf")).toBe("Repertorio");
  });

  it("devuelve null si el archivo se eligió suelto", () => {
    expect(carpetaDelArchivo("")).toBeNull();
    expect(carpetaDelArchivo(undefined)).toBeNull();
    expect(carpetaDelArchivo("obra.pdf")).toBeNull();
  });
});

describe("prepararLote", () => {
  it("acepta los válidos y explica cada rechazo", () => {
    const { aceptados, rechazados } = prepararLote(
      [archivo("obra.pdf"), archivo("obra.sib"), archivo("enorme.pdf", 30 * MB), archivo("pista.mp3", 40 * MB)],
      "Partitura",
    );
    expect(aceptados.map((a) => [a.archivo.name, a.tipo, a.categoria])).toEqual([
      ["obra.pdf", "pdf", "Partitura"],
      ["pista.mp3", "mp3", "Partitura"],
    ]);
    expect(rechazados.map((r) => r.nombre)).toEqual(["obra.sib", "enorme.pdf"]);
  });

  it("ignora en silencio los archivos del sistema operativo", () => {
    const { aceptados, rechazados } = prepararLote(
      [archivo(".DS_Store"), archivo("Thumbs.db"), archivo("desktop.ini"), archivo("obra.pdf")],
      "",
    );
    expect(aceptados).toHaveLength(1);
    expect(rechazados).toHaveLength(0);
  });

  it("sin categoría escrita usa la carpeta de cada archivo, o General", () => {
    const { aceptados } = prepararLote(
      [archivo("a.pdf", MB, "Repertorio/Partituras/a.pdf"), archivo("b.mp3", MB, "Repertorio/Pistas/b.mp3"), archivo("c.pdf")],
      "  ",
    );
    expect(aceptados.map((a) => a.categoria)).toEqual(["Partituras", "Pistas", "General"]);
  });

  it("la categoría escrita manda sobre la carpeta", () => {
    const { aceptados } = prepararLote([archivo("a.pdf", MB, "Repertorio/Partituras/a.pdf")], "Concierto");
    expect(aceptados[0].categoria).toBe("Concierto");
  });

  it("omite lo ya publicado y lo repetido en la selección", () => {
    const publicados = new Set([claveArchivo("obra.pdf", MB)]);
    const { aceptados, rechazados } = prepararLote(
      [archivo("obra.pdf"), archivo("nueva.pdf"), archivo("nueva.pdf")],
      "",
      publicados,
    );
    expect(aceptados.map((a) => a.archivo.name)).toEqual(["nueva.pdf"]);
    expect(rechazados.map((r) => r.motivo)).toEqual([
      "Ya está publicado en este elenco.",
      "Está repetido en la selección.",
    ]);
  });

  it("un archivo con el mismo nombre pero otro tamaño no se omite", () => {
    const publicados = new Set([claveArchivo("obra.pdf", MB)]);
    const { aceptados } = prepararLote([archivo("obra.pdf", 2 * MB)], "", publicados);
    expect(aceptados).toHaveLength(1);
  });

  it("aplica el tope de archivos por lote", () => {
    const muchos = Array.from({ length: MAXIMO_ARCHIVOS_LOTE + 3 }, (_, i) => archivo(`obra-${i}.pdf`, 1000));
    const { aceptados, rechazados } = prepararLote(muchos, "");
    expect(aceptados).toHaveLength(MAXIMO_ARCHIVOS_LOTE);
    expect(rechazados).toHaveLength(3);
  });

  it("aplica el tope de 300 MB por lote", () => {
    const audios = Array.from({ length: 8 }, (_, i) => archivo(`pista-${i}.wav`, 45 * MB));
    const { aceptados, rechazados } = prepararLote(audios, "");
    expect(aceptados).toHaveLength(6);
    expect(rechazados).toHaveLength(2);
  });
});
