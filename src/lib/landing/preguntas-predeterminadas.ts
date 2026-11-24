import type { PreguntaFrecuente } from "@/types";

/**
 * Preguntas frecuentes iniciales, entregadas por la escuela. Se muestran
 * mientras el Administrador no abra el panel; la primera vez que lo abre se
 * copian a Firestore y desde ahí se editan.
 */
const CONTENIDO: Array<[categoria: string, pregunta: string, respuesta: string]> = [
  [
    "Información general",
    "¿Qué es la Escuela de Música Calambanda?",
    "La Escuela de Música Calambanda es un espacio de formación artística y musical de la comuna de Calama, orientado al desarrollo de niños, niñas, jóvenes y adultos, promoviendo la educación musical, la creatividad, el trabajo colectivo y la valoración del patrimonio cultural.",
  ],
  [
    "Información general",
    "¿Dónde funciona la Escuela de Música Calambanda?",
    "La escuela desarrolla sus actividades en la comuna de Calama, Región de Antofagasta. La información sobre sus dependencias, horarios y actividades se encuentra disponible a través de sus canales oficiales.",
  ],
  [
    "Información general",
    "¿Quiénes pueden participar en Calambanda?",
    "Pueden participar niños, niñas, jóvenes y adultos interesados en aprender música, desarrollar sus habilidades artísticas y formar parte de agrupaciones musicales.",
  ],
  [
    "Información general",
    "¿Es necesario tener conocimientos musicales previos?",
    "No. La escuela contempla procesos de iniciación y formación musical, por lo que no es indispensable contar con experiencia previa para postular a sus talleres.",
  ],
  [
    "Matrículas e inscripciones",
    "¿Cómo puedo inscribirme en la Escuela de Música Calambanda?",
    "Las inscripciones se realizan mediante convocatorias informadas a través de los canales oficiales de la escuela. En ellas se comunican los requisitos, plazos, disponibilidad de cupos y procedimientos de postulación.",
  ],
  [
    "Matrículas e inscripciones",
    "¿En qué fechas se realizan las inscripciones?",
    "Los períodos de inscripción se informan oportunamente durante el año, dependiendo de la planificación académica y de los cupos disponibles en cada área musical.",
  ],
  [
    "Matrículas e inscripciones",
    "¿La escuela tiene algún costo de matrícula o mensualidad?",
    "Las condiciones de participación y eventuales costos asociados se informan durante cada proceso de inscripción. Se recomienda consultar directamente a la administración de la escuela.",
  ],
  [
    "Matrículas e inscripciones",
    "¿Qué documentos necesito para inscribirme?",
    "Generalmente se solicitan antecedentes de identificación del estudiante y datos de contacto de su apoderado, cuando corresponda. Los requisitos específicos se informan en cada convocatoria.",
  ],
  [
    "Matrículas e inscripciones",
    "¿Puedo inscribirme si nunca he estudiado música?",
    "¡Por supuesto! Calambanda promueve el acceso a la formación musical y cuenta con espacios de iniciación para quienes desean comenzar su aprendizaje desde cero.",
  ],
  [
    "Talleres y formación musical",
    "¿Qué instrumentos se enseñan en Calambanda?",
    [
      "La escuela contempla distintas especialidades instrumentales, entre ellas:",
      "- Cuerdas: violín, viola, violonchelo y contrabajo.",
      "- Vientos: trompeta, trombón, clarinete, saxofón y flauta.",
      "- Instrumentos populares: guitarra, bajo eléctrico, piano y batería.",
      "- Folklore latinoamericano: instrumentos aerófonos, cordófonos y membranófonos.",
      "",
      "La disponibilidad depende de la programación académica de cada período.",
    ].join("\n"),
  ],
  [
    "Talleres y formación musical",
    "¿Qué agrupaciones musicales tiene la escuela?",
    [
      "Calambanda desarrolla diferentes espacios de formación colectiva, entre ellos:",
      "- Banda de Concierto.",
      "- Orquesta de Cuerdas.",
      "- Orquesta de Folklore Latinoamericano.",
      "- Coro de Niños.",
      "- Coro Juvenil.",
      "- Coro de Adultos.",
      "- Talleres de Iniciación Musical.",
    ].join("\n"),
  ],
  [
    "Talleres y formación musical",
    "¿Desde qué edad se puede ingresar?",
    "La escuela contempla espacios de formación para diferentes edades, desde la infancia hasta la adultez. La edad de ingreso depende de las características y requisitos de cada taller.",
  ],
  [
    "Talleres y formación musical",
    "¿Se enseña teoría musical además de tocar instrumentos?",
    "Sí. La formación contempla el aprendizaje de lenguaje musical, lectura, escritura, ritmo, audición y apreciación musical, complementando el desarrollo de habilidades instrumentales y vocales.",
  ],
  [
    "Talleres y formación musical",
    "¿Puedo aprender más de un instrumento?",
    "La posibilidad de estudiar más de una especialidad depende de la disponibilidad de horarios, cupos y evaluación de la coordinación académica.",
  ],
  [
    "Clases y funcionamiento",
    "¿Cuáles son los horarios de clases?",
    "Los horarios se organizan de acuerdo con las especialidades, niveles y disponibilidad de los docentes. Son comunicados a los estudiantes y apoderados al inicio de cada período académico.",
  ],
  [
    "Clases y funcionamiento",
    "¿Cuántas veces a la semana se realizan las clases?",
    "La frecuencia depende del taller y de su planificación pedagógica. Algunas especialidades consideran clases individuales o grupales y ensayos colectivos.",
  ],
  [
    "Clases y funcionamiento",
    "¿Es obligatorio asistir a los ensayos de las agrupaciones?",
    "Sí. La asistencia y puntualidad son fundamentales para el proceso formativo y el funcionamiento de las agrupaciones musicales, especialmente cuando existen presentaciones y conciertos programados.",
  ],
  [
    "Clases y funcionamiento",
    "¿La escuela entrega los instrumentos musicales?",
    "La disponibilidad de instrumentos para préstamo o uso durante las clases depende de los recursos y condiciones de cada especialidad. Esta información debe consultarse directamente con la coordinación correspondiente.",
  ],
  [
    "Presentaciones y actividades artísticas",
    "¿Los estudiantes participan en conciertos y presentaciones?",
    "Sí. Una parte importante del proceso formativo de Calambanda es la participación en conciertos, encuentros musicales, actividades culturales y presentaciones comunitarias.",
  ],
  [
    "Presentaciones y actividades artísticas",
    "¿Dónde se presentan las agrupaciones de Calambanda?",
    "Las agrupaciones participan en actividades culturales y educativas dentro de Calama y, dependiendo de la programación institucional, en encuentros y festivales en otras comunas y regiones.",
  ],
  [
    "Presentaciones y actividades artísticas",
    "¿Los familiares pueden asistir a los conciertos?",
    "¡Por supuesto! Las presentaciones de Calambanda buscan compartir el trabajo artístico de sus estudiantes con las familias y la comunidad. Las fechas, lugares y condiciones de ingreso se informan a través de los canales oficiales.",
  ],
  [
    "Presentaciones y actividades artísticas",
    "¿La escuela realiza giras musicales?",
    "La escuela puede desarrollar giras, intercambios y encuentros musicales como parte de sus experiencias de formación artística. Estas actividades están sujetas a planificación, selección de participantes y protocolos institucionales.",
  ],
  [
    "Comunidad y contacto",
    "¿Cómo puedo comunicarme con la Escuela de Música Calambanda?",
    "Puedes comunicarte a través de los canales oficiales de la escuela, donde podrás realizar consultas sobre inscripciones, talleres, horarios, actividades y otros temas relacionados con su funcionamiento.",
  ],
  [
    "Comunidad y contacto",
    "¿Cómo puedo conocer las próximas actividades y conciertos?",
    "Te invitamos a seguir las redes sociales y revisar las noticias de nuestro sitio web, donde compartimos información sobre conciertos, presentaciones, convocatorias y actividades institucionales.",
  ],
  [
    "Comunidad y contacto",
    "¿Puedo colaborar con las actividades de Calambanda?",
    "Sí. La escuela valora la participación y colaboración de las familias, instituciones y organizaciones que contribuyen al desarrollo artístico y cultural de la comunidad.",
  ],
];

export const PREGUNTAS_PREDETERMINADAS: PreguntaFrecuente[] = CONTENIDO.map(
  ([categoria, pregunta, respuesta], i) => ({
    categoria,
    pregunta,
    respuesta,
    orden: i + 1,
    publicada: true,
  })
);
