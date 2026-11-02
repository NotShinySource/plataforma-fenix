import { describe, expect, it } from "vitest";
import { enmascararEmail, enmascararRut } from "@/lib/seguridad/enmascarar";

describe("enmascararRut", () => {
  it("deja visibles solo los tres últimos dígitos y el verificador", () => {
    expect(enmascararRut("12.345.678-5")).toBe("••.•••.678-5");
    expect(enmascararRut("12345678-5")).toBe("••.•••.678-5");
  });

  it("acepta cuerpos de 7 dígitos y la K", () => {
    expect(enmascararRut("1.000.005-k")).toBe("•.•••.005-K");
  });

  it("no muestra nada de un valor demasiado corto", () => {
    expect(enmascararRut("12-3")).toBe("•••");
  });
});

describe("enmascararEmail", () => {
  it("muestra dos letras y el dominio, con puntos fijos", () => {
    expect(enmascararEmail("apoderado@gmail.com")).toBe("ap•••••@gmail.com");
    // Mismo largo enmascarado aunque la dirección sea mucho más larga.
    expect(enmascararEmail("unadireccionmuylarga@gmail.com")).toBe("un•••••@gmail.com");
  });

  it("con dos letras o menos muestra solo la primera", () => {
    expect(enmascararEmail("ab@x.cl")).toBe("a•••••@x.cl");
  });

  it("no expone un valor sin formato de correo", () => {
    expect(enmascararEmail("sin-arroba")).toBe("•••••");
  });
});
