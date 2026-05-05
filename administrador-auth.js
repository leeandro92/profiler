const ADMIN_AUTH_SDK_VERSION = "12.12.1";

const adminLogoutButton = document.querySelector("#vacationLogoutButton");
const adminShell = document.querySelector("[data-admin-shell]");
const adminNav = document.querySelector("[data-admin-nav]");
const adminLinks = [...document.querySelectorAll("[data-admin-link]")];

initAdministratorAuth();

async function initAdministratorAuth() {
  if (!adminLogoutButton) return;
  lockAdministratorView();

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      window.location.reload();
    }
  });

  try {
    const { auth, authTools } = await createAdministratorAuthClient();

    authTools.onAuthStateChanged(auth, (user) => {
      if (!user?.emailVerified) {
        lockAdministratorView();
        window.location.href = "index.html";
        return;
      }

      unlockAdministratorView();
      adminLogoutButton.classList.remove("is-hidden");
    });
  } catch (error) {
    console.warn("Firebase Authentication no esta disponible en administrador.", error);
    window.location.href = "index.html";
  }
}

function lockAdministratorView() {
  document.body.classList.remove("admin-auth-ready");
  document.body.classList.add("admin-auth-locked");
  adminShell?.setAttribute("hidden", "");
  adminNav?.setAttribute("hidden", "");
  setAdministratorLinksVisible(false);
}

function unlockAdministratorView() {
  document.body.classList.remove("admin-auth-locked");
  document.body.classList.add("admin-auth-ready");
  adminShell?.removeAttribute("hidden");
  adminNav?.removeAttribute("hidden");
  setAdministratorLinksVisible(true);
  document.dispatchEvent(new CustomEvent("administrator-auth-ready"));
}

function setAdministratorLinksVisible(visible) {
  adminLinks.forEach((link) => {
    if (visible) {
      link.removeAttribute("hidden");
    } else {
      link.setAttribute("hidden", "");
    }
  });
}

async function createAdministratorAuthClient() {
  const settings = window.FirebaseAppConfig || {};

  if (!settings.enabled || !hasValidAdministratorFirebaseConfig(settings.firebaseConfig)) {
    throw new Error("Firebase no esta configurado.");
  }

  const [{ initializeApp, getApps }, authModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${ADMIN_AUTH_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${ADMIN_AUTH_SDK_VERSION}/firebase-auth.js`),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(settings.firebaseConfig);

  return {
    auth: authModule.getAuth(app),
    authTools: authModule,
  };
}

function hasValidAdministratorFirebaseConfig(config) {
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
