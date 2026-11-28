/**
 * Datos de demostración para el EMULADOR: deja la plataforma lista para
 * mostrarla en local con los tres roles. Se ejecuta con `npm run seed:demo`,
 * que antes crea las cuentas base (`seed`), el administrador (`seed:admin`)
 * y las escuelas (`seed:escuelas`). Este script agrega:
 *
 * - 4 alumnos ficticios más (RUT válidos inventados, contraseña Alumno123!);
 * - un segundo elenco (Banda de Concierto · Inicial) con el mismo docente;
 * - el semestre en curso y una clase semanal por elenco; la del Coro cae
 *   HOY, para poder iniciarla y tomar asistencia en la demostración;
 * - tres clases ya realizadas del Coro con asistencia y una observación,
 *   para que el informe de la Dirección y el % del alumno tengan datos;
 * - material (2 PDF y 1 audio), avisos (del docente y de la Dirección) y
 *   tareas (para el elenco y para un alumno puntual).
 *
 * Todos los documentos usan IDs fijos que empiezan con "demo-": se puede
 * ejecutar varias veces sin duplicar nada. Solo funciona contra el emulador:
 * no acepta --proyecto-real, porque son datos inventados.
 */
import { getAuth } from "firebase-admin/auth";
import { FieldValue, type Firestore, type WithFieldValue } from "firebase-admin/firestore";
import { conectar } from "./conexion-admin";
import { generarPdfDePrueba, generarWavDePrueba, subirAlEmulador } from "./archivos-prueba";
import { identificadorDesdeRut } from "../src/lib/seguridad/cifrado";
import { cifrarDatosPrivados } from "../src/lib/seguridad/datos-privados";
import { diaSemana, hoyEnChile, idSemestre, idSesion, sumarDias } from "../src/lib/clases/calendario";
import type { Archivo } from "../src/types/archivo";
import type { Asistencia, EstadoAsistencia, ObservacionAsistencia } from "../src/types/asistencia";
import type { Aviso } from "../src/types/aviso";
import type { Clase, Semestre, SesionClase } from "../src/types/clase";
import type { Elenco, MiembroElenco, RolEnElenco } from "../src/types/elenco";
import type { Tarea } from "../src/types/tarea";
import type { Usuario } from "../src/types/usuario";

if (process.argv.includes("--proyecto-real")) {
  console.error("seed:demo solo carga datos inventados en el emulador. No se usa contra el proyecto real.");
  process.exit(1);
}

const { app, db, bucket } = conectar();
const authAdmin = getAuth(app);

const ELENCO_CORO = "elenco-seed-prueba"; // lo crea `npm run seed`
const ELENCO_BANDA = "demo-elenco-banda";
const RUT_PROFESOR = "22.222.222-2";
const RUT_ALUMNO = "11.111.111-1";
const RUT_ADMIN = "33.333.333-3";

/** Dígito verificador de un RUT chileno (módulo 11). */
function digitoVerificador(cuerpo: number): string {
  let suma = 0;
  let factor = 2;
  for (const digito of String(cuerpo).split("").reverse()) {
    suma += Number(digito) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  return resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
}

function rutFicticio(cuerpo: number): string {
  const conPuntos = String(cuerpo).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${digitoVerificador(cuerpo)}`;
}

const ALUMNOS_DEMO = [
  { cuerpo: 24111222, nombres: "Martina", apellidos: "Fuentes Ríos", nacimiento: "2012-04-18" },
  { cuerpo: 24333444, nombres: "Tomás", apellidos: "Araya Pizarro", nacimiento: "2011-09-02" },
  { cuerpo: 24555666, nombres: "Josefa", apellidos: "Muñoz Cortés", nacimiento: "2013-01-25" },
  { cuerpo: 24777888, nombres: "Benjamín", apellidos: "Rojas Vega", nacimiento: "2010-11-30" },
];

async function uidPorRut(rut: string): Promise<string> {
  try {
    return (await authAdmin.getUserByEmail(identificadorDesdeRut(rut))).uid;
  } catch {
    throw new Error(`No existe la cuenta ${rut}. Ejecuta primero "npm run seed" y "npm run seed:admin".`);
  }
}

async function crearAlumno(datos: (typeof ALUMNOS_DEMO)[number]): Promise<string> {
  const rut = rutFicticio(datos.cuerpo);
  const identificador = identificadorDesdeRut(rut);
  let uid: string;
  try {
    uid = (await authAdmin.getUserByEmail(identificador)).uid;
    await authAdmin.updateUser(uid, { password: "Alumno123!" });
  } catch {
    uid = (await authAdmin.createUser({ email: identificador, password: "Alumno123!" })).uid;
  }
  await authAdmin.setCustomUserClaims(uid, { rol: "alumno" });

  const usuario: WithFieldValue<Usuario> = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    rol: "alumno",
    activo: true,
    estadoActivacion: "activada",
    fechaCreacion: FieldValue.serverTimestamp(),
  };
  const batch = db.batch();
  batch.set(db.collection("usuarios").doc(uid), usuario);
  batch.set(db.collection("datos_privados").doc(uid), {
    ...cifrarDatosPrivados({
      rut,
      fechaNacimiento: datos.nacimiento,
      emailApoderado: `apoderado.${datos.nombres.toLowerCase()}@ejemplo.cl`,
    }),
    fechaActualizacion: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return uid;
}

async function asegurarMembresia(
  elencoId: string,
  usuarioId: string,
  rolEnElenco: RolEnElenco,
  cargoDocente?: "titular" | "asistente",
): Promise<void> {
  const membresia: WithFieldValue<MiembroElenco> = {
    elencoId,
    usuarioId,
    rolEnElenco,
    ...(cargoDocente ? { cargoDocente } : {}),
    fechaIngreso: FieldValue.serverTimestamp(),
    activo: true,
  };
  await db.collection("miembros_elenco").doc(`${elencoId}_${usuarioId}`).set(membresia);
}

async function crearElencoBanda(profesorId: string): Promise<void> {
  const escuelas = await db.collection("escuelas").where("nombre", "==", "Banda de Concierto").limit(1).get();
  if (escuelas.empty) throw new Error('Falta la escuela "Banda de Concierto". Ejecuta "npm run seed:escuelas".');
  const elenco: WithFieldValue<Elenco> = {
    nombre: "Banda de Concierto · Inicial",
    disciplina: "musica",
    tipoGrupo: "escuela",
    escuelaId: escuelas.docs[0].id,
    nivel: "Inicial",
    tipoEscuela: "conjunto",
    descripcion: "Elenco de demostración: repertorio de iniciación para banda.",
    docenteResponsableId: profesorId,
    activo: true,
    fechaCreacion: FieldValue.serverTimestamp(),
  };
  await db.collection("elencos").doc(ELENCO_BANDA).set(elenco);
}

/** Semestres del año en curso; no toca los que ya existan. Devuelve el ID del vigente. */
async function asegurarSemestres(hoy: string): Promise<string> {
  const anio = Number(hoy.slice(0, 4));
  const semestres: Array<[string, Semestre]> = [
    [idSemestre(anio, 1), { anio, numero: 1, fechaInicio: `${anio}-03-02`, fechaFin: `${anio}-07-17` }],
    [idSemestre(anio, 2), { anio, numero: 2, fechaInicio: `${anio}-07-27`, fechaFin: `${anio}-12-31` }],
  ];
  for (const [id, semestre] of semestres) {
    const referencia = db.collection("semestres").doc(id);
    if (!(await referencia.get()).exists) await referencia.set(semestre);
  }
  return hoy <= `${anio}-07-26` ? idSemestre(anio, 1) : idSemestre(anio, 2);
}

/** Primera fecha >= inicio que cae el mismo día de la semana que `referencia`. */
function mismoDiaDesde(inicio: string, referencia: string): string {
  const diferencia = (diaSemana(referencia) - diaSemana(inicio) + 7) % 7;
  return sumarDias(inicio, diferencia);
}

async function crearClase(
  id: string,
  elencoId: string,
  fechaInicio: string,
  horaInicio: string,
  semestreId: string,
): Promise<void> {
  const clase: WithFieldValue<Clase> = {
    elencoId,
    fechaInicio,
    horaInicio,
    duracionMinutos: 60,
    repeticion: { tipo: "semanal", semestreId },
    fechaCreacion: FieldValue.serverTimestamp(),
  };
  await db.collection("clases").doc(id).set(clase);
}

/** Clase ya realizada, con la asistencia de cada alumno y, opcionalmente, una observación. */
async function crearSesionRealizada(
  dbDestino: Firestore,
  claseId: string,
  fecha: string,
  profesorId: string,
  asistencia: Array<[string, EstadoAsistencia]>,
  resumen: string,
  observacion?: { alumnoId: string; texto: string },
): Promise<void> {
  const sesionId = idSesion(claseId, fecha);
  // Hora de Chile en verano (UTC-3): 17:00 a 18:00.
  const inicio = new Date(`${fecha}T17:00:00-03:00`);
  const sesion: WithFieldValue<SesionClase> = {
    claseId,
    elencoId: ELENCO_CORO,
    fechaProgramada: fecha,
    fecha,
    horaInicio: "17:00",
    duracionMinutos: 60,
    estado: "realizada",
    profesorId,
    inicioReal: inicio,
    finReal: new Date(inicio.getTime() + 62 * 60_000),
    resumen,
    fechaActualizacion: FieldValue.serverTimestamp(),
  };
  const batch = dbDestino.batch();
  batch.set(dbDestino.collection("sesiones_clase").doc(sesionId), sesion);
  for (const [alumnoId, estado] of asistencia) {
    const registro: WithFieldValue<Asistencia> = {
      elencoId: ELENCO_CORO,
      alumnoId,
      profesorId,
      fechaSesion: fecha,
      estado,
      sesionId,
      fechaRegistro: FieldValue.serverTimestamp(),
    };
    batch.set(dbDestino.collection("asistencias").doc(`${sesionId}_${alumnoId}`), registro);
  }
  if (observacion) {
    const registro: WithFieldValue<ObservacionAsistencia> = {
      elencoId: ELENCO_CORO,
      sesionId,
      alumnoId: observacion.alumnoId,
      profesorId,
      texto: observacion.texto,
      fechaRegistro: FieldValue.serverTimestamp(),
    };
    batch.set(dbDestino.collection("observaciones_asistencia").doc(`${sesionId}_${observacion.alumnoId}`), registro);
  }
  await batch.commit();
}

async function crearMaterial(profesorId: string): Promise<void> {
  const material: Array<{ id: string; elencoId: string; tipo: Archivo["tipo"]; titulo: string; categoria: string; nombre: string; datos: Buffer; mime: string }> = [
    {
      id: "demo-material-1",
      elencoId: ELENCO_CORO,
      tipo: "pdf",
      titulo: "Himno de Calama - Partitura coral",
      categoria: "Partitura",
      nombre: "himno-calama-coro.pdf",
      datos: generarPdfDePrueba("Himno de Calama - partitura coral (demo)"),
      mime: "application/pdf",
    },
    {
      id: "demo-material-2",
      elencoId: ELENCO_CORO,
      tipo: "wav",
      titulo: "Nota de afinación - La 440",
      categoria: "Pista de ensayo",
      nombre: "afinacion-la-440.wav",
      datos: generarWavDePrueba(440, 4),
      mime: "audio/wav",
    },
    {
      id: "demo-material-3",
      elencoId: ELENCO_BANDA,
      tipo: "pdf",
      titulo: "Escala de Si bemol - Método de banda",
      categoria: "Método",
      nombre: "escala-si-bemol.pdf",
      datos: generarPdfDePrueba("Escala de Si bemol - metodo de banda (demo)"),
      mime: "application/pdf",
    },
  ];

  for (const item of material) {
    const url = await subirAlEmulador(bucket, `elencos/${item.elencoId}/${item.tipo}/demo_${item.nombre}`, item.datos, item.mime);
    const archivo: WithFieldValue<Archivo> = {
      elencoId: item.elencoId,
      profesorId,
      tipo: item.tipo,
      categoria: item.categoria,
      titulo: item.titulo,
      nombreArchivo: item.nombre,
      urlStorage: url,
      tamanioBytes: item.datos.length,
      fechaSubida: FieldValue.serverTimestamp(),
    };
    await db.collection("archivos").doc(item.id).set(archivo);
  }
}

async function crearAvisos(profesorId: string, adminId: string): Promise<void> {
  const avisos: Array<[string, WithFieldValue<Aviso>]> = [
    [
      "demo-aviso-1",
      {
        alcance: "elenco",
        origen: "profesor",
        elencoId: ELENCO_CORO,
        profesorId,
        titulo: "Ensayo general el sábado",
        contenido: "El sábado ensayamos de 10:00 a 12:00 en el Centro Arte Ojo del Desierto. Traer la partitura del himno.",
        urgente: false,
        fechaPublicacion: FieldValue.serverTimestamp(),
      },
    ],
    [
      "demo-aviso-2",
      {
        alcance: "escuela",
        origen: "direccion",
        elencoId: null,
        profesorId: adminId,
        titulo: "Concierto de Navidad",
        contenido: "Todos los elencos participan en el Concierto de Navidad. Pronto publicaremos el horario de cada grupo.",
        urgente: true,
        fechaPublicacion: FieldValue.serverTimestamp(),
      },
    ],
  ];
  for (const [id, aviso] of avisos) await db.collection("avisos").doc(id).set(aviso);
}

async function crearTareas(profesorId: string, alumnoId: string, hoy: string): Promise<void> {
  const tareas: Array<[string, WithFieldValue<Tarea>]> = [
    [
      "demo-tarea-1",
      {
        titulo: "Repasar la segunda estrofa del himno",
        elencoId: ELENCO_CORO,
        profesorId,
        alumnoId: null,
        fechaLimite: new Date(`${sumarDias(hoy, 5)}T23:59:00-03:00`),
        tipoAdjunto: "Ninguno",
        notificarAsignacion: true,
        completadoPor: [],
        completadoEn: {},
        fechaCreacion: FieldValue.serverTimestamp(),
      },
    ],
    [
      "demo-tarea-2",
      {
        titulo: "Practicar la respiración antes de la entrada del compás 12",
        elencoId: ELENCO_CORO,
        profesorId,
        alumnoId,
        tipoAdjunto: "Ninguno",
        notificarAsignacion: true,
        completadoPor: [],
        completadoEn: {},
        fechaCreacion: FieldValue.serverTimestamp(),
      },
    ],
  ];
  for (const [id, tarea] of tareas) await db.collection("tareas").doc(id).set(tarea);
}

async function main(): Promise<void> {
  console.log("Cargando datos de demostración en el EMULADOR...\n");
  const hoy = hoyEnChile();

  const [profesorId, alumnoId, adminId] = await Promise.all([
    uidPorRut(RUT_PROFESOR),
    uidPorRut(RUT_ALUMNO),
    uidPorRut(RUT_ADMIN),
  ]);

  const alumnosDemo: string[] = [];
  for (const datos of ALUMNOS_DEMO) alumnosDemo.push(await crearAlumno(datos));
  console.log(`  + ${alumnosDemo.length} alumnos ficticios (contraseña Alumno123!)`);

  await crearElencoBanda(profesorId);
  await asegurarMembresia(ELENCO_CORO, profesorId, "profesor", "titular");
  await asegurarMembresia(ELENCO_BANDA, profesorId, "profesor", "titular");
  for (const uid of alumnosDemo.slice(0, 3)) await asegurarMembresia(ELENCO_CORO, uid, "alumno");
  for (const uid of [alumnoId, ...alumnosDemo.slice(2)]) await asegurarMembresia(ELENCO_BANDA, uid, "alumno");
  console.log("  + Banda de Concierto · Inicial, y alumnos repartidos en los dos elencos");

  const semestreId = await asegurarSemestres(hoy);
  const semestre = (await db.collection("semestres").doc(semestreId).get()).data() as Semestre;

  // Coro: todas las semanas el mismo día de hoy, desde 3 semanas atrás (o el inicio del semestre).
  const desde = sumarDias(hoy, -21) < semestre.fechaInicio ? semestre.fechaInicio : sumarDias(hoy, -21);
  const inicioCoro = mismoDiaDesde(desde, hoy);
  await crearClase("demo-clase-coro", ELENCO_CORO, inicioCoro, "17:00", semestreId);
  // Banda: dos días después que el Coro, para ver más de una clase en el calendario.
  await crearClase("demo-clase-banda", ELENCO_BANDA, mismoDiaDesde(desde, sumarDias(hoy, 2)), "18:30", semestreId);
  console.log(`  + Semestre ${semestreId}; clase semanal del Coro (hoy, ${hoy}, 17:00) y de la Banda`);

  // Clases ya realizadas del Coro, antes de hoy.
  const alumnosCoro = [alumnoId, ...alumnosDemo.slice(0, 3)];
  const patrones: EstadoAsistencia[][] = [
    ["presente", "presente", "ausente", "presente"],
    ["presente", "ausente", "presente", "presente"],
    ["ausente", "presente", "presente", "presente"],
  ];
  const fechasPasadas: string[] = [];
  for (let fecha = inicioCoro; fecha < hoy; fecha = sumarDias(fecha, 7)) fechasPasadas.push(fecha);
  for (const [indice, fecha] of fechasPasadas.slice(-3).entries()) {
    await crearSesionRealizada(
      db,
      "demo-clase-coro",
      fecha,
      profesorId,
      alumnosCoro.map((uid, i) => [uid, patrones[indice % 3][i]]),
      ["Calentamiento vocal y lectura del himno.", "Trabajo por cuerdas: sopranos y contraltos.", "Ensayo completo con acompañamiento."][indice % 3],
      indice === 0 ? { alumnoId: alumnosDemo[1], texto: "Llegó 15 minutos tarde; avisó el apoderado." } : undefined,
    );
  }
  console.log(`  + ${Math.min(3, fechasPasadas.length)} clases realizadas con asistencia y una observación`);

  await crearMaterial(profesorId);
  await crearAvisos(profesorId, adminId);
  await crearTareas(profesorId, alumnoId, hoy);
  console.log("  + Material (2 PDF y 1 audio), 2 avisos (docente y Dirección) y 2 tareas");

  console.log(`
Listo. Cuentas para la demostración:
  Dirección   33.333.333-3  Admin123!
  Docente     22.222.222-2  Profesor123!
  Alumno      11.111.111-1  Alumno123!
  Más alumnos ${ALUMNOS_DEMO.map((a) => rutFicticio(a.cuerpo)).join(", ")} (Alumno123!)`);
}

main().catch((error) => {
  console.error("Error al cargar los datos de demostración:", error instanceof Error ? error.message : error);
  process.exit(1);
});
