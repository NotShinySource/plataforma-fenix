import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { PreguntasFrecuentes } from "@/components/landing/PreguntasFrecuentes";
import { Footer } from "@/components/landing/Footer";
import { leerPreguntasPublicas } from "@/lib/landing/leer";
import { jsonLdPreguntas } from "@/lib/landing/preguntas";

export const metadata: Metadata = {
  title: "Preguntas frecuentes — Escuela de Música Calambanda",
  description:
    "Respuestas sobre la Escuela de Música Calambanda: inscripciones, talleres, clases, presentaciones y contacto.",
};

/**
 * Página propia de preguntas frecuentes, para no alargar la Landing. Como la
 * Landing, queda en caché una hora y se regenera al guardar desde el panel.
 */
export const revalidate = 3600;

export default async function PaginaPreguntasFrecuentes() {
  const preguntas = await leerPreguntasPublicas();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <PreguntasFrecuentes preguntas={preguntas} />
      {preguntas.length > 0 && (
        // Datos estructurados para buscadores. jsonLdPreguntas escapa "<" y ">",
        // así ningún texto editable puede cerrar esta etiqueta.
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdPreguntas(preguntas) }}
        />
      )}
      <Footer />
    </div>
  );
}
