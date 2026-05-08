const STORAGE_KEY = "rotador-puestos-v1";

const SECTIONS = [
  {
    id: "principales",
    label: "Puestos principales",
    roles: [
      { id: "rv", label: "RV" },
      { id: "documentacion", label: "Documentacion" },
      { id: "ejecutiva", label: "Ejecutiva" },
      { id: "prioridad", label: "Prioridad" },
      { id: "exit", label: "Exit" },
      { id: "exit2", label: "Exit 2" },
      { id: "sublos", label: "Sublos" },
      { id: "manifiesto", label: "Manifiesto" },
      { id: "cierre_lobby", label: "Cierre de lobby" },
      { id: "catering", label: "Catering" },
      { id: "rampa", label: "Rampa" },
      { id: "chequeo_avion", label: "Chequeo del avion" },
    ],
  },
  {
    id: "embarque",
    label: "Embarque",
    roles: [
      { id: "armado_sala", label: "Armado de sala" },
      { id: "documentacion", label: "Documentacion" },
      { id: "etd", label: "ETD" },
      { id: "selective", label: "Selective" },
      { id: "mesa", label: "Mesa" },
      { id: "llevar_maquina", label: "Desarme de ETD" },
    ],
  },
];

const DISPLAY_SECTIONS = [
  {
    id: "lobby",
    label: "Lobby",
    sourceSectionId: "principales",
    roleIds: ["rv", "documentacion", "ejecutiva", "prioridad", "exit", "exit2", "sublos", "manifiesto", "cierre_lobby"],
  },
  {
    id: "catering_block",
    label: "Catering",
    sourceSectionId: "principales",
    roleIds: ["catering"],
  },
  {
    id: "rampa_block",
    label: "Rampa",
    sourceSectionId: "principales",
    roleIds: ["rampa"],
  },
  {
    id: "armado_block",
    label: "Armado de sala",
    sourceSectionId: "embarque",
    roleIds: ["armado_sala"],
  },
  {
    id: "chequeo_block",
    label: "Chequeo del avion",
    sourceSectionId: "principales",
    roleIds: ["chequeo_avion"],
  },
  {
    id: "embarque_block",
    label: "Embarque",
    sourceSectionId: "embarque",
    roleIds: ["documentacion", "etd", "selective", "mesa"],
  },
  {
    id: "maquina_block",
    label: "Desarme de ETD",
    sourceSectionId: "embarque",
    roleIds: ["llevar_maquina"],
  },
];

const DISPLAY_SECTION_TIME_FIELDS = {
  lobby: [
    { key: "lobbyStartTime", label: "Inicio de lobby" },
    { key: "lobbyCloseTime", label: "Cierre de lobby" },
    { key: "paxTotal", label: "Pax Total" },
  ],
  embarque_block: [
    { key: "boardingStartTime", label: "Inicio de embarque" },
    { key: "boardingCloseTime", label: "Cierre de Embarque" },
    { key: "pushbackTime", label: "Pushback" },
    { key: "selecteeTotal", label: "Selectee" },
  ],
};

const HISTORY_SECTION_THEMES = {
  lobby: { accent: "#e1262f", soft: "#fff1f2", border: "#fecdd3", text: "#9f1239" },
  catering_block: { accent: "#f59e0b", soft: "#fffbeb", border: "#fde68a", text: "#92400e" },
  rampa_block: { accent: "#18181b", soft: "#f4f4f5", border: "#d4d4d8", text: "#27272a" },
  armado_block: { accent: "#0ea5e9", soft: "#eff6ff", border: "#bae6fd", text: "#075985" },
  chequeo_block: { accent: "#7c3aed", soft: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6" },
  embarque_block: { accent: "#059669", soft: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  maquina_block: { accent: "#dc2626", soft: "#fef2f2", border: "#fecaca", text: "#991b1b" },
};

const elements = {
  notice: document.querySelector("#historyNotice"),
  savedDaysCount: document.querySelector("#savedDaysCount"),
  uniqueDaysCount: document.querySelector("#uniqueDaysCount"),
  lastSavedDate: document.querySelector("#lastSavedDate"),
  searchForm: document.querySelector("#historySearchForm"),
  searchDate: document.querySelector("#historySearchDate"),
  clearSearchButton: document.querySelector("#clearHistorySearchButton"),
  historyListTitle: document.querySelector("#historyListTitle"),
  downloadImageButton: document.querySelector("#downloadImageButton"),
  clearButton: document.querySelector("#clearFullHistoryButton"),
  historyList: document.querySelector("#fullHistoryList"),
};

let visibleHistoryEntries = [];

init();

function init() {
  elements.searchForm.addEventListener("submit", handleSearchByDate);
  elements.clearSearchButton?.addEventListener("click", handleClearSearch);
  elements.downloadImageButton.addEventListener("click", handleDownloadImage);
  elements.clearButton.addEventListener("click", handleClearHistory);
  render();
}

function loadHistoryState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.history)) return { history: [] };
    return {
      ...saved,
      history: getUniqueHistoryByDate(saved.history),
    };
  } catch (error) {
    return { history: [] };
  }
}

async function loadHistoryEntries() {
  if (!window.HistoryDatabase) return [];

  try {
    const databaseHistory = await window.HistoryDatabase.getAll();
    return getUniqueHistoryByDate(databaseHistory);
  } catch (error) {
    console.warn("No se pudo leer la base de datos.", error);
    return [];
  }
}

async function loadHistoryEntriesByDate(date) {
  if (!window.HistoryDatabase?.getByDate) return [];

  try {
    const databaseMatches = await window.HistoryDatabase.getByDate(date);
    return getUniqueHistoryByDate(databaseMatches);
  } catch (error) {
    console.warn("No se pudo buscar la fecha en la base de datos.", error);
    return [];
  }
}

async function render() {
  const history = getSortedHistory(await loadHistoryEntries());

  elements.historyListTitle.textContent = "Historial guardado";
  elements.savedDaysCount.textContent = String(history.length);
  elements.lastSavedDate.textContent = history.length
    ? formatDate(history[history.length - 1].date)
    : "Sin datos";

  renderHistory(history);
}

async function handleSearchByDate(event) {
  event.preventDefault();

  const date = elements.searchDate.value;
  if (!date) {
    showNotice("Selecciona una fecha para buscar.", "error");
    return;
  }

  const history = getSortedHistory(await loadHistoryEntriesByDate(date));
  elements.historyListTitle.textContent = `Resultado de ${formatDate(date)}`;

  if (!history.length) {
    renderHistory([]);
    showNotice(`No hay historial guardado para ${formatDate(date)}.`, "error");
    return;
  }

  renderHistory(history);
  showNotice(`Historial de ${formatDate(date)} cargado desde la base.`, "success");
}

async function handleClearSearch() {
  elements.searchDate.value = "";
  await render();
  showNotice("Se muestra nuevamente todo el historial.", "success");
}

function renderHistory(history) {
  visibleHistoryEntries = getSortedHistory(history);

  if (!history.length) {
    elements.historyList.className = "history-list empty-state";
    elements.historyList.textContent = "No hay asignaciones guardadas.";
    elements.downloadImageButton.disabled = true;
    return;
  }

  elements.downloadImageButton.disabled = false;
  elements.historyList.className = "history-list";
  elements.historyList.innerHTML = "";

  history
    .slice()
    .reverse()
    .forEach((entry) => {
      elements.historyList.appendChild(createHistoryEntry(entry));
  });
}

async function handleClearHistory() {
  elements.historyListTitle.textContent = "Historial guardado";
  elements.savedDaysCount.textContent = "0";
  elements.lastSavedDate.textContent = "Sin datos";
  renderHistory([]);
}

async function handleDownloadImage() {
  const history = getSortedHistory(visibleHistoryEntries);

  if (!history.length) {
    showNotice("No hay historial visible para descargar.", "error");
    return;
  }

  const canvas = createHistoryCanvas(history);
  const filename = `historial-profilers-${getToday()}.png`;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
  showNotice("Imagen del historial descargada.", "success");
}

function createHistoryCanvas(history) {
  const width = 1600;
  const padding = 72;
  const contentWidth = width - padding * 2;
  const rows = buildCanvasRows(history, contentWidth);
  const height = Math.max(960, rows.height + padding * 2);
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  drawCanvasBackground(ctx, width, height);

  let y = padding;
  drawCanvasHeader(ctx, history, padding, y, contentWidth);

  y += 170;
  rows.entries.forEach((entryLayout) => {
    y = drawEntryOnCanvas(ctx, entryLayout, padding, y, contentWidth);
  });

  return canvas;
}

function buildCanvasRows(history, contentWidth) {
  const measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  const entries = [];
  let height = 210;

  history
    .slice()
    .reverse()
    .forEach((entry) => {
      const entryRows = [];
      DISPLAY_SECTIONS.forEach((displaySection) => {
        const sourceSection = getSection(displaySection.sourceSectionId);
        const roleRows = displaySection.roleIds.map((roleId) => {
          const role = sourceSection.roles.find((item) => item.id === roleId);
          const names = (entry.sections?.[sourceSection.id]?.[role.id] || []).map((personId) =>
            getPersonName(personId, entry),
          );
          return { role: role.label, names: getHistoryRoleNames(entry, sourceSection, role, names) };
        });
        roleRows.push(...getHistoryTimeRows(entry, displaySection.id));
        entryRows.push({ id: displaySection.id, title: displaySection.label, roleRows });
      });

      const rowHeight = measureEntryHeight(ctx, entryRows, contentWidth);
      entries.push({ entry, entryRows, height: rowHeight });
      height += rowHeight + 22;
    });

  return { entries, height };
}

function measureEntryHeight(ctx, entryRows, contentWidth) {
  let height = 86;
  const columnWidth = (contentWidth - 24) / 2;
  ctx.font = "700 18px 'Manrope', Arial, sans-serif";

  for (let index = 0; index < entryRows.length; index += 2) {
    const left = measureSectionHeight(ctx, entryRows[index], columnWidth);
    const right = entryRows[index + 1] ? measureSectionHeight(ctx, entryRows[index + 1], columnWidth) : 0;
    height += Math.max(left, right) + 14;
  }

  return height + 28;
}

function measureSectionHeight(ctx, section, width) {
  let height = 48;
  section.roleRows.forEach((row) => {
    const line = `${row.role}: ${row.names.join(", ")}`;
    height += wrapCanvasText(ctx, line, width - 34).length * 24;
  });
  return height + 20;
}

function drawCanvasBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff7f7");
  gradient.addColorStop(0.42, "#f8fafc");
  gradient.addColorStop(1, "#f4f4f5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(225, 38, 47, 0.08)";
  ctx.beginPath();
  ctx.arc(130, 120, 280, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(24, 24, 27, 0.07)";
  ctx.beginPath();
  ctx.arc(width - 90, 120, 250, 0, Math.PI * 2);
  ctx.fill();
}

function drawCanvasHeader(ctx, history, x, y, width) {
  drawRoundRect(ctx, x, y, width, 134, 24, "#18181b", "rgba(24, 24, 27, 0.18)");

  ctx.fillStyle = "rgba(225, 38, 47, 0.22)";
  ctx.beginPath();
  ctx.arc(x + width - 110, y + 20, 190, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 52px 'Plus Jakarta Sans', 'Manrope', Arial, sans-serif";
  ctx.fillText("Historial Profilers", x + 38, y + 62);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = "700 21px 'Manrope', Arial, sans-serif";
  ctx.fillText(`Descargado: ${formatDate(getToday())}`, x + 40, y + 100);

  const uniqueDays = new Set(history.map((entry) => entry.date)).size;
  drawCanvasStat(ctx, `${history.length}`, "Registros visibles", x + width - 430, y + 34, 170);
  drawCanvasStat(ctx, `${uniqueDays}`, "Dias", x + width - 238, y + 34, 160);
}

function drawCanvasStat(ctx, value, label, x, y, width) {
  drawRoundRect(ctx, x, y, width, 72, 16, "rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.18)");
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 28px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText(value, x + 18, y + 34);
  ctx.fillStyle = "#d4d4d8";
  ctx.font = "800 13px 'Manrope', Arial, sans-serif";
  ctx.fillText(label.toUpperCase(), x + 18, y + 56);
}

function drawEntryOnCanvas(ctx, entryLayout, x, y, width) {
  const { entry, entryRows, height } = entryLayout;
  drawRoundRect(ctx, x, y, width, height, 22, "#ffffff", "rgba(24, 24, 27, 0.1)");

  ctx.fillStyle = "#e1262f";
  ctx.font = "900 29px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText(formatDate(entry.date), x + 24, y + 42);

  ctx.fillStyle = "#64748b";
  ctx.font = "800 17px 'Manrope', Arial, sans-serif";
  ctx.fillText(`${countUniqueEntryPeople(entry)} personas unicas`, x + width - 245, y + 42);

  const columnWidth = (width - 72) / 2;
  let rowY = y + 82;
  for (let index = 0; index < entryRows.length; index += 2) {
    const leftHeight = drawSectionOnCanvas(ctx, entryRows[index], x + 24, rowY, columnWidth);
    const rightHeight = entryRows[index + 1]
      ? drawSectionOnCanvas(ctx, entryRows[index + 1], x + 48 + columnWidth, rowY, columnWidth)
      : 0;
    rowY += Math.max(leftHeight, rightHeight) + 14;
  }

  return y + height + 22;
}

function drawSectionOnCanvas(ctx, section, x, y, width) {
  const height = measureSectionHeight(ctx, section, width);
  const theme = getHistoryTheme(section.id);
  drawRoundRect(ctx, x, y, width, height, 16, theme.soft, theme.border);

  ctx.fillStyle = theme.accent;
  ctx.fillRect(x, y + 14, 5, height - 28);

  ctx.fillStyle = theme.text;
  ctx.font = "900 18px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText(section.title.toUpperCase(), x + 18, y + 30);

  let textY = y + 60;
  section.roleRows.forEach((row) => {
    const line = `${row.role}: ${row.names.join(", ")}`;
    const lines = wrapCanvasText(ctx, line, width - 38);
    lines.forEach((line) => {
      const [roleLabel, ...nameParts] = line.split(":");
      ctx.fillStyle = "#0f172a";
      ctx.font = "800 17px 'Manrope', Arial, sans-serif";
      if (nameParts.length) {
        ctx.fillText(`${roleLabel}:`, x + 18, textY);
        const roleWidth = ctx.measureText(`${roleLabel}: `).width;
        ctx.fillStyle = "#475569";
        ctx.font = "700 17px 'Manrope', Arial, sans-serif";
        ctx.fillText(nameParts.join(":").trim(), x + 18 + roleWidth, textY);
      } else {
        ctx.fillText(line, x + 18, textY);
      }
      textY += 24;
    });
  });

  return height;
}

function getHistoryTheme(sectionId) {
  return HISTORY_SECTION_THEMES[sectionId] || {
    accent: "#64748b",
    soft: "#f8fafc",
    border: "#e2e8f0",
    text: "#334155",
  };
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
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
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
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
    sectionBox.className = `history-section history-section--${displaySection.id}`;

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
  const displayNames = getHistoryRoleNames(entry, section, role, names);

  if (displayNames.length) {
    displayNames.forEach((name, index) => {
      if (index > 0) namesBox.appendChild(document.createElement("br"));
      namesBox.appendChild(document.createTextNode(name));
    });
  } else {
    namesBox.textContent = "-";
  }

  roleBox.append(roleName, namesBox);
  return roleBox;
}

function getHistoryRoleNames(entry, section, role, names) {
  const displayNames = names.length ? [...names] : ["-"];
  return displayNames;
}

function appendHistoryTimeRoles(roleGrid, entry, displaySectionId) {
  getHistoryTimeRows(entry, displaySectionId).forEach((row) => {
    const roleBox = document.createElement("div");
    roleBox.className = "history-role history-role--time";

    const roleName = document.createElement("strong");
    roleName.textContent = row.role;

    const time = document.createElement("span");
    time.textContent = row.names[0];

    roleBox.append(roleName, time);
    roleGrid.appendChild(roleBox);
  });
}

function getHistoryTimeRows(entry, displaySectionId) {
  const fields = DISPLAY_SECTION_TIME_FIELDS[displaySectionId] || [];

  return fields
    .map((field) => ({
      role: field.label,
      names: entry.meta?.[field.key] ? [entry.meta[field.key]] : [],
    }))
    .filter((row) => row.names.length);
}

function getSection(sectionId) {
  return SECTIONS.find((section) => section.id === sectionId);
}

function getSortedHistory(history) {
  return history.slice().sort((a, b) => {
    if (a.date === b.date) return (a.createdAt || "").localeCompare(b.createdAt || "");
    return a.date.localeCompare(b.date);
  });
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

function countUniqueEntryPeople(entry) {
  return new Set(getAllPeopleFromEntry(entry)).size;
}

function getAllPeopleFromEntry(entry) {
  return SECTIONS.flatMap((section) =>
    section.roles.flatMap((role) => entry.sections?.[section.id]?.[role.id] || []),
  );
}

function getPersonName(personId, entry) {
  return entry.personSnapshot?.[personId] || personId;
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function showNotice(message, type = "success") {
  elements.notice.textContent = message;
  elements.notice.className = `notice ${type}`;
  elements.notice.hidden = false;

  window.clearTimeout(showNotice.timeoutId);
  showNotice.timeoutId = window.setTimeout(() => {
    elements.notice.hidden = true;
  }, 4200);
}
