const DOMINIO_CORREO_SINTETICO = "fenix.local";

/** Deja solo dígitos y dígito verificador, en minúsculas (sin puntos ni guion). */
export function limpiarRut(rut: string): string {
  return rut.replace(/[.\-]/g, "").toLowerCase();
}

/**
 * Deriva el correo sintético interno que Firebase Auth exige para el login
 * por RUT (RF-01): el usuario nunca ve ni
 * conoce este correo, solo ingresa su RUT.
 */
export function emailSinteticoDesdeRut(rut: string): string {
  return `${limpiarRut(rut)}@${DOMINIO_CORREO_SINTETICO}`;
}

/** Dígito verificador de un RUT chileno (algoritmo módulo 11) a partir del cuerpo (sin el DV). */
function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "k";
  return String(resto);
}

/**
 * Valida un RUT chileno completo: formato (7-8 dígitos + DV) y que el DV sea
 * matemáticamente correcto (módulo 11). Usado en el login (RF-01) y en la
 * creación de usuarios (Admin) antes de intentar cualquier llamada a Firebase.
 */
export function rutEsValido(rut: string): boolean {
  const limpio = limpiarRut(rut);
  if (!/^\d{7,8}[0-9k]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return calcularDigitoVerificador(cuerpo) === dv;
}
