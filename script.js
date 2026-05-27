// Detecta el idioma inicial:
// 1) Por subdominio: en.* → 'en', pt.* → 'pt'
// 2) Por idioma del navegador si está soportado
// 3) Fallback: 'es'
function detectarIdiomaInicial() {
  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  if (host.startsWith('en.')) return 'en';
  if (host.startsWith('pt.')) return 'pt';
  const browserLang = (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'es').slice(0, 2);
  if (['es', 'pt', 'en'].includes(browserLang)) return browserLang;
  return 'es';
}

// Nombres de los 3 lentes/naipes por idioma (paleta dinámica + label sutil)
const lenteNombres = {
  es: { naturaleza: 'Naturaleza', fluir: 'Fluir', tecnologia: 'Tecnología' },
  pt: { naturaleza: 'Natureza',   fluir: 'Fluir', tecnologia: 'Tecnologia' },
  en: { naturaleza: 'Nature',     fluir: 'Flow',  tecnologia: 'Technology' }
};

// Tipos de tirada disponibles. Cada tirada define cuántas cartas, su layout,
// los labels semánticos por posición (en cada idioma) y el subtítulo del selector.
const TIRADAS = {
  carta: {
    count: 1,
    layout: 'single',
    labels: { es: [], pt: [], en: [] },
    subtitle: { es: '', pt: '', en: '' }
  },
  horizontal: {
    count: 3,
    layout: 'horizontal',
    labels: {
      es: ['Pasado', 'Presente', 'Futuro'],
      pt: ['Passado', 'Presente', 'Futuro'],
      en: ['Past', 'Present', 'Future']
    },
    subtitle: {
      es: 'pasado · presente · futuro',
      pt: 'passado · presente · futuro',
      en: 'past · present · future'
    }
  },
  vertical: {
    count: 3,
    layout: 'vertical',
    labels: {
      es: ['Pensar', 'Sentir', 'Hacer'],
      pt: ['Pensar', 'Sentir', 'Fazer'],
      en: ['Think', 'Feel', 'Do']
    },
    subtitle: {
      es: 'pensar · sentir · hacer',
      pt: 'pensar · sentir · fazer',
      en: 'think · feel · do'
    }
  }
};

let modoTirada = 'carta';

// Activa la paleta dinámica del naipe + actualiza el label sutil arriba de la carta.
// Llamar con un lente ('naturaleza' | 'fluir' | 'tecnologia') o null para volver a estado neutro.
function setNaipeActivo(lente) {
  const metaLabel = document.getElementById('card-meta-label');
  if (lente) {
    document.body.setAttribute('data-naipe', lente);
    if (metaLabel) {
      const nombre = (lenteNombres[idioma] && lenteNombres[idioma][lente]) || lente;
      metaLabel.textContent = nombre;
      metaLabel.classList.add('show');
    }
  } else {
    document.body.removeAttribute('data-naipe');
    if (metaLabel) {
      metaLabel.classList.remove('show');
    }
  }
}

let cartas = [];
let idioma = detectarIdiomaInicial();
let cartaActual = null;
let cartasLanzadas = [];
let textosCache = null;
// Source of truth de qué sección está visible en pantalla.
// Valores posibles: 'intro', 'intro-long', 'pregunta', 'lentes', 'dinamica', 'autor', 'cartas', null
let seccionActiva = null;

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

// Aplica los nombres de los lentes (Naturaleza/Fluir/Tecnología) en el idioma activo
// a los .lente-label dentro de #lentes-toggle. Se llama desde aplicarIdiomaUI.
function aplicarLenteLabels() {
  const nombres = lenteNombres[idioma] || lenteNombres.es;
  ['naturaleza', 'fluir', 'tecnologia'].forEach(lente => {
    const wrapper = document.querySelector(`.lente-mini[onclick*="${lente}"]`);
    if (!wrapper) return;
    const labelEl = wrapper.querySelector('.lente-label');
    if (labelEl) labelEl.textContent = nombres[lente];
  });
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
  // Actualiza los labels de los lentes (Naturaleza/Fluir/Tecnología → Nature/Flow/Technology, etc.)
  aplicarLenteLabels();
  // Actualiza el subtítulo del modo activo en el selector de tirada
  aplicarModoSubtitle();
  // Si hay una carta activa, refresca el label sutil del naipe con el nuevo idioma
  if (cartaActual) setNaipeActivo(cartaActual.lente);
}

// Actualiza el subtítulo bajo el selector de modo de tirada (ej. "pasado · presente · futuro").
function aplicarModoSubtitle() {
  const sub = document.getElementById('modo-subtitle');
  const t = TIRADAS[modoTirada];
  if (sub && t) sub.textContent = (t.subtitle && t.subtitle[idioma]) || '';
}

fetch("cartas.json?v=" + new Date().getTime())
  .then(res => res.json())
  .then(data => cartas = data)
  .catch(err => console.error("Error al cargar cartas:", err));

function cargarIntro(desplegarLargo = false) {
  const render = (data) => {
    textosCache = data;
    aplicarIdiomaUI();
    setNaipeActivo(null);
    const introCorta = data.intro.short[idioma] || data.intro.short['es'];
    const introLarga = data.intro.long[idioma] || data.intro.long['es'];
    const masInfoLabel = (data.ui && data.ui.masInfo && data.ui.masInfo[idioma])
      || '➔ Conocer más sobre Ludopoiesis';

    const shortEl = document.getElementById('introShort');
    const longEl = document.getElementById('introLong');
    const cartaContainer = document.getElementById('carta-container');

    cartaContainer.style.display = 'none';

    if (desplegarLargo) {
      const sobreAutorLabel = (data.ui && data.ui.sobreAutor && data.ui.sobreAutor[idioma])
        || '➤ Sobre el autor';
      longEl.innerHTML = introLarga + `<span class="more-button" onclick="mostrarAutor()">${sobreAutorLabel}</span>`;
      longEl.dataset.seccion = 'intro-long';
      shortEl.style.display = 'none';
      longEl.style.display = 'block';
      seccionActiva = 'intro-long';
    } else {
      shortEl.innerHTML = introCorta + `<span class="more-button" onclick="cargarIntro(true)">${masInfoLabel}</span>`;
      shortEl.dataset.seccion = 'intro';
      shortEl.style.display = 'block';
      longEl.style.display = 'none';
      seccionActiva = 'intro';
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
  setNaipeActivo(carta.lente);
  seccionActiva = 'cartas';

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
  setNaipeActivo(nuevaCarta.lente);
  seccionActiva = 'cartas';
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

// === SISTEMA DE TIRADAS (nuevo, reemplaza a lanzarCartaSuperpuesta para flujo normal) ===

// Cambia el modo de tirada (carta | horizontal | vertical) y actualiza la UI del selector.
// Reinicia las cartas en pantalla porque el layout cambia.
function setModoTirada(modo) {
  if (!TIRADAS[modo]) return;
  modoTirada = modo;

  // Marcar botón activo en el selector
  document.querySelectorAll('.modo-btn').forEach(b => {
    const isActive = b.dataset.modo === modo;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-checked', String(isActive));
  });

  // Actualizar subtítulo del selector con el idioma actual
  const sub = document.getElementById('modo-subtitle');
  if (sub) {
    sub.textContent = (TIRADAS[modo].subtitle && TIRADAS[modo].subtitle[idioma]) || '';
  }

  // Limpiar cartas y volver a intro (cada cambio de modo es un nuevo intento)
  reiniciarCartas();
  cargarIntro(false);
}

// Tira N cartas según el modoTirada actual, las renderiza con sus labels de posición
// y delay escalonado para sensación ritual.
// Modo 'carta' ACUMULA cartas. Modos 'horizontal' y 'vertical' REEMPLAZAN.
function lanzarTirada() {
  const tirada = TIRADAS[modoTirada] || TIRADAS.carta;
  const container = document.getElementById('carta-container');
  const esAcumulativo = modoTirada === 'carta';

  if (esAcumulativo) {
    // Modo Carta: NO limpia cartas anteriores, solo agrega una más al pool
    container.removeAttribute('data-layout');
  } else {
    // Modos múltiples: limpia y arranca de cero
    cartasLanzadas = [];
    cartaActual = null;
    container.innerHTML = '';
    container.setAttribute('data-layout', tirada.layout);
    container.classList.remove('muchas-cartas', 'card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6');
  }
  container.style.display = 'flex';

  // Ocultar intros / textos largos
  ['introShort', 'introLong', 'dinamica'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Lentes activos
  const activos = Object.entries(lentesActivos)
    .filter(([_, a]) => a)
    .map(([l]) => l);
  const cartasFiltradas = cartas.filter(c => activos.includes(c.lente));
  if (!cartasFiltradas.length) return mostrarObraDeArteOTexto();

  // En modo acumulativo, evitar repetir cartas ya en pantalla
  const yaEnPantalla = new Set(cartasLanzadas.map(c => c.id));
  const pool = cartasFiltradas.filter(c => !yaEnPantalla.has(c.id));
  // Si ya se mostraron todas las cartas filtradas, reusar el pool completo
  const poolEfectivo = pool.length ? pool : [...cartasFiltradas];

  // Seleccionar N cartas distintas
  const seleccionadas = [];
  const poolCopy = [...poolEfectivo];
  for (let i = 0; i < tirada.count && poolCopy.length; i++) {
    const idx = Math.floor(Math.random() * poolCopy.length);
    seleccionadas.push(poolCopy.splice(idx, 1)[0]);
  }

  // Setear paleta dinámica con la primera carta de la nueva tirada
  if (seleccionadas.length > 0) {
    cartaActual = seleccionadas[0];
    setNaipeActivo(cartaActual.lente);
  }
  seccionActiva = 'cartas';

  // Renderizar con delay escalonado (sensación de tirada secuencial)
  seleccionadas.forEach((carta, i) => {
    setTimeout(() => {
      renderCartaTirada(carta, i, tirada, container, esAcumulativo);
      cartasLanzadas.push(carta);
    }, i * 220);
  });
}

// Renderiza UNA carta dentro de un wrapper con su label de posición (si aplica).
// Si esAcumulativo, agrega rotación aleatoria leve al wrapper (sensación de baraja natural).
function renderCartaTirada(carta, posIndex, tirada, container, esAcumulativo) {
  const titulo = getCartaField(carta, 'titulo');
  const texto  = getCartaField(carta, 'texto');
  const labels = (tirada.labels && tirada.labels[idioma]) || (tirada.labels && tirada.labels.es) || [];
  const posLabel = labels[posIndex] || '';

  const wrapper = document.createElement('div');
  wrapper.className = 'carta-wrapper';

  // En modo carta (acumulativo): ángulo aleatorio entre -4° y +4°
  if (esAcumulativo) {
    const angulo = (Math.random() * 8 - 4).toFixed(1);
    wrapper.style.setProperty('--tilt', angulo + 'deg');
  }

  if (posLabel) {
    const labelEl = document.createElement('div');
    labelEl.className = 'carta-posicion';
    labelEl.dataset.posIndex = String(posIndex);
    labelEl.textContent = posLabel;
    wrapper.appendChild(labelEl);
  }

  const card = document.createElement('div');
  card.className = 'card card-animada';
  card.dataset.id = carta.id;
  card.dataset.lente = carta.lente;
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">${imgCartaHTML(carta, titulo)}</div>
      <div class="card-back">
        <h2>${titulo}</h2>
        <p>${texto.replace(/\n/g, '<br>')}</p>
      </div>
    </div>
  `;

  // Click: voltear y, si tirada múltiple, hacer que la paleta global tome el lente de esta carta
  card.onclick = () => {
    card.classList.toggle('flipped');
    if (card.classList.contains('flipped')) {
      cartaActual = carta;
      setNaipeActivo(carta.lente);
    }
  };

  wrapper.appendChild(card);
  container.appendChild(wrapper);
}

function mostrarObraDeArteOTexto() {
  setNaipeActivo(null);
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
  setNaipeActivo(null);
  const container = document.getElementById("carta-container");
  container.innerHTML = "";
  container.removeAttribute('data-layout');
  container.style.removeProperty('--cards-scale');
  container.classList.remove('muchas-cartas', 'card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6');
}

function _mostrarSeccion(key, seccionTag) {
  const render = (data) => {
    textosCache = data;
    setNaipeActivo(null);
    const texto = data[key]?.[idioma] || data[key]['es'];
    const longEl = document.getElementById('introLong');
    document.getElementById('introShort').style.display = 'none';
    longEl.innerHTML = texto;
    longEl.dataset.seccion = seccionTag;
    longEl.style.display = 'block';
    document.getElementById('carta-container').style.display = 'none';
    seccionActiva = seccionTag;
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

  // Aplica la UI estática (botones, pasos, banderas activas, título, labels de lentes)
  aplicarIdiomaUI();

  // Si hay cartas en pantalla, actualizar cada una con el texto/imagen del nuevo idioma
  if (seccionActiva === 'cartas') {
    const cartasEnPantalla = document.querySelectorAll(".card");
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
        if (imagenIdioma !== imagenES) {
          front.onerror = function() { this.onerror = null; this.src = imagenES; };
        } else {
          front.onerror = null;
        }
      }
      if (backH2) backH2.textContent = titulo;
      if (backP) backP.innerHTML = texto.replace(/\n/g, "<br>");
    });
    // Actualizar labels de posición (Pasado/Presente/Futuro, etc.) si es tirada múltiple
    const tirada = TIRADAS[modoTirada];
    if (tirada && tirada.labels) {
      const newLabels = tirada.labels[idioma] || tirada.labels.es || [];
      document.querySelectorAll('.carta-posicion').forEach(el => {
        const i = parseInt(el.dataset.posIndex || '0', 10);
        if (newLabels[i]) el.textContent = newLabels[i];
      });
    }
    // Refresca el label sutil del naipe con el nuevo idioma
    if (cartaActual) setNaipeActivo(cartaActual.lente);
    return;
  }

  // Re-renderiza la sección activa con el nuevo idioma
  switch (seccionActiva) {
    case 'pregunta':   mostrarPregunta(); break;
    case 'lentes':     mostrarLentes();   break;
    case 'dinamica':   mostrarDinamica(); break;
    case 'autor':      mostrarAutor();    break;
    case 'intro-long': cargarIntro(true); break;
    case 'intro':
    default:           cargarIntro(false);
  }
}

// Compatibilidad con código antiguo que pueda llamar toggleIdioma
function toggleIdioma() {
  const checkbox = document.getElementById("idiomaToggle");
  setIdioma(checkbox && checkbox.checked ? "pt" : "es");
}

function mostrarAutor() {
  const render = (data) => {
    setNaipeActivo(null);
    const texto = data.autor?.[idioma] || data.autor['es'];
    document.getElementById('introShort').style.display = 'none';
    document.getElementById('introLong').innerHTML = texto;
    document.getElementById('introLong').dataset.seccion = 'autor';
    document.getElementById('introLong').style.display = 'block';
    document.getElementById('carta-container').style.display = 'none';
    seccionActiva = 'autor';
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
window.lanzarTirada = lanzarTirada;
window.setModoTirada = setModoTirada;
window.reiniciarCartas = reiniciarCartas;
window.cargarIntro = cargarIntro;
window.mostrarPregunta = mostrarPregunta;
window.mostrarLentes = mostrarLentes;
window.mostrarDinamica = mostrarDinamica;
window.mostrarAutor = mostrarAutor;
window.setIdioma = setIdioma;
window.toggleLente = toggleLente;
window.toggleIdioma = toggleIdioma;
