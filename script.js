let cartas = [];
let idioma = "es"; // idioma actual: "es" o "pt"
//let imagen = idioma === "es" ? carta.imagen : (carta.imagen_pt || carta.imagen);
let cartaActual = null;

let lentesActivos = {
  naturaleza: true,
  fluir: true,
  tecnología: true
};


fetch("cartas_ludopoiesis_naturaleza_fluir.json?v=" + new Date().getTime())
  .then(res => res.json())
  .then(data => cartas = data)
  .catch(err => console.error("Error al cargar cartas:", err));

cargarIntro(); // al iniciar

function tirarCarta() {
  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));

  document.getElementById('introShort').style.display = 'none';
  document.getElementById('introLong').style.display = 'none';
  document.getElementById('dinamica').style.display = 'none';
  document.getElementById('carta-container').style.display = 'block';

  if (!cartasFiltradas.length) {
    mostrarObraDeArteOTexto();
    return;
  }

  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;
  mostrarCarta(carta);
}
/*function tirarCarta() {
  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));

  document.getElementById('introShort').style.display = 'none';
  document.getElementById('introLong').style.display = 'none';
  document.getElementById('carta-container').style.display = 'block';

  if (!cartasFiltradas.length) {
    mostrarObraDeArteOTexto(); // función alternativa divertida
    return;
  }

  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;
  mostrarCarta(carta);
}
*/
function tirarCartaBK() {
  if (!cartas.length) {
    alert("Las cartas aún no se han cargado. Intenta de nuevo en unos segundos.");
    return;
  }

  const carta = cartas[Math.floor(Math.random() * cartas.length)];
  cartaActual = carta;
  mostrarCarta(carta);
}

function mostrarCarta(carta) {
  const container = document.getElementById("carta-container");
  const titulo = idioma === "es" ? carta.titulo : carta.titulo_pt;
  const texto = idioma === "es" ? carta.texto : carta.texto_pt;
  const imagen = idioma === "es" ? carta.imagen : carta.imagen_pt;

  const card = document.createElement("div");
  card.classList.add("card", "card-animada");
  card.onclick = () => card.classList.toggle("flipped");

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <img src="${imagen}" alt="${titulo}" style="max-width: 100%; max-height: 100%; object-fit: cover;">
      </div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\\n/g, "<br>")}</p>
      </div>
    </div>
  `;

  container.appendChild(card);

  // Controlar escala si hay muchas cartas
  const totalCartas = container.querySelectorAll(".card").length;
  if (totalCartas >= 4) {
    container.classList.add("muchas-cartas");
  }
}

function cambiarIdioma() {
  idioma = idioma === "es" ? "pt" : "es";
  document.getElementById("boton-idioma").innerText = idioma === "es" ? "🇪🇸 Español" : "🇧🇷 Português";
  if (cartaActual) mostrarCarta(cartaActual);
}
function toggleLente(lente) {
  lentesActivos[lente] = !lentesActivos[lente];

  const btn = document.getElementById(`btn-${lente}`);
  const estado = lentesActivos[lente] ? "" : "_apagado";
  btn.src = `img/iconos/icono_${lente}${estado}.png`;
}

function reiniciarCartas() {
  const container = document.getElementById("carta-container");
  container.innerHTML = "";
  container.classList.remove("muchas-cartas");
  cartaActual = null;
}


function descargarImagenCarta() {
  const carta = document.querySelector(".card");
  if (!carta) {
    alert("Tira una carta primero.");
    return;
  }

  html2canvas(carta, { backgroundColor: null }).then(canvas => {
    const link = document.createElement("a");
    link.download = `ludopoiesis_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

function compartirCarta() {
  if (!cartaActual) {
    alert("Tira una carta primero.");
    return;
  }

  const mensaje = `🃏 Ludopoiesis\n“${idioma === "es" ? cartaActual.titulo : cartaActual.titulo_pt}”\n\n${idioma === "es" ? cartaActual.texto : cartaActual.texto_pt}\n\n👉 https://dumpa.github.io/ludopoiesis`;

  if (navigator.share) {
    navigator.share({
      title: 'Ludopoiesis',
      text: mensaje,
      url: 'https://dumpa.github.io/ludopoiesis'
    }).catch(err => console.error('Error al compartir', err));
  } else {
    alert("Tu navegador no permite compartir directo. Puedes copiar el texto o hacer pantallazo.");
  }
}

function toggleIdioma() {
  idioma = document.getElementById("idiomaToggle").checked ? "pt" : "es";
  if (cartaActual) mostrarCarta(cartaActual);
}

function setIdioma(lengua) {
  idioma = lengua;
  document.getElementById("idiomaToggle").checked = (lengua === "pt");

  // Solo muestra la carta si ya se ha tirado una
  if (cartaActual) {
    mostrarCarta(cartaActual);
  }
}
function mostrarObraDeArteOTexto() {
  const container = document.getElementById("carta-container");
  container.innerHTML = `
    <div class="mensaje-divertido">
      <p>No hay lentes activados... tal vez sea momento de cerrar los ojos y ver con el corazón. ❤️</p>
      <p>O... prueba prender alguno para continuar.</p>
    </div>
  `;
}

async function cargarIntro(desplegarLargo = false) {
  try {
    const res = await fetch('textos.json');
    const data = await res.json();
    const introCorta = data.intro.short[idioma];
    const introLarga = data.intro.long[idioma];

    const shortEl = document.getElementById('introShort');
    const longEl = document.getElementById('introLong');
    const cartaContainer = document.getElementById('carta-container');

    cartaContainer.style.display = 'none';

    if (desplegarLargo) {
      longEl.innerHTML = introLarga;
      shortEl.style.display = 'none';
      longEl.style.display = 'block';
    } else {
      shortEl.innerHTML = introCorta + `<span class="more-button" onclick="cargarIntro(true)">➤ Conocer más sobre Ludopoiesis</span>`;
      shortEl.style.display = 'block';
      longEl.style.display = 'none';
    }
  } catch (err) {
    console.error('Error cargando textos:', err);
  }
}


function mostrarAutor() {
  fetch('textos.json')
    .then(res => res.json())
    .then(data => {
      const autorTexto = data.autor[idioma];
      const introLong = document.getElementById('introLong');
      introLong.innerHTML += autorTexto;
    })
    .catch(err => console.error('Error cargando autor:', err));
}
function mostrarPregunta() {
  fetch('textos.json')
    .then(res => res.json())
    .then(data => {
      const texto = data.pregunta?.[idioma] || data.pregunta['es'];
      document.getElementById('introShort').style.display = 'none';
      document.getElementById('introLong').innerHTML = texto;
      document.getElementById('introLong').style.display = 'block';
      document.getElementById('carta-container').style.display = 'none';
    })
    .catch(err => console.error('Error al cargar el texto de pregunta:', err));
}
function mostrarLentes() {
  fetch('textos.json')
    .then(res => res.json())
    .then(data => {
      const texto = data.lentes?.[idioma] || data.lentes['es'];
      document.getElementById('introShort').style.display = 'none';
      document.getElementById('introLong').innerHTML = texto;
      document.getElementById('introLong').style.display = 'block';
      document.getElementById('carta-container').style.display = 'none';
    })
    .catch(err => console.error('Error al cargar el texto de lentes:', err));
}
function mostrarDinamica() {
  fetch('textos.json')
    .then(res => res.json())
    .then(data => {
      const texto = data.dinamica?.[idioma] || data.dinamica['es'];
      document.getElementById('introShort').style.display = 'none';
      document.getElementById('introLong').innerHTML = texto;
      document.getElementById('introLong').style.display = 'block';
      document.getElementById('carta-container').style.display = 'none';
    })
    .catch(err => console.error('Error al cargar el texto de dinamica:', err));
}
function lanzarCartaConEstilo(posicion = 'horizontal') {
  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
  if (!cartasFiltradas.length) return mostrarObraDeArteOTexto();

  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;

  const container = document.getElementById("carta-container");
  const titulo = idioma === "es" ? carta.titulo : carta.titulo_pt;
  const texto = idioma === "es" ? carta.texto : carta.texto_pt;
  const imagen = idioma === "es" ? carta.imagen : carta.imagen_pt;

  const card = document.createElement("div");
  card.classList.add("card", "card-animada");
  card.onclick = () => toggleAmpliada(card); // para agrandar al hacer click

  // rotación aleatoria y posición flotante leve
  const angulo = (Math.random() * 10 - 5).toFixed(2); // -5° a 5°
  const offsetX = (Math.random() * 20 - 10).toFixed(2);
  const offsetY = (Math.random() * 20 - 10).toFixed(2);
  card.style.transform += ` rotate(${angulo}deg)`;
  card.style.marginLeft = `${offsetX}px`;
  card.style.marginTop = `${offsetY}px`;

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <img src="${imagen}" alt="${titulo}">
      </div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\\n/g, "<br>")}</p>
      </div>
    </div>`;

  container.appendChild(card);

  // Escala si hay muchas
  
const container = document.getElementById("carta-container");
const totalCartas = container.querySelectorAll(".card").length;

// Limpiar cualquier clase previa tipo "card-1", "card-2", etc.
container.className = container.className.replace(/card-\d+/g, '').trim();

// Agregar la clase correspondiente (máximo 9 para evitar overflow)
container.classList.add(`card-${Math.min(totalCartas, 9)}`);

  
}
function toggleAmpliada(card) {
  const yaAmpliada = document.querySelector(".card.ampliada");
  if (yaAmpliada && yaAmpliada !== card) {
    yaAmpliada.classList.remove("ampliada");
  }
  card.classList.toggle("ampliada");
}
