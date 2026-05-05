const adminPeople = [
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
  { name: "Franco Acuna", color: "#0284c7" },
  { name: "Laura Romero", color: "#65a30d" },
  { name: "Tamara Garcia", color: "#c026d3" },
  { name: "Macarena Gorosito", color: "#d97706" },
  { name: "Lola Cordoba", color: "#0f766e" },
  { name: "Kyara Rodriguez", color: "#e11d48" },
  { name: "Micaela Alvarez", color: "#475569" },
  { name: "Leonardo Feldman", color: "#1d4ed8" },
  { name: "Morena Berns", color: "#3cd81d" },
];

const adminMonthNames = [
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
  "Diciembre",
];

const adminToday = new Date();
let adminCurrentMonth = adminToday.getMonth();
let adminCurrentYear = adminToday.getFullYear();
let adminVacations = {};
let adminSummaries = [];

const adminCalendarGrid = document.querySelector("#calendarGrid");
const adminMonthSelect = document.querySelector("#monthSelect");
const adminYearInput = document.querySelector("#yearInput");
const adminPrevMonth = document.querySelector("#prevMonth");
const adminNextMonth = document.querySelector("#nextMonth");
const adminTodayChip = document.querySelector("#todayChip");
const adminStatus = document.querySelector("#adminCalendarStatus");
const adminVacationSearchForm = document.querySelector("#adminVacationSearchForm");
const adminVacationSearchInput = document.querySelector("#adminVacationSearchInput");
const adminVacationSearchResults = document.querySelector("#adminVacationSearchResults");

if (document.body.classList.contains("admin-auth-ready")) {
  initAdministratorCalendar();
} else {
  document.addEventListener("administrator-auth-ready", initAdministratorCalendar, { once: true });
}

async function initAdministratorCalendar() {
  populateAdminMonthSelect();
  bindAdministratorCalendarEvents();
  adminTodayChip.textContent = `Hoy: ${formatAdminDisplayDate(toAdminISODate(adminToday))}`;
  renderAdministratorCalendar();
  await hydrateAdministratorCalendarFromFirestore();
}

function populateAdminMonthSelect() {
  adminMonthNames.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = month;
    adminMonthSelect.appendChild(option);
  });
}

function bindAdministratorCalendarEvents() {
  adminPrevMonth.addEventListener("click", () => moveAdministratorMonth(-1));
  adminNextMonth.addEventListener("click", () => moveAdministratorMonth(1));
  adminVacationSearchForm?.addEventListener("submit", handleAdministratorVacationSearch);

  adminMonthSelect.addEventListener("change", () => {
    adminCurrentMonth = Number(adminMonthSelect.value);
    renderAdministratorCalendar();
  });

  adminYearInput.addEventListener("change", () => {
    const year = Number(adminYearInput.value);
    if (Number.isInteger(year) && year >= 1900 && year <= 2100) {
      adminCurrentYear = year;
      renderAdministratorCalendar();
      return;
    }

    adminYearInput.value = adminCurrentYear;
    showAdministratorStatus("Ingresa un año entre 1900 y 2100.", "error");
  });
}

function moveAdministratorMonth(offset) {
  adminCurrentMonth += offset;

  if (adminCurrentMonth < 0) {
    adminCurrentMonth = 11;
    adminCurrentYear -= 1;
  }

  if (adminCurrentMonth > 11) {
    adminCurrentMonth = 0;
    adminCurrentYear += 1;
  }

  renderAdministratorCalendar();
}

function renderAdministratorCalendar() {
  adminMonthSelect.value = adminCurrentMonth;
  adminYearInput.value = adminCurrentYear;
  adminCalendarGrid.innerHTML = "";

  const firstDay = new Date(adminCurrentYear, adminCurrentMonth, 1);
  const lastDay = new Date(adminCurrentYear, adminCurrentMonth + 1, 0);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < totalCells; index += 1) {
    const dayOffset = index - leadingDays + 1;
    const date = new Date(adminCurrentYear, adminCurrentMonth, dayOffset);
    fragment.appendChild(createAdministratorDayCell(date, date.getMonth() === adminCurrentMonth));
  }

  adminCalendarGrid.appendChild(fragment);
}

function createAdministratorDayCell(date, isCurrentMonth) {
  const isoDate = toAdminISODate(date);
  const assignments = adminVacations[isoDate] || [];
  const cell = document.createElement("article");
  cell.className = "day-cell admin-readonly-day";
  cell.setAttribute("aria-label", formatAdminDisplayDate(isoDate));

  if (!isCurrentMonth) cell.classList.add("is-muted");
  if (isoDate === toAdminISODate(adminToday)) cell.classList.add("is-today");

  const visibleAssignments = assignments.slice(0, 4);
  const hiddenCount = assignments.length - visibleAssignments.length;

  cell.innerHTML = `
    <span class="day-number">${date.getDate()}</span>
    <span class="assignment-stack">
      ${visibleAssignments.map(renderAdministratorAssignmentPill).join("")}
      ${hiddenCount > 0 ? `<span class="more-pill">+${hiddenCount} mas</span>` : ""}
    </span>
  `;

  return cell;
}

function renderAdministratorAssignmentPill(name) {
  const person = findAdministratorPerson(name);
  const color = person ? person.color : "#64748b";
  return `<span class="assignment-pill" style="background:${color}" title="${escapeHtmlAdmin(name)}">${escapeHtmlAdmin(name)}</span>`;
}

async function hydrateAdministratorCalendarFromFirestore() {
  if (!window.VacationDatabase?.getAll) {
    adminVacations = {};
    renderAdministratorCalendar();
    showAdministratorStatus("No esta disponible la conexion con Firestore.", "error");
    return;
  }

  showAdministratorStatus("Cargando vacaciones desde Firestore...", "loading");

  try {
    const summaries = await window.VacationDatabase.getAll();
    adminSummaries = getUniqueAdministratorSummaries(summaries);
    adminVacations = buildAdministratorVacationsFromSummaries(adminSummaries);
    renderAdministratorCalendar();
    showAdministratorStatus(`Calendario actualizado con ${adminSummaries.length} registro(s).`, "success");
  } catch (error) {
    console.warn("No se pudieron cargar las vacaciones para administrador.", error);
    adminVacations = {};
    renderAdministratorCalendar();
    showAdministratorStatus("No se pudieron cargar los datos desde Firestore.", "error");
  }
}

async function handleAdministratorVacationSearch(event) {
  event.preventDefault();

  const searchValue = adminVacationSearchInput.value.trim();
  if (!searchValue) {
    renderAdministratorSearchMessage("Ingresa nombre y apellido para buscar.", "error");
    return;
  }

  renderAdministratorSearchMessage("Buscando vacaciones guardadas...", "loading");

  try {
    const searchKey = normalizeAdminText(searchValue);
    const localMatches = adminSummaries.filter((summary) => normalizeAdminText(summary.person).includes(searchKey));
    const databaseMatches = window.VacationDatabase?.getByPerson
      ? await window.VacationDatabase.getByPerson(searchValue)
      : [];
    const matches = getUniqueAdministratorSummaries([...localMatches, ...databaseMatches]).sort((a, b) =>
      a.from.localeCompare(b.from),
    );

    if (!matches.length) {
      renderAdministratorSearchMessage(`No hay vacaciones guardadas para ${escapeHtmlAdmin(searchValue)}.`, "error");
      return;
    }

    adminSummaries = getUniqueAdministratorSummaries([...adminSummaries, ...matches]);
    adminVacations = buildAdministratorVacationsFromSummaries(adminSummaries);
    renderAdministratorCalendar();
    adminVacationSearchResults.innerHTML = matches.map(createAdministratorSummaryCard).join("");
    showAdministratorStatus(`Se encontraron ${matches.length} comprobante(s).`, "success");
  } catch (error) {
    console.warn("No se pudo buscar vacaciones desde administrador.", error);
    renderAdministratorSearchMessage("No se pudo consultar la base de datos.", "error");
  }
}

function createAdministratorSummaryCard(summary) {
  const person = findAdministratorPerson(summary.person);
  const color = person ? person.color : "#64748b";
  const days = Number(summary.days) || countAdministratorDays(summary.from, summary.to);

  return `
    <article class="summary-card admin-readonly-summary" style="--person-color:${color}">
      <div class="summary-card-top">
        <div class="summary-brand">
          <span class="summary-avatar" style="background:${color}">${getAdministratorInitials(summary.person)}</span>
          <div>
            <h3 class="summary-person">${escapeHtmlAdmin(summary.person)}</h3>
            <span class="summary-sector">Sector: Profiler</span>
          </div>
        </div>
        <span class="summary-badge">${days} ${days === 1 ? "dia" : "dias"}</span>
      </div>

      <div class="summary-period">
        <div>
          <span>Desde</span>
          <strong>${escapeHtmlAdmin(formatAdminShortDate(summary.from))}</strong>
        </div>
        <div class="summary-line" aria-hidden="true"></div>
        <div>
          <span>Hasta</span>
          <strong>${escapeHtmlAdmin(formatAdminShortDate(summary.to))}</strong>
        </div>
      </div>

      <div class="admin-readonly-note">
        Comprobante solo lectura
      </div>
    </article>
  `;
}

function renderAdministratorSearchMessage(message, type = "success") {
  adminVacationSearchResults.innerHTML = `<div class="summary-empty" data-status="${type}">${message}</div>`;
}

function buildAdministratorVacationsFromSummaries(summaries) {
  return summaries.reduce((result, summary) => {
    if (!summary?.person || !isValidAdminISODate(summary.from) || !isValidAdminISODate(summary.to)) return result;

    const cursor = parseAdminLocalDate(summary.from);
    const end = parseAdminLocalDate(summary.to);

    while (cursor <= end) {
      const isoDate = toAdminISODate(cursor);
      if (!result[isoDate]) result[isoDate] = [];
      if (!result[isoDate].includes(summary.person)) {
        result[isoDate].push(summary.person);
        result[isoDate].sort((a, b) => a.localeCompare(b, "es"));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, {});
}

function findAdministratorPerson(name) {
  const normalizedName = normalizeAdminText(name);
  const normalizedParts = new Set(normalizedName.split(" ").filter(Boolean));

  return (
    adminPeople.find((person) => normalizeAdminText(person.name) === normalizedName) ||
    adminPeople.find((person) => {
      const personParts = normalizeAdminText(person.name).split(" ").filter(Boolean);
      return personParts.length && personParts.every((part) => normalizedParts.has(part));
    }) ||
    null
  );
}

function showAdministratorStatus(message, type = "success") {
  adminStatus.textContent = message;
  adminStatus.dataset.status = type;
}

function getUniqueAdministratorSummaries(sourceSummaries) {
  const summariesById = new Map();
  sourceSummaries.filter(Boolean).forEach((summary) => {
    const id = summary.id || `${summary.person}-${summary.from}-${summary.to}`;
    summariesById.set(id, {
      ...summary,
      id,
      days: Number(summary.days) || countAdministratorDays(summary.from, summary.to),
    });
  });
  return [...summariesById.values()];
}

function countAdministratorDays(from, to) {
  if (!isValidAdminISODate(from) || !isValidAdminISODate(to)) return 0;
  const start = parseAdminLocalDate(from);
  const end = parseAdminLocalDate(to);
  return Math.round((end - start) / 86400000) + 1;
}

function getAdministratorInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function formatAdminShortDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatAdminDisplayDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function parseAdminLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toAdminISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidAdminISODate(value) {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && toAdminISODate(date) === value;
}

function normalizeAdminText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escapeHtmlAdmin(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
