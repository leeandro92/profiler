const people = [
  { name: "Leandro Nieto", color: "#2563eb" },
  { name: "Ailin Andres", color: "#db2777" },
  { name: "Vanesa Scalora", color: "#059669" },
  { name: "Elena Rubilar", color: "#7c3aed" },
  { name: "Paulina Murua", color: "#ea580c" },
  { name: "Axel Aros", color: "#0891b2" },
  { name: "Juan Aloe", color: "#ca8a04" },
  { name: "Carlos Castillo", color: "#4f46e5" },
  { name: "Laura Brest", color: "#16a34a" },
  { name: "Milagros Rolon", color: "#be123c" },
  { name: "Hernan Gonzalez", color: "#0d9488" },
  { name: "Marine Rosini", color: "#9333ea" },
  { name: "Lucila Lopez", color: "#dc2626" },
  { name: "Franco Acuña", color: "#0284c7" },
  { name: "Laura Romero", color: "#65a30d" },
  { name: "Tamara Garcia", color: "#c026d3" },
  { name: "Macarena Gorosito", color: "#d97706" },
  { name: "Lola Cordoba", color: "#0f766e" },
  { name: "Kyara Rodriguez", color: "#e11d48" },
  { name: "Micaela Alvarez", color: "#475569" },
  { name: "Leonardo Feldman", color: "#1d4ed8" },
  { name: "Morena Berns", color: "#3cd81d" }
];

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const storageKey = "vacation-calendar-assignments-v1";
const summaryStorageKey = "vacation-calendar-summaries-v1";
const appStorageKey = "vacation-calendar-app-data-v2";
const MIN_DAYS_BETWEEN_PERSON_VACATIONS = 60;
const today = new Date();
const savedViewState = loadViewState();
let currentMonth = savedViewState.month;
let currentYear = savedViewState.year;
let selectedDialogDate = null;
let vacations = {};
let summaries = [];
let isSelectingRange = false;
let selectionStartDate = savedViewState.selectionStartDate;
let selectionEndDate = savedViewState.selectionEndDate;
let selectionMoved = false;
let suppressNextDayClick = false;
let vacationSearchMatches = [];
const hiddenSummaryIds = new Set();
const visibleSummaryIds = new Set();

const calendarGrid = document.getElementById("calendarGrid");
const monthSelect = document.getElementById("monthSelect");
const yearInput = document.getElementById("yearInput");
const personSelect = document.getElementById("personSelect");
const dialogPersonSelect = document.getElementById("dialogPersonSelect");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const vacationForm = document.getElementById("vacationForm");
const statusMessage = document.getElementById("statusMessage");
const peopleList = document.getElementById("peopleList");
const legendList = document.getElementById("legendList");
const todayChip = document.getElementById("todayChip");
const dayDialog = document.getElementById("dayDialog");
const dialogDateTitle = document.getElementById("dialogDateTitle");
const assignDayButton = document.getElementById("assignDayButton");
const clearDayButton = document.getElementById("clearDayButton");
const dialogAssignments = document.getElementById("dialogAssignments");
const summaryList = document.getElementById("summaryList");
const summaryCount = document.getElementById("summaryCount");
const vacationSearchForm = document.getElementById("vacationSearchForm");
const vacationSearchInput = document.getElementById("vacationSearchInput");
const vacationSearchResults = document.getElementById("vacationSearchResults");
const workspace = document.querySelector(".workspace");
const calendarSection = document.querySelector(".calendar-section");
const sidePanel = document.querySelector(".side-panel");
const summarySection = document.querySelector(".summary-section");
const responsiveSummaryQuery = window.matchMedia("(max-width: 1120px)");

async function init() {
  populateMonthSelect();
  populatePeopleControls();
  setTodayChip();
  positionSummarySection();
  bindEvents();
  updateDateInputsFromSelection();
  renderSummaries();
  await hydrateVacationDataFromDatabase();
}

function populateMonthSelect() {
  monthSelect.innerHTML = monthNames
    .map((month, index) => `<option value="${index}">${month}</option>`)
    .join("");
  monthSelect.value = currentMonth;
  yearInput.value = currentYear;
}

function populatePeopleControls() {
  const options = people
    .map((person) => `<option value="${escapeHtml(person.name)}">${escapeHtml(person.name)}</option>`)
    .join("");

  personSelect.insertAdjacentHTML("beforeend", options);
  if (dialogPersonSelect) {
    dialogPersonSelect.innerHTML = `<option value="">Seleccionar profiler</option>${options}`;
  }

  if (peopleList) {
    peopleList.innerHTML = people
      .map((person) => {
        return `
          <button class="person-button" type="button" data-person="${escapeHtml(person.name)}">
            <span class="color-dot" style="background:${person.color}"></span>
            <span>${escapeHtml(person.name)}</span>
          </button>
        `;
      })
      .join("");
  }

  legendList.innerHTML = people
    .map((person) => {
      return `
        <div class="legend-item">
          <span class="color-dot" style="background:${person.color}"></span>
          <span>${escapeHtml(person.name)}</span>
        </div>
      `;
    })
    .join("");
}

function setTodayChip() {
  todayChip.textContent = `Hoy: ${formatDisplayDate(toISODate(today))}`;
}

function bindEvents() {
  document.getElementById("prevMonth").addEventListener("click", () => moveMonth(-1));
  document.getElementById("nextMonth").addEventListener("click", () => moveMonth(1));

  monthSelect.addEventListener("change", () => {
    currentMonth = Number(monthSelect.value);
    persistAppData();
    renderCalendar();
  });

  yearInput.addEventListener("change", () => {
    const year = Number(yearInput.value);
    if (year >= 1900 && year <= 2100) {
      currentYear = year;
      persistAppData();
      renderCalendar();
    } else {
      yearInput.value = currentYear;
      showStatus("Ingresá un año entre 1900 y 2100.", "error");
    }
  });

  vacationForm.addEventListener("submit", handleVacationSubmit);
  vacationSearchForm.addEventListener("submit", handleVacationSearch);
  assignDayButton?.addEventListener("click", assignSelectedDay);
  clearDayButton?.addEventListener("click", clearSelectedDay);
  personSelect.addEventListener("change", handleProfilerChange);
  startDate.addEventListener("change", syncSelectionFromDateInputs);
  endDate.addEventListener("change", syncSelectionFromDateInputs);

  if (peopleList) {
    peopleList.addEventListener("click", (event) => {
      const button = event.target.closest(".person-button");
      if (!button) return;
      personSelect.value = button.dataset.person;
      if (dialogPersonSelect) dialogPersonSelect.value = button.dataset.person;
      updateActivePerson();
      showStatus(`${button.dataset.person} seleccionado.`, "success");
    });
  }

  responsiveSummaryQuery.addEventListener("change", positionSummarySection);
  window.addEventListener("beforeunload", persistAppData);
  window.addEventListener("pagehide", persistAppData);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persistAppData();
  });

  summaryList.addEventListener("click", (event) => {
    const downloadButton = event.target.closest("[data-download-summary]");
    const deleteButton = event.target.closest("[data-delete-summary]");
    const permanentDeleteButton = event.target.closest("[data-permanent-delete-summary]");

    if (downloadButton) {
      const summary =
        summaries.find((item) => item.id === downloadButton.dataset.downloadSummary) ||
        vacationSearchMatches.find((item) => item.id === downloadButton.dataset.downloadSummary);
      if (summary) downloadSummaryImage(summary);
      return;
    }

    if (deleteButton) {
      const summary =
        summaries.find((item) => item.id === deleteButton.dataset.deleteSummary) ||
        vacationSearchMatches.find((item) => item.id === deleteButton.dataset.deleteSummary);
      if (summary) hideSummaryFromView(summary);
      return;
    }

    if (permanentDeleteButton) {
      const summary =
        summaries.find((item) => item.id === permanentDeleteButton.dataset.permanentDeleteSummary) ||
        vacationSearchMatches.find((item) => item.id === permanentDeleteButton.dataset.permanentDeleteSummary);
      if (summary) deleteSummaryPermanently(summary);
      return;
    }

  });

  vacationSearchResults.addEventListener("click", (event) => {
    const downloadButton = event.target.closest("[data-download-summary]");
    if (!downloadButton) return;

    const summary = vacationSearchMatches.find((item) => item.id === downloadButton.dataset.downloadSummary);
    if (summary) downloadSummaryImage(summary);
  });
}

function positionSummarySection() {
  if (!workspace || !calendarSection || !sidePanel || !summarySection) return;

  if (responsiveSummaryQuery.matches) {
    workspace.insertBefore(summarySection, sidePanel.nextSibling);
    return;
  }

  calendarSection.appendChild(summarySection);
}

function moveMonth(offset) {
  currentMonth += offset;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear -= 1;
  }
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear += 1;
  }
  monthSelect.value = currentMonth;
  yearInput.value = currentYear;
  persistAppData();
  renderCalendar();
}

function renderCalendar() {
  monthSelect.value = currentMonth;
  yearInput.value = currentYear;
  calendarGrid.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const mondayStartOffset = (firstDay.getDay() + 6) % 7;
  const visibleStart = new Date(currentYear, currentMonth, 1 - mondayStartOffset);

  const totalCells = Math.ceil((mondayStartOffset + lastDay.getDate()) / 7) * 7;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < totalCells; index += 1) {
    const date = new Date(visibleStart);
    date.setDate(visibleStart.getDate() + index);
    fragment.appendChild(createDayCell(date));
  }

  calendarGrid.appendChild(fragment);
}

function renderSummaries() {
  const visibleSummaries = summaries.filter(
    (summary) => visibleSummaryIds.has(summary.id) && !hiddenSummaryIds.has(summary.id),
  );
  const sortedSummaries = getSortedSummaries(visibleSummaries);

  summaryCount.textContent = `${visibleSummaries.length} ${visibleSummaries.length === 1 ? "carga" : "cargas"}`;

  if (!sortedSummaries.length) {
    summaryList.innerHTML = `
      <div class="summary-empty">
        Todavia no hay vacaciones agendadas. Cuando cargues un nombre, el resumen aparece aca.
      </div>
    `;
    return;
  }

  summaryList.innerHTML = sortedSummaries.map((summary) => createSummaryCard(summary, { allowDelete: true })).join("");
}

function createSummaryCard(summary, options = {}) {
  const person = findPerson(summary.person);
  const color = person ? person.color : "#64748b";
  const deleteButton = options.allowDelete
    ? `<button class="summary-delete" type="button" data-delete-summary="${summary.id}" aria-label="Ocultar comprobante de ${escapeHtml(summary.person)}" title="Ocultar comprobante">&times;</button>`
    : "";

  return `
    <article class="summary-card" style="--person-color:${color}">
      ${deleteButton}
      <div class="summary-card-top">
        <div class="summary-brand">
          <span class="summary-avatar" style="background:${color}">${getInitials(summary.person)}</span>
          <div>
            <h3 class="summary-person">${escapeHtml(summary.person)}</h3>
            <span class="summary-sector">Sector: Profiler</span>
          </div>
        </div>
        <span class="summary-badge">${summary.days} ${summary.days === 1 ? "dia" : "dias"}</span>
      </div>

      <div class="summary-period">
        <div>
          <span>Desde</span>
          <strong>${escapeHtml(formatShortDate(summary.from))}</strong>
        </div>
        <div class="summary-line" aria-hidden="true"></div>
        <div>
          <span>Hasta</span>
          <strong>${escapeHtml(formatShortDate(summary.to))}</strong>
        </div>
      </div>

      <dl class="summary-meta">
        <div>
          <dt>Dias corridos</dt>
          <dd>${summary.days}</dd>
        </div>
        <div>
          <dt>Sector</dt>
          <dd>Profiler</dd>
        </div>
      </dl>

      <div class="summary-footer">
        <span>Calendario de Vacaciones</span>
        <div class="summary-actions">
          <button class="secondary-button download-button" type="button" data-download-summary="${summary.id}">
            Descargar imagen
          </button>
          <button class="secondary-button danger permanent-delete-button" type="button" data-permanent-delete-summary="${summary.id}">
            Eliminar definitivo
          </button>
        </div>
      </div>
    </article>
  `;
}

function getSortedSummaries(sourceSummaries) {
  return [...sourceSummaries].sort((a, b) => {
    const startComparison = new Date(`${a.from}T00:00:00`) - new Date(`${b.from}T00:00:00`);
    const endComparison = new Date(`${a.to}T00:00:00`) - new Date(`${b.to}T00:00:00`);
    return startComparison || endComparison || a.person.localeCompare(b.person, "es");
  });
}

function createDayCell(date) {
  const isoDate = toISODate(date);
  const cell = document.createElement("button");
  const assignments = vacations[isoDate] || [];
  const isCurrentMonth = date.getMonth() === currentMonth;

  cell.type = "button";
  cell.className = "day-cell";
  cell.setAttribute("aria-label", `Abrir ${formatDisplayDate(isoDate)}`);
  cell.dataset.date = isoDate;

  if (!isCurrentMonth) cell.classList.add("is-muted");
  if (isSameDate(date, today)) cell.classList.add("is-today");
  if (isDateInSelectedRange(isoDate)) cell.classList.add("is-range-selected");

  const visibleAssignments = assignments.slice(0, 3);
  const hiddenCount = assignments.length - visibleAssignments.length;

  cell.innerHTML = `
    <span class="day-number">${date.getDate()}</span>
    <span class="assignment-stack">
      ${visibleAssignments.map(renderAssignmentPill).join("")}
      ${hiddenCount > 0 ? `<span class="more-pill">+${hiddenCount} mas</span>` : ""}
    </span>
  `;

  cell.addEventListener("pointerdown", handleDayPointerDown);
  cell.addEventListener("click", (event) => {
    if (suppressNextDayClick) {
      event.preventDefault();
      suppressNextDayClick = false;
      return;
    }
  });
  return cell;
}

function renderAssignmentPill(name) {
  const person = findPerson(name);
  const color = person ? person.color : "#64748b";
  const lastName = getLastName(name);
  return `
    <span class="assignment-pill" style="background:${color}" title="${escapeHtml(name)}">
      <span class="assignment-name-last">${escapeHtml(lastName)}</span>
    </span>
  `;
}

function handleDayPointerDown(event) {
  if (event.button !== 0 || !personSelect.value) return;

  event.preventDefault();
  const cell = event.currentTarget;
  const clickedDate = cell.dataset.date;
  const hadSelectionAnchor = Boolean(selectionStartDate);
  isSelectingRange = true;
  selectionMoved = hadSelectionAnchor && clickedDate !== selectionStartDate;

  if (!selectionStartDate) {
    selectionStartDate = clickedDate;
  }

  selectionEndDate = clickedDate;
  updateDateInputsFromSelection();
  updateRangeSelectionStyles();
  showStatus("Arrastrá sobre el calendario para completar Desde y Hasta.", "success");

  document.addEventListener("pointermove", handleDayPointerMove);
  document.addEventListener("pointerup", handleDayPointerUp, { once: true });
}

function handleDayPointerMove(event) {
  if (!isSelectingRange) return;

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const cell = target ? target.closest(".day-cell") : null;
  if (!cell || !calendarGrid.contains(cell)) return;

  const nextDate = cell.dataset.date;
  if (nextDate === selectionEndDate) return;

  selectionMoved = true;
  selectionEndDate = nextDate;
  updateDateInputsFromSelection();
  updateRangeSelectionStyles();
}

function handleDayPointerUp() {
  if (!isSelectingRange) return;

  isSelectingRange = false;
  document.removeEventListener("pointermove", handleDayPointerMove);
  updateDateInputsFromSelection();
  updateRangeSelectionStyles();

  if (selectionMoved) {
    suppressNextDayClick = true;
    showStatus(`Rango seleccionado: ${formatDisplayDate(startDate.value)} al ${formatDisplayDate(endDate.value)}.`, "success");
  }
}

function updateDateInputsFromSelection() {
  if (!selectionStartDate || !selectionEndDate) return;

  const [from, to] = getOrderedDates(selectionStartDate, selectionEndDate);
  startDate.value = from;
  endDate.value = to;
  persistAppData();
}

function updateRangeSelectionStyles() {
  document.querySelectorAll(".day-cell").forEach((cell) => {
    cell.classList.toggle("is-range-selected", isDateInSelectedRange(cell.dataset.date));
  });
}

function isDateInSelectedRange(isoDate) {
  if (!selectionStartDate || !selectionEndDate) return false;

  const [from, to] = getOrderedDates(selectionStartDate, selectionEndDate);
  return isoDate >= from && isoDate <= to;
}

function getOrderedDates(firstDate, secondDate) {
  return firstDate <= secondDate ? [firstDate, secondDate] : [secondDate, firstDate];
}

function syncSelectionFromDateInputs() {
  if (!isValidISODate(startDate.value) || !isValidISODate(endDate.value)) return;

  selectionStartDate = startDate.value;
  selectionEndDate = endDate.value;
  updateRangeSelectionStyles();
  persistAppData();
}

function openDayDialog(isoDate) {
  if (!dayDialog || !dialogDateTitle || !dialogPersonSelect || !dialogAssignments) return;
  selectedDialogDate = isoDate;
  dialogDateTitle.textContent = formatDisplayDate(isoDate);
  dialogPersonSelect.value = personSelect.value || "";
  renderDialogAssignments();
  dayDialog.showModal();
}

function renderDialogAssignments() {
  if (!dialogAssignments || !selectedDialogDate) return;
  const assignments = vacations[selectedDialogDate] || [];

  if (!assignments.length) {
    dialogAssignments.innerHTML = `<span class="more-pill">No hay vacaciones cargadas.</span>`;
    return;
  }

  dialogAssignments.innerHTML = assignments.map(renderAssignmentPill).join("");
}

function handleVacationSubmit(event) {
  event.preventDefault();

  const person = personSelect.value;
  const from = startDate.value;
  const to = endDate.value;
  const validation = validateAssignment(person, from, to);

  if (!validation.valid) {
    showStatus(validation.message, "error");
    return;
  }

  addVacationRange(person, from, to);
  const summary = addSummary(person, from, to);
  visibleSummaryIds.add(summary.id);
  hiddenSummaryIds.delete(summary.id);
  saveVacations();
  saveSummaries();
  saveVacationSummaryInDatabase(summary);
  renderCalendar();
  renderSummaries();
  clearRangeSelection();
  showStatus(`Vacaciones agendadas para ${person}: ${countDays(from, to)} dias.`, "success");
}

function assignSelectedDay() {
  const person = dialogPersonSelect.value;

  if (!person) {
    showStatus("Seleccioná un profiler para asignar el dia.", "error");
    return;
  }

  const validation = validateAssignment(person, selectedDialogDate, selectedDialogDate);
  if (!validation.valid) {
    showStatus(validation.message, "error");
    return;
  }

  addPersonToDate(person, selectedDialogDate);
  const summary = addSummary(person, selectedDialogDate, selectedDialogDate);
  visibleSummaryIds.add(summary.id);
  hiddenSummaryIds.delete(summary.id);
  saveVacations();
  saveSummaries();
  saveVacationSummaryInDatabase(summary);
  personSelect.value = person;
  updateActivePerson();
  renderDialogAssignments();
  renderCalendar();
  renderSummaries();
  clearRangeSelection();
  showStatus(`${person} asignado el ${formatDisplayDate(selectedDialogDate)}.`, "success");
}

async function clearSelectedDay() {
  const assignments = vacations[selectedDialogDate] || [];

  if (!assignments.length) {
    showStatus("Ese dia no tiene vacaciones para eliminar.", "error");
    return;
  }

  const confirmed = confirm(`¿Eliminar todas las vacaciones del ${formatDisplayDate(selectedDialogDate)}?`);
  if (!confirmed) return;

  delete vacations[selectedDialogDate];
  summaries = splitSummariesAroundDate(selectedDialogDate);
  await syncVacationSummariesWithDatabase();
  saveVacations();
  saveSummaries();
  renderDialogAssignments();
  renderCalendar();
  renderSummaries();
  showStatus("Vacaciones eliminadas del dia seleccionado.", "success");
}

async function clearSelectedPersonVacations() {
  const person = personSelect.value;

  if (!person) {
    showStatus("Seleccioná un profiler para eliminar sus vacaciones.", "error");
    return;
  }

  const confirmed = confirm(`¿Eliminar todas las vacaciones cargadas para ${person}?`);
  if (!confirmed) return;

  Object.keys(vacations).forEach((date) => {
    vacations[date] = vacations[date].filter((name) => name !== person);
    if (!vacations[date].length) delete vacations[date];
  });

  summaries = summaries.filter((summary) => summary.person !== person);
  vacationSearchMatches = vacationSearchMatches.filter((summary) => summary.person !== person);
  saveVacations();
  saveSummaries();
  renderCalendar();
  renderSummaries();
  showStatus(`Vacaciones eliminadas para ${person}.`, "success");
}

function hideSummaryFromView(summary) {
  hiddenSummaryIds.add(summary.id);
  visibleSummaryIds.delete(summary.id);
  vacationSearchMatches = vacationSearchMatches.filter((item) => item.id !== summary.id);

  if (vacationSearchMatches.length) {
    renderSummaryResults(vacationSearchMatches);
  } else {
    renderSummaries();
  }

  persistAppData();
  showStatus("Comprobante ocultado. El calendario sigue pintado desde Firestore.", "success");
}

async function deleteSummaryPermanently(summary) {
  const confirmed = confirm(
    `Esto borra definitivamente de Firestore las vacaciones de ${summary.person} desde ${formatDisplayDate(summary.from)} hasta ${formatDisplayDate(summary.to)} y libera esas fechas. Queres continuar?`
  );
  if (!confirmed) return;

  if (!window.VacationDatabase?.delete) {
    showStatus("No esta disponible la conexion con Firestore para eliminar definitivamente.", "error");
    return;
  }

  try {
    const result = await window.VacationDatabase.delete(summary.id);
    if (result?.firestore === false) {
      showStatus("No se pudo eliminar definitivamente en Firestore.", "error");
      return;
    }

    removePersonFromRange(summary.person, summary.from, summary.to);
    summaries = summaries.filter((item) => item.id !== summary.id);
    vacationSearchMatches = vacationSearchMatches.filter((item) => item.id !== summary.id);
    hiddenSummaryIds.delete(summary.id);
    visibleSummaryIds.delete(summary.id);
    saveVacations();
    saveSummaries();
    renderCalendar();
    if (vacationSearchMatches.length) {
      renderSummaryResults(vacationSearchMatches);
    } else {
      renderSummaries();
    }
    showStatus("Fecha eliminada definitivamente y calendario actualizado.", "success");
  } catch (error) {
    console.warn("No se pudo eliminar definitivamente en Firestore.", error);
    showStatus("No se pudo eliminar definitivamente en Firestore.", "error");
  }
}

async function handleVacationSearch(event) {
  event.preventDefault();

  const searchValue = vacationSearchInput.value.trim();
  if (!searchValue) {
    showStatus("Ingresa nombre y apellido para buscar.", "error");
    return;
  }

  vacationSearchResults.innerHTML = `<div class="summary-empty">Buscando en la base de datos...</div>`;

  try {
    const searchKey = normalizeSearchText(searchValue);
    const localMatches = summaries.filter((summary) => normalizeSearchText(summary.person).includes(searchKey));
    const databaseMatches = window.VacationDatabase?.getByPerson
      ? await window.VacationDatabase.getByPerson(searchValue)
      : [];
    vacationSearchMatches = getUniqueVacationSummaries([...localMatches, ...databaseMatches]);

    if (!vacationSearchMatches.length) {
      vacationSearchResults.innerHTML = `<div class="summary-empty">No hay vacaciones guardadas para ${escapeHtml(searchValue)}.</div>`;
      showStatus("No se encontraron vacaciones para ese profiler.", "error");
      return;
    }

    summaries = getUniqueVacationSummaries([...summaries, ...vacationSearchMatches]);
    vacations = buildVacationsFromSummaries(summaries);
    vacationSearchMatches.forEach((summary) => {
      hiddenSummaryIds.delete(summary.id);
      visibleSummaryIds.add(summary.id);
    });
    persistAppData();
    renderCalendar();
    renderSummaryResults(vacationSearchMatches);
    vacationSearchResults.innerHTML = `<div class="summary-empty">Los comprobantes encontrados se cargaron en el cuadro de Resumen.</div>`;
    showStatus(`Se cargaron ${vacationSearchMatches.length} comprobante(s) para ${searchValue}.`, "success");
  } catch (error) {
    console.warn("No se pudo buscar vacaciones en la base de datos.", error);
    vacationSearchResults.innerHTML = `<div class="summary-empty">No se pudo consultar la base de datos.</div>`;
    showStatus("No se pudo consultar la base de vacaciones.", "error");
  }
}

function resetCalendar() {
  const confirmed = confirm("¿Reiniciar todo el calendario? Se eliminaran todas las vacaciones y resumenes cargados.");
  if (!confirmed) return;

  vacations = {};
  summaries = [];
  localStorage.removeItem(appStorageKey);
  localStorage.removeItem(storageKey);
  localStorage.removeItem(summaryStorageKey);
  renderCalendar();
  renderSummaries();
  showStatus("Calendario reiniciado correctamente.", "success");
}

function validateAssignment(person, from, to, options = {}) {
  if (!person) return { valid: false, message: "Seleccioná un profiler." };
  if (!from || !to) return { valid: false, message: "Completá las fechas de inicio y fin." };
  if (!isValidISODate(from) || !isValidISODate(to)) return { valid: false, message: "Ingresá fechas validas." };
  if (new Date(`${to}T00:00:00`) < new Date(`${from}T00:00:00`)) {
    return { valid: false, message: "La fecha final no puede ser anterior a la inicial." };
  }

  return { valid: true };
}

function validatePersonVacationSpacing(person, from, to, ignoreSummaryId = null) {
  const newFrom = parseLocalDate(from);
  const newTo = parseLocalDate(to);
  const personKey = normalizeSearchText(person);

  const closeSummary = summaries.find((summary) => {
    if (summary.id === ignoreSummaryId) return false;
    if (normalizeSearchText(summary.person) !== personKey) return false;
    if (!isValidISODate(summary.from) || !isValidISODate(summary.to)) return false;

    const existingFrom = parseLocalDate(summary.from);
    const existingTo = parseLocalDate(summary.to);
    const daysBetween =
      newFrom > existingTo
        ? getDaysBetween(existingTo, newFrom)
        : existingFrom > newTo
          ? getDaysBetween(newTo, existingFrom)
          : 0;

    return daysBetween < MIN_DAYS_BETWEEN_PERSON_VACATIONS;
  });

  if (!closeSummary) return { valid: true };

  return {
    valid: false,
    message: `${person} ya tiene vacaciones del ${formatShortDate(closeSummary.from)} al ${formatShortDate(closeSummary.to)}. Para cargar otro comprobante deben pasar al menos ${MIN_DAYS_BETWEEN_PERSON_VACATIONS} dias.`,
  };
}

function findDateConflicts(from, to, options = {}) {
  const conflicts = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const ignoredSummary = options.ignoreSummaryId
    ? summaries.find((summary) => summary.id === options.ignoreSummaryId)
    : null;

  while (cursor <= end) {
    const isoDate = toISODate(cursor);
    const assignments = (vacations[isoDate] || []).filter(
      (name) => !(ignoredSummary && name === ignoredSummary.person && isDateInsideSummary(isoDate, ignoredSummary)),
    );

    if (assignments.length) {
      conflicts.push({
        date: isoDate,
        people: assignments
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return conflicts;
}

function buildConflictMessage(conflicts) {
  const firstConflict = conflicts[0];
  const firstPeople = firstConflict.people.join(", ");
  const extra = conflicts.length > 1 ? ` y ${conflicts.length - 1} fecha(s) mas` : "";
  return `No se puede agendar: ${formatDisplayDate(firstConflict.date)} ya esta ocupado por ${firstPeople}${extra}.`;
}

function addVacationRange(person, from, to) {
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  while (cursor <= end) {
    addPersonToDate(person, toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
}

function removePersonFromRange(person, from, to) {
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  while (cursor <= end) {
    const isoDate = toISODate(cursor);
    if (vacations[isoDate]) {
      vacations[isoDate] = vacations[isoDate].filter((name) => name !== person);
      if (!vacations[isoDate].length) delete vacations[isoDate];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
}

function addSummary(person, from, to) {
  const summary = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    person,
    from,
    to,
    days: countDays(from, to),
    createdAt: new Date().toISOString()
  };

  summaries.push(summary);
  return summary;
}

function splitSummariesAroundDate(isoDate) {
  const target = new Date(`${isoDate}T00:00:00`);

  return summaries.flatMap((summary) => {
    const from = new Date(`${summary.from}T00:00:00`);
    const to = new Date(`${summary.to}T00:00:00`);

    if (target < from || target > to) return [summary];

    const segments = [];
    const beforeEnd = new Date(target);
    beforeEnd.setDate(beforeEnd.getDate() - 1);
    const afterStart = new Date(target);
    afterStart.setDate(afterStart.getDate() + 1);

    if (from <= beforeEnd) {
      const segmentFrom = summary.from;
      const segmentTo = toISODate(beforeEnd);
      segments.push({
        ...summary,
        id: `${summary.id}-a-${Date.now()}`,
        from: segmentFrom,
        to: segmentTo,
        days: countDays(segmentFrom, segmentTo)
      });
    }

    if (afterStart <= to) {
      const segmentFrom = toISODate(afterStart);
      const segmentTo = summary.to;
      segments.push({
        ...summary,
        id: `${summary.id}-b-${Date.now()}`,
        from: segmentFrom,
        to: segmentTo,
        days: countDays(segmentFrom, segmentTo)
      });
    }

    return segments;
  });
}

function addPersonToDate(person, isoDate) {
  if (!vacations[isoDate]) vacations[isoDate] = [];
  if (!vacations[isoDate].includes(person)) {
    vacations[isoDate].push(person);
    vacations[isoDate].sort((a, b) => a.localeCompare(b, "es"));
  }
}

function updateActivePerson() {
  document.querySelectorAll(".person-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.person === personSelect.value);
  });
}

function handleProfilerChange() {
  updateActivePerson();
  if (dialogPersonSelect) dialogPersonSelect.value = personSelect.value || "";
  clearRangeSelection();
}

function clearRangeSelection() {
  selectionStartDate = "";
  selectionEndDate = "";
  startDate.value = "";
  endDate.value = "";
  updateRangeSelectionStyles();
  persistAppData();
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message is-${type}`;
}

function saveVacations() {
  persistAppData();
}

function saveSummaries() {
  persistAppData();
}

async function saveVacationSummaryInDatabase(summary) {
  if (!window.VacationDatabase?.save || !summary) return;

  try {
    const result = await window.VacationDatabase.save(summary);
    if (result?.firestore === false) {
      showStatus("La agenda quedo local, pero Firestore no respondio.", "error");
    }
  } catch (error) {
    console.warn("No se pudo guardar la agenda de vacaciones en Firestore.", error);
    showStatus("La agenda quedo local, pero no se pudo guardar en Firestore.", "error");
  }
}

async function syncVacationSummariesWithDatabase() {
  if (!window.VacationDatabase?.saveMany || !summaries.length) return;

  try {
    await window.VacationDatabase.saveMany(summaries);
  } catch (error) {
    console.warn("No se pudieron sincronizar las vacaciones locales con Firestore.", error);
  }
}

async function hydrateVacationDataFromDatabase() {
  if (!window.VacationDatabase?.getAll) {
    vacations = {};
    summaries = [];
    renderCalendar();
    renderSummaries();
    return;
  }

  try {
    const databaseSummaries = await window.VacationDatabase.getAll();
    visibleSummaryIds.clear();
    hiddenSummaryIds.clear();
    vacationSearchMatches = [];
    summaries = getUniqueVacationSummaries(databaseSummaries);
    vacations = buildVacationsFromSummaries(summaries);
    persistAppData();
    renderCalendar();
    renderSummaries();
  } catch (error) {
    console.warn("No se pudieron cargar las vacaciones desde Firestore.", error);
    vacations = {};
    summaries = [];
    renderCalendar();
    renderSummaries();
  }
}

function renderSummaryResults(sourceSummaries) {
  const filteredSummaries = getSortedSummaries(sourceSummaries);
  summaryCount.textContent = `${filteredSummaries.length} ${filteredSummaries.length === 1 ? "carga" : "cargas"}`;

  if (!filteredSummaries.length) {
    renderSummaries();
    return;
  }

  summaryList.innerHTML = filteredSummaries
    .map((summary) => createSummaryCard(summary, { allowDelete: true }))
    .join("");
}

function buildVacationsFromSummaries(sourceSummaries) {
  const nextVacations = {};

  sourceSummaries.forEach((summary) => {
    if (!summary?.person || !isValidISODate(summary.from) || !isValidISODate(summary.to)) return;

    const cursor = new Date(`${summary.from}T00:00:00`);
    const end = new Date(`${summary.to}T00:00:00`);
    while (cursor <= end) {
      const isoDate = toISODate(cursor);
      if (!nextVacations[isoDate]) nextVacations[isoDate] = [];
      if (!nextVacations[isoDate].includes(summary.person)) {
        nextVacations[isoDate].push(summary.person);
        nextVacations[isoDate].sort((a, b) => a.localeCompare(b, "es"));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return nextVacations;
}

function isDateInsideSummary(isoDate, summary) {
  return Boolean(
    summary &&
      isValidISODate(isoDate) &&
      isValidISODate(summary.from) &&
      isValidISODate(summary.to) &&
      isoDate >= summary.from &&
      isoDate <= summary.to,
  );
}

function persistAppData() {
  try {
    const appData = {
      vacations,
      summaries,
      view: {
        month: currentMonth,
        year: currentYear,
        selectionStartDate,
        selectionEndDate
      },
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(appStorageKey, JSON.stringify(appData));
    localStorage.setItem(storageKey, JSON.stringify(vacations));
    localStorage.setItem(summaryStorageKey, JSON.stringify(summaries));
  } catch {
    showStatus("No se pudo guardar en el navegador. Revisá el espacio disponible.", "error");
  }
}

function loadVacations() {
  try {
    const appData = loadAppData();
    if (appData && isPlainObject(appData.vacations)) return appData.vacations;

    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : {};
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function loadSummaries() {
  try {
    const appData = loadAppData();
    if (appData && Array.isArray(appData.summaries)) return appData.summaries;

    const stored = localStorage.getItem(summaryStorageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadAppData() {
  try {
    const stored = localStorage.getItem(appStorageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function loadViewState() {
  const appData = loadAppData();
  const savedMonth = Number(appData?.view?.month);
  const savedYear = Number(appData?.view?.year);
  const savedSelectionStart = appData?.view?.selectionStartDate;
  const savedSelectionEnd = appData?.view?.selectionEndDate;
  const hasSavedSelection = isValidISODate(savedSelectionStart) && isValidISODate(savedSelectionEnd);

  if (
    Number.isInteger(savedMonth) &&
    savedMonth >= 0 &&
    savedMonth <= 11 &&
    Number.isInteger(savedYear) &&
    savedYear >= 1900 &&
    savedYear <= 2100
  ) {
    return {
      month: savedMonth,
      year: savedYear,
      selectionStartDate: hasSavedSelection ? savedSelectionStart : "",
      selectionEndDate: hasSavedSelection ? savedSelectionEnd : ""
    };
  }

  return {
    month: today.getMonth(),
    year: today.getFullYear(),
    selectionStartDate: "",
    selectionEndDate: ""
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getUniqueVacationSummaries(sourceSummaries) {
  const summariesById = new Map();

  sourceSummaries.filter(Boolean).forEach((summary) => {
    summariesById.set(summary.id, {
      ...summary,
      days: Number(summary.days) || countDays(summary.from, summary.to),
    });
  });

  return [...summariesById.values()];
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function countDays(from, to) {
  return getDaysBetween(parseLocalDate(from), parseLocalDate(to)) + 1;
}

function parseLocalDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDaysBetween(firstDate, secondDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((secondDate - firstDate) / millisecondsPerDay);
}

function downloadSummaryImage(summary) {
  const person = findPerson(summary.person);
  const color = person ? person.color : "#64748b";
  const canvas = document.createElement("canvas");
  const scale = 2;
  const width = 1200;
  const height = 760;
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  context.fillStyle = "#f7f7f8";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#fff1f2";
  context.fillRect(0, 0, width, 220);

  context.shadowColor = "rgba(15, 23, 42, 0.16)";
  context.shadowBlur = 28;
  context.shadowOffsetY = 16;
  drawRoundedRect(context, 70, 56, 1060, 648, 18, "#ffffff");
  context.shadowColor = "transparent";

  drawRoundedRect(context, 70, 56, 1060, 18, 18, color);
  context.fillStyle = color;
  context.fillRect(70, 72, 1060, 18);

  context.fillStyle = "#e1262f";
  context.font = "800 22px Manrope, Inter, Arial, sans-serif";
  context.fillText("CALENDARIO DE VACACIONES", 112, 126);

  context.fillStyle = color;
  context.beginPath();
  context.arc(156, 210, 52, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "900 30px Manrope, Inter, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(getInitials(summary.person), 156, 221);
  context.textAlign = "left";

  context.fillStyle = "#6b7280";
  context.font = "800 18px Manrope, Inter, Arial, sans-serif";
  context.fillText("PROFILER ASIGNADO", 232, 186);

  drawFittedText(context, summary.person, 232, 235, 760, 52, 30, "900", "#171717");

  drawCanvasPill(context, "SECTOR: PROFILER", 232, 252, 230, 40, "#fff1f2", "#a9151e");

  context.fillStyle = "#e5e7eb";
  context.fillRect(112, 300, 976, 2);

  drawImageField(context, "Desde", formatDisplayDate(summary.from), 112, 344, 226, 120);
  drawImageField(context, "Hasta", formatDisplayDate(summary.to), 362, 344, 226, 120);
  drawImageField(context, "Total", `${summary.days} ${summary.days === 1 ? "dia" : "dias"}`, 612, 344, 226, 120);
  drawImageField(context, "Sector", "Profiler", 862, 344, 226, 120);

  drawRoundedRect(context, 112, 510, 976, 96, 12, "#f8fafc");
  context.strokeStyle = "#e5e7eb";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = "#6b7280";
  context.font = "800 18px Manrope, Inter, Arial, sans-serif";
  context.fillText("DETALLE DEL PERIODO", 140, 548);

  context.fillStyle = "#171717";
  context.font = "700 24px Manrope, Inter, Arial, sans-serif";
  drawFittedText(
    context,
    `Periodo: ${formatDisplayDate(summary.from)} al ${formatDisplayDate(summary.to)}`,
    140,
    584,
    560,
    24,
    18,
    "700",
    "#171717"
  );
  context.font = "700 24px Manrope, Inter, Arial, sans-serif";
  context.fillStyle = "#171717";
  context.fillText("Sector: Profiler", 720, 584);

  const link = document.createElement("a");
  link.download = `resumen-vacaciones-${slugify(summary.person)}-${summary.from}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function drawImageField(context, label, value, x, y, width, height) {
  drawRoundedRect(context, x, y, width, height, 12, "#ffffff");
  context.strokeStyle = "#e5e7eb";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = "#6b7280";
  context.font = "800 18px Manrope, Inter, Arial, sans-serif";
  context.fillText(label.toUpperCase(), x + 24, y + 38);

  drawFittedText(context, value, x + 24, y + 82, width - 48, 28, 20, "900", "#171717");
}

function drawCanvasPill(context, text, x, y, width, height, background, color) {
  drawRoundedRect(context, x, y, width, height, height / 2, background);
  context.fillStyle = color;
  context.font = "900 18px Manrope, Inter, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(text, x + width / 2, y + 28);
  context.textAlign = "left";
}

function drawRoundedRect(context, x, y, width, height, radius, fillStyle) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

function drawFittedText(context, text, x, y, maxWidth, startSize, minSize, weight, color) {
  let fontSize = startSize;

  do {
    context.font = `${weight} ${fontSize}px Manrope, Inter, Arial, sans-serif`;
    fontSize -= 1;
  } while (context.measureText(text).width > maxWidth && fontSize >= minSize);

  context.fillStyle = "#171717";
  context.fillStyle = color;
  context.fillText(text, x, y, maxWidth);
}

function formatShortDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getLastName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || "";
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function findPerson(name) {
  const normalizedName = normalizeSearchText(name);
  const normalizedParts = new Set(normalizedName.split(" ").filter(Boolean));

  return (
    people.find((person) => normalizeSearchText(person.name) === normalizedName) ||
    people.find((person) => {
      const personParts = normalizeSearchText(person.name).split(" ").filter(Boolean);
      return personParts.length && personParts.every((part) => normalizedParts.has(part));
    }) ||
    people.find((person) => {
      const personParts = normalizeSearchText(person.name).split(" ").filter(Boolean);
      const lastName = personParts[personParts.length - 1];
      return lastName && normalizedParts.has(lastName);
    })
  );
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function isValidISODate(value) {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && toISODate(date) === value;
}

function isSameDate(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

init();
