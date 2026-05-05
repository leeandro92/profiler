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
  "Diciembre",
];

const PERSON_GENDERS = {
  "acuña franco": "hombre",
  "acuna franco": "hombre",
  "ailin andres": "mujer",
  "aloe juan": "hombre",
  "aros axel": "hombre",
  "castillo carlos": "hombre",
  "hernan gonsalez": "hombre",
  "hernan gonzales": "hombre",
  "laura brest": "mujer",
  "laura romero": "mujer",
  "leonardo felman": "hombre",
  "leonardo feldman": "hombre",
  "lola cordoba": "mujer",
  "macarena gorosito": "mujer",
  "marine rosini": "mujer",
  "micaela alvarez": "mujer",
  "milagros rolon": "mujer",
  "nieto leandro": "hombre",
  "paulina murua": "mujer",
  "rubilar helena": "mujer",
  "tamara garcia": "mujer",
  "vanesa scalora": "mujer",
  "kyara rodriguez": "mujer",
};

const PERSON_COLORS = {
  "leandro nieto": "#2563eb",
  "nieto leandro": "#2563eb",
  "ailin andres": "#db2777",
  "vanesa scalora": "#059669",
  "elena rubilar": "#7c3aed",
  "rubilar helena": "#7c3aed",
  "paulina murua": "#ea580c",
  "axel aros": "#0891b2",
  "aros axel": "#0891b2",
  "juan aloe": "#ca8a04",
  "aloe juan": "#ca8a04",
  "carlos castillo": "#4f46e5",
  "castillo carlos": "#4f46e5",
  "laura brest": "#16a34a",
  "milagros rolon": "#be123c",
  "hernan gonsalez": "#0d9488",
  "hernan gonzales": "#0d9488",
  "hernan gonzalez": "#0d9488",
  "marine rosini": "#9333ea",
  "lucila lopez": "#dc2626",
  "lopez lucila": "#dc2626",
  "franco acuña": "#0284c7",
  "franco acuna": "#0284c7",
  "acuña franco": "#0284c7",
  "acuna franco": "#0284c7",
  "laura romero": "#65a30d",
  "tamara garcia": "#c026d3",
  "macarena gorosito": "#d97706",
  "lola cordoba": "#0f766e",
  "kyara rodriguez": "#e11d48",
  "micaela alvarez": "#475569",
  "leonardo feldman": "#1d4ed8",
  "leonardo felman": "#1d4ed8",
  "morena berns": "#3cd81d",
};

let grillaData = {};
let grillaSummaries = [];
let hasCachedGrid = false;

const GRILLA_CACHE_KEY = "profilers-grilla-cache-v1";
const GRILLA_YEAR_KEY = "profilers-grilla-year";

const elements = {
  table: document.querySelector("#grillaTable"),
  year: document.querySelector("#grillaYear"),
  loadButton: document.querySelector("#loadGrillaData"),
  downloadButton: document.querySelector("#downloadGrillaImage"),
  status: document.querySelector("#grillaStatus"),
};

init();

function init() {
  const currentYear = new Date().getFullYear();
  const savedYear = Number(localStorage.getItem(GRILLA_YEAR_KEY));
  elements.year.value = isValidYear(savedYear) ? savedYear : currentYear;
  elements.year.addEventListener("change", handleYearChange);
  elements.loadButton.addEventListener("click", handleLoadDatabaseData);
  elements.downloadButton.addEventListener("click", handleDownloadImage);
  loadCachedGridData();
  renderGrid(Number(elements.year.value));
  refreshGridDataFromDatabase({ automatic: true });
}

function handleYearChange() {
  const year = Number(elements.year.value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    elements.year.value = new Date().getFullYear();
  }

  localStorage.setItem(GRILLA_YEAR_KEY, String(elements.year.value));
  renderGrid(Number(elements.year.value));
}

async function handleLoadDatabaseData() {
  await refreshGridDataFromDatabase({ automatic: false });
}

async function refreshGridDataFromDatabase({ automatic = false } = {}) {
  if (!window.VacationDatabase?.getAll) {
    if (!hasCachedGrid) showStatus("No esta disponible la conexion con la base de datos.", "error");
    return;
  }

  elements.loadButton.disabled = true;
  showStatus(automatic ? "Sincronizando grilla con Firestore..." : "Trayendo datos desde Firestore...", "loading");

  try {
    const summaries = await window.VacationDatabase.getAll();
    grillaSummaries = summaries;
    grillaData = buildGridDataFromSummaries(summaries);
    hasCachedGrid = summaries.length > 0;
    saveCachedGridData(summaries);
    renderGrid(Number(elements.year.value));
    showStatus(`Datos cargados: ${summaries.length} comprobante(s) encontrados.`, "success");
  } catch (error) {
    console.warn("No se pudieron traer los datos para la grilla.", error);
    showStatus(
      hasCachedGrid
        ? "No se pudo sincronizar Firestore. Se mantiene la ultima grilla cargada."
        : "No se pudieron traer los datos desde Firestore.",
      hasCachedGrid ? "success" : "error",
    );
  } finally {
    elements.loadButton.disabled = false;
  }
}

function loadCachedGridData() {
  try {
    const cached = JSON.parse(localStorage.getItem(GRILLA_CACHE_KEY));
    const summaries = Array.isArray(cached?.summaries) ? cached.summaries : [];
    if (!summaries.length) return;

    grillaSummaries = summaries;
    grillaData = buildGridDataFromSummaries(summaries);
    hasCachedGrid = true;
    showStatus(`Ultima grilla cargada: ${summaries.length} comprobante(s). Sincronizando...`, "success");
  } catch (error) {
    console.warn("No se pudo cargar la grilla guardada en el navegador.", error);
  }
}

function saveCachedGridData(summaries) {
  try {
    localStorage.setItem(
      GRILLA_CACHE_KEY,
      JSON.stringify({
        summaries,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.warn("No se pudo guardar la grilla en el navegador.", error);
  }
}

function renderGrid(year) {
  const maxDays = 31;
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  const headerRow = document.createElement("tr");
  const monthHeader = document.createElement("th");

  elements.table.innerHTML = "";
  monthHeader.textContent = "Mes";
  monthHeader.scope = "col";
  monthHeader.className = "grilla-month-heading";
  headerRow.appendChild(monthHeader);

  for (let day = 1; day <= maxDays; day += 1) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = String(day);
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);

  monthNames.forEach((monthName, monthIndex) => {
    const row = document.createElement("tr");
    const monthCell = document.createElement("th");
    const daysInMonth = getDaysInMonth(year, monthIndex);

    monthCell.scope = "row";
    monthCell.className = "grilla-month-cell";
    monthCell.textContent = monthName;
    row.appendChild(monthCell);

    for (let day = 1; day <= maxDays; day += 1) {
      const cell = document.createElement("td");

      if (day > daysInMonth) {
        cell.className = "grilla-cell grilla-cell--disabled";
        cell.setAttribute("aria-label", `${monthName} no tiene dia ${day}`);
      } else {
        const dateKey = buildDateKey(year, monthIndex, day);
        const people = grillaData[dateKey] || [];
        cell.className = `grilla-cell${people.length ? " grilla-cell--filled" : ""}`;
        if (people.length) {
          cell.style.background = getPeopleCellBackground(people);
          cell.style.color = getContrastColor(people[0].color);
        }
        cell.dataset.date = dateKey;
        cell.setAttribute("aria-label", `${day} de ${monthName}`);
        cell.innerHTML = people.length ? renderPeopleCell(people) : `<span class="grilla-empty-slot"></span>`;
      }

      row.appendChild(cell);
    }

    tbody.appendChild(row);
  });

  elements.table.append(thead, tbody);
}

function handleDownloadImage() {
  const year = Number(elements.year.value);
  const canvas = createGrillaCanvas(year);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `grilla-vacaciones-${year}.png`;
  link.click();
  showStatus("Imagen de la grilla descargada.", "success");
}

function createGrillaCanvas(year) {
  const scale = 2;
  const width = 2600;
  const padding = 56;
  const titleHeight = 128;
  const headerHeight = 52;
  const rowHeight = 78;
  const monthWidth = 210;
  const dayWidth = (width - padding * 2 - monthWidth) / 31;
  const height = padding * 2 + titleHeight + headerHeight + rowHeight * monthNames.length;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  drawGrillaCanvasBackground(ctx, width, height);

  ctx.fillStyle = "#18181b";
  ctx.font = "900 46px Manrope, Inter, Arial, sans-serif";
  ctx.fillText("Grilla anual de vacaciones", padding, padding + 46);
  ctx.fillStyle = "#64748b";
  ctx.font = "800 22px Manrope, Inter, Arial, sans-serif";
  ctx.fillText(`Año ${year} - datos cargados desde la base`, padding, padding + 82);

  const tableX = padding;
  const tableY = padding + titleHeight;

  drawCanvasCell(ctx, tableX, tableY, monthWidth, headerHeight, "Mes", {
    background: "#18181b",
    color: "#ffffff",
    bold: true,
    align: "left",
    stroke: "#2f2f35",
  });

  for (let day = 1; day <= 31; day += 1) {
    drawCanvasCell(ctx, tableX + monthWidth + (day - 1) * dayWidth, tableY, dayWidth, headerHeight, String(day), {
      background: "#18181b",
      color: "#ffffff",
      bold: true,
      stroke: "#2f2f35",
    });
  }

  monthNames.forEach((monthName, monthIndex) => {
    const y = tableY + headerHeight + monthIndex * rowHeight;
    const daysInMonth = getDaysInMonth(year, monthIndex);
    drawCanvasCell(ctx, tableX, y, monthWidth, rowHeight, monthName, {
      background: "#fff1f2",
      color: "#9f1239",
      bold: true,
      align: "left",
      stroke: "#e6c7cb",
    });

    for (let day = 1; day <= 31; day += 1) {
      const x = tableX + monthWidth + (day - 1) * dayWidth;
      if (day > daysInMonth) {
        drawDisabledCanvasCell(ctx, x, y, dayWidth, rowHeight);
        continue;
      }

      const dateKey = buildDateKey(year, monthIndex, day);
      const people = grillaData[dateKey] || [];
      drawCanvasPeopleCell(ctx, x, y, dayWidth, rowHeight, people, { showNames: false });
    }

    drawCanvasMonthRangeLabels(ctx, year, monthIndex, tableX + monthWidth, y, dayWidth, rowHeight);
  });

  return canvas;
}

function drawGrillaCanvasBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff7f7");
  gradient.addColorStop(0.5, "#ffffff");
  gradient.addColorStop(1, "#f8fafc");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawCanvasPeopleCell(ctx, x, y, width, height, people, options = {}) {
  const background = createCanvasPeopleBackground(ctx, x, y, width, height, people);
  if (people.length) {
    drawFilledCanvasCell(ctx, x, y, width, height, background);
  } else {
    drawCanvasCell(ctx, x, y, width, height, "", { background, stroke: "#d7dce3" });
  }
  if (!people.length || options.showNames === false) return;

  const visiblePeople = people.slice(0, 2);
  const chipHeight = people.length > 1 ? 30 : 42;
  let chipY = y + (height - visiblePeople.length * chipHeight - (visiblePeople.length - 1) * 4) / 2;

  visiblePeople.forEach((person) => {
    ctx.fillStyle = getContrastColor(person.color);
    ctx.font = `900 ${people.length > 1 ? 15 : 18}px Manrope, Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    drawFittedCanvasText(ctx, person.displayName || getLastName(person.name), x + width / 2, chipY + chipHeight / 2 + 5, width - 8);
    chipY += chipHeight + 4;
  });

  if (people.length > 2) {
    ctx.fillStyle = getContrastColor(people[0].color);
    ctx.font = "900 13px Manrope, Inter, Arial, sans-serif";
    ctx.fillText(`+${people.length - 2}`, x + width / 2, y + height - 6);
  }

  ctx.textAlign = "left";
}

function drawFilledCanvasCell(ctx, x, y, width, height, background) {
  ctx.fillStyle = background;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.75);
  ctx.lineTo(x + width, y + 0.75);
  ctx.moveTo(x, y + height - 0.75);
  ctx.lineTo(x + width, y + height - 0.75);
  ctx.stroke();
}

function drawDisabledCanvasCell(ctx, x, y, width, height) {
  ctx.fillStyle = "#d4d4d8";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  for (let offset = -height; offset < width; offset += 14) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + height);
    ctx.lineTo(x + offset + height, y);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(82, 82, 91, 0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
}

function drawCanvasMonthRangeLabels(ctx, year, monthIndex, startX, rowY, dayWidth, rowHeight) {
  const monthStart = buildDateKey(year, monthIndex, 1);
  const monthEnd = buildDateKey(year, monthIndex, getDaysInMonth(year, monthIndex));
  const segments = getSummarySegmentsForMonth(monthStart, monthEnd);

  segments.forEach((segment) => {
    const startDay = Number(segment.from.slice(-2));
    const endDay = Number(segment.to.slice(-2));
    const segmentX = startX + (startDay - 1) * dayWidth;
    const segmentWidth = (endDay - startDay + 1) * dayWidth;
    const text = getLastName(segment.person);
    const color = getPersonColor(segment.person);
    const textColor = getContrastColor(color);

    ctx.save();
    ctx.beginPath();
    ctx.rect(segmentX + 2, rowY + 2, segmentWidth - 4, rowHeight - 4);
    ctx.clip();
    ctx.fillStyle = textColor;
    ctx.strokeStyle = textColor === "#ffffff" ? "rgba(0, 0, 0, 0.34)" : "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawCenteredRangeText(ctx, text, segmentX + segmentWidth / 2, rowY + rowHeight / 2, segmentWidth - 12);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
  });

  ctx.textAlign = "left";
}

function drawCenteredRangeText(ctx, text, x, y, maxWidth) {
  const value = String(text);
  let fontSize = 24;
  const minSize = 11;

  do {
    ctx.font = `900 ${fontSize}px Manrope, Inter, Arial, sans-serif`;
    if (ctx.measureText(value).width <= maxWidth) break;
    fontSize -= 1;
  } while (fontSize >= minSize);

  ctx.strokeText(value, x, y, maxWidth);
  ctx.fillText(value, x, y, maxWidth);
}

function getSummarySegmentsForMonth(monthStart, monthEnd) {
  return grillaSummaries
    .filter((summary) => summary?.person && isValidISODate(summary.from) && isValidISODate(summary.to))
    .map((summary) => {
      const from = summary.from < monthStart ? monthStart : summary.from;
      const to = summary.to > monthEnd ? monthEnd : summary.to;
      return { person: summary.person, from, to };
    })
    .filter((segment) => segment.from <= segment.to);
}

function drawCanvasCell(ctx, x, y, width, height, text, options = {}) {
  ctx.fillStyle = options.background || "#ffffff";
  ctx.fillRect(x, y, width, height);
  if (options.stroke !== "none") {
    ctx.strokeStyle = options.stroke || "#eceff3";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  if (!text) return;

  ctx.fillStyle = options.color || "#0f172a";
  ctx.font = `${options.bold ? "900" : "800"} 15px Manrope, Inter, Arial, sans-serif`;
  ctx.textAlign = options.align === "left" ? "left" : "center";
  ctx.textBaseline = "middle";
  const textX = options.align === "left" ? x + 14 : x + width / 2;
  ctx.fillText(text, textX, y + height / 2, width - 12);
  ctx.textBaseline = "alphabetic";
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke !== "transparent") {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawFittedCanvasText(ctx, text, x, y, maxWidth) {
  const value = String(text);
  if (ctx.measureText(value).width <= maxWidth) {
    ctx.fillText(value, x, y, maxWidth);
    return;
  }

  ctx.fillText(value, x, y, maxWidth);
}

function buildGridDataFromSummaries(summaries) {
  return summaries.reduce((result, summary) => {
    if (!summary?.person || !isValidISODate(summary.from) || !isValidISODate(summary.to)) return result;

    const cursor = parseLocalDate(summary.from);
    const end = parseLocalDate(summary.to);

    while (cursor <= end) {
      const dateKey = toISODate(cursor);
      if (!result[dateKey]) result[dateKey] = [];
      if (!result[dateKey].some((item) => item.name === summary.person)) {
        result[dateKey].push({
          name: summary.person,
          displayName: getLastName(summary.person),
          gender: getPersonGender(summary.person),
          color: getPersonColor(summary.person),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, {});
}

function renderPeopleCell(people) {
  return people
    .map((person) => {
      return `<span class="grilla-name" style="color:${getContrastColor(person.color)}" title="${escapeHtml(person.name)}">${escapeHtml(person.displayName || getLastName(person.name))}</span>`;
    })
    .join("");
}

function getPeopleCellBackground(people) {
  if (!people.length) return "#fbfbfc";
  if (people.length === 1) return people[0].color;

  const step = 100 / people.length;
  const stops = people
    .map((person, index) => {
      const from = Math.round(index * step);
      const to = Math.round((index + 1) * step);
      return `${person.color} ${from}% ${to}%`;
    })
    .join(", ");
  return `linear-gradient(135deg, ${stops})`;
}

function createCanvasPeopleBackground(ctx, x, y, width, height, people) {
  if (!people.length) return "#fbfbfc";
  if (people.length === 1) return people[0].color;

  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  people.forEach((person, index) => {
    const stop = people.length === 1 ? 0 : index / (people.length - 1);
    gradient.addColorStop(stop, person.color);
  });
  return gradient;
}

function getPersonGender(name) {
  return PERSON_GENDERS[normalizeText(name)] || "otro";
}

function getPersonColor(name) {
  const normalizedName = normalizeText(name);
  const normalizedParts = new Set(normalizedName.split(" ").filter(Boolean));
  const exact = PERSON_COLORS[normalizedName];
  if (exact) return exact;

  const matchKey = Object.keys(PERSON_COLORS).find((key) => {
    const parts = key.split(" ").filter(Boolean);
    return parts.length && parts.every((part) => normalizedParts.has(part));
  });
  if (matchKey) return PERSON_COLORS[matchKey];

  const lastName = [...normalizedParts].at(-1);
  const lastNameKey = Object.keys(PERSON_COLORS).find((key) => key.split(" ").includes(lastName));
  return lastNameKey ? PERSON_COLORS[lastNameKey] : "#64748b";
}

function getContrastColor(hexColor) {
  const hex = String(hexColor || "#64748b").replace("#", "");
  const expanded = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  const red = parseInt(expanded.slice(0, 2), 16);
  const green = parseInt(expanded.slice(2, 4), 16);
  const blue = parseInt(expanded.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? "#111827" : "#ffffff";
}

function getLastName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || "";
}

function showStatus(message, type = "success") {
  elements.status.textContent = message;
  elements.status.className = `grilla-status grilla-status--${type}`;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function isValidYear(year) {
  return Number.isInteger(year) && year >= 1900 && year <= 2100;
}

function buildDateKey(year, monthIndex, day) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const safeDay = String(day).padStart(2, "0");
  return `${year}-${month}-${safeDay}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidISODate(value) {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && toISODate(date) === value;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
