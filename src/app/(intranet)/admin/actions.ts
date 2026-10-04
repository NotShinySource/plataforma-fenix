"use server";

import { dbAdmin } from "@/lib/firebase/admin";
import { verificarAdmin } from "@/lib/auth/verificar-admin";
import type { RolUsuario } from "@/types";

export interface CuentaPendiente {
  id: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
}

export interface ResumenAdmin {
  alumnos: number;
  profesores: number;
  elencos: number;
  pendientes: number;
  /** Hasta 5 cuentas que todavía no crean su contraseña, para mostrarlas en el panel. */
  cuentasPendientes: CuentaPendiente[];
}

export type ResumenAdminResultado =
  | { ok: true; resumen: ResumenAdmin }
  | { ok: false; error: string };

/** Cifras del panel de inicio del Administrador. Solo datos no sensibles (sin RUT ni correos). */
export async function obtenerResumenAdminAction(idTokenAdmin: string): Promise<ResumenAdminResultado> {
  const verificacion = await verificarAdmin(idTokenAdmin);
  if (!verificacion.ok) {
    return { ok: false, error: verificacion.error };
  }

  try {
    const usuarios = dbAdmin.collection("usuarios");
    const consultaPendientes = usuarios.where("estadoActivacion", "==", "pendiente");

    const [alumnos, profesores, elencos, pendientes, muestraPendientes] = await Promise.all([
      usuarios.where("rol", "==", "alumno").count().get(),
      usuarios.where("rol", "==", "profesor").count().get(),
      dbAdmin.collection("elencos").count().get(),
      consultaPendientes.count().get(),
      consultaPendientes.limit(5).get(),
    ]);

    return {
      ok: true,
      resumen: {
        alumnos: alumnos.data().count,
        profesores: profesores.data().count,
        elencos: elencos.data().count,
        pendientes: pendientes.data().count,
        cuentasPendientes: muestraPendientes.docs.map((d) => ({
          id: d.id,
          nombres: d.data().nombres,
          apellidos: d.data().apellidos,
          rol: d.data().rol,
        })),
      },
    };
  } catch (error) {
    console.error("Error obteniendo el resumen del Admin:", error);
    return { ok: false, error: "No se pudo cargar el resumen." };
  }
}
