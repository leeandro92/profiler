const FIREBASE_AUTH_SDK_VERSION = "12.12.1";
const AUTH_USERS_COLLECTION = "profilers_auth_users";
const LOGIN_VACATIONS_ALLOWED_EMAIL = "lean-nieto.92@hotmail.com";
const LOGIN_OWNER_EMAILS = new Set([LOGIN_VACATIONS_ALLOWED_EMAIL, "brestlauraceleste@gmail.com"]);
const MAX_REGISTERED_USERS = 25;
const BLOCKED_REGISTER_EMAILS = new Set(["lauracelestebrest@hotmail.com"]);
const AUTH_GENDER_OVERRIDES = new Map([["shaka0021@gmail.com", "mujer"]]);

const authElements = {
  loginView: document.querySelector("#loginView"),
  registerView: document.querySelector("#registerView"),
  recoveryView: document.querySelector("#recoveryView"),
  resetPasswordView: document.querySelector("#resetPasswordView"),
  showRegisterButton: document.querySelector("#showRegisterButton"),
  showLoginButton: document.querySelector("#showLoginButton"),
  showRecoveryButton: document.querySelector("#showRecoveryButton"),
  showLoginFromRecoveryButton: document.querySelector("#showLoginFromRecoveryButton"),
  registerForm: document.querySelector("#registerForm"),
  registerName: document.querySelector("#registerName"),
  registerLastName: document.querySelector("#registerLastName"),
  registerEmail: document.querySelector("#registerEmail"),
  registerGender: document.querySelector("#registerGender"),
  registerPassword: document.querySelector("#registerPassword"),
  registerPasswordConfirm: document.querySelector("#registerPasswordConfirm"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  toggleLoginPassword: document.querySelector("#toggleLoginPassword"),
  recoveryForm: document.querySelector("#recoveryForm"),
  recoveryEmail: document.querySelector("#recoveryEmail"),
  resetPasswordForm: document.querySelector("#resetPasswordForm"),
  resetPassword: document.querySelector("#resetPassword"),
  resetPasswordConfirm: document.querySelector("#resetPasswordConfirm"),
  verificationNotice: document.querySelector("#verificationNotice"),
  verificationStatus: document.querySelector("#verificationNoticeStatus"),
  closeVerificationNotice: document.querySelector("#closeVerificationNotice"),
  resendVerificationEmail: document.querySelector("#resendVerificationEmail"),
  passwordToggleButtons: [...document.querySelectorAll("[data-password-toggle]")],
  status: document.querySelector("#authStatus"),
};

let firebaseAuth = null;
let authTools = null;
let firestoreTools = null;
let activePasswordResetCode = "";
let pendingVerificationCredentials = null;
let isResendingVerificationEmail = false;

initLogin();

async function initLogin() {
  bindAuthForms();

  try {
    const firebase = await createFirebaseAuthClient();
    firebaseAuth = firebase.auth;
    authTools = firebase.authTools;
    firestoreTools = firebase.firestoreTools;

    authTools.onAuthStateChanged(firebaseAuth, (user) => {
      updateSessionState(user);
    });

    await detectPasswordResetAction();
  } catch (error) {
    console.warn("No se pudo iniciar Firebase Authentication.", error);
    setAuthStatus("No se pudo conectar Firebase Authentication. Revisa la configuracion.", "error");
    setFormsDisabled(true);
  }
}

function bindAuthForms() {
  authElements.registerForm.addEventListener("submit", handleRegisterSubmit);
  authElements.loginForm.addEventListener("submit", handleLoginSubmit);
  authElements.recoveryForm.addEventListener("submit", handleRecoverySubmit);
  authElements.resetPasswordForm.addEventListener("submit", handleResetPasswordSubmit);
  authElements.showRegisterButton.addEventListener("click", () => showAuthView("register"));
  authElements.showLoginButton.addEventListener("click", () => showAuthView("login"));
  authElements.showRecoveryButton.addEventListener("click", () => {
    authElements.recoveryEmail.value = normalizeEmail(authElements.loginEmail.value);
    showAuthView("recovery");
  });
  authElements.showLoginFromRecoveryButton.addEventListener("click", () => showAuthView("login"));
  authElements.passwordToggleButtons.forEach((button) => {
    button.addEventListener("click", () => togglePasswordVisibility(button));
  });
  authElements.closeVerificationNotice.addEventListener("click", hideVerificationNotice);
  authElements.resendVerificationEmail?.addEventListener("click", handleResendVerificationEmail);
  authElements.verificationNotice.addEventListener("click", (event) => {
    if (event.target === authElements.verificationNotice) {
      hideVerificationNotice();
    }
  });
}

function togglePasswordVisibility(button) {
  const targetId = button.dataset.passwordTarget;
  const input = document.getElementById(targetId);
  if (!input) return;

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  button.classList.toggle("is-visible", isHidden);
  button.setAttribute("aria-label", isHidden ? "Ocultar contrasena" : "Mostrar contrasena");
  button.setAttribute("aria-pressed", String(isHidden));
  input.focus();
}

async function createFirebaseAuthClient() {
  const settings = window.FirebaseAppConfig || {};

  if (!settings.enabled || !hasValidFirebaseConfig(settings.firebaseConfig)) {
    throw new Error("Firebase no esta configurado.");
  }

  const [{ initializeApp, getApps }, authModule, firestoreModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_AUTH_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_AUTH_SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_AUTH_SDK_VERSION}/firebase-firestore.js`),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(settings.firebaseConfig);

  return {
    auth: authModule.getAuth(app),
    authTools: authModule,
    firestoreTools: {
      db: firestoreModule.getFirestore(app),
      doc: firestoreModule.doc,
      collection: firestoreModule.collection,
      getDoc: firestoreModule.getDoc,
      getDocs: firestoreModule.getDocs,
      limit: firestoreModule.limit,
      query: firestoreModule.query,
      serverTimestamp: firestoreModule.serverTimestamp,
      setDoc: firestoreModule.setDoc,
      where: firestoreModule.where,
    },
  };
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const firstName = normalizeName(authElements.registerName.value);
  const lastName = normalizeName(authElements.registerLastName.value);
  const email = normalizeEmail(authElements.registerEmail.value);
  const gender = normalizeGender(authElements.registerGender.value);
  const password = authElements.registerPassword.value.trim();
  const passwordConfirm = authElements.registerPasswordConfirm.value.trim();

  if (!validateRegisterData({ firstName, lastName, email, gender, password, passwordConfirm })) return;
  if (isBlockedEmail(email)) {
    setAuthStatus("Ese correo fue dado de baja y no puede volver a registrarse.", "error");
    return;
  }

  setFormsDisabled(true);
  setAuthStatus("Verificando cupo de usuarios...", "loading");

  try {
    const registeredUsersCount = await countRegisteredUsersSafely();

    if (Number.isFinite(registeredUsersCount) && registeredUsersCount >= MAX_REGISTERED_USERS) {
      setAuthStatus(`Ya se alcanzo el limite de ${MAX_REGISTERED_USERS} usuarios registrados.`, "error");
      return;
    }

    setAuthStatus("Creando usuario...", "loading");
    const credentials = await authTools.createUserWithEmailAndPassword(firebaseAuth, email, password);
    await saveUserProfileSafely(credentials.user, { created: true, firstName, lastName, gender });
    await authTools.sendEmailVerification(credentials.user, getEmailVerificationSettings());
    pendingVerificationCredentials = { email, password };
    await authTools.signOut(firebaseAuth);
    setAuthStatus("Usuario creado correctamente. Te enviamos un email de verificacion. Verifica tu correo antes de iniciar sesion.", "success");
    showVerificationNotice();
    authElements.registerForm.reset();
    authElements.loginEmail.value = email;
    showAuthView("login", { keepStatus: true });
  } catch (error) {
    console.warn("No se pudo registrar el usuario.", error);
    setAuthStatus(getFriendlyAuthError(error), "error");
  } finally {
    setFormsDisabled(false);
  }
}

async function handleResendVerificationEmail() {
  if (!pendingVerificationCredentials) {
    setVerificationStatus("Para reenviar desde este boton, volve a completar correo y contrasena e intenta iniciar sesion. Si falta verificar, te reenviamos el link automaticamente.", "error");
    setAuthStatus("Completa correo y contrasena e intenta iniciar sesion para reenviar el link.", "error");
    return;
  }

  const button = authElements.resendVerificationEmail;
  button.disabled = true;
  button.textContent = "Reenviando...";
  setAuthStatus("Reenviando email de verificacion...", "loading");
  setVerificationStatus("Reenviando link de verificacion...", "loading");

  try {
    isResendingVerificationEmail = true;
    const credentials = await authTools.signInWithEmailAndPassword(
      firebaseAuth,
      pendingVerificationCredentials.email,
      pendingVerificationCredentials.password,
    );
    await credentials.user.reload();

    if (credentials.user.emailVerified) {
      await authTools.signOut(firebaseAuth);
      pendingVerificationCredentials = null;
      hideVerificationNotice();
      setAuthStatus("El correo ya esta verificado. Ya podes iniciar sesion.", "success");
      return;
    }

    await authTools.sendEmailVerification(credentials.user, getEmailVerificationSettings());
    await authTools.signOut(firebaseAuth);
    setVerificationStatus("Listo. Te reenviamos el link. Revisa bandeja de entrada y spam.", "success");
    setAuthStatus("Te reenviamos el email de verificacion. Revisa tu bandeja de entrada o spam.", "success");
  } catch (error) {
    console.warn("No se pudo reenviar el email de verificacion.", error);
    setVerificationStatus(getFriendlyAuthError(error), "error");
    setAuthStatus(getFriendlyAuthError(error), "error");
  } finally {
    isResendingVerificationEmail = false;
    button.disabled = false;
    button.textContent = "Reenviar link";
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = normalizeEmail(authElements.loginEmail.value);
  const password = authElements.loginPassword.value.trim();

  if (!validateEmailAndPassword(email, password)) return;

  setFormsDisabled(true);
  setAuthStatus("Validando credenciales...", "loading");

  try {
    const credentials = await authTools.signInWithEmailAndPassword(firebaseAuth, email, password);
    await credentials.user.reload();

    if (!credentials.user.emailVerified) {
      await authTools.sendEmailVerification(credentials.user, getEmailVerificationSettings());
      await authTools.signOut(firebaseAuth);
      pendingVerificationCredentials = { email, password };
      showVerificationNotice();
      setVerificationStatus("Te reenviamos el link. Revisa bandeja de entrada y spam.", "success");
      setAuthStatus("Tu correo todavia no esta verificado. Te reenviamos el email de verificacion.", "error");
      return;
    }

    await saveUserProfileSafely(credentials.user, { login: true });
    authElements.loginForm.reset();

    if (LOGIN_OWNER_EMAILS.has(normalizeEmail(credentials.user.email))) {
      setAuthStatus("Sesion iniciada correctamente. Abriendo vacaciones...", "success");
      window.location.href = "vacaciones.html";
      return;
    }

    setAuthStatus("Sesion iniciada correctamente. Abriendo calendario...", "success");
    window.location.href = "administrador.html";
  } catch (error) {
    console.warn("No se pudo iniciar sesion.", error);
    setAuthStatus(getFriendlyAuthError(error), "error");
  } finally {
    setFormsDisabled(false);
  }
}

async function handleRecoverySubmit(event) {
  event.preventDefault();

  const email = normalizeEmail(authElements.recoveryEmail.value);

  if (!validateEmailOnly(email)) return;

  if (isBlockedEmail(email)) {
    setAuthStatus("Ese correo fue dado de baja y no puede recuperar acceso.", "error");
    return;
  }

  setFormsDisabled(true);
  setAuthStatus("Verificando cuenta registrada...", "loading");

  try {
    const accountExists = await registeredEmailExists(email);

    if (!accountExists) {
      setAuthStatus("No existe una cuenta registrada con ese correo.", "error");
      return;
    }

    setAuthStatus("Enviando email de recuperacion...", "loading");
    await authTools.sendPasswordResetEmail(firebaseAuth, email, getPasswordResetSettings());
    setAuthStatus("Te enviamos un email de recuperacion. Abri el enlace para crear una nueva contrasena.", "success");
    authElements.loginEmail.value = email;
    showAuthView("login", { keepStatus: true });
  } catch (error) {
    console.warn("No se pudo enviar la recuperacion de contrasena.", error);
    setAuthStatus(getFriendlyAuthError(error), "error");
  } finally {
    setFormsDisabled(false);
  }
}

async function handleResetPasswordSubmit(event) {
  event.preventDefault();

  const password = authElements.resetPassword.value.trim();
  const passwordConfirm = authElements.resetPasswordConfirm.value.trim();

  if (!activePasswordResetCode) {
    setAuthStatus("El enlace de recuperacion no es valido o ya vencio.", "error");
    return;
  }

  if (!validatePasswordPair(password, passwordConfirm)) return;

  setFormsDisabled(true);
  setAuthStatus("Actualizando contrasena...", "loading");

  try {
    const email = await authTools.verifyPasswordResetCode(firebaseAuth, activePasswordResetCode);
    await authTools.confirmPasswordReset(firebaseAuth, activePasswordResetCode, password);
    authElements.resetPasswordForm.reset();
    activePasswordResetCode = "";
    authElements.loginEmail.value = normalizeEmail(email);
    window.history.replaceState({}, document.title, window.location.pathname);
    setAuthStatus("Contrasena actualizada correctamente. Ya podes iniciar sesion.", "success");
    showAuthView("login", { keepStatus: true });
  } catch (error) {
    console.warn("No se pudo actualizar la contrasena.", error);
    setAuthStatus(getFriendlyAuthError(error), "error");
  } finally {
    setFormsDisabled(false);
  }
}

async function detectPasswordResetAction() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  if (mode !== "resetPassword" || !oobCode) return;

  setFormsDisabled(true);
  setAuthStatus("Validando enlace de recuperacion...", "loading");

  try {
    const email = await authTools.verifyPasswordResetCode(firebaseAuth, oobCode);
    activePasswordResetCode = oobCode;
    authElements.loginEmail.value = normalizeEmail(email);
    showAuthView("reset", { keepStatus: true });
    setAuthStatus("Escribi tu nueva contrasena para recuperar el acceso.", "success");
  } catch (error) {
    console.warn("El enlace de recuperacion no es valido.", error);
    setAuthStatus(getFriendlyAuthError(error), "error");
    showAuthView("recovery", { keepStatus: true });
  } finally {
    setFormsDisabled(false);
  }
}

async function saveUserProfile(user, options = {}) {
  if (!user || !firestoreTools?.db) return;

  const userRef = firestoreTools.doc(firestoreTools.db, AUTH_USERS_COLLECTION, user.uid);
  const snapshot = await firestoreTools.getDoc(userRef);
  const baseData = {
    uid: user.uid,
    email: user.email,
    emailKey: normalizeEmail(user.email),
    emailVerified: Boolean(user.emailVerified),
    provider: "firebase-auth-email",
    updatedAt: firestoreTools.serverTimestamp(),
  };

  if (!snapshot.exists() || options.created) {
    baseData.createdAt = firestoreTools.serverTimestamp();
  }

  if (options.firstName || options.lastName) {
    baseData.firstName = options.firstName || "";
    baseData.lastName = options.lastName || "";
    baseData.fullName = `${options.firstName || ""} ${options.lastName || ""}`.trim();
  }

  const genderOverride = AUTH_GENDER_OVERRIDES.get(normalizeEmail(user.email));
  if (genderOverride || options.gender) {
    baseData.gender = genderOverride || options.gender;
  }

  if (options.login) {
    baseData.lastLoginAt = firestoreTools.serverTimestamp();
  }

  await firestoreTools.setDoc(userRef, baseData, { merge: true });
}

async function countRegisteredUsers() {
  if (!firestoreTools?.db) {
    throw new Error("Firestore no esta disponible para validar el cupo.");
  }

  const usersRef = firestoreTools.collection(firestoreTools.db, AUTH_USERS_COLLECTION);
  const limitedUsersQuery = firestoreTools.query(usersRef, firestoreTools.limit(MAX_REGISTERED_USERS + 1));
  const snapshot = await firestoreTools.getDocs(limitedUsersQuery);
  return snapshot.size;
}

async function countRegisteredUsersSafely() {
  try {
    return await countRegisteredUsers();
  } catch (error) {
    console.warn("No se pudo validar el cupo en Firestore. Se continua con Firebase Auth.", error);
    return null;
  }
}

async function saveUserProfileSafely(user, options = {}) {
  try {
    await saveUserProfile(user, options);
  } catch (error) {
    console.warn("No se pudo guardar el perfil en Firestore. La autenticacion continua.", error);
  }
}

async function registeredEmailExists(email) {
  if (!firestoreTools?.db) {
    throw new Error("Firestore no esta disponible para validar la cuenta.");
  }

  const usersRef = firestoreTools.collection(firestoreTools.db, AUTH_USERS_COLLECTION);
  const emailQuery = firestoreTools.query(usersRef, firestoreTools.where("emailKey", "==", email), firestoreTools.limit(1));
  const snapshot = await firestoreTools.getDocs(emailQuery);
  return !snapshot.empty;
}

function updateSessionState(user) {
  if (user) {
    if (!user.emailVerified) {
      if (isResendingVerificationEmail) return;

      authTools?.signOut(firebaseAuth).catch((error) => {
        console.warn("No se pudo cerrar la sesion no verificada.", error);
      });
      setAuthStatus("Verifica tu correo antes de ingresar.", "error");
      return;
    }

    if (!LOGIN_OWNER_EMAILS.has(normalizeEmail(user.email))) {
      setAuthStatus("Sesion iniciada. Podes acceder al calendario desde Administrador.", "success");
      return;
    }

    setAuthStatus(`Sesion iniciada como ${user.email}.`, "success");
  } else {
    setAuthStatus("Ingresa tus datos para iniciar sesion.", "neutral");
  }
}

function validateEmailAndPassword(email, password) {
  if (!email || !password) {
    setAuthStatus("Completa correo y contrasena.", "error");
    return false;
  }

  if (!validateEmailOnly(email)) return false;

  if (password.length < 6) {
    setAuthStatus("La contrasena debe tener al menos 6 caracteres.", "error");
    return false;
  }

  return true;
}

function validateRegisterData({ firstName, lastName, email, gender, password, passwordConfirm }) {
  if (!firstName || !lastName) {
    setAuthStatus("Completa nombre y apellido.", "error");
    return false;
  }

  if (!gender) {
    setAuthStatus("Selecciona el genero para configurar el perfil.", "error");
    return false;
  }

  if (!validateEmailAndPassword(email, password)) return false;

  if (!passwordConfirm) {
    setAuthStatus("Confirma la contrasena.", "error");
    return false;
  }

  if (password !== passwordConfirm) {
    setAuthStatus("Las contrasenas no coinciden.", "error");
    return false;
  }

  return true;
}

function validateEmailOnly(email) {
  if (!email) {
    setAuthStatus("Ingresa un correo.", "error");
    return false;
  }

  if (!email.includes("@") || !email.includes(".")) {
    setAuthStatus("Ingresa un correo valido para usar Firebase Authentication.", "error");
    return false;
  }

  return true;
}

function validatePasswordPair(password, passwordConfirm) {
  if (!password || !passwordConfirm) {
    setAuthStatus("Completa y confirma la nueva contrasena.", "error");
    return false;
  }

  if (password.length < 6) {
    setAuthStatus("La contrasena debe tener al menos 6 caracteres.", "error");
    return false;
  }

  if (password !== passwordConfirm) {
    setAuthStatus("Las contrasenas no coinciden.", "error");
    return false;
  }

  return true;
}

function setFormsDisabled(disabled) {
  [
    authElements.registerName,
    authElements.registerLastName,
    authElements.registerEmail,
    authElements.registerGender,
    authElements.registerPassword,
    authElements.registerPasswordConfirm,
    authElements.loginEmail,
    authElements.loginPassword,
    authElements.recoveryEmail,
    authElements.resetPassword,
    authElements.resetPasswordConfirm,
    authElements.toggleLoginPassword,
    ...authElements.registerForm.querySelectorAll("button"),
    ...authElements.loginForm.querySelectorAll("button"),
    ...authElements.recoveryForm.querySelectorAll("button"),
    ...authElements.resetPasswordForm.querySelectorAll("button"),
  ].forEach((element) => {
    element.disabled = disabled;
  });
}

function setAuthStatus(message, type = "neutral") {
  authElements.status.textContent = message;
  authElements.status.className = `login-status login-status--${type}`;
}

function showAuthView(view, options = {}) {
  const views = {
    login: authElements.loginView,
    register: authElements.registerView,
    recovery: authElements.recoveryView,
    reset: authElements.resetPasswordView,
  };

  Object.entries(views).forEach(([viewName, element]) => {
    const isActive = viewName === view;
    element.classList.toggle("is-active", isActive);
    element.setAttribute("aria-hidden", String(!isActive));
  });

  if (!options.keepStatus) {
    const messages = {
      login: "Ingresa tus datos para iniciar sesion.",
      register: "Completa tus datos para crear la cuenta.",
      recovery: "Ingresa tu correo para recuperar la contrasena.",
      reset: "Escribi y confirma tu nueva contrasena.",
    };
    setAuthStatus(messages[view] || messages.login, "neutral");
  }
}

function showVerificationNotice() {
  authElements.verificationNotice.classList.remove("is-hidden");
  document.body.classList.add("has-auth-modal");
  setVerificationStatus("Si no llego, espera unos segundos y toca reenviar.", "neutral");
}

function hideVerificationNotice() {
  authElements.verificationNotice.classList.add("is-hidden");
  document.body.classList.remove("has-auth-modal");
}

function setVerificationStatus(message, type = "neutral") {
  if (!authElements.verificationStatus) return;
  authElements.verificationStatus.textContent = message;
  authElements.verificationStatus.dataset.status = type;
}

function getFriendlyAuthError(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "Ese correo ya esta registrado.",
    "auth/invalid-email": "El correo no tiene un formato valido.",
    "auth/invalid-credential": "Los datos ingresados no son correctos.",
    "auth/missing-password": "Ingresa una contrasena.",
    "auth/network-request-failed": "No se pudo conectar con Firebase. Revisa la conexion.",
    "auth/operation-not-allowed": "El acceso con email y contrasena no esta habilitado en Firebase Authentication.",
    "auth/too-many-requests": "Hubo demasiados intentos. Espera un momento y proba otra vez.",
    "auth/user-not-found": "No existe un usuario con ese correo.",
    "auth/weak-password": "La contrasena debe tener al menos 6 caracteres.",
    "auth/wrong-password": "La contrasena no es correcta.",
    "auth/requires-recent-login": "Volve a iniciar sesion para completar esta accion.",
    "auth/expired-action-code": "El enlace de recuperacion vencio. Pedi uno nuevo.",
    "auth/invalid-action-code": "El enlace de recuperacion no es valido o ya fue usado.",
    "permission-denied": "Firestore bloqueo la operacion. Publica las reglas actualizadas y espera unos segundos antes de intentar nuevamente.",
    "firestore/permission-denied": "Firestore bloqueo la operacion. Publica las reglas actualizadas y espera unos segundos antes de intentar nuevamente.",
  };

  return messages[code] || "No se pudo completar la operacion. Revisa los datos e intenta nuevamente.";
}

function hasValidFirebaseConfig(config) {
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeGender(value) {
  return String(value || "").trim().toLowerCase();
}

function isBlockedEmail(email) {
  return BLOCKED_REGISTER_EMAILS.has(normalizeEmail(email));
}

function getPasswordResetSettings() {
  if (!/^https?:$/.test(window.location.protocol)) return undefined;

  return {
    url: `${window.location.origin}${window.location.pathname}`,
    handleCodeInApp: false,
  };
}

function getEmailVerificationSettings() {
  if (!/^https?:$/.test(window.location.protocol)) return undefined;

  return {
    url: `${window.location.origin}${window.location.pathname}`,
    handleCodeInApp: false,
  };
}
