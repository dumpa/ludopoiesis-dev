let cartas = [];
let idioma = "es"; // idioma actual: "es" o "pt"
//let imagen = idioma === "es" ? carta.imagen : (carta.imagen_pt || carta.imagen);
let cartaActual = null;

fetch("cartas_naturaleza_es_pt2.json?v=" + new Date().getTime())
  .then(res => res.json())
  .then(data => cartas = data)
  .catch(err => console.error("Error al cargar cartas:", err));

function tirarCarta() {
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

  const estabaVolteada = document.querySelector(".card")?.classList.contains("flipped");


  container.innerHTML = `
    <div class="card" onclick="this.classList.toggle('flipped')">
      <div class="card-inner">
        <div class="card-front">
          <img src="${imagen}" alt="${titulo}" style="max-width: 100%; max-height: 100%; object-fit: cover;">
        </div>
        <div class="card-back">
          <h2>${titulo}</h2>
          <p>${texto.replace(/\\n/g, "<br>")}</p>
        </div>
      </div>
    </div>`;
}

function cambiarIdioma() {
  idioma = idioma === "es" ? "pt" : "es";
  document.getElementById("boton-idioma").innerText = idioma === "es" ? "🇪🇸 Español" : "🇧🇷 Português";
  if (cartaActual) mostrarCarta(cartaActual);
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


