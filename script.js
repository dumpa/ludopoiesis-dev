
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
      document.getElementById("juego-titulo").innerText = textos.titulo;
      document.getElementById("juego-paso1").innerText = textos.paso1;
      document.getElementById("juego-paso2").innerText = textos.paso2;
      document.getElementById("juego-paso3").innerText = textos.paso3;
      document.getElementById("juego-boton-tirar").innerText = textos.tirar;
      document.getElementById("juego-boton-volver").innerText = textos.volver;
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
