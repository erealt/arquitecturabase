// --- VARIABLES GLOBALES ---
var socket, canvas, ctx, camara, teclas = {}, otrosJugadores = {}, jugador;

// Estado de Recursos
var jugadorSprite = new Image(), imagenFondo, patronFondo, canvasFondo, recursosCargados = false;
var imagenEnemigo, enemigoCargado = false, imagenEstrella, estrellaCargada = false;

// Audio Centralizado
var audioCtx = null, sonidos = {};
var juegoTerminado = false;

function StartGameManager(codigo, jugadoresIniciales, miEmail) {
  socket = ws.socket;
  canvas = document.getElementById('game');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  camara = { x: 0, y: Math.max(0, CONFIG.WORLD_HEIGHT - canvas.height) };

  window.onkeydown = e => teclas[e.key] = true;
  window.onkeyup = e => teclas[e.key] = false;

  jugador = {
    x: canvas.width / 2 - CONFIG.PLAYER_WIDTH / 2,
    y: CONFIG.WORLD_HEIGHT - CONFIG.PLAYER_HEIGHT - 60,
    w: CONFIG.PLAYER_WIDTH, h: CONFIG.PLAYER_HEIGHT,
    vx: 0, vy: 0, velocidad: CONFIG.PLAYER_SPEED,
    color: CONFIG.PLAYER_COLOR, enSuelo: false, vidas: 5, invulnerableHasta: 0
  };

  // Estados base para permitir reinicios consistentes
  const plataformasIniciales = PLATFORMS.map(p => ({
    x: p.x, y: p.y, w: p.w, h: p.h,
    moving: !!p.moving,
    minX: p.minX, maxX: p.maxX,
    vx: p.vx || 0
  }));
  const slimesIniciales = Array.isArray(SLIMES) ? SLIMES.map(s => ({
    x: s.x, y: s.y, w: s.w, h: s.h,
    minX: s.minX, maxX: s.maxX,
    vx: s.vx || 0
  })) : [];
  const estrellasIniciales = Array.isArray(STARS) ? STARS.map(s => ({
    x: s.x, y: s.y, w: s.w, h: s.h
  })) : [];

  function restaurarEstrellas() {
    if (!Array.isArray(STARS)) return;
    STARS.forEach((star, idx) => {
      star.collected = false;
      const base = estrellasIniciales[idx];
      if (base) {
        star.x = base.x;
        star.y = base.y;
        star.w = base.w;
        star.h = base.h;
      }
    });
  }

  function verificarVictoria() {
    if (juegoTerminado || !Array.isArray(STARS) || STARS.length === 0) return;
    if (STARS.every(s => s.collected)) {
      juegoTerminado = true;
      const overlay = document.getElementById('victoryOverlay');
      if (overlay) overlay.style.display = 'flex';
    }
  }

  // --- CARGA DE RECURSOS ---
  async function cargarRecursos() {
    const cargarImg = (r) => new Promise(res => {
      if (!r) return res(null);
      const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = r;
    });

    const [imgJ, imgF, imgE, imgS] = await Promise.all([
      cargarImg(ASSETS.PLAYER), cargarImg(ASSETS.BACKGROUND),
      cargarImg(ASSETS.SLIME), cargarImg(ASSETS.STAR)
    ]);

    if (imgJ) { jugadorSprite = imgJ; recursosCargados = true; }
    if (imgE) { imagenEnemigo = imgE; enemigoCargado = true; }
    if (imgS) { imagenEstrella = imgS; estrellaCargada = true; }
    if (imgF) {
      const esc = BACKGROUND_SETTINGS?.SCALE || 1;
      canvasFondo = document.createElement('canvas');
      canvasFondo.width = imgF.width * esc; canvasFondo.height = imgF.height * esc;
      canvasFondo.getContext('2d').drawImage(imgF, 0, 0, canvasFondo.width, canvasFondo.height);
      patronFondo = ctx.createPattern(canvasFondo, 'repeat');
    }

    await Promise.all([
      prepararSonido('salto', ASSETS.JUMP),
      prepararSonido('estrella', ASSETS.STAR_SOUND),
      prepararSonido('daño', ASSETS.DAMAGE)
    ]);
  }

  async function prepararSonido(nombre, url) {
    if (!url) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const res = await fetch(url);
      const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
      const gain = audioCtx.createGain();
      gain.gain.value = 0.8; gain.connect(audioCtx.destination);
      sonidos[nombre] = { buffer, gain };
    } catch (e) { console.warn("Audio error:", url); }
  }

  function sonar(nombre) {
    if (sonidos[nombre] && audioCtx) {
      const f = audioCtx.createBufferSource();
      f.buffer = sonidos[nombre].buffer;
      f.connect(sonidos[nombre].gain); f.start(0);
    }
  }

  // --- DETECCIÓN DE COLISIONES ---
  function comprobarColisionesEnemigos() {
    if (!Array.isArray(SLIMES)) return;
    SLIMES.forEach(s => {
      if (jugador.x < s.x + s.w && jugador.x + jugador.w > s.x && jugador.y < s.y + s.h && jugador.y + jugador.h > s.y) {
        if (Date.now() > jugador.invulnerableHasta) {
          jugador.vidas--;
          sonar('daño');
          jugador.invulnerableHasta = Date.now() + 1500;
          if (jugador.vidas <= 0) {
            juegoTerminado = true;
            document.getElementById('gameOverOverlay').style.display = 'flex';
          }
        }
      }
    });
  }

  function comprobarColisionesEstrellas() {
    if (!Array.isArray(STARS)) return;
    STARS.forEach((s, idx) => {
      if (!s.collected && jugador.x < s.x + s.w && jugador.x + jugador.w > s.x && jugador.y < s.y + s.h && jugador.y + jugador.h > s.y) {
        s.collected = true;
        sonar('estrella');
        if (socket) socket.emit('starCollected', { index: idx });
      }
    });
    verificarVictoria();
  }

  // --- MOTOR DE FÍSICAS ---
  function actualizarFisicas() {
    jugador.prevX = jugador.x; jugador.prevY = jugador.y;
    jugador.vy += CONFIG.GRAVITY;
    jugador.x += jugador.vx; jugador.y += jugador.vy;

    if (jugador.x < 0) jugador.x = 0;
    if (jugador.x + jugador.w > CONFIG.WORLD_WIDTH) jugador.x = CONFIG.WORLD_WIDTH - jugador.w;

    if (jugador.y + jugador.h > CONFIG.WORLD_HEIGHT) {
      jugador.y = CONFIG.WORLD_HEIGHT - jugador.h;
      jugador.vy = 0; jugador.enSuelo = true;
    }

    resolverColisiones(jugador);

    const maxCamX = Math.max(0, CONFIG.WORLD_WIDTH - canvas.width);
    const maxCamY = Math.max(0, CONFIG.WORLD_HEIGHT - canvas.height);
    camara.x = Math.min(Math.max(jugador.x + jugador.w / 2 - canvas.width / 2, 0), maxCamX);
    camara.y = Math.min(Math.max(jugador.y + jugador.h / 2 - canvas.height / 2, 0), maxCamY);

    socket.emit('playerMovement', { x: Math.round(jugador.x), y: Math.round(jugador.y), vx: jugador.vx, vy: jugador.vy });
  }

  function resolverColisiones(p) {
    p.enSuelo = false;
    for (const plat of PLATFORMS) {
      if (p.x < plat.x + plat.w && p.x + p.w > plat.x && p.y < plat.y + plat.h && p.y + p.h > plat.y) {
        const baseP = p.prevY + p.h;
        if (baseP <= plat.y) { p.y = plat.y - p.h; p.vy = 0; p.enSuelo = true; }
        else if (p.prevY >= plat.y + plat.h) { p.y = plat.y + plat.h; p.vy = 0; }
        else if (p.prevX + p.w <= plat.x) { p.x = plat.x - p.w - 0.1; }
        else { p.x = plat.x + plat.w + 0.1; }
      }
    }
  }

  // --- DIBUJO ---
  function dibujarHUDEstrellas() {
    const total = Array.isArray(STARS) ? STARS.length : 10;
    const tamano = 22, margen = 10;
    const inicioX = Math.round((canvas.width - (total * (tamano + 6) - 6)) / 2);
    const y = margen + tamano;

    ctx.save();
    for (let i = 0; i < total; i++) {
      const x = inicioX + i * (tamano + 6);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x - 2, y - tamano, tamano + 4, tamano + 4);
      const s = STARS[i];
      if (s && s.collected) {
        if (estrellaCargada) ctx.drawImage(imagenEstrella, x, y - tamano + 2, tamano, tamano);
        else { ctx.fillStyle = '#ffd166'; ctx.font = "20px Arial"; ctx.fillText('★', x, y); }
      } else {
        ctx.strokeStyle = '#777';
        ctx.strokeRect(x, y - tamano + 2, tamano, tamano);
      }
    }
    ctx.restore();
  }

  function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (patronFondo) {
      ctx.save();
      // Calculamos el desplazamiento exacto del patrón respecto a la cámara
      // para que la textura parezca fija en el mundo mientras te mueves
      let offsetX = -(camara.x % canvasFondo.width);
      let offsetY = -(camara.y % canvasFondo.height);

      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = patronFondo;

      // Dibujamos un rectángulo ligeramente más grande que el canvas
      // para evitar bordes vacíos durante el movimiento rápido
      ctx.fillRect(-canvasFondo.width, -canvasFondo.height,
        canvas.width + canvasFondo.width * 2,
        canvas.height + canvasFondo.height * 2);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(-camara.x, -camara.y);

    PLATFORMS.forEach(pl => { ctx.fillStyle = CONFIG.PLATFORM_COLOR; ctx.fillRect(pl.x, pl.y, pl.w, pl.h); });

    SLIMES?.forEach(s => {
      if (enemigoCargado) ctx.drawImage(imagenEnemigo, s.x, s.y, s.w, s.h);
      else { ctx.fillStyle = 'green'; ctx.fillRect(s.x, s.y, s.w, s.h); }
    });

    STARS?.forEach(s => {
      if (!s.collected) {
        if (estrellaCargada) ctx.drawImage(imagenEstrella, s.x, s.y, s.w, s.h);
        else { ctx.fillStyle = 'gold'; ctx.fillRect(s.x, s.y, s.w, s.h); }
      }
    });

    // Otros Jugadores
    Object.values(otrosJugadores).forEach(p => {
      // Intentamos dibujar la imagen de la skin
      if (p.spriteImg && p.spriteImg.complete && p.spriteImg.width > 0) {
        ctx.drawImage(p.spriteImg, p.x, p.y, jugador.w, jugador.h);
      }
      // Si la imagen aún no carga o falló, pero tenemos un color
      else if (p.skin && p.skin.startsWith('#')) {
        ctx.fillStyle = p.skin;
        ctx.fillRect(p.x, p.y, jugador.w, jugador.h);
      }
      // Si no hay nada, un color por defecto para no perderlo de vista
      else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(p.x, p.y, jugador.w, jugador.h);
      }
    });

    // Jugador Local
    if (!(Date.now() < jugador.invulnerableHasta && Math.floor(Date.now() / 100) % 2 === 0)) {
      if (recursosCargados) ctx.drawImage(jugadorSprite, jugador.x, jugador.y, jugador.w, jugador.h);
      else { ctx.fillStyle = jugador.color; ctx.fillRect(jugador.x, jugador.y, jugador.w, jugador.h); }
    }

    ctx.restore();
    ctx.fillStyle = "white"; ctx.font = "20px Arial";
    ctx.fillText(`❤️ ${Math.ceil(jugador.vidas)}`, 20, 35);
    dibujarHUDEstrellas();
  }

  function bucle() {
    if (!juegoTerminado) {
      PLATFORMS.forEach(plat => {
        if (plat.moving) {
          const mult = CONFIG.PLATFORM_SPEED_MULTIPLIER || 1;
          plat.x += plat.vx * mult;
          if (plat.x < plat.minX || plat.x > plat.maxX) plat.vx = -plat.vx;
        }
      });

      if (Array.isArray(SLIMES)) {
        const mult = CONFIG.SLIME_SPEED_MULTIPLIER || 1;
        SLIMES.forEach(s => {
          s.x += (s.vx || 0) * mult;
          if (s.x < s.minX || s.x > s.maxX) s.vx = -(s.vx || 0);
        });
      }

      jugador.vx = teclas['a'] || teclas['ArrowLeft'] ? -jugador.velocidad : (teclas['d'] || teclas['ArrowRight'] ? jugador.velocidad : 0);
      if ((teclas['w'] || teclas['ArrowUp'] || teclas[' ']) && jugador.enSuelo) {
        jugador.vy = CONFIG.JUMP_POWER; jugador.enSuelo = false; sonar('salto');
      }
      actualizarFisicas();
      comprobarColisionesEnemigos();
      comprobarColisionesEstrellas();
    }
    dibujar();
    requestAnimationFrame(bucle);
  }
  function cargarSkinOtroJugador(p) {
    if (p.skin && !p.skin.startsWith('#')) {
        let img = new Image();
        let ruta = p.skin;
        
      // Construimos una ruta válida sin romper los paths absolutos servidos desde Express
      let srcFinal = ruta;
      if (!/^https?:\/\//i.test(ruta)) {
        if (ruta.startsWith('/')) {
          srcFinal = ruta;
        } else if (ruta.startsWith('game/')) {
          srcFinal = '/' + ruta.replace(/^\/+/, '');
        } else if (ruta.startsWith('./') || ruta.startsWith('../')) {
          srcFinal = ruta;
        } else {
          srcFinal = '/assets/' + ruta.replace(/^\/+/, '');
        }
      }
        
        img.onload = () => {
            if (otrosJugadores[p.id]) {
                otrosJugadores[p.id].spriteImg = img; // Solo se asigna cuando ya cargó
            }
        };
        img.src = srcFinal;
    }
}

  function reiniciarJuego() {
    if (socket) socket.emit('resetStars');
    const overlayGameOver = document.getElementById('gameOverOverlay');
    const overlayVictory = document.getElementById('victoryOverlay');
    if (overlayGameOver) overlayGameOver.style.display = 'none';
    if (overlayVictory) overlayVictory.style.display = 'none';

    juegoTerminado = false;
    jugador.x = canvas.width / 2 - CONFIG.PLAYER_WIDTH / 2;
    jugador.y = CONFIG.WORLD_HEIGHT - CONFIG.PLAYER_HEIGHT - 60;
    jugador.vx = 0; jugador.vy = 0;
    jugador.enSuelo = false; jugador.invulnerableHasta = 0;
    jugador.vidas = 5;

    camara.x = 0;
    camara.y = Math.max(0, CONFIG.WORLD_HEIGHT - canvas.height);

    Object.keys(teclas).forEach(k => teclas[k] = false);

    PLATFORMS.forEach((plat, idx) => {
      const base = plataformasIniciales[idx];
      if (!base) return;
      plat.x = base.x;
      plat.y = base.y;
      plat.w = base.w;
      plat.h = base.h;
      plat.moving = base.moving;
      plat.minX = base.minX;
      plat.maxX = base.maxX;
      plat.vx = base.vx;
    });

    if (Array.isArray(SLIMES)) {
      SLIMES.forEach((slime, idx) => {
        const base = slimesIniciales[idx];
        if (!base) return;
        slime.x = base.x;
        slime.y = base.y;
        slime.w = base.w;
        slime.h = base.h;
        slime.minX = base.minX;
        slime.maxX = base.maxX;
        slime.vx = base.vx;
      });
    }

    restaurarEstrellas();
  }

  async function iniciar() {
    await cargarRecursos();
    bucle();
  }

  // --- EVENTOS DE RED ---
  socket.on('currentPlayers', (usuarios) => {
    for (const id in usuarios) {
      if (id !== socket.id) {
        otrosJugadores[id] = usuarios[id];
        // USAMOS la función que tiene el onload y la ruta corregida
        cargarSkinOtroJugador(usuarios[id]);
      }
    }
  });

  socket.on('newPlayer', (p) => {
    otrosJugadores[p.id] = p;
    // USAMOS la función que tiene el onload y la ruta corregida
    cargarSkinOtroJugador(p);
  });

  socket.on('playerMoved', (p) => {
    if (p.id !== socket.id) {
      if (otrosJugadores[p.id]) {
        // Solo actualizamos posición y físicas, mantenemos la imagen (spriteImg)
        otrosJugadores[p.id].x = p.x;
        otrosJugadores[p.id].y = p.y;
        otrosJugadores[p.id].vx = p.vx;
        otrosJugadores[p.id].vy = p.vy;
        // Si el servidor mandó una skin nueva, podrías actualizarla aquí también
      } else {
        // Si por alguna razón no existe (ej. entró tarde), lo creamos
        otrosJugadores[p.id] = p;
        cargarSkinOtroJugador(p);
      }
    }
  }); socket.on('playerDisconnected', (id) => { delete otrosJugadores[id]; });

  socket.on('currentStars', (lista) => {
    if (!Array.isArray(lista) || !Array.isArray(STARS)) return;
    lista.forEach(idx => {
      const normalized = Number(idx);
      if (Number.isInteger(normalized) && STARS[normalized]) {
        STARS[normalized].collected = true;
      }
    });
    verificarVictoria();
  });

  socket.on('starCollected', (payload) => {
    if (!Array.isArray(STARS)) return;
    const idx = Number(payload?.index);
    if (Number.isInteger(idx) && STARS[idx] && !STARS[idx].collected) {
      STARS[idx].collected = true;
      verificarVictoria();
    }
  });

  socket.on('resetStars', () => {
    restaurarEstrellas();
    juegoTerminado = false;
    const overlayGameOver = document.getElementById('gameOverOverlay');
    const overlayVictory = document.getElementById('victoryOverlay');
    if (overlayGameOver) overlayGameOver.style.display = 'none';
    if (overlayVictory) overlayVictory.style.display = 'none';
  });

  // --- GESTIÓN DE INTERFAZ ---
  const btnTutorial = document.getElementById('startGameBtn');
  const overlayTutorial = document.getElementById('howToPlayOverlay');
  const overlayMenu = document.getElementById('menuOverlay');
  const restartBtn = document.getElementById('restartBtn');
  const restartWinBtn = document.getElementById('restartWinBtn');

  if (restartBtn) restartBtn.onclick = reiniciarJuego;
  if (restartWinBtn) restartWinBtn.onclick = reiniciarJuego;

  if (btnTutorial) {
    btnTutorial.onclick = () => {
      overlayTutorial.style.display = 'none';
      overlayMenu.style.display = 'flex';
    };
  }

  document.querySelectorAll('.choice').forEach(c => {
    c.onclick = () => {
      document.querySelectorAll('.choice').forEach(el => el.classList.remove('selected'));
      c.classList.add('selected');
    };
  });

  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.onclick = async () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const sel = document.querySelector('.choice.selected');
      let seleccionData = null;

      if (sel) {
        if (sel.dataset.type === 'sprite') {
          ASSETS.PLAYER = sel.dataset.src;
          seleccionData = sel.dataset.src;
        } else {
          jugador.color = sel.dataset.color;
          seleccionData = sel.dataset.color;
          ASSETS.PLAYER = null;
        }
      }

      socket.emit('playerJoinsGame', {
        codigo: codigo,
        email: miEmail,
        skin: seleccionData
      });

      overlayMenu.style.display = 'none';
      iniciar();
    };
  } else {
    iniciar();
  }
}