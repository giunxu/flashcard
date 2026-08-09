import json
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from data.words import build_words


IMAGE_STORE = PROJECT_DIR / "data" / "image_overrides.json"
STATIC_DATA_DIR = PROJECT_DIR / "static" / "data"
SUPABASE_DIR = PROJECT_DIR / "supabase"


def load_images():
    if not IMAGE_STORE.exists():
        return {}
    return json.loads(IMAGE_STORE.read_text(encoding="utf-8"))


def sql_literal(value):
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def main():
    images = load_images()
    words = []
    for index, item in enumerate(build_words()):
        words.append(
            {
                **item,
                "sortOrder": index,
                "imageUrl": images.get(item["id"], ""),
            }
        )

    STATIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    SUPABASE_DIR.mkdir(parents=True, exist_ok=True)

    (STATIC_DATA_DIR / "words.json").write_text(
        json.dumps(
            {
                "count": len(words),
                "categories": sorted({item["category"] for item in words}),
                "words": words,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    rows = []
    for item in words:
        rows.append(
            "("
            + ", ".join(
                [
                    sql_literal(item["id"]),
                    sql_literal(item["word"]),
                    sql_literal(item["category"]),
                    sql_literal(item["emoji"]),
                    sql_literal(item["meaning"]),
                    sql_literal(item["color"]),
                    sql_literal(item["imageUrl"]),
                    str(item["sortOrder"]),
                ]
            )
            + ")"
        )

    seed_sql = """delete from public.words
where category = 'Common Words';

insert into public.words
  (id, word, category, emoji, meaning, color, image_url, sort_order)
values
"""
    seed_sql += ",\n".join(rows)
    seed_sql += """
on conflict (id) do update set
  word = excluded.word,
  category = excluded.category,
  emoji = excluded.emoji,
  meaning = excluded.meaning,
  color = excluded.color,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;
"""
    (SUPABASE_DIR / "seed_words.sql").write_text(seed_sql, encoding="utf-8")
    print(f"Exported {len(words)} words")


if __name__ == "__main__":
    main()
