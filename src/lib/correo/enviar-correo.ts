import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

export interface Correo {
  para: string[];
  asunto: string;
  texto: string;
  html: string;
}

type ModoCorreo = "smtp" | "consola";

/**
 * "consola": no envía nada, imprime el correo en la terminal del servidor
 * (desarrollo con emulador, para no mandar correos reales mientras se prueba).
 * "smtp": envía por Gmail. Se puede forzar con CORREO_MODO; si no se define,
 * usa "consola" solo cuando la app corre contra el emulador en desarrollo.
 */
function modoCorreo(): ModoCorreo {
  const forzado = process.env.CORREO_MODO;
  if (forzado === "smtp" || forzado === "consola") return forzado;

  const usaEmulador =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    process.env.NODE_ENV === "development";
  return usaEmulador ? "consola" : "smtp";
}

let transportador: Transporter | null = null;

/**
 * Gmail por SMTP con una "contraseña de aplicación" (requiere verificación en
 * dos pasos en la cuenta). Límite aproximado de Gmail: 500 destinatarios al día.
 */
function obtenerTransportador(): Transporter {
  if (transportador) return transportador;

  const usuario = process.env.CORREO_USUARIO;
  const contrasena = process.env.CORREO_CONTRASENA_APLICACION;
  if (!usuario || !contrasena) {
    throw new Error("Faltan CORREO_USUARIO o CORREO_CONTRASENA_APLICACION para enviar correos.");
  }

  transportador = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: usuario, pass: contrasena },
  });
  return transportador;
}

/** Envía un correo. Lanza un error si el envío falla, para que quien llama decida qué mostrar. */
export async function enviarCorreo(correo: Correo): Promise<void> {
  if (correo.para.length === 0) {
    throw new Error("El correo no tiene destinatarios.");
  }

  if (modoCorreo() === "consola") {
    console.log(
      [
        "",
        "──────── CORREO (modo consola, no se envió) ────────",
        `Para:   ${correo.para.join(", ")}`,
        `Asunto: ${correo.asunto}`,
        "",
        correo.texto,
        "────────────────────────────────────────────────────",
        "",
      ].join("\n")
    );
    return;
  }

  const remitente = process.env.CORREO_USUARIO!;
  await obtenerTransportador().sendMail({
    from: { name: "Plataforma Fénix · Calambanda", address: remitente },
    to: correo.para,
    subject: correo.asunto,
    text: correo.texto,
    html: correo.html,
  });
}
