// script.js — Versión 1.1.0 — Soporte para overlay ampliado

// Detecta si es un dispositivo móvil
function esDispositivoMovil() {
  return window.innerWidth < 768;
}

// Evento global para manejar clic en cartas
function activarClickCarta(carta) {
  carta.addEventListener('click', () => {
    if (esDispositivoMovil()) {
      // Usamos overlay para mostrar la carta ampliada
      const overlay = document.getElementById('overlay-ampliada');
      overlay.innerHTML = '';

      const clon = carta.cloneNode(true);
      clon.classList.add('flipped');
      overlay.appendChild(clon);
      overlay.style.display = 'flex';

      // Al hacer clic en el clon, cerrar overlay
      clon.addEventListener('click', () => {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
      });
    } else {
      // En desktop, simplemente volteamos la carta
      carta.classList.toggle('flipped');
    }
  });
}

// Resto del código original que lanza cartas, carga textos, etc.
// Asegúrate de llamar activarClickCarta(carta) en cada carta creada dinámicamente
