import { describe, expect, it } from "vitest";
import { limpiarRut, rutEsValido } from "@/lib/auth/rut";

describe("limpiarRut", () => {
  it("quita puntos y guion y pasa la K a minúscula", () => {
    expect(limpiarRut("12.345.678-5")).toBe("123456785");
    expect(limpiarRut("1.000.005-K")).toBe("1000005k");
  });
});

describe("rutEsValido", () => {
  it.each(["12.345.678-5", "11.111.111-1", "1.000.005-K", "1000005k", "15000000-9", "7654321-6"])(
    "acepta %s",
    (rut) => expect(rutEsValido(rut)).toBe(true)
  );

  it.each([
    ["dígito verificador incorrecto", "12.345.678-4"],
    ["K donde no corresponde", "12.345.678-K"],
    ["cuerpo demasiado corto", "123456-0"],
    ["cuerpo demasiado largo", "123.456.789-0"],
    ["letras en el cuerpo", "12.34A.678-5"],
    ["vacío", ""],
  ])("rechaza %s", (_caso, rut) => expect(rutEsValido(rut)).toBe(false));
});
