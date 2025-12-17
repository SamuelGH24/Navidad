const app = document.getElementById("app");

let usuarioActual = null;
let rotation = 0;
let disponibles = [];

// URL del backend en Render
const API_URL = 'https://navidad-jrjv.onrender.com';

/* ---------- LOGIN ---------- */
function renderLogin(mensaje = "") {
  app.innerHTML = `
    <div class="card">
      <h1>🎁 Amigo Secreto</h1>
      <p>Ingresa tu nombre</p>

      <input id="nombre" placeholder="Tu nombre">
      <button onclick="login()">Entrar</button>

      ${mensaje ? `<div class="mensaje error">${mensaje}</div>` : ""}
    </div>
  `;
}

function login() {
  const nombre = document.getElementById("nombre").value.trim();

  if (!nombre) {
    renderLogin("Escribe tu nombre");
    return;
  }

  fetch(`${API_URL}/usuario`, {
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
      
      // Si ya tiene asignado, ir directo al resultado
      if (data.asignado) {
        renderRuleta();
      } else {
        cargarDisponibles();
      }
    });
}

/* ---------- CARGAR DISPONIBLES ---------- */
function cargarDisponibles() {
  fetch(`${API_URL}/disponibles/${usuarioActual.nombre}`)
    .then(res => res.json())
    .then(nombres => {
      disponibles = nombres;
      console.log('Disponibles cargados:', disponibles);
      renderRuleta();
    })
    .catch(err => {
      console.error('Error al cargar disponibles:', err);
      renderRuleta();
    });
}

/* ---------- RULETA ---------- */
function renderRuleta(mensaje = "") {
  if (usuarioActual.asignado) {
    const deseo = usuarioActual.deseo_asignado || 'No ha especificado qué quiere';
    
    app.innerHTML = `
      <div class="card">
        <h1>🎉 ¡Listo!</h1>
        <p>Tu amigo secreto es</p>
        <div class="mensaje">${usuarioActual.asignado}</div>
        
        <div class="deseo-container">
          <p class="deseo-titulo">🎁 Lo que quiere de regalo:</p>
          <div class="deseo-texto">${deseo}</div>
        </div>

        ${!usuarioActual.deseo ? `
          <div class="mi-deseo-container">
            <p class="deseo-titulo">✨ ¿Qué quieres tú de regalo?</p>
            <textarea id="miDeseo" placeholder="Ejemplo: Plata, libros, audífonos..." rows="3"></textarea>
            <button onclick="guardarDeseo()">Guardar mi deseo 💝</button>
          </div>
        ` : `
          <div class="mi-deseo-guardado">
            <p class="deseo-titulo">✅ Tu deseo guardado:</p>
            <div class="deseo-texto">${usuarioActual.deseo}</div>
          </div>
        `}

        <button class="logout" onclick="logout()">Salir</button>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="card">
      <h1>Hola ${usuarioActual.nombre} 👋</h1>
      <p>Gira la ruleta para descubrir tu amigo secreto</p>

      <div class="ruleta-container">
        <div class="flecha">▼</div>
        <canvas id="ruleta" width="300" height="300"></canvas>
      </div>

      <button onclick="girar()">Girar Ruleta 🎰</button>
      <button class="logout" onclick="logout()">Salir</button>

      ${mensaje ? `<div class="mensaje error">${mensaje}</div>` : ""}
    </div>
  `;

  // Esperar un momento para que el canvas esté en el DOM
  setTimeout(() => {
    dibujarRuleta();
  }, 100);
}

/* ---------- DIBUJAR RULETA ---------- */
function dibujarRuleta() {
  const canvas = document.getElementById('ruleta');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 140;

  // Colores vibrantes para las secciones
  const colores = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  if (disponibles.length === 0) {
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#666';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No hay personas', centerX, centerY - 10);
    ctx.fillText('disponibles', centerX, centerY + 10);
    return;
  }

  const anglePerSection = (2 * Math.PI) / disponibles.length;

  // Dibujar secciones
  disponibles.forEach((nombre, i) => {
    const startAngle = i * anglePerSection - Math.PI / 2;
    const endAngle = startAngle + anglePerSection;

    // Dibujar sector
    ctx.fillStyle = colores[i % colores.length];
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // Borde blanco entre secciones
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dibujar texto
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + anglePerSection / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    
    // Texto en el radio medio del círculo
    ctx.fillText(nombre, radius * 0.65, 0);
    ctx.restore();
  });

  // Círculo central decorativo
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
  ctx.fill();
}

/* ---------- GIRAR ---------- */
function girar() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Girando...';

  fetch(`${API_URL}/girar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: usuarioActual.nombre })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        btn.disabled = false;
        btn.textContent = 'Girar Ruleta 🎰';
        renderRuleta(data.error);
        return;
      }

      // Si ya había girado antes, mostrar resultado inmediatamente
      if (data.yaGiro) {
        usuarioActual.asignado = data.asignado;
        renderRuleta();
        return;
      }

      // Calcular posición del ganador
      const indiceGanador = disponibles.indexOf(data.asignado);
      const anglePerSection = 360 / disponibles.length;
      const anguloGanador = indiceGanador * anglePerSection;
      
      // Girar muchas vueltas + el ángulo específico
      rotation += 360 * 5 + (360 - anguloGanador) + anglePerSection / 2;
      
      const canvas = document.getElementById("ruleta");
      canvas.style.transform = `rotate(${rotation}deg)`;

      setTimeout(() => {
        usuarioActual.asignado = data.asignado;
        renderRuleta();
      }, 4000);
    })
    .catch(err => {
      console.error('Error al girar:', err);
      btn.disabled = false;
      btn.textContent = 'Girar Ruleta 🎰';
      renderRuleta('Error al conectar con el servidor');
    });
}

function logout() {
  usuarioActual = null;
  disponibles = [];
  rotation = 0;
  renderLogin();
}

/* ---------- GUARDAR DESEO ---------- */
function guardarDeseo() {
  const deseo = document.getElementById('miDeseo').value.trim();
  
  if (!deseo) {
    alert('Escribe algo que quieras de regalo');
    return;
  }

  fetch(`${API_URL}/deseo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      nombre: usuarioActual.nombre,
      deseo: deseo
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      usuarioActual.deseo = deseo;
      renderRuleta();
    })
    .catch(err => {
      console.error('Error al guardar deseo:', err);
      alert('Error al guardar tu deseo');
    });
}

/* ---------- INIT ---------- */
renderLogin();