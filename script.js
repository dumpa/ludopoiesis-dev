
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
