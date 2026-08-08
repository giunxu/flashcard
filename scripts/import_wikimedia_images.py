import json
import hashlib
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from data.words import build_words

IMAGE_STORE = PROJECT_DIR / "data" / "image_overrides.json"
SOURCE_STORE = PROJECT_DIR / "data" / "image_sources.json"
USER_AGENT = "EnglishForKidsLocal/1.0 (local vocabulary learning app)"

CATEGORY_HINTS = {
    "Animals": "animal",
    "Food": "food",
    "Home": "object",
    "School": "school object",
    "Family": "person",
    "Body": "body part",
    "Clothes": "clothing",
    "Colors": "color",
    "Numbers": "number",
    "Actions": "action",
    "Feelings": "emotion",
    "Places": "place",
    "Nature": "nature",
    "Vehicles": "vehicle",
    "Time": "time",
    "Weather": "weather",
    "Jobs": "profession",
    "Toys": "toy",
    "Technology": "technology",
    "Music": "music",
    "Sports": "sport",
    "Common Words": "children illustration",
    "Adjectives": "illustration",
    "Opposites": "symbol",
}


def read_json(path):
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as error:
            last_error = error
            time.sleep(0.4)
    raise last_error


def is_allowed_image_url(image_url):
    return image_url.startswith("https://upload.wikimedia.org/")


def wikipedia_search_titles(term):
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "list": "search",
            "srsearch": term,
            "srlimit": 3,
            "format": "json",
        }
    )
    url = f"https://en.wikipedia.org/w/api.php?{query}"
    try:
        data = get_json(url)
    except Exception:
        return []
    return [item.get("title", "") for item in data.get("query", {}).get("search", []) if item.get("title")]


def wikipedia_image(term):
    title = urllib.parse.quote(term.replace(" ", "_"))
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
    try:
        data = get_json(url)
    except Exception:
        return None

    thumbnail = data.get("thumbnail") or {}
    image_url = thumbnail.get("source")
    if not image_url or not is_allowed_image_url(image_url):
        return None
    return {
        "imageUrl": image_url,
        "sourceUrl": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
        "source": "Wikipedia",
        "term": term,
    }


def commons_image(term):
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "generator": "search",
            "gsrnamespace": 6,
            "gsrlimit": 8,
            "gsrsearch": f'intitle:{term}',
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": 700,
            "format": "json",
        }
    )
    url = f"https://commons.wikimedia.org/w/api.php?{query}"
    try:
        data = get_json(url)
    except Exception:
        return None

    pages = data.get("query", {}).get("pages", {})
    ranked = sorted(pages.values(), key=lambda page: page.get("index", 999))
    for page in ranked:
        image_info = (page.get("imageinfo") or [{}])[0]
        mime = image_info.get("mime", "")
        image_url = image_info.get("thumburl") or image_info.get("url")
        if image_url and mime.startswith("image/") and is_allowed_image_url(image_url):
            return {
                "imageUrl": image_url,
                "sourceUrl": f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(page.get('title', '').replace(' ', '_'))}",
                "source": "Wikimedia Commons",
                "term": term,
            }
    return None


def broad_commons_image(term):
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "generator": "search",
            "gsrnamespace": 6,
            "gsrlimit": 10,
            "gsrsearch": term,
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": 700,
            "format": "json",
        }
    )
    url = f"https://commons.wikimedia.org/w/api.php?{query}"
    try:
        data = get_json(url)
    except Exception:
        return None

    pages = data.get("query", {}).get("pages", {})
    ranked = sorted(pages.values(), key=lambda page: page.get("index", 999))
    for page in ranked:
        image_info = (page.get("imageinfo") or [{}])[0]
        mime = image_info.get("mime", "")
        image_url = image_info.get("thumburl") or image_info.get("url")
        if image_url and mime.startswith("image/") and is_allowed_image_url(image_url):
            return {
                "imageUrl": image_url,
                "sourceUrl": image_info.get("descriptionurl", ""),
                "source": "Wikimedia Commons",
                "term": term,
            }
    return None


def candidate_terms(item):
    word = item["word"]
    category = item["category"]
    hint = CATEGORY_HINTS.get(category, "")
    terms = []

    if " " in word:
        terms.append(word)
        terms.append(word.split()[-1])
    else:
        terms.append(word)

    if hint:
        terms.append(f"{word} {hint}")
    return list(dict.fromkeys(terms))


def find_image(item):
    for term in candidate_terms(item):
        result = wikipedia_image(term)
        if not result:
            for title in wikipedia_search_titles(term):
                result = wikipedia_image(title)
                if result:
                    break
        result = result or commons_image(term) or broad_commons_image(term)
        if result:
            return item["id"], result
        time.sleep(0.05)
    return item["id"], None


def main():
    fallback_only = "--fallback-only" in sys.argv
    words = build_words()
    overrides = read_json(IMAGE_STORE)
    sources = read_json(SOURCE_STORE)
    overrides = {
        word_id: image_url
        for word_id, image_url in overrides.items()
        if isinstance(image_url, str) and is_allowed_image_url(image_url)
    }
    sources = {
        word_id: source
        for word_id, source in sources.items()
        if word_id in overrides
    }
    missing = [item for item in words if not overrides.get(item["id"])]

    print(f"Total words: {len(words)}", flush=True)
    print(f"Already imported: {len(words) - len(missing)}", flush=True)
    print(f"Need images: {len(missing)}", flush=True)

    done = 0
    found = 0
    if not fallback_only:
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(find_image, item) for item in missing]
            for future in as_completed(futures):
                word_id, result = future.result()
                done += 1
                if result:
                    overrides[word_id] = result["imageUrl"]
                    sources[word_id] = result
                    found += 1

                if done % 25 == 0 or done == len(missing):
                    write_json(IMAGE_STORE, overrides)
                    write_json(SOURCE_STORE, sources)
                    print(f"Progress: {done}/{len(missing)} checked, {found} found", flush=True)

        write_json(IMAGE_STORE, overrides)
        write_json(SOURCE_STORE, sources)

    by_word = {item["word"]: item for item in words}
    inherited = 0
    for item in words:
      if overrides.get(item["id"]) or " " not in item["word"]:
          continue
      head_word = item["word"].split()[-1]
      source_item = by_word.get(head_word)
      if source_item and overrides.get(source_item["id"]):
          overrides[item["id"]] = overrides[source_item["id"]]
          sources[item["id"]] = {
              **sources.get(source_item["id"], {}),
              "inheritedFrom": head_word,
          }
          inherited += 1

    fallback = 0
    for item in words:
        if overrides.get(item["id"]):
            continue
        term = item["word"].split()[-1] if " " in item["word"] else item["word"]
        hint = CATEGORY_HINTS.get(item["category"], "").split()[0]
        keywords = [term]
        if hint and hint not in keywords:
            keywords.append(hint)
        keyword_path = ",".join(urllib.parse.quote(keyword) for keyword in keywords if keyword)
        mode = "/all" if len(keywords) > 1 else ""
        lock = int(hashlib.md5(item["id"].encode("utf-8")).hexdigest()[:8], 16) % 100000
        image_url = f"https://loremflickr.com/700/700/{keyword_path}{mode}?lock={lock}"
        overrides[item["id"]] = image_url
        sources[item["id"]] = {
            "imageUrl": image_url,
            "sourceUrl": "https://www.loremflickr.com/",
            "source": "LoremFlickr",
            "term": ",".join(keywords),
            "note": "Fallback keyword image from Flickr Creative Commons pool",
        }
        fallback += 1

    write_json(IMAGE_STORE, overrides)
    write_json(SOURCE_STORE, sources)
    print(f"Imported image links: {found}")
    print(f"Inherited phrase images: {inherited}")
    print(f"Fallback LoremFlickr links: {fallback}")
    print(f"Total with images: {len(overrides)}")


if __name__ == "__main__":
    main()
