import { describe, expect, it } from "vitest";
import { destinoTrasLogin, puedeEntrarA, rolRequeridoParaRuta } from "@/lib/auth/rutas";

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

describe("puedeEntrarA", () => {
  it("cada rol entra a su área y a las rutas públicas", () => {
    expect(puedeEntrarA("alumno", "alumno")).toBe(true);
    expect(puedeEntrarA("profesor", "profesor")).toBe(true);
    expect(puedeEntrarA("administrador", "administrador")).toBe(true);
    expect(puedeEntrarA("alumno", null)).toBe(true);
  });

  it("la Dirección entra además al área docente, y nadie más cruza de área", () => {
    expect(puedeEntrarA("administrador", "profesor")).toBe(true);
    expect(puedeEntrarA("administrador", "alumno")).toBe(false);
    expect(puedeEntrarA("profesor", "administrador")).toBe(false);
    expect(puedeEntrarA("profesor", "alumno")).toBe(false);
    expect(puedeEntrarA("alumno", "profesor")).toBe(false);
    expect(puedeEntrarA("alumno", "administrador")).toBe(false);
  });
});

describe("destinoTrasLogin", () => {
  it("la Dirección vuelve a una ruta docente si venía de ahí", () => {
    expect(destinoTrasLogin("administrador", "/profesor/clases")).toBe("/profesor/clases");
  });

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
