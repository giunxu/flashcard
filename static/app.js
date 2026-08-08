const supabaseSettings = window.ENGLISH_FOR_KIDS_SUPABASE || {};

function normalizeSupabaseUrl(url) {
  return (url || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

supabaseSettings.url = normalizeSupabaseUrl(supabaseSettings.url);
const hasSupabaseConfig = Boolean(supabaseSettings.url && supabaseSettings.anonKey);
const supabaseClient =
  hasSupabaseConfig && window.supabase
    ? window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey)
    : null;

const state = {
  words: [],
  filtered: [],
  categories: [],
  category: "All",
  currentIndex: 0,
  session: null,
  profile: null,
  role: "guest",
  learned: new Set(JSON.parse(localStorage.getItem("learnedWords") || "[]")),
  dragStartX: 0,
  dragCurrentX: 0,
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
  authToggle: document.querySelector("#authToggleBtn"),
  adminToggle: document.querySelector("#adminToggleBtn"),
  authPanel: document.querySelector("#authPanel"),
  signedOutAuth: document.querySelector("#signedOutAuth"),
  signedInAuth: document.querySelector("#signedInAuth"),
  email: document.querySelector("#emailInput"),
  password: document.querySelector("#passwordInput"),
  login: document.querySelector("#loginBtn"),
  signup: document.querySelector("#signupBtn"),
  google: document.querySelector("#googleBtn"),
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

function currentEditableWord() {
  return state.words.find((word) => word.id === state.editWordId) || currentWord();
}

function roleLimitLabel(role) {
  const limit = Number(state.roleLimits[role] ?? 0);
  return limit > 0 ? `${limit} words` : "all words";
}

function saveLearned() {
  localStorage.setItem("learnedWords", JSON.stringify([...state.learned]));
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

function speak(word) {
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
  state.learned.add(word);
  saveLearned();
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

function selectWordByIndex(index, shouldSpeak = true) {
  if (!state.filtered.length) return;

  state.currentIndex = (index + state.filtered.length) % state.filtered.length;
  const item = currentWord();
  el.wordText.textContent = item.word;
  el.wordMeaning.textContent = item.meaning;
  el.wordCategory.textContent = item.category;
  el.positionText.textContent = state.currentIndex + 1;
  el.totalWords.textContent = state.filtered.length;
  el.imageFrame.innerHTML = imageMarkup(item);
  el.imageFrame.style.setProperty("--card-color", item.color);
  if (el.imageStatus) {
    el.imageStatus.textContent = item.imageUrl
      ? "This word has a custom image."
      : "No custom image yet. Using the default illustration.";
  }
  updateGoogleLink(item);
  fillAdminFields(item);

  el.speakArea.classList.remove("swipe-left", "swipe-right");
  if (shouldSpeak) speak(item.word);
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
  const coverScale = Math.max(size / crop.image.naturalWidth, size / crop.image.naturalHeight);
  const scale = coverScale * crop.zoom;
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

function applyFilter() {
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

  selectWordByIndex(0, false);
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
  el.signedOutAuth.classList.toggle("hidden", Boolean(state.session));
  el.signedInAuth.classList.toggle("hidden", !state.session);
  el.userEmail.textContent = state.session?.user?.email || "";
  el.adminToggle.classList.toggle("hidden", !isAdmin());
  if (!isAdmin()) state.adminMode = false;
  setAdminMode(state.adminMode);
  if (state.adminMode) return;

  if (state.role === "guest") {
    el.accessNote.classList.remove("hidden");
    el.accessNote.textContent = `Trial mode: ${roleLimitLabel("guest")}. Log in to learn ${roleLimitLabel("free")} for free.`;
  } else if (state.role === "free") {
    el.accessNote.classList.remove("hidden");
    el.accessNote.textContent = `Free account: ${roleLimitLabel("free")}. Admin can upgrade users in Control Board.`;
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
      return await loadWordsFromSupabase();
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
  renderCategories();
  applyFilter();
  renderAdminWordList();
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
    el.imageStatus.textContent = "Only admins can edit content.";
    return;
  }

  el.imageStatus.textContent = message;
  try {
    await action();
  } catch (error) {
    console.error(error);
    el.imageStatus.textContent = error.message || "Could not save. Check your Supabase configuration.";
  }
}

async function loadUsers() {
  if (!isAdmin()) return;
  if (!supabaseClient) {
    el.usersStatus.textContent = "Supabase is required to manage users.";
    return;
  }

  el.usersStatus.textContent = "Loading users...";
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    el.usersStatus.textContent = error.message || "Could not load users.";
    return;
  }

  state.users = data || [];
  el.usersStatus.textContent = state.users.length ? "" : "No users found.";
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
  el.usersStatus.textContent = "Saving user role...";
  const { error } = await supabaseClient
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    el.usersStatus.textContent = error.message || "Could not save user role.";
    return;
  }

  const user = state.users.find((entry) => entry.id === userId);
  if (user) user.role = role;
  el.usersStatus.textContent = "User role saved.";
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
  el.usersStatus.textContent = "Saving role limits...";

  if (supabaseClient) {
    const { error } = await supabaseClient.from("app_settings").upsert({
      key: "role_limits",
      value: state.roleLimits,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      el.usersStatus.textContent = error.message || "Could not save role limits.";
      return;
    }
  } else {
    localStorage.setItem("roleLimits", JSON.stringify(state.roleLimits));
  }

  updateAccessUi();
  el.usersStatus.textContent = "Role limits saved.";
}

async function saveEditedImage() {
  if (state.editCrop) {
    const cropped = await cropToSquareFile("edit");
    await uploadImageFile(currentEditableWord(), cropped);
    clearCrop("edit");
    renderAdminWordList();
    el.imageStatus.textContent = "Cropped image saved.";
    return;
  }
  await updateWordInStore(currentEditableWord(), { imageUrl: el.imageUrl.value.trim() });
  el.imageStatus.textContent = "Image link saved.";
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
    el.imageStatus.textContent = "Image crop cancelled.";
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
        meaning: el.editMeaning.value.trim(),
        emoji: el.editEmoji.value.trim() || "⭐",
        color: el.editColor.value || "#ffd166",
      });
      el.imageStatus.textContent = "Word content saved.";
    });
  });

  el.saveImageUrl.addEventListener("click", () => {
    runAdminAction(state.editCrop ? "Cropping and uploading image..." : "Saving image link...", saveEditedImage);
  });

  el.imageFile.addEventListener("change", () => {
    if (!el.imageFile.files.length) return;
    startCrop("edit", el.imageFile.files[0]);
    el.imageStatus.textContent = "Adjust the image, then tap Save Image.";
    el.imageFile.value = "";
  });
  el.newImageFile.addEventListener("change", () => {
    if (!el.newImageFile.files.length) {
      clearCrop("new");
      renderNewImagePreview();
      return;
    }
    startCrop("new", el.newImageFile.files[0]);
    el.imageStatus.textContent = "Adjust the image, then tap Add Word.";
  });

  el.deleteWord.addEventListener("click", () => {
    runAdminAction("Deleting word...", async () => {
      const item = currentEditableWord();
      if (!confirm(`Delete "${item.word}"?`)) {
        el.imageStatus.textContent = "Delete cancelled.";
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
      el.imageStatus.textContent = "Word deleted.";
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
      el.imageStatus.textContent = "New word added.";
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
      el.imageStatus.textContent = "Voice settings saved.";
      speak(currentWord().word);
    });
  });
}

async function handleLogin() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Supabase is not configured.";
    return;
  }
  el.authStatus.textContent = "Logging in...";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: el.email.value.trim(),
    password: el.password.value,
  });
  el.authStatus.textContent = error ? error.message : "Logged in.";
}

async function handleSignup() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Supabase is not configured.";
    return;
  }
  el.authStatus.textContent = "Creating account...";
  const { error } = await supabaseClient.auth.signUp({
    email: el.email.value.trim(),
    password: el.password.value,
    options: {
      emailRedirectTo: `${window.location.origin}${window.location.pathname}?v=email-confirmed`,
    },
  });
  el.authStatus.textContent = error ? error.message : "Account created. Check your email if Supabase asks for confirmation.";
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
}

function bindAuth() {
  el.authToggle.addEventListener("click", (event) => {
    event.stopPropagation();
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
  el.logout.addEventListener("click", handleLogout);

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      state.session = session;
      await refreshProfile();
      await reloadWords();
    });
  }
}

function showAuthCallbackMessage() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const error = hashParams.get("error_description") || searchParams.get("error_description");

  if (error) {
    el.authPanel.classList.remove("hidden");
    el.authStatus.textContent = decodeURIComponent(error.replace(/\+/g, " "));
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
      return;
    }
    state.suppressNextSpeakClick = true;
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
    el.speakArea.style.transform = "";
  });
}

function bindEvents() {
  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
  bindAuth();
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
    speak(currentWord().word);
  });
  el.next.addEventListener("click", () => selectWordByIndex(state.currentIndex + 1));
  el.prev.addEventListener("click", () => selectWordByIndex(state.currentIndex - 1));
  el.random.addEventListener("click", () => selectWordByIndex(Math.floor(Math.random() * state.filtered.length)));
  bindSwipe();
}

async function init() {
  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    state.session = data.session;
  }
  showAuthCallbackMessage();
  await loadRoleLimits();
  await refreshProfile();
  await loadSpeechSettings();
  await reloadWords();
  bindEvents();
}

init();
