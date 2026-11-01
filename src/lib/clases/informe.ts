import {
  formatearDuracion,
  formatearFechaNumerica,
  sumarMinutos,
} from "@/lib/clases/calendario";
import type { ConId, SesionClase } from "@/types";

export interface FilaInforme {
  fecha: string;
  elenco: string;
  docente: string;
  /** "15:30 – 17:00", según lo programado. */
  horarioProgramado: string;
  inicioReal?: Date;
  finReal?: Date;
  /** Minutos entre el inicio y el término reales. */
  duracionRealMinutos?: number;
  presentes: number;
  totalAlumnos: number;
  incompleta: boolean;
  motivoIncompleta?: string;
  queSeHizo: string;
}

export interface ConteoAsistencia {
  presentes: number;
  total: number;
}

export function filasInforme(
  sesiones: ConId<SesionClase>[],
  nombresElencos: Record<string, string>,
  nombresDocentes: Record<string, string>,
  asistencia: Record<string, ConteoAsistencia>
): FilaInforme[] {
  return [...sesiones]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
    .map((sesion) => ({
      fecha: sesion.fecha,
      elenco: nombresElencos[sesion.elencoId] ?? "Elenco eliminado",
      docente: (sesion.profesorId && nombresDocentes[sesion.profesorId]) || "—",
      horarioProgramado: `${sesion.horaInicio} – ${sumarMinutos(sesion.horaInicio, sesion.duracionMinutos)}`,
      inicioReal: sesion.inicioReal,
      finReal: sesion.finReal,
      duracionRealMinutos:
        sesion.inicioReal && sesion.finReal
          ? Math.round((sesion.finReal.getTime() - sesion.inicioReal.getTime()) / 60_000)
          : undefined,
      presentes: asistencia[sesion.id]?.presentes ?? 0,
      totalAlumnos: asistencia[sesion.id]?.total ?? 0,
      incompleta: sesion.estado === "incompleta",
      motivoIncompleta: sesion.motivoIncompleta,
      queSeHizo: sesion.resumen ?? "",
    }));
}

export function horaCorta(fecha?: Date): string {
  return fecha ? fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—";
}

export interface MetadatosInforme {
  desde: string;
  hasta: string;
  /** Nombre del elenco filtrado, o null si son todos. */
  elenco: string | null;
}

/* Paleta institucional, en el formato ARGB que usa Excel. */
const AZUL = "FF1E3A8A";
const AZUL_SUAVE = "FFEFF4FF";
const GRIS_TEXTO = "FF475569";
const BORDE = "FFE2E8F0";
const AMBAR_SUAVE = "FFFEF3C7";
const AMBAR_TEXTO = "FF92400E";
const BLANCO = "FFFFFFFF";

const RUTA_LOGO = "/imagenes/inicio/CALAMABANDA.png";

const COLUMNAS = [
  { titulo: "Fecha", ancho: 12 },
  { titulo: "Elenco", ancho: 24 },
  { titulo: "Docente a cargo", ancho: 26 },
  { titulo: "Horario programado", ancho: 18 },
  { titulo: "Inicio real", ancho: 11 },
  { titulo: "Término real", ancho: 12 },
  { titulo: "Duración", ancho: 13 },
  { titulo: "Asistencia", ancho: 12 },
  { titulo: "Estado", ancho: 13 },
  { titulo: "Qué se hizo", ancho: 60 },
];

/**
 * Genera el informe como .xlsx con el logo de Calambanda, encabezado
 * institucional, tabla con colores, filtros y totales. ExcelJS se carga
 * recién aquí (import dinámico), para no sumar su peso a la página.
 */
export async function generarExcelInforme(
  filas: FilaInforme[],
  meta: MetadatosInforme
): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs");

  const libro = new ExcelJS.Workbook();
  libro.creator = "Plataforma Fénix — Escuela de Música Calambanda";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Clases", {
    views: [{ state: "frozen", ySplit: 6, showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    headerFooter: { oddFooter: "&LEscuela de Música Calambanda&RPágina &P de &N" },
  });
  hoja.columns = COLUMNAS.map((columna) => ({ width: columna.ancho }));
  const ultimaColumna = String.fromCharCode(64 + COLUMNAS.length);

  // --- Encabezado: logo + títulos -----------------------------------------
  try {
    const respuesta = await fetch(RUTA_LOGO);
    if (respuesta.ok) {
      const imagen = libro.addImage({ buffer: await respuesta.arrayBuffer(), extension: "png" });
      // El logo mide ~2,7:1; ocupa las dos primeras columnas, filas 1 a 4.
      hoja.addImage(imagen, { tl: { col: 0.15, row: 0.25 }, ext: { width: 190, height: 70 } });
    }
  } catch {
    // Sin logo el informe sigue siendo válido.
  }

  [1, 2, 3, 4].forEach((fila) => (hoja.getRow(fila).height = 20));

  hoja.mergeCells(`C1:${ultimaColumna}1`);
  hoja.getCell("C1").value = "Informe de clases";
  hoja.getCell("C1").font = { name: "Calibri", size: 18, bold: true, color: { argb: AZUL } };

  hoja.mergeCells(`C2:${ultimaColumna}2`);
  hoja.getCell("C2").value =
    "Escuela de Música Calambanda · Corporación de Cultura y Turismo de Calama";
  hoja.getCell("C2").font = { name: "Calibri", size: 11, color: { argb: GRIS_TEXTO } };

  hoja.mergeCells(`C3:${ultimaColumna}3`);
  hoja.getCell("C3").value =
    `Período: ${formatearFechaNumerica(meta.desde)} al ${formatearFechaNumerica(meta.hasta)}` +
    `   ·   Elenco: ${meta.elenco ?? "Todos"}`;
  hoja.getCell("C3").font = { name: "Calibri", size: 11, bold: true, color: { argb: GRIS_TEXTO } };

  hoja.mergeCells(`C4:${ultimaColumna}4`);
  hoja.getCell("C4").value = `Generado el ${new Date().toLocaleString("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
  })}`;
  hoja.getCell("C4").font = { name: "Calibri", size: 9, italic: true, color: { argb: GRIS_TEXTO } };

  // Línea azul bajo el encabezado.
  hoja.getRow(5).height = 6;
  for (let columna = 1; columna <= COLUMNAS.length; columna++) {
    hoja.getCell(5, columna).border = { bottom: { style: "medium", color: { argb: AZUL } } };
  }

  // --- Tabla -----------------------------------------------------------------
  const filaTitulos = hoja.getRow(6);
  filaTitulos.values = COLUMNAS.map((columna) => columna.titulo);
  filaTitulos.height = 24;
  filaTitulos.eachCell((celda) => {
    celda.font = { name: "Calibri", size: 11, bold: true, color: { argb: BLANCO } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    celda.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    celda.border = { right: { style: "thin", color: { argb: BLANCO } } };
  });

  filas.forEach((fila, indice) => {
    const queSeHizo = fila.incompleta
      ? `${fila.queSeHizo}\nMotivo de término anticipado: ${fila.motivoIncompleta ?? "—"}`.trim()
      : fila.queSeHizo;

    const filaHoja = hoja.addRow([
      formatearFechaNumerica(fila.fecha),
      fila.elenco,
      fila.docente,
      fila.horarioProgramado,
      horaCorta(fila.inicioReal),
      horaCorta(fila.finReal),
      fila.duracionRealMinutos !== undefined ? formatearDuracion(fila.duracionRealMinutos) : "—",
      fila.totalAlumnos > 0 ? `${fila.presentes} de ${fila.totalAlumnos}` : "—",
      fila.incompleta ? "Incompleta" : "Realizada",
      // ExcelJS guarda los strings como texto, nunca como fórmula: un "=" inicial no se ejecuta.
      queSeHizo || "—",
    ]);

    const fondo = indice % 2 === 1 ? AZUL_SUAVE : BLANCO;
    filaHoja.eachCell({ includeEmpty: true }, (celda, columna) => {
      celda.font = { name: "Calibri", size: 10, color: { argb: "FF0F172A" } };
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fondo } };
      celda.border = { bottom: { style: "thin", color: { argb: BORDE } } };
      celda.alignment = {
        vertical: "top",
        horizontal: columna === COLUMNAS.length ? "left" : columna <= 3 ? "left" : "center",
        wrapText: true,
      };
    });

    const celdaEstado = filaHoja.getCell(9);
    if (fila.incompleta) {
      celdaEstado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMBAR_SUAVE } };
      celdaEstado.font = { name: "Calibri", size: 10, bold: true, color: { argb: AMBAR_TEXTO } };
    } else {
      celdaEstado.font = { name: "Calibri", size: 10, bold: true, color: { argb: AZUL } };
    }
  });

  if (filas.length > 0) {
    hoja.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6 + filas.length, column: COLUMNAS.length } };
  }

  // --- Totales ----------------------------------------------------------------
  const minutosTotales = filas.reduce((suma, fila) => suma + (fila.duracionRealMinutos ?? 0), 0);
  const incompletas = filas.filter((fila) => fila.incompleta).length;

  hoja.addRow([]);
  const resumen: [string, string][] = [
    ["Clases dictadas", String(filas.length)],
    ["Clases incompletas", String(incompletas)],
    ["Horas de clase", formatearDuracion(minutosTotales)],
  ];
  resumen.forEach(([etiqueta, valor]) => {
    const filaHoja = hoja.addRow([etiqueta, "", valor]);
    hoja.mergeCells(filaHoja.number, 1, filaHoja.number, 2);
    filaHoja.getCell(1).font = { name: "Calibri", size: 10, bold: true, color: { argb: GRIS_TEXTO } };
    filaHoja.getCell(3).font = { name: "Calibri", size: 10, bold: true, color: { argb: AZUL } };
    filaHoja.getCell(3).alignment = { horizontal: "left" };
  });

  const contenido = await libro.xlsx.writeBuffer();
  return new Blob([contenido], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function descargarArchivo(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
