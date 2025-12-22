/* Helpers */
function loadUsers() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function setSession(username, minutes = 10) {
  const expires = Date.now() + minutes * 60 * 1000;
  const session = { username, expires };
  localStorage.setItem("session", JSON.stringify(session));
}

function getSession() {
  return JSON.parse(localStorage.getItem("session"));
}

function clearSession() {
  localStorage.removeItem("session");
}

/* Registration */
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("reg-user").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const pass1 = document.getElementById("reg-pass").value;
    const pass2 = document.getElementById("reg-pass2").value;


    const users = loadUsers();
    const msg = document.getElementById("register-message");

    if (users[username]) {
      msg.textContent = "Username already exists.";
      return;
    }
    if (pass1 !== pass2) {
      msg.textContent = "Passwords do not match.";
      return;
    }
    if (pass1.length < 4) {
      msg.textContent = "Password must be at least 4 characters.";
      return;
    }

    users[username] = {
      username,
      email,
      password: pass1,
      loginAttempts: 0,
      blockedUntil: 0,
    };

    saveUsers(users);
    setSession(username, 60);

    msg.textContent = "Registration successful! Redirecting to games...";

    setTimeout(() => {
      window.location.href = "../html/index.html";
    }, 1200);
  });
}

/* Login */
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("login-user").value.trim();
    const password = document.getElementById("login-pass").value;

    const users = loadUsers();

    const msg = document.getElementById("login-message");

    if (!users[username]) {
      msg.textContent = "User does not exist.";
      return;
    }

    const user = users[username];
    if (Date.now() < user.blockedUntil) {
      const secondsLeft = Math.ceil((user.blockedUntil - Date.now()) / 1000);
      msg.textContent = `User is blocked. Try again in ${secondsLeft}s.`;
      return;
    }
    if (password !== user.password) {
      user.loginAttempts++;
      if (user.loginAttempts >= 3) {
        user.blockedUntil = Date.now() + 30 * 1000;
        user.loginAttempts = 0;
        msg.textContent = "Too many attempts! User blocked for 30 seconds.";
      } else {
        msg.textContent = `Wrong password. Attempts: ${user.loginAttempts}/3`;
      }
      saveUsers(users);
      return;
    }

    user.loginAttempts = 0;
    saveUsers(users);
    setSession(username, 30);
    msg.textContent = "Login successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "../html/index.html";
    }, 1200);
  });
}

/* Session Expiration Check */
const activeSession = getSession();
if (activeSession) {
  if (Date.now() > activeSession.expires) {
    clearSession();
    alert("Session expired. Please log in again.");
    window.location.href = "../html/auth.html";
  }
}

const heroLoginBtn = document.querySelector('a[href="../html/auth.html"]');
if (heroLoginBtn) {
  const session = getSession();
  if (session && session.username) {
    heroLoginBtn.style.display = "none";
  }
}