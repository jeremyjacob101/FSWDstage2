const GAME_CONFIG = {
  easy: {
    targetSize: 100,
    targetDuration: 3000,
    spawnDelay: 1500,
    pointsPerHit: 10,
    missedPenalty: -5,
    backgroundColor: "#3DCF51",
  },
  medium: {
    targetSize: 70,
    targetDuration: 2000,
    spawnDelay: 1000,
    pointsPerHit: 20,
    missedPenalty: -10,
    backgroundColor: "#EE8921",
  },
  hard: {
    targetSize: 40,
    targetDuration: 1000,
    spawnDelay: 700,
    pointsPerHit: 50,
    missedPenalty: -20,
    backgroundColor: "#F25545",
  },
};

// Globals
let score = 0;
let bestScore = 0;
let gameActive = false;
let currentSettings = null;
let targetsHit = 0;
let targetsMissed = 0;
let spawnTimer = null; // To track and cancel the next spawn
let gameTimerInterval = null; // To track the countdown
let timeLeft = 30;
const GAME_DURATION = 30; // Seconds
let instructionsEl = document.querySelector(".game-instructions");
let gameStartTime = null; // Track game start time

// DOM Stuff
const startBtn = document.getElementById("game-start-btn");
const difficultySelect = document.getElementById("difficulty-select");
const scoreDisplay = document.getElementById("game-score");
const timerDisplay = document.getElementById("game-timer");
const bestScoreDisplay = document.getElementById("game-best-score");
const gameArea = document.querySelector(".game-area-wrapper .game-area"); // targeted selection

// Initial Load
if (difficultySelect) {
  loadBestScore(difficultySelect.value);

  difficultySelect.addEventListener("change", (e) => {
    loadBestScore(e.target.value);
  });
}

// Start Button Listener
startBtn.addEventListener("click", () => {
  if (!gameActive) {
    startGame();
  } else {
    endGame();
  }
});

// Game Flow
function startGame() {
  // Get difficulty
  const difficulty = difficultySelect.value;
  currentSettings = GAME_CONFIG[difficulty];

  // Reset state
  score = 0;
  targetsHit = 0;
  targetsMissed = 0;
  timeLeft = GAME_DURATION;
  gameActive = true;

  // Track game start
  if (typeof trackGameStart === "function") {
    gameStartTime = trackGameStart("game1");
  }

  // Update UI
  startBtn.textContent = "Stop Game";
  startBtn.classList.remove("primary-btn");
  startBtn.classList.add("secondary-btn");

  difficultySelect.disabled = true;
  if (instructionsEl) instructionsEl.style.display = "none";
  if (gameArea)
    gameArea.style.backgroundColor = currentSettings.backgroundColor;

  // Update stats
  updateScoreDisplay();
  updateTimerDisplay();
  loadBestScore(difficulty);

  // Start game loop
  spawnTarget();
  startTimer();
}

function startTimer() {
  gameTimerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function spawnTarget() {
  if (!gameActive) return;

  const target = document.createElement("div");
  target.className = "target";

  // Apply dynamic size based on difficulty
  target.style.width = currentSettings.targetSize + "px";
  target.style.height = currentSettings.targetSize + "px";

  // Random Position (Safe bounds)
  const maxX = gameArea.clientWidth - currentSettings.targetSize;
  const maxY = gameArea.clientHeight - currentSettings.targetSize;

  target.style.left = Math.max(0, Math.random() * maxX) + "px";
  target.style.top = Math.max(0, Math.random() * maxY) + "px";

  // Click Event
  target.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent bubbling if needed
    hitTarget(target);
  });

  // Add to DOM
  gameArea.appendChild(target);

  // Auto-remove after duration
  const removeTimer = setTimeout(() => {
    if (target.parentNode && gameActive) {
      target.remove();
      missTarget();
    } else if (target.parentNode) {
      // Clean up if game ended but target exists
      target.remove();
    }
  }, currentSettings.targetDuration);

  // Schedule next spawn
  spawnTimer = setTimeout(() => {
    spawnTarget();
  }, currentSettings.spawnDelay);
}

function hitTarget(target) {
  if (!gameActive) return;

  targetsHit++;
  score += currentSettings.pointsPerHit;
  updateScoreDisplay();

  // Success Animation
  target.classList.add("target-hit");

  setTimeout(() => {
    if (target.parentNode) target.remove();
  }, 200);
}

function missTarget() {
  if (!gameActive) return;

  targetsMissed++;
  score += currentSettings.missedPenalty;
  if (score < 0) score = 0;
  updateScoreDisplay();
}

function endGame() {
  gameActive = false;
  if (spawnTimer) clearTimeout(spawnTimer); // Stop future spawns
  if (gameTimerInterval) clearInterval(gameTimerInterval); // Stop timer

  // Update UI
  startBtn.textContent = "Start Game";
  startBtn.classList.add("primary-btn");
  startBtn.classList.remove("secondary-btn");
  difficultySelect.disabled = false;
  if (instructionsEl) instructionsEl.style.display = "block";

  // Clean up remaining targets
  const targets = gameArea.querySelectorAll(".target");
  targets.forEach((target) => target.remove());

  saveBestScore();

  // Track game end
  if (typeof trackGameEnd === "function" && gameStartTime) {
    trackGameEnd("game1", score, gameStartTime);
  }

  alert(
    `Game Over!\n\nScore: ${score}\nHit: ${targetsHit}\nMissed: ${targetsMissed}`
  );
}

function updateTimerDisplay() {
  if (timerDisplay) timerDisplay.textContent = timeLeft;
}

// Score
function updateScoreDisplay() {
  scoreDisplay.textContent = String(score);
  bestScoreDisplay.textContent = String(bestScore);
}

function loadBestScore(difficulty) {
  const session = JSON.parse(localStorage.getItem("session"));
  if (!session) return;

  const key = `${session.username}-game1-${difficulty}-best`;
  bestScore = parseInt(localStorage.getItem(key) || "0");
  bestScoreDisplay.textContent = String(bestScore);
}

function saveBestScore() {
  const session = JSON.parse(localStorage.getItem("session"));
  if (!session) return;

  const difficulty = difficultySelect.value;
  const key = `${session.username}-game1-${difficulty}-best`;
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

  if (!data.game_1) {
    data.game_1 = { title: "Game 1", scores: [] };
  }

  data.game_1.scores.push({
    username: username,
    score: newScore,
    date: new Date().toISOString(),
  });

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
}
