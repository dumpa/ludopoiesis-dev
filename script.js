
let idioma = localStorage.getItem("idioma") || "es";

function setIdioma(id) {
  idioma = id;
  localStorage.setItem("idioma", idioma);
  document.getElementById("idiomaToggle").checked = (idioma === "pt");
  actualizarPantallaInicialConIdioma();
}

function toggleIdioma() {
  const nuevo = (idioma === "es") ? "pt" : "es";
  setIdioma(nuevo);
}

function actualizarPantallaInicialConIdioma() {
  fetch("textos.json")
    .then(res => res.json())
    .then(data => {
      const textos = data.inicio[idioma] || data.inicio["es"];
      if (document.getElementById("inicio-subtitulo")) document.getElementById("inicio-subtitulo").innerText = textos.subtitulo;
      if (document.getElementById("inicio-mensaje")) document.getElementById("inicio-mensaje").innerText = textos.mensaje;
      if (document.getElementById("inicio-boton-jugar")) document.getElementById("inicio-boton-jugar").innerText = textos.jugar;
    });
}

function mostrarPantalla(id) {
  if (id === 'pantalla-inicial') {
    actualizarPantallaInicialConIdioma();
  } else if (id === 'pantalla-juego') {
    actualizarPantallaJuegoConIdioma();
  } else if (id === 'pantalla-tirada') {
    actualizarPantallaTiradaConIdioma();
    actualizarPantallaJuegoConIdioma();
  }
  ocultarTodasPantallas();
  document.getElementById(id).style.display = 'block';
}

function ocultarTodasPantallas() {
  const pantallas = document.querySelectorAll('.pantalla');
  pantallas.forEach(p => p.style.display = 'none');
}

function lanzarCartaSuperpuesta() {
  mostrarPantalla('pantalla-cartas');
  const zona = document.getElementById('zona-cartas');
  zona.innerHTML = '<p>(Aquí aparecerán las cartas...)</p>';
}

function inicializarApp() {
  setIdioma(idioma);
  mostrarPantalla("pantalla-inicial");
}

function actualizarPantallaJuegoConIdioma() {
  fetch("textos.json")
    .then(res => res.json())
    .then(data => {
      const textos = data.juego[idioma] || data.juego["es"];
      if (document.getElementById("juego-titulo")) document.getElementById("juego-titulo").innerText = textos.titulo;
      if (document.getElementById("juego-paso1")) document.getElementById("juego-paso1").innerText = textos.paso1;
      if (document.getElementById("juego-paso2")) document.getElementById("juego-paso2").innerText = textos.paso2;
      if (document.getElementById("juego-paso3")) document.getElementById("juego-paso3").innerText = textos.paso3;
      if (document.getElementById("juego-boton-tirar")) if (document.getElementById("juego-boton-tirar")) document.getElementById("juego-boton-tirar").innerText = textos.tirar;
      if (document.getElementById("juego-boton-volver")) document.getElementById("juego-boton-volver").innerText = textos.volver;
    });
}

function mostrarExplicacion(tipo) {
  const explicaciones = {
    es: {
      pregunta: "Una buena pregunta abre caminos. Hazla desde la curiosidad, no desde la urgencia.",
      lentes: "Los lentes definen tu perspectiva: Naturaleza, Fluir o Tecnología.",
      tirada: "Puedes sacar una o más cartas. No busques respuestas, observa lo que resuena."
    },
    pt: {
      pregunta: "Uma boa pergunta abre caminhos. Faça-a com curiosidade, não com pressa.",
      lentes: "As lentes definem sua perspectiva: Natureza, Fluir ou Tecnologia.",
      tirada: "Você pode tirar uma ou mais cartas. Não busque respostas, observe o que ressoa."
    }
  };
  const box = document.getElementById("juego-explicacion");
  box.innerText = explicaciones[idioma][tipo];
  box.style.display = "block";
}

function actualizarPantallaTiradaConIdioma() {
  fetch("textos.json")
    .then(res => res.json())
    .then(data => {
      const textos = data.tirada[idioma] || data.tirada["es"];
      if (document.getElementById("tirada-titulo")) document.getElementById("tirada-titulo").innerText = textos.titulo;
      if (document.getElementById("tirada-instruccion")) document.getElementById("tirada-instruccion").innerText = textos.instruccion;
      if (document.getElementById("tirada-boton-lanzar")) document.getElementById("tirada-boton-lanzar").innerText = textos.boton;
      if (document.getElementById("tirada-boton-volver")) document.getElementById("tirada-boton-volver").innerText = textos.volver;
    });
}


function obtenerLentesActivos() {
  const activos = [];
  if (document.getElementById("lente-naturaleza").checked) activos.push("naturaleza");
  if (document.getElementById("lente-fluir").checked) activos.push("fluir");
  if (document.getElementById("lente-tecnologia").checked) activos.push("tecnologia");
  return activos;
}

function lanzarCartaSuperpuesta() {
  
const container = document.getElementById("carta-container");
if (!container) {
  console.warn("Contenedor de cartas no encontrado");
  return;
}
container.style.display = "flex";
container.style.flexDirection = "row";
container.style.flexWrap = "nowrap";
container.style.alignItems = "flex-start";
container.style.justifyContent = "center";


  const activos = obtenerLentesActivos();

  fetch("cartas_ludopoiesis_naturaleza_fluir.json")
    .then(res => res.json())
    .then(cartas => {
      const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
      if (!cartasFiltradas.length) {
        alert("No hay cartas disponibles para los lentes seleccionados.");
        return;
      }

      const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
      const titulo = idioma === "es" ? carta.titulo : carta.titulo_pt;
      const texto = idioma === "es" ? carta.texto : carta.texto_pt;
      const imagen = idioma === "es" ? carta.imagen : carta.imagen_pt;

      const card = document.createElement("div");
      card.classList.add("card", "card-animada");
      card.dataset.id = carta.id;

      card.onclick = () => {
        const todas = document.querySelectorAll(".card");
        const yaFlipped = card.classList.contains("flipped");

        todas.forEach(c => {
          if (c !== card) {
            c.classList.remove("flipped", "ampliada");
            c.style.transform = c.dataset.originalTransform || "";
          }
        });

        if (!yaFlipped) {
          card.classList.add("flipped");
          const totalCartas = document.querySelectorAll(".card").length;
          if (totalCartas > 1) {
            card.classList.add("ampliada");
            card.style.transform = "scale(1) rotate(0deg)";
          } else {
            card.classList.remove("ampliada");
            card.style.transform = "scale(1) rotate(0deg)";
          }
        } else {
          card.classList.remove("flipped", "ampliada");
          card.style.transform = card.dataset.originalTransform || "";
        }
      };

      const angulo = (Math.random() * 10 - 5).toFixed(2);
      card.style.transform = `rotate(${angulo}deg) scale(0.9)`;
      card.dataset.angulo = angulo;
      card.dataset.originalTransform = card.style.transform;

      const totalCartas = container.querySelectorAll(".card").length;
      card.style.marginLeft = totalCartas > 0 ? "-60px" : "0px";

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

      container.appendChild(card);
      mostrarPantalla('pantalla-cartas');
    });
}

function configurarBotonesLentes() {
  const botones = document.querySelectorAll(".lente-boton");
  botones.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("lente-activo");
    });
  });
}

function obtenerLentesActivos() {
  const activos = [];
  document.querySelectorAll(".lente-boton.lente-activo").forEach(btn => {
    activos.push(btn.dataset.lente);
  });
  return activos;
}


function configurarBurbujasToggle() {
  const ayudas = document.querySelectorAll(".icono-ayuda");
  ayudas.forEach(icon => {
    icon.addEventListener("click", () => {
      const id = icon.dataset.target;
      const ayuda = document.getElementById(id);

      // Si está visible, la ocultamos
      if (ayuda.style.display === "block") {
        ayuda.style.display = "none";
      } else {
        // Ocultar todas antes de mostrar esta
        document.querySelectorAll(".burbuja-ayuda").forEach(b => b.style.display = "none");
        ayuda.style.display = "block";
      }
    });
  });
}

    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarBotonesLentes();
  configurarBurbujasToggle();
});
