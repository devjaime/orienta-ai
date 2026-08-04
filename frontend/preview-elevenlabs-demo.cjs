const http = require("http");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Vocari Voz Demo</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fafc; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; }
    .wrap { max-width: 780px; margin: 0 auto; padding: 32px 18px; }
    .eyebrow { color: #176b73; font-size: 14px; font-weight: 700; margin: 0 0 6px; }
    h1 { font-size: 28px; line-height: 1.15; margin: 0; color: #172033; }
    .lead { font-size: 14px; color: #64748b; max-width: 640px; margin: 10px 0 22px; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 4px #0f172a0d; padding: 20px; overflow: hidden; }
    .head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .brand { display: flex; align-items: center; gap: 9px; font-size: 24px; font-weight: 800; color: #172033; }
    .brandIcon { width: 34px; height: 34px; border-radius: 999px; background: #176b73; color: white; display: grid; place-items: center; font-size: 18px; }
    .small { font-size: 12px; color: #64748b; margin: 4px 0 0; }
    .pill { border: 1px solid #99d7d2; background: #eefdfa; color: #176b73; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 700; white-space: nowrap; }
    .orbWrap { height: 300px; display: flex; align-items: center; justify-content: center; position: relative; }
    .orb { position: absolute; width: 235px; height: 235px; border-radius: 999px; opacity: .92; filter: blur(.5px); background: conic-gradient(from 15deg, #fff 0deg, #bcefee 38deg, #2d5fc4 74deg, #4a8bc7 110deg, #a8eeee 150deg, #fff 190deg, #72c8d0 235deg, #2258bd 292deg, #b8eff0 330deg, #fff 360deg); }
    .orb.active { animation: spin 7s linear infinite; }
    .glow { position: absolute; width: 200px; height: 200px; border-radius: 999px; background: rgba(207,250,254,.45); filter: blur(18px); }
    button { position: relative; z-index: 2; height: 56px; border: 1px solid #e5e7eb; border-radius: 999px; background: rgba(255,255,255,.92); box-shadow: 0 12px 28px #0f172a24; display: inline-flex; align-items: center; gap: 12px; padding: 0 24px 0 16px; font-size: 17px; font-weight: 800; color: #111827; cursor: pointer; }
    button:hover { transform: scale(1.02); }
    .icon { width: 40px; height: 40px; border-radius: 999px; background: #111827; color: #fff; display: grid; place-items: center; }
    .powered { text-align: center; font-size: 14px; color: #737987; margin: 0; }
    .powered span { text-decoration: underline; text-underline-offset: 3px; }
    .log { margin-top: 20px; }
    .log h2 { font-size: 15px; margin: 0 0 12px; }
    .msg { display: flex; margin: 10px 0; }
    .msg.user { justify-content: flex-end; }
    .bubble { max-width: 82%; border-radius: 8px; padding: 10px 12px; font-size: 14px; line-height: 1.45; }
    .assistant .bubble { background: #f8fafc; border: 1px solid #e2e8f0; color: #172033; }
    .user .bubble { background: #176b73; color: #fff; }
    .loading { color: #64748b; font-size: 14px; display: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 560px) { .head { flex-direction: column; } .orbWrap { height: 260px; } .orb { width: 210px; height: 210px; } h1 { font-size: 24px; } }
  </style>
</head>
<body>
  <main class="wrap">
    <p class="eyebrow">Vocari Labs</p>
    <h1>Demo de test vocacional por voz</h1>
    <p class="lead">Prototipo visual para mostrar como Valeria puede guiar preguntas y respuestas del test vocacional usando voz. No requiere API key real mientras este en modo demo.</p>
    <section class="card">
      <div class="head">
        <div>
          <div class="brand"><span class="brandIcon">V</span><span>Valeria Voz</span></div>
          <p class="small">Cuestionario vocacional por voz en modo demo.</p>
        </div>
        <span class="pill">Demo voz</span>
      </div>
      <div class="orbWrap">
        <div id="orb" class="orb"></div>
        <div class="glow"></div>
        <button id="call"><span class="icon">〽</span><span id="label">Call AI agent</span></button>
      </div>
      <p class="powered">Simulacion local: Valeria pregunta, el estudiante responde y Vocari interpreta el perfil.</p>
    </section>
    <section class="card log">
      <h2>Transcripcion demo</h2>
      <div id="messages"><div class="msg assistant"><div class="bubble">Hola, soy Valeria. Esta vista muestra como se veria un cuestionario vocacional por voz dentro de Vocari.</div></div></div>
      <p id="loading" class="loading">Generando respuesta demo...</p>
    </section>
  </main>
  <script>
    const btn = document.getElementById("call");
    const label = document.getElementById("label");
    const orb = document.getElementById("orb");
    const msgs = document.getElementById("messages");
    const loading = document.getElementById("loading");
    let active = false;
    function add(role, text) {
      const row = document.createElement("div");
      row.className = "msg " + role;
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = text;
      row.appendChild(bubble);
      msgs.appendChild(row);
    }
    function stop(cancel = true) {
      active = false;
      orb.classList.remove("active");
      label.textContent = "Call AI agent";
      if (cancel && "speechSynthesis" in window) speechSynthesis.cancel();
    }
    function speak() {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Hola, soy Valeria. Iniciemos un cuestionario vocacional por voz. Primera pregunta: que actividades disfrutas tanto que pierdes la nocion del tiempo?");
      utterance.lang = "es-CL";
      utterance.rate = .95;
      utterance.onend = () => stop(false);
      speechSynthesis.speak(utterance);
    }
    btn.onclick = () => {
      if (active) {
        stop();
        return;
      }
      active = true;
      orb.classList.add("active");
      label.textContent = "Conectando...";
      add("user", "Iniciar test vocacional por voz");
      loading.style.display = "block";
      setTimeout(() => {
        label.textContent = "Finalizar demo";
        speak();
        loading.style.display = "none";
        add("assistant", "Pregunta 1: Que actividades disfrutas tanto que pierdes la nocion del tiempo? En la version real, el estudiante responderia por voz, Vocari transcribiria la respuesta y Valeria haria la siguiente pregunta segun el perfil detectado.");
      }, 850);
    };
  </script>
</body>
</html>`;

const port = Number(process.env.PORT || 3003);
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview listo: http://localhost:${port}/elevenlabs-demo`);
});
