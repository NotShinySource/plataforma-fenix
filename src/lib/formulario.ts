/**
 * Valor actual de un campo del formulario, leído del propio campo y no del
 * estado de React.
 *
 * Safari y los gestores de contraseñas pueden autocompletar un campo sin
 * disparar el evento que React escucha: el campo se ve lleno, pero el estado
 * sigue vacío. En las pantallas de acceso, por eso, los valores se leen del
 * formulario al momento de enviarlo.
 */
export function valorDelCampo(formulario: HTMLFormElement, id: string): string {
  return formulario.querySelector<HTMLInputElement>(`#${id}`)?.value ?? "";
}
