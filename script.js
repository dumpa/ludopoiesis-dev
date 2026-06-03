// Detecta el idioma inicial:
// 0) Preferencia guardada (elección previa del visitante) → manda sobre todo
// 1) Por subdominio: en.* → 'en', pt.* → 'pt'
// 2) Default: 'es'. El idioma del navegador NO cambia el default;
//    el visitante cambia de idioma con las banderas.
function detectarIdiomaInicial() {
  try {
    const guardado = localStorage.getItem('ludo_idioma');
    if (['es', 'pt', 'en'].includes(guardado)) return guardado;
  } catch (e) { /* localStorage bloqueado (modo privado): se ignora */ }

  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  if (host.startsWith('en.')) return 'en';
  if (host.startsWith('pt.')) return 'pt';
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
    // Micro-línea bajo cada label: ayuda a situar la carta en esa posición.
    hints: {
      es: ['El mundo hasta hoy', 'Hoy', 'El mundo en creación'],
      pt: ['O mundo até hoje', 'Hoje', 'O mundo em criação'],
      en: ['The world until today', 'Today', 'The world in creation']
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
    // Versión corta (cabe bajo la carta). La larga vive en la apertura/Notion.
    hints: {
      es: [
        'Compone el mundo. Piensa bonito.',
        '¿Qué mueve en ti? Resuena o incomoda.',
        'Acciones concretas, pasando o por pasar.'
      ],
      pt: [
        'Compõe o mundo. Pensa bonito.',
        'O que move em você? Ressoa ou incomoda.',
        'Ações concretas, acontecendo ou por acontecer.'
      ],
      en: [
        'It composes the world. Think beautifully.',
        'What moves in you? It resonates or unsettles.',
        'Concrete actions, happening or to come.'
      ]
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
  // Actualiza el label del botón Compartir según idioma
  const shareBtnLabel = document.querySelector('[data-i18n-share]');
  if (shareBtnLabel) shareBtnLabel.textContent = compartirLabels[idioma] || compartirLabels.es;
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
    // data-modo permite alinear el subtítulo bajo el botón activo (CSS).
    sub.dataset.modo = modo;
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

  // Posición inicial del scroll en horizontal: móvil arranca en la 1ª carta
  // (Pasado, a la izquierda); desktop arranca centrado. Siempre con scroll.
  if (tirada.layout === 'horizontal') {
    setTimeout(() => {
      const esDesktop = window.matchMedia('(min-width: 768px)').matches;
      if (esDesktop) {
        container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
      } else {
        container.scrollLeft = 0;
      }
    }, tirada.count * 220 + 80);
  }

  // Tras varias lecturas y algo de tiempo, quizá ofrecer "añadir a inicio" (una vez).
  _tiradasHechas++;
  tal_vez_avisar_home();
}

// Renderiza UNA carta dentro de un wrapper con su label de posición (si aplica).
// Si esAcumulativo, agrega rotación aleatoria leve al wrapper (sensación de baraja natural).
function renderCartaTirada(carta, posIndex, tirada, container, esAcumulativo) {
  const titulo = getCartaField(carta, 'titulo');
  const texto  = getCartaField(carta, 'texto');
  const labels = (tirada.labels && tirada.labels[idioma]) || (tirada.labels && tirada.labels.es) || [];
  const posLabel = labels[posIndex] || '';
  const hints = (tirada.hints && tirada.hints[idioma]) || (tirada.hints && tirada.hints.es) || [];
  const posHint = hints[posIndex] || '';

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

  // Micro-línea que ayuda a leer la carta en esa posición (Pasado / Pensar…).
  if (posHint) {
    const hintEl = document.createElement('div');
    hintEl.className = 'carta-posicion-hint';
    hintEl.textContent = posHint;
    wrapper.appendChild(hintEl);
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

  // Click: la carta sube al frente y voltea. Las demás mantienen su estado
  // (texto sigue en texto, imagen en imagen), solo dejan de estar al frente.
  // Segundo click sobre la misma: solo des-voltea, PERO queda encima (como un
  // dealer que deja la carta arriba). Una carta solo baja cuando se toca otra.
  card.onclick = () => {
    const yaAlFrente = wrapper.classList.contains('al-frente');
    if (yaAlFrente) {
      card.classList.toggle('flipped');
    } else {
      container.querySelectorAll('.carta-wrapper.al-frente').forEach(w => {
        w.classList.remove('al-frente');
      });
      wrapper.classList.add('al-frente');
      card.classList.add('flipped');
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

  // Recordar la elección para próximas visitas.
  try { localStorage.setItem('ludo_idioma', nuevoIdioma); } catch (e) { /* localStorage bloqueado */ }

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

// ============================================================
// COMPARTIR LECTURA · Dos imágenes 4:5 (frente + texto) con Canvas 2D nativo
// ------------------------------------------------------------
// Reescrito (jun 2026): se ABANDONA html-to-image. En su lugar:
//   · Frente  = la ilustración de la carta, encuadrada 4:5 sobre fondo crema.
//   · Reverso = título + texto pintados con Canvas 2D nativo (sin librerías,
//               sin hojas de estilo cross-origin, sin hacks de viewport).
// Las dos salen a 1080×1350 y se comparten como SET (carrusel en feed /
// dos frames en Stories). Slide 1 = ilustración (gancho); slide 2 = texto.
// La pregunta nunca viaja.
// ============================================================

const compartirLabels = {
  es: 'Compartir',
  pt: 'Compartilhar',
  en: 'Share'
};

const SHARE_W = 1080;
const SHARE_H = 1350; // 4:5 (proporción recomendada para carrusel)

// Paleta viva del lente activo, leída del <body> (data-naipe la cambia).
function paletaCompartir() {
  const bs = getComputedStyle(document.body);
  const v = (n, fb) => (bs.getPropertyValue(n).trim() || fb);
  return {
    bg:      v('--bg', '#FAFAF8'),
    ink:     v('--ink', '#1A1A1A'),
    inkSoft: v('--ink-soft', '#555555'),
    inkMute: v('--ink-mute', '#999999'),
    primary: v('--primary', '#1A1A1A'),
    accent:  v('--accent', '#1A1A1A')
  };
}

// Carga una imagen del mismo origen (no ensucia el canvas). Resuelve null si falla.
function cargarImagen(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Asegura que las fuentes de marca estén listas antes de pintar texto.
async function cargarFuentesCompartir() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all([
      document.fonts.load('400 66px "Fraunces"'),
      document.fonts.load('500 66px "Fraunces"'),
      document.fonts.load('400 36px "DM Sans"'),
      document.fonts.load('600 26px "DM Sans"')
    ]);
    await document.fonts.ready;
  } catch (e) { /* si falla, se pinta con la fuente de respaldo */ }
}

// Pinta texto envuelto respetando saltos \n. Devuelve la y final.
// Envuelve un texto en líneas respetando saltos \n. Requiere ctx.font ya fijado.
// Devuelve items: { text } para una línea, { blank:true } para un salto de párrafo.
function envolverEnLineas(ctx, texto, maxW) {
  const items = [];
  const parrafos = String(texto).split('\n');
  parrafos.forEach((parr) => {
    if (parr.trim() === '') {
      // Línea vacía del texto = separación de estrofa: un solo hueco, sin duplicar.
      if (items.length && items[items.length - 1].blank) return;
      items.push({ blank: true });
      return;
    }
    const palabras = parr.split(' ');
    let linea = '';
    for (let i = 0; i < palabras.length; i++) {
      const prueba = linea ? linea + ' ' + palabras[i] : palabras[i];
      if (ctx.measureText(prueba).width > maxW && linea) {
        items.push({ text: linea });
        linea = palabras[i];
      } else {
        linea = prueba;
      }
    }
    if (linea) items.push({ text: linea });
    // Un \n simple es salto de verso (línea normal), NO un hueco de estrofa.
    // El hueco solo lo crea una línea vacía real (\n\n) en el bloque de arriba.
  });
  // Quita huecos sobrantes al principio y al final.
  while (items.length && items[0].blank) items.shift();
  while (items.length && items[items.length - 1].blank) items.pop();
  return items;
}

// Alto total que ocuparían unos items con cierta interlínea.
function altoLineas(items, lineH) {
  return items.reduce((h, it) => h + (it.blank ? lineH * 0.55 : lineH), 0);
}

// Dibuja los items desde (x,y). Devuelve la y final.
function dibujarLineas(ctx, items, x, y, lineH) {
  items.forEach(it => {
    if (it.blank) { y += lineH * 0.55; return; }
    ctx.fillText(it.text, x, y);
    y += lineH;
  });
  return y;
}

// Pie común a las dos imágenes: línea fina + naipe (izq) + url (der).
function pintarPie(ctx, p, naipe) {
  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, SHARE_H - 165);
  ctx.lineTo(SHARE_W - 110, SHARE_H - 165);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textBaseline = 'alphabetic';

  // Naipe (izquierda)
  ctx.font = '600 26px "DM Sans", sans-serif';
  ctx.fillStyle = p.accent;
  ctx.textAlign = 'left';
  ctx.fillText((naipe || '').toUpperCase(), 110, SHARE_H - 95);

  // Handle de Instagram + sitio (derecha, dos líneas)
  ctx.textAlign = 'right';
  ctx.font = '600 26px "DM Sans", sans-serif';
  ctx.fillStyle = p.ink;
  ctx.fillText('@ludopoiesis', SHARE_W - 110, SHARE_H - 110);
  ctx.font = '400 24px "DM Sans", sans-serif';
  ctx.fillStyle = p.inkMute;
  ctx.fillText('ludopoiesis.app', SHARE_W - 110, SHARE_H - 72);
  ctx.textAlign = 'left';
}

function canvasABlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

// FRENTE: la ilustración encuadrada 4:5 sobre fondo crema (es lectura → va grande).
async function renderFrenteCanvas(carta, naipe) {
  const p = paletaCompartir();
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_W; canvas.height = SHARE_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  const url = await resolverImagenCarta(carta);
  const img = await cargarImagen(url);

  // Caja de contenido: deja aire arriba y reserva el pie abajo.
  const box = { x: 90, y: 110, w: SHARE_W - 180, h: SHARE_H - 110 - 230 };
  if (img && img.naturalWidth) {
    const escala = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight);
    const w = img.naturalWidth * escala;
    const h = img.naturalHeight * escala;
    const dx = box.x + (box.w - w) / 2;
    const dy = box.y + (box.h - h) / 2;
    ctx.drawImage(img, dx, dy, w, h);
  }
  pintarPie(ctx, p, naipe);
  return canvasABlob(canvas);
}

// REVERSO: título + texto (el camino), sin la pregunta.
async function renderReversoCanvas(carta, naipe) {
  const p = paletaCompartir();
  const titulo = getCartaField(carta, 'titulo') || '';
  const texto  = getCartaField(carta, 'texto') || '';

  const canvas = document.createElement('canvas');
  canvas.width = SHARE_W; canvas.height = SHARE_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  const margin = 110;
  const maxW = SHARE_W - margin * 2;
  const bottomLimit = SHARE_H - 200; // el texto no debe pasar de aquí (deja sitio al pie)
  let y = 210;

  // Etiqueta del naipe
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = '600 26px "DM Sans", sans-serif';
  ctx.fillStyle = p.accent;
  ctx.fillText((naipe || '').toUpperCase(), margin, y);
  y += 72;

  // Título (Fraunces) — se encoge si es muy largo (máx 3 líneas).
  let tSize, tItems;
  for (tSize = 66; tSize >= 44; tSize -= 4) {
    ctx.font = `500 ${tSize}px "Fraunces", serif`;
    tItems = envolverEnLineas(ctx, titulo, maxW);
    if (tItems.length <= 3) break;
  }
  if (tSize < 44) { tSize = 44; ctx.font = `500 44px "Fraunces", serif`; tItems = envolverEnLineas(ctx, titulo, maxW); }
  const tLineH = Math.round(tSize * 1.16);
  ctx.font = `500 ${tSize}px "Fraunces", serif`;
  ctx.fillStyle = p.primary;
  y = dibujarLineas(ctx, tItems, margin, y, tLineH) + 38;

  // Texto / camino (DM Sans) — se ajusta el cuerpo para que SIEMPRE quepa.
  const dispo = bottomLimit - y;          // alto disponible
  let bSize, bItems, bLineH;
  let bMult = 1.42;                        // interlínea del cuerpo (más ajustada que 1.5)
  for (bSize = 38; bSize >= 18; bSize -= 1) {
    ctx.font = `400 ${bSize}px "DM Sans", sans-serif`;
    bItems = envolverEnLineas(ctx, texto, maxW);
    bLineH = Math.round(bSize * bMult);
    if (altoLineas(bItems, bLineH) <= dispo) break;
  }
  // Garantía anti-desborde: si ni a 18px cabe (carta extrema), aprieta la
  // interlínea hasta que entre antes de tocar el pie.
  if (bSize < 18) {
    bSize = 18;
    ctx.font = `400 ${bSize}px "DM Sans", sans-serif`;
    bItems = envolverEnLineas(ctx, texto, maxW);
    while (bMult > 1.05) {
      bLineH = Math.round(bSize * bMult);
      if (altoLineas(bItems, bLineH) <= dispo) break;
      bMult -= 0.03;
    }
    bLineH = Math.round(bSize * bMult);
  }
  ctx.font = `400 ${bSize}px "DM Sans", sans-serif`;
  ctx.fillStyle = p.inkSoft;
  dibujarLineas(ctx, bItems, margin, y, bLineH);

  pintarPie(ctx, p, naipe);
  return canvasABlob(canvas);
}

// Genera las dos imágenes (frente + reverso) de una carta.
async function generarImagenesCompartibles(cartaArg) {
  const carta = cartaArg || cartaActual || cartasLanzadas[cartasLanzadas.length - 1];
  if (!carta) return null;
  await cargarFuentesCompartir();
  const naipe = (lenteNombres[idioma] || lenteNombres.es)[carta.lente] || '';
  const [frenteBlob, reversoBlob] = await Promise.all([
    renderFrenteCanvas(carta, naipe),
    renderReversoCanvas(carta, naipe)
  ]);
  if (!frenteBlob || !reversoBlob) return null;
  const stamp = Date.now();
  return {
    frente:  new File([frenteBlob],  `ludopoiesis-${stamp}-1-imagen.png`, { type: 'image/png' }),
    reverso: new File([reversoBlob], `ludopoiesis-${stamp}-2-texto.png`,  { type: 'image/png' })
  };
}

// Descarga un File (fallback desktop / navegadores sin Web Share de archivos).
function descargarArchivo(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Descripción lista para pegar, con la MENCIÓN real @ludopoiesis.
// (Una imagen no puede forzar una mención en Instagram; esto se copia al
//  portapapeles para que al pegarla, el @ se vuelva mención tappable.)
const SHARE_HANDLE = '@ludopoiesis';
function captionCompartir(carta, naipe) {
  const titulo = getCartaField(carta, 'titulo') || '';
  const plantillas = {
    es: `“${titulo}” · ${naipe}\n\nMi carta de hoy con ${SHARE_HANDLE}\nTira la tuya en ludopoiesis.app`,
    pt: `“${titulo}” · ${naipe}\n\nMinha carta de hoje com ${SHARE_HANDLE}\nTire a sua em ludopoiesis.app`,
    en: `“${titulo}” · ${naipe}\n\nMy card today with ${SHARE_HANDLE}\nDraw yours at ludopoiesis.app`
  };
  return plantillas[idioma] || plantillas.es;
}

// Aviso breve, autocontenido (sin tocar el CSS).
function mostrarToastCompartir(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText =
    'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;' +
    'max-width:86%;background:#1A1A1A;color:#FAFAF8;padding:12px 18px;border-radius:10px;' +
    'font-family:"DM Sans",sans-serif;font-size:14px;line-height:1.35;text-align:center;' +
    'box-shadow:0 8px 28px rgba(0,0,0,.25);opacity:0;transition:opacity .25s ease;';
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3800);
}

const toastCopiado = {
  es: 'Descripción con @ludopoiesis copiada — pégala al postear y queda como mención.',
  pt: 'Descrição com @ludopoiesis copiada — cole ao postar e vira menção.',
  en: 'Caption with @ludopoiesis copied — paste it when posting to tag us.'
};

// Comparte las dos imágenes como SET (carrusel en feed / dos frames en Stories)
// y copia una descripción con @ludopoiesis para que la mención sea real al pegar.
async function compartirLectura() {
  if (!cartasLanzadas.length && !cartaActual) return;
  const carta = cartaActual || cartasLanzadas[cartasLanzadas.length - 1];
  if (!carta) return;

  const btn = document.querySelector('.btn-share');
  const label = btn && btn.querySelector('[data-i18n-share]');
  const textoOriginal = label ? label.textContent : '';
  if (btn) btn.disabled = true;
  if (label) label.textContent = '…';

  const naipe = (lenteNombres[idioma] || lenteNombres.es)[carta.lente] || '';
  const caption = captionCompartir(carta, naipe);

  // Copiar la descripción YA (dentro del gesto, antes de los awaits) para no
  // perder el permiso de portapapeles en navegadores estrictos.
  let copiado = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(caption);
      copiado = true;
    }
  } catch (e) { /* sin portapapeles: seguimos igual */ }

  try {
    const imgs = await generarImagenesCompartibles(carta);
    if (!imgs) return;
    const files = [imgs.frente, imgs.reverso];

    if (navigator.canShare && navigator.canShare({ files })) {
      try {
        // text se respeta en apps como WhatsApp/Telegram; Instagram lo ignora,
        // por eso además dejamos la descripción en el portapapeles.
        await navigator.share({ files, text: caption, title: 'Ludopoiesis' });
        if (copiado) mostrarToastCompartir(toastCopiado[idioma] || toastCopiado.es);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // el usuario canceló: no es error
        console.error('Share falló, fallback a descarga:', e);
      }
    }
    // Fallback: descargar ambas (para postear a mano).
    descargarArchivo(imgs.frente);
    setTimeout(() => descargarArchivo(imgs.reverso), 400);
    if (copiado) mostrarToastCompartir(toastCopiado[idioma] || toastCopiado.es);
  } catch (e) {
    console.error('Error al compartir:', e);
  } finally {
    if (btn) btn.disabled = false;
    if (label) label.textContent = textoOriginal || (compartirLabels[idioma] || compartirLabels.es);
  }
}

// Devuelve la URL de imagen que realmente carga para una carta: intenta la del
// idioma activo; si falla (ej. imagen EN inexistente), cae a la ES.
function resolverImagenCarta(carta) {
  const imgIdioma = getCartaField(carta, 'imagen') || carta.imagen || '';
  const imgES = carta.imagen || '';
  if (!imgIdioma || imgIdioma === imgES) {
    return Promise.resolve(imgES || imgIdioma);
  }
  return new Promise(resolve => {
    const test = new Image();
    test.onload = () => resolve(imgIdioma);
    test.onerror = () => resolve(imgES);
    test.src = imgIdioma;
  });
}

// ============================================================
// AVISO "AÑADIR A PANTALLA DE INICIO" (una sola vez, tras la primera tirada)
// ============================================================
// Filosofía: ofrecerlo UNA vez, en el mejor momento (después de vivir una
// lectura), fácil de ignorar y que no vuelva a aparecer. iOS no permite
// instalar por código → se enseña el gesto. Android/Chrome → botón real.

const HOME_HINT_KEY = 'ludo_homehint';
let _homeHintArmado = false;
let _deferredInstallPrompt = null;
let _tiradasHechas = 0;                 // cuántas lecturas lleva el visitante
const _homeHintInicio = Date.now();     // marca de tiempo de carga
const HOME_HINT_MIN_TIRADAS = 2;        // necesita al menos 2 lecturas
const HOME_HINT_MIN_MS = 30000;         // y ~30s de uso real antes de ofrecerlo

// Captura el prompt nativo de instalación (Android / Chrome) para ofrecer un
// botón "Instalar" de verdad cuando el navegador lo permite.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
});

function estaInstalada() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  } catch (e) { return false; }
}
function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent || '') && !window.MSStream;
}
function yaSeMostroHint() {
  try { return localStorage.getItem(HOME_HINT_KEY) === '1'; } catch (e) { return false; }
}
function marcarHintMostrado() {
  try { localStorage.setItem(HOME_HINT_KEY, '1'); } catch (e) { /* ignorar */ }
}

const homeHintTextos = {
  titulo: {
    es: 'Ten Ludopoiesis a la mano',
    pt: 'Tenha o Ludopoiesis à mão',
    en: 'Keep Ludopoiesis close'
  },
  ios: {
    es: 'Toca <b>Compartir {share}</b> → <b>“Añadir a pantalla de inicio”</b>, y el oráculo queda a un toque.',
    pt: 'Toque em <b>Compartilhar {share}</b> → <b>“Adicionar à Tela de Início”</b>, e o oráculo fica a um toque.',
    en: 'Tap <b>Share {share}</b> → <b>“Add to Home Screen”</b>, and the oracle stays one tap away.'
  },
  android: {
    es: 'Déjalo en tu inicio: el oráculo, a un toque.',
    pt: 'Deixe na sua tela inicial: o oráculo, a um toque.',
    en: 'Put it on your home screen: the oracle, one tap away.'
  },
  instalar: { es: 'Instalar', pt: 'Instalar', en: 'Install' },
  cerrar: { es: 'Cerrar', pt: 'Fechar', en: 'Close' }
};

function inyectarEstilosHint() {
  if (document.getElementById('lph-styles')) return;
  const st = document.createElement('style');
  st.id = 'lph-styles';
  st.textContent =
    '.lph{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:460px;' +
    'margin:0 auto;background:#FAFAF8;border:1px solid rgba(0,0,0,.10);border-radius:16px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.14);padding:16px 16px 14px;' +
    'font-family:"DM Sans",system-ui,sans-serif;color:#2A2A28;' +
    'transform:translateY(150%);transition:transform .45s cubic-bezier(.2,.8,.2,1);}' +
    '.lph.show{transform:translateY(0);}' +
    '.lph-row{display:flex;align-items:flex-start;gap:11px;}' +
    '.lph-ic{flex:0 0 auto;width:26px;height:26px;margin-top:3px;}' +
    '.lph-body{flex:1 1 auto;}' +
    '.lph-title{font-weight:600;font-size:16px;margin:0 0 3px;}' +
    '.lph-text{font-size:14px;line-height:1.45;color:#555;margin:0;}' +
    '.lph-text b{color:#2A2A28;font-weight:600;}' +
    '.lph-share-glyph{display:inline-block;vertical-align:-3px;width:15px;height:15px;}' +
    '.lph-actions{margin-top:12px;}' +
    '.lph-install{border:none;background:#176B53;color:#fff;font:600 14px/1 "DM Sans",sans-serif;' +
    'padding:11px 18px;border-radius:10px;cursor:pointer;}' +
    '.lph-close{position:absolute;top:6px;right:10px;border:none;background:none;font-size:22px;' +
    'line-height:1;color:#aaa;cursor:pointer;padding:4px;}';
  document.head.appendChild(st);
}

// Llamar tras una tirada. Decide si corresponde mostrar el aviso (una vez).
function tal_vez_avisar_home() {
  if (_homeHintArmado) return;
  if (estaInstalada() || yaSeMostroHint()) return;
  // Solo en móvil: es donde el ícono al inicio cambia la experiencia.
  const esMovil = window.matchMedia('(max-width: 820px)').matches || ('ontouchstart' in window);
  if (!esMovil) return;
  // Necesita tiempo y uso real: varias lecturas y un rato en la app.
  if (_tiradasHechas < HOME_HINT_MIN_TIRADAS) return;
  if (Date.now() - _homeHintInicio < HOME_HINT_MIN_MS) return;
  _homeHintArmado = true;
  // Pequeña espera para no pisar el momento de la carta recién tirada.
  setTimeout(() => {
    if (estaInstalada() || yaSeMostroHint()) return;
    mostrarHomeHint();
  }, 2000);
}

function mostrarHomeHint() {
  inyectarEstilosHint();
  marcarHintMostrado(); // aparece una sola vez en la vida del visitante

  const t = (o) => o[idioma] || o.es;
  const hayPromptNativo = !!_deferredInstallPrompt;
  const usarIOS = esIOS() || !hayPromptNativo; // sin prompt nativo → enseñar el gesto

  const shareGlyph =
    '<svg class="lph-share-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 16V4"/><path d="M8 8l4-4 4 4"/>' +
    '<path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';
  const homeGlyph =
    '<svg class="lph-ic" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>';

  const cuerpo = usarIOS
    ? t(homeHintTextos.ios).replace('{share}', shareGlyph)
    : t(homeHintTextos.android);

  const banner = document.createElement('div');
  banner.className = 'lph';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML =
    '<button class="lph-close" aria-label="' + t(homeHintTextos.cerrar) + '">×</button>' +
    '<div class="lph-row">' + homeGlyph +
    '<div class="lph-body">' +
    '<p class="lph-title">' + t(homeHintTextos.titulo) + '</p>' +
    '<p class="lph-text">' + cuerpo + '</p>' +
    (hayPromptNativo && !usarIOS
      ? '<div class="lph-actions"><button class="lph-install">' + t(homeHintTextos.instalar) + '</button></div>'
      : '') +
    '</div></div>';

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('show'));

  const cerrar = () => {
    banner.classList.remove('show');
    setTimeout(() => { if (banner.parentNode) banner.remove(); }, 460);
  };
  banner.querySelector('.lph-close').addEventListener('click', cerrar);

  const btnInstall = banner.querySelector('.lph-install');
  if (btnInstall && _deferredInstallPrompt) {
    btnInstall.addEventListener('click', async () => {
      const ev = _deferredInstallPrompt;
      _deferredInstallPrompt = null;
      cerrar();
      try { ev.prompt(); await ev.userChoice; } catch (e) { /* el usuario decidió */ }
    });
  }

  // No es modal: si lo ignora, se retira solo a los 13s.
  setTimeout(() => { if (document.body.contains(banner)) cerrar(); }, 13000);
}

// ============================================================
// EXPORTS A WINDOW
// ============================================================
window.lanzarCartaConEstilo = lanzarCartaConEstilo;
window.lanzarCartaSuperpuesta = lanzarCartaSuperpuesta;
window.lanzarTirada = lanzarTirada;
window.setModoTirada = setModoTirada;
window.reiniciarCartas = reiniciarCartas;
window.cargarIntro = cargarIntro;
window.compartirLectura = compartirLectura;
window.mostrarPregunta = mostrarPregunta;
window.mostrarLentes = mostrarLentes;
window.mostrarDinamica = mostrarDinamica;
window.mostrarAutor = mostrarAutor;
window.setIdioma = setIdioma;
window.toggleLente = toggleLente;
window.toggleIdioma = toggleIdioma;
