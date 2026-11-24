import { ChevronDown } from "lucide-react";
import { agruparPorCategoria, bloquesRespuesta } from "@/lib/landing/preguntas";
import type { ConId, PreguntaFrecuente } from "@/types";

interface PreguntasFrecuentesProps {
  /** Solo las publicadas. */
  preguntas: ConId<PreguntaFrecuente>[];
}

/** El texto se arma con elementos de React, nunca como HTML: no puede inyectar etiquetas. */
function Respuesta({ texto }: { texto: string }) {
  return (
    <div className="space-y-3 text-slate-600 font-medium leading-relaxed">
      {bloquesRespuesta(texto).map((bloque, i) =>
        bloque.tipo === "parrafo" ? (
          <p key={i}>{bloque.texto}</p>
        ) : (
          <ul key={i} className="list-disc pl-5 space-y-1 marker:text-terracotta">
            {bloque.elementos.map((elemento, j) => (
              <li key={j}>{elemento}</li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

/**
 * Contenido de la página de preguntas frecuentes, agrupado por categoría.
 * Cada pregunta es un
 * <details>: se abre con clic o teclado sin JavaScript, y los lectores de
 * pantalla la anuncian como un elemento desplegable.
 */
export function PreguntasFrecuentes({ preguntas }: PreguntasFrecuentesProps) {
  const grupos = agruparPorCategoria(preguntas);

  return (
    <main className="pt-32 pb-24 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 space-y-4">
          <span className="text-terracotta font-extrabold tracking-widest uppercase text-xs">
            Resolvemos tus dudas
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-text-dark leading-tight">
            Preguntas frecuentes
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Lo que más nos consultan las familias sobre la escuela, las inscripciones y las clases.
          </p>
        </div>

        {grupos.length === 0 && (
          <p className="text-center text-slate-600 font-medium">
            Pronto publicaremos las preguntas frecuentes. Mientras tanto, escríbenos por nuestros
            canales oficiales.
          </p>
        )}

        <div className="space-y-12">
          {grupos.map((grupo) => (
            <div key={grupo.categoria} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-text-dark">{grupo.categoria}</h2>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="space-y-3">
                {grupo.preguntas.map((pregunta) => (
                  <details
                    key={pregunta.id}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm open:shadow-md open:border-primary/20 transition-shadow"
                  >
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 sm:px-6 py-4 font-bold text-text-dark rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
                      <span>{pregunta.pregunta}</span>
                      <ChevronDown
                        aria-hidden
                        className="w-5 h-5 flex-shrink-0 text-primary transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <div className="px-5 sm:px-6 pb-5">
                      <Respuesta texto={pregunta.respuesta} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
