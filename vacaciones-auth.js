const VACATION_AUTH_SDK_VERSION = "12.12.1";
const VACATION_ALLOWED_EMAILS = new Set(["lean-nieto.92@hotmail.com", "brestlauraceleste@gmail.com"]);

const vacationShell = document.querySelector("[data-vacations-shell]");
const vacationLogoutButton = document.querySelector("#vacationLogoutButton");

initVacationAuth();

async function initVacationAuth() {
  lockVacationsView();

  try {
    const { auth, authTools } = await createVacationAuthClient();

    authTools.onAuthStateChanged(auth, (user) => {
      if (!isAllowedVacationUser(user)) {
        lockVacationsView();
        window.location.href = "index.html";
        return;
      }

      unlockVacationsView();
      vacationLogoutButton?.classList.remove("is-hidden");
      vacationLogoutButton?.removeAttribute("hidden");
    });
  } catch (error) {
    console.warn("Firebase Authentication no esta disponible en vacaciones.", error);
    lockVacationsView();
    window.location.href = "index.html";
  }
}

async function createVacationAuthClient() {
  const settings = window.FirebaseAppConfig || {};

  if (!settings.enabled || !hasValidVacationFirebaseConfig(settings.firebaseConfig)) {
    throw new Error("Firebase no esta configurado.");
  }

  const [{ initializeApp, getApps }, authModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${VACATION_AUTH_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${VACATION_AUTH_SDK_VERSION}/firebase-auth.js`),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(settings.firebaseConfig);

  return {
    auth: authModule.getAuth(app),
    authTools: authModule,
  };
}

function isAllowedVacationUser(user) {
  return Boolean(user?.emailVerified) && VACATION_ALLOWED_EMAILS.has(normalizeVacationEmail(user?.email));
}

function lockVacationsView() {
  document.body.classList.remove("vacations-auth-ready");
  document.body.classList.add("vacations-auth-locked");
  vacationShell?.setAttribute("hidden", "");
}

function unlockVacationsView() {
  document.body.classList.remove("vacations-auth-locked");
  document.body.classList.add("vacations-auth-ready");
  vacationShell?.removeAttribute("hidden");
}

function hasValidVacationFirebaseConfig(config) {
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

function normalizeVacationEmail(value) {
  return String(value || "").trim().toLowerCase();
}
