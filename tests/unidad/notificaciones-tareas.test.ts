import { expect, it } from "vitest";
import { tareasNuevasParaAlumno } from "@/lib/tareas";
import type { ConId, Tarea } from "@/types";

const nueva: ConId<Tarea> = {
  id: "nueva",
  titulo: "Practicar escalas",
  elencoId: "coro",
  profesorId: "docente",
  alumnoId: null,
  tipoAdjunto: "Ninguno",
  notificarAsignacion: true,
  completadoPor: [],
  completadoEn: {},
  fechaCreacion: new Date("2026-11-24"),
};

it("avisa solo de tareas nuevas que este alumno todavía no vio ni completó", () => {
  const tareas: ConId<Tarea>[] = [
    nueva,
    { ...nueva, id: "individual", alumnoId: "ana" },
    { ...nueva, id: "anterior", notificarAsignacion: undefined },
    { ...nueva, id: "vista" },
    { ...nueva, id: "completada", completadoPor: ["ana"] },
    { ...nueva, id: "completada-por-otro", completadoPor: ["luis"] },
  ];
  expect(tareasNuevasParaAlumno(tareas, "ana", new Set(["vista"])).map(({ id }) => id))
    .toEqual(["nueva", "individual", "completada-por-otro"]);
});
