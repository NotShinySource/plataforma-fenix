import type { Correo } from "./enviar-correo";

export type MotivoEnlace = "activacion" | "recuperacion";

interface DatosEnlaceAcceso {
  /** Nombre de pila del titular de la cuenta (alumno, docente o administrador). */
  nombre: string;
  enlace: string;
  motivo: MotivoEnlace;
  /** true si el correo va al apoderado de un alumno. */
  paraApoderado: boolean;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Correo con el enlace para crear (activación) o restablecer (recuperación)
 * la contraseña. Nunca incluye el RUT ni otros datos personales: solo el
 * nombre de pila, para que el apoderado sepa de qué cuenta se trata.
 */
export function plantillaEnlaceAcceso(datos: DatosEnlaceAcceso): Omit<Correo, "para"> {
  const esActivacion = datos.motivo === "activacion";
  const asunto = esActivacion
    ? "Activa tu cuenta en la Plataforma Fénix"
    : "Restablece tu contraseña de la Plataforma Fénix";

  const titular = datos.paraApoderado
    ? `la cuenta de ${datos.nombre}`
    : "tu cuenta";
  const saludo = datos.paraApoderado ? "Hola:" : `Hola, ${datos.nombre}:`;
  const accion = esActivacion
    ? `crear la contraseña de ${titular}`
    : `restablecer la contraseña de ${titular}`;
  const boton = esActivacion ? "Crear contraseña" : "Restablecer contraseña";

  const parrafos = [
    `Recibimos una solicitud para ${accion} en la Plataforma Fénix de la Escuela de Música Calambanda.`,
    "Para continuar, abre el siguiente enlace. Es válido por un tiempo limitado y solo funciona una vez.",
    "Si no hiciste esta solicitud, puedes ignorar este correo: la cuenta no cambia hasta que se use el enlace.",
  ];

  const texto = [
    saludo,
    "",
    parrafos[0],
    "",
    parrafos[1],
    datos.enlace,
    "",
    parrafos[2],
    "",
    "Escuela de Música Infanto Juvenil Calambanda",
  ].join("\n");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#1e3a8a;">PLATAFORMA FÉNIX</p>
      <h1 style="margin:0 0 20px;font-size:20px;">${escaparHtml(asunto)}</h1>
      <p style="margin:0 0 12px;line-height:1.5;">${escaparHtml(saludo)}</p>
      <p style="margin:0 0 12px;line-height:1.5;">${escaparHtml(parrafos[0])}</p>
      <p style="margin:0 0 24px;line-height:1.5;">${escaparHtml(parrafos[1])}</p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="${escaparHtml(datos.enlace)}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:12px;">${escaparHtml(boton)}</a>
      </p>
      <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#475569;">Si el botón no funciona, copia este enlace en tu navegador:</p>
      <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;color:#475569;">${escaparHtml(datos.enlace)}</p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#475569;">${escaparHtml(parrafos[2])}</p>
    </div>
    <p style="max-width:520px;margin:16px auto 0;text-align:center;font-size:11px;color:#94a3b8;">Escuela de Música Infanto Juvenil Calambanda</p>
  </body>
</html>`;

  return { asunto, texto, html };
}
