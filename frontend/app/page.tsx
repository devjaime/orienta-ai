export default function Home() {
  return (
    <main className="min-h-screen bg-vocari-bg flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-vocari-primary mb-4">
          Vocari
        </h1>
        <p className="text-xl md:text-2xl text-vocari-text-muted mb-8">
          Orientacion vocacional inteligente para colegios chilenos
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-vocari-primary text-white font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            Iniciar sesion
          </a>
          <a
            href="/b2b"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-vocari-primary text-vocari-primary font-medium rounded-md hover:bg-vocari-primary hover:text-white transition-colors"
          >
            Para colegios
          </a>
        </div>
      </div>
    </main>
  );
}
