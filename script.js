// script.js actualizado con función mostrarDinamica y otras funciones clave
let cartasMostradas = [];
let cartas = [];
let idioma = "es";
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

function mostrarDinamica() {
  fetch('textos.json')
    .then(res => res.json())
    .then(data => {
      const idioma = getIdiomaActual();
      document.getElementById('introShort').style.display = 'none';
      document.getElementById('introLong').style.display = 'none';
      document.getElementById('carta-container').style.display = 'none';
      const texto = data.dinamica[idioma];
      const contenedor = document.getElementById('instruccion3Texto');
      contenedor.innerHTML = texto;
      contenedor.style.display = 'block';
    });
}

function tirarCarta() {
  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));

  document.getElementById('introShort').style.display = 'none';
  document.getElementById('introLong').style.display = 'none';
  document.getElementById('instruccion3Texto').style.display = 'none';
  document.getElementById('carta-container').style.display = 'block';

  if (!cartasFiltradas.length) {
    mostrarObraDeArteOTexto();
    return;
  }

  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;
  mostrarCarta(carta);
}

function mostrarCarta(carta) {
  const container = document.getElementById("carta-container");
  const titulo = idioma === "es" ? carta.titulo : carta.titulo_pt;
  const texto = idioma === "es" ? carta.texto : carta.texto_pt;
  const imagen = idioma === "es" ? carta.imagen : carta.imagen_pt;

  container.innerHTML = `
    <div class="card" onclick="this.classList.toggle('flipped')">
      <div class="card-inner">
        <div class="card-front">
          <img src="${imagen}" alt="${titulo}" style="max-width: 100%; max-height: 100%; object-fit: cover;">
        </div>
        <div class="card-back">
          <h2>${titulo}</h2>
          <p>${texto.replace(/\n/g, "<br>")}</p>
        </div>
      </div>
    </div>`;
}

function getIdiomaActual() {
  const esActivo = !document.getElementById('idiomaToggle').checked;
  return esActivo ? 'es' : 'pt';
}
