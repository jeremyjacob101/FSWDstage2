function initDashboard() {
    const session = getSession();

    if (!session || Date.now() > session.expires) {
        window.location.href = "../html/auth.html";
        return;
    }

    loadUserStats();
    loadRecentActivity();
    initLeaderboards();
}

function loadUserStats() {
    const userStats = getUserStats();
    if (!userStats || !userStats.stats) return;

    const stats = userStats.stats;

    const totalGamesEl = document.getElementById("stat-total-games");
    if (totalGamesEl) {
        totalGamesEl.textContent = stats.totalGamesPlayed || 0;
    }

    const totalTimeEl = document.getElementById("stat-total-time");
    if (totalTimeEl) {
        totalTimeEl.textContent = formatTime(stats.totalPlayTime || 0);
    }

    const game1BestEl = document.getElementById("stat-game1-best");
    if (game1BestEl) {
        game1BestEl.textContent = stats.game1.bestScore || 0;
    }

    const game2BestEl = document.getElementById("stat-game2-best");
    if (game2BestEl) {
        game2BestEl.textContent = stats.game2.bestScore || 0;
    }
}

function loadRecentActivity() {
    const userStats = getUserStats();
    if (!userStats || !userStats.loginHistory) return;

    const activityList = document.getElementById("activity-list");
    if (!activityList) return;

    const recentLogins = userStats.loginHistory.slice(0, 5);

    if (recentLogins.length === 0) {
        activityList.innerHTML =
            '<div class="activity-empty">No recent activity</div>';
        return;
    }

    activityList.innerHTML = recentLogins
        .map((login) => {
            const date = new Date(login.date);
            const dateStr =
                date.toLocaleDateString() +
                " at " +
                date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return `
      <div class="activity-item">
        <div class="activity-icon">🎮</div>
        <div class="activity-info">
          <div class="activity-date">${dateStr}</div>
        </div>
      </div>
    `;
        })
        .join("");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
} else {
    initDashboard();
}
