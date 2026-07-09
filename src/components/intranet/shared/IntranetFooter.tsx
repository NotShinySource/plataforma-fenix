export function IntranetFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-600 font-bold uppercase tracking-widest mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© {new Date().getFullYear()} Escuela de Música Calambanda</span>
        <span>Desarrollado por Appa-tec</span>
      </div>
    </footer>
  );
}
