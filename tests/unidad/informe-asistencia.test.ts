import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { generarExcelInforme, resumirAsistenciaInforme } from "@/lib/clases/informe";

describe("informe de asistencia de Dirección", () => {
  it("separa al alumno por elenco e incluye el historial anterior a las sesiones", () => {
    const { porSesion, porAlumno } = resumirAsistenciaInforme(
      [
        { id: "dictada", elencoId: "banda", estado: "realizada" },
        { id: "anticipada", elencoId: "banda", estado: "incompleta" },
        { id: "en-curso", elencoId: "banda", estado: "en_curso" },
        { id: "cancelada", elencoId: "banda", estado: "cancelada" },
      ],
      [
        { alumnoId: "ana", elencoId: "banda", sesionId: "dictada", estado: "presente" },
        { alumnoId: "ana", elencoId: "banda", sesionId: "anticipada", estado: "ausente" },
        { alumnoId: "ana", elencoId: "banda", estado: "justificado" },
        { alumnoId: "ana", elencoId: "coro", estado: "presente" },
        { alumnoId: "ana", elencoId: "banda", sesionId: "cancelada", estado: "ausente" },
        { alumnoId: "ana", elencoId: "banda", sesionId: "en-curso", estado: "presente" },
      ],
      { banda: "Banda", coro: "Coro" },
      { ana: "Ana Rojas" },
    );

    expect(porSesion).toEqual({ dictada: { presentes: 1, total: 1 }, anticipada: { presentes: 0, total: 1 } });
    expect(porAlumno).toEqual([
      { alumnoId: "ana", alumno: "Ana Rojas", elencoId: "banda", elenco: "Banda", presentes: 1, ausencias: 1, justificadas: 1, total: 3, porcentaje: 33 },
      { alumnoId: "ana", alumno: "Ana Rojas", elencoId: "coro", elenco: "Coro", presentes: 1, ausencias: 0, justificadas: 0, total: 1, porcentaje: 100 },
    ]);
  });

  it("conserva la hoja de clases y exporta el porcentaje como número aunque solo haya registros antiguos", async () => {
    const { porAlumno } = resumirAsistenciaInforme(
      [],
      [{ alumnoId: "ana", elencoId: "banda", estado: "ausente" }],
      { banda: "Banda" },
      { ana: "Ana Rojas" },
    );
    const archivo = await generarExcelInforme([], { desde: "2026-03-01", hasta: "2026-03-31", elenco: "Banda" }, porAlumno);
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(await archivo.arrayBuffer());

    expect(libro.getWorksheet("Clases")).toBeDefined();
    const asistencia = libro.getWorksheet("Asistencia por alumno");
    expect(asistencia?.getCell("B4").value).toBe("Ana Rojas");
    expect(asistencia?.getCell("F4").value).toBe(1);
    expect(asistencia?.getCell("G4").value).toBe(0);
    expect(asistencia?.getCell("G4").numFmt).toBe("0%");
  });
});
