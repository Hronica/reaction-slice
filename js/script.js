const menu = document.querySelector("#menu");
const reactionPanel = document.querySelector("#reactionPanel");
const arcadePanel = document.querySelector("#arcadePanel");
const reactionModeBtn = document.querySelector("#reactionModeBtn");
const arcadeModeBtn = document.querySelector("#arcadeModeBtn");
const backButtons = document.querySelectorAll("[data-back]");

const reactionButton = document.querySelector("#reactionButton");
const reactionResult = document.querySelector("#reactionResult");

const arena = document.querySelector("#arena");
const arenaMessage = document.querySelector("#arenaMessage");
const startArcadeBtn = document.querySelector("#startArcadeBtn");
const scoreEl = document.querySelector("#score");
const hpEl = document.querySelector("#hp");
const bestScoreEl = document.querySelector("#bestScore");
const flashEffect = document.querySelector("#flashEffect");
const screamer = document.querySelector("#screamer");
const bladeTrail = document.querySelector("#bladeTrail");

const arcadeMusic = new Audio("assets/arcade-music.wav");
arcadeMusic.loop = true;
arcadeMusic.volume = 0.22;

const flashbangSound = new Audio("assets/flashbang.mp3");
flashbangSound.volume = 0.6;

const screamerSound = new Audio("assets/screamer.mp3");
screamerSound.volume = 0.85;



let lastPointerX = 0;
let lastPointerY = 0;
let lastPointerTime = 0;
let bladeHideTimer = null;

document.addEventListener("pointermove", (event) => {
  if (!bladeTrail) return;

  const now = performance.now();
  const dx = event.clientX - lastPointerX;
  const dy = event.clientY - lastPointerY;
  const dt = Math.max(now - lastPointerTime, 16);
  const pointerSpeed = Math.hypot(dx, dy) / dt;

  bladeTrail.style.left = `${event.clientX}px`;
  bladeTrail.style.top = `${event.clientY}px`;
  bladeTrail.classList.add("active");
  bladeTrail.classList.toggle("fast", pointerSpeed > 1.2);

  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  lastPointerTime = now;

  clearTimeout(bladeHideTimer);
  bladeHideTimer = setTimeout(() => {
    bladeTrail.classList.remove("active", "fast");
  }, 140);
});

function playVfxSound(type) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    if (type === "slice") {
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(760, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(320, context.currentTime + 0.08);
      gain.gain.setValueAtTime(0.035, context.currentTime);
    }

    if (type === "bomb") {
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(110, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(55, context.currentTime + 0.13);
      gain.gain.setValueAtTime(0.055, context.currentTime);
    }

    if (type === "flash") {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(980, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1680, context.currentTime + 0.1);
      gain.gain.setValueAtTime(0.028, context.currentTime);
    }

    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.14);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
  } catch (error) {
    // Sound is optional. Some browsers block it before user interaction.
  }
}

function shakeScreen() {
  arena.classList.remove("screen-shake");
  void arena.offsetWidth;
  arena.classList.add("screen-shake");
}

function createSliceParticles(x, y, type = "normal") {
  const particleColor = type === "heal" ? "#48ff8d" : "#ffad2f";

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("span");
    particle.className = "slice-particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.background = particleColor;
    arena.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const speed = 2.4 + Math.random() * 5.6;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let life = 26 + Math.random() * 10;

    function animateParticle() {
      life -= 1;
      vx *= 0.97;
      vy = vy * 0.97 + 0.08;

      const currentX = parseFloat(particle.style.left);
      const currentY = parseFloat(particle.style.top);

      particle.style.left = `${currentX + vx}px`;
      particle.style.top = `${currentY + vy}px`;
      particle.style.opacity = `${Math.max(life / 34, 0)}`;
      particle.style.transform = `scale(${Math.max(life / 34, 0.25)})`;

      if (life > 0) {
        requestAnimationFrame(animateParticle);
      } else {
        particle.remove();
      }
    }

    animateParticle();
  }
}

function createSplitEffect(item) {
  if (item.type !== "normal" && item.type !== "heal") return;

  const rect = arena.getBoundingClientRect();
  const x = item.x;
  const y = item.y;
  const icon = item.el.textContent || (item.type === "heal" ? "❤️" : "🍉");
  const halfSize = Math.max(item.size * 0.72, 38);

  for (const side of [-1, 1]) {
    const half = document.createElement("span");
    half.className = `slice-half slice-half--${item.type}`;
    half.style.setProperty("--half-size", `${halfSize}px`);
    half.textContent = icon;
    half.style.left = `${x}px`;
    half.style.top = `${y}px`;
    arena.appendChild(half);

    let vx = side * (3.2 + Math.random() * 2.6);
    let vy = -3.8 - Math.random() * 1.6;
    let rotation = 0;
    let life = 42;

    function animateHalf() {
      life -= 1;
      vy += 0.18;
      const currentX = parseFloat(half.style.left);
      const currentY = parseFloat(half.style.top);

      half.style.left = `${currentX + vx}px`;
      half.style.top = `${currentY + vy}px`;
      rotation += side * 9;
      half.style.opacity = `${Math.max(life / 42, 0)}`;
      half.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${0.78 + life / 170})`;

      if (life > 0) {
        requestAnimationFrame(animateHalf);
      } else {
        half.remove();
      }
    }

    animateHalf();
  }

  createSliceParticles(x, y, item.type);
}

let reactionTimer = null;
let reactionStart = 0;
let reactionState = "idle";

let arcade = {
  running: false,
  score: 0,
  hp: 3,
  paused: false,
  startTime: 0,
  lastFrame: 0,
  waveTimer: 0,
  items: [],
  animationId: null
};

const bestKey = "reaction-slice-best-score";
bestScoreEl.textContent = localStorage.getItem(bestKey) || "0";

class GameSettings {
  constructor() {
    this.difficulty = "normal";
    this.startHp = 3;
    this.musicVolume = 22;
    this.sfxVolume = 70;
  }

  get speedMultiplier() {
    if (this.difficulty === "easy") return 0.82;
    if (this.difficulty === "hard") return 1.18;
    return 1;
  }

  get label() {
    return `${this.difficulty.toUpperCase()} · ${this.startHp} HP · speed x${this.speedMultiplier.toFixed(2)}`;
  }
}

class GameItem {
  constructor(data) {
    Object.assign(this, data);
  }

  isOutside(rect) {
    return (
      this.y > rect.height + 120 ||
      this.x < -140 ||
      this.x > rect.width + 140 ||
      this.y < -180
    );
  }
}

const gameSettings = new GameSettings();

const gameSettingsForm = document.querySelector("#gameSettingsForm");
const difficultySelect = document.querySelector("#difficultySelect");
const startHpSelect = document.querySelector("#startHpSelect");
const musicVolumeRange = document.querySelector("#musicVolumeRange");
const settingsSummary = document.querySelector("#settingsSummary");
const pauseArcadeBtn = document.querySelector("#pauseArcadeBtn");
const themeToggleBtn = document.querySelector("#globalThemeToggleBtn");
const loadTipsBtn = document.querySelector("#loadTipsBtn");
const tipsBox = document.querySelector("#tipsBox");

function updateSettingsFromForm() {
  if (!gameSettingsForm) return;

  gameSettings.difficulty = difficultySelect.value;
  gameSettings.startHp = Number(startHpSelect.value);
  gameSettings.musicVolume = Number(musicVolumeRange.value);
  gameSettings.sfxVolume = 70;

  if (typeof arcadeMusic !== "undefined") arcadeMusic.volume = gameSettings.musicVolume / 100;
  if (typeof flashbangSound !== "undefined") flashbangSound.volume = gameSettings.sfxVolume / 100;
  if (typeof screamerSound !== "undefined") screamerSound.volume = Math.min(gameSettings.sfxVolume / 100 + 0.15, 1);

  settingsSummary.textContent = gameSettings.label;
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("reaction-slice-theme") || "dark";
  document.body.classList.toggle("light-theme", savedTheme === "light");
  if (themeToggleBtn) {
    themeToggleBtn.textContent = savedTheme === "light" ? "Тёмная тема" : "Светлая тема";
  }
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
  localStorage.setItem("reaction-slice-theme", nextTheme);
  applySavedTheme();
}

async function loadGameTips() {
  if (!tipsBox) return;

  if (!tipsBox.hidden) {
    tipsBox.hidden = true;
    tipsBox.innerHTML = "";
    loadTipsBtn.textContent = "Загрузить советы";
    return;
  }

  try {
    const response = await fetch("data/tips.json");
    if (!response.ok) throw new Error("Tips loading failed");

    const tips = await response.json();
    tipsBox.hidden = false;
    loadTipsBtn.textContent = "Скрыть советы";
    tipsBox.innerHTML = `
      <strong>Советы по игре</strong>
      <ul>${tips.map((tip) => `<li>${tip}</li>`).join("")}</ul>
    `;
  } catch (error) {
    tipsBox.hidden = false;
    loadTipsBtn.textContent = "Скрыть советы";
    tipsBox.textContent = "Не удалось загрузить советы. Проверь запуск через Live Server или GitHub Pages.";
  }
}

function togglePause() {
  if (!arcade.running && !arcade.paused) return;

  arcade.paused = !arcade.paused;

  if (arcade.paused) {
    pauseArcadeBtn.textContent = "Продолжить";
    arena.classList.add("paused");
    arcadeMusic.pause();
  } else {
    pauseArcadeBtn.textContent = "Пауза";
    arena.classList.remove("paused");
    arena.classList.remove("paused");
    arcade.lastFrame = performance.now();
    arcadeMusic.play().catch(() => {});
    arcade.animationId = requestAnimationFrame(loopArcade);
  }
}

if (gameSettingsForm) gameSettingsForm.addEventListener("input", updateSettingsFromForm);
if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
if (loadTipsBtn) loadTipsBtn.addEventListener("click", loadGameTips);
if (pauseArcadeBtn) pauseArcadeBtn.addEventListener("click", togglePause);

applySavedTheme();
updateSettingsFromForm();


function showPanel(panel) {
  menu.classList.add("hidden");
  reactionPanel.classList.add("hidden");
  arcadePanel.classList.add("hidden");
  panel.classList.remove("hidden");
}

function showMenu() {
  stopArcade();
  clearTimeout(reactionTimer);
  reactionState = "idle";
  reactionButton.textContent = "Старт";
  reactionButton.className = "reaction-button";
  menu.classList.remove("hidden");
  reactionPanel.classList.add("hidden");
  arcadePanel.classList.add("hidden");
}

reactionModeBtn.addEventListener("click", () => showPanel(reactionPanel));
arcadeModeBtn.addEventListener("click", () => showPanel(arcadePanel));
backButtons.forEach((btn) => btn.addEventListener("click", showMenu));

reactionButton.addEventListener("click", () => {
  if (reactionState === "idle") {
    reactionState = "waiting";
    reactionButton.textContent = "Жди зелёный...";
    reactionButton.className = "reaction-button waiting";
    reactionResult.textContent = "Не жми раньше времени";

    const delay = 1400 + Math.random() * 2600;
    reactionTimer = setTimeout(() => {
      reactionState = "ready";
      reactionStart = performance.now();
      reactionButton.textContent = "ЖМИ!";
      reactionButton.className = "reaction-button ready";
    }, delay);
    return;
  }

  if (reactionState === "waiting") {
    clearTimeout(reactionTimer);
    reactionState = "idle";
    reactionButton.textContent = "Старт";
    reactionButton.className = "reaction-button";
    reactionResult.textContent = "Рано! Попробуй ещё раз.";
    return;
  }

  if (reactionState === "ready") {
    const time = Math.round(performance.now() - reactionStart);
    reactionState = "idle";
    reactionButton.textContent = "Повторить";
    reactionButton.className = "reaction-button";
    reactionResult.textContent = `Твоя реакция: ${time} мс`;
  }
});

function difficulty() {
  const seconds = (performance.now() - arcade.startTime) / 1000;
  const t = Math.min(seconds / 180, 1);
  const smooth = t * t * (3 - 2 * t);

  return {
    seconds,
    smooth,
    speed: (145 + smooth * 275) * gameSettings.speedMultiplier,
    gravity: (105 + smooth * 120) * gameSettings.speedMultiplier,
    waveEvery: (1700 - smooth * 850) / gameSettings.speedMultiplier,
    size: 90 - smooth * 31,
    specialChance: seconds < 10 ? 0 : Math.min(0.07 + smooth * 0.24, 0.31)
  };
}

function getWaveCount(diff) {
  // Первые секунды спокойно. Потом чаще вылетает по 2, дальше 3–5 за волну.
  const s = diff.seconds;
  const r = Math.random();

  if (s < 8) return 1;
  if (s < 24) return r < 0.70 ? 1 : 2;
  if (s < 55) return r < 0.20 ? 1 : r < 0.85 ? 2 : 3;
  if (s < 100) return r < 0.10 ? 2 : r < 0.78 ? 3 : 4;
  if (s < 150) return r < 0.18 ? 3 : r < 0.82 ? 4 : 5;
  return r < 0.25 ? 4 : 5;
}

function pickType(diff, indexInWave) {
  // В начале пачки идут в основном обычные. Особые подмешиваются плавно.
  if (Math.random() > diff.specialChance) return "normal";

  const roll = Math.random();
  if (roll < 0.38) return "bomb";
  if (roll < 0.62) return "flash";
  if (roll < 0.84) return "curse";
  return "heal";
}

function createWave() {
  const diff = difficulty();
  const count = getWaveCount(diff);

  for (let i = 0; i < count; i++) {
    // Маленькая задержка между предметами в пачке, чтобы они не спавнились идеально в одну точку.
    setTimeout(() => {
      if (arcade.running) createItem(pickType(diff, i), i, count);
    }, i * (95 + Math.random() * 80));
  }
}

function createItem(forcedType = "normal", indexInWave = 0, waveCount = 1) {
  const rect = arena.getBoundingClientRect();
  const diff = difficulty();
  const type = forcedType;

  const sideRoll = Math.random();
  let x, y, vx, vy;

  const spread = waveCount > 1 ? (indexInWave - (waveCount - 1) / 2) * 70 : 0;

  if (sideRoll < 0.72) {
    x = Math.max(60, Math.min(rect.width - 60, 80 + Math.random() * (rect.width - 160) + spread));
    y = rect.height + 70;
    const targetX = rect.width * (0.22 + Math.random() * 0.56);
    vx = (targetX - x) * (0.18 + Math.random() * 0.12);
    vy = -(diff.speed + 100 + Math.random() * 80);
  } else if (sideRoll < 0.86) {
    x = -70;
    y = rect.height * (0.38 + Math.random() * 0.36) + spread * 0.35;
    vx = diff.speed * (0.85 + Math.random() * 0.35);
    vy = -(diff.speed * (0.45 + Math.random() * 0.35));
  } else {
    x = rect.width + 70;
    y = rect.height * (0.38 + Math.random() * 0.36) + spread * 0.35;
    vx = -diff.speed * (0.85 + Math.random() * 0.35);
    vy = -(diff.speed * (0.45 + Math.random() * 0.35));
  }

  const size = diff.size + Math.random() * 12;
  const el = document.createElement("button");
  el.type = "button";
  el.className = `item item--${type}`;
  el.style.setProperty("--size", `${size}px`);

  const icon = {
    normal: ["🍉", "🍊", "🍋", "🍎", "🥝"][Math.floor(Math.random() * 5)],
    bomb: "💣",
    heal: "❤️",
    curse: "👁"
  };

  if (type === "flash") {
    el.innerHTML = `<img src="assets/flashbang.png" alt="flashbang">`;
  } else {
    el.textContent = icon[type];
  }

  arena.appendChild(el);

  const item = new GameItem({
    el,
    type,
    x,
    y,
    vx,
    vy,
    gravity: diff.gravity,
    size,
    clicked: false,
    escaped: false,
    rotation: Math.random() * 20 - 10,
    spin: Math.random() * 50 - 25
  });

  el.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    hitItem(item);
  }, { passive: false });

  arcade.items.push(item);
}

function hitItem(item) {
  if (!arcade.running || item.clicked) return;
  item.clicked = true;

  if (item.type === "normal") {
    arcade.score += 10;
    createSplitEffect(item);
    playVfxSound("slice");
  }

  if (item.type === "bomb") {
    arcade.hp -= 1;
    shakeScreen();
    playVfxSound("bomb");
  }

  if (item.type === "heal") {
    arcade.hp = Math.min(3, arcade.hp + 1);
    arcade.score += 5;
    createSplitEffect(item);
    playVfxSound("slice");
  }

  if (item.type === "flash") {
    arcade.score += 5;
    flashbangSound.currentTime = 0;
    flashbangSound.play().catch(() => {});
    shakeScreen();
    flashEffect.classList.add("active");
    setTimeout(() => flashEffect.classList.remove("active"), 900);
  }

  if (item.type === "curse") {
    arcade.score += 3;
    shakeScreen();

    screamerSound.currentTime = 0;
    screamerSound.play().catch(() => {});

    screamer.classList.add("active");

    setTimeout(() => {
      screamer.classList.remove("active");
    }, 1200);
  }

  item.el.remove();
  updateHud();

  if (arcade.hp <= 0) {
    endArcade();
  }
}

function updateHud() {
  scoreEl.textContent = arcade.score;
  hpEl.textContent = arcade.hp;
}

function startArcade() {
  stopArcade();

  arcade = {
    running: true,
    score: 0,
    hp: gameSettings.startHp,
    paused: false,
    startTime: performance.now(),
    lastFrame: performance.now(),
    waveTimer: 500,
    items: [],
    animationId: null
  };

  updateSettingsFromForm();
  updateHud();
  if (pauseArcadeBtn) {
    pauseArcadeBtn.disabled = false;
    pauseArcadeBtn.textContent = "Пауза";
  }
  arenaMessage.classList.add("hidden");

  arcadeMusic.currentTime = 0;
  arcadeMusic.play().catch(() => {});

  arcade.animationId = requestAnimationFrame(loopArcade);
}

function stopArcade() {
  if (arcade.animationId) cancelAnimationFrame(arcade.animationId);
  arcade.items?.forEach((item) => item.el.remove());
  arcade.running = false;
  arcade.paused = false;
  arcade.items = [];
  arena.classList.remove("paused");
  if (pauseArcadeBtn) {
    pauseArcadeBtn.disabled = true;
    pauseArcadeBtn.textContent = "Пауза";
  }

  arcadeMusic.pause();
  arcadeMusic.currentTime = 0;
}

function endArcade() {
  arcade.running = false;
  arcade.paused = false;
  if (pauseArcadeBtn) {
    pauseArcadeBtn.disabled = true;
    pauseArcadeBtn.textContent = "Пауза";
  }

  const best = Number(localStorage.getItem(bestKey) || 0);
  if (arcade.score > best) {
    localStorage.setItem(bestKey, arcade.score);
    bestScoreEl.textContent = arcade.score;
  }

  arenaMessage.classList.remove("hidden");
  arenaMessage.innerHTML = `
    <strong>Игра окончена</strong>
    <span>Твой результат: ${arcade.score} очков</span>
    <button class="primary-btn" id="restartArcadeBtn">Заново</button>
  `;
  document.querySelector("#restartArcadeBtn").addEventListener("click", startArcade);
}

function loopArcade(now) {
  if (!arcade.running || arcade.paused) return;

  const dt = Math.min((now - arcade.lastFrame) / 1000, 0.033);
  arcade.lastFrame = now;

  const diff = difficulty();
  arcade.waveTimer -= dt * 1000;

  if (arcade.waveTimer <= 0) {
    createWave();
    arcade.waveTimer = diff.waveEvery + Math.random() * 360;
  }

  const rect = arena.getBoundingClientRect();

  for (const item of [...arcade.items]) {
    item.vy += item.gravity * dt;
    item.x += item.vx * dt;
    item.y += item.vy * dt;
    item.rotation += item.spin * dt;

    item.el.style.transform = `translate(${item.x}px, ${item.y}px) translate(-50%, -50%) rotate(${item.rotation}deg)`;

    const outside = item.isOutside(rect);

    if (outside && !item.clicked) {
      item.escaped = true;
      item.el.remove();
      arcade.items = arcade.items.filter((active) => active !== item);

      if (item.type === "normal") {
        arcade.hp -= 1;
        updateHud();

        if (arcade.hp <= 0) {
          endArcade();
          return;
        }
      }
    }
  }

  arcade.animationId = requestAnimationFrame(loopArcade);
}

startArcadeBtn.addEventListener("click", startArcade);
