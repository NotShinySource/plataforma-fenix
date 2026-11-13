import { describe, expect, it } from "vitest";
import {
  claveGrupoEscuela,
  etiquetaTipoGrupo,
  fechaDentroDeLimites,
  limitesDeGrupo,
  nombreGrupoEscuela,
  textoPeriodoItinerancia,
  validarDatosEscuela,
  validarDatosGrupoEscuela,
  validarDatosItinerancia,
} from "@/lib/elencos";
import { fechasProgramadas } from "@/lib/clases/calendario";
import type { Clase, Semestre } from "@/types";

describe("validarDatosEscuela", () => {
  it("acepta una escuela y limpia los espacios", () => {
    expect(
      validarDatosEscuela({ nombre: "  Coro   ", tipo: "conjunto", niveles: [" Niños ", "Jóvenes"] })
    ).toEqual({ ok: true, datos: { nombre: "Coro", tipo: "conjunto", niveles: ["Niños", "Jóvenes"] } });
  });

  it("rechaza nombre vacío, tipo inválido, sin niveles o niveles repetidos", () => {
    expect(validarDatosEscuela({ nombre: " ", tipo: "conjunto", niveles: ["A"] }).ok).toBe(false);
    expect(validarDatosEscuela({ nombre: "Coro", tipo: "taller", niveles: ["A"] }).ok).toBe(false);
    expect(validarDatosEscuela({ nombre: "Coro", tipo: "conjunto", niveles: [] }).ok).toBe(false);
    expect(validarDatosEscuela({ nombre: "Coro", tipo: "conjunto", niveles: ["Niños", "niños"] }).ok).toBe(false);
    expect(validarDatosEscuela({ nombre: "Coro", tipo: "conjunto", niveles: "Inicial" }).ok).toBe(false);
  });
});

describe("grupos de escuela", () => {
  const coro = { niveles: ["Niños", "Jóvenes", "Adultos"] };

  it("arma el nombre con escuela, nivel y complemento", () => {
    expect(nombreGrupoEscuela("Coro", "Niños")).toBe("Coro · Niños");
    expect(nombreGrupoEscuela("Piano", "Inicial", "Martes")).toBe("Piano · Inicial · Martes");
  });

  it("solo acepta niveles de la escuela y los devuelve escritos como en ella", () => {
    expect(validarDatosGrupoEscuela({ nivel: "ninos" }, coro)).toEqual({ ok: true, datos: { nivel: "Niños" } });
    expect(validarDatosGrupoEscuela({ nivel: "Avanzado" }, coro).ok).toBe(false);
    expect(validarDatosGrupoEscuela({ nivel: "Niños", complemento: "  Grupo A " }, coro)).toEqual({
      ok: true,
      datos: { nivel: "Niños", complemento: "Grupo A" },
    });
  });

  it("detecta duplicados sin importar mayúsculas, tildes ni espacios", () => {
    expect(claveGrupoEscuela("es1", "Niños", "Grupo A")).toBe(claveGrupoEscuela("es1", "ninos", " grupo  a"));
    expect(claveGrupoEscuela("es1", "Niños")).not.toBe(claveGrupoEscuela("es1", "Niños", "Grupo A"));
    expect(claveGrupoEscuela("es1", "Niños")).not.toBe(claveGrupoEscuela("es2", "Niños"));
  });
});

describe("itinerancias", () => {
  it("las fechas son opcionales, pero deben ser válidas y estar en orden", () => {
    expect(validarDatosItinerancia({ nombre: "Musical" })).toEqual({ ok: true, datos: { nombre: "Musical" } });
    expect(validarDatosItinerancia({ nombre: "Musical", fechaInicio: "", fechaTermino: "2026-12-01" })).toEqual({
      ok: true,
      datos: { nombre: "Musical", fechaTermino: "2026-12-01" },
    });
    expect(validarDatosItinerancia({ nombre: "Musical", fechaInicio: "2026-12-01", fechaTermino: "2026-11-01" }).ok).toBe(false);
    expect(validarDatosItinerancia({ nombre: "Musical", fechaInicio: "2026-13-01" }).ok).toBe(false);
    expect(validarDatosItinerancia({ nombre: "  " }).ok).toBe(false);
  });

  it("muestra el período según las fechas que tenga", () => {
    expect(textoPeriodoItinerancia({ tipoGrupo: "itinerancia", fechaInicio: "2026-03-12", fechaTermino: "2026-04-30" })).toBe(
      "12 mar 2026 – 30 abr 2026"
    );
    expect(textoPeriodoItinerancia({ tipoGrupo: "itinerancia", fechaInicio: "2026-03-12" })).toBe("Desde 12 mar 2026");
    expect(textoPeriodoItinerancia({ tipoGrupo: "itinerancia" })).toBeNull();
    expect(textoPeriodoItinerancia({ tipoGrupo: "escuela", fechaInicio: "2026-03-12" })).toBeNull();
  });
});

describe("etiquetas", () => {
  it("distingue elenco, clase de instrumento e itinerancia", () => {
    expect(etiquetaTipoGrupo({ tipoGrupo: "escuela", tipoEscuela: "conjunto" })).toBe("Elenco");
    expect(etiquetaTipoGrupo({ tipoGrupo: "escuela", tipoEscuela: "instrumento" })).toBe("Clase de instrumento");
    expect(etiquetaTipoGrupo({ tipoGrupo: "itinerancia" })).toBe("Itinerancia");
  });
});

describe("límites del horario", () => {
  const semestres: Record<string, Semestre> = {
    "2026-2": { anio: 2026, numero: 2, fechaInicio: "2026-08-03", fechaFin: "2026-12-11" },
  };
  const semanal = {
    elencoId: "e1",
    fechaInicio: "2026-11-02",
    horaInicio: "17:00",
    duracionMinutos: 60,
    repeticion: { tipo: "semanal", semestreId: "2026-2" },
    fechaCreacion: new Date(),
  } as Clase;

  it("una itinerancia corta las clases semanales en su fecha de término", () => {
    const limites = limitesDeGrupo({
      activo: true,
      tipoGrupo: "itinerancia",
      fechaInicio: "2026-11-09",
      fechaTermino: "2026-11-20",
    });
    expect(fechasProgramadas(semanal, semestres, "2026-11-01", "2026-12-31", limites)).toEqual([
      "2026-11-09",
      "2026-11-16",
    ]);
  });

  it("un grupo archivado no tiene clases programadas", () => {
    const limites = limitesDeGrupo({ activo: false, tipoGrupo: "escuela" });
    expect(fechasProgramadas(semanal, semestres, "2026-11-01", "2026-12-31", limites)).toEqual([]);
    expect(fechaDentroDeLimites("2026-11-02", limites)).toBe(false);
  });

  it("un elenco de escuela sigue hasta el fin del semestre", () => {
    const limites = limitesDeGrupo({ activo: true, tipoGrupo: "escuela" });
    expect(fechasProgramadas(semanal, semestres, "2026-12-01", "2026-12-31", limites)).toEqual(["2026-12-07"]);
  });
});
