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
  learned: new Set(JSON.parse(localStorage.getItem("learnedWords") || "[]")),
  dragStartX: 0,
  dragCurrentX: 0,
  isDragging: false,
  lastSpokenAt: 0,
  lastSpokenWord: "",
  voices: [],
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
  repeat: document.querySelector("#repeatBtn"),
  random: document.querySelector("#randomBtn"),
  next: document.querySelector("#nextBtn"),
  prev: document.querySelector("#prevBtn"),
  toggleImageTools: document.querySelector("#toggleImageTools"),
  imageTools: document.querySelector("#imageTools"),
  imageToolsIcon: document.querySelector("#imageToolsIcon"),
  imageUrl: document.querySelector("#imageUrlInput"),
  saveImageUrl: document.querySelector("#saveImageUrlBtn"),
  imageFile: document.querySelector("#imageFileInput"),
  clearImage: document.querySelector("#clearImageBtn"),
  googleImage: document.querySelector("#googleImageLink"),
  imageStatus: document.querySelector("#imageStatus"),
};

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
  utterance.rate = 0.78;
  utterance.pitch = 1.08;
  const voice = englishVoice();
  if (voice) utterance.voice = voice;
  utterance.onstart = () => {
    el.speechHint.textContent = "Đang đọc...";
  };
  utterance.onend = () => {
    el.speechHint.textContent = "Bấm thẻ để nghe";
  };
  utterance.onerror = () => {
    el.speechHint.textContent = "Chưa phát được tiếng, bấm Nghe lại thử nhé.";
  };
  window.speechSynthesis.speak(utterance);
  state.learned.add(word);
  saveLearned();
}

function currentWord() {
  return state.filtered[state.currentIndex] || state.words[0];
}

function fromSupabaseRow(row) {
  return {
    id: row.id,
    word: row.word,
    category: row.category,
    emoji: row.emoji,
    meaning: row.meaning,
    color: row.color,
    imageUrl: row.image_url || "",
    sortOrder: row.sort_order || 0,
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
  el.imageUrl.value = item.imageUrl || "";
  el.imageStatus.textContent = item.imageUrl
    ? "Đã có hình riêng cho từ này."
    : "Chưa có hình riêng, đang dùng hình minh họa mặc định.";
  updateGoogleLink(item);

  el.flashCard.classList.remove("swipe-left", "swipe-right");
  if (shouldSpeak) speak(item.word);
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

async function updateImageUrl(item, imageUrl) {
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from(supabaseSettings.table || "words")
      .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) throw error;
    return imageUrl;
  }

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    const formData = new FormData();
    formData.append("image_url", imageUrl);
    const response = await fetch(`/api/words/${item.id}/image`, { method: "POST", body: formData });
    if (!response.ok) throw new Error("Local API image update failed");
    const result = await response.json();
    return result.imageUrl || "";
  }

  localStorage.setItem(`image:${item.id}`, imageUrl);
  return imageUrl;
}

async function uploadImageFile(item, file) {
  if (supabaseClient) {
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${item.id}.${extension}`;
    const { error: uploadError } = await supabaseClient.storage
      .from(supabaseSettings.bucket || "word-images")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage.from(supabaseSettings.bucket || "word-images").getPublicUrl(path);
    return updateImageUrl(item, data.publicUrl);
  }

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    const formData = new FormData();
    formData.append("image_file", file);
    const response = await fetch(`/api/words/${item.id}/image`, { method: "POST", body: formData });
    if (!response.ok) throw new Error("Local API image upload failed");
    const result = await response.json();
    return result.imageUrl || "";
  }

  throw new Error("Cần cấu hình Supabase để upload ảnh khi chạy static.");
}

async function saveImageForCurrent(action) {
  const item = currentWord();
  el.imageStatus.textContent = "Đang lưu hình...";

  try {
    const imageUrl = await action(item);
    item.imageUrl = imageUrl;
    const sourceItem = state.words.find((word) => word.id === item.id);
    if (sourceItem) sourceItem.imageUrl = imageUrl;
    selectWordByIndex(state.currentIndex, false);
    el.imageStatus.textContent = imageUrl ? "Đã lưu hình cho từ này." : "Đã xóa hình riêng.";
  } catch (error) {
    console.error(error);
    el.imageStatus.textContent = "Chưa lưu được hình, kiểm tra cấu hình Supabase nhé.";
  }
}

function bindImageTools() {
  el.toggleImageTools.addEventListener("click", () => {
    const isHidden = el.imageTools.classList.toggle("hidden");
    el.imageToolsIcon.textContent = isHidden ? "+" : "-";
  });

  el.saveImageUrl.addEventListener("click", () => {
    saveImageForCurrent((item) => updateImageUrl(item, el.imageUrl.value.trim()));
  });

  el.imageFile.addEventListener("change", () => {
    if (!el.imageFile.files.length) return;
    saveImageForCurrent((item) => uploadImageFile(item, el.imageFile.files[0]));
    el.imageFile.value = "";
  });

  el.clearImage.addEventListener("click", () => {
    saveImageForCurrent((item) => updateImageUrl(item, ""));
  });
}

function bindSwipe() {
  el.flashCard.addEventListener("pointerdown", (event) => {
    if (event.target.closest("#prevBtn, #nextBtn, #repeatBtn, #randomBtn")) return;
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
  el.search.addEventListener("input", applyFilter);
  el.category.addEventListener("change", () => {
    state.category = el.category.value;
    applyFilter();
  });
  el.speakArea.addEventListener("click", () => speak(currentWord().word));
  el.repeat.addEventListener("click", () => speak(currentWord().word));
  el.next.addEventListener("click", () => selectWordByIndex(state.currentIndex + 1));
  el.prev.addEventListener("click", () => selectWordByIndex(state.currentIndex - 1));
  el.random.addEventListener("click", () => selectWordByIndex(Math.floor(Math.random() * state.filtered.length)));
  bindSwipe();
  bindImageTools();
}

async function init() {
  const words = await loadWords();
  state.words = words.map((word) => {
    const localImage = localStorage.getItem(`image:${word.id}`);
    return localImage ? { ...word, imageUrl: localImage } : word;
  });
  state.filtered = state.words;
  state.categories = sortedCategories(state.words);
  renderCategories();
  selectWordByIndex(0, false);
  bindEvents();
}

function sortedCategories(words) {
  return [...new Set(words.map((item) => item.category))].sort();
}

init();
