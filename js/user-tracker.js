const USERS_KEY = "users";
const SESSION_KEY = "session";
const SESSION_UPDATE_INTERVAL = 30000;

let sessionTracker = null;

function loadUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
}

function getCurrentUser() {
    const session = getSession();
    if (!session) return null;

    const users = loadUsers();
    return users[session.username] || null;
}

function initializeUserTracking(username) {
    const users = loadUsers();
    const user = users[username];

    if (!user) return;

    if (!user.accountCreated) {
        user.accountCreated = new Date().toISOString();
    }

    if (!user.lastLogin) {
        user.lastLogin = new Date().toISOString();
    }

    if (!user.totalLogins) {
        user.totalLogins = 0;
    }

    if (!user.loginHistory) {
        user.loginHistory = [];
    }

    if (!user.stats) {
        user.stats = {
            totalPlayTime: 0,
            totalGamesPlayed: 0,
            sessionStartTime: null,
            game1: {
                gamesPlayed: 0,
                totalTime: 0,
                bestScore: 0,
                totalScore: 0,
                averageScore: 0,
            },
            game2: {
                gamesPlayed: 0,
                totalTime: 0,
                bestScore: 0,
                totalScore: 0,
                averageScore: 0,
            },
        };
    }

    saveUsers(users);
}

function migrateExistingUsers() {
    const users = loadUsers();

    Object.keys(users).forEach((username) => {
        initializeUserTracking(username);
    });
}

function trackSessionStart() {
    const user = getCurrentUser();
    if (!user) return;

    const users = loadUsers();
    const username = getSession().username;

    users[username].lastLogin = new Date().toISOString();
    users[username].totalLogins = (users[username].totalLogins || 0) + 1;

    if (!users[username].loginHistory) {
        users[username].loginHistory = [];
    }

    users[username].loginHistory.unshift({
        date: new Date().toISOString(),
        duration: 0,
    });

    if (users[username].loginHistory.length > 10) {
        users[username].loginHistory = users[username].loginHistory.slice(0, 10);
    }

    users[username].stats.sessionStartTime = Date.now();

    saveUsers(users);

    startSessionTracking();
}

function trackSessionEnd() {
    const user = getCurrentUser();
    if (!user) return;

    const users = loadUsers();
    const username = getSession().username;

    if (users[username].stats.sessionStartTime) {
        const duration = Math.floor(
            (Date.now() - users[username].stats.sessionStartTime) / 1000
        );

        if (
            users[username].loginHistory &&
            users[username].loginHistory.length > 0
        ) {
            users[username].loginHistory[0].duration = duration;
        }

        users[username].stats.sessionStartTime = null;
    }

    saveUsers(users);
    stopSessionTracking();
}

function startSessionTracking() {
    if (sessionTracker) return;

    sessionTracker = setInterval(() => {
        updateSessionTime();
    }, SESSION_UPDATE_INTERVAL);
}

function stopSessionTracking() {
    if (sessionTracker) {
        clearInterval(sessionTracker);
        sessionTracker = null;
    }
}

function updateSessionTime() {
    const user = getCurrentUser();
    if (!user) {
        stopSessionTracking();
        return;
    }

    const users = loadUsers();
    const username = getSession().username;

    if (users[username].stats.sessionStartTime) {
        const duration = Math.floor(
            (Date.now() - users[username].stats.sessionStartTime) / 1000
        );

        if (
            users[username].loginHistory &&
            users[username].loginHistory.length > 0
        ) {
            users[username].loginHistory[0].duration = duration;
        }

        saveUsers(users);
    }
}

function trackGameStart(gameId) {
    return Date.now();
}

function trackGameEnd(gameId, score, startTime) {
    const user = getCurrentUser();
    if (!user) return;

    const users = loadUsers();
    const username = getSession().username;

    const duration = Math.floor((Date.now() - startTime) / 1000);

    const gameStats = users[username].stats[gameId];
    gameStats.gamesPlayed++;
    gameStats.totalTime += duration;
    gameStats.totalScore += score;
    gameStats.averageScore = Math.floor(
        gameStats.totalScore / gameStats.gamesPlayed
    );

    if (score > gameStats.bestScore) {
        gameStats.bestScore = score;
    }

    users[username].stats.totalGamesPlayed++;
    users[username].stats.totalPlayTime += duration;

    saveUsers(users);
}

function getUserStats(username) {
    const users = loadUsers();

    if (!username) {
        const session = getSession();
        if (!session) return null;
        username = session.username;
    }

    const user = users[username];
    if (!user) return null;

    return {
        username: user.username,
        email: user.email,
        accountCreated: user.accountCreated,
        lastLogin: user.lastLogin,
        totalLogins: user.totalLogins,
        loginHistory: user.loginHistory,
        stats: user.stats,
    };
}

function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

function getFavoriteGame() {
    const stats = getUserStats();
    if (!stats) return "None";

    const game1Time = stats.stats.game1.totalTime;
    const game2Time = stats.stats.game2.totalTime;

    if (game1Time === 0 && game2Time === 0) return "None";
    if (game1Time > game2Time) return "Game 1";
    if (game2Time > game1Time) return "Game 2";
    return "Both equally";
}

migrateExistingUsers();

const currentSession = getSession();
if (currentSession) {
    if (Date.now() < currentSession.expires) {
        startSessionTracking();
    }
}

window.addEventListener("beforeunload", () => {
    trackSessionEnd();
});
