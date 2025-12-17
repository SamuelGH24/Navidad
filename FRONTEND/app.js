const app = document.getElementById("app");

let usuarioActual = null;
let rotation = 0;

/* ---------- LOGIN ---------- */
function renderLogin(mensaje = "") {
  app.innerHTML = `
    <div class="card">
      <h1>🎁 Amigo Secreto</h1>
      <p>Ingresa tu nombre</p>

      <input id="nombre" placeholder="Tu nombre">
      <button onclick="login()">Entrar</button>

      ${mensaje ? `<div class="mensaje">${mensaje}</div>` : ""}
    </div>
  `;
}

function login() {
  const nombre = document.getElementById("nombre").value.trim();

  if (!nombre) {
    renderLogin("Escribe tu nombre");
    return;
  }

  fetch('http://localhost:3000/usuario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        renderLogin(data.error);
        return;
      }
      usuarioActual = data;
      renderRuleta();
    });
}

/* ---------- RULETA ---------- */
function renderRuleta(mensaje = "") {
  if (usuarioActual.asignado) {
    app.innerHTML = `
      <div class="card">
        <h1>🎉 ¡Listo!</h1>
        <p>Tu amigo secreto es</p>
        <div class="mensaje">${usuarioActual.asignado}</div>
        <button class="logout" onclick="logout()">Salir</button>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="card">
      <h1>Hola ${usuarioActual.nombre} 👋</h1>
      <p>Gira la ruleta</p>

      <div class="ruleta" id="ruleta">🎰</div>

      <button onclick="girar()">Girar</button>
      <button class="logout" onclick="logout()">Salir</button>

      ${mensaje ? `<div class="mensaje">${mensaje}</div>` : ""}
    </div>
  `;
}

function girar() {
  fetch('http://localhost:3000/girar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: usuarioActual.nombre })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        renderRuleta(data.error);
        return;
      }

      rotation += 360 * 5 + Math.random() * 360;
      document.getElementById("ruleta").style.transform =
        `rotate(${rotation}deg)`;

      setTimeout(() => {
        usuarioActual.asignado = data.asignado;
        renderRuleta();
      }, 4000);
    });
}

function logout() {
  usuarioActual = null;
  renderLogin();
}

/* ---------- INIT ---------- */
renderLogin();
