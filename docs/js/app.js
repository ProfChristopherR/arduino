/* =====================================================
   CURSO DE ARDUINO — Aplicación principal
   Carga markdown, navegación por pestañas, temas
   ===================================================== */

// ---------- Configuración ----------
const CLASES = [
    { id: 'inicio', titulo: 'Inicio', desc: '', archivo: 'clases/inicio.md' },
    { id: '01', titulo: '¡Hola, Arduino!', desc: 'Tour por la placa y tus primeros circuitos en el simulador Tinkercad', archivo: 'clases/clase-01-hola-arduino.md' },
    { id: '02', titulo: 'Pensar como Programador', desc: 'Algoritmos, variables, condicionales y bucles… sin miedo', archivo: 'clases/clase-02-pensar-como-programador.md' },
    { id: '03', titulo: 'Primeros Programas', desc: 'Estrenamos el kit físico: IDE, LEDs, botones y Monitor Serie', archivo: 'clases/clase-03-primeros-programas.md' },
    { id: '04', titulo: 'Mundo Analógico', desc: 'Potenciómetro, sensor de luz, PWM, LED RGB y música', archivo: 'clases/clase-04-mundo-analogico.md' },
    { id: '05', titulo: 'Explorando el Kit XL', desc: 'Pantalla LCD, servo y radar de parking ultrasónico', archivo: 'clases/clase-05-explorando-kit-xl.md' },
    { id: '06', titulo: 'Taller de Soldadura', desc: 'Cautín, estaño y tu primer circuito permanente', archivo: 'clases/clase-06-taller-soldadura.md' },
    { id: '07', titulo: 'Arduino Avanzado', desc: 'Funciones, arrays, millis() y código profesional', archivo: 'clases/clase-07-arduino-avanzado.md' },
    { id: '08', titulo: 'IA + Proyecto Final', desc: 'Gemini como copiloto y tu gran proyecto final 🏆', archivo: 'clases/clase-08-programar-con-ia-proyecto-final.md' }
];

// ---------- Estado ----------
let claseActual = 'inicio';
let contenidoCargado = false;

// ---------- Elementos DOM ----------
const elements = {
    claseContainer: document.getElementById('claseContainer'),
    loadingContainer: document.getElementById('loadingContainer'),
    themeToggle: document.getElementById('themeToggle'),
    tabNav: document.getElementById('tabNav'),
    claseSelector: document.getElementById('claseSelector'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    floatNav: document.getElementById('floatNav'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    backToTop: document.getElementById('backToTop'),
    siteHeader: document.getElementById('siteHeader'),
    hljsTheme: document.getElementById('hljs-theme')
};

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', () => {
    configurarMarked();
    renderizarNavegacion();
    configurarEventos();
    cargarClaseDesdeURL();
    configurarScrollEffects();
});

// ---------- Configurar Marked.js ----------
function configurarMarked() {
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (e) {
                    console.warn('Error highlighting:', e);
                }
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });
}

// ---------- Renderizar navegación desde CLASES ----------
function renderizarNavegacion() {
    if (elements.claseSelector) {
        elements.claseSelector.innerHTML = CLASES.map(c => {
            const label = c.id === 'inicio' ? `★ ${c.titulo}` : `${c.id} · ${c.titulo}`;
            return `<option value="${c.id}">${label}</option>`;
        }).join('');
    }

    if (elements.tabNav) {
        elements.tabNav.innerHTML = CLASES.map(c => {
            const label = c.id === 'inicio' ? '★' : c.id;
            return `<button class="tab-btn ${c.id === 'inicio' ? 'active' : ''}" data-clase="${c.id}" title="${c.titulo}"><span class="tab-num">${label}</span></button>`;
        }).join('');
    }
}

// ---------- Configurar eventos ----------
function configurarEventos() {
    // Cambio de tema
    elements.themeToggle.addEventListener('click', toggleTema);

    // Navegación por pestañas (números)
    elements.tabNav.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => navegarAClase(btn.dataset.clase));
    });

    // Selector desplegable de clase
    if (elements.claseSelector) {
        elements.claseSelector.addEventListener('change', (e) => {
            navegarAClase(e.target.value);
        });
    }

    // Delegación de clics dentro del contenido:
    // - tarjetas de clase (página de inicio)
    // - enlaces a archivos clase-XX-*.md (tabla del inicio)
    elements.claseContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.clase-card');
        if (card) {
            navegarAClase(card.dataset.clase);
            return;
        }
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href') || '';
            const match = href.match(/clase-(\d{2})-[^/]*\.md/);
            if (match) {
                e.preventDefault();
                navegarAClase(match[1]);
            }
        }
    });

    // Navegación anterior/siguiente
    elements.prevBtn.addEventListener('click', navegarAnterior);
    elements.nextBtn.addEventListener('click', navegarSiguiente);

    // Botón volver arriba
    elements.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Teclado: flechas para navegar
    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
            navegarAnterior();
        } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
            navegarSiguiente();
        }
    });

    // Historial del navegador
    window.addEventListener('popstate', cargarClaseDesdeURL);
}

// ---------- Navegación ----------
function navegarAClase(claseId, pushState = true) {
    if (claseId === claseActual && contenidoCargado) return;

    claseActual = claseId;

    if (pushState) {
        const url = claseId === 'inicio' ? window.location.pathname : `#${claseId}`;
        history.pushState({ clase: claseId }, '', url);
    }

    actualizarTabs();
    actualizarNavegacion();
    cargarClase(claseId);
}

function navegarAnterior() {
    const idx = CLASES.findIndex(c => c.id === claseActual);
    if (idx > 0) navegarAClase(CLASES[idx - 1].id);
}

function navegarSiguiente() {
    const idx = CLASES.findIndex(c => c.id === claseActual);
    if (idx < CLASES.length - 1) navegarAClase(CLASES[idx + 1].id);
}

function actualizarTabs() {
    elements.tabNav.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.clase === claseActual);
    });
    if (elements.claseSelector) {
        elements.claseSelector.value = claseActual;
    }
}

function actualizarNavegacion() {
    const idx = CLASES.findIndex(c => c.id === claseActual);

    elements.prevBtn.disabled = idx <= 0;
    elements.nextBtn.disabled = idx >= CLASES.length - 1;

    const progreso = ((idx + 1) / CLASES.length) * 100;
    elements.progressBar.style.setProperty('--progress', `${progreso}%`);
    elements.progressText.textContent = `${idx + 1} / ${CLASES.length}`;
}

function cargarClaseDesdeURL() {
    const hash = window.location.hash.slice(1);
    const claseValida = CLASES.find(c => c.id === hash);
    const claseId = claseValida ? hash : 'inicio';

    if (claseId !== claseActual || !contenidoCargado) {
        navegarAClase(claseId, false);
    }
}

// ---------- Cargar y renderizar clase ----------
async function cargarClase(claseId) {
    const clase = CLASES.find(c => c.id === claseId);
    if (!clase) return;

    mostrarCargando(true);
    contenidoCargado = false;

    try {
        const response = await fetch(clase.archivo);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const markdown = await response.text();
        const html = marked.parse(markdown);

        renderizarContenido(html, clase);
        contenidoCargado = true;
        setTimeout(precargarSiguiente, 1200);

    } catch (error) {
        console.error('Error cargando clase:', error);
        mostrarError(clase);
    } finally {
        mostrarCargando(false);
    }
}

function renderizarContenido(html, clase) {
    const procesado = procesarHTML(html, clase);

    elements.claseContainer.innerHTML = procesado;
    elements.claseContainer.classList.remove('loaded');

    // Forzar reflow para la animación
    void elements.claseContainer.offsetWidth;
    elements.claseContainer.classList.add('loaded');

    // Post-procesamiento
    envolverTablas();
    configurarAnimacionesSecciones();
    scrollAlInicio();
}

function procesarHTML(html, clase) {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // 1. Eliminar TODOS los <hr> del markdown (las líneas separadoras).
    //    Las secciones ya se separan visualmente con sus propios estilos.
    temp.querySelectorAll('hr').forEach(hr => hr.remove());

    // 2. Extraer la primera imagen como hero (solo en las clases)
    const primeraImg = temp.querySelector('img');
    if (primeraImg && clase.id !== 'inicio') {
        const heroHTML = `
            <div class="clase-hero">
                <span class="hero-badge">Clase ${clase.id}</span>
                <img src="${primeraImg.getAttribute('src')}" alt="${primeraImg.getAttribute('alt') || clase.titulo}" loading="eager">
            </div>
        `;
        const parrafoImg = primeraImg.closest('p');
        if (parrafoImg) parrafoImg.remove();

        const h1 = temp.querySelector('h1');
        if (h1) {
            h1.insertAdjacentHTML('afterend', heroHTML);
        } else {
            temp.insertAdjacentHTML('afterbegin', heroHTML);
        }
    }

    // 3. En la página de inicio, insertar las tarjetas de acceso a cada clase
    if (clase.id === 'inicio') {
        const h1 = temp.querySelector('h1');
        const tarjetas = generarTarjetasClases();
        if (h1) {
            h1.insertAdjacentHTML('afterend', tarjetas);
        } else {
            temp.insertAdjacentHTML('afterbegin', tarjetas);
        }
    }

    // 4. Envolver el contenido en secciones animadas (por cada H2)
    return envolverSecciones(temp);
}

function generarTarjetasClases() {
    const cards = CLASES
        .filter(c => c.id !== 'inicio')
        .map(c => `
            <button class="clase-card" data-clase="${c.id}">
                <span class="clase-card-num">${c.id}</span>
                <span class="clase-card-body">
                    <span class="clase-card-title">${c.titulo}</span>
                    <span class="clase-card-desc">${c.desc}</span>
                </span>
                <span class="clase-card-arrow">→</span>
            </button>
        `).join('');

    return `<div class="clases-grid">${cards}</div>`;
}

function envolverSecciones(container) {
    // Reconstruir el contenido agrupando por H2 en <section> animadas.
    // Se trabaja sobre una copia de los nodos para no dejar nodos huérfanos.
    const nodos = Array.from(container.childNodes);
    const salida = document.createElement('div');
    let seccion = null;

    nodos.forEach(n => {
        const esH2 = n.nodeType === 1 && n.tagName === 'H2';

        if (esH2 || seccion === null) {
            // Abrir nueva sección (también para el bloque inicial antes del primer H2)
            seccion = document.createElement('section');
            seccion.className = 'section-animate';
            salida.appendChild(seccion);
        }

        // Ignorar nodos de texto vacíos entre bloques
        if (n.nodeType === 3 && n.textContent.trim() === '') return;

        seccion.appendChild(n);
    });

    return salida.innerHTML;
}

function envolverTablas() {
    elements.claseContainer.querySelectorAll('table').forEach(table => {
        if (!table.parentElement.classList.contains('table-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

function configurarAnimacionesSecciones() {
    const secciones = elements.claseContainer.querySelectorAll('.section-animate');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
    });

    secciones.forEach(seccion => observer.observe(seccion));
}

function mostrarCargando(mostrar) {
    elements.loadingContainer.style.display = mostrar ? 'flex' : 'none';
    elements.claseContainer.style.display = mostrar ? 'none' : 'block';
}

function mostrarError(clase) {
    elements.claseContainer.innerHTML = `
        <div class="section-animate visible error-box">
            <div class="error-icon">😕</div>
            <h2>No se pudo cargar la clase</h2>
            <p>Ha ocurrido un error al cargar "${clase.titulo}".</p>
            <button class="btn-reintentar" onclick="location.reload()">Reintentar</button>
        </div>
    `;
    elements.claseContainer.classList.add('loaded');
}

function scrollAlInicio() {
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// ---------- Tema claro/oscuro ----------
function toggleTema() {
    const actual = document.documentElement.getAttribute('data-theme');
    const nuevo = actual === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nuevo);
    localStorage.setItem('arduino-theme', nuevo);
    actualizarTemaCodigo(nuevo);
}

function actualizarTemaCodigo(tema) {
    const themes = {
        dark: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
        light: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
    };
    elements.hljsTheme.href = themes[tema] || themes.dark;
}

// ---------- Efectos de scroll ----------
function configurarScrollEffects() {
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        elements.floatNav.classList.toggle('visible', scrollY > 300);
        elements.backToTop.classList.toggle('visible', scrollY > 500);
    }, { passive: true });
}

// ---------- Precargar la siguiente clase ----------
function precargarSiguiente() {
    const idx = CLASES.findIndex(c => c.id === claseActual);
    if (idx >= 0 && idx < CLASES.length - 1) {
        fetch(CLASES[idx + 1].archivo).catch(() => {});
    }
}
