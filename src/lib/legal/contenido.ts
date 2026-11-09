/**
 * Textos legales del sitio: la versión aprobada de la Política de Privacidad
 * y de los Términos y Condiciones. Si cambian, se actualiza este archivo y la
 * fecha de abajo. En los textos, **así** se muestra en negrita.
 */

export type BloqueLegal =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "tabla"; encabezados?: string[]; filas: string[][] };

export interface SeccionLegal {
  titulo: string;
  bloques: BloqueLegal[];
}

export interface DocumentoLegal {
  titulo: string;
  actualizado: string;
  introduccion: BloqueLegal[];
  secciones: SeccionLegal[];
}

const ACTUALIZADO = "9 de noviembre de 2026";
const CORREO = "Info@calamacultural.cl";

export const POLITICA_PRIVACIDAD: DocumentoLegal = {
  titulo: "Política de Privacidad",
  actualizado: ACTUALIZADO,
  introduccion: [
    {
      tipo: "parrafo",
      texto:
        "Esta Política de Privacidad explica qué datos personales trata la **Plataforma Fénix**, que incluye el sitio público y la intranet de la Escuela de Música Calambanda. También explica para qué los usa, con quién los comparte y cómo puedes ejercer tus derechos sobre ellos.",
    },
  ],
  secciones: [
    {
      titulo: "1. Quién es responsable de tus datos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "El responsable del tratamiento es la **Corporación de Cultura y Turismo de Calama**, a través de su Escuela de Música Calambanda.",
        },
        {
          tipo: "tabla",
          filas: [
            ["Razón social", "Corporación de Cultura y Turismo de Calama"],
            ["RUT", "88.951.800-6"],
            ["Domicilio", "Avenida O´Higgins s/n, sector Parque El Loa, Calama, Región de Antofagasta"],
            ["Sede de clases", "Centro de Arte Ojo del Desierto, Calama"],
            ["Correo para temas de privacidad", CORREO],
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "La plataforma fue desarrollada y es mantenida por **Appa-tec**, que actúa por encargo de la Corporación y solo trata los datos para operar y dar soporte al sistema.",
        },
      ],
    },
    {
      titulo: "2. Qué datos tratamos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Solo tratamos los datos necesarios para el funcionamiento de la escuela. Los visitantes del sitio público no entregan datos personales: no hay formularios de contacto ni herramientas de analítica o publicidad.",
        },
        {
          tipo: "tabla",
          encabezados: ["Quién", "Datos", "De dónde vienen"],
          filas: [
            [
              "Alumnos",
              "Nombres, apellidos, RUT, fecha de nacimiento, correo (si tiene), elencos en que participa, asistencia a clases, tareas cumplidas, avisos leídos",
              "La administración de la escuela, al matricular; la actividad en la plataforma",
            ],
            [
              "Apoderados",
              "Correo del apoderado, para activar la cuenta y recuperar el acceso de alumnos menores",
              "La administración de la escuela, al matricular",
            ],
            [
              "Docentes",
              "Nombres, apellidos, RUT, fecha de nacimiento, correo, elencos a cargo, material que publican, clases que inician y finalizan",
              "La administración de la escuela",
            ],
            [
              "Todos los usuarios",
              "Contraseña (guardada solo en forma cifrada por el proveedor de autenticación; nadie de la escuela puede verla), fecha de creación de la cuenta y registros técnicos de acceso",
              "La propia persona y el sistema",
            ],
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "**Observaciones de clase.** Durante una clase, el docente puede registrar una observación sobre un alumno (por ejemplo, un incidente o una falta). Esa información es de uso interno: la ven solo los docentes y la administración, nunca otros alumnos ni el público.",
        },
      ],
    },
    {
      titulo: "3. Para qué usamos los datos",
      bloques: [
        { tipo: "parrafo", texto: "Usamos los datos únicamente para la gestión educativa de la escuela:" },
        {
          tipo: "lista",
          items: [
            "Crear y administrar las cuentas, y permitir el inicio de sesión con RUT y contraseña.",
            "Organizar los elencos, el horario de clases y el material de estudio (partituras y audios).",
            "Registrar la asistencia y lo que se trabajó en cada clase.",
            "Publicar avisos y tareas para los alumnos de cada elenco.",
            "Enviar correos de activación de cuenta y de recuperación de contraseña.",
            "Elaborar informes de clases realizadas para la Corporación. Esos informes incluyen la fecha, el elenco, el docente a cargo, la cantidad de asistentes y lo que se hizo, pero **no** el RUT ni los datos de contacto de los alumnos.",
            "Mantener la seguridad del sistema y detectar usos indebidos.",
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "**Base legal.** El tratamiento se basa en el consentimiento del titular o, en el caso de menores de 14 años, de su padre, madre o representante legal, otorgado al matricularse en la escuela. También en la relación educativa entre la escuela y sus alumnos y docentes.",
        },
        {
          tipo: "parrafo",
          texto: "**No** vendemos datos personales ni los usamos para publicidad o perfiles comerciales.",
        },
      ],
    },
    {
      titulo: "4. Niños, niñas y adolescentes",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "La mayoría de nuestros alumnos son menores de edad, por lo que sus datos reciben una protección reforzada:",
        },
        {
          tipo: "lista",
          items: [
            "**Menores de 14 años:** sus datos se tratan con el consentimiento de su padre, madre o representante legal, que se entrega al matricularse.",
            "**Entre 14 y 17 años:** pueden usar la plataforma por sí mismos, con conocimiento de su apoderado.",
            "**Datos nunca públicos:** el RUT, la fecha de nacimiento, los correos y la asistencia de un alumno nunca aparecen en el sitio público.",
            "**Datos cifrados:** el RUT, los correos y la fecha de nacimiento se guardan cifrados, y en los listados de la administración se muestran solo de forma parcial (por ejemplo, ••.•••.678-5).",
          ],
        },
        {
          tipo: "parrafo",
          texto: `**Fotografías en el sitio público.** La sección de Actuaciones muestra fotos de presentaciones de la escuela en las que pueden aparecer alumnos. Solo se publican imágenes de actividades artísticas públicas, sin nombres ni datos que permitan identificar a un menor. Si eres apoderado y quieres que se retire una foto en la que aparece tu pupilo, escríbenos a ${CORREO} y la retiraremos.`,
        },
      ],
    },
    {
      titulo: "5. Con quién compartimos los datos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "No entregamos datos personales a terceros para sus propios fines. Para funcionar, la plataforma usa estos proveedores tecnológicos, que tratan los datos solo por cuenta de la Corporación:",
        },
        {
          tipo: "tabla",
          encabezados: ["Proveedor", "Para qué se usa", "Dónde"],
          filas: [
            [
              "Google Firebase (Google LLC)",
              "Cuentas e inicio de sesión, base de datos y almacenamiento de archivos",
              "Servidores fuera de Chile",
            ],
            ["Vercel Inc.", "Alojamiento del sitio y ejecución del servidor", "Servidores fuera de Chile"],
            [
              "Google Gmail",
              "Envío de correos de activación y recuperación de cuenta",
              "Servidores fuera de Chile",
            ],
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "**Transferencia internacional.** Como estos servicios tienen servidores en el extranjero, los datos se almacenan fuera de Chile. Estos proveedores aplican medidas de seguridad y compromisos contractuales de protección de datos.",
        },
        {
          tipo: "parrafo",
          texto:
            "**Corporación de Cultura y Turismo de Calama.** Recibe los informes de clases realizadas, que no incluyen RUT ni datos de contacto de los alumnos.",
        },
        {
          tipo: "parrafo",
          texto:
            "**Autoridades.** Solo entregaremos datos a una autoridad cuando una ley o una orden judicial lo exija.",
        },
      ],
    },
    {
      titulo: "6. Cómo protegemos los datos y cuánto tiempo los guardamos",
      bloques: [
        { tipo: "parrafo", texto: "**Seguridad.** Aplicamos, entre otras, estas medidas:" },
        {
          tipo: "lista",
          items: [
            "Conexión cifrada (HTTPS) en todo el sitio.",
            "Acceso por rol: cada usuario ve solo lo que corresponde a su rol (alumno, docente o administración) y a sus elencos.",
            "Cifrado del RUT, los correos y la fecha de nacimiento en la base de datos.",
            "Contraseñas gestionadas por el proveedor de autenticación, sin que nadie de la escuela pueda conocerlas.",
            "Límite de solicitudes de recuperación de contraseña, para evitar abusos.",
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "Si ocurriera una vulneración de seguridad que afecte datos personales, lo informaremos a los afectados y a la autoridad competente, según exija la ley.",
        },
        { tipo: "parrafo", texto: "**Plazos de conservación.**" },
        {
          tipo: "tabla",
          encabezados: ["Dato", "Cuánto se conserva"],
          filas: [
            [
              "Cuenta y datos de contacto",
              "Mientras la persona sea alumno o docente de la escuela. Al egresar, la cuenta se inhabilita (ya no se puede ingresar) y sus datos de acceso y de contacto se eliminan 12 meses después, salvo que la persona vuelva a matricularse",
            ],
            [
              "Asistencia, clases e informes",
              "5 años desde la fecha de la clase, como respaldo de la gestión educativa ante la Corporación; después se eliminan",
            ],
            ["Material de estudio y tareas", "Mientras el elenco esté activo"],
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "Al eliminarse una cuenta se borran sus datos de acceso y de contacto. Los registros de asistencia y de clases se conservan sin datos de contacto, como historial de la escuela.",
        },
      ],
    },
    {
      titulo: "7. Tus derechos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Como titular de tus datos (o como padre, madre o representante legal de un alumno menor de edad) puedes:",
        },
        {
          tipo: "tabla",
          encabezados: ["Derecho", "Qué significa"],
          filas: [
            ["Acceso", "Saber qué datos tuyos tratamos y para qué"],
            ["Rectificación", "Corregir datos inexactos o incompletos"],
            [
              "Supresión",
              "Pedir que se eliminen tus datos cuando ya no sean necesarios o retires tu consentimiento",
            ],
            ["Oposición", "Oponerte a un tratamiento determinado"],
            ["Portabilidad", "Recibir tus datos en un formato estructurado y de uso común"],
            [
              "Bloqueo",
              "Pedir que se suspenda temporalmente el tratamiento mientras se resuelve una solicitud",
            ],
          ],
        },
        {
          tipo: "parrafo",
          texto: `**Cómo ejercerlos.** Escribe a ${CORREO} indicando tu nombre, el derecho que quieres ejercer y el alumno al que se refiere, si corresponde. Podemos pedirte que acredites tu identidad o tu calidad de representante. Responderemos en un plazo máximo de 30 días corridos.`,
        },
        {
          tipo: "parrafo",
          texto:
            "Si no estás conforme con la respuesta, puedes recurrir a la autoridad de protección de datos personales que corresponda según la ley vigente.",
        },
      ],
    },
    {
      titulo: "8. Cookies y almacenamiento en el navegador",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "El sitio **no usa cookies de publicidad ni de analítica**, y no rastrea tu navegación.",
        },
        {
          tipo: "parrafo",
          texto:
            "Solo usamos lo técnicamente necesario para que funcione el inicio de sesión de la intranet:",
        },
        {
          tipo: "lista",
          items: [
            "Una cookie de sesión, que mantiene tu sesión abierta y protege las páginas privadas.",
            "El almacenamiento local del navegador, que usa el proveedor de autenticación para recordar tu sesión.",
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "Al cerrar sesión, estos datos se eliminan. Si los bloqueas en tu navegador, no podrás ingresar a la intranet, pero el sitio público seguirá funcionando.",
        },
      ],
    },
    {
      titulo: "9. Cambios y contacto",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Podemos actualizar esta política cuando cambie la plataforma o la ley. La versión vigente estará siempre publicada en el sitio, con su fecha de última actualización. Si un cambio afecta de forma importante el uso de tus datos, lo informaremos dentro de la intranet antes de que entre en vigor.",
        },
        { tipo: "parrafo", texto: `Para cualquier consulta sobre privacidad: **${CORREO}**.` },
      ],
    },
  ],
};

export const TERMINOS_CONDICIONES: DocumentoLegal = {
  titulo: "Términos y Condiciones",
  actualizado: ACTUALIZADO,
  introduccion: [
    {
      tipo: "parrafo",
      texto:
        "Estos Términos y Condiciones regulan el uso de la **Plataforma Fénix**: el sitio público y la intranet de la Escuela de Música Calambanda. Al activar tu cuenta e ingresar a la intranet, aceptas estos términos y la Política de Privacidad. Si eres menor de 14 años, los acepta por ti tu padre, madre o representante legal al matricularte.",
    },
  ],
  secciones: [
    {
      titulo: "1. La plataforma",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "La Plataforma Fénix es ofrecida por la **Corporación de Cultura y Turismo de Calama**, a través de la Escuela de Música Calambanda, de forma **gratuita** para sus alumnos y docentes. Tiene dos partes:",
        },
        {
          tipo: "lista",
          items: [
            "**Sitio público:** información de la escuela, sus elencos y sus actuaciones. Cualquier persona puede verlo.",
            "**Intranet:** espacio privado para alumnos, docentes y administración, con material de estudio, clases y asistencia, tareas y avisos.",
          ],
        },
        { tipo: "parrafo", texto: "La plataforma complementa la enseñanza presencial y no la reemplaza." },
      ],
    },
    {
      titulo: "2. Cuentas de usuario",
      bloques: [
        {
          tipo: "lista",
          items: [
            "**Quién puede tener cuenta:** solo los alumnos matriculados, los docentes y el personal autorizado de la escuela. Las cuentas las crea la administración; no existe registro abierto.",
            "**Activación:** cada persona crea su propia contraseña desde el enlace que recibe por correo. Para alumnos menores de edad, el enlace llega al correo del apoderado.",
            "**Ingreso:** se ingresa con el RUT y la contraseña.",
            "**Uso personal:** la cuenta es personal e intransferible. No compartas tu contraseña ni dejes que otra persona use tu sesión. Eres responsable de lo que se haga con tu cuenta.",
            "**Si algo anda mal:** si crees que alguien conoce tu contraseña, cámbiala desde “Olvidé mi contraseña” y avisa a la administración.",
            "**Datos correctos:** si alguno de tus datos está equivocado, pide a la administración que lo corrija.",
          ],
        },
      ],
    },
    {
      titulo: "3. Uso permitido",
      bloques: [
        {
          tipo: "parrafo",
          texto: "La plataforma debe usarse solo para fines educativos de la escuela. No está permitido:",
        },
        {
          tipo: "lista",
          items: [
            "Intentar entrar a cuentas, elencos o secciones que no te corresponden.",
            "Publicar contenido ofensivo, discriminatorio, violento o que vulnere los derechos de otras personas, en especial de niños, niñas y adolescentes.",
            "Descargar, copiar o difundir datos personales de otros alumnos, docentes o apoderados.",
            "Grabar, fotografiar o compartir fuera de la plataforma información privada que veas en ella.",
            "Interferir con el funcionamiento del sistema, probar sus vulnerabilidades o usar programas automatizados para acceder a él.",
          ],
        },
        {
          tipo: "parrafo",
          texto: `Si encuentras una falla de seguridad, avísanos a ${CORREO} en vez de aprovecharla.`,
        },
      ],
    },
    {
      titulo: "4. Material de estudio y propiedad intelectual",
      bloques: [
        {
          tipo: "lista",
          items: [
            "**Uso personal y educativo:** las partituras, audios y demás material que los docentes publican son solo para el estudio personal de los alumnos del elenco. No se pueden vender, publicar en internet ni compartir con personas ajenas a la escuela.",
            "**Derechos de terceros:** parte del material puede estar protegido por derechos de autor de sus compositores o editores. Su uso dentro de la plataforma se limita a fines educativos.",
            "**Responsabilidad de los docentes:** el docente que sube un material es responsable de tener derecho a compartirlo con su elenco con fines educativos.",
            "**Contenido del sitio:** los textos, logos, fotografías y el diseño del sitio pertenecen a la Corporación o se usan con autorización. No pueden reproducirse sin permiso.",
            "**Tus aportes:** lo que escribes en la plataforma (por ejemplo, las tareas que marcas como cumplidas) se usa solo para la gestión educativa de la escuela.",
          ],
        },
      ],
    },
    {
      titulo: "5. Responsabilidades de docentes y administración",
      bloques: [
        {
          tipo: "parrafo",
          texto: "Quienes tienen acceso a datos de los alumnos asumen estos compromisos:",
        },
        {
          tipo: "lista",
          items: [
            "**Confidencialidad:** usar los datos de los alumnos solo para la labor educativa y no compartirlos fuera de la escuela.",
            "**Clases y asistencia:** iniciar y finalizar las clases en la plataforma y registrar la asistencia con veracidad, junto con lo que se trabajó en cada clase. Esos registros forman parte de los informes que se entregan a la Corporación.",
            "**Observaciones:** registrar con el “ojito” solo hechos objetivos y relevantes, en un lenguaje respetuoso. Las observaciones son de uso interno.",
            "**Cuentas:** la administración crea, modifica y elimina cuentas solo con información verificada, y retira el acceso de quien deja de pertenecer a la escuela.",
          ],
        },
      ],
    },
    {
      titulo: "6. Disponibilidad y responsabilidad",
      bloques: [
        {
          tipo: "lista",
          items: [
            "**Disponibilidad:** procuramos que la plataforma esté disponible de forma continua, pero puede tener interrupciones por mantenimiento, fallas técnicas o problemas de los proveedores. Cuando sea posible, avisaremos las mantenciones con anticipación.",
            "**Respaldo del material:** la plataforma no reemplaza el respaldo que cada docente mantenga de su propio material.",
            "**Enlaces externos:** el sitio puede enlazar a servicios de terceros, como Google Maps, Facebook o Instagram. Esos sitios tienen sus propias condiciones y políticas.",
            "**Límite de responsabilidad:** en la medida que la ley lo permita, la Corporación no responde por daños derivados del mal uso de una cuenta por su titular o por terceros a quienes este haya entregado su contraseña.",
          ],
        },
      ],
    },
    {
      titulo: "7. Suspensión y cierre de cuentas",
      bloques: [
        {
          tipo: "lista",
          items: [
            "**Suspensión:** la administración puede suspender una cuenta si se incumplen estos términos o si hay riesgo para la seguridad de la plataforma o de otros usuarios. Cuando sea posible, informará el motivo al usuario o a su apoderado.",
            "**Cierre:** cuando la persona deja de ser alumno o docente de la escuela, su cuenta se inhabilita y ya no se puede ingresar. Doce meses después, la cuenta y sus datos de contacto se eliminan, salvo que la persona vuelva a matricularse.",
            "**Qué se conserva:** al cerrar una cuenta, los registros de asistencia y de clases se mantienen como historial de la escuela, según lo indicado en la Política de Privacidad.",
          ],
        },
      ],
    },
    {
      titulo: "8. Disposiciones finales",
      bloques: [
        {
          tipo: "lista",
          items: [
            "**Privacidad:** el tratamiento de datos personales se rige por la Política de Privacidad de la Plataforma Fénix, que forma parte de estos términos.",
            "**Cambios:** podemos actualizar estos términos. La versión vigente estará siempre publicada en el sitio con su fecha. Los cambios importantes se informarán dentro de la intranet, y seguir usando la plataforma después de ese aviso implica aceptarlos.",
            "**Ley aplicable:** estos términos se rigen por las leyes de la República de Chile. Cualquier controversia se someterá a los tribunales competentes de la ciudad de Calama.",
            `**Contacto:** para consultas sobre estos términos, escribe a **${CORREO}**.`,
          ],
        },
      ],
    },
  ],
};
