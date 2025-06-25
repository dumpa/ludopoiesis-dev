let cartas = [];
let idioma = "es";
let cartaActual = null;
let cartasLanzadas = [];

let lentesActivos = {
  naturaleza: true,
  fluir: true,
  tecnologia: true
};

fetch("cartas_ludopoiesis_naturaleza_fluir.json?v=" + new Date().getTime())
  .then(res => res.json())
  .then(data => cartas = data)
  .catch(err => console.error("Error al cargar cartas:", err));

function cargarIntro(desplegarLargo = false) {
  fetch('textos.json')
    .then(res => res.json())
    .then(data => {
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
        shortEl.innerHTML = introCorta + `<span class="more-button" onclick="cargarIntro(true)">➔ Conocer más sobre Ludopoiesis</span>`;
        shortEl.style.display = 'block';
        longEl.style.display = 'none';
      }
    })
    .catch(err => console.error('Error cargando textos:', err));
}
function lanzarCartaSuperpuesta() {
  const container = document.getElementById("carta-container");

  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
  if (!cartasFiltradas.length) return mostrarObraDeArteOTexto();

  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;

  const titulo = idioma === "es" ? carta.titulo : carta.titulo_pt;
  const texto = idioma === "es" ? carta.texto : carta.texto_pt;
  const imagen = idioma === "es" ? carta.imagen : carta.imagen_pt;

  const card = document.createElement("div");
  card.classList.add("card", "card-animada");

  card.onclick = () => {
  const todas = document.querySelectorAll(".card");

  const yaFlipped = card.classList.contains("flipped");

  todas.forEach(c => {
    if (c !== card) {
      c.classList.remove("flipped", "ampliada");
      // Restaurar solo la carta no seleccionada
      c.style.transform = c.dataset.originalTransform || "";
    }
  });

  if (!yaFlipped) {
    card.classList.add("flipped", "ampliada");
    card.style.transform = "scale(1) rotate(0deg)";
  } else {
    card.classList.remove("flipped", "ampliada");
    card.style.transform = card.dataset.originalTransform || "";
  }
};

  const angulo = (Math.random() * 10 - 5).toFixed(2);
  card.style.transform = `rotate(${angulo}deg) scale(0.9)`;  // o el valor que estés usando
  card.dataset.angulo = angulo;
  card.dataset.originalTransform = card.style.transform;


  
const totalCartas = container.querySelectorAll(".card").length;
card.style.marginLeft = totalCartas > 0 ? "-60px" : "0px";

  
//  card.style.marginLeft = "-60px"; // sobreposición leve a la izquierda
  card.dataset.originalTransform = card.style.transform; // guardar transform inicial
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <img src="${imagen}" alt="${titulo}">
      </div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
  `;

  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.flexWrap = "nowrap";

 
  
  container.appendChild(card);
}
function lanzarCartaConEstilo(posicion = 'horizontal') {
  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const container = document.getElementById("carta-container");
  const mensaje = container.querySelector(".mensaje-divertido");
  if (mensaje) mensaje.remove();

  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.alignItems = "flex-start";
  container.innerHTML = "";

  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
  if (!cartasFiltradas.length) return mostrarObraDeArteOTexto();

  const nuevaCarta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = nuevaCarta;
  cartasLanzadas.push({ ...nuevaCarta, posicion });

  const total = cartasLanzadas.length;
  const scale = Math.max(0.6, 1 - total * 0.06);

  cartasLanzadas.forEach(({ titulo, texto, imagen, titulo_pt, texto_pt, imagen_pt, posicion }) => {
    const t = idioma === "es" ? titulo : titulo_pt;
    const txt = idioma === "es" ? texto : texto_pt;
    const img = idioma === "es" ? imagen : imagen_pt;

    const card = document.createElement("div");
    card.classList.add("card", "card-animada");
    card.onclick = () => card.classList.toggle("flipped");

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="${img}" alt="${t}">
        </div>
        <div class="card-back">
          <h2>${t}</h2>
          <p>${txt.replace(/\n/g, "<br>")}</p>
        </div>
      </div>
    `;

    const wrapper = document.createElement("div");
    wrapper.classList.add("carta-wrapper");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = posicion === 'vertical' ? 'column' : 'row';
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.margin = "0.1rem";

    card.style.transform = `scale(${scale})`;

    wrapper.appendChild(card);
    container.appendChild(wrapper);
  });
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

function reiniciarCartas() {
  cartasLanzadas = [];
  cartaActual = null;
  const container = document.getElementById("carta-container");
  container.innerHTML = "";
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

function toggleLente(lente) {
  lentesActivos[lente] = !lentesActivos[lente];

  const btn = document.getElementById(`btn-${lente}`);
  const estado = lentesActivos[lente] ? "" : "_apagado";
  btn.src = `img/iconos/icono_${lente}${estado}.png`;
}
function toggleIdioma() {
  idioma = document.getElementById("idiomaToggle").checked ? "pt" : "es";
  document.getElementById("boton-idioma").innerText = idioma === "es" ? "🇪🇸 Español" : "🇧🇷 Português";

  // Refrescar cartas ya visibles si hay alguna
  const cartas = document.querySelectorAll(".card");
  cartas.forEach(card => {
    const id = card.dataset.id;
    const carta = cartas.find(c => c.id === id);
    if (carta) mostrarCarta(carta); // o tu función de actualización de carta
  });

  // También podrías actualizar el texto de instrucciones si lo deseas
  cargarIntro();
}
function toggleIdioma() {
  idioma = document.getElementById("idiomaToggle").checked ? "pt" : "es";

  // Actualizar introducción visible si aplica
  cargarIntro();

  // Reactualizar posibles secciones cargadas
  mostrarLentes();
  mostrarPregunta();
  mostrarDinamica();

  // Actualizar cartas ya lanzadas
  const cartasEnPantalla = document.querySelectorAll(".card");
  cartasEnPantalla.forEach(card => {
    const id = card.dataset.id;
    const cartaData = cartas.find(c => c.id == id);
    if (!cartaData) return;

    const titulo = idioma === "es" ? cartaData.titulo : cartaData.titulo_pt;
    const texto = idioma === "es" ? cartaData.texto : cartaData.texto_pt;
    const imagen = idioma === "es" ? cartaData.imagen : cartaData.imagen_pt;

    const front = card.querySelector(".card-front img");
    const backH2 = card.querySelector(".card-back h2");
    const backP = card.querySelector(".card-back p");

    if (front) {
      front.src = imagen;
      front.alt = titulo;
    }
    if (backH2) backH2.textContent = titulo;
    if (backP) backP.innerHTML = texto.replace(/\n/g, "<br>");
  });
}

window.lanzarCartaConEstilo = lanzarCartaConEstilo;
window.reiniciarCartas = reiniciarCartas;
window.cargarIntro = cargarIntro;
window.mostrarPregunta = mostrarPregunta;
window.mostrarLentes = mostrarLentes;
window.mostrarDinamica = mostrarDinamica;
