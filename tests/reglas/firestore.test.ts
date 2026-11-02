import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { cargarEscenario, como, crearEntorno, type NombreUsuario } from "./entorno";

let entorno: RulesTestEnvironment;

beforeAll(async () => {
  entorno = await crearEntorno();
});

beforeEach(async () => {
  await entorno.clearFirestore();
  await cargarEscenario(entorno);
});

afterAll(async () => {
  await entorno.cleanup();
});

const db = (nombre: NombreUsuario) => como(entorno, nombre).firestore();
const anonimo = () => entorno.unauthenticatedContext().firestore();
const horaServidor = () => firebase.firestore.FieldValue.serverTimestamp();

describe("usuarios", () => {
  it("cualquier sesión lee un perfil por su uid", async () => {
    await assertSucceeds(db("ajeno").doc("usuarios/profe").get());
  });
  it("sin sesión no se lee nada", async () => {
    await assertFails(anonimo().doc("usuarios/profe").get());
  });
  it("solo la Dirección lista a todas las personas", async () => {
    await assertFails(db("alumno").collection("usuarios").get());
    await assertFails(db("profe").collection("usuarios").get());
    await assertSucceeds(db("admin").collection("usuarios").get());
  });
  it("nadie modifica su perfil desde el navegador (ni su rol)", async () => {
    await assertFails(db("alumno").doc("usuarios/alumno").update({ rol: "administrador" }));
    await assertFails(db("admin").doc("usuarios/alumno").update({ nombres: "X" }));
  });
});

describe("elencos y membresías", () => {
  it("un miembro lee su elenco; otro alumno no", async () => {
    await assertSucceeds(db("alumno").doc("elencos/e1").get());
    await assertFails(db("ajeno").doc("elencos/e1").get());
    await assertFails(db("inactivo").doc("elencos/e1").get());
  });
  it("solo la Dirección lista todos los elencos", async () => {
    await assertFails(db("profe").collection("elencos").get());
    await assertSucceeds(db("admin").collection("elencos").get());
  });
  it("cada uno lista sus propias membresías", async () => {
    await assertSucceeds(
      db("alumno").collection("miembros_elenco").where("usuarioId", "==", "alumno").where("activo", "==", true).get()
    );
    await assertFails(db("alumno").collection("miembros_elenco").where("usuarioId", "==", "profe").get());
  });
  it("consultar si se es miembro funciona aunque no se pertenezca al elenco", async () => {
    await assertSucceeds(db("ajeno").doc("miembros_elenco/e1_ajeno").get());
    await assertFails(db("ajeno").doc("miembros_elenco/e1_alumno").get());
  });
  it("el docente ve la lista de su elenco; un alumno o un docente de otro elenco no", async () => {
    const lista = (nombre: NombreUsuario) =>
      db(nombre).collection("miembros_elenco").where("elencoId", "==", "e1").where("activo", "==", true).get();
    await assertSucceeds(lista("profe"));
    await assertFails(lista("alumno"));
    await assertFails(lista("profe2"));
    await assertSucceeds(lista("admin"));
  });
  it("las membresías y los elencos no se escriben desde el navegador", async () => {
    await assertFails(
      db("ajeno").doc("miembros_elenco/e1_ajeno").set({ elencoId: "e1", usuarioId: "ajeno", rolEnElenco: "alumno", activo: true })
    );
    await assertFails(db("admin").doc("elencos/e3").set({ nombre: "Nuevo" }));
  });
});

describe("archivos (material)", () => {
  const nuevo = (datos: Record<string, unknown> = {}) => ({
    elencoId: "e1",
    profesorId: "profe",
    tipo: "pdf",
    categoria: "Partitura",
    titulo: "Score",
    nombreArchivo: "score.pdf",
    urlStorage: "https://ejemplo/score.pdf",
    tamanioBytes: 1000,
    fechaSubida: horaServidor(),
    ...datos,
  });

  it("los miembros listan el material de su elenco; los demás no", async () => {
    const lista = (nombre: NombreUsuario) => db(nombre).collection("archivos").where("elencoId", "==", "e1").get();
    await assertSucceeds(lista("alumno"));
    await assertSucceeds(lista("profe"));
    await assertFails(lista("ajeno"));
    await assertFails(lista("inactivo"));
    await assertFails(db("alumno").collection("archivos").get());
  });
  it("el docente del elenco sube material válido", async () => {
    await assertSucceeds(db("profe").collection("archivos").add(nuevo()));
  });
  it("se rechaza material de alumnos, de otro elenco o a nombre de otro docente", async () => {
    await assertFails(db("alumno").collection("archivos").add(nuevo({ profesorId: "alumno" })));
    await assertFails(db("profe2").collection("archivos").add(nuevo({ profesorId: "profe2" })));
    await assertFails(db("profe").collection("archivos").add(nuevo({ profesorId: "profe2" })));
  });
  it("se rechazan campos extra, formatos no permitidos, textos largos y fechas del cliente", async () => {
    const profe = db("profe").collection("archivos");
    await assertFails(profe.add(nuevo({ destacado: true })));
    await assertFails(profe.add(nuevo({ tipo: "exe" })));
    await assertFails(profe.add(nuevo({ titulo: "x".repeat(151) })));
    await assertFails(profe.add(nuevo({ titulo: "" })));
    await assertFails(profe.add(nuevo({ fechaSubida: new Date() })));
  });
  it("solo quien lo subió lo elimina, y nadie lo modifica", async () => {
    await assertFails(db("profe2").doc("archivos/a1").delete());
    await assertFails(db("profe").doc("archivos/a1").update({ titulo: "Otro" }));
    await assertSucceeds(db("profe").doc("archivos/a1").delete());
  });
});

describe("asistencia y observaciones", () => {
  it("el alumno ve su propia asistencia, no la de otros", async () => {
    await assertSucceeds(
      db("alumno").collection("asistencias").where("elencoId", "==", "e1").where("alumnoId", "==", "alumno").get()
    );
    await assertFails(db("alumno").collection("asistencias").where("elencoId", "==", "e1").get());
  });
  it("el docente ve la asistencia de una sesión de su elenco filtrando por elenco", async () => {
    const porSesion = (nombre: NombreUsuario) =>
      db(nombre).collection("asistencias").where("elencoId", "==", "e1").where("sesionId", "==", "s1").get();
    await assertSucceeds(porSesion("profe"));
    await assertFails(porSesion("profe2"));
    await assertFails(db("profe").collection("asistencias").where("sesionId", "==", "s1").get());
  });
  it("la Dirección consulta varias sesiones a la vez", async () => {
    await assertSucceeds(db("admin").collection("asistencias").where("sesionId", "in", ["s1", "s2"]).get());
  });
  it("las observaciones no las lee el alumno, ni siquiera las suyas", async () => {
    await assertFails(db("alumno").doc("observaciones_asistencia/s1_alumno").get());
    await assertSucceeds(
      db("profe").collection("observaciones_asistencia").where("elencoId", "==", "e1").where("sesionId", "==", "s1").get()
    );
    await assertSucceeds(db("admin").doc("observaciones_asistencia/s1_alumno").get());
  });
  it("la asistencia no se escribe desde el navegador", async () => {
    await assertFails(db("profe").doc("asistencias/s1_alumno").update({ estado: "ausente" }));
    await assertFails(db("profe").doc("observaciones_asistencia/s1_alumno").set({ elencoId: "e1", texto: "x" }));
  });
});

describe("avisos y lecturas", () => {
  const aviso = (datos: Record<string, unknown> = {}) => ({
    elencoId: "e1",
    profesorId: "profe",
    titulo: "Ensayo general",
    contenido: "El sábado a las 10:00.",
    urgente: false,
    fechaPublicacion: horaServidor(),
    ...datos,
  });

  it("los miembros leen los avisos de su elenco; los demás no", async () => {
    const lista = (nombre: NombreUsuario) => db(nombre).collection("avisos").where("elencoId", "==", "e1").get();
    await assertSucceeds(lista("alumno"));
    await assertFails(lista("ajeno"));
  });
  it("publica el docente del elenco; un alumno o un docente de otro elenco no", async () => {
    await assertSucceeds(db("profe").collection("avisos").add(aviso()));
    await assertFails(db("alumno").collection("avisos").add(aviso({ profesorId: "alumno" })));
    await assertFails(db("profe2").collection("avisos").add(aviso({ profesorId: "profe2" })));
  });
  it("se rechazan avisos demasiado largos o con campos extra, y nadie los edita", async () => {
    await assertFails(db("profe").collection("avisos").add(aviso({ contenido: "x".repeat(5001) })));
    await assertFails(db("profe").collection("avisos").add(aviso({ alumnoId: "alumno" })));
    await assertFails(db("profe").doc("avisos/v1").update({ titulo: "Otro" }));
  });
  it("el alumno marca como leído un aviso de su elenco, solo a su nombre", async () => {
    const lectura = { leido: true, fechaLectura: horaServidor() };
    await assertSucceeds(db("alumno").doc("avisos/v1/lecturas/alumno").set(lectura));
    await assertSucceeds(db("alumno").doc("avisos/v1/lecturas/alumno").get());
    await assertFails(db("alumno").doc("avisos/v1/lecturas/inactivo").set(lectura));
    await assertFails(db("ajeno").doc("avisos/v1/lecturas/ajeno").set(lectura));
    await assertFails(db("profe").doc("avisos/v1/lecturas/alumno").get());
  });
});

describe("tareas", () => {
  const tarea = (datos: Record<string, unknown> = {}) => ({
    titulo: "Repasar escalas",
    elencoId: "e1",
    profesorId: "profe",
    tipoAdjunto: "Ninguno",
    completadoPor: [],
    completadoEn: {},
    fechaCreacion: horaServidor(),
    ...datos,
  });
  const marcar = (uid: string) => ({
    completadoPor: firebase.firestore.FieldValue.arrayUnion(uid),
    [`completadoEn.${uid}`]: horaServidor(),
  });

  it("el docente del elenco crea tareas sin avance previo", async () => {
    await assertSucceeds(db("profe").collection("tareas").add(tarea()));
    await assertFails(db("profe").collection("tareas").add(tarea({ completadoPor: ["alumno"] })));
    await assertFails(db("profe2").collection("tareas").add(tarea({ profesorId: "profe2" })));
    await assertFails(db("alumno").collection("tareas").add(tarea({ profesorId: "alumno" })));
  });
  it("el alumno marca solo su propio avance, y solo en tareas de su elenco", async () => {
    await assertSucceeds(db("alumno").doc("tareas/t1").update(marcar("alumno")));
    await assertFails(db("alumno").doc("tareas/t1").update(marcar("inactivo")));
    await assertFails(db("ajeno").doc("tareas/t1").update(marcar("ajeno")));
    await assertFails(db("alumno").doc("tareas/t1").update({ titulo: "Sin tarea" }));
  });
  it("el docente edita solo título y fecha límite", async () => {
    await assertSucceeds(db("profe").doc("tareas/t1").update({ titulo: "Repasar arpegios" }));
    await assertFails(db("profe").doc("tareas/t1").update({ elencoId: "e2" }));
    await assertFails(db("profe").doc("tareas/t1").update({ completadoPor: ["alumno"] }));
    await assertFails(db("profe2").doc("tareas/t1").update({ titulo: "Otra" }));
  });
  it("solo quien la creó la elimina", async () => {
    await assertFails(db("alumno").doc("tareas/t1").delete());
    await assertSucceeds(db("profe").doc("tareas/t1").delete());
  });
});

describe("clases", () => {
  it("los semestres los lee cualquier sesión", async () => {
    await assertSucceeds(db("ajeno").collection("semestres").get());
    await assertFails(anonimo().collection("semestres").get());
  });
  it("horarios y sesiones: los miembros del elenco y la Dirección", async () => {
    await assertSucceeds(db("profe").collection("clases").where("elencoId", "==", "e1").get());
    await assertSucceeds(db("alumno").doc("sesiones_clase/c1_2026-03-02").get());
    await assertFails(db("ajeno").doc("sesiones_clase/c1_2026-03-02").get());
    await assertFails(db("profe").collection("clases").get());
    await assertSucceeds(
      db("admin").collection("sesiones_clase").where("fecha", ">=", "2026-03-01").where("fecha", "<=", "2026-03-31").get()
    );
  });
  it("no se escriben desde el navegador", async () => {
    await assertFails(db("admin").doc("clases/c2").set({ elencoId: "e1" }));
    await assertFails(db("profe").doc("sesiones_clase/c1_2026-03-02").update({ estado: "en_curso" }));
  });
});

describe("solo servidor y colecciones desconocidas", () => {
  it("datos_privados y solicitudes_acceso están cerrados para todos", async () => {
    await assertFails(db("alumno").doc("datos_privados/alumno").get());
    await assertFails(db("admin").doc("datos_privados/alumno").get());
    await assertFails(db("admin").doc("solicitudes_acceso/alumno").get());
  });
  it("una colección que no está en las reglas queda denegada", async () => {
    await assertFails(db("admin").collection("cualquier_cosa").add({ a: 1 }));
    await assertFails(db("admin").doc("cualquier_cosa/x").get());
  });
});
