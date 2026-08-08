const supabaseSettings = window.ENGLISH_FOR_KIDS_SUPABASE || {};

function normalizeSupabaseUrl(url) {
  return (url || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

supabaseSettings.url = normalizeSupabaseUrl(supabaseSettings.url);
const hasSupabaseConfig = Boolean(supabaseSettings.url && supabaseSettings.anonKey);
const supabaseClient =
  hasSupabaseConfig && window.supabase
    ? window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "english-for-kids-auth",
        },
      })
    : null;

function readStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function readStoredNumber(key, fallback = 0) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

const state = {
  words: [],
  filtered: [],
  categories: [],
  category: "All",
  currentIndex: 0,
  session: null,
  profile: null,
  role: "guest",
  learned: new Set(),
  studySeconds: 0,
  studyTimer: null,
  quotaLocked: false,
  lastViewedWordId: "",
  lastViewedDay: "",
  dragStartX: 0,
  dragCurrentX: 0,
  dragStartedOnSpeak: false,
  isDragging: false,
  suppressNextSpeakClick: false,
  lastSpokenAt: 0,
  lastSpokenWord: "",
  voices: [],
  speech: {
    rate: 0.65,
    volume: 1,
    voiceURI: "",
  },
  roleLimits: {
    guest: 15,
    free: 100,
    paid: 0,
    admin: 0,
  },
  users: [],
  editWordId: "",
  adminTab: "voice",
  adminWordQuery: "",
  adminWordCategory: "All",
  editCrop: null,
  newCrop: null,
  adminMode: false,
  passwordResetMode: false,
};

const el = {
  search: document.querySelector("#searchInput"),
  category: document.querySelector("#categorySelect"),
  flashCard: document.querySelector("#flashCard"),
  imageFrame: document.querySelector("#imageFrame"),
  wordText: document.querySelector("#wordText"),
  wordMeaning: document.querySelector("#wordMeaning"),
  wordCategory: document.querySelector("#wordCategory"),
  positionText: document.querySelector("#positionText"),
  totalWords: document.querySelector("#totalWords"),
  speakArea: document.querySelector("#speakArea"),
  speechHint: document.querySelector("#speechHint"),
  random: document.querySelector("#randomBtn"),
  next: document.querySelector("#nextBtn"),
  prev: document.querySelector("#prevBtn"),
  learnControls: document.querySelector("#learnControls"),
  cardStage: document.querySelector("#cardStage"),
  statsToggle: document.querySelector("#statsToggleBtn"),
  statsPanel: document.querySelector("#statsPanel"),
  statsLearnedCount: document.querySelector("#statsLearnedCount"),
  statsTotalWords: document.querySelector("#statsTotalWords"),
  statsStudyTime: document.querySelector("#statsStudyTime"),
  statsPie: document.querySelector("#statsPie"),
  statsLegend: document.querySelector("#statsLegend"),
  statsEmpty: document.querySelector("#statsEmpty"),
  donateToggle: document.querySelector("#donateToggleBtn"),
  donatePanel: document.querySelector("#donatePanel"),
  donateCard: document.querySelector("#donateCard"),
  donateClose: document.querySelector("#donateCloseBtn"),
  authToggle: document.querySelector("#authToggleBtn"),
  adminToggle: document.querySelector("#adminToggleBtn"),
  authPanel: document.querySelector("#authPanel"),
  signedOutAuth: document.querySelector("#signedOutAuth"),
  signedInAuth: document.querySelector("#signedInAuth"),
  passwordResetAuth: document.querySelector("#passwordResetAuth"),
  email: document.querySelector("#emailInput"),
  password: document.querySelector("#passwordInput"),
  rememberSession: document.querySelector("#rememberSessionInput"),
  newPassword: document.querySelector("#newPasswordInput"),
  confirmPassword: document.querySelector("#confirmPasswordInput"),
  login: document.querySelector("#loginBtn"),
  signup: document.querySelector("#signupBtn"),
  google: document.querySelector("#googleBtn"),
  forgotPassword: document.querySelector("#forgotPasswordBtn"),
  updatePassword: document.querySelector("#updatePasswordBtn"),
  backToLogin: document.querySelector("#backToLoginBtn"),
  logout: document.querySelector("#logoutBtn"),
  authStatus: document.querySelector("#authStatus"),
  userEmail: document.querySelector("#userEmailText"),
  roleBadge: document.querySelector("#roleBadge"),
  accessNote: document.querySelector("#accessNote"),
  adminTools: document.querySelector("#adminTools"),
  adminClose: document.querySelector("#adminCloseBtn"),
  adminPanel: document.querySelector("#adminPanel"),
  adminTabs: document.querySelector("#adminTabs"),
  adminTabVoice: document.querySelector("#adminTabVoice"),
  adminTabWords: document.querySelector("#adminTabWords"),
  adminTabAdd: document.querySelector("#adminTabAdd"),
  adminTabUsers: document.querySelector("#adminTabUsers"),
  adminWordSearch: document.querySelector("#adminWordSearchInput"),
  adminWordCategory: document.querySelector("#adminWordCategorySelect"),
  editNormalPanel: document.querySelector("#editNormalPanel"),
  adminWordList: document.querySelector("#adminWordList"),
  editCropEditor: document.querySelector("#editCropEditor"),
  editCropFrame: document.querySelector("#editCropFrame"),
  editCropImage: document.querySelector("#editCropImage"),
  editCropZoom: document.querySelector("#editCropZoomInput"),
  saveEditCrop: document.querySelector("#saveEditCropBtn"),
  cancelEditCrop: document.querySelector("#cancelEditCropBtn"),
  adminSelectedPreview: document.querySelector("#adminSelectedPreview"),
  editWord: document.querySelector("#editWordInput"),
  editCategory: document.querySelector("#editCategoryInput"),
  editMeaning: document.querySelector("#editMeaningInput"),
  editEmoji: document.querySelector("#editEmojiInput"),
  editColor: document.querySelector("#editColorInput"),
  imageUrl: document.querySelector("#imageUrlInput"),
  saveWord: document.querySelector("#saveWordBtn"),
  saveImageUrl: document.querySelector("#saveImageUrlBtn"),
  imageFile: document.querySelector("#imageFileInput"),
  deleteWord: document.querySelector("#deleteWordBtn"),
  googleImage: document.querySelector("#googleImageLink"),
  imageStatus: document.querySelector("#imageStatus"),
  newWord: document.querySelector("#newWordInput"),
  newCategorySelect: document.querySelector("#newCategorySelect"),
  newCategory: document.querySelector("#newCategoryInput"),
  newMeaning: document.querySelector("#newMeaningInput"),
  newEmoji: document.querySelector("#newEmojiInput"),
  newColor: document.querySelector("#newColorInput"),
  newImageUrl: document.querySelector("#newImageUrlInput"),
  newImageFile: document.querySelector("#newImageFileInput"),
  newImagePreview: document.querySelector("#newImagePreview"),
  newCropEditor: document.querySelector("#newCropEditor"),
  newCropFrame: document.querySelector("#newCropFrame"),
  newCropImage: document.querySelector("#newCropImage"),
  newCropZoom: document.querySelector("#newCropZoomInput"),
  addWord: document.querySelector("#addWordBtn"),
  speechRate: document.querySelector("#speechRateInput"),
  speechVolume: document.querySelector("#speechVolumeInput"),
  speechVoice: document.querySelector("#speechVoiceSelect"),
  speechRateValue: document.querySelector("#speechRateValue"),
  speechVolumeValue: document.querySelector("#speechVolumeValue"),
  saveSpeechSettings: document.querySelector("#saveSpeechSettingsBtn"),
  userSearch: document.querySelector("#userSearchInput"),
  refreshUsers: document.querySelector("#refreshUsersBtn"),
  usersList: document.querySelector("#usersList"),
  usersStatus: document.querySelector("#usersStatus"),
  limitGuest: document.querySelector("#limitGuestInput"),
  limitFree: document.querySelector("#limitFreeInput"),
  limitPaid: document.querySelector("#limitPaidInput"),
  saveRoleLimits: document.querySelector("#saveRoleLimitsBtn"),
  toast: document.querySelector("#toastNotification"),
};

function isAdmin() {
  return state.role === "admin";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let toastTimer = null;
let toastHideTimer = null;

function showToast(message, type = "info") {
  if (!el.toast || !message) return;
  window.clearTimeout(toastTimer);
  window.clearTimeout(toastHideTimer);
  el.toast.textContent = message;
  el.toast.className = `toast-notification ${type} show`;
  el.toast.classList.remove("hidden");
  toastTimer = window.setTimeout(() => {
    el.toast.classList.remove("show");
    toastHideTimer = window.setTimeout(() => el.toast.classList.add("hidden"), 180);
  }, 5000);
}

function loadRememberedAuth() {
  const rememberedEmail = localStorage.getItem("rememberedEmail") || "";
  const rememberDevice = localStorage.getItem("rememberDevice");
  el.rememberSession.checked = rememberDevice !== "false";
  if (rememberedEmail) el.email.value = rememberedEmail;
}

function saveRememberedAuth(email) {
  if (el.rememberSession.checked) {
    localStorage.setItem("rememberDevice", "true");
    localStorage.setItem("rememberedEmail", email);
    return;
  }
  localStorage.setItem("rememberDevice", "false");
  localStorage.removeItem("rememberedEmail");
}

function currentEditableWord() {
  return state.words.find((word) => word.id === state.editWordId) || currentWord();
}

function roleLimitLabel(role) {
  const limit = Number(state.roleLimits[role] ?? 0);
  return limit > 0 ? `${limit} daily views` : "unlimited views";
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function viewerKey() {
  return state.session?.user?.id || "guest";
}

function dailyViewsKey() {
  return `dailyViews:${viewerKey()}:${todayKey()}`;
}

function scopedStorageKey(name) {
  return `${name}:${viewerKey()}`;
}

function migrateLegacyStudyData() {
  const key = viewerKey();
  if (key === "guest" || localStorage.getItem(`studyDataMigrated:${key}`) === "true") return;

  if (!localStorage.getItem(scopedStorageKey("learnedWords")) && localStorage.getItem("learnedWords")) {
    localStorage.setItem(scopedStorageKey("learnedWords"), localStorage.getItem("learnedWords"));
  }
  if (!localStorage.getItem(scopedStorageKey("studySeconds")) && localStorage.getItem("studySeconds")) {
    localStorage.setItem(scopedStorageKey("studySeconds"), localStorage.getItem("studySeconds"));
  }
  if (!localStorage.getItem(scopedStorageKey("studyProgress")) && localStorage.getItem("studyProgress")) {
    localStorage.setItem(scopedStorageKey("studyProgress"), localStorage.getItem("studyProgress"));
  }

  localStorage.setItem(`studyDataMigrated:${key}`, "true");
}

function loadStudyDataForViewer() {
  migrateLegacyStudyData();
  state.learned = new Set(readStoredJson(scopedStorageKey("learnedWords"), []));
  state.studySeconds = readStoredNumber(scopedStorageKey("studySeconds"), 0);
  state.lastViewedWordId = "";
  state.lastViewedDay = "";
  state.quotaLocked = isDailyQuotaLocked();
  renderStats();
}

function dailyViewLimit() {
  const limit = Number(state.roleLimits[state.role] ?? 0);
  return Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
}

function dailyViewsUsed() {
  return readStoredNumber(dailyViewsKey(), 0);
}

function dailyViewsRemaining() {
  const limit = dailyViewLimit();
  if (limit <= 0) return Infinity;
  return Math.max(0, limit - dailyViewsUsed());
}

function isDailyQuotaLocked() {
  const limit = dailyViewLimit();
  return limit > 0 && dailyViewsUsed() >= limit;
}

function recordDailyView(item) {
  const limit = dailyViewLimit();
  const day = todayKey();
  state.quotaLocked = false;
  if (item?.id && state.lastViewedWordId === item.id && state.lastViewedDay === day) return true;
  if (limit <= 0 || state.adminMode) return true;
  const used = dailyViewsUsed();
  if (used >= limit) {
    state.quotaLocked = true;
    return false;
  }
  localStorage.setItem(dailyViewsKey(), String(used + 1));
  state.lastViewedWordId = item?.id || "";
  state.lastViewedDay = day;
  updateAccessUi();
  return true;
}

function renderDailyQuotaLock() {
  state.quotaLocked = true;
  el.wordText.textContent = "Daily limit reached";
  el.wordMeaning.textContent = "";
  el.wordCategory.textContent = "Come back tomorrow";
  el.positionText.textContent = dailyViewsUsed();
  el.totalWords.textContent = dailyViewLimit();
  el.imageFrame.innerHTML = `<div class="grid h-full w-full place-items-center bg-yellow-100 text-7xl">🔒</div>`;
  el.speechHint.textContent = state.session ? "Ask admin to upgrade your account." : "Log in to unlock more daily views.";
}

function saveLearned() {
  localStorage.setItem(scopedStorageKey("learnedWords"), JSON.stringify([...state.learned]));
}

function saveStudySeconds() {
  localStorage.setItem(scopedStorageKey("studySeconds"), String(Math.max(0, Math.floor(state.studySeconds))));
}

function readStudyProgress() {
  return readStoredJson(scopedStorageKey("studyProgress"), {});
}

function saveStudyProgress(item) {
  if (!item?.id) return;
  localStorage.setItem(
    scopedStorageKey("studyProgress"),
    JSON.stringify({
      wordId: item.id,
      category: state.category,
      query: el.search?.value || "",
      updatedAt: new Date().toISOString(),
    }),
  );
}

function formatStudyDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function learnedWordItems() {
  return state.words.filter((item) => state.learned.has(item.id) || state.learned.has(item.word));
}

function learnedCategoryStats() {
  const counts = new Map();
  learnedWordItems().forEach((item) => {
    counts.set(item.category, (counts.get(item.category) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));
}

function renderStats() {
  if (!el.statsPanel) return;
  const learnedItems = learnedWordItems();
  const categoryStats = learnedCategoryStats();
  const totalLearned = learnedItems.length;
  const chartColors = ["#ec4899", "#0ea5e9", "#84cc16", "#f59e0b", "#8b5cf6", "#14b8a6", "#f43f5e", "#6366f1"];

  el.statsLearnedCount.textContent = totalLearned;
  el.statsTotalWords.textContent = state.words.length;
  el.statsStudyTime.textContent = formatStudyDuration(state.studySeconds);
  el.statsEmpty.classList.toggle("hidden", totalLearned > 0);

  if (!totalLearned) {
    el.statsPie.style.background = "#e0f2fe";
    el.statsLegend.innerHTML = `<p class="text-sm font-black text-slate-500">No categories yet.</p>`;
    return;
  }

  let start = 0;
  const segments = categoryStats.map((item, index) => {
    const end = start + (item.count / totalLearned) * 360;
    const segment = `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`;
    start = end;
    return segment;
  });
  el.statsPie.style.background = `conic-gradient(${segments.join(", ")})`;
  el.statsLegend.innerHTML = categoryStats
    .map((item, index) => {
      const color = chartColors[index % chartColors.length];
      return `
        <div class="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2">
          <span class="flex min-w-0 items-center gap-2">
            <span class="h-3 w-3 shrink-0 rounded-full" style="background:${color}"></span>
            <span class="truncate text-sm font-black">${escapeHtml(item.category)}</span>
          </span>
          <span class="text-sm font-black text-slate-500">${item.count}</span>
        </div>
      `;
    })
    .join("");
}

function markLearned(item) {
  if (!item) return;
  if (state.learned.has(item.id) || state.learned.has(item.word)) return;
  state.learned.add(item.id || item.word);
  saveLearned();
  renderStats();
}

function isStudyTimerActive() {
  return !document.hidden && !state.adminMode && !el.cardStage.classList.contains("hidden");
}

function startStudyTimer() {
  if (state.studyTimer) return;
  state.studyTimer = window.setInterval(() => {
    if (!isStudyTimerActive()) return;
    state.studySeconds += 1;
    saveStudySeconds();
    if (!el.statsPanel.classList.contains("hidden")) renderStats();
  }, 1000);
  window.addEventListener("pagehide", saveStudySeconds);
  document.addEventListener("visibilitychange", saveStudySeconds);
}

function refreshVoices() {
  if (!("speechSynthesis" in window)) return;
  state.voices = window.speechSynthesis.getVoices();
  renderVoiceOptions();
}

function englishVoice() {
  const selected = state.voices.find((voice) => voice.voiceURI === state.speech.voiceURI);
  if (selected) return selected;
  return (
    state.voices.find((voice) => voice.lang === "en-US") ||
    state.voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
    null
  );
}

function renderVoiceOptions() {
  if (!el.speechVoice) return;
  const englishVoices = state.voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const voices = englishVoices.length ? englishVoices : state.voices;
  el.speechVoice.innerHTML = [
    `<option value="">Auto English Voice</option>`,
    ...voices.map((voice) => {
      const label = `${voice.name} (${voice.lang})`;
      return `<option value="${escapeHtml(voice.voiceURI)}">${escapeHtml(label)}</option>`;
    }),
  ].join("");
  el.speechVoice.value = state.speech.voiceURI || "";
}

function speak(wordOrItem) {
  if (state.quotaLocked) {
    showToast("Daily view limit reached. Come back tomorrow.", "info");
    return;
  }

  const item = typeof wordOrItem === "object" ? wordOrItem : state.words.find((entry) => entry.word === wordOrItem) || currentWord();
  const word = item?.word || String(wordOrItem || "");
  if (!word) return;

  if (!("speechSynthesis" in window)) {
    el.speechHint.textContent = "Speech is not supported in this browser.";
    return;
  }

  const now = Date.now();
  if (state.lastSpokenWord === word && now - state.lastSpokenAt < 300) return;
  state.lastSpokenWord = word;
  state.lastSpokenAt = now;

  refreshVoices();
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = state.speech.rate;
  utterance.pitch = 1.08;
  utterance.volume = state.speech.volume;
  const voice = englishVoice();
  if (voice) utterance.voice = voice;
  utterance.onstart = () => {
    el.speechHint.textContent = "Speaking...";
  };
  utterance.onend = () => {
    el.speechHint.textContent = "Tap card to listen";
  };
  utterance.onerror = () => {
    el.speechHint.textContent = "Could not play audio. Tap the card and try again.";
  };
  window.speechSynthesis.speak(utterance);
  markLearned(item);
}

function currentWord() {
  return state.filtered[state.currentIndex] || state.words[0];
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fromSupabaseRow(row) {
  return {
    id: row.id,
    word: row.word,
    category: row.category,
    emoji: row.emoji || "⭐",
    meaning: row.meaning || "",
    color: row.color || "#ffd166",
    imageUrl: row.image_url || "",
    sortOrder: row.sort_order || 0,
  };
}

function toSupabasePayload(item) {
  return {
    id: item.id,
    word: item.word,
    category: item.category,
    emoji: item.emoji || "⭐",
    meaning: item.meaning || "",
    color: item.color || "#ffd166",
    image_url: item.imageUrl || "",
    sort_order: item.sortOrder || 0,
    updated_at: new Date().toISOString(),
  };
}

function imageMarkup(item) {
  if (item.imageUrl) {
    return `<img class="h-full w-full object-cover" src="${item.imageUrl}" alt="${item.word}" />`;
  }
  return `<div class="word-picture grid h-full w-full place-items-center text-8xl sm:text-9xl" style="--card-color: ${item.color}">${item.emoji}</div>`;
}

function updateGoogleLink(item) {
  const query = encodeURIComponent(`${item.word} picture for kids`);
  el.googleImage.href = `https://www.google.com/search?tbm=isch&q=${query}`;
}

function fillAdminFields(item) {
  if (!item) return;
  state.editWordId = item.id;
  el.editWord.value = item.word;
  el.editCategory.value = item.category;
  el.editMeaning.value = item.meaning;
  el.editEmoji.value = item.emoji || "⭐";
  el.editColor.value = item.color || "#ffd166";
  el.imageUrl.value = item.imageUrl || "";
  renderAdminSelectedPreview();
}

function selectWordByIndex(index, shouldSpeak = true, countView = shouldSpeak) {
  if (!state.filtered.length) return;

  const nextIndex = (index + state.filtered.length) % state.filtered.length;
  const item = state.filtered[nextIndex];
  if (countView && !recordDailyView(item)) {
    renderDailyQuotaLock();
    return;
  }
  if (!countView && isDailyQuotaLocked()) {
    renderDailyQuotaLock();
    return;
  }
  state.quotaLocked = false;

  state.currentIndex = nextIndex;
  el.wordText.textContent = item.word;
  el.wordMeaning.textContent = item.meaning;
  el.wordCategory.textContent = item.category;
  el.positionText.textContent = state.currentIndex + 1;
  el.totalWords.textContent = state.filtered.length;
  el.imageFrame.innerHTML = imageMarkup(item);
  el.imageFrame.style.setProperty("--card-color", item.color);
  updateGoogleLink(item);
  fillAdminFields(item);
  saveStudyProgress(item);

  el.speakArea.classList.remove("swipe-left", "swipe-right");
  if (shouldSpeak) speak(item);
}

function applySpeechControls() {
  el.speechRate.value = state.speech.rate;
  el.speechVolume.value = state.speech.volume;
  if (el.speechVoice) el.speechVoice.value = state.speech.voiceURI || "";
  el.speechRateValue.textContent = `${Number(state.speech.rate).toFixed(2)}x`;
  el.speechVolumeValue.textContent = `${Math.round(Number(state.speech.volume) * 100)}%`;
}

function sortedCategories(words) {
  return [...new Set(words.map((item) => item.category))].sort();
}

function renderCategories() {
  const categoryOptions = state.categories
    .map((category) => {
      return `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
    })
    .join("");
  const options = `<option value="All">All</option>${categoryOptions}`;
  el.category.innerHTML = options;
  el.category.value = state.category;
  if (el.adminWordCategory) {
    el.adminWordCategory.innerHTML = options;
    el.adminWordCategory.value = state.adminWordCategory;
  }
  if (el.editCategory) {
    el.editCategory.innerHTML = categoryOptions;
  }
  if (el.newCategorySelect) {
    el.newCategorySelect.innerHTML = categoryOptions || `<option value="Common Words">Common Words</option>`;
  }
}

function setAdminTab(tab) {
  state.adminTab = tab;
  el.adminTabs.querySelectorAll("[data-admin-tab]").forEach((button) => {
    const isActive = button.dataset.adminTab === tab;
    button.classList.toggle("active", isActive);
  });
  el.adminTabVoice.classList.toggle("hidden", tab !== "voice");
  el.adminTabWords.classList.toggle("hidden", tab !== "words");
  el.adminTabAdd.classList.toggle("hidden", tab !== "add");
  el.adminTabUsers.classList.toggle("hidden", tab !== "users");
  if (tab === "words") renderAdminWordList();
  if (tab === "users") loadUsers();
}

function adminWordMatches(item) {
  const query = state.adminWordQuery.trim().toLowerCase();
  const matchesCategory = state.adminWordCategory === "All" || item.category === state.adminWordCategory;
  const matchesQuery =
    !query ||
    item.word.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query) ||
    item.meaning.toLowerCase().includes(query);
  return matchesCategory && matchesQuery;
}

function renderAdminImage(item) {
  if (item.imageUrl) {
    return `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.word)}" />`;
  }
  return `<span>${escapeHtml(item.emoji || "⭐")}</span>`;
}

function renderAdminSelectedPreview() {
  if (!el.adminSelectedPreview) return;
  const item = currentEditableWord();
  if (!item) {
    el.adminSelectedPreview.innerHTML = `<p class="text-sm font-black text-slate-500">Select a word to edit.</p>`;
    return;
  }
  el.adminSelectedPreview.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="admin-preview-image grid aspect-square w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-4xl shadow">
        ${renderAdminImage(item)}
      </div>
      <div class="min-w-0">
        <p class="truncate text-xl font-black">${escapeHtml(item.word)}</p>
        <p class="truncate text-sm font-extrabold text-slate-500">${escapeHtml(item.category)}</p>
      </div>
    </div>
  `;
}

function renderNewImagePreview(src = "") {
  if (!el.newImagePreview) return;
  const imageUrl = src || el.newImageUrl.value.trim();
  if (!imageUrl) {
    el.newImagePreview.innerHTML = `<span>Image preview</span>`;
    return;
  }
  el.newImagePreview.innerHTML = `<img src="${escapeHtml(imageUrl)}" alt="New word preview" />`;
}

function cropElements(kind) {
  return kind === "edit"
    ? {
        key: "editCrop",
        editor: el.editCropEditor,
        frame: el.editCropFrame,
        image: el.editCropImage,
        zoom: el.editCropZoom,
      }
    : {
        key: "newCrop",
        editor: el.newCropEditor,
        frame: el.newCropFrame,
        image: el.newCropImage,
        zoom: el.newCropZoom,
      };
}

function updateCropView(kind) {
  const parts = cropElements(kind);
  const crop = state[parts.key];
  if (!crop) return;
  const frameSize = parts.frame.getBoundingClientRect().width || 260;
  const baseScale = Math.min(frameSize / crop.image.naturalWidth, frameSize / crop.image.naturalHeight);
  const displayWidth = crop.image.naturalWidth * baseScale;
  const displayHeight = crop.image.naturalHeight * baseScale;
  parts.image.style.width = `${displayWidth}px`;
  parts.image.style.height = `${displayHeight}px`;
  parts.image.style.transform = `translate(calc(-50% + ${crop.offsetX}px), calc(-50% + ${crop.offsetY}px)) scale(${crop.zoom})`;
  parts.zoom.value = crop.zoom;
}

function clearCrop(kind) {
  const parts = cropElements(kind);
  const crop = state[parts.key];
  if (crop?.objectUrl) URL.revokeObjectURL(crop.objectUrl);
  state[parts.key] = null;
  parts.editor.classList.add("hidden");
  parts.image.removeAttribute("src");
  if (kind === "edit") {
    el.editNormalPanel.classList.remove("hidden");
  } else {
    el.newImagePreview.classList.remove("hidden");
  }
}

function startCrop(kind, file) {
  clearCrop(kind);
  const parts = cropElements(kind);
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  const crop = {
    file,
    objectUrl,
    image,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    dragX: 0,
    dragY: 0,
    dragging: false,
    ready: null,
  };
  crop.ready = new Promise((resolve, reject) => {
    image.onload = () => {
      updateCropView(kind);
      resolve();
    };
    image.onerror = reject;
  });
  state[parts.key] = crop;
  image.src = objectUrl;
  parts.image.src = objectUrl;
  parts.zoom.value = 1;
  parts.editor.classList.remove("hidden");
  if (kind === "edit") {
    el.editNormalPanel.classList.add("hidden");
  } else {
    el.newImagePreview.classList.add("hidden");
  }
  updateCropView(kind);
}

async function cropToSquareFile(kind) {
  const parts = cropElements(kind);
  const crop = state[parts.key];
  if (!crop) return null;
  await crop.ready;
  const size = 700;
  const rect = parts.frame.getBoundingClientRect();
  const offsetScale = size / Math.max(1, rect.width);
  const fitScale = Math.min(size / crop.image.naturalWidth, size / crop.image.naturalHeight);
  const scale = fitScale * crop.zoom;
  const drawWidth = crop.image.naturalWidth * scale;
  const drawHeight = crop.image.naturalHeight * scale;
  const drawX = (size - drawWidth) / 2 + crop.offsetX * offsetScale;
  const drawY = (size - drawHeight) / 2 + crop.offsetY * offsetScale;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.drawImage(crop.image, drawX, drawY, drawWidth, drawHeight);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Cannot crop image"));
          return;
        }
        resolve(new File([blob], "word-image.webp", { type: "image/webp" }));
      },
      "image/webp",
      0.9,
    );
  });
}

function selectAdminWord(id) {
  const item = state.words.find((word) => word.id === id);
  if (!item) return;
  fillAdminFields(item);
  updateGoogleLink(item);
  renderAdminWordList();
}

function renderAdminWordList() {
  if (!el.adminWordList) return;
  const matches = state.words.filter(adminWordMatches);
  const visible = matches;
  if (!visible.length) {
    el.adminWordList.innerHTML = `<p class="rounded-2xl bg-yellow-50 p-4 text-center text-sm font-black text-slate-500">No words found.</p>`;
    renderAdminSelectedPreview();
    return;
  }
  if (!matches.some((item) => item.id === currentEditableWord()?.id)) {
    fillAdminFields(visible[0]);
  }
  el.adminWordList.innerHTML = visible
    .map((item) => {
      const active = item.id === currentEditableWord()?.id;
      return `
        <button class="admin-word-row ${active ? "active" : ""} flex items-center gap-3 rounded-2xl p-2 text-left active:scale-[0.99]" data-word-id="${escapeHtml(item.id)}">
          <span class="admin-word-thumb grid aspect-square w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-2xl shadow">
            ${renderAdminImage(item)}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-black">${escapeHtml(item.word)}</span>
            <span class="block truncate text-xs font-extrabold text-slate-500">${escapeHtml(item.category)}</span>
          </span>
        </button>
      `;
    })
    .join("");
  renderAdminSelectedPreview();
}

function applyFilter(preferredWordId = "") {
  const query = el.search.value.trim().toLowerCase();
  state.filtered = state.words.filter((item) => {
    const matchesCategory = state.category === "All" || item.category === state.category;
    const matchesQuery = !query || item.word.includes(query) || item.category.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  if (!state.filtered.length) {
    el.wordText.textContent = "No words";
    el.wordMeaning.textContent = "No matching words";
    el.imageFrame.innerHTML = `<div class="grid h-full w-full place-items-center text-7xl">?</div>`;
    el.positionText.textContent = "0";
    el.totalWords.textContent = "0";
    return;
  }

  const preferredIndex = preferredWordId ? state.filtered.findIndex((item) => item.id === preferredWordId) : -1;
  selectWordByIndex(preferredIndex >= 0 ? preferredIndex : 0, false);
}

function setAdminMode(enabled) {
  state.adminMode = Boolean(enabled && isAdmin());
  el.adminTools.classList.toggle("hidden", !state.adminMode);
  el.learnControls.classList.toggle("hidden", state.adminMode);
  el.cardStage.classList.toggle("hidden", state.adminMode);
  el.adminToggle.textContent = state.adminMode ? "Study" : "Control Board";
  if (state.adminMode) {
    el.authPanel.classList.add("hidden");
    el.accessNote.classList.add("hidden");
    setAdminTab(state.adminTab);
  }
}

function updateAccessUi() {
  const labels = {
    guest: "Guest",
    free: "Free",
    paid: "Paid",
    admin: "Admin",
  };
  el.roleBadge.textContent = labels[state.role] || "Guest";
  el.authToggle.textContent = state.session ? "Account" : "Login";
  el.passwordResetAuth.classList.toggle("hidden", !state.passwordResetMode);
  el.signedOutAuth.classList.toggle("hidden", state.passwordResetMode || Boolean(state.session));
  el.signedInAuth.classList.toggle("hidden", state.passwordResetMode || !state.session);
  el.userEmail.textContent = state.session?.user?.email || "";
  el.adminToggle.classList.toggle("hidden", !isAdmin());
  if (!isAdmin()) state.adminMode = false;
  setAdminMode(state.adminMode);
  if (state.adminMode) return;

  if (state.role === "guest") {
    el.accessNote.classList.remove("hidden");
    const remaining = dailyViewsRemaining();
    el.accessNote.textContent =
      remaining === Infinity
        ? `Trial mode: ${roleLimitLabel("guest")}.`
        : `Trial mode: ${remaining}/${dailyViewLimit()} views left today. Log in for ${roleLimitLabel("free")}.`;
  } else if (state.role === "free") {
    el.accessNote.classList.remove("hidden");
    const remaining = dailyViewsRemaining();
    el.accessNote.textContent =
      remaining === Infinity
        ? `Free account: ${roleLimitLabel("free")}.`
        : `Free account: ${remaining}/${dailyViewLimit()} views left today. Admin can upgrade users in Control Board.`;
  } else if (state.role === "paid") {
    el.accessNote.classList.add("hidden");
    el.accessNote.textContent = `Paid account: ${roleLimitLabel("paid")} unlocked.`;
  } else {
    el.accessNote.classList.add("hidden");
    el.accessNote.textContent = "";
  }
}

async function refreshProfile() {
  state.profile = null;
  state.role = state.session ? "free" : "guest";

  if (!supabaseClient || !state.session?.user) {
    updateAccessUi();
    return;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, email, role")
    .eq("id", state.session.user.id)
    .maybeSingle();

  if (!error && data) {
    state.profile = data;
    state.role = data.role || "free";
  }

  updateAccessUi();
}

async function loadWordsFromSupabase() {
  const { data, error } = await supabaseClient
    .from(supabaseSettings.table || "words")
    .select("id, word, category, emoji, meaning, color, image_url, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data.map(fromSupabaseRow);
}

function mergeWordsById(baseWords, overrideWords) {
  const overrides = new Map(overrideWords.map((item) => [item.id, item]));
  const merged = baseWords.map((item) => ({ ...item, ...(overrides.get(item.id) || {}) }));
  const baseIds = new Set(baseWords.map((item) => item.id));
  overrideWords.forEach((item) => {
    if (!baseIds.has(item.id)) merged.push(item);
  });
  return merged.sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0));
}

async function loadWordsFromStaticJson() {
  const response = await fetch("data/words.json");
  if (!response.ok) throw new Error("Cannot load static words.json");
  const data = await response.json();
  return data.words;
}

async function loadWordsFromLocalApi() {
  const response = await fetch("/api/words");
  if (!response.ok) throw new Error("Cannot load local API words");
  const data = await response.json();
  return data.words;
}

async function loadWords() {
  if (supabaseClient) {
    try {
      const supabaseWords = await loadWordsFromSupabase();
      const staticWords = await loadWordsFromStaticJson();
      if (supabaseWords.length < staticWords.length) {
        console.warn("Supabase returned a limited word list. Merging with local static words until RLS is migrated.");
        return mergeWordsById(staticWords, supabaseWords);
      }
      return supabaseWords;
    } catch (error) {
      console.warn("Supabase load failed, falling back to local data.", error);
    }
  }

  try {
    return await loadWordsFromStaticJson();
  } catch (error) {
    return loadWordsFromLocalApi();
  }
}

function readLocalSpeechSettings() {
  try {
    return JSON.parse(localStorage.getItem("speechSettings") || "{}");
  } catch {
    return {};
  }
}

function applySpeechSettings(value) {
  const rate = Number(value?.rate);
  const volume = Number(value?.volume);
  state.speech = {
    rate: Number.isFinite(rate) ? Math.min(1.05, Math.max(0.45, rate)) : 0.65,
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0.2, volume)) : 1,
    voiceURI: typeof value?.voiceURI === "string" ? value.voiceURI : "",
  };
  applySpeechControls();
}

function normalizeRoleLimit(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function applyRoleLimits(value = {}) {
  state.roleLimits = {
    guest: normalizeRoleLimit(value.guest, 15),
    free: normalizeRoleLimit(value.free, 100),
    paid: normalizeRoleLimit(value.paid, 0),
    admin: normalizeRoleLimit(value.admin, 0),
  };
  el.limitGuest.value = state.roleLimits.guest;
  el.limitFree.value = state.roleLimits.free;
  el.limitPaid.value = state.roleLimits.paid;
}

async function loadSpeechSettings() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("app_settings")
        .select("value")
        .eq("key", "speech")
        .maybeSingle();
      if (error) throw error;
      applySpeechSettings(data?.value || {});
      return;
    } catch (error) {
      console.warn("Speech settings load failed, using local defaults.", error);
    }
  }

  applySpeechSettings(readLocalSpeechSettings());
}

async function loadRoleLimits() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("app_settings")
        .select("value")
        .eq("key", "role_limits")
        .maybeSingle();
      if (error) throw error;
      applyRoleLimits(data?.value || {});
      return;
    } catch (error) {
      console.warn("Role limits load failed, using local defaults.", error);
    }
  }

  try {
    applyRoleLimits(JSON.parse(localStorage.getItem("roleLimits") || "{}"));
  } catch {
    applyRoleLimits();
  }
}

async function reloadWords() {
  const words = await loadWords();
  state.words = words.map((word) => {
    const localImage = localStorage.getItem(`image:${word.id}`);
    return localImage && !supabaseClient ? { ...word, imageUrl: localImage } : word;
  });
  state.categories = sortedCategories(state.words);
  state.filtered = state.words;
  const progress = readStudyProgress();
  if (progress?.category === "All" || state.categories.includes(progress?.category)) {
    state.category = progress.category;
  } else if (state.category !== "All" && !state.categories.includes(state.category)) {
    state.category = "All";
  }
  renderCategories();
  if (typeof progress?.query === "string") {
    el.search.value = progress.query;
  }
  applyFilter(progress?.wordId || "");
  renderAdminWordList();
  renderStats();
}

async function updateWordInStore(item, patch) {
  if (!isAdmin()) throw new Error("Only admins can edit content.");
  const updated = { ...item, ...patch };

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from(supabaseSettings.table || "words")
      .update(toSupabasePayload(updated))
      .eq("id", item.id);
    if (error) throw error;
  } else if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    if (patch.imageUrl !== undefined) {
      const formData = new FormData();
      formData.append("image_url", patch.imageUrl);
      const response = await fetch(`/api/words/${item.id}/image`, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Local API image update failed");
    }
  } else {
    localStorage.setItem(`image:${item.id}`, updated.imageUrl || "");
  }

  Object.assign(item, updated);
  const sourceItem = state.words.find((word) => word.id === item.id);
  if (sourceItem) Object.assign(sourceItem, updated);
  state.categories = sortedCategories(state.words);
  renderCategories();
  selectWordByIndex(state.currentIndex, false);
  fillAdminFields(updated);
  renderAdminWordList();
  return updated;
}

function resizeImageToSquare(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const sourceX = Math.floor((image.width - size) / 2);
        const sourceY = Math.floor((image.height - size) / 2);
        const canvas = document.createElement("canvas");
        canvas.width = 700;
        canvas.height = 700;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, 700, 700);
        context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 700, 700);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Cannot resize image"));
              return;
            }
            resolve(new File([blob], "word-image.webp", { type: "image/webp" }));
          },
          "image/webp",
          0.86,
        );
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImageToStorage(item, file) {
  if (!isAdmin()) throw new Error("Only admins can upload images.");
  const resized = await resizeImageToSquare(file);

  if (supabaseClient) {
    const path = `${item.id}-${Date.now()}.webp`;
    const { error: uploadError } = await supabaseClient.storage
      .from(supabaseSettings.bucket || "word-images")
      .upload(path, resized, {
        cacheControl: "3600",
        contentType: "image/webp",
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage.from(supabaseSettings.bucket || "word-images").getPublicUrl(path);
    return data.publicUrl;
  }

  throw new Error("Supabase is required for permanent image uploads.");
}

async function uploadImageFile(item, file) {
  const imageUrl = await uploadImageToStorage(item, file);
  return updateWordInStore(item, { imageUrl });
}

async function runAdminAction(message, action) {
  if (!isAdmin()) {
    showToast("Only admins can edit content.", "error");
    return;
  }

  showToast(message, "info");
  try {
    await action();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Could not save. Check your Supabase configuration.", "error");
  }
}

async function loadUsers() {
  if (!isAdmin()) return;
  if (!supabaseClient) {
    showToast("Supabase is required to manage users.", "error");
    return;
  }

  showToast("Loading users...", "info");
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    showToast(error.message || "Could not load users.", "error");
    return;
  }

  state.users = data || [];
  if (!state.users.length) showToast("No users found.", "info");
  renderUsers();
}

function renderUsers() {
  if (!el.usersList) return;
  const query = el.userSearch.value.trim().toLowerCase();
  const users = state.users.filter((user) => !query || user.email.toLowerCase().includes(query));
  if (!users.length) {
    el.usersList.innerHTML = `<p class="rounded-2xl bg-yellow-50 p-4 text-center text-sm font-black text-slate-500">No users found.</p>`;
    return;
  }

  el.usersList.innerHTML = users
    .map(
      (user) => `
        <div class="user-row grid gap-2 rounded-2xl bg-white p-3 shadow sm:grid-cols-[1fr_150px] sm:items-center">
          <div class="min-w-0">
            <p class="truncate font-black">${escapeHtml(user.email)}</p>
            <p class="text-xs font-extrabold uppercase text-slate-400">${escapeHtml(user.id)}</p>
          </div>
          <select class="user-role-select rounded-2xl border-4 border-yellow-100 px-3 py-2 font-black outline-none focus:border-sky-300" data-user-id="${escapeHtml(user.id)}">
            <option value="free" ${user.role === "free" ? "selected" : ""}>Free</option>
            <option value="paid" ${user.role === "paid" ? "selected" : ""}>Paid</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </div>
      `,
    )
    .join("");
}

async function updateUserRole(userId, role) {
  if (!isAdmin() || !supabaseClient) return;
  showToast("Saving user role...", "info");
  const { error } = await supabaseClient
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    showToast(error.message || "Could not save user role.", "error");
    return;
  }

  const user = state.users.find((entry) => entry.id === userId);
  if (user) user.role = role;
  showToast("User role saved.", "success");
  renderUsers();
}

async function saveRoleLimits() {
  if (!isAdmin()) return;
  const limits = {
    guest: normalizeRoleLimit(el.limitGuest.value, 15),
    free: normalizeRoleLimit(el.limitFree.value, 100),
    paid: normalizeRoleLimit(el.limitPaid.value, 0),
    admin: 0,
  };
  applyRoleLimits(limits);
  showToast("Saving daily limits...", "info");

  if (supabaseClient) {
    const { error } = await supabaseClient.from("app_settings").upsert({
      key: "role_limits",
      value: state.roleLimits,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      showToast(error.message || "Could not save daily limits.", "error");
      return;
    }
  } else {
    localStorage.setItem("roleLimits", JSON.stringify(state.roleLimits));
  }

  updateAccessUi();
  showToast("Daily limits saved.", "success");
}

async function saveEditedImage() {
  if (state.editCrop) {
    const cropped = await cropToSquareFile("edit");
    await uploadImageFile(currentEditableWord(), cropped);
    clearCrop("edit");
    renderAdminWordList();
    showToast("Cropped image saved.", "success");
    return;
  }
  await updateWordInStore(currentEditableWord(), { imageUrl: el.imageUrl.value.trim() });
  showToast("Image link saved.", "success");
}

function bindAdminTools() {
  el.adminToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!isAdmin()) return;
    setAdminMode(!state.adminMode);
  });
  el.adminClose.textContent = "Study";
  el.adminClose.addEventListener("click", () => {
    setAdminMode(false);
  });
  el.adminTabs.addEventListener("click", (event) => {
    const tabButton = event.target.closest("[data-admin-tab]");
    if (!tabButton) return;
    setAdminTab(tabButton.dataset.adminTab);
  });
  el.adminWordSearch.addEventListener("input", () => {
    state.adminWordQuery = el.adminWordSearch.value;
    renderAdminWordList();
  });
  el.adminWordCategory.addEventListener("change", () => {
    state.adminWordCategory = el.adminWordCategory.value;
    renderAdminWordList();
  });
  el.adminWordList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-word-id]");
    if (!row) return;
    selectAdminWord(row.dataset.wordId);
  });
  el.userSearch.addEventListener("input", renderUsers);
  el.refreshUsers.addEventListener("click", loadUsers);
  el.usersList.addEventListener("change", (event) => {
    const select = event.target.closest(".user-role-select");
    if (!select) return;
    updateUserRole(select.dataset.userId, select.value);
  });
  el.saveRoleLimits.addEventListener("click", saveRoleLimits);
  el.cancelEditCrop.addEventListener("click", () => {
    clearCrop("edit");
    showToast("Image crop cancelled.", "info");
  });
  el.saveEditCrop.addEventListener("click", () => {
    runAdminAction("Cropping and uploading image...", saveEditedImage);
  });
  el.imageUrl.addEventListener("input", () => {
    if (state.editCrop && el.imageUrl.value.trim()) clearCrop("edit");
  });
  el.newImageUrl.addEventListener("input", () => {
    if (state.newCrop && el.newImageUrl.value.trim()) clearCrop("new");
    renderNewImagePreview();
  });
  ["edit", "new"].forEach((kind) => {
    const parts = cropElements(kind);
    parts.zoom.addEventListener("input", () => {
      const crop = state[parts.key];
      if (!crop) return;
      crop.zoom = Number(parts.zoom.value);
      updateCropView(kind);
    });
    parts.frame.addEventListener("pointerdown", (event) => {
      const crop = state[parts.key];
      if (!crop) return;
      crop.dragging = true;
      crop.dragX = event.clientX;
      crop.dragY = event.clientY;
      parts.frame.setPointerCapture(event.pointerId);
    });
    parts.frame.addEventListener("pointermove", (event) => {
      const crop = state[parts.key];
      if (!crop?.dragging) return;
      crop.offsetX += event.clientX - crop.dragX;
      crop.offsetY += event.clientY - crop.dragY;
      crop.dragX = event.clientX;
      crop.dragY = event.clientY;
      updateCropView(kind);
    });
    const stopDragging = () => {
      const crop = state[parts.key];
      if (crop) crop.dragging = false;
    };
    parts.frame.addEventListener("pointerup", stopDragging);
    parts.frame.addEventListener("pointercancel", stopDragging);
  });

  el.saveWord.addEventListener("click", () => {
    runAdminAction("Saving word...", async () => {
      await updateWordInStore(currentEditableWord(), {
        word: el.editWord.value.trim(),
        category: el.editCategory.value.trim(),
        imageUrl: el.imageUrl.value.trim(),
        meaning: el.editMeaning.value.trim(),
        emoji: el.editEmoji.value.trim() || "⭐",
        color: el.editColor.value || "#ffd166",
      });
      showToast("Word content saved.", "success");
    });
  });

  el.saveImageUrl.addEventListener("click", () => {
    runAdminAction(state.editCrop ? "Cropping and uploading image..." : "Saving image link...", saveEditedImage);
  });

  el.imageFile.addEventListener("change", () => {
    if (!el.imageFile.files.length) return;
    startCrop("edit", el.imageFile.files[0]);
    showToast("Adjust the image, then tap Save Image.", "info");
    el.imageFile.value = "";
  });
  el.newImageFile.addEventListener("change", () => {
    if (!el.newImageFile.files.length) {
      clearCrop("new");
      renderNewImagePreview();
      return;
    }
    startCrop("new", el.newImageFile.files[0]);
    showToast("Adjust the image, then tap Add Word.", "info");
  });

  el.deleteWord.addEventListener("click", () => {
    runAdminAction("Deleting word...", async () => {
      const item = currentEditableWord();
      if (!confirm(`Delete "${item.word}"?`)) {
        showToast("Delete cancelled.", "info");
        return;
      }
      if (supabaseClient) {
        const { error } = await supabaseClient.from(supabaseSettings.table || "words").delete().eq("id", item.id);
        if (error) throw error;
      }
      state.words = state.words.filter((word) => word.id !== item.id);
      state.filtered = state.filtered.filter((word) => word.id !== item.id);
      state.currentIndex = Math.min(state.currentIndex, Math.max(0, state.filtered.length - 1));
      state.editWordId = state.filtered[state.currentIndex]?.id || state.words[0]?.id || "";
      state.categories = sortedCategories(state.words);
      renderCategories();
      selectWordByIndex(state.currentIndex, false);
      renderAdminWordList();
      showToast("Word deleted.", "success");
    });
  });

  el.addWord.addEventListener("click", () => {
    runAdminAction("Adding word...", async () => {
      const word = el.newWord.value.trim().toLowerCase();
      if (!word) throw new Error("Enter a new word first.");
      const category = el.newCategory.value.trim() || el.newCategorySelect.value || "Common Words";
      const id = `${slugify(category)}-${slugify(word)}`;
      const item = {
        id,
        word,
        category,
        meaning: el.newMeaning.value.trim() || "new word",
        emoji: el.newEmoji.value.trim() || "⭐",
        color: el.newColor.value || "#ffd166",
        imageUrl: el.newImageUrl.value.trim(),
        sortOrder: state.words.length ? Math.max(...state.words.map((entry) => entry.sortOrder || 0)) + 1 : 0,
      };

      if (state.newCrop) {
        const cropped = await cropToSquareFile("new");
        item.imageUrl = await uploadImageToStorage(item, cropped);
      }

      if (supabaseClient) {
        const { error } = await supabaseClient.from(supabaseSettings.table || "words").insert(toSupabasePayload(item));
        if (error) throw error;
      }
      state.words.push(item);
      state.categories = sortedCategories(state.words);
      renderCategories();
      applyFilter();
      state.currentIndex = state.filtered.findIndex((entry) => entry.id === item.id);
      selectWordByIndex(Math.max(0, state.currentIndex), false);
      el.newWord.value = "";
      el.newCategory.value = "";
      el.newMeaning.value = "";
      el.newEmoji.value = "";
      el.newImageUrl.value = "";
      el.newImageFile.value = "";
      clearCrop("new");
      renderNewImagePreview();
      showToast("New word added.", "success");
      setAdminTab("words");
    });
  });

  const updateSpeechPreview = () => {
    applySpeechSettings({
      rate: Number(el.speechRate.value),
      volume: Number(el.speechVolume.value),
      voiceURI: el.speechVoice.value,
    });
  };
  el.speechRate.addEventListener("input", updateSpeechPreview);
  el.speechVolume.addEventListener("input", updateSpeechPreview);
  el.speechVoice.addEventListener("change", updateSpeechPreview);
  el.saveSpeechSettings.addEventListener("click", () => {
    runAdminAction("Saving voice settings...", async () => {
      updateSpeechPreview();
      if (supabaseClient) {
        const { error } = await supabaseClient.from("app_settings").upsert({
          key: "speech",
          value: state.speech,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      } else {
        localStorage.setItem("speechSettings", JSON.stringify(state.speech));
      }
      showToast("Voice settings saved.", "success");
      speak(currentWord());
    });
  });
}

async function handleLogin() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Supabase is not configured.";
    return;
  }
  el.authStatus.textContent = "Logging in...";
  const email = el.email.value.trim();
  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: el.password.value,
  });
  if (error) {
    el.authStatus.textContent = error.message;
    return;
  }
  saveRememberedAuth(email);
  el.authStatus.textContent = "Logged in. Session saved on this device.";
}

async function handleSignup() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Supabase is not configured.";
    return;
  }
  el.authStatus.textContent = "Creating account...";
  const email = el.email.value.trim();
  const { error } = await supabaseClient.auth.signUp({
    email,
    password: el.password.value,
    options: {
      emailRedirectTo: `${window.location.origin}${window.location.pathname}?v=email-confirmed`,
    },
  });
  if (error) {
    el.authStatus.textContent = error.message;
    return;
  }
  saveRememberedAuth(email);
  el.authStatus.textContent = "Account created. Check your email if Supabase asks for confirmation.";
}

async function handleForgotPassword() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Supabase is not configured.";
    return;
  }
  const email = el.email.value.trim();
  if (!email) {
    el.authStatus.textContent = "Enter your email first.";
    return;
  }
  el.authStatus.textContent = "Sending password reset email...";
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname}?v=password-reset`,
  });
  el.authStatus.textContent = error ? error.message : "Password reset email sent. Check your inbox.";
}

async function handleUpdatePassword() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Supabase is not configured.";
    return;
  }
  const password = el.newPassword.value;
  const confirmPassword = el.confirmPassword.value;
  if (password.length < 6) {
    el.authStatus.textContent = "Password must be at least 6 characters.";
    return;
  }
  if (password !== confirmPassword) {
    el.authStatus.textContent = "Passwords do not match.";
    return;
  }
  el.authStatus.textContent = "Updating password...";
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    el.authStatus.textContent = error.message;
    return;
  }
  state.passwordResetMode = false;
  el.newPassword.value = "";
  el.confirmPassword.value = "";
  updateAccessUi();
  el.authStatus.textContent = "Password updated. You can use the new password from now on.";
  showToast("Password updated.", "success");
}

async function handleGoogleLogin() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Supabase is not configured.";
    return;
  }
  await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });
}

async function handleLogout() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  state.session = null;
  state.profile = null;
  state.role = "guest";
  state.passwordResetMode = false;
  loadStudyDataForViewer();
  updateAccessUi();
  await reloadWords();
  el.password.value = "";
  showToast("Logged out. Guest statistics loaded.", "info");
}

function bindAuth() {
  el.authToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    el.statsPanel.classList.add("hidden");
    el.donatePanel.classList.add("hidden");
    el.authPanel.classList.toggle("hidden");
  });
  el.authPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  document.addEventListener("click", () => {
    el.authPanel.classList.add("hidden");
  });
  el.login.addEventListener("click", handleLogin);
  el.signup.addEventListener("click", handleSignup);
  el.google.addEventListener("click", handleGoogleLogin);
  el.forgotPassword.addEventListener("click", handleForgotPassword);
  el.updatePassword.addEventListener("click", handleUpdatePassword);
  el.backToLogin.addEventListener("click", () => {
    state.passwordResetMode = false;
    updateAccessUi();
    el.authStatus.textContent = "";
  });
  el.rememberSession.addEventListener("change", () => {
    if (!el.rememberSession.checked) {
      localStorage.setItem("rememberDevice", "false");
      localStorage.removeItem("rememberedEmail");
    }
  });
  el.logout.addEventListener("click", handleLogout);

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      state.session = session;
      if (_event === "PASSWORD_RECOVERY") {
        state.passwordResetMode = true;
        el.authPanel.classList.remove("hidden");
        el.authStatus.textContent = "Enter a new password for your account.";
      }
      await refreshProfile();
      loadStudyDataForViewer();
      await reloadWords();
    });
  }
}

function bindStats() {
  el.statsToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    renderStats();
    el.authPanel.classList.add("hidden");
    el.donatePanel.classList.add("hidden");
    el.statsPanel.classList.toggle("hidden");
  });
  el.statsPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  document.addEventListener("click", () => {
    el.statsPanel.classList.add("hidden");
  });
}

function bindDonate() {
  el.donateToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    el.authPanel.classList.add("hidden");
    el.statsPanel.classList.add("hidden");
    el.donatePanel.classList.toggle("hidden");
  });
  el.donateClose.addEventListener("click", (event) => {
    event.stopPropagation();
    el.donatePanel.classList.add("hidden");
  });
  el.donateCard.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  el.donatePanel.addEventListener("click", () => {
    el.donatePanel.classList.add("hidden");
  });
  document.addEventListener("click", () => {
    el.donatePanel.classList.add("hidden");
  });
}

function showAuthCallbackMessage() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const error = hashParams.get("error_description") || searchParams.get("error_description");
  const isPasswordReset =
    searchParams.get("v") === "password-reset" ||
    hashParams.get("type") === "recovery" ||
    searchParams.get("type") === "recovery";

  if (error) {
    el.authPanel.classList.remove("hidden");
    el.authStatus.textContent = decodeURIComponent(error.replace(/\+/g, " "));
    return;
  }

  if (isPasswordReset) {
    state.passwordResetMode = true;
    updateAccessUi();
    el.authPanel.classList.remove("hidden");
    el.authStatus.textContent = "Enter a new password for your account.";
    return;
  }

  if (hashParams.get("access_token") || searchParams.get("code") || searchParams.get("v") === "email-confirmed") {
    el.authPanel.classList.remove("hidden");
    el.authStatus.textContent = "Email confirmed. If you are not logged in automatically, enter your email and password, then tap Login.";
  }
}

function bindSwipe() {
  el.flashCard.addEventListener("pointerdown", (event) => {
    if (event.target.closest("#prevBtn, #nextBtn, #randomBtn")) return;
    state.isDragging = true;
    state.dragStartedOnSpeak = Boolean(event.target.closest("#speakArea"));
    state.dragStartX = event.clientX;
    state.dragCurrentX = event.clientX;
    el.flashCard.setPointerCapture(event.pointerId);
  });

  el.flashCard.addEventListener("pointermove", (event) => {
    if (!state.isDragging) return;
    state.dragCurrentX = event.clientX;
    const distance = state.dragCurrentX - state.dragStartX;
    el.speakArea.style.transform = `translateX(${distance * 0.18}px) rotate(${distance * 0.015}deg)`;
  });

  el.flashCard.addEventListener("pointerup", () => {
    if (!state.isDragging) return;
    state.isDragging = false;
    const distance = state.dragCurrentX - state.dragStartX;
    el.speakArea.style.transform = "";
    if (Math.abs(distance) < 70) {
      if (state.dragStartedOnSpeak) {
        state.suppressNextSpeakClick = true;
        speak(currentWord());
      }
      state.dragStartedOnSpeak = false;
      return;
    }
    state.suppressNextSpeakClick = true;
    state.dragStartedOnSpeak = false;
    if (distance < 0) {
      el.speakArea.classList.add("swipe-left");
      window.setTimeout(() => selectWordByIndex(state.currentIndex + 1), 130);
    } else {
      el.speakArea.classList.add("swipe-right");
      window.setTimeout(() => selectWordByIndex(state.currentIndex - 1), 130);
    }
  });

  el.flashCard.addEventListener("pointercancel", () => {
    state.isDragging = false;
    state.dragStartedOnSpeak = false;
    el.speakArea.style.transform = "";
  });
}

function bindEvents() {
  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
  bindAuth();
  bindStats();
  bindDonate();
  bindAdminTools();
  el.search.addEventListener("input", applyFilter);
  el.category.addEventListener("change", () => {
    state.category = el.category.value;
    applyFilter();
  });
  el.speakArea.addEventListener("click", () => {
    if (state.suppressNextSpeakClick) {
      state.suppressNextSpeakClick = false;
      return;
    }
    speak(currentWord());
  });
  el.next.addEventListener("click", () => selectWordByIndex(state.currentIndex + 1));
  el.prev.addEventListener("click", () => selectWordByIndex(state.currentIndex - 1));
  el.random.addEventListener("click", () => selectWordByIndex(Math.floor(Math.random() * state.filtered.length)));
  bindSwipe();
  startStudyTimer();
}

async function init() {
  loadRememberedAuth();
  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    state.session = data.session;
  }
  showAuthCallbackMessage();
  await loadRoleLimits();
  await refreshProfile();
  loadStudyDataForViewer();
  await loadSpeechSettings();
  await reloadWords();
  bindEvents();
}

init();
