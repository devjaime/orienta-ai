import React from 'react';

function RiasecEmbed() {
  return (
    <section id="test" className="section-padding bg-orienta-light">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-white mb-4">Test vocacional RIASEC</h2>
        <p className="text-orienta-muted mb-6">Responde un breve cuestionario y obtén tu código RIASEC con gráfico y recomendaciones.</p>
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-xl">
          <iframe
            title="Test vocacional RIASEC"
            src="/riasec-widget.html"
            width="100%"
            height="1200"
            style={{ border: 0 }}
          />
        </div>
      </div>
    </section>
  );
}

export default RiasecEmbed;


