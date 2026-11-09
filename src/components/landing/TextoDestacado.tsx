import { partesDestacadas } from "@/lib/landing/validacion";

interface TextoDestacadoProps {
  texto: string;
  /** Clases del texto destacado (el que va entre asteriscos en el panel). */
  claseDestacado: string;
  /** Etiqueta del destacado: un color en los títulos, negrita en los párrafos. */
  como?: "span" | "strong";
}

/**
 * Muestra un texto editable desde el panel, destacando lo que va entre
 * asteriscos. Se arma con elementos de React, nunca con HTML, así que el
 * texto no puede inyectar etiquetas ni scripts.
 */
export function TextoDestacado({ texto, claseDestacado, como: Etiqueta = "span" }: TextoDestacadoProps) {
  return (
    <>
      {partesDestacadas(texto).map((parte, i) =>
        parte.destacado ? (
          <Etiqueta key={i} className={claseDestacado}>
            {parte.texto}
          </Etiqueta>
        ) : (
          parte.texto
        )
      )}
    </>
  );
}
