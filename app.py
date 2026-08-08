import json
import os
import shutil
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from data.words import build_words


app = FastAPI(title="English For Kids")
app.mount("/static", StaticFiles(directory="static"), name="static")

DATA_DIR = Path("data")
UPLOAD_DIR = Path("static/uploads")
IMAGE_STORE = DATA_DIR / "image_overrides.json"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def load_image_overrides():
    if not IMAGE_STORE.exists():
        return {}
    return json.loads(IMAGE_STORE.read_text(encoding="utf-8"))


def save_image_overrides(overrides):
    IMAGE_STORE.write_text(
        json.dumps(overrides, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def words_with_images():
    overrides = load_image_overrides()
    return [
        {
            **item,
            "imageUrl": overrides.get(item["id"], ""),
        }
        for item in build_words()
    ]


WORDS = build_words()
WORD_IDS = {item["id"] for item in WORDS}


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.get("/api/words")
def words():
    enriched_words = words_with_images()
    return {
        "count": len(enriched_words),
        "categories": sorted({item["category"] for item in enriched_words}),
        "words": enriched_words,
    }


@app.post("/api/words/{word_id}/image")
async def save_word_image(
    word_id: str,
    image_url: str = Form(default=""),
    image_file: UploadFile | None = File(default=None),
):
    if word_id not in WORD_IDS:
        raise HTTPException(status_code=404, detail="Word not found")

    overrides = load_image_overrides()
    image_url = image_url.strip()

    if image_file and image_file.filename:
        content_type = image_file.content_type or ""
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        suffix = Path(image_file.filename).suffix.lower() or ".jpg"
        safe_name = f"{word_id}{suffix}"
        target = UPLOAD_DIR / safe_name
        with target.open("wb") as output:
            shutil.copyfileobj(image_file.file, output)
        image_url = f"/static/uploads/{safe_name}"

    if image_url:
        overrides[word_id] = image_url
    else:
        overrides.pop(word_id, None)

    save_image_overrides(overrides)
    return {"ok": True, "wordId": word_id, "imageUrl": overrides.get(word_id, "")}


@app.get("/api/health")
def health():
    return {"ok": True, "count": len(WORDS)}


app.mount("/", StaticFiles(directory="static", html=True), name="site")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
