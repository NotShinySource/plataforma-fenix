import { describe, expect, it } from "vitest";
import { ACTUACIONES_PREDETERMINADAS, CONTENIDO_PREDETERMINADO } from "@/lib/landing/predeterminado";
import {
  esImagenValida,
  imagenesDescartadas,
  partesDestacadas,
  validarActuacion,
  validarContenidoLanding,
} from "@/lib/landing/validacion";
import { validarImagenLanding } from "@/lib/validacion";

const STORAGE = "https://firebasestorage.googleapis.com/v0/b/fenix.appspot.com/o";
const subida = (ruta: string) => ({
  ruta,
  url: `${STORAGE}/${encodeURIComponent(ruta)}?alt=media&token=abc`,
});

function actuacion(cambios: Record<string, unknown> = {}) {
  return {
    titulo: "Concierto",
    fecha: "2026-12-13",
    lugar: "Parque Loa",
    descripcion: "Concierto de fin de año.",
    imagenes: [subida("landing/actuaciones/1_foto.jpg")],
    enlaces: [],
    publicada: true,
    ...cambios,
  };
}

describe("contenido predeterminado", () => {
  it("pasa su propia validación (es lo que se copia a Firestore)", () => {
    expect(validarContenidoLanding(CONTENIDO_PREDETERMINADO).ok).toBe(true);
    for (const a of ACTUACIONES_PREDETERMINADAS) expect(validarActuacion(a)).toMatchObject({ ok: true });
  });
});

describe("esImagenValida", () => {
  it("acepta fotos del sitio y archivos de landing/ en Storage", () => {
    expect(esImagenValida({ url: "/imagenes/inicio/principal.jpg", ruta: "" })).toBe(true);
    expect(esImagenValida(subida("landing/portada/123_foto.webp"))).toBe(true);
  });

  it("rechaza imágenes de otros sitios, de otras carpetas o con rutas tramposas", () => {
    expect(esImagenValida({ url: "https://sitio-falso.cl/foto.jpg", ruta: "" })).toBe(false);
    expect(esImagenValida(subida("elencos/e1/pdf/partitura.pdf"))).toBe(false);
    expect(esImagenValida({ url: "/imagenes/../../secreto.jpg", ruta: "" })).toBe(false);
    expect(esImagenValida({ url: `${STORAGE}/otra.jpg?alt=media`, ruta: "landing/portada/foto.jpg" })).toBe(false);
    expect(esImagenValida({ url: "javascript:alert(1)", ruta: "" })).toBe(false);
  });
});

describe("validarContenidoLanding", () => {
  it("recorta espacios y descarta campos que no existen", () => {
    const entrada = structuredClone(CONTENIDO_PREDETERMINADO) as unknown as Record<string, Record<string, unknown>>;
    entrada.portada.titulo = "  Título con espacios  ";
    entrada.portada.extra = "no debería guardarse";
    const resultado = validarContenidoLanding(entrada);
    expect(resultado.ok && resultado.valor.portada.titulo).toBe("Título con espacios");
    expect(resultado.ok && "extra" in resultado.valor.portada).toBe(false);
  });

  it("rechaza textos vacíos, demasiado largos o con la cantidad equivocada de cifras", () => {
    const vacio = structuredClone(CONTENIDO_PREDETERMINADO);
    vacio.portada.titulo = "   ";
    expect(validarContenidoLanding(vacio)).toMatchObject({ ok: false });

    const largo = structuredClone(CONTENIDO_PREDETERMINADO);
    largo.organizacion.parrafos = ["x".repeat(801)];
    expect(validarContenidoLanding(largo)).toMatchObject({ ok: false });

    const cifras = structuredClone(CONTENIDO_PREDETERMINADO) as unknown as { organizacion: { cifras: unknown[] } };
    cifras.organizacion.cifras.pop();
    expect(validarContenidoLanding(cifras)).toMatchObject({ ok: false });

    expect(validarContenidoLanding(null)).toMatchObject({ ok: false });
  });
});

describe("validarActuacion", () => {
  it("acepta una actuación completa", () => {
    expect(validarActuacion(actuacion({ enlaces: [{ etiqueta: "Video", url: "https://youtu.be/x" }] }))).toMatchObject({
      ok: true,
    });
  });

  it("exige al menos una foto, una fecha real y enlaces https", () => {
    expect(validarActuacion(actuacion({ imagenes: [] }))).toMatchObject({ ok: false });
    expect(validarActuacion(actuacion({ fecha: "2026-02-30" }))).toMatchObject({ ok: false });
    expect(
      validarActuacion(actuacion({ enlaces: [{ etiqueta: "Video", url: "http://sitio.cl" }] }))
    ).toMatchObject({ ok: false });
    expect(
      validarActuacion(actuacion({ enlaces: [{ etiqueta: "Truco", url: "javascript:alert(1)" }] }))
    ).toMatchObject({ ok: false });
  });

  it("limita la cantidad de fotos y enlaces", () => {
    const fotos = Array.from({ length: 21 }, (_, i) => subida(`landing/actuaciones/${i}.jpg`));
    expect(validarActuacion(actuacion({ imagenes: fotos }))).toMatchObject({ ok: false });
  });
});

describe("imagenesDescartadas", () => {
  it("devuelve solo las de Storage que dejaron de usarse", () => {
    const a = subida("landing/actuaciones/a.jpg");
    const b = subida("landing/actuaciones/b.jpg");
    const local = { url: "/imagenes/x.jpg", ruta: "" };
    expect(imagenesDescartadas([a, b, local], [b])).toEqual(["landing/actuaciones/a.jpg"]);
  });
});

describe("partesDestacadas", () => {
  it("destaca lo que va entre asteriscos", () => {
    expect(partesDestacadas("en la *comunidad* loína")).toEqual([
      { texto: "en la ", destacado: false },
      { texto: "comunidad", destacado: true },
      { texto: " loína", destacado: false },
    ]);
    expect(partesDestacadas("sin destacados")).toEqual([{ texto: "sin destacados", destacado: false }]);
  });
});

describe("validarImagenLanding", () => {
  const archivo = (name: string, size: number) => ({ name, size }) as File;
  it("acepta JPG, PNG y WebP de hasta 5 MB", () => {
    expect(validarImagenLanding(archivo("foto.JPG", 5 * 1024 * 1024))).toBeNull();
    expect(validarImagenLanding(archivo("foto.webp", 1000))).toBeNull();
  });
  it("rechaza otros formatos y tamaños mayores", () => {
    expect(validarImagenLanding(archivo("foto.gif", 1000))).not.toBeNull();
    expect(validarImagenLanding(archivo("foto.png", 5 * 1024 * 1024 + 1))).not.toBeNull();
  });
});
