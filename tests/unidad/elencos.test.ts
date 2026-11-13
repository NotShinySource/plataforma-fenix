import { describe, expect, it } from "vitest";
import { etiquetaTipoGrupo, validarTipoGrupo } from "@/lib/elencos";

describe("validarTipoGrupo", () => {
  it("acepta un elenco con su tipo y descarta el instrumento", () => {
    expect(
      validarTipoGrupo({ categoria: "elenco", tipoElenco: "Banda", instrumento: "Piano" })
    ).toEqual({ ok: true, datos: { categoria: "elenco", tipoElenco: "Banda" } });
  });

  it("acepta una clase de instrumento y descarta el tipo de elenco", () => {
    expect(
      validarTipoGrupo({ categoria: "instrumento", instrumento: "Guitarra", tipoElenco: "Banda" })
    ).toEqual({ ok: true, datos: { categoria: "instrumento", instrumento: "Guitarra" } });
  });

  it("rechaza valores fuera de las listas", () => {
    expect(validarTipoGrupo({ categoria: "taller", tipoElenco: "Banda" }).ok).toBe(false);
    expect(validarTipoGrupo({ categoria: "elenco", tipoElenco: "Piano" }).ok).toBe(false);
    expect(validarTipoGrupo({ categoria: "elenco" }).ok).toBe(false);
    expect(validarTipoGrupo({ categoria: "instrumento", instrumento: "Banda" }).ok).toBe(false);
    expect(validarTipoGrupo({ categoria: "instrumento" }).ok).toBe(false);
  });
});

describe("etiquetaTipoGrupo", () => {
  it("muestra el tipo del elenco o la clase de instrumento", () => {
    expect(etiquetaTipoGrupo({ categoria: "elenco", tipoElenco: "Folklore" })).toBe("Folklore");
    expect(etiquetaTipoGrupo({ categoria: "instrumento", instrumento: "Piano" })).toBe(
      "Clase de piano"
    );
  });

  it("tiene un texto de respaldo si falta el tipo", () => {
    expect(etiquetaTipoGrupo({ categoria: "elenco" })).toBe("Elenco");
    expect(etiquetaTipoGrupo({ categoria: "instrumento" })).toBe("Clase de instrumento");
  });
});
