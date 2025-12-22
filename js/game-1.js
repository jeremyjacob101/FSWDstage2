// ============================================
// CONFIGURATION
// ============================================

const GAME_CONFIG = {
    easy: {
        targetSize: 100,
        targetDuration: 3000,
        spawnDelay: 1500,
        pointsPerHit: 10,
        missedPenalty: -5,
        backgroundColor: "#4CAF50"  // Green for Easy
    },
    medium: {
        targetSize: 70,
        targetDuration: 2000,
        spawnDelay: 1000,
        pointsPerHit: 20,
        missedPenalty: -10,
        backgroundColor: "#FF9800"  // Orange for Medium
    },
    hard: {
        targetSize: 40,
        targetDuration: 1000,
        spawnDelay: 700,
        pointsPerHit: 50,
        missedPenalty: -20,
        backgroundColor: "#F44336"  // Red for Hard
    }
};

// ============================================
// GLOBAL VARIABLES
// ============================================

let score = 0;
let gameActive = false;
let currentSettings = null;
let targetsHit = 0;
let targetsMissed = 0;
let spawnTimer = null; // To track and cancel the next spawn
let gameTimerInterval = null; // To track the countdown
let timeLeft = 30;
const GAME_DURATION = 30; // Seconds

let instructionsElement = document.querySelector(".game-instructions");

// ============================================
// INITIALIZATION
// ============================================

const startBtn = document.getElementById("game-start-btn");
const difficultySelect = document.getElementById("difficulty-select");
const scoreDisplay = document.getElementById("game-score");
const timerDisplay = document.getElementById("game-timer");
const bestScoreDisplay = document.getElementById("game-best-score");
const gameArea = document.querySelector(".game-area-wrapper .game-area"); // targeted selection

// Start Button Listener
startBtn.addEventListener("click", () => {
    if (!gameActive) {
        startGame();
    } else {
        endGame();
    }
});

// ============================================
// GAME FUNCTIONS
// ============================================

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

    // Update UI
    startBtn.textContent = "Stop Game";
    startBtn.classList.remove("primary-btn");
    startBtn.classList.add("secondary-btn");

    // Hide instructions
    if (instructionsElement) instructionsElement.style.display = "none";

    // Disable controls
    difficultySelect.disabled = true;

    // Set background color
    if (gameArea) gameArea.style.backgroundColor = currentSettings.backgroundColor;

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

    // Apply styles
    target.style.width = currentSettings.targetSize + "px";
    target.style.height = currentSettings.targetSize + "px";
    target.style.borderRadius = "50%";
    target.style.backgroundColor = "#fff";
    target.style.position = "absolute";
    target.style.cursor = "pointer";
    target.style.transition = "transform 0.1s";

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

    // Hover Effects
    target.addEventListener("mouseenter", () => {
        target.style.transform = "scale(1.1)";
    });
    target.addEventListener("mouseleave", () => {
        target.style.transform = "scale(1)";
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
    target.style.backgroundColor = "#66BB6A"; // Brighter green HIT
    target.style.transform = "scale(0)";
    target.style.pointerEvents = "none"; // Prevent double clicks

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
    clearTimeout(spawnTimer); // Stop future spawns
    clearInterval(gameTimerInterval); // Stop timer

    // Update UI
    startBtn.textContent = "Start Game";
    startBtn.classList.add("primary-btn");
    startBtn.classList.remove("secondary-btn");

    // Show instructions again
    if (instructionsElement) instructionsElement.style.display = "block";

    // Re-enable controls
    difficultySelect.disabled = false;

    // Clean up remaining targets
    const targets = gameArea.querySelectorAll(".target");
    targets.forEach(target => target.remove());

    // Save Score
    saveBestScore();

    // Reset background (optional, or keep color)
    // gameArea.style.backgroundColor = ""; 

    // Game Over Message
    // Using a simpler alert or custom modal in future
    alert(`Game Over!\n\nScore: ${score}\nHit: ${targetsHit}\nMissed: ${targetsMissed}`);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = score;
}

function updateTimerDisplay() {
    if (timerDisplay) timerDisplay.textContent = timeLeft;
}

function saveBestScore() {
    const session = getSession();
    if (!session) return;

    const difficulty = difficultySelect.value;
    const key = `${session.username}-game1-${difficulty}-best`;
    const currentBest = parseInt(localStorage.getItem(key) || "0");

    // 1. Local Best Score (Personal Record)
    if (score > currentBest) {
        localStorage.setItem(key, score);
        bestScoreDisplay.textContent = score;
        // Optional: celebratory message
    }

    // 2. Global Leaderboard Update
    updateGlobalLeaderboard(session.username, score);
}

function updateGlobalLeaderboard(username, newScore) {
    const LEADERBOARD_KEY = "leaderboard_data";
    let data = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "{}");

    // Structure initialization if missing
    if (!data.game_1) {
        data.game_1 = { title: "Game 1", scores: [] };
    }

    // Add new score entry
    data.game_1.scores.push({
        username: username,
        score: newScore,
        date: new Date().toISOString()
    });

    // Save back
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
}

function loadBestScore(difficulty) {
    const session = getSession();
    if (!session) return;

    const key = `${session.username}-game1-${difficulty}-best`;
    const bestScore = localStorage.getItem(key) || "0";

    bestScoreDisplay.textContent = bestScore;
}

function getSession() {
    try {
        return JSON.parse(localStorage.getItem("session"));
    } catch {
        return null;
    }
}

// Initial Load
if (difficultySelect) {
    loadBestScore(difficultySelect.value);

    difficultySelect.addEventListener("change", (e) => {
        loadBestScore(e.target.value);
    });
}