import { formatearFechaNumerica } from "@/lib/clases/calendario";
import type { ConId, SesionClase } from "@/types";

export interface FilaInforme {
  fecha: string;
  elenco: string;
  queSeHizo: string;
}

/** Filas del informe: solo lo que pide la Corporación (fecha, elenco y qué se hizo). */
export function filasInforme(
  sesiones: ConId<SesionClase>[],
  nombresElencos: Record<string, string>
): FilaInforme[] {
  return [...sesiones]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
    .map((sesion) => ({
      fecha: sesion.fecha,
      elenco: nombresElencos[sesion.elencoId] ?? "Elenco eliminado",
      queSeHizo:
        sesion.estado === "incompleta"
          ? `${sesion.resumen ?? ""} [Clase incompleta: ${sesion.motivoIncompleta ?? "sin motivo"}]`.trim()
          : (sesion.resumen ?? ""),
    }));
}

function celda(valor: string): string {
  // Comillas siempre: el texto puede traer ";", saltos de línea o comillas.
  // Un "=", "+", "-" o "@" inicial se neutraliza para que Excel no lo
  // interprete como fórmula.
  const seguro = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}

/**
 * CSV que Excel abre directo con tildes y columnas bien separadas:
 * BOM UTF-8, separador ";" (Excel en español usa la coma como decimal) y
 * saltos de línea CRLF.
 */
export function generarCsvInforme(filas: FilaInforme[]): string {
  const lineas = [
    ["Fecha", "Elenco", "Qué se hizo"].map(celda).join(";"),
    ...filas.map((fila) =>
      [formatearFechaNumerica(fila.fecha), fila.elenco, fila.queSeHizo].map(celda).join(";")
    ),
  ];
  return "﻿" + lineas.join("\r\n");
}

export function descargarArchivo(contenido: string, nombre: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
