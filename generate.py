#!/usr/bin/env python3
"""Generate a Tailwind v4 theme.css from Figma token exports.

Colors are emitted as OKLCH. Figma can only store hex, so the exported values
are 8-bit roundings of colors that are really defined in OKLCH; every primitive
in this system is a Tailwind palette color, so the canonical OKLCH value is
read straight from the installed Tailwind and used instead of the rounded hex.
Anything without a Tailwind counterpart is converted from its hex.
"""
import json, re, os, math

HERE = os.path.dirname(__file__)
T = os.path.join(HERE, "tokens")
TW_THEME = os.path.join(HERE, "node_modules", "tailwindcss", "theme.css")

# ---------- the neutral role ----------
# Nine ramps in the palette are neutrals. The semantic layer never names one of
# them directly: it goes through an eleven-step alias tier, --neutral-*, so the
# whole system's neutral is one attribute on <html>. Which ramps count as
# neutral is a policy, not a Figma value, so the list lives here.
NEUTRAL_SCALES = ["stone", "taupe", "mauve", "mist", "olive",
                  "slate", "gray", "zinc", "neutral"]
NEUTRAL_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

# The ramp a semantic alias means when it says "Stone": @Stone/N resolves to the
# tier, not the ramp. Same shape as the border-radius/rounded-md -> --radius-md
# translation below.
#
# Figma DID grow a real neutral collection on 2026-08-31 -- "Neutral Palette",
# 50..950 across the same nine modes -- and every semantic neutral now aliases
# it. The rule survives anyway because nobody has seen how the exporter spells
# an alias into it: those variables are named bare numbers, so "@800" carries no
# ramp and "@Neutral/800" collides with Tailwind's Neutral, which Data Viz uses.
# One re-export settles it. Until then the JSON on disk still says @Stone/N, and
# that was verified against Figma by diff, not assumed.
#
# There was a second rule beside it, renaming Decorative/Stone to
# Decorative/Neutral. Figma has since renamed it at source, so it is gone.
NEUTRAL_ROLE = "Stone"

# ---------- the navigation theme ----------
# A second swappable collection, and deliberately NOT built like the neutral
# one. All but one of its modes are absolute: a nav on "neutral" is white in
# dark mode too, because a navigation surface is a brand decision, not a reading
# preference. Only "canvas" aliases back into the semantic layer, so only that
# mode follows .dark -- which falls out for free, since those aliases resolve to
# --surface-* / --content-* and .dark redefines those on the same <html> element.
#
# "canvas" was called "transparent" and its Background was Surface/Canvas at
# alpha 0, so the bar dissolved into the page. It is the canvas colour itself
# now: the nav sits flush with the page rather than disappearing into it, which
# is what the new name says. Renamed in Figma 2026-09-02.
#
# The order is Figma's, and the first entry is Figma's default mode.
NAV_MODES = ["neutral-inverse", "neutral", "canvas", "blue-inverse", "blue",
             "purple-inverse", "purple", "pink-inverse", "pink"]

# The ramps Figma has no room for. A variable collection can only hold so many
# modes, and Navigation Theme is full at nine -- so the rest of the palette is
# built here instead. These are NOT in navigation.json, which stays exactly what
# it says it is: the Figma export, and nothing else. A re-export overwrites that
# file wholesale, and anything hand-added to it would go with it.
#
# Tailwind's own spectrum order, minus the three the export already carries.
NAV_CODE_RAMPS = ["red", "orange", "amber", "yellow", "lime", "green",
                  "emerald", "teal", "cyan", "sky", "indigo", "violet",
                  "fuchsia", "rose"]

# Each one is Blue's recipe with the ramp name swapped -- read out of the export
# rather than written down here, so there is exactly one copy of it. Retune Blue
# in Figma and all twenty-eight derived modes follow on the next run.
NAV_RECIPE = "blue"

# ...with one correction, and it is about contrast rather than taste.
#
# Nav Content/Subtle in the light variant is 12px text on a step-50 background
# -- the SideNav group headers -- so it owes 4.5:1, not the 3:1 a glyph owes.
# Blue clears that at step 600 with almost nothing to spare (4.82:1), and it
# only clears it because blue is unusually dark at 600. Thirteen of the
# seventeen ramps do not: yellow is 2.83:1, amber 3.08, teal 3.51, rose 4.10.
# Step 700 clears it on every ramp in the palette, worst green at 4.72:1.
#
# So the derived ramps take 700 there, and Blue's own 600 is left alone -- it
# passes, and it is Figma's value, which this file does not get to overrule.
# One step for all fourteen rather than a per-ramp table: indigo and violet
# would scrape through at 600, but "the two that happen to be dark enough" is
# not a rule anybody can hold in their head, and the visual weight of a group
# header should not wander across the family.
#
# None of this touches the inverse variant, which clears 4.5:1 at step 300 on
# every ramp (worst rose, 5.01:1), or Nav Content/Primary, which clears it on
# all three of its grounds (worst green, 4.72:1).
#
# The rule is enforced rather than trusted: nav-contrast.test.ts measures every
# pair the Nav components actually paint, over every mode, and a ramp added
# above that fails will fail the suite instead of shipping.
NAV_RECIPE_OVERRIDES = {
    ("Nav Content/Subtle", "light"): 700,
}

def load(name):
    with open(os.path.join(T, name)) as f:
        return json.load(f)

def load_optional(name):
    """A token file that may not exist yet.

    motion.json is the only one today. Its ten variables are hand-seeded from
    Astryx's motion scale because Figma does not have them yet; they use the
    same [{n, t, v}] shape as every real export, so once the variables exist in
    Figma they arrive through dimensions.json instead and deleting motion.json
    is the whole migration.
    """
    path = os.path.join(T, name)
    return json.load(open(path)) if os.path.exists(path) else []

prims = load("primitives.json")
sem = load("semantic.json")
dims = load("dimensions.json") + load_optional("motion.json")
navs = load("navigation.json")

# Derive the code-only modes, one ramp at a time, straight onto the rows the
# export just produced. They come out in the same "@Teal/900" shape a Figma
# alias has, so everything downstream -- resolve(), nav_slug(), nav_block(), the
# @theme inline exposure -- stays generic over NAV_MODES and needs to know
# nothing about where a mode came from.
NAV_STEP_RE = re.compile(r"@([A-Za-z]+)/(\d+)$")
_prim_names = {p["n"] for p in prims}

for _ramp in NAV_CODE_RAMPS:
    _title = _ramp.capitalize()
    for _row in navs:
        for _variant, _src in (("inverse", NAV_RECIPE + "-inverse"),
                               ("light", NAV_RECIPE)):
            _m = NAV_STEP_RE.match(_row[_src])
            if not _m:
                # Blue stopped being a plain ramp step, so there is no recipe
                # left to copy. Fail rather than emit twenty-eight wrong modes.
                raise SystemExit(
                    f"navigation: cannot derive from {_src} — "
                    f"{_row['n']} is {_row[_src]!r}, not a @Ramp/step alias")
            _step = NAV_RECIPE_OVERRIDES.get((_row["n"], _variant),
                                             int(_m.group(2)))
            if f"{_title}/{_step}" not in _prim_names:
                raise SystemExit(
                    f"navigation: {_title}/{_step} is not in primitives.json, "
                    f"so {_ramp} has no step for {_row['n']}")
            _row[f"{_ramp}-inverse" if _variant == "inverse" else _ramp] = \
                f"@{_title}/{_step}"
    NAV_MODES += [f"{_ramp}-inverse", _ramp]

def slug(name):
    """Figma variable name -> CSS custom property name (without the leading --).

    Handled per path segment, because a leading + or - carries meaning. Figma
    names the two arms of a diverging scale "-08".."-01" and "+01".."+08". The
    old version replaced "/" with "-" and then collapsed runs of dashes, which
    silently ate the minus sign and left the plus sign intact — producing
    "data-viz-diverging-08" for the negative arm and "data-viz-diverging-+01"
    for the positive one. "+" is not legal in a CSS identifier, so every "+"
    token was dropped by the browser, and collapsing the two arms onto the same
    names would have been just as wrong. Both signs are now spelled out.
    """
    parts = []
    for raw in name.split("/"):
        p = raw.strip().lower()
        if p.startswith("+"):
            p = "pos-" + p[1:]
        elif p.startswith("-"):
            p = "neg-" + p[1:]
        # Anything else outside [a-z0-9-] becomes a dash rather than surviving
        # into the output and breaking the declaration.
        p = re.sub(r"[^a-z0-9-]+", "-", p)
        parts.append(p)
    s = "-".join(parts)
    s = re.sub(r"-+", "-", s).strip("-")
    return s

# ---------- color: hex -> OKLCH ----------
def _srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def _fmt(x, nd):
    s = f"{round(x, nd):f}".rstrip("0").rstrip(".")
    return s if s not in ("", "-0") else "0"

def hex_to_oklab(h):
    """'#rrggbb' or '#rrggbbaa' -> (L, a, b, alpha) in OKLab."""
    s = h.lstrip("#")
    a = 1.0
    if len(s) == 8:
        a = int(s[6:8], 16) / 255
        s = s[:6]
    r, g, b = (int(s[i:i + 2], 16) / 255 for i in (0, 2, 4))
    r, g, b = _srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    t = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, t_ = l ** (1 / 3), m ** (1 / 3), t ** (1 / 3)
    return (0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * t_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * t_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * t_,
            a)

def oklch_str_to_oklab(s):
    """'oklch(63.7% 0.237 25.331)' -> (L, a, b). Hue may be the keyword `none`."""
    m = re.match(r"oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+|none)", s)
    if not m:
        return None
    L, C = float(m.group(1)) / 100, float(m.group(2))
    H = 0.0 if m.group(3) == "none" else float(m.group(3))
    return L, C * math.cos(math.radians(H)), C * math.sin(math.radians(H))

def hex_to_oklch(h):
    """'#rrggbb' or '#rrggbbaa' -> an oklch() string."""
    L, A, B, a = hex_to_oklab(h)
    C = math.hypot(A, B)
    # Achromatic colors get hue `none`, matching how Tailwind writes them.
    if C < 1e-6:
        chroma, hue = "0", "none"
    else:
        chroma, hue = _fmt(C, 4), _fmt(math.degrees(math.atan2(B, A)) % 360, 3)
    out = f"oklch({_fmt(L * 100, 1)}% {chroma} {hue}"
    # Alpha is stored 8-bit in Figma, so 10% arrives as 26/255 = 0.10196.
    # Rounded to 2dp to give back the round number that was designed; the
    # largest possible shift is 1/510 of an alpha step.
    return out + (f" / {_fmt(a, 2)})" if a < 1 else ")")

def load_tailwind_palette():
    """'red-500' -> 'oklch(...)', exactly as the installed Tailwind ships it."""
    if not os.path.exists(TW_THEME):
        return {}
    css = open(TW_THEME).read()
    return {m.group(1): m.group(2)
            for m in re.finditer(r"--color-([a-z]+-\d+):\s*(oklch\([^)]*\))", css)}

TW = load_tailwind_palette()
stats = {"tailwind": 0, "converted": 0, "unmatched": [], "drifted": []}

# Storing a color as 8-bit hex moves it slightly; across this whole palette the
# largest such rounding measured 0.027 in OKLab. Anything past this threshold is
# too big to be rounding, so it is a real edit made in Figma.
HEX_ROUNDING_TOLERANCE = 0.05

def primitive_value(name, hexval):
    """Tailwind is the source of truth for primitives.

    Figma cannot express OKLCH, so its hex is treated as an approximation and
    Tailwind's canonical value wins. That means a color deliberately changed in
    Figma would be ignored — so any disagreement too large to be hex rounding is
    reported rather than silently discarded.
    """
    if name in TW:
        stats["tailwind"] += 1
        tw_lab, fig_lab = oklch_str_to_oklab(TW[name]), hex_to_oklab(hexval)
        if tw_lab:
            d = math.dist(tw_lab, fig_lab[:3])
            if d > HEX_ROUNDING_TOLERANCE:
                stats["drifted"].append((name, hexval, TW[name], d))
        return TW[name]
    stats["converted"] += 1
    if re.fullmatch(r"[a-z]+-\d+", name):
        stats["unmatched"].append(name)
    return hex_to_oklch(hexval)

def px2rem(v):
    if v == 0:
        return "0"
    r = round(v / 16, 4)
    s = ("%f" % r).rstrip("0").rstrip(".")
    return f"{s}rem"

# ---- the neutral role: Figma's "Stone" is the alias tier, not the ramp ----
# '#rrggbb' (lowercase, no alpha) -> step, for the default ramp only. Used to
# recognize the alpha variants the semantic layer stores as raw hex.
NEUTRAL_ROLE_HEX = {p["v"].lower(): p["n"].split("/", 1)[1]
                    for p in prims
                    if p["n"].startswith(NEUTRAL_ROLE + "/")}

stats["neutralized"] = []

def neutral_step(target):
    """'Stone/800' -> '800', else None."""
    head, _, step = target.partition("/")
    return step if head == NEUTRAL_ROLE and step else None

def neutral_alpha(hexval):
    """A raw hex that is a neutral-role step with an alpha -> a color-mix on the tier.

    Ten of the eleven raw colors in the semantic layer are exactly this: ghost
    backgrounds, both overlays and both shadows are the neutral at some alpha.
    Emitted as oklch() they would freeze at Stone and stay stone-tinted on every
    other ramp — which is what makes a swap look half-applied. white, black and
    the Data Viz accessibility border do not match and stay literal.
    """
    h = hexval.lstrip("#").lower()
    if len(h) != 8:
        return None
    step = NEUTRAL_ROLE_HEX.get("#" + h[:6])
    if step is None:
        return None
    # Alpha is stored 8-bit in Figma, so 10% arrives as 26/255; round to 2dp to
    # give back the round number that was designed, exactly as hex_to_oklch does.
    pct = _fmt(round(int(h[6:8], 16) / 255, 2) * 100, 1)
    return f"color-mix(in oklab, var(--neutral-{step}) {pct}%, transparent)"

# ---- global alias map: original figma name -> css var() reference ----
ref = {}
for p in prims:
    ref[p["n"]] = f"var(--color-{slug(p['n'])})"
for s in sem:
    ref[s["n"]] = f"var(--{slug(s['n'])})"

# Figma stores an alias-times-opacity as a COMPOSE_COLOR expression. The
# exporter spells it "COMPOSE_COLOR(@Surface/Canvas, 0)"; the second argument is
# the alpha, 0..1. Same output shape as neutral_alpha above, so a composed color
# reads the same wherever it came from -- and it keeps pointing at the token
# Figma points at, rather than at whichever token happens to have the same value
# today.
COMPOSE_RE = re.compile(r"^COMPOSE_COLOR\((.+),\s*([0-9.]+)\)$")

def resolve(val):
    if isinstance(val, str):
        m = COMPOSE_RE.match(val)
        if m:
            base, alpha = m.group(1), float(m.group(2))
            return (f"color-mix(in oklab, {resolve(base)} "
                    f"{_fmt(round(alpha * 100, 2), 1)}%, transparent)")
    if isinstance(val, str) and val.startswith("@"):
        target = val[1:]
        # "Neutral Palette" is Figma's real neutral collection, whose variables
        # are named as bare steps. It is the same eleven-step tier --neutral-*
        # already is, so an alias into it lands there and a nav on a neutral
        # mode keeps following <html data-neutral>. Spelled out in the export
        # rather than left as "@900", which would carry no ramp at all.
        if target.startswith("Neutral Palette/"):
            return f"var(--neutral-{target.split('/', 1)[1]})"
        # A semantic token names a *step of the neutral*, never a step of Stone.
        step = neutral_step(target)
        if step:
            return f"var(--neutral-{step})"
        return ref.get(target, f"/* unresolved: {target} */")
    # Raw colors in the semantic layer are alpha variants of the palette; they
    # get the same OKLCH treatment so no hex survives into the output.
    if isinstance(val, str) and val.startswith("#"):
        mixed = neutral_alpha(val)
        if mixed:
            stats["neutralized"].append((val, mixed))
            return mixed
        return hex_to_oklch(val)
    return val

# ---- 1. primitives (static -> @theme) ----
prim_lines = [f"  --color-{slug(p['n'])}: {primitive_value(slug(p['n']), p['v'])};" for p in prims]

# ---- 2. semantic (theme-aware -> :root / .dark) ----
light_lines, dark_lines = [], []
for s in sem:
    v = slug(s["n"])
    light_lines.append(f"  --{v}: {resolve(s['light'])};")
    dark_lines.append(f"  --{v}: {resolve(s['dark'])};")
# expose semantics as color utilities via @theme inline
sem_theme_lines = [f"  --color-{slug(s['n'])}: var(--{slug(s['n'])});" for s in sem]

# ---- 3. dimensions ----
radius, text_fs, text_lh, blur, fweight = {}, {}, {}, {}, {}
fonts = {}
border_w, opacity, extras = {}, {}, {}
shadows_drop, shadows_inner = {}, {}
durations, eases = {}, {}

for d in dims:
    n, t, v = d["n"], d["t"], d["v"]
    if n.startswith("border-radius/rounded-"):
        key = n.split("rounded-", 1)[1]
        radius[key] = "9999px" if v == 9999 else px2rem(v)
    elif n.startswith("text/"):
        _, size, prop = n.split("/")
        if prop == "font-size": text_fs[size] = px2rem(v)
        else: text_lh[size] = px2rem(v)
    elif n.startswith("blur/"):
        blur[n.split("/")[1]] = f"{int(v)}px"
    elif n.startswith("font-weight/"):
        key = n.split("/")[1]
        if key in ("normal", "semibold", "bold"): fweight[key] = int(v)
        elif key == "icon-weight": extras["--icon-stroke-weight"] = v
    elif n.startswith("font/"):
        fonts[n.split("/")[1]] = v
    elif n.startswith("border-width/"):
        border_w[n.split("/")[1]] = f"{int(v)}px"
    elif n.startswith("opacity/"):
        opacity[n.split("/")[1]] = round(v / 100, 2)
    elif n.startswith("motion/duration/"):
        durations[n.split("/")[-1]] = f"{int(v)}ms"
    elif n.startswith("motion/ease/"):
        # A STRING variable: Figma has no bezier type, so the curve travels as
        # its literal CSS value and is emitted unchanged.
        eases[n.split("/")[-1]] = v
    elif n.startswith("elevation/drop shadow/") or n.startswith("elevation/inner shadow/"):
        inner = "inner shadow" in n
        rest = n.split("shadow/", 1)[1]        # e.g. "high top/blur-radius"
        group, prop = rest.rsplit("/", 1)
        bucket = shadows_inner if inner else shadows_drop
        bucket.setdefault(group, {})[prop] = resolve(v) if t == "COLOR" else v

def build_shadow(parts, inset=False):
    ox = parts.get("offset-x", 0); oy = parts.get("offset-y", 0)
    bl = parts.get("blur-radius", 0); sp = parts.get("spread-radius", 0)
    color = parts.get("color", "var(--surface-drop-shadow)")
    pre = "inset " if inset else ""
    return f"{pre}{int(ox)}px {int(oy)}px {int(bl)}px {int(sp)}px {color}"

# ---- assemble @theme (static tokens) ----
theme = []
theme.append("  /* fonts */")
# Fontsource's variable packages register the family as "<Name> Variable". The bare
# name from Figma matches nothing, so name both or the stack falls through to the
# generic fallback and quietly renders in the system mono/sans instead.
if "font-sans" in fonts:
    n = fonts["font-sans"]
    theme.append(f'  --font-sans: "{n}", "{n} Variable", ui-sans-serif, system-ui, sans-serif;')
if "font-mono" in fonts:
    n = fonts["font-mono"]
    theme.append(f'  --font-mono: "{n}", "{n} Variable", ui-monospace, SFMono-Regular, monospace;')
theme.append("")
theme.append("  /* font weights */")
for k in ("normal", "semibold", "bold"):
    if k in fweight: theme.append(f"  --font-weight-{k}: {fweight[k]};")
theme.append("")
theme.append("  /* spacing scale (4px base reproduces the full numeric scale, incl. .5 steps) */")
theme.append("  --spacing: 0.25rem;")
theme.append("")
theme.append("  /* radius */")
radius_order = ["none","xs","sm","md","lg","xl","2xl","3xl","4xl","full"]
for k in radius_order:
    if k in radius: theme.append(f"  --radius-{k}: {radius[k]};")
theme.append("")
theme.append("  /* type scale */")
size_order = ["xs","sm","base","lg","xl","2xl","3xl","4xl","5xl","6xl","7xl","8xl","9xl"]
for k in size_order:
    if k in text_fs:
        theme.append(f"  --text-{k}: {text_fs[k]};")
        if k in text_lh: theme.append(f"  --text-{k}--line-height: {text_lh[k]};")
theme.append("")
theme.append("  /* blur */")
for k in ["xs","sm","md","lg","xl","2xl","3xl"]:
    if k in blur: theme.append(f"  --blur-{k}: {blur[k]};")
theme.append("")
theme.append("  /* elevation — color flips automatically via the semantic shadow token */")
drop_order = ["extra low","low","low top","medium","medium top 2","high","high top","high right","high left"]
for g in drop_order:
    if g in shadows_drop:
        theme.append(f"  --shadow-{slug(g)}: {build_shadow(shadows_drop[g])};")
for g in ["top","bottom","left","right"]:
    if g in shadows_inner:
        theme.append(f"  --inset-shadow-{slug(g)}: {build_shadow(shadows_inner[g], inset=True)};")
theme.append("")
theme.append("  /* motion — Astryx's scale. The names are Astryx's; the prefixes are Tailwind's, */")
theme.append("  /* which is what turns them into duration-* and ease-* utilities.               */")
duration_order = ["fast-min","fast","fast-max",
                  "medium-min","medium","medium-max",
                  "slow-min","slow","slow-max"]
for k in duration_order:
    if k in durations: theme.append(f"  --transition-duration-{k}: {durations[k]};")
for k in sorted(eases):
    theme.append(f"  --ease-{k}: {eases[k]};")

# ---- reference-only vars (utilities already built into Tailwind) ----
extra_lines = []
for k in ["0","2","4","6","8"]:
    key = "border" if k == "0" else f"border-{k}"  # not exact; skip mapping
for name, val in border_w.items():
    extra_lines.append(f"  --border-width-{name.replace('border','').lstrip('-') or '1'}: {val};")
for name, val in sorted(opacity.items(), key=lambda x: int(x[0].split('-')[-1])):
    extra_lines.append(f"  --{name}: {val};")
for k, v in extras.items():
    extra_lines.append(f"  {k}: {v};")

# ---- 1b. the neutral alias tier ----
def neutral_block(selector, scale):
    return ([f"{selector} {{"]
            + [f"  --neutral-{n}: var(--color-{scale}-{n});" for n in NEUTRAL_STEPS]
            + ["}"])

neutral_lines = neutral_block(":root", NEUTRAL_SCALES[0])
for scale in NEUTRAL_SCALES:
    neutral_lines.append("")
    neutral_lines += neutral_block(f':root[data-neutral="{scale}"]', scale)

# ---- 2b. the navigation theme tier ----
# Figma names six of the seven "Nav Content/Primary", "Nav Item/Border Hover"
# and so on, and the seventh just "Background". Strip a leading "Nav" and
# prefix every one with nav-, so the group is uniform and --nav-background is
# not the bare --background it would otherwise be.
def nav_slug(name):
    stem = re.sub(r"^Nav[ /]", "", name)
    return "nav-" + slug(stem)

def nav_block(selector, mode):
    return ([f"{selector} {{"]
            + [f"  --{nav_slug(n['n'])}: {resolve(n[mode])};" for n in navs]
            + ["}"])

nav_lines = nav_block(":root", NAV_MODES[0])
for mode in NAV_MODES:
    nav_lines.append("")
    nav_lines += nav_block(f':root[data-nav-theme="{mode}"]', mode)

nav_theme_lines = [f"  --color-{nav_slug(n['n'])}: var(--{nav_slug(n['n'])});" for n in navs]

# ---- write file ----
out = []
out.append("/* ============================================================")
out.append("   Yet Another Design System — tokens")
out.append("   Auto-generated from Figma. Re-run generate.py to refresh.")
out.append("   Tiers: primitives -> semantic (light/dark) -> utilities")
out.append("   ============================================================ */")
out.append('@import "tailwindcss";')
out.append("")
out.append("/* Dark mode: toggled by adding class=\"dark\" on <html>. */")
out.append('@custom-variant dark (&:where(.dark, .dark *));')
out.append("")
out.append("/* ---- 1 + 3. Static tokens: primitives, type, radius, spacing, shadows ---- */")
out.append("@theme {")
out.append("  /* primitive palette */")
out += prim_lines
out.append("")
out += theme
out.append("}")
out.append("")
out.append("/* ---- 1b. The neutral ramp. Every neutral in the semantic layer goes through ---- */")
out.append("/*    these eleven steps rather than naming a scale, so swapping the whole      */")
out.append("/*    system's neutral is one attribute: <html data-neutral=\"taupe\">. Stone is   */")
out.append("/*    the default, and also has its own block so the attribute is never a lie.  */")
out.append("/*                                                                             */")
out.append("/*    Deliberately NOT in @theme: there it would generate bg-neutral-* and      */")
out.append("/*    shadow the real Neutral primitive scale's utilities. The tier is an       */")
out.append("/*    indirection for the semantic layer, not a palette anyone paints with.     */")
out.append("/*    :root[data-neutral=…] is (0,2,0) so it beats bare :root whatever the      */")
out.append("/*    source order — both land on the same <html> element.                      */")
out += neutral_lines
out.append("")
out.append("/* ---- 2. Semantic tokens (theme-aware). Light is default; .dark overrides. ---- */")
out.append(":root {")
out += light_lines
out.append("}")
out.append("")
out.append(".dark {")
out += dark_lines
out.append("}")
out.append("")
out.append("/* ---- 2b. The navigation theme. Seven tokens across %d modes, switched by ---- */" % len(NAV_MODES))
out.append("/*     one attribute: <html data-nav-theme=\"blue-inverse\">. Neutral Inverse is    */")
out.append("/*     the default, and also has its own block so the attribute is never a lie.  */")
out.append("/*                                                                              */")
out.append("/*     Sits AFTER the semantic block on purpose. All but one mode is absolute    */")
out.append("/*     -- a nav on \"neutral\" stays white in dark mode, because a navigation      */")
out.append("/*     surface is a brand decision and not a reading preference. Only            */")
out.append("/*     \"canvas\" aliases --surface-* / --content-*, and so only that mode         */")
out.append("/*     follows .dark. That asymmetry is the design, not an oversight.            */")
out.append("/*                                                                              */")
out.append("/*     The neutral modes alias Figma's Neutral Palette, which is this file's     */")
out.append("/*     --neutral-* tier, so a nav on one still follows data-neutral as well.     */")
out.append("/*                                                                              */")
out.append("/*     The first nine modes are Figma's, in Figma's order. The other twenty-     */")
out.append("/*     eight are derived in generate.py from Blue's own steps, because a Figma   */")
out.append("/*     variable collection cannot hold any more modes than this one already has. */")
out.append("/*     So they are not in navigation.json, and retuning Blue in Figma retunes    */")
out.append("/*     every one of them -- bar one correction, which is contrast and not      */")
out.append("/*     taste. Nav Content/Subtle is step 700 in the light variant, not Blue's    */")
out.append("/*     600: those group headers are 12px text on a step-50 background, and 600   */")
out.append("/*     clears 4.5:1 on four ramps out of seventeen. nav-contrast.test.ts holds   */")
out.append("/*     every mode to that, so a ramp that fails cannot quietly ship.             */")
out += nav_lines
out.append("")
out.append("/* ---- 4. Expose semantic tokens as color utilities (bg-*, text-*, border-*). ---- */")
out.append("/*    'inline' keeps the var reference live so utilities respond to .dark.        */")
out.append("@theme inline {")
out += sem_theme_lines
out.append("")
out.append("  /* the navigation theme — bg-nav-background, text-nav-content-subtle, … */")
out += nav_theme_lines
out.append("}")
out.append("")
out.append("/* ---- Reference-only tokens (Tailwind already generates these utilities) ---- */")
out.append(":root {")
out += extra_lines
out.append("}")
out.append("")
out.append("/* ---- 4b. Motion primitives. Keyframes, which the duration and easing ---- */")
out.append("/*     tokens above parameterise. Here rather than in a component because a  */")
out.append("/*     keyframe cannot be written inline: Tailwind can only reference one    */")
out.append("/*     that already exists in the stylesheet.                                */")
out.append("/*                                                                           */")
out.append("/*     A sheet that enters is a NEW element, and a CSS transition on one is  */")
out.append("/*     only as reliable as the browser's willingness to paint its starting   */")
out.append("/*     style first. An animation states its own `from`, so it does not care. */")
out.append("/*     `transform: translateY()`, not the standalone `translate` property —   */")
out.append("/*     `transform` is the path every browser composites reliably.            */")
out.append("/*                                                                           */")
out.append("/*     There is no `slide-in-from-bottom` to pair with the slide out, and    */")
out.append("/*     that asymmetry is deliberate: an entering sheet fades, a leaving one  */")
out.append("/*     slides. See src/components/Nav/CLAUDE.md for why the entrance is not  */")
out.append("/*     the exit reversed.                                                    */")
out.append("@keyframes fade-in {")
out.append("  from { opacity: 0; }")
out.append("  to   { opacity: 1; }")
out.append("}")
out.append("")
out.append("@keyframes slide-out-to-bottom {")
out.append("  from { transform: translateY(0); }")
out.append("  to   { transform: translateY(100%); }")
out.append("}")
out.append("")
out.append("@theme {")
out.append("  --animate-fade-in: fade-in "
           "var(--transition-duration-fast) var(--ease-standard) both;")
out.append("  --animate-slide-out-to-bottom: slide-out-to-bottom "
           "var(--transition-duration-medium) var(--ease-standard) both;")
out.append("}")
out.append("")
out.append("/* ---- 5. Reduced motion. Astryx: components honor the OS setting by ---- */")
out.append("/*    replacing animation with an instant state change. Applied globally    */")
out.append("/*    so no component has to remember to.                                   */")
out.append("/*                                                                          */")
out.append("/*    1ms rather than 0: Base UI decides when a popup may unmount by asking  */")
out.append("/*    element.getAnimations(), and a zero-length transition can mean no      */")
out.append("/*    animation is ever observed — which would leave the popup mounted.      */")
out.append("@media (prefers-reduced-motion: reduce) {")
out.append("  *, *::before, *::after {")
out.append("    animation-duration: 1ms !important;")
out.append("    animation-iteration-count: 1 !important;")
out.append("    transition-duration: 1ms !important;")
out.append("  }")
out.append("}")
out.append("")
out.append("/* ---- 6. Font smoothing. Figma draws text with grayscale antialiasing; ---- */")
out.append("/*    a browser on macOS defaults to a smoothing pass that thickens every   */")
out.append("/*    stroke, so the same Inter 400 reads heavier in the app than on the    */")
out.append("/*    canvas. These two declarations are exactly Tailwind's `antialiased`   */")
out.append("/*    utility, set once on the root instead of per-component, so weights    */")
out.append("/*    match Figma everywhere — playground, Storybook and consumers alike.   */")
out.append("/*    Windows and Linux ignore both properties; there is nothing to match   */")
out.append("/*    there because they never applied the extra pass.                      */")
out.append("html {")
out.append("  -webkit-font-smoothing: antialiased;")
out.append("  -moz-osx-font-smoothing: grayscale;")
out.append("}")

css = "\n".join(out) + "\n"

# ---- guard: every declaration must be a legal CSS custom property ----
# A name the browser cannot parse is dropped silently: the token simply does not
# exist at runtime, with no error anywhere. That is how the diverging scale lost
# half its values. Fail the build loudly instead.
declared = re.findall(r"^\s*(--[^\s:]+)\s*:", css, re.M)
invalid = sorted({n for n in declared if not re.fullmatch(r"--[a-z][a-z0-9-]*", n)})
if invalid:
    raise SystemExit(
        "generate.py: refusing to write theme.css — these names are not valid CSS "
        "custom properties and would be silently ignored by the browser:\n  "
        + "\n  ".join(invalid)
        + "\n\nFix slug() to handle the characters involved."
    )

out_path = os.path.join(HERE, "src", "styles", "theme.css")
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w") as f:
    f.write(css)

print(f"primitives: {len(prims)}  semantic: {len(sem)}  dimensions: {len(dims)}")
if not TW:
    print("  ! tailwindcss not found in node_modules — every color was converted "
          "from its Figma hex rather than taken from the Tailwind palette")
print(f"colors: {stats['tailwind']} from the Tailwind palette, "
      f"{stats['converted']} converted from hex")
if stats["unmatched"]:
    print("  ! scale-shaped names with no Tailwind counterpart (check the spelling "
          "in Figma): " + ", ".join(sorted(set(stats["unmatched"]))))
print(f"neutral ramp: {len(NEUTRAL_SCALES)} scales x {len(NEUTRAL_STEPS)} steps "
      f"(default {NEUTRAL_SCALES[0]}), via --neutral-*")
print(f"navigation: {len(navs)} tokens x {len(NAV_MODES)} modes "
      f"(default {NAV_MODES[0]}), via --nav-*")
if stats["neutralized"]:
    print(f"  {len(stats['neutralized'])} raw alpha color(s) re-pointed onto the neutral tier:")
    for hexval, mixed in stats["neutralized"]:
        print(f"      {hexval}  ->  {mixed}")
if stats["drifted"]:
    print(f"  ! {len(stats['drifted'])} primitive(s) differ from Tailwind by more than hex")
    print("    rounding. Tailwind wins, so the Figma value is NOT being used. Either")
    print("    set Figma back to match, or move the color into the semantic layer:")
    for name, fig, tw, d in sorted(stats["drifted"], key=lambda r: -r[3]):
        print(f"      {name:16} figma {fig}  ignored in favor of  {tw}")
print(f"radius:{len(radius)} text:{len(text_fs)} blur:{len(blur)} "
      f"drop-shadows:{len(shadows_drop)} inner-shadows:{len(shadows_inner)}")
print(f"wrote {out_path} ({len(css)} bytes, {css.count(chr(10))} lines)")
