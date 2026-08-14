#!/usr/bin/env python3
"""Generate a Tailwind v4 theme.css from Figma token exports."""
import json, re, os

HERE = os.path.dirname(__file__)
T = os.path.join(HERE, "tokens")

def load(name):
    with open(os.path.join(T, name)) as f:
        return json.load(f)

prims = load("primitives.json")
sem = load("semantic.json")
dims = load("dimensions.json")

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
    return val

# ---- 1. primitives (static -> @theme) ----
prim_lines = [f"  --color-{slug(p['n'])}: {p['v']};" for p in prims]

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
print(f"radius:{len(radius)} text:{len(text_fs)} blur:{len(blur)} "
      f"drop-shadows:{len(shadows_drop)} inner-shadows:{len(shadows_inner)}")
print(f"wrote {out_path} ({len(css)} bytes, {css.count(chr(10))} lines)")
