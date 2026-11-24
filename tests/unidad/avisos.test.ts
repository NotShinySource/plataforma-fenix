import { describe, expect, it } from "vitest";
import { compararAvisos, destinoAviso, validarAvisoDireccion } from "@/lib/avisos";

describe("validarAvisoDireccion", () => {
  const base = { titulo: " Feriado ", contenido: " No hay clases ", urgente: true };

  it("un aviso para toda la escuela no lleva grupo, aunque llegue uno", () => {
    expect(validarAvisoDireccion({ ...base, alcance: "escuela", elencoId: "e1" })).toEqual({
      ok: true,
      valor: { alcance: "escuela", elencoId: null, titulo: "Feriado", contenido: "No hay clases", urgente: true },
    });
  });

  it("un aviso de grupo exige el grupo", () => {
    expect(validarAvisoDireccion({ ...base, alcance: "elenco", elencoId: "e1" }).ok).toBe(true);
    expect(validarAvisoDireccion({ ...base, alcance: "elenco", elencoId: " " }).ok).toBe(false);
  });

  it("rechaza alcance desconocido, textos vacíos o largos y urgente sin indicar", () => {
    expect(validarAvisoDireccion({ ...base, alcance: "todos" }).ok).toBe(false);
    expect(validarAvisoDireccion({ ...base, alcance: "escuela", titulo: "" }).ok).toBe(false);
    expect(validarAvisoDireccion({ ...base, alcance: "escuela", contenido: "x".repeat(5001) }).ok).toBe(false);
    expect(validarAvisoDireccion({ ...base, alcance: "escuela", urgente: "sí" }).ok).toBe(false);
    expect(validarAvisoDireccion(null).ok).toBe(false);
  });
});

describe("orden y destino", () => {
  it("urgentes primero y luego los más nuevos", () => {
    const viejoUrgente = { urgente: true, fechaPublicacion: new Date("2026-11-01") };
    const nuevo = { urgente: false, fechaPublicacion: new Date("2026-11-20") };
    const nuevoUrgente = { urgente: true, fechaPublicacion: new Date("2026-11-21") };
    expect([nuevo, viejoUrgente, nuevoUrgente].sort(compararAvisos)).toEqual([nuevoUrgente, viejoUrgente, nuevo]);
  });

  it("muestra el grupo o 'Toda la escuela'", () => {
    expect(destinoAviso({ alcance: "escuela" }, "Coro · Niños")).toBe("Toda la escuela");
    expect(destinoAviso({ alcance: "elenco" }, "Coro · Niños")).toBe("Coro · Niños");
  });
});
