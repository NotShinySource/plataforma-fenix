import {
  CATEGORIAS_ELENCO,
  INSTRUMENTOS,
  TIPOS_ELENCO,
  type CategoriaElenco,
  type Elenco,
  type Instrumento,
  type TipoElenco,
} from "@/types";

type TipoDeGrupo = Pick<Elenco, "categoria" | "tipoElenco" | "instrumento">;

/** Texto corto del tipo de grupo, para las etiquetas de las tarjetas. */
export function etiquetaTipoGrupo(grupo: TipoDeGrupo): string {
  if (grupo.categoria === "instrumento") {
    return grupo.instrumento ? `Clase de ${grupo.instrumento.toLowerCase()}` : "Clase de instrumento";
  }
  return grupo.tipoElenco ?? "Elenco";
}

export interface DatosTipoGrupo {
  categoria: CategoriaElenco;
  tipoElenco?: TipoElenco;
  instrumento?: Instrumento;
}

export type ResultadoTipoGrupo =
  | { ok: true; datos: DatosTipoGrupo }
  | { ok: false; error: string };

/**
 * Valida la categoría y su tipo, y devuelve solo los campos que le
 * corresponden: un elenco guarda `tipoElenco` y una clase guarda
 * `instrumento`, nunca los dos.
 */
export function validarTipoGrupo(entrada: {
  categoria: unknown;
  tipoElenco?: unknown;
  instrumento?: unknown;
}): ResultadoTipoGrupo {
  const { categoria, tipoElenco, instrumento } = entrada;

  if (!CATEGORIAS_ELENCO.includes(categoria as CategoriaElenco)) {
    return { ok: false, error: "Categoría inválida." };
  }

  if (categoria === "instrumento") {
    if (!INSTRUMENTOS.includes(instrumento as Instrumento)) {
      return { ok: false, error: "Instrumento inválido." };
    }
    return { ok: true, datos: { categoria, instrumento: instrumento as Instrumento } };
  }

  if (!TIPOS_ELENCO.includes(tipoElenco as TipoElenco)) {
    return { ok: false, error: "Tipo de elenco inválido." };
  }
  return { ok: true, datos: { categoria: "elenco", tipoElenco: tipoElenco as TipoElenco } };
}
