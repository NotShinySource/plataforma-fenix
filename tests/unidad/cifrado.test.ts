import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { cifrar, descifrar, identificadorDesdeRut } from "@/lib/seguridad/cifrado";
import { cifrarDatosPrivados, descifrarDatosPrivados } from "@/lib/seguridad/datos-privados";

// Claves de prueba generadas al vuelo: nunca las de .env.local ni las de producción.
function claveNueva(): string {
  return randomBytes(32).toString("base64");
}

beforeEach(() => {
  process.env.FENIX_CLAVE_HMAC = claveNueva();
  process.env.FENIX_CLAVE_CIFRADO = claveNueva();
});

describe("identificadorDesdeRut", () => {
  it("es el mismo para cualquier forma de escribir el RUT", () => {
    const esperado = identificadorDesdeRut("12345678-5");
    expect(identificadorDesdeRut("12.345.678-5")).toBe(esperado);
    expect(identificadorDesdeRut(" 12.345.678-5 ")).toBe(esperado);
    expect(identificadorDesdeRut("1000005-K")).toBe(identificadorDesdeRut("1000005-k"));
  });

  it("no contiene el RUT y tiene forma de correo interno", () => {
    const identificador = identificadorDesdeRut("12.345.678-5");
    expect(identificador).toMatch(/^[0-9a-f]{64}@fenix\.local$/);
    expect(identificador).not.toContain("12345678");
  });

  it("cambia si cambia la clave", () => {
    const antes = identificadorDesdeRut("12.345.678-5");
    process.env.FENIX_CLAVE_HMAC = claveNueva();
    expect(identificadorDesdeRut("12.345.678-5")).not.toBe(antes);
  });

  it("falla sin clave o con una clave de largo incorrecto", () => {
    delete process.env.FENIX_CLAVE_HMAC;
    expect(() => identificadorDesdeRut("12.345.678-5")).toThrow(/FENIX_CLAVE_HMAC/);
    process.env.FENIX_CLAVE_HMAC = randomBytes(16).toString("base64");
    expect(() => identificadorDesdeRut("12.345.678-5")).toThrow(/32 bytes/);
  });
});

describe("cifrar / descifrar", () => {
  it("ida y vuelta, incluidos acentos y eñes", () => {
    for (const texto of ["12.345.678-5", "apoderado@gmail.com", "Muñoz Peña", ""]) {
      expect(descifrar(cifrar(texto))).toBe(texto);
    }
  });

  it("el mismo texto se cifra distinto cada vez (IV aleatorio)", () => {
    expect(cifrar("12.345.678-5")).not.toBe(cifrar("12.345.678-5"));
  });

  it("detecta un dato alterado", () => {
    const cifrado = cifrar("12.345.678-5");
    // Un carácter del medio (dentro del IV): el último puede caer en bits de relleno de base64.
    const posicion = 8;
    const reemplazo = cifrado[posicion] === "A" ? "B" : "A";
    const alterado = cifrado.slice(0, posicion) + reemplazo + cifrado.slice(posicion + 1);
    expect(() => descifrar(alterado)).toThrow(/alterado o clave incorrecta/);
  });

  it("no descifra con otra clave", () => {
    const cifrado = cifrar("12.345.678-5");
    process.env.FENIX_CLAVE_CIFRADO = claveNueva();
    expect(() => descifrar(cifrado)).toThrow(/alterado o clave incorrecta/);
  });

  it("rechaza formatos desconocidos o incompletos", () => {
    expect(() => descifrar("texto plano")).toThrow(/no reconocido/);
    expect(() => descifrar("v2:abc")).toThrow(/no reconocido/);
    expect(() => descifrar("v1:abc")).toThrow(/incompleto/);
  });
});

describe("cifrarDatosPrivados / descifrarDatosPrivados", () => {
  it("cifra cada campo y omite los opcionales ausentes", () => {
    const guardado = cifrarDatosPrivados({ rut: "12.345.678-5", fechaNacimiento: "2012-05-17" });
    expect(Object.keys(guardado).sort()).toEqual(["fechaNacimientoCifrada", "rutCifrado"]);
    expect(JSON.stringify(guardado)).not.toContain("12.345.678-5");
    expect(descifrarDatosPrivados(guardado)).toEqual({
      rut: "12.345.678-5",
      fechaNacimiento: "2012-05-17",
    });
  });

  it("conserva los correos", () => {
    const datos = {
      rut: "12.345.678-5",
      email: "alumno@gmail.com",
      emailApoderado: "apoderado@gmail.com",
      fechaNacimiento: "2012-05-17",
    };
    expect(descifrarDatosPrivados(cifrarDatosPrivados(datos))).toEqual(datos);
  });

  it("falla si falta un campo obligatorio", () => {
    expect(() => descifrarDatosPrivados({ rutCifrado: cifrar("12.345.678-5") })).toThrow(/incompleto/);
  });
});
