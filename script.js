
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
