/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Users, 
  FileText, 
  Download, 
  Play, 
  ChevronRight, 
  MapPin, 
  Mail, 
  Phone, 
  LogOut, 
  BookOpen, 
  Calendar, 
  Instagram, 
  Facebook, 
  Twitter, 
  Lock, 
  CheckCircle2, 
  Volume2, 
  Search, 
  Menu, 
  X,
  FileDown
} from 'lucide-react';

// --- Shared Mock Data ---

const MOCK_PERFORMANCES = [
  {
    id: 1,
    title: "Concierto Aniversario X",
    date: "12 Noviembre, 2025",
    place: "Teatro Municipal de Calama",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
    desc: "Celebración de nuestra primera década fomentando el arte y la música en la juventud loína."
  },
  {
    id: 2,
    title: "Presentación Teatro Municipal",
    date: "28 Septiembre, 2025",
    place: "Gran Sala de Calama",
    image: "https://images.unsplash.com/photo-1514320299584-4bd00bcd44da?auto=format&fit=crop&q=80&w=800",
    desc: "Nuestros elencos de bronces y coro deleitaron con un repertorio sinfónico latinoamericano."
  },
  {
    id: 3,
    title: "Encuentro de Orquestas del Norte",
    date: "04 Julio, 2025",
    place: "Ex Parque de los Lolos",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800",
    desc: "Anfitriones del encuentro regional que congregó a más de 300 jóvenes músicos nortinos."
  },
  {
    id: 4,
    title: "Concierto de Navidad Patrimonial",
    date: "20 Diciembre, 2025",
    place: "Parque José Saavedra",
    image: "https://images.unsplash.com/photo-1543840518-701021b3f745?auto=format&fit=crop&q=80&w=800",
    desc: "Villancicos andinos y clásicos universales interpretados bajo las estrellas para la comunidad de Calama."
  }
];

const MOCK_ELENCOS = [
  {
    id: "banda-bronces",
    title: "Banda de Bronces",
    desc: "Sección de trompetas, trombones, tubas y percusión con un enfoque dinámico y festivo.",
    color: "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-100",
    accentColor: "text-blue-600",
    badge: "Metales & Percusión",
    materials: [
      { id: "m1", title: "Sinfonía del Desierto - Score General", type: "pdf", date: "Hace 2 días", url: "#", size: "2.4 MB" },
      { id: "m2", title: "Ensambles de Metal - Guía Técnica No. 3", type: "pdf", date: "Hace 5 días", url: "#", size: "1.1 MB" },
      { id: "m3", title: "Ensayo General de Trompetas - Audio de Referencia", type: "mp3", date: "Hace 1 semana", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { id: "m4", title: "Parte Individual: Trombón 1 - Melodía Calama", type: "pdf", date: "Hace 2 semanas", url: "#", size: "850 KB" }
    ]
  },
  {
    id: "coro",
    title: "Coro Infanto Juvenil",
    desc: "Exploración vocal y polifonía para todas las edades con enfoque en rescate patrimonial.",
    color: "bg-gradient-to-br from-terracotta/10 to-orange-500/10 border-orange-100",
    accentColor: "text-terracotta",
    badge: "Vocal",
    materials: [
      { id: "m5", title: "Canto Andino - Partitura Coral SATB", type: "pdf", date: "Ayer", url: "#", size: "3.2 MB" },
      { id: "m6", title: "Sección Sopranos - Audio de Ensayo en Casa", type: "mp3", date: "Hace 3 días", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { id: "m7", title: "Sección Contraltos - Guía de Afinación", type: "mp3", date: "Hace 4 días", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { id: "m8", title: "Himno de Calama - Letra y Armonía Oficial", type: "pdf", date: "Hace 10 días", url: "#", size: "1.5 MB" }
    ]
  }
];

// --- Sub-components ---

function LandingNavbar({ onNavigate, onOpenLogin }: { onNavigate: (section: string) => void, onOpenLogin: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { label: "Inicio", href: "#inicio" },
    { label: "Nuestra Organización", href: "#organizacion" },
    { label: "Actuaciones", href: "#actuaciones" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-primary p-2.5 rounded-xl shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tighter text-text-dark block leading-none">CALAMBANDA</span>
              <span className="text-[10px] font-bold tracking-widest text-terracotta block mt-0.5 uppercase">Escuela de Música</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a 
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-text-dark/80 hover:text-primary transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Action */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onOpenLogin}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-tight transition-all shadow-md shadow-primary/15 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Ingresar a Intranet
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-dark p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {links.map((link) => (
                <a 
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-bold text-text-dark/80 hover:text-primary py-2 px-3 hover:bg-slate-50 rounded-xl transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-center transition-all shadow-md block"
                >
                  Ingresar a Intranet
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function LandingHero({ onOpenLogin }: { onOpenLogin: () => void }) {
  return (
    <section id="inicio" className="pt-32 pb-20 md:py-40 bg-gradient-to-b from-blue-50/40 via-white to-white relative overflow-hidden">
      {/* Absolute decorative bubbles/gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-terracotta/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              Música para el Futuro
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-text-dark tracking-tight leading-[1.1]">
              El impacto del arte en la <span className="text-primary">juventud</span> loína
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Transformamos vidas a través de la educación musical gratuita y de excelencia. Fomentando el compañerismo, la disciplina y el rescate cultural en Calama.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <a 
                href="#organizacion"
                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-bold text-center transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Conoce nuestra escuela
              </a>
              <button 
                onClick={onOpenLogin}
                className="bg-white hover:bg-slate-50 text-text-dark border border-slate-200 px-8 py-4 rounded-xl font-bold text-center transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Acceso Intranet Estudiante <ChevronRight className="w-5 h-5 text-terracotta" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-8 lg:mt-0">
            <div className="relative group mx-auto max-w-md lg:max-w-none">
              {/* Card visual wrapper */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-terracotta/10 to-primary-light/10 blur-2xl opacity-60 rounded-[40px] group-hover:scale-105 transition-transform duration-500" />
              
              <div className="relative bg-white p-4 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                <img 
                  src="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200" 
                  alt="Orquesta Juvenil de Calama" 
                  className="w-full h-auto rounded-2xl object-cover aspect-[4/3] shadow-inner"
                />
                
                {/* Floating Micro UI Item */}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3">
                  <div className="bg-terracotta/10 p-2.5 rounded-xl text-terracotta">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-text-dark leading-none">700+</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estudiantes activos</p>
                  </div>
                </div>

                {/* Floating Micro UI Item 2 */}
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-dark leading-none">Matrícula 100%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gratuita</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function LandingOrganization() {
  return (
    <section id="organizacion" className="py-24 bg-white relative z-10 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-[40px] p-8 md:p-16 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-terracotta/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <span className="text-terracotta font-extrabold tracking-widest uppercase text-xs">Nuestra Organización</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-text-dark leading-tight">
                Misión, historia y rescate cultural en Calama
              </h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                La Escuela de Música Infanto Juvenil <strong className="text-text-dark">Calambanda</strong> nació bajo la convicción de que el arte es un motor de cambio social invaluable. Operamos activamente en los espacios patrimoniales restaurados de nuestra comuna, llevando alegría, educación y valores a familias enteras.
              </p>
              <p className="text-slate-600 leading-relaxed font-medium">
                Nuestra misión central es fomentar el talento artístico local, ofreciendo un entorno seguro, inclusivo y profesional para que los niños y jóvenes desarrollen habilidades musicales óptimas. Rescatamos el patrimonio del desierto de Atacama mediante repertorios inspirados en nuestras raíces.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-2xl font-black text-primary block">12</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">Docentes Expertos</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-2xl font-black text-terracotta block">700+</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">Alumnos Activos</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm col-span-2 md:col-span-1">
                  <span className="text-2xl font-black text-indigo-600 block">Ex Lolos</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">Sede Histórica</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="space-y-4">
                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark text-lg">Inclusión Total</h4>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">No exigimos conocimientos previos. Todo joven con ganas de aprender es bienvenido en nuestra familia.</p>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start">
                  <div className="bg-terracotta/10 p-3 rounded-2xl text-terracotta flex-shrink-0">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark text-lg">Rescate Patrimonial</h4>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">Nuestros ensambles tocan melodías tradicionales del norte de Chile y la cosmovisión andina.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function LandingPerformances() {
  return (
    <section id="actuaciones" className="py-24 bg-slate-50/50 relative z-10 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-primary font-extrabold tracking-widest uppercase text-xs">Galería de Impacto</span>
          <h2 className="text-3xl md:text-5xl font-black text-text-dark leading-tight">Actuaciones Destacadas</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Nuestros alumnos brillan en escenarios locales y regionales, compartiendo el fruto de su esfuerzo con la comunidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {MOCK_PERFORMANCES.map((performance, index) => (
            <motion.div 
              key={performance.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:shadow-primary/5 transition-all group"
            >
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img 
                  src={performance.image} 
                  alt={performance.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider shadow-sm border border-slate-100">
                  {performance.place}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">{performance.date}</span>
                  <h3 className="font-extrabold text-lg text-text-dark group-hover:text-primary transition-colors line-clamp-1">{performance.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 font-medium">{performance.desc}</p>
                </div>
                <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between text-primary text-xs font-bold group-hover:text-primary-dark cursor-pointer">
                  <span>Ver registro fotográfico</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-white pt-20 pb-12 relative overflow-hidden">
      {/* Decorative gradient blur */}
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
              Escuela de Música Infanto Juvenil de la Corporación de Cultura y Turismo de Calama. Transformación artística en la Provincia de El Loa.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="p-2.5 bg-white/5 hover:bg-primary rounded-xl text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 bg-white/5 hover:bg-primary rounded-xl text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 bg-white/5 hover:bg-primary rounded-xl text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-terracotta-light">Información y Contacto</h4>
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
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-light">Soporte e Intranet</h4>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              ¿Eres alumno activo y necesitas tus partituras o audios de estudio? Accede mediante nuestro portal exclusivo "Fénix".
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

function LoginModal({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: () => void }) {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
      >
        <div className="p-8 sm:p-10 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-primary/10 p-3.5 rounded-2xl text-primary mb-4">
              <Music className="w-8 h-8" />
            </div>
            <h3 className="font-black text-2xl text-text-dark leading-tight">Portal Académico Fénix</h3>
            <p className="text-slate-400 text-sm mt-1.5 font-semibold uppercase tracking-wider">Acceso Intranet Alumnos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">RUT Estudiante</label>
              <input 
                type="text" 
                placeholder="Ej: 21.345.678-9"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-sm font-medium"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold text-sm tracking-tight transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
            >
              Iniciar Sesión Alumno
            </button>

            <div className="text-center pt-2">
              <a href="#" className="text-xs text-slate-400 hover:text-terracotta font-semibold transition-colors">
                ¿Problemas con tu clave? Contacta a Soporte
              </a>
            </div>
          </form>

        </div>
        
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Conexión Segura SSL
          </span>
          <span>FÉNIX v2.4</span>
        </div>
      </motion.div>
    </div>
  );
}

// --- STUDENT INTRANET VIEW ---

function StudentIntranet({ onLogout }: { onLogout: () => void }) {
  const [selectedElenco, setSelectedElenco] = useState(MOCK_ELENCOS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMaterials = selectedElenco.materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Header Intranet */}
      <header className="bg-white border-b border-slate-100 fixed top-0 left-0 right-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Left Info */}
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2.5 rounded-xl text-white shadow-md shadow-primary/20">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tighter text-text-dark block">FÉNIX INTRANET</span>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5 block">Hola, Alumno Calambanda</span>
              </div>
            </div>

            {/* Logout */}
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl font-bold text-xs transition-all border border-slate-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full space-y-10">
        
        {/* Welcome Block */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-text-dark">¡Hola de nuevo, Alumno!</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
              Bienvenido a tu panel de estudio personal. Aquí podrás acceder a todas las partituras y audios de referencia autorizados por tus docentes de Calambanda.
            </p>
          </div>
          
          <div className="bg-terracotta/10 px-5 py-3 rounded-2xl flex items-center gap-3 border border-terracotta/10 flex-shrink-0">
            <Calendar className="w-5 h-5 text-terracotta" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Año Académico</p>
              <p className="text-sm font-bold text-text-dark mt-1 leading-none">Calambanda 2026</p>
            </div>
          </div>
        </div>

        {/* Cursos / Mis Elencos Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-text-dark">Mis Elencos Activos</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-semibold">Selecciona un elenco para ver sus materiales autorizados</p>
            </div>
            <span className="bg-slate-200/60 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {MOCK_ELENCOS.length} Inscritos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_ELENCOS.map((elenco) => {
              const isSelected = selectedElenco.id === elenco.id;
              return (
                <div 
                  key={elenco.id}
                  onClick={() => {
                    setSelectedElenco(elenco);
                    setSearchQuery("");
                  }}
                  className={`p-6 rounded-[28px] border cursor-pointer transition-all flex flex-col justify-between gap-4 relative overflow-hidden group ${elenco.color} ${
                    isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/5' : 'hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-start gap-4">
                      <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-text-dark uppercase tracking-wider border border-slate-100 shadow-sm">
                        {elenco.badge}
                      </span>
                      {isSelected && (
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-xl text-text-dark">{elenco.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium line-clamp-2">{elenco.desc}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/50 relative z-10">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {elenco.materials.length} Materiales
                    </span>
                    <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
                      Ver material <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Material Details Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Header section with search */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-terracotta text-xs font-bold uppercase tracking-widest">Material Disponible</span>
              <h3 className="text-xl font-extrabold text-text-dark mt-1">Estudios autorizados para: {selectedElenco.title}</h3>
            </div>
            
            <div className="relative max-w-xs w-full">
              <input 
                type="text" 
                placeholder="Buscar por título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all text-xs font-medium"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>
          </div>

          {/* List of Files */}
          <div className="divide-y divide-slate-100">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((material) => (
                <div key={material.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/40 transition-colors">
                  
                  {/* Left Metadata & Icon */}
                  <div className="flex items-start gap-4">
                    <div className={`p-3.5 rounded-2xl flex-shrink-0 ${
                      material.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {material.type === 'pdf' ? (
                        <FileText className="w-6 h-6" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-dark leading-snug">{material.title}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                        <span>{material.type.toUpperCase()}</span>
                        <span>•</span>
                        <span>{material.date}</span>
                        {material.size && (
                          <>
                            <span>•</span>
                            <span>{material.size}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions depending on Type */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {material.type === 'mp3' ? (
                      <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:inline">Reproductor:</span>
                        <audio 
                          controls 
                          src={material.url}
                          className="w-full md:w-60 h-8 custom-audio-player"
                        />
                      </div>
                    ) : (
                      <a 
                        href={material.url}
                        download
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Simulando descarga de: "${material.title}"`);
                        }}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all shadow-md flex items-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Descargar PDF</span>
                      </a>
                    )}
                  </div>

                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Music className="w-12 h-12 mx-auto text-slate-300" />
                <p className="font-bold">No se encontraron archivos en este elenco.</p>
                <p className="text-xs">Prueba escribiendo otra palabra en el buscador.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-bold gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Modo Consumo Lectura Activado
            </span>
            <span className="text-slate-400 text-center sm:text-right">
              Regla: Los estudiantes no tienen permisos de carga o edición.
            </span>
          </div>

        </div>

      </main>

      {/* Intranet Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-bold uppercase tracking-widest mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>© {new Date().getFullYear()} Escuela de Música Calambanda</span>
          <span>Desarrollado por Appa-tec</span>
        </div>
      </footer>

    </div>
  );
}

// --- Main App Wrapper ---

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'intranet'>('landing');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    setCurrentView('intranet');
  };

  const handleLogout = () => {
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-white">
      {currentView === 'landing' ? (
        <>
          <LandingNavbar onNavigate={() => {}} onOpenLogin={() => setIsLoginOpen(true)} />
          <LandingHero onOpenLogin={() => setIsLoginOpen(true)} />
          <LandingOrganization />
          <LandingPerformances />
          <LandingFooter />
          <LoginModal 
            isOpen={isLoginOpen} 
            onClose={() => setIsLoginOpen(false)} 
            onLogin={handleLoginSuccess} 
          />
        </>
      ) : (
        <StudentIntranet onLogout={handleLogout} />
      )}
    </div>
  );
}
