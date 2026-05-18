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

let reactionTimer = null;
let reactionStart = 0;
let reactionState = "idle";

let arcade = {
  running: false,
  score: 0,
  hp: 3,
  startTime: 0,
  lastFrame: 0,
  waveTimer: 0,
  items: [],
  animationId: null
};

const bestKey = "reaction-slice-best-score";
bestScoreEl.textContent = localStorage.getItem(bestKey) || "0";

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
    speed: 145 + smooth * 275,
    gravity: 105 + smooth * 120,
    waveEvery: 1700 - smooth * 850,
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

  const item = {
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
  };

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
  }

  if (item.type === "bomb") {
    arcade.hp -= 1;
  }

  if (item.type === "heal") {
    arcade.hp = Math.min(3, arcade.hp + 1);
    arcade.score += 5;
  }

  if (item.type === "flash") {
    arcade.score += 5;
    flashEffect.classList.add("active");
    setTimeout(() => flashEffect.classList.remove("active"), 900);
  }

  if (item.type === "curse") {
    arcade.score += 3;
    screamer.classList.add("active");
    setTimeout(() => screamer.classList.remove("active"), 700);
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
    hp: 3,
    startTime: performance.now(),
    lastFrame: performance.now(),
    waveTimer: 500,
    items: [],
    animationId: null
  };

  updateHud();
  arenaMessage.classList.add("hidden");
  arcade.animationId = requestAnimationFrame(loopArcade);
}

function stopArcade() {
  if (arcade.animationId) cancelAnimationFrame(arcade.animationId);
  arcade.items?.forEach((item) => item.el.remove());
  arcade.running = false;
  arcade.items = [];
}

function endArcade() {
  arcade.running = false;

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
  if (!arcade.running) return;

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

    const outside =
      item.y > rect.height + 120 ||
      item.x < -140 ||
      item.x > rect.width + 140 ||
      item.y < -180;

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
