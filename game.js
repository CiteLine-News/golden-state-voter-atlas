const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  sectorName: document.getElementById("sectorName"),
  objectiveText: document.getElementById("objectiveText"),
  highScoreText: document.getElementById("highScoreText"),
  healthFill: document.getElementById("healthFill"),
  shieldFill: document.getElementById("shieldFill"),
  heatFill: document.getElementById("heatFill"),
  driveFill: document.getElementById("driveFill"),
  healthText: document.getElementById("healthText"),
  shieldText: document.getElementById("shieldText"),
  heatText: document.getElementById("heatText"),
  driveText: document.getElementById("driveText"),
  scoreText: document.getElementById("scoreText"),
  comboText: document.getElementById("comboText"),
  missileText: document.getElementById("missileText"),
  killsText: document.getElementById("killsText"),
  messageText: document.getElementById("messageText"),
  bossPanel: document.getElementById("bossPanel"),
  bossName: document.getElementById("bossName"),
  bossFill: document.getElementById("bossFill"),
  bossHealthText: document.getElementById("bossHealthText"),
  overlay: document.getElementById("overlay"),
  overlayEyebrow: document.getElementById("overlayEyebrow"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText"),
  overlayFacts: document.getElementById("overlayFacts"),
  primaryButton: document.getElementById("primaryButton"),
  secondaryButton: document.getElementById("secondaryButton"),
  missileButton: document.getElementById("missileButton"),
  driveButton: document.getElementById("driveButton")
};

const STORAGE_KEY = "starlance-rift-command-high-score";
const TAU = Math.PI * 2;
const WORLD = {
  near: 12,
  far: 2600,
  focal: 1080
};
const PLAYER_RANGE = {
  x: 330,
  y: 210
};

const TITLE_THEME = {
  name: "Hangar Approach",
  brief: "Stand by for launch.",
  top: "#09111c",
  bottom: "#03060d",
  accent: "#8ff3ff",
  glow: "rgba(90, 182, 255, 0.18)"
};

const ENEMY_LIBRARY = {
  scout: {
    name: "Raptor Scout",
    hp: 26,
    radius: 24,
    points: 120,
    vz: -320,
    modelScale: 28,
    color: "#7ef7ff",
    glow: "#c7fdff",
    collision: 16,
    dropBias: 0.12
  },
  interceptor: {
    name: "Needle Interceptor",
    hp: 34,
    radius: 24,
    points: 190,
    vz: -390,
    modelScale: 25,
    color: "#ffc472",
    glow: "#ffe5aa",
    collision: 22,
    dropBias: 0.16
  },
  mine: {
    name: "Drift Mine",
    hp: 18,
    radius: 22,
    points: 150,
    vz: -230,
    modelScale: 22,
    color: "#ff8d7d",
    glow: "#ffc3a3",
    collision: 28,
    dropBias: 0.08
  },
  asteroid: {
    name: "Asteroid",
    hp: 42,
    radius: 30,
    points: 80,
    vz: -270,
    modelScale: 32,
    color: "#d6c3a0",
    glow: "#f2ddbc",
    collision: 18,
    dropBias: 0
  },
  turret: {
    name: "Siege Turret",
    hp: 88,
    radius: 35,
    points: 280,
    vz: -180,
    modelScale: 38,
    color: "#ff9867",
    glow: "#ffd1a7",
    collision: 28,
    dropBias: 0.18
  },
  bomber: {
    name: "Hammer Bomber",
    hp: 118,
    radius: 42,
    points: 420,
    vz: -180,
    modelScale: 48,
    color: "#ff7b84",
    glow: "#ffc0bb",
    collision: 36,
    dropBias: 0.28
  },
  bossHarrier: {
    name: "Harrier Dreadnought",
    hp: 1500,
    radius: 92,
    points: 4800,
    vz: 0,
    modelScale: 114,
    color: "#ff9a63",
    glow: "#ffe2ae",
    collision: 46,
    dropBias: 0.5,
    boss: true
  },
  bossLeviathan: {
    name: "Rift Leviathan",
    hp: 2400,
    radius: 124,
    points: 9200,
    vz: 0,
    modelScale: 146,
    color: "#ff738b",
    glow: "#ffd4db",
    collision: 60,
    dropBias: 0.55,
    boss: true
  }
};

const keys = Object.create(null);
const pressed = Object.create(null);
const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,
  nx: 0,
  ny: 0,
  fire: false,
  missileQueued: false,
  driveQueued: false,
  touchId: null
};

const game = {
  mode: "title",
  width: window.innerWidth,
  height: window.innerHeight,
  cx: window.innerWidth * 0.5,
  cy: window.innerHeight * 0.5,
  lastTime: 0,
  score: 0,
  highScore: loadHighScore(),
  kills: 0,
  sessionTime: 0,
  maxCombo: 1,
  distance: 0,
  shake: 0,
  shakeX: 0,
  shakeY: 0,
  flash: 0,
  stars: [],
  enemies: [],
  projectiles: [],
  particles: [],
  pickups: [],
  messages: [],
  sectors: [],
  sectorIndex: -1,
  sector: null,
  sectorTime: 0,
  intermission: 0,
  bossTarget: null,
  nextEnemyId: 1,
  audioEnabled: true,
  audioContext: null,
  lastLaserSound: 0,
  themePulse: 0
};

let player = createPlayer();

function createPlayer() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    roll: 0,
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    shieldDelay: 0,
    heat: 0,
    overheated: false,
    drive: 20,
    maxDrive: 100,
    overdrive: false,
    missiles: 8,
    maxMissiles: 12,
    cooldown: 0,
    missileCooldown: 0,
    reticleX: 0,
    reticleY: 0,
    aimDepth: 1500,
    combo: 1,
    comboTimer: 0,
    wingSwap: 1,
    lockTarget: null,
    damagePulse: 0
  };
}

function loadHighScore() {
  try {
    return Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function normalize3(x, y, z) {
  const length = Math.hypot(x, y, z) || 1;
  return {
    x: x / length,
    y: y / length,
    z: z / length
  };
}

function distanceSq3(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function formatNumber(value) {
  return Math.floor(value).toLocaleString("en-US");
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3
    ? clean.split("").map((part) => part + part).join("")
    : clean;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function colorWithAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function createEvent(time, action) {
  return { time, action, done: false };
}

function buildSectors() {
  return [
    {
      name: "Outer Perimeter",
      brief: "Break the patrol line before reinforcements converge.",
      top: "#0a1524",
      bottom: "#040810",
      accent: "#8ef4ff",
      glow: "rgba(76, 147, 255, 0.18)",
      events: [
        createEvent(0.6, () => spawnFormationLine("scout", 5, { y: -82, spacing: 128 })),
        createEvent(4.1, () => spawnVFormation("scout", 7, { y: 18, gapX: 122 })),
        createEvent(8.5, () => spawnSweep("interceptor", 4, { y: -44, side: -1 })),
        createEvent(12.2, () => spawnFormationLine("scout", 6, { y: 92, spacing: 112 })),
        createEvent(16.8, () => spawnSweep("interceptor", 5, { y: 48, side: 1 })),
        createEvent(20.8, () => {
          spawnFormationLine("bomber", 2, { y: -14, spacing: 250, z: 2200, gap: 120 });
          spawnFormationLine("scout", 4, { y: 112, spacing: 146, z: 1960, gap: 56 });
        })
      ]
    },
    {
      name: "Debris Graveyard",
      brief: "Thread the wreckage and clear the mine screen.",
      top: "#11111f",
      bottom: "#05040d",
      accent: "#9bd6ff",
      glow: "rgba(151, 95, 190, 0.16)",
      events: [
        createEvent(0.5, () => spawnAsteroidField(10, { spreadX: 620, spreadY: 260 })),
        createEvent(4.7, () => spawnMineWall(7, { gapIndex: 3, y: 30 })),
        createEvent(8.8, () => {
          spawnAsteroidField(8, { spreadX: 520, spreadY: 280, z: 2200, depth: 540 });
          spawnSweep("interceptor", 4, { y: -10, side: -1, z: 2100 });
        }),
        createEvent(13.1, () => spawnMineWall(8, { gapIndex: 1, y: -50, z: 2140 })),
        createEvent(17.8, () => {
          spawnFormationLine("bomber", 2, { y: -44, spacing: 260, z: 2300, gap: 140 });
          spawnAsteroidField(10, { spreadX: 680, spreadY: 220, z: 2350, depth: 760 });
        })
      ]
    },
    {
      name: "Siege Corridor",
      brief: "Punch through the fortified kill lane.",
      top: "#1b1214",
      bottom: "#080508",
      accent: "#ffb785",
      glow: "rgba(255, 128, 98, 0.16)",
      events: [
        createEvent(0.8, () => spawnTurretGate({ y: 0 })),
        createEvent(4.8, () => spawnFormationLine("bomber", 3, { y: -38, spacing: 220, z: 2200, gap: 100 })),
        createEvent(9.4, () => {
          spawnTurretGate({ y: 96, z: 2120 });
          spawnFormationLine("scout", 5, { y: -108, z: 1880, spacing: 128 });
        }),
        createEvent(13.5, () => spawnMineWall(9, { gapIndex: 6, y: 4, z: 2200 })),
        createEvent(18.6, () => {
          spawnFormationLine("bomber", 2, { y: 94, spacing: 280, z: 2260, gap: 150 });
          spawnSweep("interceptor", 6, { y: -70, side: -1, z: 2100 });
        })
      ]
    },
    {
      name: "Harrier Command",
      brief: "Cripple the dreadnought before it can anchor the lane.",
      top: "#1d140d",
      bottom: "#070505",
      accent: "#ffcb84",
      glow: "rgba(255, 164, 102, 0.18)",
      events: [
        createEvent(1.5, () => spawnEnemy("bossHarrier", { x: 0, y: -18, z: 2500 })),
        createEvent(3.5, () => spawnFormationLine("interceptor", 4, { y: 140, spacing: 138, z: 2080 })),
        createEvent(10.0, () => spawnFormationLine("scout", 5, { y: -136, spacing: 118, z: 2020 }))
      ]
    },
    {
      name: "Rift Maw",
      brief: "Survive the elite gauntlet guarding the gate core.",
      top: "#120f23",
      bottom: "#03040b",
      accent: "#c2a8ff",
      glow: "rgba(138, 103, 255, 0.16)",
      events: [
        createEvent(0.6, () => spawnVFormation("interceptor", 7, { y: -12, gapX: 112 })),
        createEvent(4.4, () => spawnFormationLine("bomber", 3, { y: -84, spacing: 240, z: 2260, gap: 110 })),
        createEvent(8.2, () => spawnMineWall(8, { gapIndex: 5, y: 42, z: 2200 })),
        createEvent(12.6, () => spawnTurretGate({ y: -112, z: 2140 })),
        createEvent(16.5, () => {
          spawnSweep("interceptor", 6, { y: 92, side: 1, z: 2140 });
          spawnFormationLine("scout", 5, { y: -118, spacing: 132, z: 1920 });
        }),
        createEvent(21.5, () => spawnAsteroidField(12, { spreadX: 640, spreadY: 300, z: 2350, depth: 900 }))
      ]
    },
    {
      name: "Leviathan Gate",
      brief: "Destroy the command carrier and seal the rift.",
      top: "#1a0f17",
      bottom: "#050308",
      accent: "#ff9cb8",
      glow: "rgba(255, 98, 151, 0.18)",
      events: [
        createEvent(1.2, () => spawnEnemy("bossLeviathan", { x: 0, y: 0, z: 2550 })),
        createEvent(5.4, () => spawnSweep("interceptor", 4, { y: -152, side: -1, z: 2060 })),
        createEvent(11.0, () => spawnFormationLine("mine", 5, { y: 118, spacing: 150, z: 2060, gap: 56 }))
      ]
    }
  ];
}

function init() {
  resize();
  bindEvents();
  resetStars();
  setTitleScreen();
  if (new URLSearchParams(window.location.search).get("autostart") === "1") {
    startGame();
  }
  requestAnimationFrame(frame);
}

function bindEvents() {
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", clearInputs);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseLeave);
  canvas.addEventListener("contextmenu", handleContextMenu);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
  canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

  ui.primaryButton.addEventListener("click", () => {
    if (game.mode === "paused") {
      resumeGame();
      return;
    }
    startGame();
  });

  ui.secondaryButton.addEventListener("click", () => {
    if (game.mode === "title") {
      toggleAudio();
      return;
    }
    if (game.mode === "paused" || game.mode === "gameover" || game.mode === "victory") {
      setTitleScreen();
    }
  });

  ui.missileButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pointer.missileQueued = true;
  });

  ui.driveButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pointer.driveQueued = true;
  });
}

function resize() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  game.width = window.innerWidth;
  game.height = window.innerHeight;
  game.cx = game.width * 0.5;
  game.cy = game.height * 0.5;
  canvas.width = Math.floor(game.width * dpr);
  canvas.height = Math.floor(game.height * dpr);
  canvas.style.width = `${game.width}px`;
  canvas.style.height = `${game.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pointer.x = game.cx;
  pointer.y = game.cy;
}

function clearInputs() {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
  Object.keys(pressed).forEach((key) => {
    delete pressed[key];
  });
  pointer.fire = false;
}

function handleKeyDown(event) {
  if (!keys[event.code] && !event.repeat) {
    pressed[event.code] = true;
  }
  keys[event.code] = true;

  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  keys[event.code] = false;
}

function handleMouseMove(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
}

function handleMouseDown(event) {
  ensureAudio();
  if (event.button === 0) {
    pointer.fire = true;
  }
  if (event.button === 2) {
    pointer.missileQueued = true;
  }
}

function handleMouseUp(event) {
  if (event.button === 0) {
    pointer.fire = false;
  }
}

function handleMouseLeave() {
  pointer.fire = false;
}

function handleContextMenu(event) {
  event.preventDefault();
  pointer.missileQueued = true;
}

function handleTouchStart(event) {
  event.preventDefault();
  ensureAudio();
  const touch = event.changedTouches[0];
  if (!touch) {
    return;
  }
  pointer.touchId = touch.identifier;
  updatePointerFromTouch(touch);
  pointer.fire = true;
}

function handleTouchMove(event) {
  event.preventDefault();
  const touch = findTrackedTouch(event.changedTouches);
  if (!touch) {
    return;
  }
  updatePointerFromTouch(touch);
}

function handleTouchEnd(event) {
  event.preventDefault();
  const touch = findTrackedTouch(event.changedTouches);
  if (!touch) {
    return;
  }
  pointer.touchId = null;
  pointer.fire = false;
}

function findTrackedTouch(touches) {
  for (const touch of touches) {
    if (touch.identifier === pointer.touchId) {
      return touch;
    }
  }
  return null;
}

function updatePointerFromTouch(touch) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = touch.clientX - rect.left;
  pointer.y = touch.clientY - rect.top;
}

function ensureAudio() {
  if (!game.audioEnabled) {
    return;
  }
  if (!game.audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      game.audioEnabled = false;
      updateOverlayButtons();
      return;
    }
    game.audioContext = new AudioCtor();
  }
  if (game.audioContext.state === "suspended") {
    game.audioContext.resume().catch(() => {
      game.audioEnabled = false;
      updateOverlayButtons();
    });
  }
}

function toggleAudio() {
  game.audioEnabled = !game.audioEnabled;
  if (game.audioEnabled) {
    ensureAudio();
  }
  updateOverlayButtons();
}

function playSound(config) {
  if (!game.audioEnabled) {
    return;
  }
  ensureAudio();
  if (!game.audioContext || game.audioContext.state !== "running") {
    return;
  }

  const now = game.audioContext.currentTime;
  const oscillator = game.audioContext.createOscillator();
  const gain = game.audioContext.createGain();
  const filter = game.audioContext.createBiquadFilter();

  oscillator.type = config.type || "sine";
  oscillator.frequency.setValueAtTime(config.frequency || 440, now);
  if (config.slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(config.slideTo, now + (config.duration || 0.15));
  }

  filter.type = config.filterType || "lowpass";
  filter.frequency.value = config.filterFrequency || 2200;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(config.gain || 0.03, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (config.duration || 0.14));

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(game.audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + (config.duration || 0.14));
}

function soundLaser() {
  const now = performance.now();
  if (now - game.lastLaserSound < 55) {
    return;
  }
  game.lastLaserSound = now;
  playSound({
    type: "triangle",
    frequency: player.overdrive ? 360 : 290,
    slideTo: player.overdrive ? 150 : 120,
    duration: 0.08,
    gain: 0.02,
    filterFrequency: 3200
  });
}

function soundExplosion() {
  playSound({
    type: "sawtooth",
    frequency: 120,
    slideTo: 38,
    duration: 0.26,
    gain: 0.035,
    filterFrequency: 1400
  });
}

function soundHit() {
  playSound({
    type: "square",
    frequency: 180,
    slideTo: 95,
    duration: 0.09,
    gain: 0.018,
    filterFrequency: 2000
  });
}

function soundPickup() {
  playSound({
    type: "triangle",
    frequency: 420,
    slideTo: 680,
    duration: 0.14,
    gain: 0.025,
    filterFrequency: 2800
  });
}

function soundDamage() {
  playSound({
    type: "sawtooth",
    frequency: 160,
    slideTo: 70,
    duration: 0.18,
    gain: 0.03,
    filterFrequency: 1800
  });
}

function updateOverlayButtons() {
  if (game.mode === "title") {
    ui.secondaryButton.textContent = `Audio: ${game.audioEnabled ? "On" : "Off"}`;
    return;
  }
  ui.secondaryButton.textContent = "Back To Hangar";
}

function setOverlay(eyebrow, title, text, facts, primaryLabel, secondaryLabel) {
  ui.overlayEyebrow.textContent = eyebrow;
  ui.overlayTitle.textContent = title;
  ui.overlayText.textContent = text;
  ui.overlayFacts.innerHTML = facts.map((fact) => `
    <div class="fact-card">
      <span class="fact-label">${fact.label}</span>
      <strong>${fact.value}</strong>
    </div>
  `).join("");
  ui.primaryButton.textContent = primaryLabel;
  ui.secondaryButton.textContent = secondaryLabel;
  ui.overlay.classList.add("shown");
}

function hideOverlay() {
  ui.overlay.classList.remove("shown");
}

function setTitleScreen() {
  game.mode = "title";
  game.score = 0;
  game.kills = 0;
  game.sessionTime = 0;
  game.maxCombo = 1;
  game.distance = 0;
  game.shake = 0;
  game.flash = 0;
  game.enemies = [];
  game.projectiles = [];
  game.particles = [];
  game.pickups = [];
  game.messages = [];
  game.sectors = [];
  game.sectorIndex = -1;
  game.sector = TITLE_THEME;
  game.sectorTime = 0;
  game.intermission = 0;
  game.bossTarget = null;
  player = createPlayer();
  resetStars();
  setOverlay(
    "Deep-Space Intercept",
    "Starlance: Rift Command",
    "Launch into a finished first-person starfighter assault, survive six handcrafted combat sectors, and collapse the rift gate before the enemy fleet breaks through.",
    [
      { label: "Move", value: "Mouse, touch, or WASD" },
      { label: "Cannons", value: "Left click or Space" },
      { label: "Missiles", value: "Right click or X" },
      { label: "Overdrive", value: "Shift once the drive meter is charged" }
    ],
    "Launch Mission",
    `Audio: ${game.audioEnabled ? "On" : "Off"}`
  );
  updateHud();
}

function startGame() {
  ensureAudio();
  game.mode = "playing";
  game.score = 0;
  game.kills = 0;
  game.sessionTime = 0;
  game.maxCombo = 1;
  game.distance = 0;
  game.shake = 0;
  game.flash = 0;
  game.sectors = buildSectors();
  game.sectorIndex = -1;
  game.sector = null;
  game.sectorTime = 0;
  game.intermission = 0;
  game.enemies = [];
  game.projectiles = [];
  game.particles = [];
  game.pickups = [];
  game.messages = [];
  game.nextEnemyId = 1;
  player = createPlayer();
  resetStars();
  hideOverlay();
  advanceSector();
  showBanner("Starlance launch sequence complete.", "#8ff3ff", 3);
}

function pauseGame() {
  if (game.mode !== "playing") {
    return;
  }
  game.mode = "paused";
  setOverlay(
    "Mission Pause",
    "Systems Holding",
    "Your fighter is drifting in a cold lane. Resume when you are ready, or return to the hangar and relaunch clean.",
    [
      { label: "Score", value: formatNumber(game.score) },
      { label: "Kills", value: formatNumber(game.kills) },
      { label: "Combo", value: `x${player.combo.toFixed(1)}` },
      { label: "Sector", value: game.sector ? game.sector.name : "Standby" }
    ],
    "Resume Mission",
    "Back To Hangar"
  );
}

function resumeGame() {
  if (game.mode !== "paused") {
    return;
  }
  game.mode = "playing";
  hideOverlay();
}

function finishGame(victory) {
  game.mode = victory ? "victory" : "gameover";
  game.enemies = [];
  game.projectiles = [];
  game.pickups = [];
  pointer.fire = false;
  player.lockTarget = null;
  saveHighScore();
  const primary = victory ? "Fly Again" : "Retry Mission";
  const eyebrow = victory ? "Rift Collapsing" : "Signal Lost";
  const title = victory ? "Mission Complete" : "Starfighter Destroyed";
  const text = victory
    ? "The enemy command fleet is broken and the gate is sealing. Command is already queueing the next strike package."
    : "Your cockpit went dark before the rift could be sealed. Spin up a fresh frame and push back into the lane.";

  setOverlay(
    eyebrow,
    title,
    text,
    [
      { label: "Score", value: formatNumber(game.score) },
      { label: "Kills", value: formatNumber(game.kills) },
      { label: "Best Combo", value: `x${game.maxCombo.toFixed(1)}` },
      { label: "Time", value: `${game.sessionTime.toFixed(1)}s` }
    ],
    primary,
    "Back To Hangar"
  );
}

function saveHighScore() {
  if (game.score > game.highScore) {
    game.highScore = Math.floor(game.score);
    try {
      localStorage.setItem(STORAGE_KEY, String(game.highScore));
    } catch {
      // Ignore storage failures and keep the in-memory score.
    }
  }
}

function advanceSector() {
  game.sectorIndex += 1;
  if (game.sectorIndex >= game.sectors.length) {
    finishGame(true);
    return;
  }

  game.sector = game.sectors[game.sectorIndex];
  game.sector.events.forEach((event) => {
    event.done = false;
  });
  game.sector.clearTimer = 0;
  game.sectorTime = 0;
  game.intermission = 2.6;
  player.shield = clamp(player.shield + 18, 0, player.maxShield);
  player.health = clamp(player.health + 8, 0, player.maxHealth);
  player.missiles = clamp(player.missiles + 2, 0, player.maxMissiles);
  showBanner(`Sector ${game.sectorIndex + 1}: ${game.sector.name}`, game.sector.accent, 4);
}

function resetStars() {
  game.stars = Array.from({ length: 260 }, () => createStar(rand(WORLD.near, WORLD.far)));
}

function createStar(z) {
  return {
    x: rand(-3200, 3200),
    y: rand(-2200, 2200),
    z,
    size: rand(0.6, 2.1),
    twinkle: Math.random() * TAU
  };
}

function recycleStar(star, z) {
  star.x = rand(-3200, 3200);
  star.y = rand(-2200, 2200);
  star.z = z;
  star.size = rand(0.6, 2.1);
  star.twinkle = Math.random() * TAU;
}

function frame(timestamp) {
  const dt = clamp((timestamp - game.lastTime) / 1000 || 0.016, 0.001, 0.033);
  game.lastTime = timestamp;

  update(dt);
  render();
  updateHud();

  Object.keys(pressed).forEach((key) => {
    delete pressed[key];
  });
  pointer.missileQueued = false;
  pointer.driveQueued = false;

  requestAnimationFrame(frame);
}

function update(dt) {
  pointer.nx = clamp((pointer.x - game.cx) / (game.width * 0.42), -1, 1);
  pointer.ny = clamp((pointer.y - game.cy) / (game.height * 0.42), -1, 1);

  if (pressed.Escape || pressed.KeyP) {
    if (game.mode === "playing") {
      pauseGame();
    } else if (game.mode === "paused") {
      resumeGame();
    }
  }

  updateStars(dt);
  updateMessages(dt);

  if (game.mode === "title" || game.mode === "gameover" || game.mode === "victory") {
    game.distance += 170 * dt;
    updateParticles(dt * 0.6);
    game.shake = Math.max(0, game.shake - dt * 4);
    game.flash = Math.max(0, game.flash - dt * 2.8);
    return;
  }

  if (game.mode !== "playing") {
    return;
  }

  game.sessionTime += dt;
  game.distance += currentForwardSpeed() * dt;
  game.shake = Math.max(0, game.shake - dt * 4.5);
  game.flash = Math.max(0, game.flash - dt * 2.4);
  game.themePulse += dt;

  updatePlayer(dt);
  updateSector(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  handleCollisions();
  updatePickups(dt);
  updateParticles(dt);
  cleanupArrays();
  saveHighScore();
}

function currentForwardSpeed() {
  const bossActive = Boolean(game.bossTarget);
  return bossActive ? 210 : 350 + game.sectorIndex * 18 + (player.overdrive ? 130 : 0);
}

function updateMessages(dt) {
  game.messages = game.messages.filter((message) => {
    message.time -= dt;
    return message.time > 0;
  });
}

function showBanner(text, color, duration = 2.8) {
  game.messages.push({
    text,
    color,
    time: duration,
    life: duration
  });
  game.messages = game.messages.slice(-3);
}

function updateStars(dt) {
  const speed = currentForwardSpeed() * 0.72;
  for (const star of game.stars) {
    star.z -= speed * dt * (0.55 + star.size * 0.35);
    star.twinkle += dt * (0.4 + star.size * 0.2);
    if (star.z < WORLD.near) {
      recycleStar(star, WORLD.far + rand(10, 900));
    }
  }
}

function updatePlayer(dt) {
  const keyboardX = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const keyboardY = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const aimX = clamp(pointer.nx + keyboardX * 0.75, -1, 1);
  const aimY = clamp(pointer.ny + keyboardY * 0.75, -1, 1);
  const targetX = aimX * PLAYER_RANGE.x;
  const targetY = aimY * PLAYER_RANGE.y;
  const ease = 1 - Math.exp(-dt * 7.5);

  const prevX = player.x;
  const prevY = player.y;
  player.x = lerp(player.x, targetX, ease);
  player.y = lerp(player.y, targetY, ease);
  player.vx = (player.x - prevX) / Math.max(dt, 0.001);
  player.vy = (player.y - prevY) / Math.max(dt, 0.001);
  player.roll = lerp(player.roll, clamp(-aimX * 0.9, -0.9, 0.9), ease * 0.7);
  player.reticleX = player.x + aimX * 300;
  player.reticleY = player.y + aimY * 180;

  player.cooldown = Math.max(0, player.cooldown - dt);
  player.missileCooldown = Math.max(0, player.missileCooldown - dt);
  player.shieldDelay = Math.max(0, player.shieldDelay - dt);
  player.damagePulse = Math.max(0, player.damagePulse - dt * 2.5);

  if (player.comboTimer > 0) {
    player.comboTimer -= dt;
  } else {
    player.combo = lerp(player.combo, 1, clamp(dt * 0.8, 0, 1));
    if (Math.abs(player.combo - 1) < 0.02) {
      player.combo = 1;
    }
  }

  if (player.shieldDelay <= 0) {
    const regenRate = player.overdrive ? 14 : 8.5;
    player.shield = clamp(player.shield + regenRate * dt, 0, player.maxShield);
  }

  const coolingRate = player.overheated ? 46 : 33;
  const activeCoolingBonus = player.overdrive ? 14 : 0;
  player.heat = clamp(player.heat - (coolingRate + activeCoolingBonus) * dt, 0, 100);
  if (player.overheated && player.heat <= 34) {
    player.overheated = false;
    showBanner("Cannons back online.", "#ffca7e", 1.6);
  }

  if (player.overdrive) {
    player.drive = clamp(player.drive - 24 * dt, 0, player.maxDrive);
    if (player.drive <= 0) {
      player.overdrive = false;
      showBanner("Overdrive exhausted.", "#b6ffac", 1.6);
    }
  }

  if ((pressed.ShiftLeft || pressed.ShiftRight || pointer.driveQueued) && !player.overdrive && player.drive >= 30) {
    player.overdrive = true;
    showBanner("Overdrive engaged.", "#b6ffac", 1.8);
    playSound({
      type: "triangle",
      frequency: 260,
      slideTo: 620,
      duration: 0.24,
      gain: 0.03,
      filterFrequency: 2400
    });
  }

  player.lockTarget = findAimAssistTarget();

  const wantsFire = pointer.fire || keys.Space;
  if (wantsFire && !player.overheated && player.cooldown <= 0) {
    firePrimary();
  }

  if ((pointer.missileQueued || pressed.KeyX) && player.missiles > 0 && player.missileCooldown <= 0) {
    fireMissile();
  }

  game.maxCombo = Math.max(game.maxCombo, player.combo);
}

function firePrimary() {
  const aimTarget = player.lockTarget;
  const targetX = aimTarget ? aimTarget.x : player.reticleX;
  const targetY = aimTarget ? aimTarget.y : player.reticleY;
  const targetZ = aimTarget ? aimTarget.z : player.aimDepth;
  const wingOffset = 18 * player.wingSwap;

  for (const offset of [-wingOffset, wingOffset]) {
    const originX = player.x + offset;
    const originY = player.y + 12;
    spawnProjectileTo({
      from: "player",
      kind: "laser",
      x: originX,
      y: originY,
      z: 42,
      targetX,
      targetY,
      targetZ,
      speed: player.overdrive ? 2250 : 1980,
      damage: player.overdrive ? 22 : 16,
      radius: 12,
      color: player.overdrive ? "#d6ff92" : "#8df7ff",
      life: 1.25
    });
  }

  player.wingSwap *= -1;
  player.cooldown = player.overdrive ? 0.07 : 0.1;
  player.heat = clamp(player.heat + (player.overdrive ? 9 : 11), 0, 100);
  if (player.heat >= 100) {
    player.overheated = true;
    showBanner("Cannons overheated.", "#ffb46a", 1.8);
  }
  soundLaser();
}

function fireMissile() {
  const target = findNearestEnemy(player.x, player.y, 2500);
  const aimTarget = target || {
    x: player.reticleX,
    y: player.reticleY,
    z: 1650
  };
  spawnProjectileTo({
    from: "player",
    kind: "missile",
    x: player.x,
    y: player.y + 20,
    z: 48,
    targetX: aimTarget.x,
    targetY: aimTarget.y,
    targetZ: aimTarget.z,
    speed: 820,
    damage: player.overdrive ? 180 : 140,
    radius: 18,
    color: "#ffcf81",
    life: 3.4,
    homing: true,
    targetId: target ? target.id : null
  });
  player.missiles -= 1;
  player.missileCooldown = 1.1;
  playSound({
    type: "sawtooth",
    frequency: 160,
    slideTo: 300,
    duration: 0.18,
    gain: 0.03,
    filterFrequency: 2200
  });
}

function spawnProjectileTo(config) {
  const direction = normalize3(
    config.targetX - config.x,
    config.targetY - config.y,
    config.targetZ - config.z
  );

  game.projectiles.push({
    id: `${config.from}-${performance.now()}-${Math.random()}`,
    from: config.from,
    kind: config.kind,
    x: config.x,
    y: config.y,
    z: config.z,
    prevX: config.x,
    prevY: config.y,
    prevZ: config.z,
    dx: direction.x,
    dy: direction.y,
    dz: direction.z,
    speed: config.speed,
    damage: config.damage,
    radius: config.radius,
    color: config.color,
    life: config.life,
    homing: Boolean(config.homing),
    targetId: config.targetId || null,
    dead: false
  });
}

function updateSector(dt) {
  if (!game.sector) {
    return;
  }

  if (game.intermission > 0) {
    game.intermission -= dt;
    return;
  }

  game.sectorTime += dt;

  for (const event of game.sector.events) {
    if (!event.done && game.sectorTime >= event.time) {
      event.done = true;
      event.action();
    }
  }

  const allEventsDone = game.sector.events.every((event) => event.done);
  if (allEventsDone && game.enemies.length === 0) {
    game.sector.clearTimer += dt;
    if (game.sector.clearTimer > 2.2) {
      advanceSector();
    }
  } else {
    game.sector.clearTimer = 0;
  }
}

function spawnEnemy(type, overrides = {}) {
  const base = ENEMY_LIBRARY[type];
  const enemy = {
    id: game.nextEnemyId,
    type,
    name: base.name,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    z: overrides.z ?? 2200,
    baseX: overrides.baseX ?? overrides.x ?? 0,
    baseY: overrides.baseY ?? overrides.y ?? 0,
    vx: overrides.vx ?? 0,
    vy: overrides.vy ?? 0,
    vz: overrides.vz ?? base.vz,
    hp: overrides.hp ?? base.hp,
    maxHp: overrides.hp ?? base.hp,
    radius: overrides.radius ?? base.radius,
    points: overrides.points ?? base.points,
    modelScale: overrides.modelScale ?? base.modelScale,
    color: overrides.color ?? base.color,
    glow: overrides.glow ?? base.glow,
    collision: overrides.collision ?? base.collision,
    dropBias: overrides.dropBias ?? base.dropBias,
    boss: overrides.boss ?? Boolean(base.boss),
    fireCooldown: overrides.fireCooldown ?? rand(0.8, 1.4),
    specialCooldown: overrides.specialCooldown ?? rand(4, 6),
    phase: overrides.phase ?? 1,
    sway: overrides.sway ?? rand(40, 100),
    drift: overrides.drift ?? rand(-55, 55),
    seed: overrides.seed ?? Math.random() * TAU,
    spin: overrides.spin ?? 0,
    spinRate: overrides.spinRate ?? rand(-1.2, 1.2),
    dead: false,
    hitFlash: 0,
    payloadReleased: false
  };
  game.nextEnemyId += 1;
  game.enemies.push(enemy);
  return enemy;
}

function spawnFormationLine(type, count, options = {}) {
  const spacing = options.spacing ?? 126;
  const startX = options.startX ?? -((count - 1) * spacing) / 2;
  const baseZ = options.z ?? 2100;
  const gap = options.gap ?? 70;

  for (let index = 0; index < count; index += 1) {
    const x = startX + index * spacing;
    spawnEnemy(type, {
      x,
      y: options.y ?? 0,
      z: baseZ + index * gap,
      sway: options.sway ?? rand(30, 90),
      drift: options.drift ?? rand(-30, 30)
    });
  }
}

function spawnVFormation(type, count, options = {}) {
  const gapX = options.gapX ?? 120;
  const gapY = options.gapY ?? 26;
  const center = Math.floor(count / 2);

  for (let index = 0; index < count; index += 1) {
    const offset = index - center;
    spawnEnemy(type, {
      x: offset * gapX,
      y: (options.y ?? 0) + Math.abs(offset) * gapY,
      z: (options.z ?? 2120) + Math.abs(offset) * 74,
      sway: rand(50, 110)
    });
  }
}

function spawnSweep(type, count, options = {}) {
  const side = options.side ?? 1;
  const startX = side < 0 ? -440 : 440;
  for (let index = 0; index < count; index += 1) {
    const x = startX + side * index * -98;
    spawnEnemy(type, {
      x,
      y: (options.y ?? 0) + index * 14,
      z: (options.z ?? 2120) + index * 85,
      drift: side * rand(25, 42),
      sway: rand(105, 165)
    });
  }
}

function spawnMineWall(count, options = {}) {
  const spacing = options.spacing ?? 122;
  const startX = -((count - 1) * spacing) / 2;
  for (let index = 0; index < count; index += 1) {
    if (index === options.gapIndex) {
      continue;
    }
    spawnEnemy("mine", {
      x: startX + index * spacing,
      y: options.y ?? 0,
      z: (options.z ?? 2140) + index * 40,
      sway: 0,
      drift: 0
    });
  }
}

function spawnAsteroidField(count, options = {}) {
  const baseZ = options.z ?? 2100;
  const depth = options.depth ?? 620;
  for (let index = 0; index < count; index += 1) {
    spawnEnemy("asteroid", {
      x: rand(-(options.spreadX ?? 580), options.spreadX ?? 580),
      y: rand(-(options.spreadY ?? 260), options.spreadY ?? 260),
      z: baseZ + rand(0, depth),
      vx: rand(-45, 45),
      vy: rand(-28, 28),
      spinRate: rand(-1.6, 1.6),
      modelScale: rand(24, 46),
      radius: rand(24, 34),
      hp: rand(32, 48)
    });
  }
}

function spawnTurretGate(options = {}) {
  const z = options.z ?? 2160;
  const y = options.y ?? 0;
  spawnEnemy("turret", { x: -260, y: y - 76, z, sway: 24, drift: 0 });
  spawnEnemy("turret", { x: 260, y: y + 76, z: z + 44, sway: 24, drift: 0 });
  spawnFormationLine("scout", 3, { y, z: z - 120, spacing: 160, gap: 46 });
}

function updateEnemies(dt) {
  game.bossTarget = null;

  for (const enemy of game.enemies) {
    enemy.t = (enemy.t || 0) + dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);
    enemy.fireCooldown -= dt;
    enemy.specialCooldown -= dt;

    switch (enemy.type) {
      case "scout":
        updateScout(enemy, dt);
        break;
      case "interceptor":
        updateInterceptor(enemy, dt);
        break;
      case "mine":
        updateMine(enemy, dt);
        break;
      case "asteroid":
        updateAsteroid(enemy, dt);
        break;
      case "turret":
        updateTurret(enemy, dt);
        break;
      case "bomber":
        updateBomber(enemy, dt);
        break;
      case "bossHarrier":
        updateBossHarrier(enemy, dt);
        break;
      case "bossLeviathan":
        updateBossLeviathan(enemy, dt);
        break;
      default:
        break;
    }

    if (enemy.boss && !enemy.dead) {
      game.bossTarget = enemy;
    }

    if (!enemy.boss && enemy.z < -160) {
      enemy.dead = true;
    }
  }
}

function updateScout(enemy, dt) {
  enemy.z += enemy.vz * dt;
  enemy.x = enemy.baseX + Math.sin(enemy.t * 1.85 + enemy.seed) * enemy.sway;
  enemy.y = enemy.baseY + Math.cos(enemy.t * 1.15 + enemy.seed) * 16;
  enemy.spin = Math.sin(enemy.t * 2.4 + enemy.seed) * 0.1;

  if (enemy.z < 1050 && enemy.fireCooldown <= 0) {
    fireEnemySpread(enemy, 1, 0, 760, 10, "bolt");
    enemy.fireCooldown = rand(1.15, 1.8);
  }
}

function updateInterceptor(enemy, dt) {
  enemy.z += enemy.vz * dt;
  enemy.baseX += enemy.drift * dt;
  enemy.x = enemy.baseX + Math.sin(enemy.t * 3.1 + enemy.seed) * enemy.sway;
  enemy.y = enemy.baseY + Math.sin(enemy.t * 2.6 + enemy.seed) * 24;
  enemy.spin = Math.sin(enemy.t * 3.2 + enemy.seed) * 0.18;

  if (enemy.z < 980 && enemy.fireCooldown <= 0) {
    fireEnemySpread(enemy, 3, 92, 820, 9, "pulse");
    enemy.fireCooldown = rand(1.3, 1.9);
  }
}

function updateMine(enemy, dt) {
  enemy.z += enemy.vz * dt;
  enemy.spin += enemy.spinRate * dt;
  const pull = clamp((700 - enemy.z) / 700, 0, 1);
  enemy.x += (player.x - enemy.x) * pull * dt * 0.45;
  enemy.y += (player.y - enemy.y) * pull * dt * 0.35;
}

function updateAsteroid(enemy, dt) {
  enemy.z += enemy.vz * dt;
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  enemy.spin += enemy.spinRate * dt;
}

function updateTurret(enemy, dt) {
  enemy.z = lerp(enemy.z, 1180, dt * 1.2);
  enemy.x = enemy.baseX + Math.sin(enemy.t * 0.75 + enemy.seed) * enemy.sway;
  enemy.y = enemy.baseY + Math.sin(enemy.t * 0.9 + enemy.seed) * 12;
  enemy.spin = Math.sin(enemy.t * 0.75) * 0.08;

  if (enemy.fireCooldown <= 0) {
    fireEnemySpread(enemy, 4, 85, 760, 11, "bolt");
    enemy.fireCooldown = rand(1.7, 2.15);
  }
}

function updateBomber(enemy, dt) {
  enemy.z += enemy.vz * dt;
  enemy.x = lerp(enemy.x, player.x + Math.sin(enemy.t + enemy.seed) * 120, dt * 0.35);
  enemy.y = enemy.baseY + Math.cos(enemy.t * 0.8 + enemy.seed) * 54;
  enemy.spin = Math.sin(enemy.t * 0.55) * 0.05;

  if (enemy.fireCooldown <= 0) {
    fireEnemySpread(enemy, 5, 78, 700, 13, "heavy");
    enemy.fireCooldown = rand(2.1, 2.7);
  }

  if (!enemy.payloadReleased && enemy.hp < enemy.maxHp * 0.58) {
    enemy.payloadReleased = true;
    spawnEnemy("mine", { x: enemy.x - 86, y: enemy.y - 18, z: enemy.z + 60 });
    spawnEnemy("mine", { x: enemy.x + 86, y: enemy.y + 18, z: enemy.z + 90 });
  }
}

function updateBossHarrier(enemy, dt) {
  const healthRatio = enemy.hp / enemy.maxHp;
  enemy.phase = healthRatio < 0.35 ? 3 : healthRatio < 0.68 ? 2 : 1;
  const targetZ = enemy.phase === 3 ? 950 : enemy.phase === 2 ? 1080 : 1220;
  enemy.z = lerp(enemy.z, targetZ, dt * 0.8);
  enemy.x = Math.sin(enemy.t * 0.55) * 250;
  enemy.y = -30 + Math.sin(enemy.t * 0.92) * 104;
  enemy.spin = Math.sin(enemy.t * 0.55) * 0.08;

  if (enemy.fireCooldown <= 0) {
    const count = enemy.phase === 1 ? 5 : enemy.phase === 2 ? 7 : 9;
    const spacing = enemy.phase === 1 ? 70 : enemy.phase === 2 ? 62 : 55;
    const damage = enemy.phase === 3 ? 16 : 13;
    fireEnemySpread(enemy, count, spacing, 780 + enemy.phase * 45, damage, "heavy");
    enemy.fireCooldown = enemy.phase === 3 ? 0.95 : enemy.phase === 2 ? 1.2 : 1.5;
  }

  if (enemy.specialCooldown <= 0) {
    if (enemy.phase === 1) {
      spawnFormationLine("interceptor", 3, {
        y: rand(-100, 100),
        z: 2100,
        spacing: 156,
        gap: 62
      });
      enemy.specialCooldown = 7.5;
    } else if (enemy.phase === 2) {
      spawnFormationLine("interceptor", 4, {
        y: rand(-120, 120),
        z: 2080,
        spacing: 142,
        gap: 52
      });
      fireEnemyRadial(enemy, 8, 640, 14, "pulse");
      enemy.specialCooldown = 5.8;
    } else {
      spawnMineWall(6, {
        gapIndex: Math.floor(rand(0, 6)),
        y: rand(-80, 80),
        z: 1980
      });
      fireEnemyRadial(enemy, 10, 720, 16, "heavy");
      enemy.specialCooldown = 4.2;
    }
  }
}

function updateBossLeviathan(enemy, dt) {
  const healthRatio = enemy.hp / enemy.maxHp;
  enemy.phase = healthRatio < 0.34 ? 3 : healthRatio < 0.68 ? 2 : 1;
  const targetZ = enemy.phase === 3 ? 980 : enemy.phase === 2 ? 1120 : 1300;
  enemy.z = lerp(enemy.z, targetZ, dt * 0.7);
  enemy.x = Math.sin(enemy.t * 0.34) * 170;
  enemy.y = Math.sin(enemy.t * 0.82) * 120;
  enemy.spin = Math.sin(enemy.t * 0.42) * 0.05;

  if (enemy.fireCooldown <= 0) {
    if (enemy.phase === 1) {
      fireEnemySpread(enemy, 7, 72, 760, 13, "bolt");
      enemy.fireCooldown = 1.3;
    } else if (enemy.phase === 2) {
      fireEnemySpread(enemy, 9, 62, 820, 15, "pulse");
      enemy.fireCooldown = 1.05;
    } else {
      fireEnemySpread(enemy, 11, 54, 900, 17, "heavy");
      enemy.fireCooldown = 0.84;
    }
  }

  if (enemy.specialCooldown <= 0) {
    if (enemy.phase === 1) {
      spawnSweep("interceptor", 4, {
        y: rand(-120, 120),
        side: Math.random() > 0.5 ? 1 : -1,
        z: 2100
      });
      enemy.specialCooldown = 6.8;
    } else if (enemy.phase === 2) {
      spawnMineWall(7, {
        gapIndex: Math.floor(rand(0, 7)),
        y: rand(-100, 100),
        z: 2060
      });
      spawnFormationLine("bomber", 2, { y: rand(-120, 120), z: 2140, spacing: 280, gap: 120 });
      fireEnemyRadial(enemy, 12, 690, 15, "pulse");
      enemy.specialCooldown = 5.2;
    } else {
      spawnFormationLine("interceptor", 5, { y: rand(-140, 140), z: 2060, spacing: 135, gap: 54 });
      fireEnemyRadial(enemy, 14, 760, 18, "heavy");
      enemy.specialCooldown = 3.9;
      showBanner("Leviathan broadside incoming.", "#ff95b8", 1.6);
    }
  }
}

function fireEnemySpread(enemy, count, spacing, speed, damage, kind) {
  const start = -((count - 1) * spacing) / 2;
  for (let index = 0; index < count; index += 1) {
    const offset = start + index * spacing;
    spawnProjectileTo({
      from: "enemy",
      kind,
      x: enemy.x,
      y: enemy.y,
      z: enemy.z,
      targetX: player.x + offset * 0.55 + player.vx * 0.08,
      targetY: player.y + Math.sin(enemy.t + index) * 10 + player.vy * 0.03,
      targetZ: 30,
      speed,
      damage,
      radius: kind === "heavy" ? 18 : kind === "pulse" ? 13 : 11,
      color: kind === "heavy" ? "#ff996a" : kind === "pulse" ? "#ffcf80" : "#ff7c85",
      life: 3.4
    });
  }
}

function fireEnemyRadial(enemy, count, speed, damage, kind) {
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TAU;
    const targetX = enemy.x + Math.cos(angle) * 320;
    const targetY = enemy.y + Math.sin(angle) * 220;
    spawnProjectileTo({
      from: "enemy",
      kind,
      x: enemy.x,
      y: enemy.y,
      z: enemy.z,
      targetX,
      targetY,
      targetZ: enemy.z - 900,
      speed,
      damage,
      radius: kind === "heavy" ? 18 : 13,
      color: kind === "heavy" ? "#ff866d" : "#ffcf80",
      life: 3.2
    });
  }
}

function updateProjectiles(dt) {
  for (const projectile of game.projectiles) {
    projectile.prevX = projectile.x;
    projectile.prevY = projectile.y;
    projectile.prevZ = projectile.z;
    projectile.life -= dt;

    if (projectile.homing && projectile.from === "player") {
      const target = getMissileTarget(projectile);
      if (target) {
        const desired = normalize3(
          target.x - projectile.x,
          target.y - projectile.y,
          target.z - projectile.z
        );
        projectile.dx = lerp(projectile.dx, desired.x, dt * 2.8);
        projectile.dy = lerp(projectile.dy, desired.y, dt * 2.8);
        projectile.dz = lerp(projectile.dz, desired.z, dt * 2.8);
        const normalized = normalize3(projectile.dx, projectile.dy, projectile.dz);
        projectile.dx = normalized.x;
        projectile.dy = normalized.y;
        projectile.dz = normalized.z;
      }
    }

    projectile.x += projectile.dx * projectile.speed * dt;
    projectile.y += projectile.dy * projectile.speed * dt;
    projectile.z += projectile.dz * projectile.speed * dt;

    if (projectile.kind === "missile") {
      spawnTrail(projectile.x, projectile.y, projectile.z, "#ffd9a5", 10);
    }

    if (
      projectile.life <= 0 ||
      projectile.z > WORLD.far + 320 ||
      projectile.z < -320 ||
      Math.abs(projectile.x) > 3600 ||
      Math.abs(projectile.y) > 2600
    ) {
      projectile.dead = true;
    }
  }
}

function getMissileTarget(projectile) {
  const existing = game.enemies.find((enemy) => enemy.id === projectile.targetId && !enemy.dead);
  if (existing) {
    return existing;
  }
  const target = findNearestEnemy(projectile.x, projectile.y, 2600);
  if (target) {
    projectile.targetId = target.id;
  }
  return target;
}

function findNearestEnemy(x, y, maxZ) {
  let best = null;
  let bestScore = Infinity;

  for (const enemy of game.enemies) {
    if (enemy.dead || enemy.z <= 0 || enemy.z > maxZ) {
      continue;
    }
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const score = Math.hypot(dx, dy) + enemy.z * 0.15 - (enemy.boss ? 130 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = enemy;
    }
  }

  return best;
}

function findAimAssistTarget() {
  let best = null;
  let bestDistance = Infinity;

  for (const enemy of game.enemies) {
    if (enemy.dead || enemy.z <= WORLD.near) {
      continue;
    }
    const projected = project(enemy.x, enemy.y, enemy.z, 1);
    if (!projected) {
      continue;
    }
    const reticle = reticleScreenPosition();
    const distance = Math.hypot(projected.x - reticle.x, projected.y - reticle.y) - (enemy.boss ? 38 : 0);
    if (distance < bestDistance && distance < 120) {
      bestDistance = distance;
      best = enemy;
    }
  }

  return best;
}

function handleCollisions() {
  for (const projectile of game.projectiles) {
    if (projectile.dead) {
      continue;
    }

    if (projectile.from === "player") {
      for (const enemy of game.enemies) {
        if (enemy.dead) {
          continue;
        }
        const radius = projectile.radius + enemy.radius;
        if (distanceSq3(projectile, enemy) <= radius * radius) {
          if (projectile.kind === "missile") {
            detonateMissile(projectile, enemy);
          } else {
            damageEnemy(enemy, projectile.damage, true, projectile.color);
            projectile.dead = true;
          }
          break;
        }
      }
    } else {
      const hitRadius = projectile.radius + 30;
      const dx = projectile.x - player.x;
      const dy = projectile.y - player.y;
      const dz = projectile.z - 32;
      if (dx * dx + dy * dy + dz * dz <= hitRadius * hitRadius) {
        applyDamage(projectile.damage);
        projectile.dead = true;
      }
    }
  }

  for (const enemy of game.enemies) {
    if (enemy.dead) {
      continue;
    }
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance2d = dx * dx + dy * dy;
    const hitRadius = enemy.radius + 36;

    if (enemy.z < 76 && distance2d <= hitRadius * hitRadius) {
      if (enemy.type === "mine") {
        explodeMine(enemy, false);
      } else {
        damageEnemy(enemy, enemy.hp + 10, false, enemy.color);
      }
      applyDamage(enemy.collision);
    }
  }

  for (const pickup of game.pickups) {
    if (pickup.dead) {
      continue;
    }
    const dx = pickup.x - player.x;
    const dy = pickup.y - player.y;
    const dz = pickup.z - 42;
    const radius = pickup.radius + 36;
    if (dx * dx + dy * dy + dz * dz <= radius * radius) {
      collectPickup(pickup);
    }
  }
}

function damageEnemy(enemy, amount, fromPlayer, impactColor) {
  if (enemy.dead) {
    return;
  }

  enemy.hp -= amount;
  enemy.hitFlash = 1;
  spawnImpact(enemy.x, enemy.y, enemy.z, impactColor || enemy.color);
  soundHit();

  if (enemy.hp <= 0) {
    if (enemy.type === "mine") {
      explodeMine(enemy, fromPlayer);
      return;
    }

    enemy.dead = true;
    spawnExplosion(enemy.x, enemy.y, enemy.z, enemy.color, enemy.boss ? 36 : 18, enemy.boss ? 1.8 : 1);
    game.shake = Math.max(game.shake, enemy.boss ? 1.6 : 0.55);
    game.flash = Math.max(game.flash, enemy.boss ? 0.55 : 0.18);
    soundExplosion();

    if (fromPlayer) {
      awardKill(enemy);
    }

    if (enemy.type === "bossLeviathan") {
      showBanner("Rift Leviathan destroyed.", "#ffbfd0", 3.6);
      finishGame(true);
    } else if (enemy.boss) {
      showBanner(`${enemy.name} destroyed. Jump corridor opening.`, enemy.color, 3.2);
    }
  }
}

function explodeMine(enemy, fromPlayer) {
  if (enemy.dead) {
    return;
  }

  enemy.dead = true;
  spawnExplosion(enemy.x, enemy.y, enemy.z, "#ffad82", 20, 1.25);
  game.shake = Math.max(game.shake, 0.9);
  game.flash = Math.max(game.flash, 0.24);
  soundExplosion();

  const blastRadius = 165;
  for (const other of game.enemies) {
    if (other.dead || other.id === enemy.id) {
      continue;
    }
    const dx = other.x - enemy.x;
    const dy = other.y - enemy.y;
    const dz = other.z - enemy.z;
    const distance = Math.hypot(dx, dy, dz);
    if (distance <= blastRadius) {
      damageEnemy(other, clamp(48 - distance * 0.14, 12, 48), false, "#ffd0a8");
    }
  }

  const playerDistance = Math.hypot(enemy.x - player.x, enemy.y - player.y, enemy.z - 36);
  if (playerDistance <= 140) {
    applyDamage(clamp(26 - playerDistance * 0.12, 8, 26));
  }

  if (fromPlayer) {
    awardKill(enemy);
  }
}

function detonateMissile(projectile, enemy) {
  projectile.dead = true;
  spawnExplosion(projectile.x, projectile.y, projectile.z, "#ffd9a5", 22, 1.35);
  game.shake = Math.max(game.shake, 0.8);
  soundExplosion();

  const radius = 190;
  for (const target of game.enemies) {
    if (target.dead) {
      continue;
    }
    const dx = target.x - projectile.x;
    const dy = target.y - projectile.y;
    const dz = target.z - projectile.z;
    const distance = Math.hypot(dx, dy, dz);
    if (distance <= radius) {
      const falloff = 1 - distance / radius;
      damageEnemy(target, projectile.damage * falloff, true, "#ffd9a5");
    }
  }

  if (!enemy.dead) {
    damageEnemy(enemy, projectile.damage, true, "#ffd9a5");
  }
}

function awardKill(enemy) {
  const scoreGain = Math.round(enemy.points * player.combo);
  game.score += scoreGain;
  game.kills += 1;
  player.combo = clamp(player.combo + (enemy.boss ? 0.9 : 0.18), 1, 6);
  player.comboTimer = 4.2;
  player.drive = clamp(player.drive + (enemy.boss ? 35 : 8), 0, player.maxDrive);

  if (Math.random() < enemy.dropBias) {
    spawnPickup(enemy);
  }
}

function spawnPickup(enemy) {
  const roll = Math.random();
  const type = roll < 0.34 ? "missile" : roll < 0.68 ? "shield" : "drive";

  game.pickups.push({
    type,
    x: enemy.x,
    y: enemy.y,
    z: enemy.z,
    radius: 20,
    t: 0,
    dead: false,
    color: type === "missile" ? "#ffc778" : type === "shield" ? "#8defff" : "#b6ffac"
  });
}

function collectPickup(pickup) {
  pickup.dead = true;
  soundPickup();
  spawnExplosion(pickup.x, pickup.y, pickup.z, pickup.color, 10, 0.6);

  if (pickup.type === "missile") {
    player.missiles = clamp(player.missiles + 2, 0, player.maxMissiles);
    showBanner("Missile magazine replenished.", "#ffd08d", 1.4);
  } else if (pickup.type === "shield") {
    player.shield = clamp(player.shield + 34, 0, player.maxShield);
    showBanner("Shield cell secured.", "#8defff", 1.4);
  } else {
    player.drive = clamp(player.drive + 24, 0, player.maxDrive);
    showBanner("Drive core captured.", "#b6ffac", 1.4);
  }
}

function applyDamage(amount) {
  player.shieldDelay = 2.6;
  player.damagePulse = 1;
  player.combo = Math.max(1, player.combo - 0.35);
  player.comboTimer = 2;

  let remaining = amount;
  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, remaining);
    player.shield -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) {
    player.health -= remaining;
  }

  game.shake = Math.max(game.shake, 1);
  game.flash = Math.max(game.flash, 0.2);
  soundDamage();
  showBanner(player.shield > 0 ? "Shield impact detected." : "Hull breach warning.", "#ff9893", 1.2);

  if (player.health <= 0 && game.mode === "playing") {
    player.health = 0;
    finishGame(false);
  }
}

function updatePickups(dt) {
  for (const pickup of game.pickups) {
    pickup.t += dt;
    pickup.z -= currentForwardSpeed() * 0.16 * dt;
    pickup.y += Math.sin(pickup.t * 2.2) * 10 * dt;
    const pull = clamp((600 - pickup.z) / 600, 0, 1);
    pickup.x += (player.x - pickup.x) * pull * dt * 0.8;
    pickup.y += (player.y - pickup.y) * pull * dt * 0.65;

    if (pickup.z < -40) {
      pickup.dead = true;
    }
  }
}

function spawnImpact(x, y, z, color) {
  for (let index = 0; index < 6; index += 1) {
    game.particles.push({
      kind: "spark",
      x,
      y,
      z,
      dx: rand(-120, 120),
      dy: rand(-120, 120),
      dz: rand(-180, 120),
      size: rand(4, 8),
      color,
      life: rand(0.18, 0.32),
      maxLife: 0.32
    });
  }
}

function spawnExplosion(x, y, z, color, count, scale) {
  for (let index = 0; index < count; index += 1) {
    game.particles.push({
      kind: index % 4 === 0 ? "ring" : "spark",
      x,
      y,
      z,
      dx: rand(-180, 180) * scale,
      dy: rand(-180, 180) * scale,
      dz: rand(-240, 220) * scale,
      size: rand(7, 18) * scale,
      color,
      life: rand(0.28, 0.76),
      maxLife: 0.76
    });
  }
}

function spawnTrail(x, y, z, color, size) {
  game.particles.push({
    kind: "glow",
    x,
    y,
    z,
    dx: rand(-18, 18),
    dy: rand(-18, 18),
    dz: rand(-40, -10),
    size,
    color,
    life: 0.22,
    maxLife: 0.22
  });
}

function updateParticles(dt) {
  for (const particle of game.particles) {
    particle.life -= dt;
    particle.x += particle.dx * dt;
    particle.y += particle.dy * dt;
    particle.z += particle.dz * dt;
    particle.size += particle.kind === "ring" ? dt * 42 : 0;
  }
}

function cleanupArrays() {
  game.enemies = game.enemies.filter((enemy) => !enemy.dead);
  game.projectiles = game.projectiles.filter((projectile) => !projectile.dead);
  game.pickups = game.pickups.filter((pickup) => !pickup.dead);
  game.particles = game.particles.filter((particle) => particle.life > 0);
}

function project(x, y, z, parallax = 1) {
  if (z <= WORLD.near || z >= WORLD.far + 300) {
    return null;
  }
  const scale = WORLD.focal / z;
  return {
    x: game.cx + (x - player.x * parallax) * scale + game.shakeX,
    y: game.cy + (y - player.y * parallax) * scale + game.shakeY,
    scale,
    depth: z
  };
}

function render() {
  game.shakeX = (Math.random() - 0.5) * game.shake * 10;
  game.shakeY = (Math.random() - 0.5) * game.shake * 7;

  renderBackground();
  renderTunnel();
  renderStars();
  renderPickups();
  renderProjectiles();
  renderEnemies();
  renderParticles();
  renderCrosshair();
  renderCockpit();
  renderMessages();

  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255, 220, 190, ${game.flash * 0.22})`;
    ctx.fillRect(0, 0, game.width, game.height);
  }
}

function currentTheme() {
  return game.sector || TITLE_THEME;
}

function renderBackground() {
  const theme = currentTheme();
  const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
  gradient.addColorStop(0, theme.top);
  gradient.addColorStop(1, theme.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, game.width, game.height);

  const radial = ctx.createRadialGradient(
    game.cx + player.roll * 60,
    game.cy * 0.7,
    40,
    game.cx,
    game.cy,
    Math.max(game.width, game.height) * 0.7
  );
  radial.addColorStop(0, player.overdrive ? "rgba(182, 255, 172, 0.16)" : theme.glow);
  radial.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, game.width, game.height);

  if (player.damagePulse > 0) {
    ctx.fillStyle = `rgba(255, 90, 100, ${player.damagePulse * 0.08})`;
    ctx.fillRect(0, 0, game.width, game.height);
  }
}

function renderStars() {
  for (const star of game.stars) {
    const projected = project(star.x, star.y, star.z, 0.18);
    if (!projected) {
      continue;
    }

    const alpha = clamp(1.15 - star.z / WORLD.far, 0.18, 0.85) * (0.65 + Math.sin(star.twinkle) * 0.2);
    const size = star.size * projected.scale * 1.6 + 0.35;
    const streak = size * (player.overdrive ? 14 : 6);

    ctx.strokeStyle = `rgba(214, 243, 255, ${alpha})`;
    ctx.lineWidth = Math.max(0.8, size * 0.8);
    ctx.beginPath();
    ctx.moveTo(projected.x, projected.y + streak * 0.12);
    ctx.lineTo(projected.x, projected.y + streak);
    ctx.stroke();
  }
}

function renderTunnel() {
  const theme = currentTheme();
  const ringSpacing = 220;
  const offset = game.distance % ringSpacing;

  ctx.lineWidth = 1.4;
  for (let z = ringSpacing - offset; z < WORLD.far; z += ringSpacing) {
    const projected = project(0, 0, z, 1);
    if (!projected) {
      continue;
    }

    const radiusX = projected.scale * 680;
    const radiusY = projected.scale * 420;
    const alpha = clamp(0.55 - z / WORLD.far, 0.05, 0.28);

    ctx.strokeStyle = colorWithAlpha(player.overdrive ? "#c9ff90" : theme.accent, alpha);
    ctx.beginPath();
    for (let index = 0; index <= 8; index += 1) {
      const angle = (index / 8) * TAU + Math.PI / 8;
      const x = projected.x + Math.cos(angle) * radiusX;
      const y = projected.y + Math.sin(angle) * radiusY;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  ctx.strokeStyle = colorWithAlpha(player.overdrive ? "#dcffae" : theme.accent, 0.16);
  ctx.lineWidth = 1;
  for (const laneX of [-280, 280]) {
    const near = project(laneX, 180, 280, 1);
    const far = project(laneX, -140, 2200, 1);
    if (!near || !far) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(near.x, near.y);
    ctx.lineTo(far.x, far.y);
    ctx.stroke();
  }
}

function renderPickups() {
  for (const pickup of game.pickups) {
    const projected = project(pickup.x, pickup.y, pickup.z, 1);
    if (!projected) {
      continue;
    }

    const size = projected.scale * 30;
    ctx.save();
    ctx.translate(projected.x, projected.y);
    ctx.rotate(pickup.t * 1.6);
    ctx.strokeStyle = colorWithAlpha(pickup.color, 0.88);
    ctx.lineWidth = Math.max(1.3, projected.scale * 3);
    ctx.beginPath();
    for (let index = 0; index <= 6; index += 1) {
      const angle = (index / 6) * TAU;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.45, 0);
    ctx.lineTo(size * 0.45, 0);
    ctx.moveTo(0, -size * 0.45);
    ctx.lineTo(0, size * 0.45);
    ctx.stroke();
    ctx.restore();
  }
}

function renderProjectiles() {
  for (const projectile of game.projectiles) {
    const start = project(projectile.prevX, projectile.prevY, projectile.prevZ, 1);
    const end = project(projectile.x, projectile.y, projectile.z, 1);
    if (!end) {
      continue;
    }

    ctx.strokeStyle = colorWithAlpha(projectile.color, projectile.from === "player" ? 0.88 : 0.74);
    ctx.lineWidth = Math.max(1.4, end.scale * (projectile.kind === "missile" ? 14 : projectile.radius * 0.55));

    if (start) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.fillStyle = colorWithAlpha(projectile.color, 0.92);
    ctx.beginPath();
    ctx.arc(end.x, end.y, Math.max(2, end.scale * projectile.radius * 0.42), 0, TAU);
    ctx.fill();
  }
}

function renderEnemies() {
  const sorted = [...game.enemies].sort((a, b) => b.z - a.z);

  for (const enemy of sorted) {
    const projected = project(enemy.x, enemy.y, enemy.z, 1);
    if (!projected) {
      continue;
    }

    const size = projected.scale * enemy.modelScale;
    ctx.save();
    ctx.translate(projected.x, projected.y);
    ctx.rotate(enemy.spin || 0);
    ctx.globalAlpha = enemy.hitFlash > 0 ? 1 : 0.96;
    ctx.shadowBlur = enemy.boss ? 24 : 14;
    ctx.shadowColor = colorWithAlpha(enemy.glow, 0.55);

    if (enemy.type === "asteroid") {
      drawAsteroid(size, enemy);
    } else if (enemy.type === "bossHarrier") {
      drawHarrierBoss(size, enemy);
    } else if (enemy.type === "bossLeviathan") {
      drawLeviathanBoss(size, enemy);
    } else {
      drawShip(size, enemy);
    }

    ctx.restore();

    if (enemy.boss || enemy.z < 1150) {
      drawEnemyHealth(projected, enemy, size);
    }
  }
}

function drawAsteroid(size, enemy) {
  ctx.fillStyle = enemy.hitFlash > 0 ? "#fff0c8" : enemy.color;
  ctx.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * TAU;
    const radius = size * (0.7 + ((Math.sin(enemy.seed * 8 + index * 1.8) + 1) * 0.16));
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.stroke();
}

function drawShip(size, enemy) {
  const fill = enemy.hitFlash > 0 ? "#fff0d1" : enemy.color;
  ctx.fillStyle = fill;
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = Math.max(1, size * 0.08);

  if (enemy.type === "scout") {
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.15);
    ctx.lineTo(size * 0.95, size * 0.35);
    ctx.lineTo(size * 0.35, size * 0.2);
    ctx.lineTo(size * 0.7, size * 1.05);
    ctx.lineTo(0, size * 0.62);
    ctx.lineTo(-size * 0.7, size * 1.05);
    ctx.lineTo(-size * 0.35, size * 0.2);
    ctx.lineTo(-size * 0.95, size * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.type === "interceptor") {
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.25);
    ctx.lineTo(size * 0.45, -size * 0.15);
    ctx.lineTo(size * 1.15, size * 0.88);
    ctx.lineTo(size * 0.38, size * 0.54);
    ctx.lineTo(0, size * 1.05);
    ctx.lineTo(-size * 0.38, size * 0.54);
    ctx.lineTo(-size * 1.15, size * 0.88);
    ctx.lineTo(-size * 0.45, -size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.type === "turret") {
    ctx.beginPath();
    ctx.rect(-size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-size * 1.2, -size * 0.16, size * 0.4, size * 0.32);
    ctx.fillRect(size * 0.8, -size * 0.16, size * 0.4, size * 0.32);
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.2);
    ctx.lineTo(size * 0.95, -size * 0.1);
    ctx.lineTo(size * 0.7, size * 1.05);
    ctx.lineTo(0, size * 0.72);
    ctx.lineTo(-size * 0.7, size * 1.05);
    ctx.lineTo(-size * 0.95, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-size * 1.14, size * 0.18, size * 0.48, size * 0.2);
    ctx.fillRect(size * 0.66, size * 0.18, size * 0.48, size * 0.2);
  }
}

function drawHarrierBoss(size, enemy) {
  ctx.fillStyle = enemy.hitFlash > 0 ? "#ffecc7" : enemy.color;
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = Math.max(1.2, size * 0.05);

  ctx.beginPath();
  ctx.moveTo(0, -size * 1.4);
  ctx.lineTo(size * 1.28, -size * 0.28);
  ctx.lineTo(size * 1.95, size * 0.18);
  ctx.lineTo(size * 0.72, size * 0.5);
  ctx.lineTo(size * 0.42, size * 1.2);
  ctx.lineTo(0, size * 0.76);
  ctx.lineTo(-size * 0.42, size * 1.2);
  ctx.lineTo(-size * 0.72, size * 0.5);
  ctx.lineTo(-size * 1.95, size * 0.18);
  ctx.lineTo(-size * 1.28, -size * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colorWithAlpha("#fff3d4", 0.76);
  ctx.beginPath();
  ctx.arc(0, size * 0.02, size * 0.34, 0, TAU);
  ctx.fill();
}

function drawLeviathanBoss(size, enemy) {
  ctx.fillStyle = enemy.hitFlash > 0 ? "#ffe0e7" : enemy.color;
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = Math.max(1.2, size * 0.05);

  ctx.beginPath();
  ctx.moveTo(0, -size * 1.65);
  ctx.lineTo(size * 0.96, -size * 0.86);
  ctx.lineTo(size * 1.65, -size * 0.14);
  ctx.lineTo(size * 1.12, size * 0.24);
  ctx.lineTo(size * 1.58, size * 1.0);
  ctx.lineTo(size * 0.46, size * 0.72);
  ctx.lineTo(0, size * 1.35);
  ctx.lineTo(-size * 0.46, size * 0.72);
  ctx.lineTo(-size * 1.58, size * 1.0);
  ctx.lineTo(-size * 1.12, size * 0.24);
  ctx.lineTo(-size * 1.65, -size * 0.14);
  ctx.lineTo(-size * 0.96, -size * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colorWithAlpha("#fff0f2", 0.84);
  ctx.beginPath();
  ctx.arc(0, -size * 0.1, size * 0.28, 0, TAU);
  ctx.fill();
}

function drawEnemyHealth(projected, enemy, size) {
  const width = Math.min(110, size * (enemy.boss ? 1.2 : 0.9));
  const y = projected.y - size * (enemy.boss ? 1.55 : 1.35);
  const x = projected.x - width * 0.5;
  ctx.fillStyle = "rgba(6, 12, 18, 0.55)";
  ctx.fillRect(x, y, width, 6);
  ctx.fillStyle = colorWithAlpha(enemy.color, 0.9);
  ctx.fillRect(x, y, width * clamp(enemy.hp / enemy.maxHp, 0, 1), 6);
}

function renderParticles() {
  const sorted = [...game.particles].sort((a, b) => b.z - a.z);

  for (const particle of sorted) {
    const projected = project(particle.x, particle.y, particle.z, 1);
    if (!projected) {
      continue;
    }
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.strokeStyle = colorWithAlpha(particle.color, alpha * 0.8);
    ctx.fillStyle = colorWithAlpha(particle.color, alpha * 0.7);

    if (particle.kind === "ring") {
      ctx.lineWidth = Math.max(1, projected.scale * 3);
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, Math.max(4, particle.size * projected.scale), 0, TAU);
      ctx.stroke();
      continue;
    }

    const radius = Math.max(1.2, projected.scale * particle.size * 0.25);
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, radius, 0, TAU);
    ctx.fill();
  }
}

function reticleScreenPosition() {
  const projected = project(player.reticleX, player.reticleY, player.aimDepth, 1);
  if (projected) {
    return projected;
  }
  return { x: game.cx, y: game.cy };
}

function renderCrosshair() {
  const reticle = reticleScreenPosition();
  const size = 18 + (player.overdrive ? 4 : 0);
  ctx.strokeStyle = player.overheated ? "rgba(255, 182, 106, 0.9)" : "rgba(142, 244, 255, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(reticle.x - size, reticle.y);
  ctx.lineTo(reticle.x - 6, reticle.y);
  ctx.moveTo(reticle.x + 6, reticle.y);
  ctx.lineTo(reticle.x + size, reticle.y);
  ctx.moveTo(reticle.x, reticle.y - size);
  ctx.lineTo(reticle.x, reticle.y - 6);
  ctx.moveTo(reticle.x, reticle.y + 6);
  ctx.lineTo(reticle.x, reticle.y + size);
  ctx.stroke();

  if (player.lockTarget && !player.lockTarget.dead) {
    const projected = project(player.lockTarget.x, player.lockTarget.y, player.lockTarget.z, 1);
    if (projected) {
      const radius = Math.max(18, projected.scale * (player.lockTarget.radius + 6));
      ctx.strokeStyle = "rgba(255, 208, 126, 0.94)";
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radius, 0, TAU);
      ctx.stroke();
    }
  }
}

function renderCockpit() {
  const panelGradient = ctx.createLinearGradient(0, game.height * 0.72, 0, game.height);
  panelGradient.addColorStop(0, "rgba(3, 8, 12, 0)");
  panelGradient.addColorStop(1, "rgba(6, 14, 22, 0.82)");
  ctx.fillStyle = panelGradient;
  ctx.fillRect(0, game.height * 0.7, game.width, game.height * 0.3);

  ctx.fillStyle = "rgba(5, 12, 18, 0.82)";
  ctx.beginPath();
  ctx.moveTo(0, game.height);
  ctx.lineTo(0, game.height * 0.78);
  ctx.lineTo(game.width * 0.2, game.height * 0.68);
  ctx.lineTo(game.width * 0.34, game.height);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(game.width, game.height);
  ctx.lineTo(game.width, game.height * 0.78);
  ctx.lineTo(game.width * 0.8, game.height * 0.68);
  ctx.lineTo(game.width * 0.66, game.height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(143, 244, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(game.width * 0.2, game.height * 0.68);
  ctx.lineTo(game.width * 0.34, game.height);
  ctx.moveTo(game.width * 0.8, game.height * 0.68);
  ctx.lineTo(game.width * 0.66, game.height);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 194, 116, 0.18)";
  ctx.beginPath();
  ctx.arc(game.cx, game.height + 40, 240, Math.PI, Math.PI * 2);
  ctx.stroke();
}

function renderMessages() {
  const message = game.messages[game.messages.length - 1];
  if (message) {
    const alpha = clamp(message.time / Math.min(message.life, 1.2), 0, 1);
    ctx.fillStyle = colorWithAlpha(message.color, alpha);
    ctx.font = '700 18px Bahnschrift, "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(message.text, game.cx, 80);
  }
}

function updateHud() {
  const theme = currentTheme();
  document.documentElement.style.setProperty("--accent", theme.accent);

  ui.sectorName.textContent = game.sector ? game.sector.name : "Hangar";
  ui.objectiveText.textContent = objectiveText();
  ui.highScoreText.textContent = formatNumber(game.highScore);
  ui.healthText.textContent = `${Math.round(player.health)}%`;
  ui.shieldText.textContent = `${Math.round(player.shield)}%`;
  ui.heatText.textContent = `${Math.round(player.heat)}%`;
  ui.driveText.textContent = `${Math.round(player.drive)}%`;
  ui.scoreText.textContent = formatNumber(game.score);
  ui.comboText.textContent = `x${player.combo.toFixed(1)}`;
  ui.missileText.textContent = `${player.missiles}`;
  ui.killsText.textContent = formatNumber(game.kills);
  ui.messageText.textContent = statusText();

  ui.healthFill.style.transform = `scaleX(${clamp(player.health / player.maxHealth, 0, 1)})`;
  ui.shieldFill.style.transform = `scaleX(${clamp(player.shield / player.maxShield, 0, 1)})`;
  ui.heatFill.style.transform = `scaleX(${clamp(player.heat / 100, 0, 1)})`;
  ui.driveFill.style.transform = `scaleX(${clamp(player.drive / player.maxDrive, 0, 1)})`;

  if (game.bossTarget) {
    ui.bossPanel.hidden = false;
    ui.bossName.textContent = game.bossTarget.name;
    ui.bossHealthText.textContent = `${Math.max(0, Math.round((game.bossTarget.hp / game.bossTarget.maxHp) * 100))}%`;
    ui.bossFill.style.transform = `scaleX(${clamp(game.bossTarget.hp / game.bossTarget.maxHp, 0, 1)})`;
  } else {
    ui.bossPanel.hidden = true;
  }

  updateOverlayButtons();
}

function objectiveText() {
  if (game.mode === "title") {
    return "Awaiting pilot launch authorization";
  }
  if (game.mode === "paused") {
    return "Mission suspended";
  }
  if (game.mode === "gameover") {
    return "Strike package lost";
  }
  if (game.mode === "victory") {
    return "Rift gate sealed";
  }
  if (game.bossTarget) {
    return `Destroy ${game.bossTarget.name}`;
  }
  if (game.intermission > 0) {
    return "Rearming and aligning for the next jump";
  }
  return game.sector ? game.sector.brief : "Hold formation";
}

function statusText() {
  if (game.mode === "title") {
    return "Space or left click fires. Right click or X launches missiles.";
  }
  if (player.overheated) {
    return "Cannons overheated. Ease off the trigger to vent heat.";
  }
  if (player.overdrive) {
    return "Overdrive online. Weapons and shield recharge are boosted.";
  }
  if (player.shield < 25) {
    return "Shield critical. Break line-of-fire and recover.";
  }
  if (player.drive >= 30) {
    return "Drive charged. Tap Shift or the Drive button to overdrive.";
  }
  return "Shift activates Overdrive once the drive meter is ready.";
}

init();
