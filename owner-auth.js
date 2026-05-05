const OWNER_AUTH_SDK_VERSION = "12.12.1";
const OWNER_ALLOWED_EMAILS = new Set(["lean-nieto.92@hotmail.com", "brestlauraceleste@gmail.com"]);
const OWNER_NAV_READY_EVENT = "profiler-owner-nav-ready";
const OWNER_NAV_LOCKED_EVENT = "profiler-owner-nav-locked";

const ownerShell = document.querySelector("[data-owner-shell]");
const ownerLinks = [...document.querySelectorAll("[data-owner-link]")];
const ownerVacationLinks = [...document.querySelectorAll("[data-vacations-link]")];
const ownerGrillaLinks = [...document.querySelectorAll("[data-grilla-link]")];
const ownerAdminLinks = [...document.querySelectorAll("[data-admin-link]")];
const ownerLogoutButtons = [...document.querySelectorAll("[data-auth-logout]")];

initOwnerAuth();

async function initOwnerAuth() {
  lockOwnerView();

  try {
    const { auth, authTools } = await createOwnerAuthClient();

    authTools.onAuthStateChanged(auth, (user) => {
      if (!user?.emailVerified) {
        lockOwnerView();
        window.location.href = "index.html";
        return;
      }

      if (!OWNER_ALLOWED_EMAILS.has(normalizeOwnerEmail(user.email))) {
        lockOwnerView();
        window.location.href = "administrador.html";
        return;
      }

      unlockOwnerView(user);
    });
  } catch (error) {
    console.warn("No se pudo validar el acceso del propietario.", error);
    lockOwnerView();
    window.location.href = "index.html";
  }
}

async function createOwnerAuthClient() {
  const settings = window.FirebaseAppConfig || {};

  if (!settings.enabled || !hasValidOwnerFirebaseConfig(settings.firebaseConfig)) {
    throw new Error("Firebase no esta configurado.");
  }

  const [{ initializeApp, getApps }, authModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${OWNER_AUTH_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${OWNER_AUTH_SDK_VERSION}/firebase-auth.js`),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(settings.firebaseConfig);

  return {
    auth: authModule.getAuth(app),
    authTools: authModule,
  };
}

function lockOwnerView() {
  document.body.classList.remove("owner-auth-ready");
  document.body.classList.add("owner-auth-locked");
  delete document.body.dataset.ownerAuthEmail;
  ownerShell?.setAttribute("hidden", "");
  setOwnerNavigationVisible(false);
  document.dispatchEvent(new CustomEvent(OWNER_NAV_LOCKED_EVENT));
}

function unlockOwnerView(user) {
  const email = normalizeOwnerEmail(user?.email);
  document.body.classList.remove("owner-auth-locked");
  document.body.classList.add("owner-auth-ready");
  document.body.dataset.ownerAuthEmail = email;
  ownerShell?.removeAttribute("hidden");
  setOwnerNavigationVisible(true);
  document.dispatchEvent(new CustomEvent(OWNER_NAV_READY_EVENT, { detail: { email } }));
}

function setOwnerNavigationVisible(visible) {
  ownerLinks.forEach((link) => toggleOwnerElement(link, !visible));
  ownerVacationLinks.forEach((link) => toggleOwnerElement(link, !visible));
  ownerGrillaLinks.forEach((link) => toggleOwnerElement(link, !visible));
  ownerAdminLinks.forEach((link) => toggleOwnerElement(link, true));
  ownerLogoutButtons.forEach((button) => toggleOwnerElement(button, !visible));
}

function toggleOwnerElement(element, hidden) {
  if (!element) return;
  if (hidden) {
    element.setAttribute("hidden", "");
    element.classList.add("is-hidden");
  } else {
    element.removeAttribute("hidden");
    element.classList.remove("is-hidden");
  }
}

function hasValidOwnerFirebaseConfig(config) {
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

function normalizeOwnerEmail(value) {
  return String(value || "").trim().toLowerCase();
}
