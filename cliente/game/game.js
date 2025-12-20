// --- VARIABLES GLOBALES ---
var socket, canvas, ctx, camara;
var teclas = {};
var otrosJugadores = {};
var jugador;

// Estado de Recursos (Assets)
var jugadorSprite = new Image();
var imagenFondo = null;
var patronFondo = null;
var canvasFondo = null;
var ctxFondo = null;
var recursosCargados = false;
var imagenEnemigo = null;
var enemigoCargado = false;
var imagenEstrella = null;
var estrellaCargada = false;

// Estado de Audio
var audioCtx = null;
var bufferSalto = null;
var gananciaSalto = null;
var saltoCargado = false;
var bufferEstrella = null;
var gananciaEstrella = null;
var sonidoEstrellaCargado = false;
var bufferDaño = null;
var gananciaDaño = null;
var sonidoDañoCargado = false;

// Estado del Juego
var juegoTerminado = false;

/**
 * PUNTO DE ENTRADA PRINCIPAL
 */
function StartGameManager(codigo, jugadoresIniciales, miEmail) {
  console.log("GameManager: Inicializando Lógica de juego...");
  
  // Inicialización de Socket.io
  socket = ws.socket;

  // Inicialización de Canvas
  canvas = document.getElementById('game');
  if (!canvas) {
    alert("Error: No se encontró el canvas con id 'game'.");
    throw new Error("No se encontró el canvas con id 'game'.");
  }
  
  ctx = canvas.getContext('2d');
  camara = {
    x: 0,
    y: Math.max(0, CONFIG.WORLD_HEIGHT - canvas.height)
  };

  // Manejo de entrada
  teclas = {};
  window.addEventListener('keydown', e => { teclas[e.key] = true; });
  window.addEventListener('keyup', e => { teclas[e.key] = false; });

  // Variables de jugadores
  otrosJugadores = {};
  
  // Jugador local
  jugador = {
    x: canvas.width / 2 - CONFIG.PLAYER_WIDTH / 2,
    y: CONFIG.WORLD_HEIGHT - CONFIG.PLAYER_HEIGHT - 60,
    w: CONFIG.PLAYER_WIDTH,
    h: CONFIG.PLAYER_HEIGHT,
    vx: 0, 
    vy: 0,
    velocidad: CONFIG.PLAYER_SPEED,
    color: CONFIG.PLAYER_COLOR,
    enSuelo: false,
    vidas: 5,
    invulnerableHasta: 0,

  };

  // --- Funciones auxiliares de color y carga ---

  function hexARgb(hex) {
    if (!hex) return { r: 0, g: 0, b: 0 };
    let valor = hex.replace('#', '').trim();
    if (valor.length === 3) {
      valor = valor.split('').map((char) => char + char).join('');
    }
    const entero = parseInt(valor, 16);
    if (Number.isNaN(entero)) return { r: 0, g: 0, b: 0 };
    return {
      r: (entero >> 16) & 255,
      g: (entero >> 8) & 255,
      b: entero & 255
    };
  }

  function rgbACss({ r, g, b }) {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  function interpolacion(a, b, t) {
    return a + (b - a) * Math.min(Math.max(t, 0), 1);
  }

  function interpolarColor(colorA, colorB, t) {
    return {
      r: interpolacion(colorA.r, colorB.r, t),
      g: interpolacion(colorA.g, colorB.g, t),
      b: interpolacion(colorA.b, colorB.b, t)
    };
  }

  function obtenerColorDeParadas(paradas = [], t) {
    if (!paradas.length) return 'rgba(0, 0, 0, 0)';
    const limitado = Math.min(Math.max(t, 0), 1);
    let previa = paradas[0];
    for (const parada of paradas) {
      if (limitado <= parada.stop) {
        const tramo = parada.stop - previa.stop || 1;
        const tLocal = (limitado - previa.stop) / tramo;
        const color = interpolarColor(hexARgb(previa.color), hexARgb(parada.color), tLocal);
        return rgbACss(color);
      }
      previa = parada;
    }
    const ultimoColor = hexARgb(paradas[paradas.length - 1].color);
    return rgbACss(ultimoColor);
  }

  function cargarImagen(ruta) {
    return new Promise((resolver) => {
      const img = new Image();
      img.onload = () => resolver(img);
      img.onerror = () => resolver(null);
      img.src = ruta;
    });
  }

  async function crearContextoAudioSiEsNecesario() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    try { await audioCtx.resume(); } catch (e) { }
  }

  async function cargarBufferAudio(url) {
    if (!url) return null;
    try {
      await crearContextoAudioSiEsNecesario();
      const res = await fetch(url);
      if (!res.ok) return null;
      const ab = await res.arrayBuffer();
      const buf = await audioCtx.decodeAudioData(ab);
      return buf;
    } catch (e) {
      console.warn('Fallo al cargar buffer de audio', e);
      return null;
    }
  }

  async function cargarRecursos() {
    const promesaFondo = cargarImagen(ASSETS.BACKGROUND);
    const promesaJugador = ASSETS.PLAYER ? cargarImagen(ASSETS.PLAYER) : Promise.resolve(null);
    const promesaSalto = ASSETS.JUMP ? cargarBufferAudio(ASSETS.JUMP) : Promise.resolve(null);
    const promesaEnemigo = ASSETS.SLIME ? cargarImagen(ASSETS.SLIME) : Promise.resolve(null);
    const promesaEstrella = ASSETS.STAR ? cargarImagen(ASSETS.STAR) : Promise.resolve(null);

    const [imgJugador, imgFondo, bufSalto, imgEnemigo, imgEstrella] = await Promise.all([
      promesaJugador, promesaFondo, promesaSalto, promesaEnemigo, promesaEstrella
    ]);

    if (imgJugador) {
      jugadorSprite = imgJugador;
      recursosCargados = true;
    }

    if (imgFondo) {
      const escala = BACKGROUND_SETTINGS?.SCALE || 1;
      const anchoEscalado = Math.max(1, Math.floor(imgFondo.width * escala));
      const altoEscalado = Math.max(1, Math.floor(imgFondo.height * escala));

      canvasFondo = document.createElement('canvas');
      canvasFondo.width = anchoEscalado;
      canvasFondo.height = altoEscalado;
      ctxFondo = canvasFondo.getContext('2d');
      ctxFondo.drawImage(imgFondo, 0, 0, anchoEscalado, altoEscalado);

      imagenFondo = imgFondo;
      patronFondo = ctx.createPattern(canvasFondo, 'repeat');
    }

    if (bufSalto) {
      bufferSalto = bufSalto;
      saltoCargado = true;
      if (!gananciaSalto && audioCtx) {
        gananciaSalto = audioCtx.createGain();
        gananciaSalto.gain.value = 0.8;
        gananciaSalto.connect(audioCtx.destination);
      }
    }

    if (imgEnemigo) {
      imagenEnemigo = imgEnemigo;
      enemigoCargado = true;
    }

    if (imgEstrella) {
      imagenEstrella = imgEstrella;
      estrellaCargada = true;
    }

    if (ASSETS.STAR_SOUND) {
      const buf = await cargarBufferAudio(ASSETS.STAR_SOUND);
      if (buf) {
        bufferEstrella = buf;
        sonidoEstrellaCargado = true;
        if (!gananciaEstrella && audioCtx) {
          gananciaEstrella = audioCtx.createGain();
          gananciaEstrella.gain.value = 0.9;
          gananciaEstrella.connect(audioCtx.destination);
        }
      }
    }

    if (ASSETS.DAMAGE) {
      const buf = await cargarBufferAudio(ASSETS.DAMAGE);
      if (buf) {
        bufferDaño = buf;
        sonidoDañoCargado = true;
        if (!gananciaDaño && audioCtx) {
          gananciaDaño = audioCtx.createGain();
          gananciaDaño.gain.value = 0.9;
          gananciaDaño.connect(audioCtx.destination);
        }
      }
    }
  }

  function reproducirSalto() {
    try {
      if (bufferSalto && audioCtx && gananciaSalto) {
        const fuente = audioCtx.createBufferSource();
        fuente.buffer = bufferSalto;
        fuente.connect(gananciaSalto);
        fuente.start(0);
      }
    } catch (e) { }
  }

  // --- Funciones del Juego ---

  function resolverColisiones(p) {
    p.enSuelo = false;
    const previo = { x: p.prevX, y: p.prevY, w: p.w, h: p.h };

    for (const plat of PLATFORMS) {
      const colisionado = p.x < plat.x + plat.w && p.x + p.w > plat.x && p.y < plat.y + plat.h && p.y + p.h > plat.y;
      if (!colisionado) continue;

      const basePrevia = previo.y + previo.h;
      const topePrevio = previo.y;
      const derechaPrevia = previo.x + previo.w;
      const izquierdaPrevia = previo.x;

      const topePlat = plat.y;
      const basePlat = plat.y + plat.h;

      if (basePrevia <= topePlat) {
        p.y = topePlat - p.h;
        p.vy = 0;
        p.enSuelo = true;
        continue;
      }

      if (topePrevio >= basePlat) {
        p.y = basePlat;
        p.vy = 0;
        continue;
      }

      if (derechaPrevia <= plat.x) {
        p.x = plat.x - p.w - 0.1;
        p.vx = 0;
        continue;
      }
      if (izquierdaPrevia >= plat.x + plat.w) {
        p.x = plat.x + plat.w + 0.1;
        p.vx = 0;
        continue;
      }

      if (p.vy >= 0) {
        p.y = topePlat - p.h;
        p.vy = 0;
        p.enSuelo = true;
      } else {
        p.y = basePlat;
        p.vy = 0;
      }
    }
  }

  function manejarEntrada() {
    jugador.vx = 0;
    if (teclas['a'] || teclas['ArrowLeft']) jugador.vx = -jugador.velocidad;
    else if (teclas['d'] || teclas['ArrowRight']) jugador.vx = jugador.velocidad;

    if ((teclas['w'] || teclas['ArrowUp'] || teclas[' ']) && jugador.enSuelo) {
      jugador.vy = CONFIG.JUMP_POWER;
      jugador.enSuelo = false;
      reproducirSalto();
    }
  }

  function actualizarFisicas() {
    jugador.prevX = jugador.x;
    jugador.prevY = jugador.y;
    jugador.vy += CONFIG.GRAVITY;
    jugador.x += jugador.vx;
    jugador.y += jugador.vy;

    if (jugador.x < 0) jugador.x = 0;
    if (jugador.x + jugador.w > CONFIG.WORLD_WIDTH) jugador.x = CONFIG.WORLD_WIDTH - jugador.w;
    if (jugador.y < 0) { jugador.y = 0; jugador.vy = 0; }
    
    if (jugador.y + jugador.h > CONFIG.WORLD_HEIGHT) {
      jugador.y = CONFIG.WORLD_HEIGHT - CONFIG.PLAYER_HEIGHT - 60;
      jugador.vy = 0;
      jugador.enSuelo = true;
    }

    resolverColisiones(jugador);
    actualizarCamara();

    const LIMITE_MUERTE_CAIDA = CONFIG.WORLD_HEIGHT + 100;
    if (jugador.y > LIMITE_MUERTE_CAIDA) {
      intentarPerderVida(0.5);
      reaparecerJugador();
    }

    socket.emit('playerMovement', {
      x: Math.round(jugador.x),
      y: Math.round(jugador.y),
      vx: jugador.vx,
      vy: jugador.vy
    });
  }

  function actualizarCamara() {
    const objetivoX = jugador.x + jugador.w / 2 - canvas.width / 2;
    const maxOffsetH = Math.max(0, CONFIG.WORLD_WIDTH - canvas.width);
    camara.x = Math.min(Math.max(objetivoX, 0), maxOffsetH);

    const objetivoY = jugador.y + jugador.h / 2 - canvas.height / 2;
    const maxOffsetV = Math.max(0, CONFIG.WORLD_HEIGHT - canvas.height);
    camara.y = Math.min(Math.max(objetivoY, 0), maxOffsetV);
  }

  function intentarPerderVida(cantidad = 1) {
    const ahora = Date.now();
    if (jugador.invulnerableHasta > ahora) return;
    jugador.vidas = Math.max(0, Math.round((jugador.vidas - cantidad) * 2) / 2);
    jugador.invulnerableHasta = ahora + 1500;
    jugador.parpadeoHasta = ahora + 1200;

    try {
      if (bufferDaño && audioCtx && gananciaDaño) {
        const fuente = audioCtx.createBufferSource();
        fuente.buffer = bufferDaño;
        fuente.connect(gananciaDaño);
        fuente.start(0);
      }
    } catch (e) { }

    if (jugador.vidas <= 0) {
      juegoTerminado = true;
      const overlay = document.getElementById('gameOverOverlay');
      if (overlay) overlay.style.display = 'flex';
    }
  }

  function reaparecerJugador() {
    jugador.x = canvas.width / 2 - jugador.w / 2;
    jugador.y = CONFIG.WORLD_HEIGHT - jugador.h - 60;
    jugador.vx = 0;
    jugador.vy = 0;
  }

  function dibujarFondo() {
    const maxOffsetV = Math.max(0, CONFIG.WORLD_HEIGHT - canvas.height);
    const progreso = maxOffsetV === 0 ? 0 : camara.y / maxOffsetV;
    const colorCapa = obtenerColorDeParadas(BACKGROUND_SETTINGS?.COLOR_STOPS, progreso);
    const alfaCapa = BACKGROUND_SETTINGS?.OVERLAY_ALPHA ?? 0.35;

    if (patronFondo && canvasFondo) {
      ctx.save();
      const anchoAzulejo = canvasFondo.width;
      const altoAzulejo = canvasFondo.height;
      const offsetX = -(camara.x % anchoAzulejo);
      const offsetY = -(camara.y % altoAzulejo);
      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = patronFondo;
      ctx.fillRect(-anchoAzulejo, -altoAzulejo, canvas.width + anchoAzulejo * 2, canvas.height + altoAzulejo * 2);
      ctx.restore();

      if (alfaCapa > 0) {
        ctx.save();
        ctx.globalAlpha = alfaCapa;
        ctx.fillStyle = colorCapa;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      return;
    }

    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradiente.addColorStop(0, CONFIG.BACKGROUND.SKY_TOP);
    gradiente.addColorStop(1, CONFIG.BACKGROUND.SKY_BOTTOM);
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dibujarFondo();

    ctx.save();
    ctx.translate(-camara.x, -camara.y);

    ctx.fillStyle = CONFIG.PLATFORM_COLOR;
    for (const plat of PLATFORMS) {
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    }

    dibujarEnemigos();
    dibujarEstrellas();

    for (const id in otrosJugadores) {
      const p = otrosJugadores[id];
      ctx.fillStyle = p.color || CONFIG.OTHER_PLAYER_COLOR;
      if (recursosCargados) {
        ctx.drawImage(jugadorSprite, p.x, p.y, jugador.w, jugador.h);
      } else {
        ctx.fillRect(p.x, p.y, jugador.w, jugador.h);
      }
    }

    if (recursosCargados) {
      ctx.drawImage(jugadorSprite, jugador.x, jugador.y, jugador.w, jugador.h);
    } else {
      ctx.fillStyle = jugador.color;
      ctx.fillRect(jugador.x, jugador.y, jugador.w, jugador.h);
    }

    ctx.restore();
    dibujarHUDVidas();
    dibujarHUDEstrellas();
  }

  function dibujarHUDVidas() {
    const tamanoCorazon = 18;
    const margen = 8;
    ctx.save();
    ctx.font = `${tamanoCorazon}px sans-serif`;
    for (let i = 0; i < 5; i++) {
      const x = margen + i * (tamanoCorazon + 6);
      const y = margen + tamanoCorazon;
      ctx.fillStyle = '#555';
      ctx.fillText('♡', x, y);
      const valor = Math.max(0, jugador.vidas - i);
      if (valor >= 1) {
        ctx.fillStyle = '#e63946';
        ctx.fillText('❤', x, y);
      } else if (valor >= 0.5) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y - tamanoCorazon, Math.floor(tamanoCorazon / 2), tamanoCorazon + 4);
        ctx.clip();
        ctx.fillStyle = '#e63946';
        ctx.fillText('❤', x, y);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function dibujarHUDEstrellas() {
    const total = Array.isArray(STARS) ? STARS.length : 10;
    const tamano = 22;
    const margen = 10;
    const inicioX = Math.round((canvas.width - (total * (tamano + 6) - 6)) / 2);
    const y = margen + tamano;
    ctx.save();
    for (let i = 0; i < total; i++) {
      const x = inicioX + i * (tamano + 6);
      ctx.fillStyle = '#333';
      ctx.fillRect(x - 2, y - tamano, tamano + 4, tamano + 4);
      const s = STARS[i];
      if (s && s.collected) {
        if (estrellaCargada && imagenEstrella) {
          ctx.drawImage(imagenEstrella, x, y - tamano + 2, tamano, tamano);
        } else {
          ctx.fillStyle = '#ffd166';
          ctx.fillText('★', x, y);
        }
      } else {
        ctx.strokeStyle = '#777';
        ctx.strokeRect(x, y - tamano + 2, tamano, tamano);
      }
    }
    ctx.restore();
  }

  function dibujarEnemigos() {
    if (!Array.isArray(SLIMES)) return;
    for (const s of SLIMES) {
      if (enemigoCargado && imagenEnemigo) {
        ctx.drawImage(imagenEnemigo, s.x, s.y, s.w, s.h);
      } else {
        ctx.fillStyle = '#29a745';
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
    }
  }

  function bucle() {
    if (!juegoTerminado) {
      actualizarPlataformas();
      actualizarEnemigos();
      manejarEntrada();
      actualizarFisicas();
      comprobarColisionesEnemigos();
      comprobarColisionesEstrellas();
    }
    dibujar();
    requestAnimationFrame(bucle);
  }

  function actualizarPlataformas() {
    for (const plat of PLATFORMS) {
      if (!plat.moving) continue;
      const mult = (typeof CONFIG.PLATFORM_SPEED_MULTIPLIER === 'number') ? CONFIG.PLATFORM_SPEED_MULTIPLIER : 1;
      plat.x += plat.vx * mult;
      if (plat.x < plat.minX || plat.x > plat.maxX) plat.vx = -plat.vx;
    }
  }

  function actualizarEnemigos() {
    if (!Array.isArray(SLIMES)) return;
    const mult = (typeof CONFIG.SLIME_SPEED_MULTIPLIER === 'number') ? CONFIG.SLIME_SPEED_MULTIPLIER : 1;
    for (const s of SLIMES) {
      s.x += (s.vx || 0) * mult;
      if (s.x < s.minX || s.x > s.maxX) s.vx = -(s.vx || 0);
    }
  }

  function comprobarColisionesEnemigos() {
    if (!Array.isArray(SLIMES)) return;
    for (const s of SLIMES) {
      const colisionado = jugador.x < s.x + s.w && jugador.x + jugador.w > s.x && jugador.y < s.y + s.h && jugador.y + jugador.h > s.y;
      if (!colisionado) continue;
      const ahora = Date.now();
      if (jugador.invulnerableHasta > ahora) continue;
      intentarPerderVida(1);
      jugador.vy = CONFIG.JUMP_POWER / 1.2;
      jugador.x += (jugador.x + jugador.w / 2) < (s.x + s.w / 2) ? -6 : 6;
    }
  }

  function comprobarColisionesEstrellas() {
    if (!Array.isArray(STARS)) return;
    for (const s of STARS) {
      if (s.collected) continue;
      const colisionado = jugador.x < s.x + s.w && jugador.x + jugador.w > s.x && jugador.y < s.y + s.h && jugador.y + jugador.h > s.y;
      if (!colisionado) continue;
      s.collected = true;
      try {
        if (bufferEstrella && audioCtx && gananciaEstrella) {
          const fuente = audioCtx.createBufferSource();
          fuente.buffer = bufferEstrella;
          fuente.connect(gananciaEstrella);
          fuente.start(0);
        }
      } catch (e) { }
    }
    if (STARS.every(s => s.collected)) {
      juegoTerminado = true;
      const overlay = document.getElementById('victoryOverlay');
      if (overlay) overlay.style.display = 'flex';
    }
  }

  function dibujarEstrellas() {
    if (!Array.isArray(STARS)) return;
    for (const s of STARS) {
      if (s.collected) continue;
      if (estrellaCargada && imagenEstrella) {
        ctx.drawImage(imagenEstrella, s.x, s.y, s.w, s.h);
      } else {
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
    }
  }

  // --- Eventos de Socket.io ---

  socket.on('currentPlayers', (usuarios) => {
    for (const id in usuarios) {
      if (id === socket.id) {
        jugador.x = usuarios[id].x;
        jugador.y = usuarios[id].y;
        jugador.color = usuarios[id].color || jugador.color;
        jugador.vidas = usuarios[id].lives || 5;
      } else {
        otrosJugadores[id] = usuarios[id];
        otrosJugadores[id].vidas = usuarios[id].lives || 5;
      }
    }
  });

  socket.on('newPlayer', (p) => {
    otrosJugadores[p.id] = p;
    otrosJugadores[p.id].vidas = p.lives || 5;
  });

  socket.on('playerMoved', (p) => {
    if (p.id !== socket.id) {
      otrosJugadores[p.id] = p;
      otrosJugadores[p.id].vidas = p.lives || otrosJugadores[p.id].lives || 5;
    }
  });

  socket.on('playerDisconnected', (id) => {
    delete otrosJugadores[id];
  });

  async function iniciar() {
    await cargarRecursos();
    bucle();
  }

  function aplicarSeleccionYEmpezar(seleccion) {
    if (!seleccion) seleccion = { type: 'color', color: CONFIG.PLAYER_COLOR };
    const escala = CONFIG.PLAYER_SCALE || 1;
    jugador.w = Math.round(CONFIG.PLAYER_WIDTH * escala);
    jugador.h = Math.round(CONFIG.PLAYER_HEIGHT * escala);

    if (seleccion.type === 'sprite') {
      ASSETS.PLAYER = seleccion.src;
      iniciar();
    } else {
      ASSETS.PLAYER = null;
      recursosCargados = false;
      jugador.color = seleccion.color || CONFIG.PLAYER_COLOR;
      iniciar();
    }
  }

  window.startJumpverse = function (seleccion) {
    aplicarSeleccionYEmpezar(seleccion);
  };

  function inicializarInterfazMenu() {
    const botonJugar = document.getElementById('playBtn');
    if (!botonJugar) {
      aplicarSeleccionYEmpezar({ type: 'color', color: CONFIG.PLAYER_COLOR });
    } else {
      const instrucciones = document.getElementById('howToPlayOverlay');
      const menu = document.getElementById('menuOverlay');
      if (instrucciones && menu) {
        instrucciones.style.display = 'flex';
        menu.style.display = 'none';
        const botonEmpezar = document.getElementById('startGameBtn');
        if (botonEmpezar) {
          botonEmpezar.addEventListener('click', () => {
            instrucciones.style.display = 'none';
            menu.style.display = 'flex';
          });
        }
      }

      const opciones = Array.from(document.querySelectorAll('.choice'));
      let actual = opciones[0] || null;
      if (actual) actual.classList.add('selected');

      opciones.forEach(op => op.addEventListener('click', () => {
        if (actual) actual.classList.remove('selected');
        actual = op;
        op.classList.add('selected');
      }));

      botonJugar.addEventListener('click', async () => {
        try { await crearContextoAudioSiEsNecesario(); } catch (e) { }
        const tipo = actual ? actual.getAttribute('data-type') : 'color';
        let seleccion;
        if (tipo === 'sprite') {
          seleccion = { type: 'sprite', src: actual.getAttribute('data-src') };
        } else {
          seleccion = { type: 'color', color: actual.getAttribute('data-color') };
        }
        if (menu) menu.style.display = 'none';
        const transicion = document.getElementById('transitionOverlay');
        if (transicion) {
          transicion.style.display = 'flex';
          setTimeout(() => {
            transicion.style.display = 'none';
            aplicarSeleccionYEmpezar(seleccion);
          }, 2500);
        } else {
          aplicarSeleccionYEmpezar(seleccion);
        }
      });
    }

    const botonReiniciar = document.getElementById('restartBtn');
    if (botonReiniciar) botonReiniciar.addEventListener('click', () => {
      const overlay = document.getElementById('gameOverOverlay');
      if (overlay) overlay.style.display = 'none';
      jugador.vidas = 5;
      jugador.invulnerableHasta = 0;
      reaparecerJugador();
      for (const s of STARS) s.collected = false;
      juegoTerminado = false;
    });

    const botonReiniciarVictoria = document.getElementById('restartWinBtn');
    if (botonReiniciarVictoria) botonReiniciarVictoria.addEventListener('click', () => {
      const overlay = document.getElementById('victoryOverlay');
      if (overlay) overlay.style.display = 'none';
      jugador.vidas = 5;
      reaparecerJugador();
      for (const s of STARS) s.collected = false;
      juegoTerminado = false;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarInterfazMenu);
  } else {
    inicializarInterfazMenu();
  }
}