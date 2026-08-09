import hashlib
import json
from pathlib import Path


WORD_PHONETICS_FILE = Path(__file__).with_name("word_phonetics.json")


def _load_word_phonetics():
    if not WORD_PHONETICS_FILE.exists():
        return {}
    return json.loads(WORD_PHONETICS_FILE.read_text(encoding="utf-8"))


WORD_PHONETICS = _load_word_phonetics()


CATEGORY_EMOJI = {
    "Animals": "🐶",
    "Food": "🍎",
    "Home": "🏠",
    "School": "🎒",
    "Family": "👨‍👩‍👧",
    "Body": "👋",
    "Clothes": "👕",
    "Colors": "🎨",
    "Numbers": "🔢",
    "Actions": "🏃",
    "Feelings": "😊",
    "Places": "🏫",
    "Nature": "🌳",
    "Vehicles": "🚗",
    "Time": "⏰",
    "Weather": "☀️",
    "Jobs": "👩‍⚕️",
    "Toys": "🧸",
    "Technology": "💻",
    "Music": "🎵",
    "Sports": "⚽",
    "Adjectives": "🌈",
    "Opposites": "↔️",
}


WORD_EMOJI = {
    "dog": "🐶", "cat": "🐱", "fish": "🐟", "bird": "🐦", "duck": "🦆", "cow": "🐮",
    "pig": "🐷", "horse": "🐴", "sheep": "🐑", "chicken": "🐔", "lion": "🦁", "tiger": "🐯",
    "monkey": "🐵", "bear": "🐻", "rabbit": "🐰", "mouse": "🐭", "frog": "🐸", "bee": "🐝",
    "apple": "🍎", "banana": "🍌", "orange": "🍊", "grape": "🍇", "strawberry": "🍓",
    "watermelon": "🍉", "carrot": "🥕", "corn": "🌽", "bread": "🍞", "egg": "🥚",
    "milk": "🥛", "water": "💧", "rice": "🍚", "cake": "🍰", "cookie": "🍪", "pizza": "🍕",
    "house": "🏠", "bed": "🛏️", "chair": "🪑", "table": "🍽️", "door": "🚪", "window": "🪟",
    "book": "📚", "pen": "🖊️", "pencil": "✏️", "bag": "🎒", "school": "🏫", "teacher": "👩‍🏫",
    "mother": "👩", "father": "👨", "baby": "👶", "hand": "✋", "eye": "👁️", "ear": "👂",
    "mouth": "👄", "foot": "🦶", "shirt": "👕", "shoes": "👟", "hat": "🧢", "dress": "👗",
    "red": "🔴", "blue": "🔵", "green": "🟢", "yellow": "🟡", "black": "⚫", "white": "⚪",
    "one": "1️⃣", "two": "2️⃣", "three": "3️⃣", "four": "4️⃣", "five": "5️⃣",
    "run": "🏃", "walk": "🚶", "jump": "🤾", "swim": "🏊", "sleep": "😴", "read": "📖",
    "happy": "😊", "sad": "😢", "angry": "😠", "scared": "😨", "park": "🏞️", "shop": "🏪",
    "tree": "🌳", "flower": "🌸", "sun": "☀️", "moon": "🌙", "star": "⭐", "rain": "🌧️",
    "car": "🚗", "bus": "🚌", "train": "🚆", "bike": "🚲", "boat": "⛵", "plane": "✈️",
    "doctor": "👩‍⚕️", "police": "👮", "firefighter": "👨‍🚒", "ball": "⚽", "doll": "🪆",
    "computer": "💻", "phone": "📱", "music": "🎵", "guitar": "🎸",
}


VI_HINTS = {
    "Animals": "động vật",
    "Food": "đồ ăn",
    "Home": "nhà cửa",
    "School": "trường học",
    "Family": "gia đình",
    "Body": "cơ thể",
    "Clothes": "quần áo",
    "Colors": "màu sắc",
    "Numbers": "số đếm",
    "Actions": "hành động",
    "Feelings": "cảm xúc",
    "Places": "địa điểm",
    "Nature": "thiên nhiên",
    "Vehicles": "phương tiện",
    "Time": "thời gian",
    "Weather": "thời tiết",
    "Jobs": "nghề nghiệp",
    "Toys": "đồ chơi",
    "Technology": "công nghệ",
    "Music": "âm nhạc",
    "Sports": "thể thao",
    "Adjectives": "tính từ",
    "Opposites": "cặp đối nghĩa",
}


WORDS_BY_CATEGORY = {
    "Animals": """
        dog cat puppy kitten fish bird duck cow pig horse sheep goat chicken rooster hen lion tiger
        monkey bear rabbit mouse frog bee butterfly ant spider snake turtle elephant giraffe zebra kangaroo
        panda fox wolf deer owl eagle penguin dolphin whale shark crab lobster octopus seal camel donkey
        hippo rhino squirrel hamster lizard crocodile parrot peacock swan goose turkey worm snail ladybug
        mosquito fly dragonfly bat hedgehog koala leopard cheetah gorilla chimpanzee raccoon
    """,
    "Food": """
        apple banana orange grape strawberry watermelon lemon mango peach pear pineapple coconut cherry kiwi
        carrot potato tomato corn onion cucumber lettuce cabbage broccoli pumpkin mushroom bean pea garlic
        bread egg milk water rice noodle soup cake cookie candy pizza cheese butter yogurt cereal sandwich
        chicken beef pork fish meat sausage hamburger hotdog salad ice cream juice tea coffee honey salt
        sugar pepper flour pancake waffle donut pie chocolate popcorn peanut almond walnut avocado spinach
        radish eggplant pepperoni pasta bacon toast jam jelly cream sauce ketchup
    """,
    "Home": """
        house home room bedroom bathroom kitchen living room garden yard roof wall floor ceiling door window
        bed pillow blanket chair table desk sofa couch lamp clock mirror shelf drawer closet cabinet stove
        oven fridge sink shower toilet bathtub towel soap toothbrush toothpaste plate bowl cup spoon fork
        knife pan pot broom mop vacuum basket carpet curtain key lock stairs elevator balcony garage fence
        phone television remote fan heater air conditioner trash bin box bottle
    """,
    "School": """
        school classroom teacher student class lesson book notebook paper page pen pencil crayon marker ruler
        eraser board chalk desk chair bag backpack lunchbox glue scissors tape folder map globe computer
        tablet library playground homework test quiz answer question letter word sentence story song number
        color shape art music science math reading writing spelling drawing painting break bell calendar
        uniform friend team line door hall principal nurse
    """,
    "Family": """
        mother father mom dad parent child baby brother sister grandmother grandfather grandma grandpa aunt
        uncle cousin family son daughter niece nephew husband wife girl boy man woman friend neighbor people
        adult kid twins relative home love care hug kiss help share visit birthday party
    """,
    "Body": """
        body head hair face eye ear nose mouth tooth teeth tongue lip cheek chin neck shoulder arm elbow
        hand finger thumb nail chest back stomach leg knee foot toe skin bone heart brain blood muscle
        ankle wrist waist hip eyebrow eyelash forehead heel
    """,
    "Clothes": """
        shirt t-shirt pants jeans shorts skirt dress coat jacket sweater hoodie socks shoes boots sandals
        hat cap gloves scarf belt uniform pajamas swimsuit raincoat pocket button zipper collar sleeve
        glasses sunglasses watch ring necklace bracelet mask helmet
    """,
    "Colors": """
        red blue green yellow orange purple pink black white brown gray silver gold violet indigo turquoise
        teal navy lime beige peach maroon cream light dark bright pale colorful clear
    """,
    "Numbers": """
        zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen
        seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand
        first second third fourth fifth sixth seventh eighth ninth tenth half whole many few more less all
        some each every both
    """,
    "Actions": """
        run walk jump hop skip swim climb crawl dance sing read write draw paint cut paste play throw catch
        kick hit push pull open close sit stand sleep wake eat drink cook wash brush clean sweep mop look
        see hear listen smell taste touch talk say tell ask answer laugh cry smile frown hug kiss wave clap
        count spell learn teach think know remember forget find hide seek give take bring carry hold drop
        build break fix make do go come stop start turn move drive ride fly sail shop buy sell pay share
        help wait watch wear choose
    """,
    "Feelings": """
        happy sad angry mad scared afraid worried calm excited surprised tired sleepy bored proud shy brave
        kind friendly lonely hungry thirsty sick hurt okay fine better best upset silly curious confused
        safe sorry glad grumpy cheerful peaceful nervous
    """,
    "Places": """
        park zoo shop store market school library museum hospital clinic bank post office restaurant cafe
        bakery farm beach mountain river lake forest city town village street road bridge station airport
        harbor hotel room house home garden playground cinema theater pool field office factory church temple
        mosque castle island
    """,
    "Nature": """
        tree flower grass leaf branch root seed plant fruit vegetable sun moon star sky cloud rain snow wind
        storm thunder lightning rainbow river lake sea ocean beach sand rock stone mountain hill valley forest
        field farm desert island volcano earth world soil mud fire water ice air animal insect bird fish
        shell wave pond waterfall
    """,
    "Vehicles": """
        car bus train bike bicycle scooter motorbike truck van taxi ambulance police car fire truck boat ship
        plane airplane helicopter rocket tractor subway tram ferry skateboard sled carriage stroller elevator
        escalator wheel tire engine seat belt road railway station stop traffic light
    """,
    "Time": """
        time clock watch morning noon afternoon evening night day week month year today tomorrow yesterday
        minute hour second weekend birthday holiday breakfast lunch dinner bedtime sunrise sunset spring summer
        autumn fall winter January February March April May June July August September October November December
        Monday Tuesday Wednesday Thursday Friday Saturday Sunday early late soon now then before after always
        never sometimes often
    """,
    "Weather": """
        sunny rainy cloudy windy snowy stormy hot cold warm cool wet dry foggy icy freezing rainbow thunder
        lightning storm snow rain cloud wind sunshine shadow temperature umbrella coat boots puddle weather
        breeze drizzle hail
    """,
    "Jobs": """
        teacher doctor nurse dentist police firefighter farmer driver pilot cook chef baker singer dancer
        artist painter writer actor builder worker engineer scientist astronaut soldier sailor shopkeeper
        waiter waitress cleaner mechanic gardener librarian photographer musician
    """,
    "Toys": """
        toy ball doll teddy bear blocks puzzle kite balloon robot car train plane boat yo-yo marbles game
        cards book crayons clay drum whistle bike scooter swing slide sandbox hoop rope sticker
    """,
    "Technology": """
        computer laptop tablet phone camera television radio screen keyboard mouse printer speaker headphone
        microphone charger battery cable button app game video photo message internet website robot tablet
        remote clock calculator light switch
    """,
    "Music": """
        music song sound note beat rhythm drum guitar piano violin flute trumpet bell whistle singer band
        dance clap listen loud soft quiet voice choir radio
    """,
    "Sports": """
        sport ball soccer football basketball baseball tennis volleyball badminton swimming running jumping
        skating skiing cycling boxing golf race team player coach goal score win lose throw catch kick hit
        racket net hoop field court pool helmet
    """,
    "Adjectives": """
        big small little large tall short long wide narrow high low fast slow new old young good bad nice
        kind mean clean dirty easy hard soft loud quiet sweet sour salty spicy heavy light full empty open
        closed hot cold warm cool wet dry right wrong same different beautiful pretty ugly funny serious
        strong weak rich poor round square flat sharp smooth rough fresh bright dark early late careful
        safe dangerous busy free ready
    """,
    "Opposites": """
        up down in out on off over under near far left right front back top bottom inside outside yes no
        true false day night hello goodbye start finish begin end first last here there this that these those
        before after with without
    """,
}


def _split_words(text):
    return [word.strip().lower() for word in text.split() if word.strip()]


def _color_for(word):
    palette = [
        "#ff7aa2", "#ffb86b", "#ffe66d", "#70e000", "#4cc9f0", "#80ed99",
        "#bdb2ff", "#ffc6ff", "#9bf6ff", "#ffd166", "#06d6a0", "#f72585",
    ]
    digest = hashlib.md5(word.encode("utf-8")).digest()
    return palette[digest[0] % len(palette)]


def _entry(word, category):
    clean = word.replace("_", " ")
    return {
        "id": f"{category.lower().replace(' ', '-')}-{clean.replace(' ', '-')}",
        "word": clean,
        "category": category,
        "emoji": WORD_EMOJI.get(clean, CATEGORY_EMOJI.get(category, "⭐")),
        "meaning": "",
        "phonetic": WORD_PHONETICS.get(clean, clean),
        "color": _color_for(clean),
    }


def build_words():
    seen = set()
    items = []

    for category, text in WORDS_BY_CATEGORY.items():
        for word in _split_words(text):
            if word not in seen:
                seen.add(word)
                items.append(_entry(word, category))

    return items
