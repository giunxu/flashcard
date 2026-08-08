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
  lastSpokenAt: 0,
  lastSpokenWord: "",
  voices: [],
  speech: {
    rate: 0.65,
    volume: 1,
  },
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
  newCategory: document.querySelector("#newCategoryInput"),
  newMeaning: document.querySelector("#newMeaningInput"),
  newEmoji: document.querySelector("#newEmojiInput"),
  newColor: document.querySelector("#newColorInput"),
  addWord: document.querySelector("#addWordBtn"),
  speechRate: document.querySelector("#speechRateInput"),
  speechVolume: document.querySelector("#speechVolumeInput"),
  speechRateValue: document.querySelector("#speechRateValue"),
  speechVolumeValue: document.querySelector("#speechVolumeValue"),
  saveSpeechSettings: document.querySelector("#saveSpeechSettingsBtn"),
};

function isAdmin() {
  return state.role === "admin";
}

function saveLearned() {
  localStorage.setItem("learnedWords", JSON.stringify([...state.learned]));
}

function refreshVoices() {
  if (!("speechSynthesis" in window)) return;
  state.voices = window.speechSynthesis.getVoices();
}

function englishVoice() {
  return (
    state.voices.find((voice) => voice.lang === "en-US") ||
    state.voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
    null
  );
}

function speak(word) {
  if (!("speechSynthesis" in window)) {
    el.speechHint.textContent = "Trình duyệt này chưa hỗ trợ đọc tiếng.";
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
    el.speechHint.textContent = "Đang đọc...";
  };
  utterance.onend = () => {
    el.speechHint.textContent = "Bấm thẻ để nghe";
  };
  utterance.onerror = () => {
    el.speechHint.textContent = "Chưa phát được tiếng, bấm thẻ thử lại nhé.";
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
    return `<img class="h-full w-full object-contain" src="${item.imageUrl}" alt="${item.word}" />`;
  }
  return `<div class="word-picture grid h-full w-full place-items-center text-8xl sm:text-9xl" style="--card-color: ${item.color}">${item.emoji}</div>`;
}

function updateGoogleLink(item) {
  const query = encodeURIComponent(`${item.word} picture for kids`);
  el.googleImage.href = `https://www.google.com/search?tbm=isch&q=${query}`;
}

function fillAdminFields(item) {
  if (!item) return;
  el.editWord.value = item.word;
  el.editCategory.value = item.category;
  el.editMeaning.value = item.meaning;
  el.editEmoji.value = item.emoji || "⭐";
  el.editColor.value = item.color || "#ffd166";
  el.imageUrl.value = item.imageUrl || "";
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
  el.imageStatus.textContent = item.imageUrl
    ? "Đã có hình riêng cho từ này."
    : "Chưa có hình riêng, đang dùng hình minh họa mặc định.";
  updateGoogleLink(item);
  fillAdminFields(item);

  el.flashCard.classList.remove("swipe-left", "swipe-right");
  if (shouldSpeak) speak(item.word);
}

function applySpeechControls() {
  el.speechRate.value = state.speech.rate;
  el.speechVolume.value = state.speech.volume;
  el.speechRateValue.textContent = `${Number(state.speech.rate).toFixed(2)}x`;
  el.speechVolumeValue.textContent = `${Math.round(Number(state.speech.volume) * 100)}%`;
}

function sortedCategories(words) {
  return [...new Set(words.map((item) => item.category))].sort();
}

function renderCategories() {
  const options = ["All", ...state.categories]
    .map((category) => {
      const label = category === "All" ? "Tất cả" : category;
      return `<option value="${category}">${label}</option>`;
    })
    .join("");
  el.category.innerHTML = options;
  el.category.value = state.category;
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
    el.wordMeaning.textContent = "Không tìm thấy từ phù hợp";
    el.imageFrame.innerHTML = `<div class="grid h-full w-full place-items-center text-7xl">?</div>`;
    el.positionText.textContent = "0";
    el.totalWords.textContent = "0";
    return;
  }

  selectWordByIndex(0, false);
}

function updateAccessUi() {
  const labels = {
    guest: "Guest",
    free: "Free",
    paid: "Paid",
    admin: "Admin",
  };
  el.roleBadge.textContent = labels[state.role] || "Guest";
  el.authToggle.textContent = state.session ? "Tài khoản" : "Đăng nhập";
  el.signedOutAuth.classList.toggle("hidden", Boolean(state.session));
  el.signedInAuth.classList.toggle("hidden", !state.session);
  el.userEmail.textContent = state.session?.user?.email || "";
  el.adminToggle.classList.toggle("hidden", !isAdmin());
  if (!isAdmin()) el.adminTools.classList.add("hidden");

  if (state.role === "guest") {
    el.accessNote.classList.remove("hidden");
    el.accessNote.textContent = "Bạn đang dùng thử 15 từ. Đăng nhập để học 100 từ miễn phí.";
  } else if (state.role === "free") {
    el.accessNote.classList.remove("hidden");
    el.accessNote.textContent = "Tài khoản Free học 100 từ đầu. Admin có thể gán Paid trong Supabase.";
  } else if (state.role === "paid") {
    el.accessNote.classList.add("hidden");
    el.accessNote.textContent = "Tài khoản Paid học toàn bộ từ vựng.";
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
  };
  applySpeechControls();
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
}

async function updateWordInStore(item, patch) {
  if (!isAdmin()) throw new Error("Chỉ admin được sửa nội dung.");
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

async function uploadImageFile(item, file) {
  if (!isAdmin()) throw new Error("Chỉ admin được upload ảnh.");
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
    return updateWordInStore(item, { imageUrl: data.publicUrl });
  }

  throw new Error("Cần Supabase để upload ảnh vĩnh viễn.");
}

async function runAdminAction(message, action) {
  if (!isAdmin()) {
    el.imageStatus.textContent = "Chỉ admin mới được sửa nội dung.";
    return;
  }

  el.imageStatus.textContent = message;
  try {
    await action();
  } catch (error) {
    console.error(error);
    el.imageStatus.textContent = error.message || "Chưa lưu được, kiểm tra Supabase nhé.";
  }
}

function bindAdminTools() {
  el.adminToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!isAdmin()) return;
    el.adminTools.classList.remove("hidden");
  });
  el.adminClose.addEventListener("click", () => {
    el.adminTools.classList.add("hidden");
  });
  el.adminTools.addEventListener("click", (event) => {
    if (event.target === el.adminTools) {
      el.adminTools.classList.add("hidden");
    }
  });

  el.saveWord.addEventListener("click", () => {
    runAdminAction("Đang lưu từ...", async () => {
      await updateWordInStore(currentWord(), {
        word: el.editWord.value.trim(),
        category: el.editCategory.value.trim(),
        meaning: el.editMeaning.value.trim(),
        emoji: el.editEmoji.value.trim() || "⭐",
        color: el.editColor.value || "#ffd166",
      });
      el.imageStatus.textContent = "Đã lưu nội dung từ.";
    });
  });

  el.saveImageUrl.addEventListener("click", () => {
    runAdminAction("Đang lưu link ảnh...", async () => {
      await updateWordInStore(currentWord(), { imageUrl: el.imageUrl.value.trim() });
      el.imageStatus.textContent = "Đã lưu link ảnh.";
    });
  });

  el.imageFile.addEventListener("change", () => {
    if (!el.imageFile.files.length) return;
    runAdminAction("Đang ép ảnh về 700x700 và upload...", async () => {
      await uploadImageFile(currentWord(), el.imageFile.files[0]);
      el.imageStatus.textContent = "Đã upload ảnh 700x700.";
    });
    el.imageFile.value = "";
  });

  el.deleteWord.addEventListener("click", () => {
    runAdminAction("Đang xóa từ...", async () => {
      const item = currentWord();
      if (!confirm(`Xóa từ "${item.word}"?`)) {
        el.imageStatus.textContent = "Đã hủy xóa.";
        return;
      }
      if (supabaseClient) {
        const { error } = await supabaseClient.from(supabaseSettings.table || "words").delete().eq("id", item.id);
        if (error) throw error;
      }
      state.words = state.words.filter((word) => word.id !== item.id);
      state.filtered = state.filtered.filter((word) => word.id !== item.id);
      state.currentIndex = Math.min(state.currentIndex, Math.max(0, state.filtered.length - 1));
      state.categories = sortedCategories(state.words);
      renderCategories();
      selectWordByIndex(state.currentIndex, false);
      el.imageStatus.textContent = "Đã xóa từ.";
    });
  });

  el.addWord.addEventListener("click", () => {
    runAdminAction("Đang thêm từ...", async () => {
      const word = el.newWord.value.trim().toLowerCase();
      if (!word) throw new Error("Nhập từ mới trước đã.");
      const category = el.newCategory.value.trim() || "Common Words";
      const id = `${slugify(category)}-${slugify(word)}`;
      const item = {
        id,
        word,
        category,
        meaning: el.newMeaning.value.trim() || "từ mới",
        emoji: el.newEmoji.value.trim() || "⭐",
        color: el.newColor.value || "#ffd166",
        imageUrl: "",
        sortOrder: state.words.length ? Math.max(...state.words.map((entry) => entry.sortOrder || 0)) + 1 : 0,
      };

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
      el.newMeaning.value = "";
      el.newEmoji.value = "";
      el.imageStatus.textContent = "Đã thêm từ mới.";
    });
  });

  const updateSpeechPreview = () => {
    applySpeechSettings({
      rate: Number(el.speechRate.value),
      volume: Number(el.speechVolume.value),
    });
  };
  el.speechRate.addEventListener("input", updateSpeechPreview);
  el.speechVolume.addEventListener("input", updateSpeechPreview);
  el.saveSpeechSettings.addEventListener("click", () => {
    runAdminAction("Đang lưu giọng đọc...", async () => {
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
      el.imageStatus.textContent = "Đã lưu giọng đọc.";
      speak(currentWord().word);
    });
  });
}

async function handleLogin() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Chưa cấu hình Supabase.";
    return;
  }
  el.authStatus.textContent = "Đang đăng nhập...";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: el.email.value.trim(),
    password: el.password.value,
  });
  el.authStatus.textContent = error ? error.message : "Đã đăng nhập.";
}

async function handleSignup() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Chưa cấu hình Supabase.";
    return;
  }
  el.authStatus.textContent = "Đang tạo tài khoản...";
  const { error } = await supabaseClient.auth.signUp({
    email: el.email.value.trim(),
    password: el.password.value,
    options: {
      emailRedirectTo: `${window.location.origin}${window.location.pathname}?v=email-confirmed`,
    },
  });
  el.authStatus.textContent = error ? error.message : "Đã tạo tài khoản. Kiểm tra email nếu Supabase yêu cầu xác nhận.";
}

async function handleGoogleLogin() {
  if (!supabaseClient) {
    el.authStatus.textContent = "Chưa cấu hình Supabase.";
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
    el.authStatus.textContent = "Email đã xác nhận. Nếu chưa tự đăng nhập, nhập email/mật khẩu rồi bấm Đăng nhập.";
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
    el.flashCard.style.transform = `translateX(${distance * 0.18}px) rotate(${distance * 0.015}deg)`;
  });

  el.flashCard.addEventListener("pointerup", () => {
    if (!state.isDragging) return;
    state.isDragging = false;
    const distance = state.dragCurrentX - state.dragStartX;
    el.flashCard.style.transform = "";
    if (Math.abs(distance) < 70) {
      speak(currentWord().word);
      return;
    }
    if (distance < 0) {
      el.flashCard.classList.add("swipe-left");
      window.setTimeout(() => selectWordByIndex(state.currentIndex + 1), 130);
    } else {
      el.flashCard.classList.add("swipe-right");
      window.setTimeout(() => selectWordByIndex(state.currentIndex - 1), 130);
    }
  });

  el.flashCard.addEventListener("pointercancel", () => {
    state.isDragging = false;
    el.flashCard.style.transform = "";
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
  el.speakArea.addEventListener("click", () => speak(currentWord().word));
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
  await refreshProfile();
  await loadSpeechSettings();
  await reloadWords();
  bindEvents();
}

init();
