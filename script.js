let cartas = [];
let idioma = "es";
let cartaActual = null;
let cartasLanzadas = [];
let textosCache = null;

let lentesActivos = {
  naturaleza: true,
  fluir: true,
  tecnologia: true
};

// ===== i18n helpers =====

// Lee el campo apropiado de una carta según el idioma, con fallback al español.
// Ej: getCartaField(carta, 'titulo') devuelve titulo_en si idioma='en' y existe,
//     si no existe o está vacío, devuelve carta.titulo (español).
function getCartaField(carta, baseField) {
  if (!carta) return '';
  if (idioma === 'es') return carta[baseField] || '';
  const suffixed = carta[baseField + '_' + idioma];
  if (suffixed && suffixed.toString().trim() !== '') return suffixed;
  return carta[baseField] || '';
}

// Genera el HTML del <img> de la carta con fallback automático.
// Si la imagen del idioma no existe (404), usa la imagen en español.
function imgCartaHTML(carta, titulo) {
  const imagenIdioma = getCartaField(carta, 'imagen');
  const imagenES = carta.imagen || '';
  const onerror = imagenIdioma !== imagenES
    ? `this.onerror=null;this.src='${imagenES}';`
    : '';
  return `<img src="${imagenIdioma}" alt="${titulo}" onerror="${onerror}">`;
}

// Aplica los textos del idioma actual a todos los elementos con data-i18n / data-i18n-title.
function aplicarIdiomaUI() {
  if (!textosCache || !textosCache.ui) return;
  const ui = textosCache.ui;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (ui[key] && ui[key][idioma]) {
      if (el.tagName === 'TITLE') {
        document.title = ui[key][idioma];
      } else {
        el.textContent = ui[key][idioma];
      }
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (ui[key] && ui[key][idioma]) {
      el.setAttribute('title', ui[key][idioma]);
    }
  });
  // Actualiza el atributo lang del <html>
  document.documentElement.setAttribute('lang', idioma);
  // Actualiza el estado visual de las banderas
  document.querySelectorAll('.bandera').forEach(b => b.classList.remove('bandera-activa'));
  const flagActiva = document.getElementById('flag-' + idioma);
  if (flagActiva) flagActiva.classList.add('bandera-activa');
}

fetch("cartas.json?v=" + new Date().getTime())
  .then(res => res.json())
  .then(data => cartas = data)
  .catch(err => console.error("Error al cargar cartas:", err));

function cargarIntro(desplegarLargo = false) {
  const render = (data) => {
    textosCache = data;
    aplicarIdiomaUI();
    const introCorta = data.intro.short[idioma] || data.intro.short['es'];
    const introLarga = data.intro.long[idioma] || data.intro.long['es'];
    const masInfoLabel = (data.ui && data.ui.masInfo && data.ui.masInfo[idioma])
      || '➔ Conocer más sobre Ludopoiesis';

    const shortEl = document.getElementById('introShort');
    const longEl = document.getElementById('introLong');
    const cartaContainer = document.getElementById('carta-container');

    cartaContainer.style.display = 'none';

    if (desplegarLargo) {
      longEl.innerHTML = introLarga;
      longEl.dataset.seccion = 'intro-long';
      shortEl.style.display = 'none';
      longEl.style.display = 'block';
    } else {
      shortEl.innerHTML = introCorta + `<span class="more-button" onclick="cargarIntro(true)">${masInfoLabel}</span>`;
      shortEl.dataset.seccion = 'intro';
      shortEl.style.display = 'block';
      longEl.style.display = 'none';
    }
  };

  if (textosCache) {
    render(textosCache);
  } else {
    fetch('textos.json')
      .then(res => res.json())
      .then(render)
      .catch(err => console.error('Error cargando textos:', err));
  }
}
/*function lanzarCartaSuperpuesta() {
  const container = document.getElementById("carta-container");

  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

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
  card.dataset.id = carta.id;

  card.onclick = () => {
  const todas = document.querySelectorAll(".card");
  const yaFlipped = card.classList.contains("flipped");
carta.addEventListener("click", () => {
  carta.classList.toggle("flipped");

  // Espera 300ms para que se complete el giro antes de ampliarla
  setTimeout(() => {
    ampliarCarta(carta);
  }, 300);
});

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
      card.classList.remove("ampliada"); // no usar ampliada si es la única
      card.style.transform = "scale(1) rotate(0deg)";
    }
  } else {
    card.classList.remove("flipped", "ampliada");
    card.style.transform = card.dataset.originalTransform || "";
  }
};

  const angulo = (Math.random() * 10 - 5).toFixed(2);
  card.style.transform = `rotate(${angulo}deg) scale(0.9)`;  // o el valor que estés usando
  card.dataset.angulo = angulo;
  card.dataset.originalTransform = card.style.transform;


  
const totalCartas = container.querySelectorAll(".card").length;
card.style.marginLeft = totalCartas > 0 ? "-60px" : "0px";

  
//  card.style.marginLeft = "-60px"; // sobreposición leve a la izquierda
  card.dataset.originalTransform = card.style.transform; // guardar transform inicial
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

  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.flexWrap = "nowrap";

 
  
  container.appendChild(card);
}
*//*
function lanzarCartaSuperpuesta() {
  const container = document.getElementById("carta-container");

  // Oculta intros
  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Filtra cartas activas
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

  // Crear elemento de carta
  const card = document.createElement("div");
  card.classList.add("card", "card-animada");
  card.dataset.id = carta.id;

  // Evento al hacer clic en la carta
  card.onclick = () => {
    const todas = document.querySelectorAll(".card");
    const yaFlipped = card.classList.contains("flipped");

    // Cierra otras cartas abiertas
    todas.forEach(c => {
      if (c !== card) {
        c.classList.remove("flipped", "ampliada");
        c.style.transform = c.dataset.originalTransform || "";
      }
    });

    if (!yaFlipped) {
      card.classList.add("flipped");

      const totalCartas = document.querySelectorAll(".card").length;

      if (totalCartas === 1) {
        card.classList.remove("ampliada");
      } else {
        // Usamos overlay si hay múltiples cartas
        setTimeout(() => {
          ampliarCarta(card);  // esta función usa #overlay-ampliada
        }, 300);
      }

    } else {
      card.classList.remove("flipped", "ampliada");
      card.style.transform = card.dataset.originalTransform || "";
    }
  };

  // Estilo inicial de rotación
  const angulo = (Math.random() * 10 - 5).toFixed(2);
  card.style.transform = `rotate(${angulo}deg) scale(0.9)`;
  card.dataset.angulo = angulo;
  card.dataset.originalTransform = card.style.transform;

  // Posición para efecto de superposición
  const totalCartas = container.querySelectorAll(".card").length;
  card.style.marginLeft = totalCartas > 0 ? "-60px" : "0px";

  // Contenido de la carta
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

  // Asegura display correcto del contenedor
  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.flexWrap = "nowrap";

  container.appendChild(card);
}
*/
function lanzarCartaSuperpuesta() {
  const container = document.getElementById("carta-container");

  // Oculta intros
  ["introShort", "introLong", "dinamica"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Lentes activos
  const activos = Object.entries(lentesActivos)
    .filter(([_, activo]) => activo)
    .map(([lente]) => lente);

  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
  if (!cartasFiltradas.length) return mostrarObraDeArteOTexto();

  const carta = cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  cartaActual = carta;

  const titulo = getCartaField(carta, 'titulo');
  const texto  = getCartaField(carta, 'texto');

  // Crear DOM de carta
  const card = document.createElement("div");
  card.classList.add("card", "card-animada");
  card.dataset.id = carta.id;

  const angulo = (Math.random() * 10 - 5).toFixed(2);
  card.style.transform = `rotate(${angulo}deg) scale(0.9)`;
  card.dataset.angulo = angulo;
  card.dataset.originalTransform = card.style.transform;

  const totalCartas = container.querySelectorAll(".card").length;
  card.style.marginLeft = totalCartas > 0 ? "-60px" : "0px";

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        ${imgCartaHTML(carta, titulo)}
      </div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
  `;

  container.appendChild(card);
  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.flexWrap = "nowrap";

  card.onclick = () => {
  // Siempre muestra la carta ampliada en el overlay (centrada y volteada)
  ampliarCarta(card);
};
}
/*
  // Click = flip y ampliar
  card.onclick = () => {
    const flipped = card.classList.contains("flipped");

    if (!flipped) {
      card.classList.add("flipped");
      setTimeout(() => {
        ampliarCarta(card); // Usa overlay
      }, 300);
    } else {
      card.classList.remove("flipped");
    }
  };*/
function ampliarCarta(cardOriginal) {
  const overlay = document.getElementById("overlay-ampliada");

  const cartaClonada = cardOriginal.cloneNode(true);
  cartaClonada.classList.remove("card-animada");
  cartaClonada.classList.add("card", "flipped", "desampliada", "overlay-zoom", "zoom-in");
  cartaClonada.style.transform = "none";

  // El clic en la carta ahora tiene lógica
  cartaClonada.onclick = (e) => {
    e.stopPropagation();
// Paso 1: empezamos sin transform final
cartaClonada.style.transform = "scale(0.8)";
requestAnimationFrame(() => {
  cartaClonada.style.transform = "scale(1.1)";
});

    if (cartaClonada.classList.contains("flipped")) {
      cartaClonada.classList.remove("flipped");
    } else {
      overlay.style.display = "none";
      overlay.innerHTML = "";
    }
  };

  // El fondo no hace nada ahora, todo se maneja desde la carta
  overlay.innerHTML = "";
  overlay.appendChild(cartaClonada);
  overlay.style.display = "flex";
}
/*
function ampliarCarta(cardOriginal) {
  const overlay = document.getElementById("overlay-ampliada");

  // Clona y limpia la carta
  const cartaClonada = cardOriginal.cloneNode(true);
  cartaClonada.classList.remove("card-animada");
  cartaClonada.classList.add("card", "flipped");
  cartaClonada.style.transform = "none";

  // Evita que el clic dentro de la carta cierre el overlay
  cartaClonada.onclick = (e) => e.stopPropagation();

  // Inserta la carta clonada en el overlay
  overlay.innerHTML = "";
  overlay.appendChild(cartaClonada);
  overlay.style.display = "flex";

  // Al hacer clic fuera de la carta, se cierra el overlay
  overlay.onclick = () => {
    overlay.style.display = "none";
    overlay.innerHTML = "";
  };
}
*/
/*
function ampliarCarta(cardOriginal) {
  const overlay = document.getElementById("overlay-ampliada");

  const cartaClonada = cardOriginal.cloneNode(true);
  cartaClonada.classList.add("flipped");
  cartaClonada.classList.add("ampliada");

  // Impide que el clic dentro cierre el overlay
  cartaClonada.onclick = (e) => e.stopPropagation();

  overlay.innerHTML = "";
  overlay.appendChild(cartaClonada);
  overlay.style.display = "flex";

  overlay.onclick = () => {
    overlay.style.display = "none";
    overlay.innerHTML = "";
  };
}

*/

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

  cartasLanzadas.forEach((carta) => {
    const { posicion } = carta;
    const t   = getCartaField(carta, 'titulo');
    const txt = getCartaField(carta, 'texto');

    const card = document.createElement("div");
    card.classList.add("card", "card-animada");
    card.dataset.id = carta.id;

    // guardar transform original
    const originalTransform = `scale(${scale})`;
    card.style.transform = originalTransform;
    card.dataset.originalTransform = originalTransform;

    // comportamiento de flip y restaurar tamaño
    card.onclick = () => {
      const yaFlipped = card.classList.contains("flipped");
      const todas = document.querySelectorAll(".card");

      todas.forEach(c => {
        c.classList.remove("flipped", "ampliada");
        c.style.transform = c.dataset.originalTransform || "";
      });

      if (!yaFlipped) {
        card.classList.add("flipped", "ampliada");
        card.style.transform = "scale(1) rotate(0deg)";
      }
    };

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          ${imgCartaHTML(carta, t)}
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

    wrapper.appendChild(card);
    container.appendChild(wrapper);
  });
}
/*
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
*/
function mostrarObraDeArteOTexto() {
  const container = document.getElementById("carta-container");
  const ui = (textosCache && textosCache.ui) || {};
  const m1 = (ui.sinLentes && ui.sinLentes[idioma]) || "No hay lentes activados... tal vez sea momento de cerrar los ojos y ver con el corazón. ❤️";
  const m2 = (ui.sinLentes2 && ui.sinLentes2[idioma]) || "O... prueba prender alguno para continuar.";
  container.innerHTML = `
    <div class="mensaje-divertido">
      <p>${m1}</p>
      <p>${m2}</p>
    </div>
  `;
}

function reiniciarCartas() {
  cartasLanzadas = [];
  cartaActual = null;
  const container = document.getElementById("carta-container");
  container.innerHTML = "";
}

function _mostrarSeccion(key, seccionTag) {
  const render = (data) => {
    textosCache = data;
    const texto = data[key]?.[idioma] || data[key]['es'];
    const longEl = document.getElementById('introLong');
    document.getElementById('introShort').style.display = 'none';
    longEl.innerHTML = texto;
    longEl.dataset.seccion = seccionTag;
    longEl.style.display = 'block';
    document.getElementById('carta-container').style.display = 'none';
  };
  if (textosCache) {
    render(textosCache);
  } else {
    fetch('textos.json')
      .then(res => res.json())
      .then(render)
      .catch(err => console.error('Error al cargar texto:', err));
  }
}

function mostrarPregunta() { _mostrarSeccion('pregunta', 'pregunta'); }
function mostrarLentes()   { _mostrarSeccion('lentes', 'lentes'); }
function mostrarDinamica() { _mostrarSeccion('dinamica', 'dinamica'); }

function toggleLente(lente) {
  lentesActivos[lente] = !lentesActivos[lente];

  const btn = document.getElementById(`btn-${lente}`);
  const estado = lentesActivos[lente] ? "" : "_apagado";
  btn.src = `img/iconos/icono_${lente}${estado}.png`;
}
function setIdioma(nuevoIdioma) {
  if (!['es','pt','en'].includes(nuevoIdioma)) return;
  if (nuevoIdioma === idioma) return;
  idioma = nuevoIdioma;

  // Aplica la UI estática (botones, pasos, banderas activas, título)
  aplicarIdiomaUI();

  const longEl = document.getElementById("introLong");
  const shortEl = document.getElementById("introShort");
  const longVisible = longEl.style.display === "block";
  const shortVisible = shortEl.style.display === "block";

  // Si hay cartas en pantalla, actualizar cada una con el texto/imagen del nuevo idioma
  const cartasEnPantalla = document.querySelectorAll(".card");
  if (cartasEnPantalla.length > 0) {
    cartasEnPantalla.forEach(card => {
      const id = card.dataset.id;
      const cartaData = cartas.find(c => c.id == id);
      if (!cartaData) return;

      const titulo = getCartaField(cartaData, 'titulo');
      const texto  = getCartaField(cartaData, 'texto');
      const imagenIdioma = getCartaField(cartaData, 'imagen');
      const imagenES = cartaData.imagen || '';

      const front = card.querySelector(".card-front img");
      const backH2 = card.querySelector(".card-back h2");
      const backP = card.querySelector(".card-back p");

      if (front) {
        front.src = imagenIdioma;
        front.alt = titulo;
        // Fallback si la imagen del idioma no existe
        if (imagenIdioma !== imagenES) {
          front.onerror = function() { this.onerror = null; this.src = imagenES; };
        } else {
          front.onerror = null;
        }
      }
      if (backH2) backH2.textContent = titulo;
      if (backP) backP.innerHTML = texto.replace(/\n/g, "<br>");
    });
    return;
  }

  // Si estaba viendo intro o sección, re-renderiza usando la sección registrada
  if (shortVisible || longVisible) {
    const seccion = longEl.dataset.seccion || shortEl.dataset.seccion || 'intro';
    switch (seccion) {
      case 'pregunta': mostrarPregunta(); break;
      case 'lentes':   mostrarLentes();   break;
      case 'dinamica': mostrarDinamica(); break;
      case 'autor':    mostrarAutor();    break;
      case 'intro-long': cargarIntro(true); break;
      case 'intro':
      default:         cargarIntro(false);
    }
    return;
  }

  // Si todo falla, mostrar introducción corta
  cargarIntro(false);
}

// Compatibilidad con código antiguo que pueda llamar toggleIdioma
function toggleIdioma() {
  const checkbox = document.getElementById("idiomaToggle");
  setIdioma(checkbox && checkbox.checked ? "pt" : "es");
}

function mostrarAutor() {
  const render = (data) => {
    const texto = data.autor?.[idioma] || data.autor['es'];
    document.getElementById('introShort').style.display = 'none';
    document.getElementById('introLong').innerHTML = texto;
    document.getElementById('introLong').style.display = 'block';
    document.getElementById('carta-container').style.display = 'none';
  };
  if (textosCache) {
    render(textosCache);
  } else {
    fetch('textos.json')
      .then(res => res.json())
      .then(data => { textosCache = data; render(data); })
      .catch(err => console.error('Error al cargar el texto de autor:', err));
  }
}

window.lanzarCartaConEstilo = lanzarCartaConEstilo;
window.lanzarCartaSuperpuesta = lanzarCartaSuperpuesta;
window.reiniciarCartas = reiniciarCartas;
window.cargarIntro = cargarIntro;
window.mostrarPregunta = mostrarPregunta;
window.mostrarLentes = mostrarLentes;
window.mostrarDinamica = mostrarDinamica;
window.mostrarAutor = mostrarAutor;
window.setIdioma = setIdioma;
window.toggleLente = toggleLente;
window.toggleIdioma = toggleIdioma;
