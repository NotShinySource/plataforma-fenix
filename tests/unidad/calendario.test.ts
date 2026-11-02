import { describe, expect, it } from "vitest";
import {
  construirOcurrencias,
  diaSemana,
  esFechaValida,
  esHoraValida,
  fechasProgramadas,
  formatearDuracion,
  formatearFechaLegible,
  hoyEnChile,
  semanasDelMes,
  sumarDias,
  sumarMinutos,
} from "@/lib/clases/calendario";
import type { Clase, ConId, Semestre, SesionClase } from "@/types";

const SEMESTRES: Record<string, Semestre> = {
  "2026-1": { anio: 2026, numero: 1, fechaInicio: "2026-03-02", fechaFin: "2026-03-31" },
};

function clase(datos: Partial<ConId<Clase>> = {}): ConId<Clase> {
  return {
    id: "c1",
    elencoId: "e1",
    fechaInicio: "2026-03-02", // lunes
    horaInicio: "17:00",
    duracionMinutos: 60,
    repeticion: { tipo: "semanal", semestreId: "2026-1" },
    fechaCreacion: new Date(),
    ...datos,
  };
}

function sesion(datos: Partial<ConId<SesionClase>>): ConId<SesionClase> {
  return {
    id: "c1_2026-03-09",
    claseId: "c1",
    elencoId: "e1",
    fechaProgramada: "2026-03-09",
    fecha: "2026-03-09",
    horaInicio: "17:00",
    duracionMinutos: 60,
    estado: "programada",
    fechaActualizacion: new Date(),
    ...datos,
  };
}

describe("validación de fecha y hora", () => {
  it("fechas", () => {
    expect(esFechaValida("2026-03-02")).toBe(true);
    expect(esFechaValida("2026-02-30")).toBe(false);
    expect(esFechaValida("2026-3-2")).toBe(false);
  });

  it("horas", () => {
    expect(esHoraValida("00:00")).toBe(true);
    expect(esHoraValida("23:59")).toBe(true);
    expect(esHoraValida("24:00")).toBe(false);
    expect(esHoraValida("9:30")).toBe(false);
  });
});

describe("aritmética de días", () => {
  it("cruza meses, años y bisiestos", () => {
    expect(sumarDias("2026-01-31", 1)).toBe("2026-02-01");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2028-02-28", 1)).toBe("2028-02-29");
    expect(sumarDias("2026-03-02", -7)).toBe("2026-02-23");
  });

  it("no se corre con los cambios de horario de Chile (abril y septiembre)", () => {
    expect(sumarDias("2026-04-04", 1)).toBe("2026-04-05");
    expect(sumarDias("2026-09-05", 1)).toBe("2026-09-06");
  });

  it("diaSemana usa 0 = lunes", () => {
    expect(diaSemana("2026-03-02")).toBe(0);
    expect(diaSemana("2026-03-08")).toBe(6);
  });
});

describe("hoyEnChile", () => {
  it("usa la fecha de Chile aunque en UTC ya sea el día siguiente", () => {
    // 23:30 del 1 de noviembre en Chile (UTC-3 en horario de verano).
    expect(hoyEnChile(new Date("2026-11-02T02:30:00Z"))).toBe("2026-11-01");
    expect(hoyEnChile(new Date("2026-11-02T03:30:00Z"))).toBe("2026-11-02");
  });
});

describe("horas y duraciones", () => {
  it("sumarMinutos da la vuelta a medianoche", () => {
    expect(sumarMinutos("15:30", 90)).toBe("17:00");
    expect(sumarMinutos("23:30", 45)).toBe("00:15");
  });

  it("formatearDuracion", () => {
    expect(formatearDuracion(45)).toBe("45 min");
    expect(formatearDuracion(60)).toBe("1 h");
    expect(formatearDuracion(90)).toBe("1 h 30 min");
  });
});

describe("fechasProgramadas", () => {
  it("una clase semanal se repite hasta el fin de su semestre", () => {
    expect(fechasProgramadas(clase(), SEMESTRES, "2026-01-01", "2026-12-31")).toEqual([
      "2026-03-02",
      "2026-03-09",
      "2026-03-16",
      "2026-03-23",
      "2026-03-30",
    ]);
  });

  it("respeta el rango pedido aunque empiece a mitad de semana", () => {
    expect(fechasProgramadas(clase(), SEMESTRES, "2026-03-10", "2026-03-24")).toEqual([
      "2026-03-16",
      "2026-03-23",
    ]);
  });

  it("si se corrige el fin del semestre, la serie se ajusta sola", () => {
    const acortado = { "2026-1": { ...SEMESTRES["2026-1"], fechaFin: "2026-03-15" } };
    expect(fechasProgramadas(clase(), acortado, "2026-01-01", "2026-12-31")).toEqual([
      "2026-03-02",
      "2026-03-09",
    ]);
  });

  it("sin su semestre, una clase semanal no tiene fechas", () => {
    expect(fechasProgramadas(clase(), {}, "2026-01-01", "2026-12-31")).toEqual([]);
  });

  it("una clase única ocurre solo en su fecha", () => {
    const unica = clase({ repeticion: { tipo: "unica" }, fechaInicio: "2026-03-10" });
    expect(fechasProgramadas(unica, {}, "2026-03-01", "2026-03-31")).toEqual(["2026-03-10"]);
    expect(fechasProgramadas(unica, {}, "2026-03-11", "2026-03-31")).toEqual([]);
  });

  it("una fecha que no es de la serie no se considera ocurrencia", () => {
    // Así valida el servidor que no se inicie una clase en un día inventado.
    expect(fechasProgramadas(clase(), SEMESTRES, "2026-03-10", "2026-03-10")).toEqual([]);
    expect(fechasProgramadas(clase(), SEMESTRES, "2026-03-09", "2026-03-09")).toEqual(["2026-03-09"]);
  });
});

describe("construirOcurrencias", () => {
  const rango = ["2026-03-01", "2026-03-31"] as const;

  it("sin sesiones, cada fecha de la serie es una ocurrencia programada", () => {
    const ocurrencias = construirOcurrencias([clase()], [], SEMESTRES, ...rango);
    expect(ocurrencias.map((o) => o.fecha)).toHaveLength(5);
    expect(ocurrencias.every((o) => o.estado === "programada")).toBe(true);
  });

  it("una sesión movida aparece en su fecha nueva y no en la original", () => {
    const movida = sesion({ fecha: "2026-03-11", horaInicio: "18:00" });
    const ocurrencias = construirOcurrencias([clase()], [movida], SEMESTRES, ...rango);
    const fechas = ocurrencias.map((o) => o.fecha);
    expect(fechas).toContain("2026-03-11");
    expect(fechas).not.toContain("2026-03-09");
    expect(ocurrencias.find((o) => o.fecha === "2026-03-11")?.fechaProgramada).toBe("2026-03-09");
  });

  it("una sesión cancelada conserva su estado", () => {
    const cancelada = sesion({ estado: "cancelada" });
    const ocurrencias = construirOcurrencias([clase()], [cancelada], SEMESTRES, ...rango);
    expect(ocurrencias.find((o) => o.fecha === "2026-03-09")?.estado).toBe("cancelada");
  });

  it("una clase dictada sobrevive aunque se elimine su serie", () => {
    const realizada = sesion({ estado: "realizada" });
    const ocurrencias = construirOcurrencias([], [realizada], SEMESTRES, ...rango);
    expect(ocurrencias).toHaveLength(1);
    expect(ocurrencias[0].clase).toBeUndefined();
  });

  it("queda ordenada por fecha y hora", () => {
    const temprano = clase({ id: "c2", horaInicio: "09:00" });
    const ocurrencias = construirOcurrencias([clase(), temprano], [], SEMESTRES, "2026-03-02", "2026-03-02");
    expect(ocurrencias.map((o) => o.claseId)).toEqual(["c2", "c1"]);
  });
});

describe("semanasDelMes", () => {
  it("cubre el mes completo con semanas de lunes a domingo", () => {
    const marzo = semanasDelMes(2026, 3);
    expect(marzo[0][0]).toBe("2026-02-23");
    expect(marzo.at(-1)?.at(-1)).toBe("2026-04-05");
    expect(marzo).toHaveLength(6);
    expect(marzo.every((semana) => semana.length === 7 && diaSemana(semana[0]) === 0)).toBe(true);
  });

  it("no agrega una semana de más cuando el mes termina en domingo", () => {
    const febrero = semanasDelMes(2026, 2);
    expect(febrero.at(-1)?.at(-1)).toBe("2026-03-01");
    expect(febrero).toHaveLength(5);
  });

  it("funciona con diciembre", () => {
    const diciembre = semanasDelMes(2026, 12);
    expect(diciembre.at(-1)?.at(-1)).toBe("2027-01-03");
  });
});

describe("formatearFechaLegible", () => {
  it("da día de la semana y mes en palabras", () => {
    expect(formatearFechaLegible("2026-03-10")).toBe("martes 10 de marzo");
  });
});
