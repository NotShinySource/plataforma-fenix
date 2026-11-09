import { describe, expect, it } from "vitest";
import { destinoTrasLogin, rolRequeridoParaRuta } from "@/lib/auth/rutas";

describe("rolRequeridoParaRuta", () => {
  it("reconoce el área de cada rol", () => {
    expect(rolRequeridoParaRuta("/alumno")).toBe("alumno");
    expect(rolRequeridoParaRuta("/profesor/clases/abc")).toBe("profesor");
    expect(rolRequeridoParaRuta("/admin/usuarios")).toBe("administrador");
  });

  it("no confunde rutas que solo empiezan parecido", () => {
    expect(rolRequeridoParaRuta("/administracion")).toBeNull();
    expect(rolRequeridoParaRuta("/alumnos-destacados")).toBeNull();
    expect(rolRequeridoParaRuta("/")).toBeNull();
  });
});

describe("destinoTrasLogin", () => {
  it("vuelve a la página que se quería visitar si es del área del rol", () => {
    expect(destinoTrasLogin("profesor", "/profesor/tareas")).toBe("/profesor/tareas");
  });

  it("si la página es de otro rol, va al panel propio", () => {
    expect(destinoTrasLogin("alumno", "/admin/usuarios")).toBe("/alumno");
  });

  it("nunca redirige fuera del sitio", () => {
    expect(destinoTrasLogin("alumno", "https://sitio-falso.cl/alumno")).toBe("/alumno");
    expect(destinoTrasLogin("alumno", "//sitio-falso.cl/alumno")).toBe("/alumno");
    expect(destinoTrasLogin("alumno", null)).toBe("/alumno");
  });
});
