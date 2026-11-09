import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Organizacion } from "@/components/landing/Organizacion";
import { Escuelas } from "@/components/landing/Escuelas";
import { Actuaciones } from "@/components/landing/Actuaciones";
import { Footer } from "@/components/landing/Footer";
import { leerLandingPublica } from "@/lib/landing/leer";
import { formatearFechaSesion } from "@/lib/format";

/**
 * La Landing se arma en el servidor con el contenido que edita el
 * Administrador. Queda en caché una hora; al guardar desde el panel se
 * regenera de inmediato (revalidatePath en los Server Actions).
 */
export const revalidate = 3600;

export default async function LandingPage() {
  const { contenido, actuaciones } = await leerLandingPublica();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero portada={contenido.portada} />
      <Organizacion organizacion={contenido.organizacion} />
      <Escuelas />
      <Actuaciones
        actuaciones={actuaciones.map((actuacion) => ({
          id: actuacion.id,
          titulo: actuacion.titulo,
          fecha: formatearFechaSesion(actuacion.fecha),
          lugar: actuacion.lugar,
          descripcion: actuacion.descripcion,
          imagenes: actuacion.imagenes.map((imagen) => imagen.url),
          enlaces: actuacion.enlaces,
        }))}
      />
      <Footer />
    </div>
  );
}
