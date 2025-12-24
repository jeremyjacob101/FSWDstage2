const GAME_CONFIG = {
  gravity: 980,
  jumpVelocity: -340,
  pipeGap: 150,
  pipeSpawnEvery: 1300,
  pipeWidth: 70,
  birdRadius: 12,
};

const RAMP = {
  intervalMs: 5000,
  speedMultiplier: 1.1,
};

// Globals
const MIN_SCROLL_SPEED = 180;
const MAX_SCROLL_SPEED = 820;
const START_SCROLL_SPEED = 210;

let gameActive = false;
let score = 0;
let bestScore = 0;
let prevFrameTimestampMs = 0;
let reqAnimFrameId = null;
let pipes = [];
let pipeSpawnTimer = null;
let rampTimer = null;
let currentScrollSpeed = START_SCROLL_SPEED;
let level = 1;
let isExpert = false;
let levelBannerEl = null;
let levelBannerHideTimer = null;
let bird = {
  x: 0,
  y: 0,
  vy: 0,
  radius: GAME_CONFIG.birdRadius,
};
let viewWidth = 0;
let viewHeight = 0;
let pixelRatio = 1;
let levelBadgeEl = null;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// DOM Stuff
const startBtn = document.getElementById("game-start-btn");
const scoreDisplay = document.getElementById("game-score");
const bestScoreDisplay = document.getElementById("game-best-score");
const gameArea = document.querySelector(".game-area-wrapper .game-area");
const canvas = document.getElementById("jumpy-canvas");
const drawingContext = canvas.getContext("2d");
const instructionsEl = gameArea.querySelector(".game-instructions");

// Initialization
ensureLevelBadge();
ensureLevelBanner();
fitCanvas();
resetBird();

loadBestScore();
updateScoreDisplay();
setLevelUI();
draw();

window.addEventListener("resize", () => {
  fitCanvas();
  resetBird();
  draw();
});

startBtn.addEventListener("click", () => {
  if (!gameActive) startGame();
  else endGame(true);
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
});

// Game Flow
function startGame() {
  score = 0;
  pipes = [];
  gameActive = true;

  // Reset level and speed each time
  level = 1;
  isExpert = false;
  currentScrollSpeed = START_SCROLL_SPEED;

  // Update stats
  updateScoreDisplay();
  loadBestScore();
  setLevelUI();

  // Update UI
  startBtn.textContent = "Stop Game";
  startBtn.classList.remove("primary-btn");
  startBtn.classList.add("secondary-btn");
  if (instructionsEl) instructionsEl.style.display = "none";

  // Start game loop
  resetBird();
  scheduleNextPipe();
  startRampTimer();
  prevFrameTimestampMs = performance.now();
  reqAnimFrameId = requestAnimationFrame(loop);
}

// Update Game Flow
function loop(timeStamp) {
  if (!gameActive) return;

  const timeDifference = Math.min(
    0.033,
    (timeStamp - prevFrameTimestampMs) / 1000
  );
  prevFrameTimestampMs = timeStamp;

  update(timeDifference);
  draw();

  reqAnimFrameId = requestAnimationFrame(loop);
}

function update(timeDifference) {
  // Bird physics
  bird.vy += GAME_CONFIG.gravity * timeDifference;
  bird.y += bird.vy * timeDifference;

  // Ceiling
  if (bird.y - bird.radius <= 0) {
    bird.y = bird.radius;
    bird.vy = 0;
  }

  // Floor gives a 'crash'
  if (bird.y + bird.radius >= viewHeight) {
    bird.y = viewHeight - bird.radius;
    triggerCrash();
    return;
  }

  // Move pipes
  for (const pipe of pipes) {
    pipe.x -= currentScrollSpeed * timeDifference;

    // Score when bird passes pipe
    if (!pipe.scored && pipe.x + pipe.width < bird.x) {
      pipe.scored = true;
      score += 1;
      updateScoreDisplay();
    }
  }

  // Remove offscreen pipes
  pipes = pipes.filter((pipe) => pipe.x + pipe.width > -10);

  // Collisions
  for (const pipe of pipes) {
    if (checkPipeCollision(pipe)) {
      triggerCrash();
      return;
    }
  }
}

function draw() {
  drawingContext.fillStyle = "#cfe9ff"; // Background
  drawingContext.fillRect(0, 0, viewWidth, viewHeight);

  drawingContext.fillStyle = "#2e7d32"; // Pipes
  for (const p of pipes) {
    drawingContext.fillRect(p.x, 0, p.width, p.gapTop);

    const bottomY = p.gapTop + p.gap;
    drawingContext.fillRect(p.x, bottomY, p.width, viewHeight - bottomY);
  }

  drawingContext.fillStyle = "#ffeb3b"; // Bird
  drawingContext.beginPath();
  drawingContext.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
  drawingContext.fill();

  drawingContext.strokeStyle = "#111"; // Border
  drawingContext.lineWidth = 2;
  drawingContext.stroke();
}

function jump() {
  if (!gameActive) return;
  bird.vy = GAME_CONFIG.jumpVelocity;
}

// Pipes
function scheduleNextPipe() {
  if (!gameActive) return;

  spawnPipe();

  pipeSpawnTimer = setTimeout(() => {
    scheduleNextPipe();
  }, GAME_CONFIG.pipeSpawnEvery);
}

function spawnPipe() {
  const width = GAME_CONFIG.pipeWidth;
  const gap = GAME_CONFIG.pipeGap;

  const margin = 30;
  const minGapTop = margin;
  const maxGapTop = Math.max(minGapTop, viewHeight - gap - margin);

  const gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;

  pipes.push({
    x: viewWidth + 10,
    width: width,
    gapTop: gapTop,
    gap: gap,
    scored: false,
  });
}

// Level Logic
function startRampTimer() {
  if (rampTimer) clearInterval(rampTimer);

  rampTimer = setInterval(() => {
    if (!gameActive || isExpert) return;

    const nextSpeed = clamp(
      currentScrollSpeed * RAMP.speedMultiplier,
      MIN_SCROLL_SPEED,
      MAX_SCROLL_SPEED
    );
    currentScrollSpeed = nextSpeed;

    if (
      Math.abs(currentScrollSpeed - MAX_SCROLL_SPEED) < 0.01 ||
      currentScrollSpeed >= MAX_SCROLL_SPEED
    ) {
      isExpert = true;
      setLevelUI();
      showLevelBanner("Level: EXPERT");
    } else {
      level += 1;
      setLevelUI();
      showLevelBanner(`Level: ${level}`);
    }
  }, RAMP.intervalMs);
}

function showLevelBanner(text) {
  if (!levelBannerEl) return;

  levelBannerEl.textContent = text;
  levelBannerEl.classList.add("show");

  if (levelBannerHideTimer) clearTimeout(levelBannerHideTimer);
  levelBannerHideTimer = setTimeout(() => {
    levelBannerEl.classList.remove("show");
  }, 1200);
}

// Crashing Logic
function checkPipeCollision(pipe) {
  const topRect = { x: pipe.x, y: 0, w: pipe.width, h: pipe.gapTop };
  const bottomY = pipe.gapTop + pipe.gap;
  const bottomRect = {
    x: pipe.x,
    y: bottomY,
    w: pipe.width,
    h: viewHeight - bottomY,
  };

  return (
    circleRectCollision(bird.x, bird.y, bird.radius, topRect) ||
    circleRectCollision(bird.x, bird.y, bird.radius, bottomRect)
  );
}

function circleRectCollision(circleX, circleY, radius, rect) {
  const closestX = clamp(circleX, rect.x, rect.x + rect.w);
  const closestY = clamp(circleY, rect.y, rect.y + rect.h);
  const dx = circleX - closestX;
  const dy = circleY - closestY;
  // Sqrt(dx^2+dy^2) <= r ? collision : no collision)
  return dx * dx + dy * dy <= radius * radius;
}

function triggerCrash() {
  endGame(true);
}

// Resize Canvas
function fitCanvas() {
  const rect = gameArea.getBoundingClientRect();

  viewWidth = Math.max(320, Math.floor(rect.width));
  viewHeight = Math.max(280, Math.floor(rect.height));

  canvas.style.width = viewWidth + "px";
  canvas.style.height = viewHeight + "px";

  canvas.width = viewWidth * pixelRatio;
  canvas.height = viewHeight * pixelRatio;

  bird.x = Math.floor(viewWidth * 0.28);
}

function resetBird() {
  bird.x = Math.floor(viewWidth * 0.28);
  bird.y = Math.floor(viewHeight * 0.5);
  bird.vy = 0;
}

function clampBirdInside() {
  bird.x = clamp(bird.x, bird.radius, viewWidth - bird.radius);
  bird.y = clamp(bird.y, bird.radius, viewHeight - bird.radius);
}

// Level Badge UI
function ensureLevelBadge() {
  levelBadgeEl = document.getElementById("level-badge");
  if (levelBadgeEl) return;

  levelBadgeEl = document.createElement("div");
  levelBadgeEl.id = "level-badge";
  levelBadgeEl.textContent = "Level: 1";
  gameArea.appendChild(levelBadgeEl);
}

function ensureLevelBanner() {
  levelBannerEl = document.getElementById("level-banner");
  if (levelBannerEl) return;

  levelBannerEl = document.createElement("div");
  levelBannerEl.id = "level-banner";
  gameArea.appendChild(levelBannerEl);
}

function setLevelUI() {
  if (!levelBadgeEl) return;

  if (isExpert) {
    levelBadgeEl.textContent = "Level: EXPERT";
    levelBadgeEl.classList.add("expert");
  } else {
    levelBadgeEl.textContent = `Level: ${level}`;
    levelBadgeEl.classList.remove("expert");
  }
}

function endGame(showAlert) {
  gameActive = false;

  // Reset timeouts and variables
  if (pipeSpawnTimer) clearTimeout(pipeSpawnTimer);
  if (levelBannerHideTimer) clearTimeout(levelBannerHideTimer);
  if (reqAnimFrameId) cancelAnimationFrame(reqAnimFrameId);
  if (rampTimer) clearInterval(rampTimer);

  reqAnimFrameId = null;
  pipeSpawnTimer = null;
  rampTimer = null;
  levelBannerHideTimer = null;
  
  // Update UI
  if (levelBannerEl) levelBannerEl.classList.remove("show");
  if (instructionsEl) instructionsEl.style.display = "block";
  startBtn.textContent = "Start Game";
  startBtn.classList.add("primary-btn");
  startBtn.classList.remove("secondary-btn");

  // Reset to Level 1 when in end screen
  level = 1;
  isExpert = false;
  currentScrollSpeed = START_SCROLL_SPEED;
  setLevelUI();
  draw();

  saveBestScore();
  if (showAlert) {
    alert(`Game Over!\n\nScore: ${score}\nBest: ${bestScore}`);
  }
}

// Score
function updateScoreDisplay() {
  scoreDisplay.textContent = String(score);
  bestScoreDisplay.textContent = String(bestScore);
}

function loadBestScore() {
  const session = JSON.parse(localStorage.getItem("session"));
  if (!session) return;

  const key = `${session.username}-game2-best`;
  bestScore = parseInt(localStorage.getItem(key) || "0");
  bestScoreDisplay.textContent = String(bestScore);
}

function saveBestScore() {
  const session = JSON.parse(localStorage.getItem("session"));
  if (!session) return;

  const key = `${session.username}-game2-best`;
  const currentBest = parseInt(localStorage.getItem(key) || "0");

  if (score > currentBest) {
    localStorage.setItem(key, String(score));
    bestScoreDisplay.textContent = score;
  }

  updateGlobalLeaderboard(session.username, score);
}

function updateGlobalLeaderboard(username, newScore) {
  const LEADERBOARD_KEY = "leaderboard_data";
  let data = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "{}");

  if (!data.game_2) {
    data.game_2 = { title: "Game 2", scores: [] };
  }

  data.game_2.scores.push({
    username: username,
    score: newScore,
    date: new Date().toISOString(),
  });

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
}
