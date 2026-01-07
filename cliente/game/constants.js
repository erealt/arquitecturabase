// client/constants.js

const CONFIG = {
  // Configuración de la física
  GRAVITY: 0.35,
  JUMP_POWER: -8.8,
  PLAYER_SPEED: 2.2,
  WORLD_WIDTH: 1280,
  WORLD_HEIGHT: 2400,
  BACKGROUND: {
    SKY_TOP: '#1a1a2e',
    SKY_BOTTOM: '#0f3460',
    PARALLAX_COLOR: '#53354a'
  },
  PLAYER_WIDTH: 32,
  PLAYER_HEIGHT: 32,
  PLAYER_SCALE: 1.4,
  PLAYER_COLOR: '#ff0066',

  // Colores
  PLATFORM_COLOR: '#6b3e00',
  OTHER_PLAYER_COLOR: '#00aaff'
};

// Multiplier to globally speed up moving platforms (1 = original speed)
CONFIG.PLATFORM_SPEED_MULTIPLIER = 1.4;


const ASSETS = {
  PLAYER: '/assets/character_pink.png',
  BACKGROUND: '/assets/fondo.jpg'
};

ASSETS.JUMP = '/assets/salto.ogg';

ASSETS.SLIME = '/assets/slimeBlock.png';

ASSETS.STAR = '/assets/star.svg';

ASSETS.STAR_SOUND = '/assets/estrella_sonido.ogg';

ASSETS.DAMAGE = '/assets/daño.ogg';


const BACKGROUND_SETTINGS = {
  SCALE: 2.2,
  OVERLAY_ALPHA: 0.3,
  COLOR_STOPS: [
    { stop: 0, color: '#1a1a2e' },
    { stop: 0.4, color: '#3a1f5d' },
    { stop: 0.7, color: '#2b4c7e' },
    { stop: 1, color: '#f25f5c' }
  ]
};

// Plataformas (x, y, w, h)
// Generator that ensures each next platform is reachable given current physics.
const PLATFORMS = (() => {
  const platforms = [
    { x: 0, y: CONFIG.WORLD_HEIGHT - 60, w: CONFIG.WORLD_WIDTH, h: 60 }
  ];

  const STEP_COUNT = 22; // number of small platforms above the ground
  // Make vertical gaps larger to increase difficulty but keep under max jump (~110px)
  const VERTICAL_GAP = 96; // base px between platforms
  const MAX_HORZ_SHIFT = 110; // max horizontal shift per jump (based on speed*airtime ~110)
  // Narrower platforms for challenge
  const MIN_WIDTH = 140;
  const MAX_WIDTH = 220;

  // start near center
  let prevX = (CONFIG.WORLD_WIDTH - 260) / 2;
  let currentY = CONFIG.WORLD_HEIGHT - 60;

  for (let i = 0; i < STEP_COUNT; i++) {
    // Occasionally make a slightly larger vertical gap for variety
    const extraGap = (i % 5 === 0) ? 8 : 0;
    currentY -= (VERTICAL_GAP + extraGap);

    // alternate left-right shifts but limit them to MAX_HORZ_SHIFT
    const dir = i % 2 === 0 ? -1 : 1;
    // vary horizontal shift slightly per step to create tricky jumps
    const shift = Math.max(24, MAX_HORZ_SHIFT - (i % 4) * 8); // remain <= MAX_HORZ_SHIFT
    let newX = prevX + dir * shift;

    // vary widths, mostly narrow to increase precision required
    const width = Math.min(MAX_WIDTH, MIN_WIDTH + (i % 4) * 20);
    const safeMargin = 8;
    const minX = safeMargin;
    const maxX = CONFIG.WORLD_WIDTH - width - safeMargin;
    newX = Math.min(Math.max(newX, minX), maxX);

    // Occasionally make this platform a moving platform (but not the ground)
    const makeMoving = (i % 5 === 2); // roughly some platforms become moving
    if (makeMoving) {
      const range = 80 + (i % 3) * 30; // range of motion
      const minXMov = Math.max(minX, Math.round(newX - range));
      const maxXMov = Math.min(maxX, Math.round(newX + range));
      const vx = (i % 2 === 0) ? 0.6 : -0.6;
      platforms.push({ x: Math.round(newX), y: Math.round(currentY), w: width, h: 20, moving: true, minX: minXMov, maxX: maxXMov, vx });
    } else {
      platforms.push({ x: Math.round(newX), y: Math.round(currentY), w: width, h: 20 });
    }

    prevX = newX;
  }

  return platforms;
})();


const SLIMES = [
  // ZONA INICIAL (Suelo y primeras plataformas)
  { x: 120, y: CONFIG.WORLD_HEIGHT - 120, w: 28, h: 24, minX: 80, maxX: 360, vx: 0.8 },
  { x: 500, y: CONFIG.WORLD_HEIGHT - 350, w: 28, h: 24, minX: 400, maxX: 650, vx: 1.2 },

  // ZONA BAJA-MEDIA (Entre 1800 y 1400 px)
  { x: 200, y: CONFIG.WORLD_HEIGHT - 650, w: 28, h: 24, minX: 100, maxX: 400, vx: 0.9 },
  { x: 600, y: CONFIG.WORLD_HEIGHT - 900, w: 28, h: 24, minX: 450, maxX: 850, vx: -1.0 },

  // ZONA MEDIA (Corazón del nivel, 1200 px)
  { x: 300, y: CONFIG.WORLD_HEIGHT - 1200, w: 28, h: 24, minX: 150, maxX: 500, vx: 1.5 },
  { x: 100, y: CONFIG.WORLD_HEIGHT - 1450, w: 28, h: 24, minX: 50, maxX: 350, vx: 0.8 },

  // ZONA ALTA (Cerca de las nubes)
  { x: 520, y: CONFIG.WORLD_HEIGHT - 1700, w: 28, h: 24, minX: 400, maxX: 700, vx: -0.7 },
  { x: 200, y: CONFIG.WORLD_HEIGHT - 1950, w: 28, h: 24, minX: 120, maxX: 340, vx: 0.6 },

  // ZONA FINAL (Cerca de la última estrella)
  { x: 400, y: CONFIG.WORLD_HEIGHT - 2200, w: 28, h: 24, minX: 200, maxX: 600, vx: 1.1 },
  { x: 650, y: CONFIG.WORLD_HEIGHT - 2350, w: 28, h: 24, minX: 500, maxX: 850, vx: -1.3 }
];

// Multiplier for slime patrol speed
CONFIG.SLIME_SPEED_MULTIPLIER = 1.0;

// Collectible stars: place 10, each above a platform for guaranteed accessibility
const STARS = (() => {
  const stars = [];
  const count = 10;
  // Use platforms (skip ground) to place stars above them
  const validPlatforms = PLATFORMS.filter(p => p.y < CONFIG.WORLD_HEIGHT - 80);
  for (let i = 0; i < count; i++) {
    const plat = validPlatforms[Math.floor(i * validPlatforms.length / count)];
    if (plat) {
      // Center star above platform, slightly above
      const x = Math.round(plat.x + plat.w / 2 - 10);
      const y = Math.round(plat.y - 28); // 28px above platform
      stars.push({ x, y, w: 20, h: 20, collected: false });
    }
  }
  return stars;
})();