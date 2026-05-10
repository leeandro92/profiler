const AUTH_NAV_SDK_VERSION = "12.12.1";
const VACATIONS_ALLOWED_EMAIL = "lean-nieto.92@hotmail.com";
const OWNER_ALLOWED_EMAILS = new Set([VACATIONS_ALLOWED_EMAIL, "brestlauraceleste@gmail.com"]);
const AUTH_NAV_USERS_COLLECTION = "profilers_auth_users";
const AUTH_NAV_OWNER_READY_EVENT = "profiler-owner-nav-ready";
const AUTH_NAV_OWNER_LOCKED_EVENT = "profiler-owner-nav-locked";
const AUTH_NAV_GENDER_BY_EMAIL = new Map([
  [VACATIONS_ALLOWED_EMAIL, "male"],
  ["brestlauraceleste@gmail.com", "female"],
  ["shaka0021@gmail.com", "female"],
]);

const protectedVacationLinks = [...document.querySelectorAll("[data-vacations-link]")];
const protectedGrillaLinks = [...document.querySelectorAll("[data-grilla-link]")];
const administratorLinks = [...document.querySelectorAll("[data-admin-link]")];
const authLogoutButtons = [...document.querySelectorAll("[data-auth-logout]")];
const loginLinks = [...document.querySelectorAll('.app-nav a[href="index.html"], .footer-group a[href="index.html"]')];
const ownerPageLinks = [...document.querySelectorAll("[data-owner-link]")];
const brandLinks = [...document.querySelectorAll(".brand")];
const ownerShell = document.querySelector("[data-owner-shell]");
const isOwnerProtectedPage = Boolean(ownerShell);
const currentPageName = getCurrentPageName();
const currentAccessRule = getCurrentAccessRule(currentPageName);

document.addEventListener(AUTH_NAV_OWNER_READY_EVENT, (event) => {
  const email = normalizeAuthEmail(event.detail?.email);
  if (OWNER_ALLOWED_EMAILS.has(email)) {
    setOwnerNavigationState();
  }
});

document.addEventListener(AUTH_NAV_OWNER_LOCKED_EVENT, () => {
  setAuthNavigationState(null);
});

initAuthNavigation();
syncOwnerNavigationFromBody();

async function initAuthNavigation() {
  setAuthNavigationState(null);
  setupAuthProfileMenus();
  lockOwnerProtectedShell();

  try {
    const { auth, authTools, firestoreTools } = await createAuthNavClient();
    bindAuthProfileLogout(auth, authTools);

    authTools.onAuthStateChanged(auth, async (user) => {
      setAuthNavigationState(user);

      if (!canAccessCurrentPage(user)) {
        lockProtectedShells();
        updateAuthProfileMenus(null);
        redirectToAllowedPage(user);
        return;
      }

      if (isOwnerProtectedPage && !isAllowedVacationsUser(user)) {
        lockOwnerProtectedShell();
        window.location.replace(user?.emailVerified ? "administrador.html" : "index.html");
        return;
      }

      if (!user?.emailVerified) {
        lockProtectedShells();
        updateAuthProfileMenus(null);
        return;
      }

      unlockOwnerProtectedShell(user);
      const profile = await loadAuthUserProfile(user, firestoreTools);
      updateAuthProfileMenus(user, profile);
      if (isAllowedVacationsUser(user)) {
        setOwnerNavigationState();
      }
    });
  } catch (error) {
    console.warn("No se pudo validar la sesion para mostrar enlaces protegidos.", error);
    setAuthNavigationState(null);
    updateAuthProfileMenus(null);
    lockProtectedShells();
    if (currentAccessRule !== "public") window.location.replace("index.html");
  }
}

async function createAuthNavClient() {
  const settings = window.FirebaseAppConfig || {};

  if (!settings.enabled || !hasValidAuthNavFirebaseConfig(settings.firebaseConfig)) {
    throw new Error("Firebase no esta configurado.");
  }

  const [{ initializeApp, getApps }, authModule, firestoreModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${AUTH_NAV_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${AUTH_NAV_SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${AUTH_NAV_SDK_VERSION}/firebase-firestore.js`),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(settings.firebaseConfig);

  return {
    auth: authModule.getAuth(app),
    authTools: authModule,
    firestoreTools: {
      db: firestoreModule.getFirestore(app),
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
    },
  };
}

function setAuthNavigationState(user) {
  const hasSession = Boolean(user);
  const isLoggedIn = Boolean(user?.emailVerified);
  const canSeeVacations = isAllowedVacationsUser(user);

  ownerPageLinks.forEach((link) => {
    toggleHidden(link, !canSeeVacations);
  });

  brandLinks.forEach((link) => {
    link.setAttribute("href", canSeeVacations ? "login.html" : isLoggedIn ? "administrador.html" : "index.html");
  });

  protectedVacationLinks.forEach((link) => {
    toggleHidden(link, !canSeeVacations);
  });

  protectedGrillaLinks.forEach((link) => {
    toggleHidden(link, !isLoggedIn);
  });

  administratorLinks.forEach((link) => {
    toggleHidden(link, !isLoggedIn || canSeeVacations);
  });

  authLogoutButtons.forEach((button) => {
    toggleProfileHidden(button, !isLoggedIn);
  });

  loginLinks.forEach((link) => {
    toggleHidden(link, hasSession);
  });
}

function setOwnerNavigationState() {
  ownerPageLinks.forEach((link) => {
    toggleHidden(link, false);
  });

  brandLinks.forEach((link) => {
    link.setAttribute("href", "login.html");
  });

  protectedVacationLinks.forEach((link) => {
    toggleHidden(link, false);
  });

  protectedGrillaLinks.forEach((link) => {
    toggleHidden(link, false);
  });

  administratorLinks.forEach((link) => {
    toggleHidden(link, true);
  });

  authLogoutButtons.forEach((button) => {
    toggleProfileHidden(button, false);
  });

  loginLinks.forEach((link) => {
    toggleHidden(link, true);
  });
}

function syncOwnerNavigationFromBody() {
  const email = normalizeAuthEmail(document.body.dataset.ownerAuthEmail);
  if (document.body.classList.contains("owner-auth-ready") && OWNER_ALLOWED_EMAILS.has(email)) {
    setOwnerNavigationState();
  }
}

function lockOwnerProtectedShell() {
  if (!isOwnerProtectedPage) return;
  document.body.classList.remove("owner-auth-ready");
  document.body.classList.add("owner-auth-locked");
  delete document.body.dataset.ownerAuthEmail;
  ownerShell?.setAttribute("hidden", "");
}

function unlockOwnerProtectedShell(user) {
  if (!isOwnerProtectedPage) return;
  document.body.classList.remove("owner-auth-locked");
  document.body.classList.add("owner-auth-ready");
  document.body.dataset.ownerAuthEmail = normalizeAuthEmail(user?.email);
  ownerShell?.removeAttribute("hidden");
}

function lockProtectedShells() {
  lockOwnerProtectedShell();
  document.querySelector("[data-vacations-shell]")?.setAttribute("hidden", "");
  document.querySelector("[data-admin-shell]")?.setAttribute("hidden", "");
  document.querySelector("[data-grilla-shell]")?.setAttribute("hidden", "");
}

function setupAuthProfileMenus() {
  authLogoutButtons.forEach((button) => {
    if (button.dataset.profileMenuReady === "true") return;

    const wrapper = document.createElement("div");
    wrapper.className = "auth-profile-menu";
    wrapper.setAttribute("hidden", "");

    const dropdown = document.createElement("div");
    dropdown.className = "auth-profile-dropdown";
    dropdown.setAttribute("hidden", "");

    const profileText = document.createElement("span");
    profileText.className = "auth-profile-dropdown-title";
    profileText.textContent = "Sesion activa";

    const logoutAction = document.createElement("button");
    logoutAction.className = "auth-profile-logout-action";
    logoutAction.type = "button";
    logoutAction.textContent = "Cerrar sesion";

    dropdown.append(profileText, logoutAction);

    button.dataset.profileMenuReady = "true";
    button.classList.add("auth-profile-trigger", "profile-gender-neutral");
    button.type = "button";
    button.textContent = "--";
    button.setAttribute("aria-label", "Abrir menu de usuario");
    button.setAttribute("aria-expanded", "false");

    button.parentNode.insertBefore(wrapper, button);
    wrapper.append(button, dropdown);

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = !dropdown.hasAttribute("hidden");
      closeAuthProfileMenus();
      if (!isOpen) {
        dropdown.removeAttribute("hidden");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", closeAuthProfileMenus);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAuthProfileMenus();
  });
}

function bindAuthProfileLogout(auth, authTools) {
  document.querySelectorAll(".auth-profile-logout-action").forEach((button) => {
    if (button.dataset.logoutReady === "true") return;
    button.dataset.logoutReady = "true";

    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Cerrando...";
      setAuthNavigationState(null);

      try {
        await authTools.signOut(auth);
      } catch (error) {
        console.warn("No se pudo cerrar la sesion.", error);
      } finally {
        window.location.href = "index.html";
      }
    });
  });
}

function closeAuthProfileMenus() {
  document.querySelectorAll(".auth-profile-dropdown").forEach((dropdown) => {
    dropdown.setAttribute("hidden", "");
  });

  document.querySelectorAll(".auth-profile-trigger").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

async function loadAuthUserProfile(user, firestoreTools) {
  if (!user || !firestoreTools?.db) return {};

  try {
    const userRef = firestoreTools.doc(firestoreTools.db, AUTH_NAV_USERS_COLLECTION, user.uid);
    const snapshot = await firestoreTools.getDoc(userRef);
    return snapshot.exists() ? snapshot.data() : {};
  } catch (error) {
    console.warn("No se pudo cargar el perfil del usuario.", error);
    return {};
  }
}

function updateAuthProfileMenus(user, profile = {}) {
  authLogoutButtons.forEach((button) => {
    const initials = user ? getProfileInitials(user, profile) : "--";
    const gender = getProfileGender(user, profile);

    button.textContent = initials;
    button.title = user ? getProfileDisplayName(user, profile) : "Usuario";
    button.setAttribute("aria-label", user ? `Menu de usuario ${button.title}` : "Menu de usuario");
    button.classList.remove("profile-gender-male", "profile-gender-female", "profile-gender-neutral");
    button.classList.add(`profile-gender-${gender}`);

    const wrapper = button.closest(".auth-profile-menu");
    wrapper?.querySelector(".auth-profile-dropdown-title")?.replaceChildren(document.createTextNode(button.title));
    const logoutAction = wrapper?.querySelector(".auth-profile-logout-action");
    if (logoutAction) {
      logoutAction.disabled = false;
      logoutAction.textContent = "Cerrar sesion";
    }
  });
}

function toggleProfileHidden(button, hidden) {
  toggleHidden(button, hidden);
  const wrapper = button.closest(".auth-profile-menu");
  toggleHidden(wrapper, hidden);
  if (hidden) {
    wrapper?.querySelector(".auth-profile-dropdown")?.setAttribute("hidden", "");
    button.disabled = false;
    button.setAttribute("aria-expanded", "false");
  }
}

function getProfileInitials(user, profile = {}) {
  const names = [profile.firstName, profile.lastName].map((value) => String(value || "").trim()).filter(Boolean);

  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }

  if (profile.fullName) {
    const fullNameParts = String(profile.fullName).trim().split(/\s+/).filter(Boolean);
    if (fullNameParts.length >= 2) return `${fullNameParts[0][0]}${fullNameParts[1][0]}`.toUpperCase();
    if (fullNameParts.length === 1) return fullNameParts[0].slice(0, 2).toUpperCase();
  }

  const emailName = String(user?.email || "").split("@")[0].replace(/[._-]+/g, " ").trim();
  const emailParts = emailName.split(/\s+/).filter(Boolean);
  if (emailParts.length >= 2) return `${emailParts[0][0]}${emailParts[1][0]}`.toUpperCase();
  return (emailParts[0] || "US").slice(0, 2).toUpperCase();
}

function getProfileDisplayName(user, profile = {}) {
  return profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || user?.email || "Usuario";
}

function getProfileGender(user, profile = {}) {
  const emailGender = AUTH_NAV_GENDER_BY_EMAIL.get(normalizeAuthEmail(user?.email));
  if (emailGender) return emailGender;

  const gender = normalizeAuthEmail(profile.gender || profile.genero || profile.sex || profile.sexo);

  if (["hombre", "masculino", "male", "varon", "varón"].includes(gender)) return "male";
  if (["mujer", "femenino", "female"].includes(gender)) return "female";
  return "neutral";
}

function isAllowedVacationsUser(user) {
  return Boolean(user?.emailVerified) && OWNER_ALLOWED_EMAILS.has(normalizeAuthEmail(user?.email));
}

function getCurrentPageName() {
  const pageName = window.location.pathname.split("/").pop();
  return pageName || "index.html";
}

function getCurrentAccessRule(pageName) {
  const accessRules = {
    "login.html": "owner",
    "historial.html": "owner",
    "vacaciones.html": "owner",
    "administrador.html": "verified",
    "grilla.html": "verified",
  };

  return accessRules[pageName] || "public";
}

function canAccessCurrentPage(user) {
  if (currentAccessRule === "public") return true;
  if (!user?.emailVerified) return false;
  if (currentAccessRule === "owner") return isAllowedVacationsUser(user);
  if (currentAccessRule === "verified") return true;
  return false;
}

function redirectToAllowedPage(user) {
  const redirectTarget = user?.emailVerified ? "administrador.html" : "index.html";
  if (currentPageName !== redirectTarget) {
    window.location.replace(redirectTarget);
  }
}

function toggleHidden(element, hidden) {
  if (!element) return;
  if (hidden) {
    element.setAttribute("hidden", "");
    element.classList.add("is-hidden");
  } else {
    element.removeAttribute("hidden");
    element.classList.remove("is-hidden");
  }
}

function hasValidAuthNavFirebaseConfig(config) {
  return Boolean(
    config &&
      config.apiKey &&
      config.projectId &&
      config.appId &&
      !String(config.apiKey).includes("PEGAR_") &&
      !String(config.projectId).includes("PEGAR_") &&
      !String(config.appId).includes("PEGAR_"),
  );
}

function normalizeAuthEmail(value) {
  return String(value || "").trim().toLowerCase();
}
