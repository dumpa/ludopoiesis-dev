
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
      const textos = data.inicio[idioma] || data.inicio["es"];
      document.getElementById("inicio-subtitulo").innerText = textos.subtitulo;
      document.getElementById("inicio-mensaje").innerText = textos.mensaje;
      document.getElementById("inicio-boton-jugar").innerText = textos.jugar;
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

function inicializarApp() {
  setIdioma(idioma);
  mostrarPantalla("pantalla-inicial");
}

function actualizarPantallaJuegoConIdioma() {
  fetch("textos.json")
    .then(res => res.json())
      const textos = data.juego[idioma] || data.juego["es"];
      document.getElementById("juego-titulo").innerText = textos.titulo;
      document.getElementById("juego-paso1").innerText = textos.paso1;
      document.getElementById("juego-paso2").innerText = textos.paso2;
      document.getElementById("juego-paso3").innerText = textos.paso3;
      if (document.getElementById("juego-boton-tirar")) document.getElementById("juego-boton-tirar").innerText = textos.tirar;
      document.getElementById("juego-boton-volver").innerText = textos.volver;
    });
}

function mostrarExplicacion(tipo) {
      pregunta: "Una buena pregunta abre caminos. Hazla desde la curiosidad, no desde la urgencia.",
      lentes: "Los lentes definen tu perspectiva: Naturaleza, Fluir o Tecnología.",
      tirada: "Puedes sacar una o más cartas. No busques respuestas, observa lo que resuena."
    },
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
      const textos = data.tirada[idioma] || data.tirada["es"];
      document.getElementById("tirada-titulo").innerText = textos.titulo;
      document.getElementById("tirada-instruccion").innerText = textos.instruccion;
      document.getElementById("tirada-boton-lanzar").innerText = textos.boton;
      document.getElementById("tirada-boton-volver").innerText = textos.volver;
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
  if (!container) return;

  container.innerHTML = '';
  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.flexWrap = "nowrap";

  const activos = obtenerLentesActivos();

  fetch("cartas_ludopoiesis_naturaleza_fluir.json")
    .then(res => res.json())
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