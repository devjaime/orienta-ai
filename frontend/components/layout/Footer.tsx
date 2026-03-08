export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-vocari-text-muted">
        <p>&copy; {new Date().getFullYear()} Vocari. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <a href="/terminos" className="hover:text-vocari-text transition-colors">
            Terminos
          </a>
          <a href="/privacidad" className="hover:text-vocari-text transition-colors">
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
