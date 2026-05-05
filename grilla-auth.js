const GRILLA_AUTH_SDK_VERSION = "12.12.1";
const grillaShell = document.querySelector("[data-grilla-shell]");
const grillaLogoutButton = document.querySelector("[data-auth-logout]");

initGrillaAuth();

async function initGrillaAuth() {
  lockGrillaView();

  try {
    const { auth, authTools } = await createGrillaAuthClient();

    authTools.onAuthStateChanged(auth, (user) => {
      if (!isAllowedGrillaUser(user)) {
        lockGrillaView();
        window.location.href = "index.html";
        return;
      }

      unlockGrillaView();
      setGrillaLoginLinksVisible(false);
      grillaLogoutButton?.removeAttribute("hidden");
      grillaLogoutButton?.classList.remove("is-hidden");
    });
  } catch (error) {
    console.warn("Firebase Authentication no esta disponible en grilla.", error);
    lockGrillaView();
    window.location.href = "index.html";
  }
}

async function createGrillaAuthClient() {
  const settings = window.FirebaseAppConfig || {};

  if (!settings.enabled || !hasValidGrillaFirebaseConfig(settings.firebaseConfig)) {
    throw new Error("Firebase no esta configurado.");
  }

  const [{ initializeApp, getApps }, authModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${GRILLA_AUTH_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${GRILLA_AUTH_SDK_VERSION}/firebase-auth.js`),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(settings.firebaseConfig);

  return {
    auth: authModule.getAuth(app),
    authTools: authModule,
  };
}

function isAllowedGrillaUser(user) {
  return Boolean(user?.emailVerified);
}

function lockGrillaView() {
  document.body.classList.remove("grilla-auth-ready");
  document.body.classList.add("grilla-auth-locked");
  grillaShell?.setAttribute("hidden", "");
  setGrillaLoginLinksVisible(true);
}

function unlockGrillaView() {
  document.body.classList.remove("grilla-auth-locked");
  document.body.classList.add("grilla-auth-ready");
  grillaShell?.removeAttribute("hidden");
}

function hasValidGrillaFirebaseConfig(config) {
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

function setGrillaLoginLinksVisible(visible) {
  document.querySelectorAll('.app-nav a[href="index.html"]').forEach((link) => {
    if (visible) {
      link.removeAttribute("hidden");
      link.classList.remove("is-hidden");
    } else {
      link.setAttribute("hidden", "");
      link.classList.add("is-hidden");
    }
  });
}
