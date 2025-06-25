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

// 🧠 Lista de cartas lanzadas con su estilo
let cartasLanzadas = [];

function lanzarCartaConEstilo(posicion = 'horizontal') {
  console.log('🎯 Lanzar carta con estilo activado:', posicion);

  // Ocultar textos introductorios
  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const container = document.getElementById("carta-container");

  // Eliminar mensaje poético si existe
  const mensaje = container.querySelector(".mensaje-divertido");
  if (mensaje) mensaje.remove();

  // Filtrar cartas activas
  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
  if (!cartasFiltradas.length) return mostrarObraDeArteOTexto();

  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;

  // Guardar carta con estilo
  cartasLanzadas.push({ carta, posicion });

  // Limpiar container y redibujar todas
  container.innerHTML = "";
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.alignItems = "flex-start";

  const total = cartasLanzadas.length;
  const scale = Math.max(0.6, 1 - total * 0.06); // escala compartida

  cartasLanzadas.forEach(({ carta, posicion }) => {
    const titulo = idioma === "es" ? carta.titulo : carta.titulo_pt;
    const texto = idioma === "es" ? carta.texto : carta.texto_pt;
    const imagen = idioma === "es" ? carta.imagen : carta.imagen_pt;

    const card = document.createElement("div");
    card.classList.add("card", "card-animada");
    card.style.transform = \`scale(\${scale})\`;
    card.onclick = () => card.classList.toggle("flipped");

    card.innerHTML = \`
      <div class="card-inner">
        <div class="card-front">
          <img src="\${imagen}" alt="\${titulo}">
        </div>
        <div class="card-back">
          <h2>\${titulo}</h2>
          <p>\${texto.replace(/\n/g, "<br>")}</p>
        </div>
      </div>
    \`;

    const wrapper = document.createElement("div");
    wrapper.classList.add("carta-wrapper");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = posicion === 'horizontal' ? 'row' : 'column';
    wrapper.style.gap = "0px";
    wrapper.style.margin = "0";
    wrapper.appendChild(card);
    container.appendChild(wrapper);
  });
});

  const container = document.getElementById("carta-container");

  // Remover mensaje poético si existe
  const mensaje = container.querySelector(".mensaje-divertido");
  if (mensaje) mensaje.remove();

  // Asegurar estilo de contenedor (flex horizontal)
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.flexDirection = "row";
  container.style.alignItems = "flex-start";
  container.style.justifyContent = "center";

  // Obtener cartas filtradas
  const activos = Object.entries(lentesActivos).filter(([_, activo]) => activo).map(([l]) => l);
  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
  if (!cartasFiltradas.length) return mostrarObraDeArteOTexto();

  // Escoger una carta
  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;
  const titulo = idioma === "es" ? carta.titulo : carta.titulo_pt;
  const texto = idioma === "es" ? carta.texto : carta.texto_pt;
  const imagen = idioma === "es" ? carta.imagen : carta.imagen_pt;

  // Crear la carta
  const card = document.createElement("div");
  card.classList.add("card", "card-animada");
  card.onclick = () => card.classList.toggle("flipped");

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <img src="${imagen}" alt="${titulo}">
      </div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\\n/g, "<br>")}</p>
      </div>
    </div>
  `;

  // Crear wrapper individual
  const wrapper = document.createElement("div");
  wrapper.classList.add("carta-wrapper");
  wrapper.style.display = "flex";
 
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  //wrapper.style.margin = "0.5rem";
  wrapper.classList.add("carta-wrapper", posicion); // posicion = 'horizontal' o 'vertical'

  
  // Rotación decorativa
  const angulo = (Math.random() * 10 - 5).toFixed(2);
  wrapper.style.transform = `rotate(${angulo}deg)`;

  wrapper.appendChild(card);
  container.appendChild(wrapper);

  const wrappers = container.querySelectorAll(".carta-wrapper");
  
  const total = wrappers.length;

wrappers.forEach((wrapper, index) => {
  const i = total - 1 - index; // invertir el orden
  const scale = Math.max(0.6, 1 - i * 0.07);
  wrapper.style.transform = `scale(${scale})`;
});
}

function lanzarCartaConEstilo2(posicion = 'horizontal') {
  console.log('🎯 Lanzar carta con estilo activado:', posicion);

  // Ocultar textos introductorios
  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const container = document.getElementById("carta-container");

  // Eliminar mensaje poético si existe
  const mensaje = container.querySelector(".mensaje-divertido");
  if (mensaje) mensaje.remove();

  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.alignItems = "flex-start";

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
  card.onclick = () => card.classList.toggle("flipped");

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <img src="${imagen}" alt="${titulo}">
      </div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\\n/g, "<br>")}</p>
      </div>
    </div>
  `;

  // Crear un wrapper por carta
  const wrapper = document.createElement("div");
  wrapper.classList.add("carta-wrapper");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = (posicion === 'horizontal') ? 'row' : 'column';
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.margin = "0.5rem";

  // Aplicar escala al wrapper (no a la carta)
  const total = container.querySelectorAll(".carta-wrapper").length + 1;
  const scale = Math.max(0.6, 1 - total * 0.08);
  wrapper.style.transform = `scale(${scale})`;

  // Rotación decorativa
  const angulo = (Math.random() * 10 - 5).toFixed(2);
  wrapper.style.transform += ` rotate(${angulo}deg)`;

  wrapper.appendChild(card);
  container.appendChild(wrapper);
}

function lanzarCartaConEstilo3(posicion = 'horizontal') { //borrar si la otra funciona
  console.log('🎯 Lanzar carta con estilo activado:', posicion);

  // Ocultar textos introductorios
  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const container = document.getElementById("carta-container");

  // Eliminar mensaje poético si existe
  const mensaje = container.querySelector(".mensaje-divertido");
  if (mensaje) mensaje.remove();

  container.style.display = "flex";
  container.style.flexWrap = "wrap"; // permitir múltiples filas
  container.style.alignItems = "flex-start";

  // Filtrar cartas activas
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

  // Crear carta
  const card = document.createElement("div");
  card.classList.add("card", "card-animada");
  card.onclick = () => card.classList.toggle("flipped");

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <img src="${imagen}" alt="${titulo}">
      </div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\\n/g, "<br>")}</p>
      </div>
    </div>
  `;

  // Crear wrapper individual
  const wrapper = document.createElement("div");
  wrapper.classList.add("carta-wrapper");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = (posicion === 'horizontal') ? 'row' : 'column';
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.margin = "0.5rem";

  wrapper.appendChild(card);
  container.appendChild(wrapper);

  // Aplicar escalado a todas las cartas visibles
  const todas = container.querySelectorAll(".card");
  const total = todas.length;
  const scale = Math.max(0.6, 1 - total * 0.08);

  todas.forEach(c => {
    const angulo = (Math.random() * 10 - 5).toFixed(2);
    c.style.transform = `rotate(${angulo}deg) scale(${scale})`;
  });
}
/*
// 🧠 Lista de cartas lanzadas con su estilo
let cartasLanzadas = [];

function lanzarCartaConEstilo(posicion = 'horizontal') {
  console.log('🎯 Lanzar carta con estilo activado:', posicion);

  // Ocultar textos introductorios
  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const container = document.getElementById("carta-container");

  // Eliminar mensaje poético si existe
  const mensaje = container.querySelector(".mensaje-divertido");
  if (mensaje) mensaje.remove();

  // Filtrar cartas activas
  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
  if (!cartasFiltradas.length) return mostrarObraDeArteOTexto();

  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;

  // Guardar carta con estilo
  cartasLanzadas.push({ carta, posicion });

  // Limpiar container y redibujar todas
  container.innerHTML = "";
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.alignItems = "flex-start";

  const total = cartasLanzadas.length;
  const scale = Math.max(0.6, 1 - total * 0.06); // escala compartida

  cartasLanzadas.forEach(({ carta, posicion }) => {
    const titulo = idioma === "es" ? carta.titulo : carta.titulo_pt;
    const texto = idioma === "es" ? carta.texto : carta.texto_pt;
    const imagen = idioma === "es" ? carta.imagen : carta.imagen_pt;

    const card = document.createElement("div");
    card.classList.add("card", "card-animada");
    card.style.transform = \`scale(\${scale})\`;
    card.onclick = () => card.classList.toggle("flipped");

    card.innerHTML = \`
      <div class="card-inner">
        <div class="card-front">
          <img src="\${imagen}" alt="\${titulo}">
        </div>
        <div class="card-back">
          <h2>\${titulo}</h2>
          <p>\${texto.replace(/\n/g, "<br>")}</p>
        </div>
      </div>
    \`;

    const wrapper = document.createElement("div");
    wrapper.classList.add("carta-wrapper");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = posicion === 'horizontal' ? 'row' : 'column';
    wrapper.style.gap = "0px";
    wrapper.style.margin = "0";
    wrapper.appendChild(card);
    container.appendChild(wrapper);
  });
});

  const container = document.getElementById("carta-container");

  // Remover mensaje poético si existe
  const mensaje = container.querySelector(".mensaje-divertido");
  if (mensaje) mensaje.remove();

  // Asegurar visibilidad del contenedor
  container.style.display = "flex";
  container.style.flexDirection = posicion === 'vertical' ? 'row' : 'column' ;

  // Filtrar cartas activas
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
  card.onclick = () => card.classList.toggle("flipped");


  // Rotación y leve desplazamiento
  const angulo = (Math.random() * 10 - 5).toFixed(2); // entre -5° y 5°
  const offsetX = (Math.random() * 20 - 10).toFixed(2);
  const offsetY = (Math.random() * 20 - 10).toFixed(2);
  card.style.transform += ` rotate(${angulo}deg) translate(${offsetX}px, ${offsetY}px)`;

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <img src="${imagen}" alt="${titulo}">
      </div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\\n/g, "<br>")}</p>
      </div>
    </div>
  `;

  container.appendChild(card);


  // Escalar dinámicamente si hay muchas
const totalCartas = container.querySelectorAll(".card").length;
if (totalCartas >= 2) {
  container.querySelectorAll('.card').forEach(c => {
    const scale = Math.max(0.6, 1 - totalCartas * 0.1);
    c.style.transform += ` scale(${scale})`;
  });
}*/
/*  // Escalar si hay muchas
  const totalCartas = container.querySelectorAll(".card").length;

  container.classList.forEach(cls => {
    if (/^card-\d+$/.test(cls)) {
      container.classList.remove(cls);
    }
  });

  container.classList.add(`card-${Math.min(totalCartas, 9)}`);
}*/
function toggleAmpliada(card) {
  const yaAmpliada = document.querySelector(".card.ampliada");
  if (yaAmpliada && yaAmpliada !== card) {
    yaAmpliada.classList.remove("ampliada");
  }
  card.classList.toggle("ampliada");
}
window.lanzarCartaConEstilo = lanzarCartaConEstilo;
