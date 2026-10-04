import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { authAdmin, dbAdmin } from "@/lib/firebase/admin";
import { rutEsValido } from "@/lib/auth/rut";
import { generarEnlaceEstablecerContrasena } from "@/lib/auth/enlace-acceso";
import { enviarCorreo } from "@/lib/correo/enviar-correo";
import { plantillaEnlaceAcceso, type MotivoEnlace } from "@/lib/correo/plantillas";
import { identificadorDesdeRut } from "@/lib/seguridad/cifrado";
import { descifrarDatosPrivados } from "@/lib/seguridad/datos-privados";

export const MAXIMO_SOLICITUDES_POR_HORA = 5;
const UNA_HORA_MS = 60 * 60 * 1000;

/**
 * Cuenta una solicitud dentro de la ventana de una hora de esa cuenta y dice
 * si todavía está permitida. En transacción, para que dos solicitudes
 * simultáneas no se salten el límite. Usa el reloj del servidor.
 */
export async function registrarSolicitudSiPermitida(uid: string): Promise<boolean> {
  const ref = dbAdmin.collection("solicitudes_acceso").doc(uid);

  return dbAdmin.runTransaction(async (transaccion) => {
    const snap = await transaccion.get(ref);
    const ahora = Timestamp.now();
    const datos = snap.data() as { inicioVentana?: Timestamp; cantidad?: number } | undefined;

    const ventanaVigente =
      datos?.inicioVentana !== undefined &&
      ahora.toMillis() - datos.inicioVentana.toMillis() < UNA_HORA_MS;

    if (!ventanaVigente) {
      transaccion.set(ref, { inicioVentana: ahora, cantidad: 1 });
      return true;
    }
    if ((datos?.cantidad ?? 0) >= MAXIMO_SOLICITUDES_POR_HORA) {
      return false;
    }
    transaccion.update(ref, { cantidad: (datos?.cantidad ?? 0) + 1 });
    return true;
  });
}

interface DestinoCorreo {
  direccion: string;
  paraApoderado: boolean;
}

/**
 * Procesa una solicitud de "primera vez / olvidé mi contraseña": si el RUT
 * corresponde a una cuenta activa con correos registrados y no superó el
 * límite por hora, genera el enlace y lo envía a esos correos.
 *
 * No devuelve nada a propósito: quien llama responde siempre lo mismo, exista
 * o no la cuenta, para que no se pueda averiguar qué RUT están registrados.
 * Por la misma razón el envío de correos (lo más lento) se entrega a
 * `programar`, que lo ejecuta después de responder: así el tiempo de
 * respuesta tampoco delata si la cuenta existe.
 */
export async function procesarSolicitudAcceso(
  rut: string,
  programar: (tarea: () => Promise<void>) => void
): Promise<void> {
  if (typeof rut !== "string" || !rutEsValido(rut)) return;

  const identificador = identificadorDesdeRut(rut);

  let uid: string;
  try {
    uid = (await authAdmin.getUserByEmail(identificador)).uid;
  } catch {
    return; // RUT no registrado.
  }

  const [usuarioDoc, privadoDoc] = await Promise.all([
    dbAdmin.collection("usuarios").doc(uid).get(),
    dbAdmin.collection("datos_privados").doc(uid).get(),
  ]);
  const usuario = usuarioDoc.data();
  if (!usuario || usuario.activo !== true || !privadoDoc.exists) return;

  const privados = descifrarDatosPrivados(privadoDoc.data()!);
  const esAlumno = usuario.rol === "alumno";

  // El correo propio va con el texto del titular; el del apoderado, con el suyo.
  const destinos = new Map<string, DestinoCorreo>();
  if (privados.emailApoderado) {
    destinos.set(privados.emailApoderado, {
      direccion: privados.emailApoderado,
      paraApoderado: true,
    });
  }
  if (privados.email && !destinos.has(privados.email)) {
    destinos.set(privados.email, { direccion: privados.email, paraApoderado: false });
  }
  if (destinos.size === 0) return;

  if (!(await registrarSolicitudSiPermitida(uid))) return;

  const enlace = await generarEnlaceEstablecerContrasena(identificador);
  const motivo: MotivoEnlace =
    usuario.estadoActivacion === "activada" ? "recuperacion" : "activacion";
  const nombre = String(usuario.nombres ?? "").split(" ")[0] || "el titular";

  programar(async () => {
    await Promise.all(
      [...destinos.values()].map(async (destino) => {
        try {
          await enviarCorreo({
            para: [destino.direccion],
            ...plantillaEnlaceAcceso({
              nombre,
              enlace,
              motivo,
              paraApoderado: esAlumno && destino.paraApoderado,
            }),
          });
        } catch (error) {
          // Sin datos personales en el registro: solo el uid.
          console.error(`No se pudo enviar el enlace de acceso de ${uid}:`, error);
        }
      })
    );
  });
}
