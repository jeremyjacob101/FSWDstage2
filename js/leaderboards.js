const games = {
  game_1: {
    title: "Game 1 - High Scores",
    description: "Short description.",
    scores: [],
  },
  game_2: {
    title: "Game 2 - High Scores",
    description: "Short description.",
    scores: [],
  },
  game_3: {
    title: "Game 3 - High Scores",
    description: "Short description.",
    scores: [],
  },
  game_4: {
    title: "Game 4 - High Scores",
    description: "Short description.",
    scores: [],
  },
};

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
