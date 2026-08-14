#!/usr/bin/env python3
"""Generate a Tailwind v4 theme.css from Figma token exports.

Colours are emitted as OKLCH. Figma can only store hex, so the exported values
are 8-bit roundings of colours that are really defined in OKLCH; every primitive
in this system is a Tailwind palette colour, so the canonical OKLCH value is
read straight from the installed Tailwind and used instead of the rounded hex.
Anything without a Tailwind counterpart is converted from its hex.
"""
import json, re, os, math

HERE = os.path.dirname(__file__)
T = os.path.join(HERE, "tokens")
TW_THEME = os.path.join(HERE, "node_modules", "tailwindcss", "theme.css")

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

# ---------- colour: hex -> OKLCH ----------
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
    # Achromatic colours get hue `none`, matching how Tailwind writes them.
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

# Storing a colour as 8-bit hex moves it slightly; across this whole palette the
# largest such rounding measured 0.027 in OKLab. Anything past this threshold is
# too big to be rounding, so it is a real edit made in Figma.
HEX_ROUNDING_TOLERANCE = 0.05

def primitive_value(name, hexval):
    """Tailwind is the source of truth for primitives.

    Figma cannot express OKLCH, so its hex is treated as an approximation and
    Tailwind's canonical value wins. That means a colour deliberately changed in
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

# ---- global alias map: original figma name -> css var() reference ----
ref = {}
for p in prims:
    ref[p["n"]] = f"var(--color-{slug(p['n'])})"
for s in sem:
    ref[s["n"]] = f"var(--{slug(s['n'])})"

def resolve(val):
    if isinstance(val, str) and val.startswith("@"):
        target = val[1:]
        return ref.get(target, f"/* unresolved: {target} */")
    # Raw colours in the semantic layer are alpha variants of the palette; they
    # get the same OKLCH treatment so no hex survives into the output.
    if isinstance(val, str) and val.startswith("#"):
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
if "font-sans" in fonts:
    theme.append(f'  --font-sans: "{fonts["font-sans"]}", ui-sans-serif, system-ui, sans-serif;')
if "font-mono" in fonts:
    theme.append(f'  --font-mono: "{fonts["font-mono"]}", ui-monospace, SFMono-Regular, monospace;')
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
out.append("/* ---- 2. Semantic tokens (theme-aware). Light is default; .dark overrides. ---- */")
out.append(":root {")
out += light_lines
out.append("}")
out.append("")
out.append(".dark {")
out += dark_lines
out.append("}")
out.append("")
out.append("/* ---- 4. Expose semantic tokens as color utilities (bg-*, text-*, border-*). ---- */")
out.append("/*    'inline' keeps the var reference live so utilities respond to .dark.        */")
out.append("@theme inline {")
out += sem_theme_lines
out.append("}")
out.append("")
out.append("/* ---- Reference-only tokens (Tailwind already generates these utilities) ---- */")
out.append(":root {")
out += extra_lines
out.append("}")
out.append("")
out.append("/* ---- 5. Reduced motion. Astryx: components honour the OS setting by ---- */")
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
    print("  ! tailwindcss not found in node_modules — every colour was converted "
          "from its Figma hex rather than taken from the Tailwind palette")
print(f"colours: {stats['tailwind']} from the Tailwind palette, "
      f"{stats['converted']} converted from hex")
if stats["unmatched"]:
    print("  ! scale-shaped names with no Tailwind counterpart (check the spelling "
          "in Figma): " + ", ".join(sorted(set(stats["unmatched"]))))
if stats["drifted"]:
    print(f"  ! {len(stats['drifted'])} primitive(s) differ from Tailwind by more than hex")
    print("    rounding. Tailwind wins, so the Figma value is NOT being used. Either")
    print("    set Figma back to match, or move the colour into the semantic layer:")
    for name, fig, tw, d in sorted(stats["drifted"], key=lambda r: -r[3]):
        print(f"      {name:16} figma {fig}  ignored in favour of  {tw}")
print(f"radius:{len(radius)} text:{len(text_fs)} blur:{len(blur)} "
      f"drop-shadows:{len(shadows_drop)} inner-shadows:{len(shadows_inner)}")
print(f"wrote {out_path} ({len(css)} bytes, {css.count(chr(10))} lines)")
