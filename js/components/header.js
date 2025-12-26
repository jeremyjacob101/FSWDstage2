function getSession() {
  try {
    const raw = localStorage.getItem("session");
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || !session.username) return null;

    if (session.expires && Date.now() > session.expires) {
      localStorage.removeItem("session");
      return null;
    }

    return session;
  } catch (err) {
    console.error("Failed to read session:", err);
    return null;
  }
}

function applyNavState() {
  const session = getSession();

  const loggedInItems = document.querySelectorAll(".nav-logged-in");
  const loggedOutItems = document.querySelectorAll(".nav-logged-out");
  const usernameSpan = document.getElementById("nav-username");
  const logoutLink = document.getElementById("logout-link");


  if (session) {
    loggedInItems.forEach((el) => (el.style.display = "inline-flex"));
    loggedOutItems.forEach((el) => (el.style.display = "none"));

    if (usernameSpan) {
      usernameSpan.textContent = session.username;
    }

    if (logoutLink) {
      logoutLink.onclick = function (e) {
        e.preventDefault();
        logout();
        return false;
      };
    }
  } else {
    loggedInItems.forEach((el) => (el.style.display = "none"));
    loggedOutItems.forEach((el) => (el.style.display = "inline-flex"));
  }
}

function initGamesSlider() {
  const mainNav = document.querySelector(".main-nav");
  const toggle = document.querySelector(".nav-games-toggle");
  const slider = document.querySelector(".games-slider");

  if (!mainNav || !toggle || !slider) return;

  function openSlider() {
    mainNav.classList.add("games-open");
    toggle.textContent = "Games ✕";
  }

  function closeSlider() {
    mainNav.classList.remove("games-open");
    toggle.textContent = "Games";
  }

  toggle.addEventListener("click", function () {
    if (mainNav.classList.contains("games-open")) {
      closeSlider();
    } else {
      openSlider();
    }
  });

  slider.addEventListener("mouseleave", function () {
    if (mainNav.classList.contains("games-open")) {
      closeSlider();
    }
  });
}

function logout() {
  // End session tracking if tracker is available
  if (typeof trackSessionEnd === "function") {
    trackSessionEnd();
  }

  localStorage.removeItem("session");
  window.top.location.href = "../auth.html";
}

applyNavState();
initGamesSlider();
