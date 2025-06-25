let cartas = [];
let idioma = "es";
let cartaActual = null;
let cartasLanzadas = [];

let lentesActivos = {
  naturaleza: true,
  fluir: true,
  tecnología: true
};

fetch("cartas_ludopoiesis_naturaleza_fluir.json?v=" + new Date().getTime())
  .then(res => res.json())
  .then(data => cartas = data)
  .catch(err => console.error("Error al cargar cartas:", err));

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

window.lanzarCartaConEstilo = lanzarCartaConEstilo;
window.reiniciarCartas = reiniciarCartas;
