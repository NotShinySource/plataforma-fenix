import { describe, expect, it } from "vitest";
import {
  agruparPorCategoria,
  bloquesRespuesta,
  jsonLdPreguntas,
  validarPregunta,
} from "@/lib/landing/preguntas";
import { PREGUNTAS_PREDETERMINADAS } from "@/lib/landing/preguntas-predeterminadas";

describe("validarPregunta", () => {
  const base = { categoria: "Matrículas", pregunta: "¿Cuándo?", respuesta: "En marzo.", publicada: true };

  it("acepta una pregunta y limpia los espacios", () => {
    expect(validarPregunta({ ...base, categoria: "  Matrículas  e inscripciones ", respuesta: " En marzo. \r\n\r\n\r\nY julio. " })).toEqual({
      ok: true,
      valor: { categoria: "Matrículas e inscripciones", pregunta: "¿Cuándo?", respuesta: "En marzo.\n\nY julio.", publicada: true },
    });
  });

  it("rechaza campos vacíos, demasiado largos o con tipo incorrecto", () => {
    expect(validarPregunta({ ...base, categoria: " " }).ok).toBe(false);
    expect(validarPregunta({ ...base, pregunta: "" }).ok).toBe(false);
    expect(validarPregunta({ ...base, respuesta: "x".repeat(2001) }).ok).toBe(false);
    expect(validarPregunta({ ...base, publicada: "sí" }).ok).toBe(false);
    expect(validarPregunta(null).ok).toBe(false);
    expect(validarPregunta({ ...base, pregunta: 42 }).ok).toBe(false);
  });
});

describe("bloquesRespuesta", () => {
  it("une las líneas de un párrafo y separa párrafos por línea en blanco", () => {
    expect(bloquesRespuesta("Se informan durante cada\nproceso.\n\nConsulte.")).toEqual([
      { tipo: "parrafo", texto: "Se informan durante cada proceso." },
      { tipo: "parrafo", texto: "Consulte." },
    ]);
  });

  it("reconoce listas con guion", () => {
    expect(bloquesRespuesta("Entre ellas:\n- Cuerdas.\n- Vientos.\nDepende del período.")).toEqual([
      { tipo: "parrafo", texto: "Entre ellas:" },
      { tipo: "lista", elementos: ["Cuerdas.", "Vientos."] },
      { tipo: "parrafo", texto: "Depende del período." },
    ]);
  });

  it("deja el texto tal cual, sin interpretar HTML", () => {
    expect(bloquesRespuesta("<b>hola</b>")).toEqual([{ tipo: "parrafo", texto: "<b>hola</b>" }]);
  });
});

describe("agruparPorCategoria", () => {
  it("agrupa en el orden de la primera pregunta de cada categoría", () => {
    const grupos = agruparPorCategoria([
      { categoria: "B", orden: 3, id: "3" },
      { categoria: "A", orden: 1, id: "1" },
      { categoria: "B", orden: 2, id: "2" },
      { categoria: "A", orden: 4, id: "4" },
    ]);
    expect(grupos.map((g) => [g.categoria, g.preguntas.map((p) => p.id)])).toEqual([
      ["A", ["1", "4"]],
      ["B", ["2", "3"]],
    ]);
  });
});

describe("jsonLdPreguntas", () => {
  it("genera un FAQPage y no permite cerrar la etiqueta <script>", () => {
    const json = jsonLdPreguntas([{ pregunta: "¿Hola?", respuesta: "</script><script>alert(1)</script>" }]);
    expect(json).not.toContain("<");
    expect(json).not.toContain(">");
    const datos = JSON.parse(json);
    expect(datos["@type"]).toBe("FAQPage");
    expect(datos.mainEntity[0].acceptedAnswer.text).toBe("</script><script>alert(1)</script>");
  });
});

describe("preguntas predeterminadas", () => {
  it("son las 25 de la escuela, en 6 categorías, y todas pasan la validación", () => {
    expect(PREGUNTAS_PREDETERMINADAS).toHaveLength(25);
    expect(agruparPorCategoria(PREGUNTAS_PREDETERMINADAS)).toHaveLength(6);
    for (const pregunta of PREGUNTAS_PREDETERMINADAS) {
      expect(validarPregunta(pregunta).ok).toBe(true);
    }
  });
});
