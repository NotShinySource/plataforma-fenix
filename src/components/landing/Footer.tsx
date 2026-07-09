import { Mail, MapPin, Music, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon, TwitterIcon } from "./SocialIcons";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-20 pb-12 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-terracotta/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter">CALAMBANDA</span>
            </div>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
              Escuela de Música Infanto Juvenil de la Corporación de Cultura y Turismo de Calama.
              Transformación artística en la Provincia de El Loa.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="#"
                className="p-2.5 bg-white/5 hover:bg-primary rounded-xl text-white transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2.5 bg-white/5 hover:bg-primary rounded-xl text-white transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2.5 bg-white/5 hover:bg-primary rounded-xl text-white transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-terracotta-light">
              Información y Contacto
            </h4>
            <div className="space-y-3 font-medium text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Ex Parque de los Lolos s/n, Calama</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>contacto@calambanda.cl</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>+56 55 2123 456</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-light">
              Soporte e Intranet
            </h4>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              ¿Eres alumno activo y necesitas tus partituras o audios de estudio? Accede mediante
              nuestro portal exclusivo &quot;Fénix&quot;.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} Escuela de Música Calambanda. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            Desarrollado con orgullo por <span className="text-white font-bold">Appa-tec</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
