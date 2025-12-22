const LEADERBOARD_KEY = "leaderboard_data";

function loadLeaderboardData() {
  const defaultData = {
    game_1: { title: "Game 1 - Click Targets", description: "Test your reflexes!", scores: [] },
    game_2: { title: "Game 2 - TBD", description: "Coming soon...", scores: [] },
    game_3: { title: "Game 3 - TBD", description: "Coming soon...", scores: [] },
    game_4: { title: "Game 4 - TBD", description: "Coming soon...", scores: [] },
  };

  const stored = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "{}");
  return { ...defaultData, ...stored };
}

const games = loadLeaderboardData();

function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function renderLeaderboard(gameKey) {
  const game = games[gameKey];
  if (!game) return;

  const title = document.getElementById("lb-game-title");
  const desc = document.getElementById("lb-game-description");
  const tbody = document.getElementById("leaderboard-body");

  if (!title || !desc || !tbody) return;

  title.textContent = game.title;
  desc.textContent = game.description;

  tbody.innerHTML = "";

  if (!game.scores || game.scores.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No scores yet.";
    cell.className = "empty-row";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  // Sort scores (highest first)
  const sorted = [...game.scores].sort((a, b) => b.score - a.score);

  sorted.forEach((entry, index) => {
    const row = document.createElement("tr");

    const rankCell = document.createElement("td");
    rankCell.textContent = index + 1;

    const userCell = document.createElement("td");
    userCell.textContent = entry.username;

    const scoreCell = document.createElement("td");
    scoreCell.textContent = entry.score;

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(entry.date);

    row.appendChild(rankCell);
    row.appendChild(userCell);
    row.appendChild(scoreCell);
    row.appendChild(dateCell);

    tbody.appendChild(row);
  });
}

function initLeaderboards() {
  const select = document.getElementById("game-select");
  if (!select) return;

  renderLeaderboard(select.value || "game_1");

  select.addEventListener("change", function () {
    renderLeaderboard(this.value);
  });
}

document.addEventListener("DOMContentLoaded", initLeaderboards);
