const STORAGE_KEY = "rotador-puestos-v1";
const SCHEMA_VERSION = 10;
const ROTATION_START_DATE = "2026-04-27";
const ASSIGNMENT_META_DEFAULTS = {
  lobbyStartTime: "",
  lobbyCloseTime: "",
  boardingStartTime: "",
  boardingCloseTime: "",
  pushbackTime: "",
};

const GENDERS = {
  mujer: "Mujer",
  hombre: "Hombre",
  otro: "Sin especificar",
};

const GROUPS = [
  {
    id: "grupo1",
    label: "Grupo 1",
    people: [
      { id: "g1-nieto", name: "Nieto", gender: "hombre" },
      { id: "g1-scalora", name: "Scalora", gender: "mujer" },
      { id: "g1-aloe", name: "Aloe", gender: "hombre", blockedRoles: ["embarque.etd"] },
      {
        id: "g1-rubilar",
        name: "Rubilar",
        gender: "mujer",
        blockedRoles: ["embarque.etd", "principales.catering", "principales.rampa"],
      },
      {
        id: "g1-murua",
        name: "Murua",
        gender: "mujer",
        blockedRoles: ["embarque.etd", "principales.catering"],
      },
      { id: "g1-aros", name: "Aros", gender: "hombre" },
      { id: "g1-andres", name: "Andres", gender: "mujer", blockedRoles: ["embarque.etd"] },
      {
        id: "g1-morena-berns",
        name: "Berns",
        gender: "mujer",
        blockedRoles: ["embarque.etd", "principales.catering"],
      },
      { id: "g1-charlie", name: "Charlie", gender: "hombre", operational: false },
    ],
  },
  {
    id: "grupo2",
    label: "Grupo 2",
    people: [
      { id: "g2-acuna", name: "Acuña", gender: "hombre", blockedRoles: ["embarque.etd"] },
  { id: "g2-gonzales", name: "Gonzales", gender: "hombre" },
      { id: "g2-rosini", name: "Rosini", gender: "mujer", blockedRoles: ["embarque.etd"] },
      { id: "g2-lopez", name: "Lopez", gender: "mujer" },
      { id: "g2-rolon", name: "Rolon", gender: "mujer" },
      { id: "g2-lau-brest", name: "Lau Brest", gender: "mujer", operational: false },
    ],
  },
  {
    id: "grupo3",
    label: "Grupo 3",
    people: [
      { id: "g3-garcia", name: "Garcia", gender: "mujer" },
      { id: "g3-gorosito", name: "Gorosito", gender: "mujer", blockedRoles: ["embarque.etd"] },
      { id: "g3-alvarez", name: "Alvarez", gender: "mujer", blockedRoles: ["principales.catering"] },
      { id: "g3-rodriguez", name: "Rodriguez", gender: "mujer" },
      { id: "g3-feldman", name: "Feldman", gender: "hombre" },
      { id: "g3-lola", name: "Cordoba", gender: "mujer", blockedRoles: ["embarque.llevar_maquina"] },
      { id: "g3-lau-romero", name: "Lau Romero", gender: "mujer", operational: false },
    ],
  },
];

const PEOPLE = GROUPS.flatMap((group) =>
  group.people.map((person) => ({
    gender: "otro",
    blockedRoles: [],
    operational: true,
    ...person,
    groupId: group.id,
    groupLabel: group.label,
  })),
);

const ROTATION = [
  { groups: ["grupo1", "grupo2"], label: "Grupo 1 + Grupo 2" },
  { groups: ["grupo1", "grupo3"], label: "Grupo 1 + Grupo 3" },
  { groups: ["grupo2", "grupo3"], label: "Grupo 2 + Grupo 3" },
];

const CATERING_GROUP_BY_CYCLE_DAY = [
  "grupo1",
  "grupo2",
  "grupo3",
  "grupo1",
  "grupo2",
  "grupo3",
];

const GROUP_WORKDAY_BY_CYCLE_DAY = {
  grupo1: { 1: 1, 2: 2, 3: 3, 4: 4 },
  grupo2: { 1: 1, 2: 2, 5: 3, 6: 4 },
  grupo3: { 3: 1, 4: 2, 5: 3, 6: 4 },
};

const LOBBY_ROLE_IDS = [
  "rv",
  "documentacion",
  "ejecutiva",
  "prioridad",
  "exit",
  "exit2",
  "sublos",
  "manifiesto",
  "cierre_lobby",
];

const LOBBY_REQUIRED_ROLE_IDS = ["ejecutiva", "rv", "documentacion", "exit", "prioridad"];
const LOBBY_BASE_ROLE_IDS = ["rv", "documentacion", "ejecutiva", "prioridad", "exit", "exit2", "sublos"];
const LOBBY_CIERRE_SOURCE_ROLE_IDS = [...LOBBY_BASE_ROLE_IDS, "manifiesto"];
const ARMADO_LOBBY_PRIORITY_ROLE_IDS = ["documentacion", "exit", "sublos"];
const MANIFESTO_PRIMARY_ROLE_IDS = ["exit2", "documentacion", "sublos"];
const MANIFESTO_SUPERVISOR_IDS = ["g1-charlie", "g2-lau-brest", "g3-lau-romero"];

const SECTIONS = [
  {
    id: "principales",
    label: "Puestos principales",
    note: "Lobby requiere RV, Documentacion, Ejecutiva, Prioridad y Exit. Exit 2 y Sublos son opcionales.",
    roles: [
      { id: "rv", label: "RV", slots: 1 },
      { id: "documentacion", label: "Documentacion", slots: 3 },
      { id: "ejecutiva", label: "Ejecutiva", slots: 1 },
      { id: "prioridad", label: "Prioridad", slots: 1 },
      { id: "exit", label: "Exit", slots: 1 },
      { id: "exit2", label: "Exit 2", slots: 1, optional: true },
      { id: "catering", label: "Catering", slots: 2 },
      { id: "sublos", label: "Sublos", slots: 1, optional: true },
      { id: "manifiesto", label: "Manifiesto", slots: 1, supplemental: true },
      { id: "cierre_lobby", label: "Cierre de lobby", slots: 1, supplemental: true },
      { id: "rampa", label: "Rampa", slots: 2, optional: true, partial: true },
      { id: "chequeo_avion", label: "Chequeo del avion", slots: 4, supplemental: true, partial: true },
    ],
  },
  {
    id: "embarque",
    label: "Embarque",
    note: "Selective exige una mujer y un hombre configurados. Mesa recibe el resto del equipo activo.",
    roles: [
      {
        id: "armado_sala",
        label: "Armado de sala",
        slots: 2,
        supplemental: true,
        partial: true,
        slotRequirements: [{ requiredRoleKey: "embarque.etd" }, {}],
      },
      { id: "documentacion", label: "Documentacion", slots: 2 },
      { id: "etd", label: "ETD", slots: 1 },
      {
        id: "selective",
        label: "Selective",
        slots: 2,
        slotRequirements: [
          { label: "Mujer", gender: "mujer" },
          { label: "Hombre", gender: "hombre" },
        ],
      },
      { id: "llevar_maquina", label: "Desarme de ETD", slots: 2, supplemental: true, partial: true },
      { id: "mesa", label: "Mesa", fillRest: true },
    ],
  },
];

const DISPLAY_SECTIONS = [
  {
    id: "lobby",
    label: "Lobby",
    note: "Puestos principales de atencion.",
    sourceSectionId: "principales",
    roleIds: ["rv", "documentacion", "ejecutiva", "prioridad", "exit", "exit2", "sublos", "manifiesto", "cierre_lobby"],
  },
  {
    id: "catering_block",
    label: "Catering",
    note: "Asignacion reservada para el dia.",
    sourceSectionId: "principales",
    roleIds: ["catering"],
  },
  {
    id: "rampa_block",
    label: "Rampa",
    note: "Se completa solo si la dotacion del dia lo permite.",
    sourceSectionId: "principales",
    roleIds: ["rampa"],
  },
  {
    id: "armado_block",
    label: "Armado de sala",
    note: "Tarea de preparacion inicial de sala.",
    sourceSectionId: "embarque",
    roleIds: ["armado_sala"],
  },
  {
    id: "chequeo_block",
    label: "Chequeo del avion",
    note: "Equipo flexible de 2 a 4 personas segun asistencia.",
    sourceSectionId: "principales",
    roleIds: ["chequeo_avion"],
  },
  {
    id: "embarque_block",
    label: "Embarque",
    note: "Mesa recibe a quienes no estan en Documentacion, ETD o Selective.",
    sourceSectionId: "embarque",
    roleIds: ["documentacion", "etd", "selective", "mesa"],
  },
  {
    id: "maquina_block",
    label: "Desarme de ETD",
    note: "Cierre operativo del dia.",
    sourceSectionId: "embarque",
    roleIds: ["llevar_maquina"],
  },
];

const DISPLAY_SECTION_TIME_FIELDS = {
  lobby: [
    { key: "lobbyStartTime", label: "Inicio de lobby" },
    { key: "lobbyCloseTime", label: "Cierre de lobby" },
  ],
  embarque_block: [
    { key: "boardingStartTime", label: "Inicio de embarque" },
    { key: "boardingCloseTime", label: "Cierre de Embarque" },
    { key: "pushbackTime", label: "Pushback" },
  ],
};

const elements = {
  notice: document.querySelector("#notice"),
  peopleCount: document.querySelector("#peopleCount"),
  peopleList: document.querySelector("#peopleList"),
  absentList: document.querySelector("#absentList"),
  swapForm: document.querySelector("#swapForm"),
  swapOriginal: document.querySelector("#swapOriginal"),
  swapSubstitute: document.querySelector("#swapSubstitute"),
  swapList: document.querySelector("#swapList"),
  activeRotationLabel: document.querySelector("#activeRotationLabel"),
  assignmentDate: document.querySelector("#assignmentDate"),
  generateButton: document.querySelector("#generateButton"),
  resetGuardButton: document.querySelector("#resetGuardButton"),
  guardStartedLabel: document.querySelector("#guardStartedLabel"),
  assignmentForm: document.querySelector("#assignmentForm"),
  assignmentBoard: document.querySelector("#assignmentBoard"),
  saveAssignmentButton: document.querySelector("#saveAssignmentButton"),
  clearHistoryButton: document.querySelector("#clearHistoryButton"),
  historyList: document.querySelector("#historyList"),
};

const state = loadState();
let pendingSavePayload = null;

init();

async function init() {
  elements.assignmentDate.value = getToday();
  bindEvents();
  await hydrateHistoryFromDatabase();
  saveState();
  render();
}

function bindEvents() {
  elements.generateButton.addEventListener("click", handleGenerateAssignment);
  elements.resetGuardButton.addEventListener("click", handleResetGuard);
  elements.assignmentForm.addEventListener("submit", handleSaveManualAssignment);
  elements.assignmentBoard.addEventListener("change", handleManualAssignmentChange);
  elements.clearHistoryButton?.addEventListener("click", handleClearHistory);
  elements.assignmentDate.addEventListener("change", handleDateChange);
  elements.peopleList.addEventListener("click", handleAttendanceClick);
  elements.absentList.addEventListener("click", handleAttendanceClick);
  elements.swapForm.addEventListener("submit", handleSwapSubmit);
  elements.swapList.addEventListener("click", handleSwapListClick);
}

function loadState() {
  const fallback = createFallbackState();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.history)) return fallback;
    if (saved.schemaVersion !== SCHEMA_VERSION) return fallback;

    const guardStartedAt = saved.guardStartedAt || new Date().toISOString();
    const guardId = saved.guardId || createId();

    return {
      schemaVersion: SCHEMA_VERSION,
      guardId,
      guardStartedAt,
      rotationStartDate: ROTATION_START_DATE,
      absences: normalizeAbsences(saved.absences),
      substitutions: normalizeSubstitutions(saved.substitutions),
      history: [],
      currentAssignment: saved.currentAssignment
        ? migrateCurrentAssignment(saved.currentAssignment)
        : null,
    };
  } catch (error) {
    return fallback;
  }
}

function createFallbackState() {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    guardId: createId(),
    guardStartedAt: now,
    rotationStartDate: ROTATION_START_DATE,
    absences: {},
    substitutions: {},
    history: [],
    currentAssignment: null,
  };
}

function normalizeAbsences(absences) {
  if (!absences || typeof absences !== "object") return {};

  return Object.entries(absences).reduce((result, [date, peopleIds]) => {
    if (Array.isArray(peopleIds)) result[date] = peopleIds.filter(Boolean);
    return result;
  }, {});
}

function normalizeSubstitutions(substitutions) {
  if (!substitutions || typeof substitutions !== "object") return {};

  return Object.entries(substitutions).reduce((result, [date, swaps]) => {
    if (!swaps || typeof swaps !== "object" || Array.isArray(swaps)) return result;

    const validSwaps = Object.entries(swaps).reduce((swapResult, [originalId, substituteId]) => {
      if (getPerson(originalId) && getPerson(substituteId) && originalId !== substituteId) {
        swapResult[originalId] = substituteId;
      }
      return swapResult;
    }, {});

    if (Object.keys(validSwaps).length) result[date] = validSwaps;
    return result;
  }, {});
}

function migrateHistoryEntry(entry, guardId) {
  const sections = entry.sections || {
    principales: entry.assignments || createEmptySectionAssignment("principales"),
    embarque: createEmptySectionAssignment("embarque"),
  };

  return {
    id: entry.id || createId(),
    date: entry.date || getToday(),
    guardId: entry.guardId || guardId,
    sections: normalizeSections(sections),
    personSnapshot: entry.personSnapshot || entry.personNames || {},
    meta: normalizeAssignmentMeta(entry.meta),
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

function migrateCurrentAssignment(assignment) {
  return {
    date: assignment.date || getToday(),
    sections: normalizeSections(
      assignment.sections || {
        principales: assignment.assignments || createEmptySectionAssignment("principales"),
        embarque: createEmptySectionAssignment("embarque"),
      },
    ),
    personSnapshot: assignment.personSnapshot || assignment.personNames || {},
    meta: normalizeAssignmentMeta(assignment.meta),
  };
}

function normalizeSections(sections) {
  return SECTIONS.reduce((result, section) => {
    result[section.id] = createEmptySectionAssignment(section.id);
    section.roles.forEach((role) => {
      result[section.id][role.id] = [...(sections?.[section.id]?.[role.id] || [])];
    });
    return result;
  }, {});
}

function normalizeAssignmentMeta(meta) {
  return {
    ...ASSIGNMENT_META_DEFAULTS,
    ...(meta && typeof meta === "object" ? meta : {}),
  };
}

function saveState() {
  const localState = {
    ...state,
    history: [],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localState));
  } catch (error) {
    try {
      const fallbackState = {
        ...localState,
        history: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackState));
    } catch (fallbackError) {
      console.warn("No se pudo guardar el respaldo local.", fallbackError);
    }
  }
}

function handleGenerateAssignment() {
  const date = elements.assignmentDate.value || getToday();
  const validation = validateGenerationRequirements(date);

  const existing = state.history.find((entry) => entry.date === date);
  if (existing) {
    const confirmed = window.confirm(
      `Ya existe una asignacion guardada para ${formatDate(date)}. Queres generar una nueva version para revisar? Si guardas cambios, se actualizara esa fecha sin duplicarla.`,
    );
    if (!confirmed) return;
  }

  const generated = generateFullAssignment(date);
  setCurrentAssignment(date, generated.sections);
  saveState();
  render();

  if (!validation.ok || generated.warnings.length) {
    showNotice(
      `Asignacion parcial generada para ${formatDate(date)}. Completa o ajusta manualmente los puestos disponibles.`,
      "success",
    );
    return;
  }

  showNotice(`Asignacion generada para ${formatDate(date)}. Revisa los puestos y guarda los cambios para mostrarla en el historial.`, "success");
}

async function handleSaveManualAssignment(event) {
  event.preventDefault();
  if (!state.currentAssignment) return;

  const date = state.currentAssignment.date;
  const sections = collectAssignmentFromForm();
  const meta = collectAssignmentMetaFromForm();
  const normalizedSections = normalizeSections(sections);
  const existingEntry = getHistoryEntryByDate(date);
  const validation = validateManualAssignment(sections, date);

  if (!validation.ok) {
    showNotice(validation.message, "error");
    return;
  }

  if (existingEntry && areAssignmentPayloadEqual(existingEntry, normalizedSections, meta)) {
    showNotice(`Ya se han guardado datos de ${formatDate(date)}. Chequear en el historial.`, "error");
    return;
  }

  showSaveConfirmation({ date, sections: normalizedSections, meta, existingEntry });
}

async function saveConfirmedManualAssignment(payload) {
  const { date, sections, meta, existingEntry } = payload;
  elements.saveAssignmentButton.disabled = true;

  try {
    const result = upsertAssignment(date, sections, meta);
    saveState();
    const databaseResult = await persistFullHistoryInDatabase(result.entry);
    closeSaveConfirmation();
    render();
    const firestoreFailed = databaseResult?.firestore === false;
    const message = firestoreFailed
      ? "Firestore no respondio. Revisa la configuracion o las reglas antes de cerrar la pagina."
      : result.updated
        ? "Se actualizo la fecha guardada. Chequear en el historial."
        : "Se han guardado los cambios. Chequear en el historial.";
    showNotice(message, firestoreFailed ? "error" : "success");
  } catch (error) {
    console.warn("No se pudo guardar el historial completo.", error);
    closeSaveConfirmation();
    showNotice("No se pudo guardar el historial completo. Intentalo nuevamente.", "error");
    render();
  }
}

function showSaveConfirmation(payload) {
  pendingSavePayload = payload;
  const modal = getSaveConfirmationModal();
  const description = modal.querySelector("[data-save-confirm-description]");
  const acceptButton = modal.querySelector("[data-save-confirm-accept]");

  description.textContent = payload.existingEntry
    ? `Vas a actualizar la asignacion guardada de ${formatDate(payload.date)}. Solo se guardara si aceptas.`
    : `Vas a guardar la asignacion de ${formatDate(payload.date)} en el historial y Firestore. Solo se guardara si aceptas.`;

  acceptButton.disabled = false;
  modal.hidden = false;
  document.body.classList.add("has-save-confirm-modal");
  acceptButton.focus();
}

function closeSaveConfirmation() {
  const modal = document.querySelector("#saveConfirmModal");
  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("has-save-confirm-modal");
  pendingSavePayload = null;
}

function getSaveConfirmationModal() {
  let modal = document.querySelector("#saveConfirmModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "saveConfirmModal";
  modal.className = "save-confirm-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "saveConfirmTitle");

  modal.innerHTML = `
    <article class="save-confirm-card">
      <button class="save-confirm-close" type="button" data-save-confirm-close aria-label="Cerrar confirmacion">&times;</button>
      <p class="section-kicker">Confirmacion</p>
      <h2 id="saveConfirmTitle">Guardar cambios</h2>
      <p data-save-confirm-description></p>
      <div class="save-confirm-actions">
        <button class="secondary-button" type="button" data-save-confirm-accept>Aceptar</button>
        <button class="ghost-button" type="button" data-save-confirm-close>Seguir haciendo cambios</button>
      </div>
    </article>
  `;

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-save-confirm-close]")) {
      closeSaveConfirmation();
    }
  });

  modal.querySelector("[data-save-confirm-accept]").addEventListener("click", async (event) => {
    if (!pendingSavePayload) return;
    event.currentTarget.disabled = true;
    await saveConfirmedManualAssignment(pendingSavePayload);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeSaveConfirmation();
  });

  document.body.appendChild(modal);
  return modal;
}

function handleManualAssignmentChange(event) {
  if (!event.target.matches("select[data-section-id], input[data-assignment-meta]") || !state.currentAssignment) return;

  const date = state.currentAssignment.date;
  const sections = collectAssignmentFromForm();
  const meta = collectAssignmentMetaFromForm();

  if (event.target.matches("input[data-assignment-meta]")) {
    setCurrentAssignment(date, sections, meta);
    saveState();
    return;
  }

  const selectedPersonId = event.target.value;
  const changedRoleId = event.target.dataset.roleId;
  const adjusted = syncLobbyAndRampaSelection(sections, changedRoleId, selectedPersonId);
  setCurrentAssignment(date, sections, meta);
  saveState();
  if (adjusted) {
    renderAssignment();
  } else {
    updateLobbyEmptyCardStates();
  }
}

function handleResetGuard() {
  const date = elements.assignmentDate.value || getToday();
  const confirmed = window.confirm(
    `Esto reinicia la memoria de rotacion, los cambios de guardia, las ausencias y la asignacion actual de ${formatDate(date)}. El historial guardado no se borra. Queres continuar?`,
  );
  if (!confirmed) return;

  state.guardId = createId();
  state.guardStartedAt = new Date().toISOString();
  clearDailySetup(date);
  state.currentAssignment = null;
  saveState();
  render();
  showNotice(`Guardia reiniciada para ${formatDate(date)}. Ya podes generar puestos desde cero.`, "success");
}

function handleClearHistory() {
  if (!state.history.length) {
    showNotice("No hay historial para limpiar.", "error");
    return;
  }

  const confirmed = window.confirm(
    "Esto borrara el historial y la asignacion actual. Queres continuar?",
  );
  if (!confirmed) return;

  state.history = [];
  state.currentAssignment = null;
  clearHistoryDatabaseStorage();
  saveState();
  render();
  showNotice("Historial eliminado.", "success");
}

function handleDateChange() {
  const date = elements.assignmentDate.value;
  const entry = getSortedHistory()
    .slice()
    .reverse()
    .find((item) => item.date === date);
  state.currentAssignment = entry ? cloneEntryAsCurrent(entry) : null;
  saveState();
  render();
}

function handleAttendanceClick(event) {
  const button = event.target.closest("[data-attendance-action]");
  if (!button) return;

  const date = elements.assignmentDate.value || getToday();
  const personId = button.dataset.personId;
  const personName = getPersonName(personId);

  if (button.dataset.attendanceAction === "remove") {
    markPersonAbsent(date, personId);
    removePersonFromCurrentAssignment(personId, date);
    saveState();
    render();
    showNotice(`${personName} queda fuera de la asignacion de ${formatDate(date)}.`, "success");
    return;
  }

  if (button.dataset.attendanceAction === "restore") {
    restorePersonAttendance(date, personId);
    saveState();
    render();
    showNotice(`${personName} vuelve a estar disponible para ${formatDate(date)}.`, "success");
  }
}

function handleSwapSubmit(event) {
  event.preventDefault();

  const date = elements.assignmentDate.value || getToday();
  const originalId = elements.swapOriginal.value;
  const substituteId = elements.swapSubstitute.value;

  if (!originalId || !substituteId) {
    showNotice("Elegi quien sale y quien entra para aplicar el cambio.", "error");
    return;
  }

  if (originalId === substituteId) {
    showNotice("La persona que entra debe ser distinta a la que sale.", "error");
    return;
  }

  applySubstitution(date, originalId, substituteId);
  clearCurrentAssignmentForDate(date);
  saveState();
  render();
  showNotice(
    `${getPersonName(substituteId)} queda cubriendo el lugar de ${getPersonName(originalId)} para ${formatDate(date)}.`,
    "success",
  );
}

function handleSwapListClick(event) {
  const button = event.target.closest("[data-swap-action='remove']");
  if (!button) return;

  const date = elements.assignmentDate.value || getToday();
  removeSubstitution(date, button.dataset.originalId);
  clearCurrentAssignmentForDate(date);
  saveState();
  render();
  showNotice("Cambio de guardia eliminado para esta fecha.", "success");
}

function validateGenerationRequirements(date) {
  const activePeople = getActivePeople(date);
  const women = activePeople.filter((person) => person.gender === "mujer").length;
  const men = activePeople.filter((person) => person.gender === "hombre").length;

  if (!activePeople.length) {
    return {
      ok: false,
      message: "No hay personas operativas disponibles para esta fecha.",
    };
  }

  if (!activePeople.some((person) => canUseRole(person, "embarque.etd"))) {
    return {
      ok: false,
      message: "No hay ninguna persona activa habilitada para ETD.",
    };
  }

  if (activePeople.length < getRequiredLobbySlotCount()) {
    return {
      ok: false,
      message: "Lobby necesita como minimo 7 personas: 1 Ejecutiva, 1 RV, 3 Documentacion, 1 Exit y 1 Prioridad.",
    };
  }

  const cateringPlan = getCateringPlan(date);

  if (cateringPlan.people.length < 2) {
    return {
      ok: false,
      message: "No hay 2 personas presentes para completar Catering.",
    };
  }

  if (!women || !men) {
    return {
      ok: false,
      message:
        "Selective necesita una persona configurada como mujer y una como hombre dentro de las personas disponibles.",
    };
  }

  return { ok: true };
}

function generateFullAssignment(date) {
  const sections = {};
  const context = {};
  const warnings = [];

  for (const section of SECTIONS) {
    const generated = generateSectionAssignment(section, date, context);
    sections[section.id] = generated.assignment;
    warnings.push(...generated.warnings);
    if (section.id === "principales") {
      context.noArmadoSalaIds = new Set([
        ...(generated.assignment.catering || []),
        ...(generated.assignment.chequeo_avion || []),
      ]);
      context.cierreLobbyIds = new Set(generated.assignment.cierre_lobby || []);
      context.lobbyAssignment = generated.assignment;
    }
  }

  return { ok: true, sections, warnings };
}

function generateSectionAssignment(section, date, context = {}) {
  const activePeople = getActivePeople(date);
  const cycleState = buildCycleState(date);
  const totals = buildPersonTotals(date);
  const roleTotals = buildPersonRoleTotals(date);
  const assignment = createEmptySectionAssignment(section.id);
  const warnings = [];
  const assignedInSection = new Set();
  const fixedRoles = section.roles
    .filter((role) => !role.fillRest)
    .sort((a, b) => Number(Boolean(a.supplemental)) - Number(Boolean(b.supplemental)));
  const restRole = section.roles.find((role) => role.fillRest);
  const restRoleKey = restRole ? getRoleKey(section.id, restRole.id) : null;
  const cateringGroupId = section.id === "principales" ? getCateringGroupId(date) : null;
  const cateringPlan = section.id === "principales" ? getCateringPlan(date) : null;
  const cateringGroupPeople = cateringGroupId
    ? activePeople.filter((person) => person.groupId === cateringGroupId)
    : [];
  const cateringPeople = cateringPlan?.people || [];
  const preferredLobbyPeople = new Set(
    section.id === "principales" ? getLobbyPriorityPeople(date).map((person) => person.id) : [],
  );
  let chequeoRole = null;

  if (cateringGroupId) {
    const cateringRole = section.roles.find((role) => role.id === "catering");
    chequeoRole = section.roles.find((role) => role.id === "chequeo_avion");
    const cateringResult = assignRoleSlots({
      section,
      role: cateringRole,
      date,
      activePeople: cateringPeople,
      assignment,
      assignedInSection,
      cycleState,
      totals,
      roleTotals,
      requiredCount: cateringRole.slots,
      ignoreRoleBlocks: cateringPlan.ignoreRoleBlocks,
    });

    if (!cateringResult.ok) warnings.push(cateringResult.message);
  }

  for (const role of fixedRoles) {
    if (cateringGroupId && (role.id === "catering" || role.id === "chequeo_avion")) continue;
    if (section.id === "principales" && (role.id === "manifiesto" || role.id === "cierre_lobby")) continue;
    const rolePeople =
      section.id === "embarque" && role.id === "armado_sala"
        ? getArmadoSalaCandidatePeople(date, activePeople, context)
        : section.id === "principales" && role.id === "rampa"
          ? getRampaCandidatePeople(date, activePeople, assignment)
        : section.id === "embarque" && role.id !== "llevar_maquina" && role.id !== "mesa"
          ? activePeople.filter((person) => !context.cierreLobbyIds?.has(person.id))
          : activePeople;
    const preferredPeopleIds =
      section.id === "principales" && isLobbyRole(role.id) && preferredLobbyPeople.size
        ? preferredLobbyPeople
        : null;

    const result =
      section.id === "embarque" && role.id === "armado_sala"
        ? assignArmadoSala({
            date,
            section,
            role,
            activePeople: rolePeople,
            assignment,
            assignedInSection,
            cycleState,
            totals,
            roleTotals,
            context,
          })
        : section.id === "embarque" && role.id === "llevar_maquina"
        ? assignLlevarMaquina({
            date,
            section,
            role,
            activePeople: rolePeople,
            assignment,
            assignedInSection,
            cycleState,
            totals,
            roleTotals,
          })
        : assignRoleSlots({
            section,
            role,
            date,
            activePeople: rolePeople,
            assignment,
            assignedInSection,
            cycleState,
            totals,
            roleTotals,
            preferRoleKey: restRoleKey,
            preferredPeopleIds,
            trackHistory: !role.supplemental,
          });

    if (!result.ok) {
      warnings.push(result.message);
      continue;
    }
  }

  if (section.id === "principales" && chequeoRole) {
    const chequeoResult = assignChequeoAvion({
      date,
      section,
      role: chequeoRole,
      activePeople,
      assignment,
      cycleState,
      totals,
      roleTotals,
    });

    if (!chequeoResult.ok) warnings.push(chequeoResult.message);
  }

  if (section.id === "principales") {
    const manifestoRole = section.roles.find((role) => role.id === "manifiesto");
    const manifestoResult = assignManifesto({
      date,
      role: manifestoRole,
      assignment,
      totals,
    });
    if (!manifestoResult.ok) warnings.push(manifestoResult.message);

    const cierreRole = section.roles.find((role) => role.id === "cierre_lobby");
    const cierreResult = assignCierreLobby({
      date,
      role: cierreRole,
      assignment,
      totals,
    });
    if (!cierreResult.ok) warnings.push(cierreResult.message);
  }

  if (restRole) {
    const restAssignedInSection =
      section.id === "embarque" ? getExclusiveAssignedSet(section, assignment) : assignedInSection;
    const restResult = assignRestRole({
      section,
      role: restRole,
      activePeople,
      assignment,
      assignedInSection: restAssignedInSection,
      cycleState,
      trackHistory: section.id !== "embarque",
    });
    if (!restResult.ok) warnings.push(restResult.message);
  }

  return { ok: true, assignment, warnings };
}

function assignRoleSlots({
  section,
  role,
  activePeople,
  assignment,
  assignedInSection,
  cycleState,
  totals,
  roleTotals,
  preferRoleKey = null,
  preferredPeopleIds = null,
  requiredCount = role.slots,
  trackHistory = true,
  ignoreRoleBlocks = false,
}) {
  const requirements = getSlotRequirements(role);

  for (let index = 0; index < requiredCount; index += 1) {
    const requirement = requirements[index] || {};
    let chosen = choosePerson({
      section,
      role,
      activePeople,
      assignedInSection,
      requiredGender: requirement.gender,
      requiredRoleKey: requirement.requiredRoleKey,
      preferRoleKey,
      preferredPeopleIds,
      cycleState,
      totals,
      roleTotals,
      ignoreRoleBlocks,
    });

    if (!chosen && !canRoleRemainEmpty(section, role)) {
      chosen = choosePerson({
        section,
        role,
        activePeople,
        assignedInSection: new Set(),
        requiredGender: requirement.gender,
        requiredRoleKey: requirement.requiredRoleKey,
        preferRoleKey,
        preferredPeopleIds,
        cycleState,
        totals,
        roleTotals,
        ignoreRoleBlocks,
      });
    }

    if (!chosen) {
      return {
        ok: false,
        message: buildNoCandidateMessage(section, role, requirement.gender, requirement.requiredRoleKey),
      };
    }

    assignment[role.id].push(chosen.id);
    assignedInSection.add(chosen.id);
    preferredPeopleIds?.delete(chosen.id);
    if (trackHistory) rememberRole(cycleState, chosen.id, getRoleKey(section.id, role.id));
  }

  return { ok: true };
}

function assignManifesto({ date, role, assignment, totals }) {
  const candidates = getManifestoCandidatePeople(assignment, date);
  if (!candidates.length) {
    return {
      ok: false,
      message: "Manifiesto necesita alguien en Documentacion, Sublos o Exit 2, o un encargado disponible.",
    };
  }

  const chosen = candidates
    .slice()
    .sort((a, b) => {
      const totalDiff = (totals.get(a.id) || 0) - (totals.get(b.id) || 0);
      if (totalDiff !== 0) return totalDiff;
      return a.name.localeCompare(b.name, "es");
    })[0];

  assignment[role.id].push(chosen.id);
  return { ok: true };
}

function assignCierreLobby({ date, role, assignment, totals }) {
  const candidates = getCierreLobbyCandidatePeople(assignment, date);
  if (!candidates.length) {
    return {
      ok: false,
      message: "Cierre de lobby necesita una persona que ya este asignada en Lobby.",
    };
  }

  const chosen = candidates
    .slice()
    .sort((a, b) => {
      const totalDiff = (totals.get(a.id) || 0) - (totals.get(b.id) || 0);
      if (totalDiff !== 0) return totalDiff;
      return a.name.localeCompare(b.name, "es");
    })[0];

  assignment[role.id].push(chosen.id);
  return { ok: true };
}

function assignArmadoSala({
  date,
  section,
  role,
  activePeople,
  assignment,
  assignedInSection,
  cycleState,
  totals,
  roleTotals,
  context,
}) {
  const lobbyCandidates = getArmadoLobbyCandidates(context.lobbyAssignment || {}, date, activePeople);
  const etdLobbyCandidates = lobbyCandidates.filter((person) => canUseRole(person, "embarque.etd"));
  const selected = new Set();

  let first = choosePerson({
    section,
    role,
    activePeople: etdLobbyCandidates,
    assignedInSection: selected,
    requiredRoleKey: "embarque.etd",
    cycleState,
    totals,
    roleTotals,
    trackHistory: false,
  });

  if (!first) {
    first = choosePerson({
      section,
      role,
      activePeople: activePeople.filter((person) => canUseRole(person, "embarque.etd")),
      assignedInSection: selected,
      requiredRoleKey: "embarque.etd",
      cycleState,
      totals,
      roleTotals,
      trackHistory: false,
    });
  }

  if (!first) {
    return {
      ok: false,
      message: "Armado de sala necesita una persona habilitada para ETD.",
    };
  }

  assignment[role.id].push(first.id);
  selected.add(first.id);
  assignedInSection.add(first.id);

  const secondPool = lobbyCandidates.filter((person) => person.id !== first.id);
  const second = choosePerson({
    section,
    role,
    activePeople: secondPool.length ? secondPool : activePeople,
    assignedInSection: selected,
    cycleState,
    totals,
    roleTotals,
    trackHistory: false,
  });

  if (second) {
    assignment[role.id].push(second.id);
    assignedInSection.add(second.id);
  }

  return { ok: true };
}

function assignLlevarMaquina({
  date,
  section,
  role,
  activePeople,
  assignment,
  assignedInSection,
  cycleState,
  totals,
  roleTotals,
}) {
  const etdEnabledPeople = getDesarmeEtdCandidatePeople(date, activePeople);
  const firstResult = assignRoleSlots({
    section,
    role,
    activePeople: etdEnabledPeople,
    assignment,
    assignedInSection,
    cycleState,
    totals,
    roleTotals,
    requiredCount: 1,
    trackHistory: false,
  });

  if (!firstResult.ok) {
    const fallback = choosePerson({
      section,
      role,
      activePeople: etdEnabledPeople,
      assignedInSection: new Set(),
      requiredRoleKey: "embarque.etd",
      cycleState,
      totals,
      roleTotals,
    });

    if (!fallback) return firstResult;

    assignment[role.id].push(fallback.id);
    assignedInSection.add(fallback.id);
  }

  const remainingResult = assignRoleSlots({
    section,
    role,
    activePeople,
    assignment,
    assignedInSection,
    cycleState,
    totals,
    roleTotals,
    requiredCount: role.slots - 1,
    trackHistory: false,
  });

  return remainingResult.ok ? remainingResult : { ok: true };
}

function assignChequeoAvion({
  date,
  section,
  role,
  activePeople,
  assignment,
  cycleState,
  totals,
  roleTotals,
}) {
  const activeIds = new Set(activePeople.map((person) => person.id));
  const cateringIds = [...new Set(assignment.catering || [])].filter((personId) => activeIds.has(personId));
  const cateringGroupIds = [
    ...new Set(cateringIds.map((personId) => getPersonForDate(personId, date)?.groupId).filter(Boolean)),
  ];
  const chequeoGroupId = cateringGroupIds[0];
  const selectedForChequeo = new Set(cateringIds);

  assignment[role.id] = [];

  cateringIds.forEach((personId) => {
    assignment[role.id].push(personId);
  });

  if (!chequeoGroupId) {
    return {
      ok: false,
      message: "Chequeo del avion necesita tomar como base a las personas de Catering.",
    };
  }

  const roleKey = getRoleKey(section.id, role.id);
  const lobbySameGroupPeople = getAssignedLobbyIds(assignment)
    .map((personId) => getPersonForDate(personId, date))
    .filter((person) => person?.groupId === chequeoGroupId && canUseRole(person, roleKey));
  const sameGroupPeople = activePeople.filter(
    (person) => person.groupId === chequeoGroupId && canUseRole(person, roleKey),
  );

  while (assignment[role.id].length < role.slots) {
    const preferredPool = lobbySameGroupPeople.some((person) => !selectedForChequeo.has(person.id))
      ? lobbySameGroupPeople
      : sameGroupPeople;
    let chosen = choosePerson({
      section,
      role,
      activePeople: preferredPool,
      assignedInSection: selectedForChequeo,
      cycleState,
      totals,
      roleTotals,
    });

    if (!chosen) {
      if (assignment[role.id].length >= 3) break;
      chosen = choosePerson({
        section,
        role,
        activePeople: sameGroupPeople,
        assignedInSection: selectedForChequeo,
        cycleState,
        totals,
        roleTotals,
      });
    }

    if (!chosen) break;

    assignment[role.id].push(chosen.id);
    selectedForChequeo.add(chosen.id);
  }

  if (assignment[role.id].length < 3) {
    return {
      ok: false,
      message: "Chequeo del avion necesita 3 o 4 personas del mismo grupo que Catering.",
    };
  }

  return { ok: true };
}

function getRampaCandidatePeople(date, activePeople, assignment) {
  const cateringGroupIds = [
    ...new Set((assignment.catering || []).map((personId) => getPersonForDate(personId, date)?.groupId).filter(Boolean)),
  ];
  const roleKey = "principales.rampa";

  if (cateringGroupIds.length === 1) {
    const sameCateringGroupPeople = activePeople.filter(
      (person) => person.groupId === cateringGroupIds[0] && canUseRole(person, roleKey),
    );
    if (sameCateringGroupPeople.length) return sameCateringGroupPeople;
  }

  const sameGroupPool = GROUPS.map((group) =>
    activePeople.filter((person) => person.groupId === group.id && canUseRole(person, roleKey)),
  ).find((people) => people.length >= 2);

  return sameGroupPool || activePeople.filter((person) => canUseRole(person, roleKey));
}

function assignRestRole({
  section,
  role,
  activePeople,
  assignment,
  assignedInSection,
  cycleState,
  trackHistory = true,
}) {
  const roleKey = getRoleKey(section.id, role.id);
  const repeated = [];

  activePeople.forEach((person) => {
    if (assignedInSection.has(person.id)) return;

    const doneRoles = cycleState.get(person.id) || new Set();
    if ((trackHistory && doneRoles.has(roleKey)) || !canUseRole(person, roleKey)) {
      repeated.push(person.name);
      return;
    }

    assignment[role.id].push(person.id);
    if (trackHistory) rememberRole(cycleState, person.id, roleKey);
  });

  if (repeated.length) {
    return {
      ok: false,
      message:
        "No se pudo completar Mesa sin repetir o violar reglas. Reinicia la guardia o revisa el ciclo.",
    };
  }

  return { ok: true };
}

function choosePerson({
  section,
  role,
  activePeople,
  assignedInSection,
  requiredGender,
  requiredRoleKey,
  preferRoleKey,
  preferredPeopleIds,
  cycleState,
  totals,
  roleTotals,
  ignoreRoleBlocks = false,
}) {
  const roleKey = getRoleKey(section.id, role.id);

  const candidates = activePeople
    .filter((person) => !assignedInSection.has(person.id))
    .filter((person) => !requiredGender || person.gender === requiredGender)
    .filter((person) => !requiredRoleKey || canUseRole(person, requiredRoleKey))
    .filter((person) => ignoreRoleBlocks || canUseRole(person, roleKey))
    .map((person) => {
      const doneRoles = cycleState.get(person.id) || new Set();
      return {
        person,
        alreadyDidRole: doneRoles.has(roleKey),
        preferred: preferredPeopleIds?.has(person.id) || false,
        prefersFixedRole: Boolean(preferRoleKey && doneRoles.has(preferRoleKey)),
        roleCount: roleTotals.get(`${person.id}:${roleKey}`) || 0,
        totalCount: totals.get(person.id) || 0,
        random: Math.random(),
      };
    })
    .sort((a, b) => {
      if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
      if (a.prefersFixedRole !== b.prefersFixedRole) return a.prefersFixedRole ? -1 : 1;
      if (a.alreadyDidRole !== b.alreadyDidRole) return a.alreadyDidRole ? 1 : -1;
      if (a.roleCount !== b.roleCount) return a.roleCount - b.roleCount;
      if (a.totalCount !== b.totalCount) return a.totalCount - b.totalCount;
      return a.random - b.random;
    });

  return candidates[0]?.person || null;
}

function buildCycleState(excludedDate = null) {
  const cycles = new Map();
  const entries = getSortedHistory().filter(
    (entry) => entry.guardId === state.guardId && entry.date !== excludedDate,
  );

  entries.forEach((entry) => {
    SECTIONS.forEach((section) => {
      section.roles.forEach((role) => {
        if (role.supplemental) return;
        const peopleIds = entry.sections?.[section.id]?.[role.id] || [];
        peopleIds.forEach((personId) => {
          rememberRole(cycles, personId, getRoleKey(section.id, role.id));
        });
      });
    });
  });

  return cycles;
}

function buildPersonTotals(excludedDate = null) {
  const totals = new Map();
  const entries = getSortedHistory().filter(
    (entry) => entry.guardId === state.guardId && entry.date !== excludedDate,
  );

  entries.forEach((entry) => {
    getRotatingPeopleFromSections(entry.sections).forEach((personId) => {
      totals.set(personId, (totals.get(personId) || 0) + 1);
    });
  });

  return totals;
}

function buildPersonRoleTotals(excludedDate = null) {
  const totals = new Map();
  const entries = getSortedHistory().filter(
    (entry) => entry.guardId === state.guardId && entry.date !== excludedDate,
  );

  entries.forEach((entry) => {
    SECTIONS.forEach((section) => {
      section.roles.forEach((role) => {
        if (role.supplemental) return;
        const roleKey = getRoleKey(section.id, role.id);
        (entry.sections?.[section.id]?.[role.id] || []).forEach((personId) => {
          const key = `${personId}:${roleKey}`;
          totals.set(key, (totals.get(key) || 0) + 1);
        });
      });
    });
  });

  return totals;
}

function rememberRole(cycles, personId, roleKey) {
  const doneRoles = cycles.get(personId) || new Set();
  doneRoles.add(roleKey);
  cycles.set(personId, doneRoles);
}

function buildNoCandidateMessage(section, role, requiredGender = null, requiredRoleKey = null) {
  const genderText = requiredGender ? ` (${GENDERS[requiredGender]})` : "";
  const etdText = requiredRoleKey === "embarque.etd" ? " con habilitacion para ETD" : "";
  return `No hay personas disponibles${etdText} para ${section.label} - ${role.label}${genderText} sin violar restricciones.`;
}

function validateManualAssignment(sections, date) {
  const activePeople = getActivePeople(date);
  const activeIds = activePeople.map((person) => person.id);
  for (const section of SECTIONS) {
    const selectedInSection = [];

    for (const role of section.roles) {
      const peopleIds = sections[section.id]?.[role.id] || [];
      const roleKey = getRoleKey(section.id, role.id);

      if (role.slots && peopleIds.length > role.slots) {
        return {
          ok: false,
          message: `${section.label} - ${role.label} puede tener como maximo ${role.slots} ${role.slots === 1 ? "persona" : "personas"}.`,
        };
      }

      if (role.id === "selective" && peopleIds.length === role.slots) {
        const genders = peopleIds.map((personId) => getPersonGender(personId));
        if (!genders.includes("mujer") || !genders.includes("hombre")) {
          return {
            ok: false,
            message: "Selective debe tener obligatoriamente una mujer y un hombre configurados.",
          };
        }
      }

      for (const personId of peopleIds) {
        const person = getPersonForDate(personId, date);
        const isManifestoAllowed =
          roleKey === "principales.manifiesto" &&
          getManifestoCandidatePeople(sections.principales, date).some((candidate) => candidate.id === personId);

        if (!activeIds.includes(personId) && !isManifestoAllowed) {
          return {
            ok: false,
            message: `${getPersonName(personId)} no esta disponible en esa fecha.`,
          };
        }

        const ignoreRoleBlocks =
          roleKey === "principales.catering" && getCateringPlan(date).ignoreRoleBlocks;
        if (!isManifestoAllowed && !ignoreRoleBlocks && !canUseRole(person, roleKey)) {
          return {
            ok: false,
            message: `${person.name} no puede ocupar ${section.label} - ${role.label}.`,
          };
        }
      }

      selectedInSection.push(...peopleIds);
    }

    const duplicateValidation = validateSectionDuplicates(section, sections[section.id]);
    if (!duplicateValidation.ok) return duplicateValidation;
  }

  const special = validateCateringGroupRule(sections, date);
  if (!special.ok) return special;

  const manifestoSpecial = validateManifestoRule(sections, date);
  if (!manifestoSpecial.ok) return manifestoSpecial;

  const llevarMaquinaSpecial = validateLlevarMaquinaRule(sections, date);
  if (!llevarMaquinaSpecial.ok) return llevarMaquinaSpecial;

  const armadoSpecial = validateArmadoSalaRule(sections, date);
  if (!armadoSpecial.ok) return armadoSpecial;

  const cierreSpecial = validateCierreLobbyRule(sections, date);
  if (!cierreSpecial.ok) return cierreSpecial;

  return { ok: true };
}

function validateSectionDuplicates(section, sectionAssignment, allowDailyRepeats = false) {
  return { ok: true };

  const rolesByPerson = new Map();

  section.roles.forEach((role) => {
    (sectionAssignment?.[role.id] || []).forEach((personId) => {
      const roles = rolesByPerson.get(personId) || [];
      roles.push(role.id);
      rolesByPerson.set(personId, roles);
    });
  });

  for (const [personId, roleIds] of rolesByPerson.entries()) {
    if (roleIds.length <= 1) continue;

    const uniqueRoles = new Set(roleIds);
    const validSupplementalRepeat =
      section.id === "principales" &&
      uniqueRoles.has("chequeo_avion") &&
      uniqueRoles.size === 2 &&
      roleIds.length === 2;
    const validEmbarqueMesaRepeat =
      section.id === "embarque" &&
      uniqueRoles.has("mesa") &&
      uniqueRoles.size > 1;
    const validEmbarqueMaquinaRepeat =
      section.id === "embarque" &&
      uniqueRoles.has("llevar_maquina") &&
      uniqueRoles.size > 1;
    const validManifestoRepeat =
      section.id === "principales" &&
      roleIds.length === 2 &&
      uniqueRoles.has("manifiesto") &&
      [...uniqueRoles].some((roleId) => MANIFESTO_PRIMARY_ROLE_IDS.includes(roleId));

    if (!validSupplementalRepeat && !validEmbarqueMesaRepeat && !validEmbarqueMaquinaRepeat && !validManifestoRepeat) {
      return {
        ok: false,
        message: `${getPersonName(personId)} no puede repetirse en esos puestos el mismo dia.`,
      };
    }
  }

  return { ok: true };
}

function getMissingMesaPeople(sectionAssignment, activeIds) {
  const exclusiveIds = new Set([
    ...(sectionAssignment.documentacion || []),
    ...(sectionAssignment.etd || []),
    ...(sectionAssignment.selective || []),
  ]);
  const mesaIds = new Set(sectionAssignment.mesa || []);

  return activeIds.filter((personId) => !exclusiveIds.has(personId) && !mesaIds.has(personId));
}

function validateCateringGroupRule(sections, date) {
  const cateringGroupId = getCateringGroupId(date);
  const activeIds = new Set(getActivePeople(date).map((person) => person.id));
  const cateringPlan = getCateringPlan(date);
  const cateringIds = sections.principales?.catering || [];
  const chequeoIds = sections.principales?.chequeo_avion || [];
  const rampaIds = sections.principales?.rampa || [];
  const lobbyIds = getAssignedLobbyIdsByRoles(sections.principales || {}, LOBBY_ROLE_IDS);
  const lobbyOverlap = cateringIds.find((personId) => lobbyIds.includes(personId));
  const rampaOverlap = rampaIds.find((personId) => lobbyIds.includes(personId) || cateringIds.includes(personId));

  if (lobbyOverlap) {
    return {
      ok: false,
      message: `${getPersonName(lobbyOverlap)} no puede estar en Catering y Lobby el mismo dia.`,
    };
  }

  if (rampaOverlap) {
    return {
      ok: false,
      message: `${getPersonName(rampaOverlap)} no puede estar en Rampa junto con Lobby o Catering.`,
    };
  }

  const cateringOk =
    cateringIds.length <= 2 &&
    cateringIds.every((personId) => {
      const person = getPersonForDate(personId, date);
      return (
        activeIds.has(personId) &&
        (cateringPlan.relaxed || person?.groupId === cateringGroupId) &&
        (cateringPlan.ignoreRoleBlocks || canUseRole(person, "principales.catering"))
      );
    });

  if (!cateringOk) {
    return {
      ok: false,
      message: "Catering puede quedar vacio o tener hasta 2 personas presentes disponibles.",
    };
  }

  const chequeoUniqueIds = new Set(chequeoIds);
  const chequeoGroupIds = [
    ...new Set(chequeoIds.map((personId) => getPersonForDate(personId, date)?.groupId).filter(Boolean)),
  ];
  const cateringGroupIds = [
    ...new Set(cateringIds.map((personId) => getPersonForDate(personId, date)?.groupId).filter(Boolean)),
  ];
  const chequeoOk =
    chequeoIds.length >= 3 &&
    chequeoIds.length <= 4 &&
    chequeoUniqueIds.size === chequeoIds.length &&
    chequeoIds.every((personId) => activeIds.has(personId)) &&
    cateringIds.every((personId) => chequeoUniqueIds.has(personId)) &&
    chequeoGroupIds.length === 1 &&
    (!cateringGroupIds.length || cateringGroupIds.length === 1) &&
    (!cateringGroupIds.length || chequeoGroupIds[0] === cateringGroupIds[0]);

  if (!chequeoOk) {
    return {
      ok: false,
      message: "Chequeo del avion debe tener 3 o 4 personas del mismo grupo e incluir a las personas de Catering.",
    };
  }

  const rampaOk = rampaIds.every(
    (personId) =>
      activeIds.has(personId) &&
      canUseRole(getPersonForDate(personId, date), "principales.rampa"),
  );
  const rampaGroupIds = [
    ...new Set(rampaIds.map((personId) => getPersonForDate(personId, date)?.groupId).filter(Boolean)),
  ];
  if (!rampaOk) {
    return {
      ok: false,
      message: "Rampa debe usar personas presentes disponibles.",
    };
  }
  if (rampaGroupIds.length > 1) {
    return {
      ok: false,
      message: "Rampa debe usar personas del mismo grupo.",
    };
  }

  return { ok: true };
}

function validateManifestoRule(sections, date) {
  const manifestoIds = sections.principales?.manifiesto || [];
  if (!manifestoIds.length) return { ok: true };

  const allowedIds = new Set(getManifestoCandidatePeople(sections.principales, date).map((person) => person.id));
  const invalidId = manifestoIds.find((personId) => !allowedIds.has(personId));

  if (invalidId) {
    return {
      ok: false,
      message: `${getPersonName(invalidId)} solo puede hacer Manifiesto si esta en Documentacion, Sublos o Exit 2. Si esos puestos estan vacios, debe hacerlo un encargado.`,
    };
  }

  return { ok: true };
}

function validateLlevarMaquinaRule(sections, date) {
  const llevarIds = sections.embarque?.llevar_maquina || [];
  if (!llevarIds.length) {
    return {
      ok: false,
      message: "Desarme de ETD no puede quedar vacio. Necesita al menos una persona habilitada para ETD.",
    };
  }

  const hasEtdEnabled = llevarIds.some((personId) =>
    canUseRole(getPersonForDate(personId, date), "embarque.etd"),
  );
  if (!hasEtdEnabled) {
    return {
      ok: false,
      message: "Desarme de ETD necesita al menos una persona habilitada para ETD.",
    };
  }

  return { ok: true };
}

function getDesarmeEtdCandidatePeople(date, activePeople) {
  const presentEtdPeople = activePeople.filter((person) => canUseRole(person, "embarque.etd"));
  if (presentEtdPeople.length) return presentEtdPeople;

  return getRotationPeople(date).filter(
    (person) => person.operational !== false && canUseRole(person, "embarque.etd"),
  );
}

function validateArmadoSalaRule(sections, date) {
  const blockedIds = new Set([
    ...(sections.principales?.catering || []),
    ...(sections.principales?.chequeo_avion || []),
  ]);
  const armadoIds = sections.embarque?.armado_sala || [];
  const overlap = armadoIds.find((personId) => blockedIds.has(personId));

  if (overlap) {
    return {
      ok: false,
      message: `${getPersonName(overlap)} no puede estar en Armado de sala porque esta en Catering o Chequeo del avion.`,
    };
  }

  if (armadoIds.length) {
    const hasEtdEnabled = armadoIds.some((personId) =>
      canUseRole(getPersonForDate(personId, date), "embarque.etd"),
    );
    const lobbyIds = getAssignedLobbyIds(sections.principales || {});
    const cierreIds = new Set(sections.principales?.cierre_lobby || []);
    const hasLobbyPerson = armadoIds.some((personId) => lobbyIds.includes(personId));
    const cierreOverlap = armadoIds.find((personId) => cierreIds.has(personId));

    if (!hasEtdEnabled) {
      return {
        ok: false,
        message: "Armado de sala necesita al menos una persona habilitada para ETD.",
      };
    }

    if (!hasLobbyPerson) {
      return {
        ok: false,
        message: "Armado de sala necesita al menos una persona que venga de Lobby.",
      };
    }

    if (cierreOverlap) {
      return {
        ok: false,
        message: `${getPersonName(cierreOverlap)} cierra Lobby y en Embarque solo puede estar en Mesa o Desarme de ETD.`,
      };
    }
  }

  return { ok: true };
}

function validateCierreLobbyRule(sections, date) {
  const cierreIds = sections.principales?.cierre_lobby || [];
  if (!cierreIds.length) return { ok: true };

  const lobbyIds = new Set(getCierreLobbyCandidatePeople(sections.principales || {}, date).map((person) => person.id));
  const invalidCierreId = cierreIds.find((personId) => !lobbyIds.has(personId));
  if (invalidCierreId) {
    return {
      ok: false,
      message: `${getPersonName(invalidCierreId)} solo puede hacer Cierre de lobby si ya esta asignado en Lobby.`,
    };
  }

  const restrictedEmbarqueRoles = ["armado_sala", "documentacion", "etd", "selective"];
  const chequeoOverlapId = cierreIds.find((personId) =>
    (sections.principales?.chequeo_avion || []).includes(personId),
  );
  if (chequeoOverlapId) {
    return {
      ok: false,
      message: `${getPersonName(chequeoOverlapId)} cierra Lobby y no puede hacer Chequeo del avion.`,
    };
  }

  const invalidEmbarqueId = cierreIds.find((personId) =>
    restrictedEmbarqueRoles.some((roleId) => (sections.embarque?.[roleId] || []).includes(personId)),
  );
  if (invalidEmbarqueId) {
    return {
      ok: false,
      message: `${getPersonName(invalidEmbarqueId)} cierra Lobby y en Embarque solo puede estar en Mesa o Desarme de ETD.`,
    };
  }

  const missingMesaId = cierreIds.find((personId) => !(sections.embarque?.mesa || []).includes(personId));
  if (missingMesaId) {
    return {
      ok: false,
      message: `${getPersonName(missingMesaId)} cierra Lobby y tambien debe figurar en Mesa.`,
    };
  }

  return { ok: true };
}

function upsertAssignment(date, sections, meta = {}) {
  const now = new Date().toISOString();
  const existing = getHistoryEntryByDate(date);
  const entry = {
    id: existing?.id || createId(),
    date,
    guardId: existing?.guardId || state.guardId,
    sections: normalizeSections(sections),
    personSnapshot: snapshotNames(sections),
    meta: normalizeAssignmentMeta(meta),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  state.history = state.history.filter((item) => item.date !== date);
  state.history.push(entry);
  state.currentAssignment = cloneEntryAsCurrent(entry);
  return { entry, updated: Boolean(existing) };
}

async function persistFullHistoryInDatabase(entryToSave = null) {
  if (!window.HistoryDatabase) return null;

  state.history = getUniqueHistoryByDate(state.history);
  if (entryToSave && window.HistoryDatabase.save) {
    return window.HistoryDatabase.save(entryToSave);
  }

  if (window.HistoryDatabase.replaceAll) {
    return window.HistoryDatabase.replaceAll(state.history);
  }

  return window.HistoryDatabase.saveMany(state.history);
}

async function hydrateHistoryFromDatabase() {
  if (!window.HistoryDatabase) return;

  try {
    const databaseHistory = await window.HistoryDatabase.getAll();
    const mergedHistory = getUniqueHistoryByDate([...state.history, ...databaseHistory]);
    if (JSON.stringify(mergedHistory) !== JSON.stringify(getUniqueHistoryByDate(state.history))) {
      state.history = mergedHistory;
      saveState();
      if (state.history.length) await window.HistoryDatabase.replaceAll?.(state.history);
      render();
    }
  } catch (error) {
    console.warn("No se pudo cargar el historial desde la base de datos local.", error);
  }
}

function clearHistoryDatabaseStorage() {
  window.HistoryDatabase?.clear().catch((error) => {
    console.warn("No se pudo borrar la base de datos local.", error);
  });
}

function setCurrentAssignment(date, sections, meta = {}) {
  state.currentAssignment = {
    date,
    sections: normalizeSections(sections),
    personSnapshot: snapshotNames(sections),
    meta: normalizeAssignmentMeta(meta),
  };
}

function collectAssignmentFromForm() {
  const sections = createEmptyFullAssignment();
  const selects = elements.assignmentBoard.querySelectorAll("select[data-section-id]");

  selects.forEach((select) => {
    const sectionId = select.dataset.sectionId;
    const roleId = select.dataset.roleId;
    if (select.value) sections[sectionId][roleId].push(select.value);
  });

  return sections;
}

function collectAssignmentMetaFromForm() {
  const meta = normalizeAssignmentMeta(state.currentAssignment?.meta);
  const inputs = elements.assignmentBoard.querySelectorAll("[data-assignment-meta]");

  inputs.forEach((input) => {
    meta[input.dataset.assignmentMeta] = input.value || "";
  });

  return meta;
}

function syncLobbyAndRampaSelection(sections, changedRoleId, selectedPersonId) {
  if (!selectedPersonId || !sections.principales) return false;

  let adjusted = false;
  const removeFromRole = (roleId) => {
    const currentIds = sections.principales[roleId] || [];
    const nextIds = currentIds.filter((personId) => personId !== selectedPersonId);
    if (nextIds.length !== currentIds.length) {
      sections.principales[roleId] = nextIds;
      adjusted = true;
    }
  };

  if (changedRoleId === "rampa" || changedRoleId === "catering") {
    LOBBY_ROLE_IDS.forEach((roleId) => {
      removeFromRole(roleId);
    });
  }

  if (changedRoleId === "rampa") removeFromRole("catering");
  if (changedRoleId === "catering") removeFromRole("rampa");

  if (isLobbyRole(changedRoleId)) {
    removeFromRole("rampa");
    removeFromRole("catering");
  }

  return adjusted;
}

function render() {
  renderGuard();
  renderGroups();
  renderAssignment();
  renderHistory();
}

function renderGuard() {
  const date = elements.assignmentDate.value || getToday();
  elements.guardStartedLabel.textContent = formatDate(date);
}

function renderGroups() {
  const date = elements.assignmentDate.value || getToday();
  const rotationPeople = getRotationPeople(date);
  const presentPeople = getPresentPeople(date);
  const absentPeople = getAbsentPeople(date);

  elements.peopleCount.textContent = `${presentPeople.length}/${rotationPeople.length}`;
  elements.activeRotationLabel.textContent = `${presentPeople.length} personas disponibles`;
  elements.peopleList.className = "people-list";
  elements.peopleList.innerHTML = "";
  elements.absentList.className = "people-list absent-list";
  elements.absentList.innerHTML = "";

  if (presentPeople.length) {
    presentPeople
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .forEach((person) => {
        elements.peopleList.appendChild(createPersonPill(person, "available"));
      });
  } else {
    elements.peopleList.className = "people-list empty-state";
    elements.peopleList.textContent = "No hay personas disponibles para esta fecha.";
  }

  if (absentPeople.length) {
    const title = document.createElement("div");
    title.className = "absent-title";
    title.textContent = "Eliminadas para esta fecha";
    elements.absentList.appendChild(title);

    absentPeople
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .forEach((person) => {
        elements.absentList.appendChild(createPersonPill(person, "absent"));
      });
  } else {
    elements.absentList.className = "people-list absent-list empty-state";
    elements.absentList.textContent = "No hay personas eliminadas para esta fecha.";
  }

  renderSwapControls(date);
}

function createPersonPill(person, status = "available") {
  const item = document.createElement("div");
  item.className = `person-item ${status === "absent" ? "is-absent" : ""}`;

  const info = document.createElement("div");

  const name = document.createElement("span");
  name.className = "person-name";
  name.textContent = person.name;

  const meta = document.createElement("span");
  meta.className = "person-meta";
  meta.textContent =
    status === "absent"
      ? "No asiste"
      : person.swapForName
        ? `Cubre a ${person.swapForName}`
        : "Disponible";

  const button = document.createElement("button");
  button.className = status === "absent" ? "restore-person-button" : "remove-person-button";
  button.type = "button";
  button.dataset.personId = person.id;
  button.dataset.attendanceAction = status === "absent" ? "restore" : "remove";
  button.textContent = status === "absent" ? "Restaurar" : "x";
  button.setAttribute(
    "aria-label",
    status === "absent" ? `Restaurar a ${person.name}` : `Eliminar a ${person.name}`,
  );
  button.title = status === "absent" ? "Restaurar" : "Eliminar";

  info.append(name, meta);
  item.append(info, button);
  return item;
}

function renderSwapControls(date) {
  const swaps = getSubstitutions(date);
  const basePeople = getBaseRotationPeople(date);
  const baseRotationIds = new Set(basePeople.map((person) => person.id));
  const presentIds = new Set(getPresentPeople(date).map((person) => person.id));
  const swappedOriginalIds = new Set(Object.keys(swaps));
  const usedSubstituteIds = new Set(Object.values(swaps));

  fillSelect(
    elements.swapOriginal,
    basePeople.filter((person) => !swappedOriginalIds.has(person.id)),
    "Seleccionar persona",
  );

  fillSelect(
    elements.swapSubstitute,
    PEOPLE.filter(
      (person) =>
        person.operational !== false &&
        !baseRotationIds.has(person.id) &&
        !presentIds.has(person.id) &&
        !swappedOriginalIds.has(person.id) &&
        !usedSubstituteIds.has(person.id),
    ),
    "Seleccionar reemplazo",
  );

  renderSwapList(date, swaps);
}

function renderSwapList(date, swaps) {
  const entries = Object.entries(swaps);

  if (!entries.length) {
    elements.swapList.className = "swap-list empty-state";
    elements.swapList.textContent = "No hay cambios cargados para esta fecha.";
    return;
  }

  elements.swapList.className = "swap-list";
  elements.swapList.innerHTML = "";

  entries.forEach(([originalId, substituteId]) => {
    const item = document.createElement("div");
    item.className = "swap-item";

    const text = document.createElement("span");
    text.textContent = `${getPersonName(substituteId)} cubre a ${getPersonName(originalId)}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "remove-person-button";
    button.dataset.swapAction = "remove";
    button.dataset.originalId = originalId;
    button.textContent = "x";
    button.title = "Eliminar cambio";
    button.setAttribute("aria-label", `Eliminar cambio de ${getPersonName(originalId)}`);

    item.append(text, button);
    elements.swapList.appendChild(item);
  });
}

function renderAssignment() {
  if (!state.currentAssignment) {
    elements.assignmentBoard.className = "assignment-board empty-state";
    elements.assignmentBoard.textContent = "Genera una asignacion para ver y editar los puestos.";
    elements.saveAssignmentButton.disabled = true;
    return;
  }

  elements.assignmentDate.value = state.currentAssignment.date;
  elements.assignmentBoard.className = "assignment-board";
  elements.assignmentBoard.innerHTML = "";
  elements.saveAssignmentButton.disabled = false;

  DISPLAY_SECTIONS.forEach((section) => {
    elements.assignmentBoard.appendChild(createAssignmentSection(section));
  });
}

function createAssignmentSection(displaySection) {
  const wrapper = document.createElement("section");
  wrapper.className = "assignment-section";
  wrapper.dataset.displaySection = displaySection.id;

  const header = document.createElement("div");
  header.className = "assignment-section-header";

  const titleBlock = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = displaySection.label;

  const note = document.createElement("p");
  note.textContent = displaySection.note;

  titleBlock.append(title, note);
  header.appendChild(titleBlock);

  const roleGrid = document.createElement("div");
  roleGrid.className = "role-grid";

  const sourceSection = getSection(displaySection.sourceSectionId);
  displaySection.roleIds.forEach((roleId) => {
    const role = sourceSection.roles.find((item) => item.id === roleId);
    roleGrid.appendChild(createRoleCard(sourceSection, role));
  });

  const timeControls = createDisplaySectionTimeControls(displaySection.id);
  if (timeControls) {
    wrapper.append(header, roleGrid, timeControls);
    return wrapper;
  }

  wrapper.append(header, roleGrid);
  return wrapper;
}

function createRoleCard(section, role) {
  const roleCard = document.createElement("section");
  roleCard.className = "role-card";
  roleCard.dataset.sectionId = section.id;
  roleCard.dataset.roleId = role.id;

  const title = document.createElement("div");
  title.className = "role-title";

  const roleName = document.createElement("strong");
  roleName.textContent = role.label;

  title.appendChild(roleName);

  const slotGrid = document.createElement("div");
  slotGrid.className = "slot-grid";

  const assignedIds =
    state.currentAssignment.sections?.[section.id]?.[role.id] || [];
  const slotCount = role.fillRest ? assignedIds.length : role.slots;
  applyLobbyEmptyCardState(roleCard, section, role, assignedIds, slotCount);
  const requirements = getSlotRequirements(role);

  if (!slotCount) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Sin personas restantes.";
    slotGrid.appendChild(empty);
  }

  for (let index = 0; index < slotCount; index += 1) {
    slotGrid.appendChild(
      createSlotSelect(section, role, index, assignedIds[index] || "", requirements[index]),
    );
  }

  roleCard.append(title, slotGrid);
  return roleCard;
}

function createDisplaySectionTimeControls(displaySectionId) {
  const fields = DISPLAY_SECTION_TIME_FIELDS[displaySectionId] || [];
  if (!fields.length) return null;

  const wrapper = document.createElement("div");
  wrapper.className = "section-time-grid";

  fields.forEach((field) => {
    wrapper.appendChild(createAssignmentTimeControl(field));
  });

  return wrapper;
}

function createAssignmentTimeControl(field) {
  const row = document.createElement("label");
  row.className = "slot-row role-time-field";

  const text = document.createElement("span");
  text.textContent = field.label;

  const input = document.createElement("input");
  input.type = "time";
  input.dataset.assignmentMeta = field.key;
  input.value = state.currentAssignment?.meta?.[field.key] || "";
  input.setAttribute("aria-label", field.label);

  row.append(text, input);
  return row;
}

function updateLobbyEmptyCardStates() {
  if (!state.currentAssignment) return;

  elements.assignmentBoard
    .querySelectorAll(".role-card[data-section-id='principales']")
    .forEach((roleCard) => {
      const role = getSection("principales").roles.find((item) => item.id === roleCard.dataset.roleId);
      if (!role) return;

      const assignedIds = state.currentAssignment.sections?.principales?.[role.id] || [];
      const slotCount = role.fillRest ? assignedIds.length : role.slots;
      applyLobbyEmptyCardState(roleCard, getSection("principales"), role, assignedIds, slotCount);
    });
}

function applyLobbyEmptyCardState(roleCard, section, role, assignedIds, slotCount) {
  roleCard.classList.remove("is-empty-required", "is-empty-optional");
  if (section.id !== "principales" || !isLobbyRole(role.id)) return;

  const hasEmptySlot = (slotCount || 0) > assignedIds.length;
  if (!hasEmptySlot) return;

  roleCard.classList.add(role.id === "sublos" || role.id === "exit2" ? "is-empty-optional" : "is-empty-required");
}

function createSlotSelect(section, role, index, selectedId, requirement = {}) {
  const row = document.createElement("label");
  row.className = "slot-row";

  const select = document.createElement("select");
  select.dataset.sectionId = section.id;
  select.dataset.roleId = role.id;
  select.dataset.slotIndex = index;
  select.setAttribute("aria-label", `${role.label} ${index + 1}`);
  select.required = false;

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Vacio";
  select.appendChild(emptyOption);

  const roleKey = getRoleKey(section.id, role.id);
  const peopleOptions = getPeopleForManualSelect(state.currentAssignment.date);
  peopleOptions.forEach((person) => {
    const option = document.createElement("option");
    option.value = person.id;
    option.textContent = person.name;
    select.appendChild(option);
  });

  if (selectedId && !peopleOptions.some((person) => person.id === selectedId)) {
    const missingOption = document.createElement("option");
    missingOption.value = selectedId;
    missingOption.textContent = getPersonName(selectedId);
    select.appendChild(missingOption);
  }

  select.value = selectedId;
  row.appendChild(select);
  return row;
}

function getPeopleForManualSelect(date) {
  return getActivePeople(date)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function fillSelect(select, people, placeholder) {
  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = placeholder;
  select.appendChild(emptyOption);

  people
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((person) => {
      const option = document.createElement("option");
      option.value = person.id;
      option.textContent = person.name;
      select.appendChild(option);
    });
}

function renderHistory() {
  if (!elements.historyList) return;

  if (!state.history.length) {
    elements.historyList.className = "history-list empty-state";
    elements.historyList.textContent = "No hay asignaciones guardadas.";
    return;
  }

  elements.historyList.className = "history-list";
  elements.historyList.innerHTML = "";

  getSortedHistory()
    .slice()
    .reverse()
    .forEach((entry) => {
      elements.historyList.appendChild(createHistoryEntry(entry));
    });
}

function createHistoryEntry(entry) {
  const article = document.createElement("article");
  article.className = "history-entry";

  const header = document.createElement("div");
  header.className = "history-date";

  const dateLabel = document.createElement("span");
  dateLabel.textContent = formatDate(entry.date);

  const peopleLabel = document.createElement("small");
  peopleLabel.textContent = `${countUniqueEntryPeople(entry)} personas unicas`;

  header.append(dateLabel, peopleLabel);

  const sectionList = document.createElement("div");
  sectionList.className = "history-sections";

  DISPLAY_SECTIONS.forEach((displaySection) => {
    const sectionBox = document.createElement("section");
    sectionBox.className = "history-section";

    const title = document.createElement("h3");
    title.textContent = displaySection.label;

    const roleGrid = document.createElement("div");
    roleGrid.className = "history-roles";

    const sourceSection = getSection(displaySection.sourceSectionId);
    displaySection.roleIds.forEach((roleId) => {
      const role = sourceSection.roles.find((item) => item.id === roleId);
      roleGrid.appendChild(createHistoryRole(entry, sourceSection, role));
    });
    appendHistoryTimeRoles(roleGrid, entry, displaySection.id);

    sectionBox.append(title, roleGrid);
    sectionList.appendChild(sectionBox);
  });

  article.append(header, sectionList);
  return article;
}

function createHistoryRole(entry, section, role) {
  const roleBox = document.createElement("div");
  roleBox.className = "history-role";

  const roleName = document.createElement("strong");
  roleName.textContent = role.label;

  const namesBox = document.createElement("span");
  const names = (entry.sections?.[section.id]?.[role.id] || []).map((personId) =>
    getPersonName(personId, entry),
  );

  if (names.length) {
    names.forEach((name, index) => {
      if (index > 0) namesBox.appendChild(document.createElement("br"));
      namesBox.appendChild(document.createTextNode(name));
    });
  } else {
    namesBox.textContent = "-";
  }

  roleBox.append(roleName, namesBox);
  return roleBox;
}

function appendHistoryTimeRoles(roleGrid, entry, displaySectionId) {
  const fields = DISPLAY_SECTION_TIME_FIELDS[displaySectionId] || [];

  fields.forEach((field) => {
    const value = entry.meta?.[field.key];
    if (!value) return;

    const roleBox = document.createElement("div");
    roleBox.className = "history-role history-role--time";

    const roleName = document.createElement("strong");
    roleName.textContent = field.label;

    const time = document.createElement("span");
    time.textContent = value;

    roleBox.append(roleName, time);
    roleGrid.appendChild(roleBox);
  });
}

function getRotationInfo(date) {
  const diff = getDateDiffDays(ROTATION_START_DATE, date);
  const cycleIndex = positiveModulo(diff, ROTATION.length * 2);
  const rotationIndex = Math.floor(cycleIndex / 2);
  const rotation = ROTATION[rotationIndex];

  return {
    ...rotation,
    cycleDay: cycleIndex + 1,
    dayInPair: (cycleIndex % 2) + 1,
  };
}

function getActivePeople(date) {
  return getPresentPeople(date).filter((person) => person.operational !== false);
}

function getRotationPeople(date) {
  const swaps = getSubstitutions(date);
  const substituteIds = new Set(Object.values(swaps));

  return getBaseRotationPeople(date)
    .filter((person) => !substituteIds.has(person.id))
    .map((person) => {
      const substituteId = swaps[person.id];
      return substituteId ? createSubstitutionPerson(getPerson(substituteId), person) : person;
    });
}

function getBaseRotationPeople(date) {
  const activeGroups = getRotationInfo(date).groups;
  return PEOPLE.filter((person) => activeGroups.includes(person.groupId));
}

function getPresentPeople(date) {
  const absentIds = getAbsentIds(date);
  return getRotationPeople(date).filter((person) => !absentIds.has(person.id));
}

function getAbsentPeople(date) {
  const absentIds = getAbsentIds(date);
  return getRotationPeople(date).filter((person) => absentIds.has(person.id));
}

function getAbsentIds(date) {
  return new Set(state.absences?.[date] || []);
}

function markPersonAbsent(date, personId) {
  const absentIds = getAbsentIds(date);
  absentIds.add(personId);
  state.absences[date] = [...absentIds];
}

function restorePersonAttendance(date, personId) {
  const absentIds = getAbsentIds(date);
  absentIds.delete(personId);

  if (absentIds.size) {
    state.absences[date] = [...absentIds];
  } else {
    delete state.absences[date];
  }
}

function getSubstitutions(date) {
  return state.substitutions?.[date] || {};
}

function applySubstitution(date, originalId, substituteId) {
  state.substitutions[date] = {
    ...getSubstitutions(date),
    [originalId]: substituteId,
  };

  restorePersonAttendance(date, originalId);
  restorePersonAttendance(date, substituteId);
}

function removeSubstitution(date, originalId) {
  if (!state.substitutions?.[date]) return;

  delete state.substitutions[date][originalId];
  if (!Object.keys(state.substitutions[date]).length) delete state.substitutions[date];
}

function createSubstitutionPerson(substitute, original) {
  return {
    ...substitute,
    groupId: original.groupId,
    groupLabel: original.groupLabel,
    blockedRoles: [...new Set([...(original.blockedRoles || []), ...(substitute.blockedRoles || [])])],
    operational: original.operational !== false && substitute.operational !== false,
    swapForId: original.id,
    swapForName: original.name,
  };
}

function clearCurrentAssignmentForDate(date) {
  if (state.currentAssignment?.date === date) state.currentAssignment = null;
}

function clearDailySetup(date) {
  delete state.absences[date];
  delete state.substitutions[date];
  clearCurrentAssignmentForDate(date);
}

function removePersonFromCurrentAssignment(personId, date) {
  if (!state.currentAssignment || state.currentAssignment.date !== date) return;

  SECTIONS.forEach((section) => {
    section.roles.forEach((role) => {
      const peopleIds = state.currentAssignment.sections?.[section.id]?.[role.id] || [];
      state.currentAssignment.sections[section.id][role.id] = peopleIds.filter((id) => id !== personId);
    });
  });

  state.currentAssignment.personSnapshot = snapshotNames(state.currentAssignment.sections);
}

function getLobbyPriorityPeople(date) {
  const rotation = getRotationInfo(date);
  const priorityGroupIds = rotation.groups.filter((groupId) => {
    const workday = GROUP_WORKDAY_BY_CYCLE_DAY[groupId]?.[rotation.cycleDay];
    return workday === 2 || workday === 3;
  });

  return getActivePeople(date).filter((person) => priorityGroupIds.includes(person.groupId));
}

function getCateringGroupId(date) {
  const rotation = getRotationInfo(date);
  return CATERING_GROUP_BY_CYCLE_DAY[rotation.cycleDay - 1];
}

function getCateringPlan(date) {
  const activePeople = getActivePeople(date);
  const cateringGroupId = getCateringGroupId(date);
  const sameGroupAllowed = activePeople.filter(
    (person) => person.groupId === cateringGroupId && canUseRole(person, "principales.catering"),
  );

  if (sameGroupAllowed.length >= 2) {
    return {
      people: sameGroupAllowed,
      relaxed: false,
      ignoreRoleBlocks: false,
    };
  }

  const fallbackSameGroup = GROUPS.map((group) =>
    activePeople.filter(
      (person) => person.groupId === group.id && canUseRole(person, "principales.catering"),
    ),
  ).find((people) => people.length >= 2);

  if (fallbackSameGroup) {
    return {
      people: fallbackSameGroup,
      relaxed: true,
      ignoreRoleBlocks: false,
    };
  }

  const anyAllowed = activePeople.filter((person) => canUseRole(person, "principales.catering"));
  if (anyAllowed.length >= 2) {
    return {
      people: anyAllowed,
      relaxed: true,
      ignoreRoleBlocks: false,
    };
  }

  return {
    people: activePeople,
    relaxed: true,
    ignoreRoleBlocks: true,
  };
}

function isLobbyRole(roleId) {
  return LOBBY_ROLE_IDS.includes(roleId);
}

function isLobbyRoleFromKey(roleKey) {
  return roleKey.startsWith("principales.") && isLobbyRole(roleKey.split(".")[1]);
}

function canRoleRemainEmpty(section, role) {
  return section.id === "principales" && (role.optional || ["sublos", "exit2"].includes(role.id));
}

function getCateringGroupLabel(date) {
  const groupId = getCateringGroupId(date);
  return GROUPS.find((group) => group.id === groupId)?.label || "Sin grupo";
}

function canUseRole(person, roleKey) {
  return person && person.operational !== false && !person.blockedRoles.includes(roleKey);
}

function getSlotRequirements(role) {
  if (role.slotRequirements) return role.slotRequirements;
  return Array.from({ length: role.slots || 0 }, () => ({}));
}

function getPeopleForSelect(date, roleKey, requiredGender = null, requiredRoleKey = null) {
  const unavailableForArmado = getCurrentCateringAndChequeoIds();
  const cateringPlan = getCateringPlan(date);
  const currentLobbyIds = new Set(
    getAssignedLobbyIdsByRoles(state.currentAssignment?.sections?.principales || {}, LOBBY_ROLE_IDS),
  );
  const currentCierreLobbyIds = new Set(state.currentAssignment?.sections?.principales?.cierre_lobby || []);
  const currentCateringIds = new Set(state.currentAssignment?.sections?.principales?.catering || []);
  const currentRampaIds = new Set(state.currentAssignment?.sections?.principales?.rampa || []);
  const currentCateringGroupIds = new Set(
    (state.currentAssignment?.sections?.principales?.catering || [])
      .map((personId) => getPersonForDate(personId, date)?.groupId)
      .filter(Boolean),
  );

  if (roleKey === "principales.manifiesto") {
    return getManifestoCandidatePeople(state.currentAssignment?.sections?.principales || {}, date)
      .filter((person) => !requiredGender || person.gender === requiredGender)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  if (roleKey === "principales.cierre_lobby") {
    return getCierreLobbyCandidatePeople(state.currentAssignment?.sections?.principales || {}, date)
      .filter((person) => !requiredGender || person.gender === requiredGender)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  return getActivePeople(date)
    .filter(
      (person) =>
        !["principales.catering", "principales.chequeo_avion", "principales.rampa"].includes(roleKey) ||
        cateringPlan.relaxed ||
        person.groupId === getCateringGroupId(date),
    )
    .filter((person) => roleKey !== "principales.manifiesto" || currentLobbyIds.has(person.id))
    .filter(
      (person) =>
        roleKey !== "principales.chequeo_avion" ||
        !currentCateringGroupIds.size ||
        currentCateringGroupIds.has(person.groupId),
    )
    .filter((person) => roleKey !== "principales.chequeo_avion" || !currentCierreLobbyIds.has(person.id))
    .filter(
      (person) =>
        roleKey !== "principales.rampa" ||
        !currentCateringGroupIds.size ||
        currentCateringGroupIds.has(person.groupId),
    )
    .filter((person) => roleKey !== "principales.catering" || (!currentLobbyIds.has(person.id) && !currentRampaIds.has(person.id)))
    .filter((person) => roleKey !== "principales.rampa" || (!currentLobbyIds.has(person.id) && !currentCateringIds.has(person.id)))
    .filter((person) => !isLobbyRoleFromKey(roleKey) || (!currentCateringIds.has(person.id) && !currentRampaIds.has(person.id)))
    .filter(
      (person) =>
        !roleKey.startsWith("embarque.") ||
        roleKey === "embarque.mesa" ||
        roleKey === "embarque.llevar_maquina" ||
        !currentCierreLobbyIds.has(person.id),
    )
    .filter((person) => roleKey !== "embarque.armado_sala" || !unavailableForArmado.has(person.id))
    .filter((person) =>
      roleKey === "principales.catering" && cateringPlan.ignoreRoleBlocks
        ? true
        : canUseRole(person, roleKey),
    )
    .filter((person) => !requiredGender || person.gender === requiredGender)
    .filter((person) => !requiredRoleKey || canUseRole(person, requiredRoleKey))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function getManifestoCandidatePeople(principalesAssignment, date) {
  const primaryIds = getManifestoPrimaryIds(principalesAssignment);

  if (primaryIds.length) {
    return primaryIds.map((personId) => getPersonForDate(personId, date)).filter(Boolean);
  }

  return getPresentPeople(date).filter((person) => MANIFESTO_SUPERVISOR_IDS.includes(person.id));
}

function getCierreLobbyCandidatePeople(principalesAssignment, date) {
  const chequeoIds = new Set(principalesAssignment?.chequeo_avion || []);

  return getAssignedLobbyIdsByRoles(principalesAssignment, LOBBY_CIERRE_SOURCE_ROLE_IDS)
    .filter((personId) => !chequeoIds.has(personId))
    .map((personId) => getPersonForDate(personId, date))
    .filter(Boolean);
}

function getArmadoSalaCandidatePeople(date, activePeople, context = {}) {
  const blockedIds = new Set([
    ...(context.noArmadoSalaIds || []),
    ...(context.cierreLobbyIds || []),
  ]);
  const lobbyCandidates = getArmadoLobbyCandidates(context.lobbyAssignment || {}, date, activePeople);
  const lobbyIds = new Set(lobbyCandidates.map((person) => person.id));
  const orderedCandidates = [
    ...lobbyCandidates,
    ...activePeople.filter((person) => !lobbyIds.has(person.id)),
  ];

  return orderedCandidates.filter((person) => !blockedIds.has(person.id));
}

function getArmadoLobbyCandidates(principalesAssignment, date, activePeople = getActivePeople(date)) {
  const activeIds = new Set(activePeople.map((person) => person.id));
  const priorityIds = getAssignedLobbyIdsByRoles(principalesAssignment, ARMADO_LOBBY_PRIORITY_ROLE_IDS);
  const allLobbyIds = getAssignedLobbyIds(principalesAssignment);
  const orderedIds = [...new Set([...priorityIds, ...allLobbyIds])];

  return orderedIds
    .filter((personId) => activeIds.has(personId))
    .map((personId) => getPersonForDate(personId, date))
    .filter(Boolean);
}

function getManifestoPrimaryIds(principalesAssignment) {
  return [
    ...new Set(
      MANIFESTO_PRIMARY_ROLE_IDS.flatMap((roleId) => principalesAssignment?.[roleId] || []),
    ),
  ];
}

function getCurrentCateringAndChequeoIds() {
  const principales = state.currentAssignment?.sections?.principales || {};
  return new Set([...(principales.catering || []), ...(principales.chequeo_avion || [])]);
}

function getCurrentLobbyIds() {
  return getAssignedLobbyIds(state.currentAssignment?.sections?.principales || {});
}

function getAssignedLobbyIds(principalesAssignment) {
  return getAssignedLobbyIdsByRoles(principalesAssignment, LOBBY_BASE_ROLE_IDS);
}

function getAssignedLobbyIdsByRoles(principalesAssignment, roleIds) {
  return [
    ...new Set(
      roleIds.flatMap((roleId) => principalesAssignment?.[roleId] || []),
    ),
  ];
}

function getAssignedLobbyPeople(principalesAssignment) {
  return getAssignedLobbyIds(principalesAssignment)
    .map((personId) => getPerson(personId))
    .filter(Boolean);
}

function buildRestrictionLabel(person) {
  const labels = [];
  if (person.blockedRoles.includes("embarque.etd")) labels.push("No ETD");
  if (person.blockedRoles.includes("principales.catering")) labels.push("No Catering");
  if (person.gender === "otro") labels.push("Selective sin configurar");
  return labels.length ? labels.join(" - ") : "Sin restricciones";
}

function getSection(sectionId) {
  return SECTIONS.find((section) => section.id === sectionId);
}

function getFixedSlotCount(section) {
  return section.roles.reduce(
    (total, role) =>
      total + (role.fillRest || role.supplemental || role.optional ? 0 : role.slots),
    0,
  );
}

function getRequiredLobbySlotCount() {
  const principales = getSection("principales");
  return LOBBY_REQUIRED_ROLE_IDS.reduce((total, roleId) => {
    const role = principales.roles.find((item) => item.id === roleId);
    return total + (role?.slots || 0);
  }, 0);
}

function createEmptyFullAssignment() {
  return SECTIONS.reduce((result, section) => {
    result[section.id] = createEmptySectionAssignment(section.id);
    return result;
  }, {});
}

function createEmptySectionAssignment(sectionId) {
  const section = getSection(sectionId);
  return section.roles.reduce((assignment, role) => {
    assignment[role.id] = [];
    return assignment;
  }, {});
}

function snapshotNames(sections) {
  const names = {};
  getAllPeopleFromSections(sections).forEach((personId) => {
    names[personId] = getPersonName(personId);
  });
  return names;
}

function getAllPeopleFromSections(sections) {
  return SECTIONS.flatMap((section) =>
    section.roles.flatMap((role) => sections?.[section.id]?.[role.id] || []),
  );
}

function getRotatingPeopleFromSections(sections) {
  return SECTIONS.flatMap((section) =>
    section.roles
      .filter((role) => !role.supplemental)
      .flatMap((role) => sections?.[section.id]?.[role.id] || []),
  );
}

function getExclusiveAssignedSet(section, assignment) {
  const ids = section.roles
    .filter((role) => !role.fillRest && !role.supplemental)
    .flatMap((role) => assignment?.[role.id] || []);
  return new Set(ids);
}

function getSectionPeopleIds(sectionAssignment) {
  return Object.values(sectionAssignment || {}).flat();
}

function getPerson(personId) {
  return PEOPLE.find((item) => item.id === personId);
}

function getPersonForDate(personId, date) {
  return getActivePeople(date).find((item) => item.id === personId) || getPerson(personId);
}

function getPersonName(personId, entry = null) {
  const person = getPerson(personId);
  return person?.name || entry?.personSnapshot?.[personId] || "Persona eliminada";
}

function getPersonGender(personId) {
  return getPerson(personId)?.gender || "otro";
}

function cloneEntryAsCurrent(entry) {
  return {
    date: entry.date,
    sections: normalizeSections(entry.sections),
    personSnapshot: { ...(entry.personSnapshot || {}) },
    meta: normalizeAssignmentMeta(entry.meta),
  };
}

function getSortedHistory() {
  return state.history.slice().sort((a, b) => {
    if (a.date === b.date) return a.createdAt.localeCompare(b.createdAt);
    return a.date.localeCompare(b.date);
  });
}

function getHistoryEntryByDate(date) {
  return getSortedHistory()
    .slice()
    .reverse()
    .find((entry) => entry.date === date);
}

function getUniqueHistoryByDate(history) {
  const entriesByDate = new Map();

  history.filter(Boolean).forEach((entry) => {
    const existing = entriesByDate.get(entry.date);
    const entryTime = entry.updatedAt || entry.createdAt || "";
    const existingTime = existing?.updatedAt || existing?.createdAt || "";
    if (!existing || entryTime >= existingTime) entriesByDate.set(entry.date, entry);
  });

  return [...entriesByDate.values()].sort((a, b) => {
    if (a.date === b.date) return (a.createdAt || "").localeCompare(b.createdAt || "");
    return a.date.localeCompare(b.date);
  });
}

function areSectionsEqual(firstSections, secondSections) {
  return JSON.stringify(normalizeSections(firstSections)) === JSON.stringify(normalizeSections(secondSections));
}

function areAssignmentPayloadEqual(entry, sections, meta) {
  return (
    areSectionsEqual(entry.sections, sections) &&
    JSON.stringify(normalizeAssignmentMeta(entry.meta)) === JSON.stringify(normalizeAssignmentMeta(meta))
  );
}

function countUniqueEntryPeople(entry) {
  return new Set(getAllPeopleFromSections(entry.sections)).size;
}

function getRoleKey(sectionId, roleId) {
  return `${sectionId}.${roleId}`;
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function dateFromIso(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function getDateDiffDays(startDate, endDate) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  return Math.floor((end - start) / 86400000);
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function positiveModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function showNotice(message, type = "success") {
  elements.notice.textContent = message;
  elements.notice.className = `notice ${type}`;
  elements.notice.hidden = false;

  window.clearTimeout(showNotice.timeoutId);
  showNotice.timeoutId = window.setTimeout(() => {
    elements.notice.hidden = true;
  }, 5600);
}
