#!/usr/bin/env python3
"""
Re-map every wishlist <img class="wish-img"> to a thematically appropriate
image drawn from the user's own curated Instagram moodboard in
assets/reference/instagram/, plus the handful of local reference photos in
assets/. Round-robin within each theme bucket so images don't repeat too
often across adjacent cards. Idempotent.
"""
import re, os, sys, json, pathlib, html, random, itertools

ROOT = pathlib.Path("/Users/bharaths/conductor/workspaces/manai/indianapolis")
HTML_PATH = ROOT / "wishlist.html"
IG_DIR = ROOT / "assets" / "reference" / "instagram"
POSTS_JSON = IG_DIR / "posts.json"

# ---------- 1. Categorise each Instagram image by theme ----------
# Themes we want buckets for: entry, pooja, lift, living, dining, bedroom,
# kitchen, bath, sitout, terrace, flex, lighting, furniture, textile, tech,
# art, wood-detail.
posts = json.loads(POSTS_JSON.read_text())

def tags_for(post):
    desc = (post.get("description") or "").lower()
    user = post.get("username", "").lower()
    tags = set()
    def has(*ks): return any(k in desc for k in ks)
    if has("bathroom", "bath ", "washroom", "spa-like", "washlet"): tags.add("bath")
    if has("bedroom", "master bedroom", "спальни"): tags.add("bedroom")
    if has("kitchen", "dinning", "dining"):
        tags.add("kitchen"); tags.add("dining")
    if has("pooja", "அகம்"): tags.add("pooja")
    if has("living room", "living "): tags.add("living")
    if has("entrance", "entry", "foyer", "threshold", "partition"): tags.add("entry")
    if has("home office", "workstation", "study"): tags.add("workstation")
    if has("courtyard", "verandah", "outdoor", "garden", "terrace", "garden screen"):
        tags.add("terrace"); tags.add("sitout")
    if has("brick", "wall cladding", "stone", "facade"):
        tags.add("entry"); tags.add("terrace")
    if has("wood", "teak", "solid wood", "timber"):
        tags.add("furniture"); tags.add("wood")
    if has("lighting", "lamp", "pendant"):
        tags.add("lighting")
    if has("chettinad", "tharavadu", "tamil", "gond", "mansion", "heritage"):
        tags.add("heritage"); tags.add("living")
    # Nothing detected → goes to "general"
    if not tags:
        tags.add("general")
    # Every post is also a valid "general" fallback
    tags.add("any")
    return tags

def ig_path(img_name):
    # posts.json uses the filename; ensure it's a jpg that actually exists
    # (some posts carry .webp or .mp4 — skip non-jpg/webp stills)
    p = IG_DIR / img_name
    if p.suffix.lower() in (".mp4",):
        return None
    if not p.exists():
        return None
    return f"assets/reference/instagram/{img_name}"

buckets = {}  # theme -> list[ rel_path ]
for post in posts:
    for img in post["images"]:
        rel = ig_path(img)
        if not rel:
            continue
        for t in tags_for(post):
            buckets.setdefault(t, []).append(rel)

# Local non-IG refs we can also weave in
LOCAL = {
    "entry":      ["assets/shoe-rack-ref.png", "assets/tiles-reference.png"],
    "pooja":      [],
    "lift":       ["assets/johnson-sukranti-p1.jpg", "assets/johnson-sukranti-p2.jpg",
                   "assets/johnson-sukranti-p3.jpg", "assets/johnson-sukranti-p4.jpg"],
    "living":     ["assets/stained-glass-door-ref.png",
                   "assets/johnson-sukranti-teak-p7.jpg",
                   "assets/johnson-sukranti-teak-p12.jpg",
                   "assets/johnson-sukranti-teak-p15.jpg"],
    "dining":     ["assets/johnson-sukranti-teak-p15.jpg"],
    "bedroom":    ["assets/johnson-sukranti-teak-p7.jpg",
                   "assets/johnson-sukranti-teak-p12.jpg"],
    "kitchen":    [],
    "bath":       [],
    "sitout":     ["assets/plants-plan-ref.png"],
    "terrace":    ["assets/plants-plan-ref.png"],
    "furniture":  ["assets/johnson-sukranti-teak-p7.jpg",
                   "assets/johnson-sukranti-teak-p12.jpg",
                   "assets/johnson-sukranti-teak-p15.jpg"],
    "lighting":   [],
    "textile":    [],
    "workstation":[],
    "heritage":   ["assets/stained-glass-door-ref.png", "assets/tiles-reference.png"],
    "wood":       ["assets/johnson-sukranti-teak-p7.jpg"],
    "any":        ["assets/hero-banner.png", "assets/color-palette.png"],
}
for k, vs in LOCAL.items():
    buckets.setdefault(k, []).extend(vs)

# De-dupe & stabilise order
for k in list(buckets):
    buckets[k] = list(dict.fromkeys(buckets[k]))

# ---------- 2. Map each wish card's title → priority theme list ----------
# First theme is most-preferred; we fall back down the list.
THEME_RULES = [
    # (regex of title/label, [themes in priority order])
    (r"(washlet|wc|flush|toilet|bidet|duravit|geberit|toto|bathroom|bath |rain shower|shower|vessel basin|counter basin|brass rain|zellige|stone basin|bathroom mirror|mirror)",
        ["bath", "any"]),
    (r"(oonjal|swing|living|lounge|daybed|sofa|floor cushion|dhurrie rug|rug|stained-glass|stained glass|chandelier|ceiling lantern|hammered brass coffee|bolster|gadi|coffee table)",
        ["living", "heritage", "furniture", "any"]),
    (r"(dining|dining chair|cane-back|sideboard|table runner|water jug|jug|tumbler|brass water)",
        ["dining", "kitchen", "any"]),
    (r"(bed(side|room)?|master bedroom|wardrobe|mattress|hastens|saatva|bedding|razai|kantha|blanket chest|oil lamp|headboard|dresser|vanity|dressing|cabinet pull|rosewood|hanger|hangers|night|pillow)",
        ["bedroom", "furniture", "any"]),
    (r"(kitchen|kadappa|counter|tap|faucet|masala|copper|dabba|open teak shelving|pull-out)",
        ["kitchen", "dining", "any"]),
    (r"(pooja|altar|kuthu vilakku|deepam|kumbham|pooja floor|tanjore|krishna|ganesha|lakshmi|urli|nataraja|bronze|idol|panchaloha|temple)",
        ["pooja", "heritage", "any"]),
    (r"(entrance door|numeral|doormat|threshold|entry|bell|cord pull|foyer|kolam)",
        ["entry", "heritage", "any"]),
    (r"(parking|utility|oxide slab|staff|hooks|utility sink)",
        ["entry", "terrace", "any"]),
    (r"(lift|stairwell|balustrade|riser|landing lantern|stairs)",
        ["lift", "heritage", "furniture", "any"]),
    (r"(sit-out|patio|sitout|planter|pergola|garden|terrace|rope-swung|festoon|garden lantern|areca|banana|tulsi|plants)",
        ["sitout", "terrace", "any"]),
    (r"(prayer|jali|meditation|peacock|sky panel|diya holder)",
        ["pooja", "terrace", "heritage", "any"]),
    (r"(flex|bookshelf|library|studio)",
        ["living", "workstation", "any"]),
    (r"(workstation|chandigarh|task lamp|studio display|apple|nataraja shelf|floating teak shelf)",
        ["workstation", "furniture", "any"]),
    (r"(lighting|pendant|bamboo pendant|wall sconce|stair sconce|tripod|floor lamp|task|solace|tango|klove|paul matter|oorjaa|anemos)",
        ["lighting", "living", "any"]),
    (r"(curtain|runner|kalamkari|ajrakh|sungudi|linen|maku|anavila|textile|throw|bolster|stripe|dhurrie)",
        ["textile", "bedroom", "living", "any"]),
    (r"(switch|lutron|schneider|fan|daikin|dyson|eero|apple tv|sonos|samsung the frame|purifier|tech)",
        ["workstation", "any"]),
    (r"(art|oleograph|raja ravi varma|tanjore|coffee-table book|swamimalai|ayyanar|terracotta|madurai)",
        ["living", "heritage", "art", "any"]),
    (r"(teak|wood|carved|cabinet|shelving|sideboard|bench|chest|hanger)",
        ["furniture", "wood", "any"]),
]

def themes_for(title):
    low = title.lower()
    for rx, themes in THEME_RULES:
        if re.search(rx, low):
            return themes
    return ["any"]

# ---------- 3. Iterate wish cards, pick an image per card ----------
src = HTML_PATH.read_text()

# Round-robin cursors within each bucket, shuffled with a fixed seed for
# reproducibility.
rng = random.Random(17)
for k in buckets:
    order = list(buckets[k])
    rng.shuffle(order)
    buckets[k] = order
cursors = {k: itertools.cycle(v) for k, v in buckets.items() if v}

# Use lookahead on each <article class="wish-card"> ... </article>. Inside it,
# we find <img class="wish-img" ... src="..."> and rewrite the src based on
# the wish-title found inside the same card.
card_re = re.compile(r'(<article class="wish-card">)(.*?)(</article>)', re.DOTALL)
img_src_re = re.compile(r'(<img class="wish-img"[^>]*?\bsrc=")([^"]+)(")')
title_re = re.compile(r'<span class="wish-title">\s*(.*?)\s*</span>', re.DOTALL)
alt_re = re.compile(r'(\balt=")([^"]*)(")')

preserved = set([  # already-good refs we never want to replace
    "assets/johnson-sukranti-p1.jpg",
    "assets/johnson-sukranti-p2.jpg",
    "assets/johnson-sukranti-p3.jpg",
    "assets/johnson-sukranti-p4.jpg",
    "assets/johnson-sukranti-teak-p7.jpg",
    "assets/johnson-sukranti-teak-p12.jpg",
    "assets/johnson-sukranti-teak-p15.jpg",
    "assets/tiles-reference.png",
    "assets/stained-glass-door-ref.png",
    "assets/shoe-rack-ref.png",
    "assets/plants-plan-ref.png",
    "assets/color-palette.png",
])

replacements = {"count": 0, "missed": 0}

def rewrite_card(m):
    head, body, tail = m.group(1), m.group(2), m.group(3)
    img_m = img_src_re.search(body)
    if not img_m:
        return m.group(0)
    current_src = img_m.group(2)
    if current_src in preserved:
        return m.group(0)  # keep local curated refs
    title_m = title_re.search(body)
    title = re.sub(r"\s+", " ",
                   re.sub(r"<[^>]+>", " ",
                          html.unescape(title_m.group(1)) if title_m else "")
                   ).strip()
    for theme in themes_for(title):
        cur = cursors.get(theme)
        if not cur:
            continue
        new_src = next(cur)
        body = img_src_re.sub(lambda _m: _m.group(1) + new_src + _m.group(3), body, count=1)
        # refresh alt to the title
        safe_alt = title.replace('"', "&quot;")
        body = alt_re.sub(lambda _m: _m.group(1) + safe_alt + _m.group(3), body, count=1)
        replacements["count"] += 1
        return head + body + tail
    replacements["missed"] += 1
    return m.group(0)

new_src = card_re.sub(rewrite_card, src)
HTML_PATH.write_text(new_src)
print(f"Rewrote {replacements['count']} cards, missed {replacements['missed']}.")
print(f"Bucket sizes: " + ", ".join(f"{k}:{len(v)}" for k, v in sorted(buckets.items())))
