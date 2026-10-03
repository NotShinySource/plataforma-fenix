/**
 * Deja solo dígitos y dígito verificador, en minúsculas (sin puntos ni guion).
 * El identificador de la cuenta de Firebase Auth se deriva de este valor en el
 * servidor (ver identificadorDesdeRut en src/lib/seguridad/cifrado.ts).
 */
export function limpiarRut(rut: string): string {
  return rut.replace(/[.\-]/g, "").toLowerCase();
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
