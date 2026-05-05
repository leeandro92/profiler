const HISTORY_DB_NAME = "profilers-history-db";
const HISTORY_DB_VERSION = 1;
const HISTORY_STORE_NAME = "history";
const FIREBASE_SDK_VERSION = "12.12.1";

let firestoreClientPromise = null;

function openHistoryDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB no esta disponible en este navegador."));
      return;
    }

    const request = indexedDB.open(HISTORY_DB_NAME, HISTORY_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        const store = db.createObjectStore(HISTORY_STORE_NAME, { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveHistoryEntryToLocalDatabase(entry) {
  const safeEntry = normalizeHistoryEntry(entry);
  const db = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, "readwrite");
    transaction.objectStore(HISTORY_STORE_NAME).put(safeEntry);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function saveHistoryEntriesToLocalDatabase(entries) {
  const safeEntries = entries.map(normalizeHistoryEntry);
  const db = await openHistoryDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    safeEntries.forEach((entry) => store.put(entry));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getHistoryEntriesFromLocalDatabase() {
  const db = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, "readonly");
    const request = transaction.objectStore(HISTORY_STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getHistoryEntriesFromLocalDatabaseByDate(date) {
  const db = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, "readonly");
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    const request = store.index("date").getAll(date);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function clearLocalHistoryDatabase() {
  const db = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, "readwrite");
    transaction.objectStore(HISTORY_STORE_NAME).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function replaceHistoryEntriesInLocalDatabase(entries) {
  const safeEntries = entries.map(normalizeHistoryEntry);
  const db = await openHistoryDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HISTORY_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    store.clear();
    safeEntries.forEach((entry) => store.put(entry));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getFirestoreClient() {
  if (firestoreClientPromise) return firestoreClientPromise;

  firestoreClientPromise = createFirestoreClient().catch((error) => {
    console.warn("Firestore no esta disponible. Se usara la base local.", error);
    firestoreClientPromise = null;
    return null;
  });

  return firestoreClientPromise;
}

async function createFirestoreClient() {
  const settings = window.FirebaseAppConfig || {};
  if (!settings.enabled || !hasValidFirebaseConfig(settings.firebaseConfig)) return null;

  const [{ initializeApp, getApps }, firestore] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(settings.firebaseConfig);
  const db = firestore.getFirestore(app);

  return {
    db,
    collectionName: settings.historyCollection || "profilers_history",
    vacationsCollectionName: settings.vacationsCollection || "profilers_vacations",
    collection: firestore.collection,
    deleteDoc: firestore.deleteDoc,
    doc: firestore.doc,
    getDocs: firestore.getDocs,
    query: firestore.query,
    serverTimestamp: firestore.serverTimestamp,
    setDoc: firestore.setDoc,
    where: firestore.where,
    writeBatch: firestore.writeBatch,
  };
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

async function saveHistoryEntryToFirestore(entry) {
  const client = await getFirestoreClient();
  if (!client) return;

  const safeEntry = normalizeHistoryEntry(entry);
  await client.setDoc(
    client.doc(client.db, client.collectionName, safeEntry.id),
    {
      ...safeEntry,
      syncedAt: client.serverTimestamp(),
    },
    { merge: true },
  );
}

async function saveHistoryEntriesToFirestore(entries) {
  const client = await getFirestoreClient();
  if (!client || !entries.length) return;

  const safeEntries = entries.map(normalizeHistoryEntry);
  const chunks = chunkArray(safeEntries, 450);

  for (const chunk of chunks) {
    const batch = client.writeBatch(client.db);
    chunk.forEach((entry) => {
      batch.set(
        client.doc(client.db, client.collectionName, entry.id),
        {
          ...entry,
          syncedAt: client.serverTimestamp(),
        },
        { merge: true },
      );
    });
    await batch.commit();
  }
}

async function getHistoryEntriesFromFirestore() {
  const client = await getFirestoreClient();
  if (!client) return [];

  const snapshot = await client.getDocs(client.collection(client.db, client.collectionName));
  return snapshot.docs.map((item) => normalizeHistoryEntry(item.data()));
}

async function getHistoryEntriesFromFirestoreByDate(date) {
  const client = await getFirestoreClient();
  if (!client) return [];

  const historyQuery = client.query(
    client.collection(client.db, client.collectionName),
    client.where("date", "==", date),
  );
  const snapshot = await client.getDocs(historyQuery);
  return snapshot.docs.map((item) => normalizeHistoryEntry(item.data()));
}

async function clearFirestoreHistory() {
  const client = await getFirestoreClient();
  if (!client) return;

  const snapshot = await client.getDocs(client.collection(client.db, client.collectionName));
  const refs = snapshot.docs.map((item) => item.ref);
  const chunks = chunkArray(refs, 450);

  for (const chunk of chunks) {
    const batch = client.writeBatch(client.db);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function replaceHistoryEntriesInFirestore(entries) {
  await clearFirestoreHistory();
  await saveHistoryEntriesToFirestore(entries);
}

async function saveHistoryEntryToDatabase(entry) {
  const safeEntry = normalizeHistoryEntry(entry);
  const result = {
    firestore: false,
    local: false,
  };

  try {
    await saveHistoryEntryToFirestore(safeEntry);
    result.firestore = true;
  } catch (error) {
    console.warn("No se pudo guardar el historial en Firestore.", error);
    result.error = error;
  }

  return result;
}

async function saveHistoryEntriesToDatabase(entries) {
  const safeEntries = entries.map(normalizeHistoryEntry);
  const result = {
    firestore: false,
    local: false,
  };

  try {
    await saveHistoryEntriesToFirestore(safeEntries);
    result.firestore = true;
  } catch (error) {
    console.warn("No se pudo sincronizar el historial con Firestore.", error);
    result.error = error;
  }

  return result;
}

async function getHistoryEntriesFromDatabase() {
  try {
    return await getHistoryEntriesFromFirestore();
  } catch (error) {
    console.warn("No se pudo leer Firestore.", error);
    return [];
  }
}

async function getHistoryEntriesFromDatabaseByDate(date) {
  try {
    return await getHistoryEntriesFromFirestoreByDate(date);
  } catch (error) {
    console.warn("No se pudo buscar la fecha en Firestore.", error);
    return [];
  }
}

async function clearHistoryDatabase() {
  await clearLocalHistoryDatabase();

  try {
    await clearFirestoreHistory();
  } catch (error) {
    console.warn("No se pudo borrar el historial de Firestore.", error);
  }
}

async function replaceHistoryEntriesInDatabase(entries) {
  const safeEntries = entries.map(normalizeHistoryEntry);
  const result = {
    firestore: false,
    local: false,
  };

  try {
    await replaceHistoryEntriesInFirestore(safeEntries);
    result.firestore = true;
  } catch (error) {
    console.warn("No se pudo reemplazar el historial en Firestore.", error);
    result.error = error;
  }

  return result;
}

async function syncHistoryStorageToDatabase(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    const history = Array.isArray(saved?.history) ? saved.history : [];
    if (history.length) await saveHistoryEntriesToDatabase(history);
  } catch (error) {
    console.warn("No se pudo sincronizar el historial local con la base de datos.", error);
  }
}

async function saveVacationSummaryToFirestore(summary) {
  const client = await getFirestoreClient();
  if (!client) return { firestore: false };

  const safeSummary = normalizeVacationSummary(summary);
  await client.setDoc(
    client.doc(client.db, client.vacationsCollectionName, safeSummary.id),
    {
      ...safeSummary,
      syncedAt: client.serverTimestamp(),
    },
    { merge: true },
  );

  return { firestore: true };
}

async function saveVacationSummariesToFirestore(summaries) {
  const client = await getFirestoreClient();
  if (!client || !summaries.length) return { firestore: false };

  const safeSummaries = summaries.map(normalizeVacationSummary);
  const chunks = chunkArray(safeSummaries, 450);

  for (const chunk of chunks) {
    const batch = client.writeBatch(client.db);
    chunk.forEach((summary) => {
      batch.set(
        client.doc(client.db, client.vacationsCollectionName, summary.id),
        {
          ...summary,
          syncedAt: client.serverTimestamp(),
        },
        { merge: true },
      );
    });
    await batch.commit();
  }

  return { firestore: true };
}

async function getVacationSummariesFromFirestore() {
  const client = await getFirestoreClient();
  if (!client) return [];

  const snapshot = await client.getDocs(client.collection(client.db, client.vacationsCollectionName));
  return snapshot.docs.map((item) => normalizeVacationSummary(item.data()));
}

async function deleteVacationSummaryFromFirestore(summaryId) {
  const client = await getFirestoreClient();
  if (!client || !summaryId) return { firestore: false };

  await client.deleteDoc(client.doc(client.db, client.vacationsCollectionName, summaryId));
  return { firestore: true };
}

async function getVacationSummariesByPerson(searchValue) {
  const searchKey = normalizeSearchText(searchValue);
  if (!searchKey) return [];

  const summaries = await getVacationSummariesFromFirestore();
  return summaries
    .filter((summary) => summary.personKey.includes(searchKey))
    .sort((a, b) => {
      const startDiff = a.from.localeCompare(b.from);
      if (startDiff !== 0) return startDiff;
      const endDiff = a.to.localeCompare(b.to);
      if (endDiff !== 0) return endDiff;
      return a.person.localeCompare(b.person, "es");
    });
}

function normalizeHistoryEntry(entry) {
  const createdAt = entry?.createdAt || new Date().toISOString();
  return {
    ...entry,
    id: entry?.id || createDatabaseId(entry, createdAt),
    createdAt,
    updatedAt: entry?.updatedAt || createdAt,
  };
}

function normalizeVacationSummary(summary) {
  const createdAt = summary?.createdAt || new Date().toISOString();
  const person = summary?.person || "";
  const from = summary?.from || "";
  const to = summary?.to || from;
  const days = Number(summary?.days) || countVacationDays(from, to);

  return {
    ...summary,
    id: summary?.id || createDatabaseId({ date: from, person, to }, createdAt),
    person,
    personKey: normalizeSearchText(person),
    from,
    to,
    days,
    createdAt,
    updatedAt: summary?.updatedAt || createdAt,
    type: "vacation-summary",
  };
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function countVacationDays(from, to) {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

function mergeHistoryEntries(...entryLists) {
  const entriesByDate = new Map();

  entryLists.flat().forEach((entry) => {
    if (!entry?.date) return;
    const safeEntry = normalizeHistoryEntry(entry);
    const current = entriesByDate.get(safeEntry.date);
    if (!current || new Date(safeEntry.updatedAt || safeEntry.createdAt) >= new Date(current.updatedAt || current.createdAt)) {
      entriesByDate.set(safeEntry.date, safeEntry);
    }
  });

  return [...entriesByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function createDatabaseId(entry, createdAt) {
  const date = entry?.date || "sin-fecha";
  return `legacy-${date}-${hashString(`${createdAt}-${JSON.stringify(entry || {})}`)}`;
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

window.HistoryDatabase = {
  clear: clearHistoryDatabase,
  getAll: getHistoryEntriesFromDatabase,
  getByDate: getHistoryEntriesFromDatabaseByDate,
  replaceAll: replaceHistoryEntriesInDatabase,
  save: saveHistoryEntryToDatabase,
  saveMany: saveHistoryEntriesToDatabase,
  syncFromLocalStorage: syncHistoryStorageToDatabase,
};

window.VacationDatabase = {
  delete: deleteVacationSummaryFromFirestore,
  getAll: getVacationSummariesFromFirestore,
  getByPerson: getVacationSummariesByPerson,
  save: saveVacationSummaryToFirestore,
  saveMany: saveVacationSummariesToFirestore,
};
