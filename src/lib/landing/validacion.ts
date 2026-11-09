/**
 * Validación del contenido editable de la Landing. Funciones puras: las usa
 * el servidor (fuente de verdad, porque un Server Action es un endpoint
 * público) y se pueden probar sin Firebase.
 *
 * Todo lo que se escribe aquí termina en una página pública: por eso se
 * limitan los largos, solo se aceptan enlaces https y solo imágenes propias
 * (las incluidas en el sitio o las subidas a la carpeta landing/ de Storage).
 */
import { esFechaValida } from "@/lib/clases/calendario";
import type {
  ActuacionLanding,
  CifraLanding,
  ContenidoLanding,
  EnlaceActuacion,
  ImagenLanding,
  PilarLanding,
} from "@/types";

export const LIMITES_LANDING = {
  etiqueta: 40,
  titulo: 120,
  descripcionPortada: 400,
  parrafo: 800,
  maximoParrafos: 4,
  // Alcanza para un nombre, como "Centro de Arte Ojo del Desierto".
  cifraValor: 40,
  cifraEtiqueta: 30,
  pilarTitulo: 40,
  pilarTexto: 250,
  tituloActuacion: 100,
  lugar: 100,
  descripcionActuacion: 1000,
  maximoImagenes: 20,
  maximoEnlaces: 5,
  enlaceEtiqueta: 40,
  enlaceUrl: 500,
} as const;

/** Orígenes desde donde puede venir una imagen subida: Storage real o su emulador local. */
const ORIGENES_STORAGE = ["https://firebasestorage.googleapis.com/", "http://127.0.0.1:9199/"];

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

class ErrorValidacion extends Error {}

function texto(valor: unknown, maximo: number, campo: string, opcional = false): string {
  if (typeof valor !== "string") throw new ErrorValidacion(`${campo}: falta el texto.`);
  const limpio = valor.trim();
  if (!limpio && !opcional) throw new ErrorValidacion(`${campo}: no puede quedar vacío.`);
  if (limpio.length > maximo) {
    throw new ErrorValidacion(`${campo}: máximo ${maximo} caracteres.`);
  }
  return limpio;
}

/**
 * Una imagen es válida si es una foto incluida en el sitio (`/imagenes/...`)
 * o un archivo de la carpeta landing/ de Storage cuya URL corresponde a esa
 * ruta. Que el archivo exista lo comprueba aparte el servidor.
 */
export function esImagenValida(imagen: unknown): imagen is ImagenLanding {
  if (typeof imagen !== "object" || imagen === null) return false;
  const { url, ruta } = imagen as Record<string, unknown>;
  if (typeof url !== "string" || typeof ruta !== "string") return false;
  if (url.includes("..") || ruta.includes("..")) return false;

  if (ruta === "") return /^\/imagenes\/[\w\-./]+\.(jpe?g|png|webp)$/i.test(url);

  return (
    /^landing\/(portada|actuaciones)\/[^/]+$/.test(ruta) &&
    ORIGENES_STORAGE.some((origen) => url.startsWith(origen)) &&
    url.includes(`/o/${encodeURIComponent(ruta)}?`)
  );
}

function imagen(valor: unknown, campo: string): ImagenLanding {
  if (!esImagenValida(valor)) throw new ErrorValidacion(`${campo}: imagen no válida.`);
  return { url: valor.url, ruta: valor.ruta };
}

function cifra(valor: unknown, campo: string): CifraLanding {
  const c = (valor ?? {}) as Record<string, unknown>;
  return {
    valor: texto(c.valor, LIMITES_LANDING.cifraValor, `${campo} (valor)`),
    etiqueta: texto(c.etiqueta, LIMITES_LANDING.cifraEtiqueta, `${campo} (etiqueta)`),
  };
}

function pilar(valor: unknown, campo: string): PilarLanding {
  const p = (valor ?? {}) as Record<string, unknown>;
  return {
    titulo: texto(p.titulo, LIMITES_LANDING.pilarTitulo, `${campo} (título)`),
    texto: texto(p.texto, LIMITES_LANDING.pilarTexto, `${campo} (texto)`),
  };
}

function lista(valor: unknown, campo: string, minimo: number, maximo: number): unknown[] {
  if (!Array.isArray(valor) || valor.length < minimo || valor.length > maximo) {
    throw new ErrorValidacion(
      minimo === maximo
        ? `${campo}: deben ser exactamente ${minimo}.`
        : `${campo}: entre ${minimo} y ${maximo}.`
    );
  }
  return valor;
}

function enlace(valor: unknown, indice: number): EnlaceActuacion {
  const e = (valor ?? {}) as Record<string, unknown>;
  const campo = `Enlace ${indice + 1}`;
  const url = texto(e.url, LIMITES_LANDING.enlaceUrl, `${campo} (dirección)`);
  let valida = false;
  try {
    valida = new URL(url).protocol === "https:";
  } catch {
    valida = false;
  }
  if (!valida) throw new ErrorValidacion(`${campo}: la dirección debe empezar con https://`);
  return { etiqueta: texto(e.etiqueta, LIMITES_LANDING.enlaceEtiqueta, `${campo} (texto)`), url };
}

function validar<T>(construir: () => T): Resultado<T> {
  try {
    return { ok: true, valor: construir() };
  } catch (error) {
    if (error instanceof ErrorValidacion) return { ok: false, error: error.message };
    return { ok: false, error: "Datos con un formato inesperado." };
  }
}

/** Devuelve el contenido limpio (sin espacios sobrantes ni campos extra) o el primer error. */
export function validarContenidoLanding(entrada: unknown): Resultado<ContenidoLanding> {
  return validar(() => {
    const c = (entrada ?? {}) as Record<string, Record<string, unknown>>;
    const portada = c.portada ?? {};
    const organizacion = c.organizacion ?? {};
    const tarjetas = lista(portada.tarjetas, "Tarjetas de la portada", 2, 2);
    const cifras = lista(organizacion.cifras, "Cifras de la organización", 3, 3);
    const pilares = lista(organizacion.pilares, "Pilares de la organización", 2, 2);
    const parrafos = lista(organizacion.parrafos, "Párrafos", 1, LIMITES_LANDING.maximoParrafos);

    return {
      portada: {
        etiqueta: texto(portada.etiqueta, LIMITES_LANDING.etiqueta, "Etiqueta de la portada"),
        titulo: texto(portada.titulo, LIMITES_LANDING.titulo, "Título de la portada"),
        descripcion: texto(
          portada.descripcion,
          LIMITES_LANDING.descripcionPortada,
          "Descripción de la portada"
        ),
        imagen: imagen(portada.imagen, "Foto de la portada"),
        tarjetas: [cifra(tarjetas[0], "Tarjeta 1"), cifra(tarjetas[1], "Tarjeta 2")],
      },
      organizacion: {
        titulo: texto(organizacion.titulo, LIMITES_LANDING.titulo, "Título de la organización"),
        parrafos: parrafos.map((p, i) => texto(p, LIMITES_LANDING.parrafo, `Párrafo ${i + 1}`)),
        cifras: [cifra(cifras[0], "Cifra 1"), cifra(cifras[1], "Cifra 2"), cifra(cifras[2], "Cifra 3")],
        pilares: [pilar(pilares[0], "Pilar 1"), pilar(pilares[1], "Pilar 2")],
      },
    };
  });
}

/** Lo que el formulario envía al guardar una actuación: el orden lo asigna el servidor. */
export type DatosActuacion = Omit<ActuacionLanding, "orden">;

export function validarActuacion(entrada: unknown): Resultado<DatosActuacion> {
  return validar(() => {
    const a = (entrada ?? {}) as Record<string, unknown>;
    const fecha = texto(a.fecha, 10, "Fecha");
    if (!esFechaValida(fecha)) throw new ErrorValidacion("Fecha: no es una fecha válida.");
    if (typeof a.publicada !== "boolean") throw new ErrorValidacion("Falta indicar si está publicada.");

    const imagenes = lista(a.imagenes, "Fotos", 1, LIMITES_LANDING.maximoImagenes);
    const enlaces = lista(a.enlaces ?? [], "Enlaces", 0, LIMITES_LANDING.maximoEnlaces);

    return {
      titulo: texto(a.titulo, LIMITES_LANDING.tituloActuacion, "Título"),
      fecha,
      lugar: texto(a.lugar, LIMITES_LANDING.lugar, "Lugar"),
      descripcion: texto(a.descripcion, LIMITES_LANDING.descripcionActuacion, "Descripción"),
      imagenes: imagenes.map((img, i) => imagen(img, `Foto ${i + 1}`)),
      enlaces: enlaces.map(enlace),
      publicada: a.publicada,
    };
  });
}

/** Imágenes de Storage que estaban en `antes` y ya no están en `despues`: se pueden borrar. */
export function imagenesDescartadas(antes: ImagenLanding[], despues: ImagenLanding[]): string[] {
  const vigentes = new Set(despues.map((img) => img.ruta));
  return [...new Set(antes.map((img) => img.ruta))].filter((ruta) => ruta && !vigentes.has(ruta));
}

/**
 * Divide un texto en partes normales y destacadas: lo que va entre asteriscos
 * se destaca. "en la *comunidad* loína" → ["en la ", "comunidad", " loína"],
 * con las posiciones impares destacadas. Sin HTML: no hay forma de inyectar
 * etiquetas desde el panel.
 */
export function partesDestacadas(valor: string): { texto: string; destacado: boolean }[] {
  return valor
    .split("*")
    .map((parte, i) => ({ texto: parte, destacado: i % 2 === 1 }))
    .filter((parte) => parte.texto !== "");
}
