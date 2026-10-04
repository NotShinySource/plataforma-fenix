/**
 * Versiones parciales de los datos sensibles para los listados del panel de
 * Administración: alcanzan para reconocer o distinguir a una persona sin
 * exponer el dato completo en pantalla ni enviarlo al navegador.
 */

/** "12.345.678-5" → "••.•••.678-5": solo los últimos tres dígitos y el verificador. */
export function enmascararRut(rut: string): string {
  const limpio = rut.replace(/[.\-\s]/g, "").toUpperCase();
  if (limpio.length < 5) return "•••";

  const dv = limpio.slice(-1);
  const visibles = limpio.slice(-4, -1);
  const millones = "•".repeat(Math.max(1, limpio.length - 7));
  return `${millones}.•••.${visibles}-${dv}`;
}

/**
 * "apoderado@gmail.com" → "ap•••••@gmail.com". La cantidad de puntos es fija
 * para no revelar el largo real de la dirección.
 */
export function enmascararEmail(email: string): string {
  const [local, dominio] = email.split("@");
  if (!local || !dominio) return "•••••";
  const visibles = local.slice(0, local.length > 2 ? 2 : 1);
  return `${visibles}•••••@${dominio}`;
}
