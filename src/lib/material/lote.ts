import {
  LONGITUD_MAXIMA_CATEGORIA_MATERIAL,
  LONGITUD_MAXIMA_TITULO_MATERIAL,
  validarArchivoMaterial,
} from "@/lib/validacion";
import type { TipoArchivo } from "@/types";

/**
 * Subida de varios archivos o de una carpeta completa de material.
 * Funciones puras: deciden qué se sube y con qué datos, sin tocar Firebase.
 */

const MEGABYTE = 1024 * 1024;

/** Tope por lote, para que una carpeta equivocada no llene el almacenamiento. */
export const MAXIMO_ARCHIVOS_LOTE = 30;
export const MAXIMO_BYTES_LOTE = 300 * MEGABYTE;

/** Lo mínimo de un File que se necesita (permite probar sin navegador). */
export interface ArchivoDeLote {
  name: string;
  size: number;
  /** Ruta dentro de la carpeta elegida ("Carpeta/Sub/archivo.pdf"); vacía si no vino de una carpeta. */
  webkitRelativePath?: string;
}

export interface ArchivoAceptado<T extends ArchivoDeLote> {
  archivo: T;
  tipo: TipoArchivo;
  titulo: string;
  categoria: string;
}

export interface ArchivoRechazado {
  nombre: string;
  motivo: string;
}

export interface ResultadoLote<T extends ArchivoDeLote> {
  aceptados: ArchivoAceptado<T>[];
  rechazados: ArchivoRechazado[];
}

/** Archivos que crean los sistemas operativos dentro de las carpetas; se ignoran sin avisar. */
function esArchivoDeSistema(nombre: string): boolean {
  const minusculas = nombre.toLowerCase();
  return minusculas.startsWith(".") || minusculas === "thumbs.db" || minusculas === "desktop.ini";
}

/** Tipo de material según la extensión, o null si no es un formato admitido. */
export function tipoDesdeNombre(nombre: string): TipoArchivo | null {
  const minusculas = nombre.toLowerCase();
  if (minusculas.endsWith(".pdf")) return "pdf";
  if (minusculas.endsWith(".mp3")) return "mp3";
  if (minusculas.endsWith(".wav")) return "wav";
  if (minusculas.endsWith(".jpg") || minusculas.endsWith(".jpeg")) return "jpeg";
  return null;
}

/** Título legible a partir del nombre: sin extensión y con espacios en vez de guiones bajos. */
export function tituloDesdeNombre(nombre: string): string {
  const sinExtension = nombre.replace(/\.[^.]+$/, "");
  const legible = sinExtension.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return (legible || nombre).slice(0, LONGITUD_MAXIMA_TITULO_MATERIAL);
}

/** Nombre de la carpeta que contiene al archivo, o null si se eligió suelto. */
export function carpetaDelArchivo(rutaRelativa: string | undefined): string | null {
  if (!rutaRelativa) return null;
  const partes = rutaRelativa.split("/").filter(Boolean);
  return partes.length >= 2 ? partes[partes.length - 2] : null;
}

/** Clave para reconocer un archivo ya publicado: mismo nombre y mismo tamaño. */
export function claveArchivo(nombre: string, tamanioBytes: number): string {
  return `${nombre.toLowerCase()}|${tamanioBytes}`;
}

/**
 * Clasifica los archivos elegidos.
 * - La categoría escrita se aplica a todos; si se dejó vacía, cada archivo
 *   toma el nombre de su carpeta, y si no tiene, "General".
 * - Se omiten los que ya están publicados (mismo nombre y tamaño), para poder
 *   volver a subir una carpeta a la que solo se le agregaron archivos.
 * - Los que no caben en los topes del lote se rechazan con su motivo.
 */
export function prepararLote<T extends ArchivoDeLote>(
  archivos: readonly T[],
  categoriaEscrita: string,
  yaPublicados: ReadonlySet<string> = new Set(),
): ResultadoLote<T> {
  const aceptados: ArchivoAceptado<T>[] = [];
  const rechazados: ArchivoRechazado[] = [];
  const vistosEnLote = new Set<string>();
  const categoriaComun = categoriaEscrita.trim().slice(0, LONGITUD_MAXIMA_CATEGORIA_MATERIAL);
  let bytesAceptados = 0;

  for (const archivo of archivos) {
    if (esArchivoDeSistema(archivo.name)) continue;

    const tipo = tipoDesdeNombre(archivo.name);
    if (!tipo) {
      rechazados.push({ nombre: archivo.name, motivo: "Formato no admitido (solo PDF, MP3, WAV o JPG)." });
      continue;
    }

    const problema = validarArchivoMaterial(archivo, tipo);
    if (problema) {
      rechazados.push({ nombre: archivo.name, motivo: problema });
      continue;
    }

    const clave = claveArchivo(archivo.name, archivo.size);
    if (yaPublicados.has(clave)) {
      rechazados.push({ nombre: archivo.name, motivo: "Ya está publicado en este elenco." });
      continue;
    }
    if (vistosEnLote.has(clave)) {
      rechazados.push({ nombre: archivo.name, motivo: "Está repetido en la selección." });
      continue;
    }

    if (aceptados.length >= MAXIMO_ARCHIVOS_LOTE) {
      rechazados.push({ nombre: archivo.name, motivo: `Se suben hasta ${MAXIMO_ARCHIVOS_LOTE} archivos por vez.` });
      continue;
    }
    if (bytesAceptados + archivo.size > MAXIMO_BYTES_LOTE) {
      rechazados.push({ nombre: archivo.name, motivo: "Supera los 300 MB por lote. Súbelo en otra tanda." });
      continue;
    }

    vistosEnLote.add(clave);
    bytesAceptados += archivo.size;
    const carpeta = carpetaDelArchivo(archivo.webkitRelativePath);
    aceptados.push({
      archivo,
      tipo,
      titulo: tituloDesdeNombre(archivo.name),
      categoria:
        categoriaComun ||
        (carpeta ? carpeta.trim().slice(0, LONGITUD_MAXIMA_CATEGORIA_MATERIAL) : "") ||
        "General",
    });
  }

  return { aceptados, rechazados };
}
