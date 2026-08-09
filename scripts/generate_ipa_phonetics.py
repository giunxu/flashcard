import json
import sys
from pathlib import Path

import eng_to_ipa

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from data.words import build_words


OUTPUT_PATH = PROJECT_DIR / "data" / "word_phonetics.json"

MANUAL_IPA = {
    "dragonfly": "ˈdræɡənˌflaɪ",
    "hoodie": "ˈhʊdi",
    "lunchbox": "ˈlʌntʃˌbɑks",
    "t-shirt": "ˈtiːˌʃɝt",
    "yo-yo": "ˈjoʊˌjoʊ",
    "do": "duː",
}


def main():
    words = []
    seen = set()
    for item in build_words():
        word = item["word"].lower()
        if word not in seen:
            seen.add(word)
            words.append(word)

    phonetics = {}
    missing = []
    for word in words:
        if word in MANUAL_IPA:
            phonetics[word] = MANUAL_IPA[word]
            continue
        converted = eng_to_ipa.convert(word).strip().replace("ʧ", "tʃ").replace("ʤ", "dʒ")
        if not converted or "*" in converted:
            missing.append(word)
            continue
        phonetics[word] = converted

    if missing:
        raise RuntimeError(f"Missing IPA for {len(missing)} words: {', '.join(missing)}")

    OUTPUT_PATH.write_text(
        json.dumps(phonetics, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    print(f"Wrote {len(phonetics)} IPA entries to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
