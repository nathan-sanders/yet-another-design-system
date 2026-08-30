# Yet Another Design System

A production design system built by a **product designer who does not write code**. Treat the human
as an expert on design-system concepts (tokens, variants, semantics, a11y) but assume they will not
hand-edit code — explain choices in plain language, and keep the setup runnable with simple commands.

## Goal

Ship a themeable React component library whose look is driven entirely by design tokens exported from
Figma, so the code matches Figma and both stay in sync.

## Stack

- **React 19 + TypeScript**, built with **Vite**
- **Tailwind CSS v4** (via `@tailwindcss/vite`) — theme lives in CSS, not `tailwind.config.js`
- **Base UI** — headless, accessible primitives. Package is **`@base-ui/react`** (v1+; it was renamed
  from `@base-ui-components/react`, so ignore older docs that use the old name). Import e.g.
  `import { Dialog } from '@base-ui/react'` or subpath `'@base-ui/react/dialog'`. Components use the
  compound pattern (a `Root` orchestrates state; child parts consume context).
- **Storybook** for previewing/testing each component in isolation
- **`tailwind-variants`** maps Figma variants → class sets; `src/lib/cn.ts` (clsx + tailwind-merge)
  lets a caller override a component's defaults
- **`lucide-react`** for icons, wrapped by the `Icon` component
- Fonts: **Inter** (sans), **Geist Mono** (mono), self-hosted via `@fontsource`
- **Recharts** for data visualization — the library shadcn/ui uses. Charts are SVG, and color
  reaches them as `stroke="var(--data-viz-categorical-01)"` rather than as a class, because SVG
  attributes take values

## Commands

```bash
npm run dev          # token playground (localhost:5173)
npm run storybook    # component library (localhost:6006)
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npm test             # every story, in real Chromium, with axe
python3 generate.py  # rebuild src/styles/theme.css from tokens/*.json
```

`lint`, `build` and `test` run on every pull request and on `main`
(`.github/workflows/ci.yml`). **`npm run build` is the load-bearing one**, because
it is the only step that type-checks: Vite strips types without looking at them,
so Storybook and the story suite both pass happily on code `tsc` rejects. That is
exactly how a type error reached `main` once — every story green, `npm run build`
red — and it is the reason the check exists.

## Design tokens

`src/styles/theme.css` is **generated — never hand-edit it.** Structure:

- `@theme { --color-* … }` — the **primitive** palette → utilities like `bg-blue-500`. Also static
  dimensions: `--spacing: 0.25rem`, `--radius-*`, `--text-*` (+ `--text-*--line-height`), `--blur-*`,
  `--shadow-*`, `--inset-shadow-*`, `--font-sans/-mono`, `--font-weight-*`.
- `:root { --neutral-50 … --neutral-950 }` plus one `:root[data-neutral="…"]` block per ramp — the
  **neutral tier**, see below.
- `:root { --surface-canvas … }` and `.dark { … }` — the **semantic** tokens (role-based, theme-aware).
- `@theme inline { --color-surface-canvas: var(--surface-canvas) … }` — exposes semantic tokens as
  color utilities.
- A trailing `:root` for reference-only values: `--border-width-*`, `--opacity-*`,
  `--icon-stroke-weight`.

### The golden rule for components

**Style components with semantic-token utilities, never raw primitives or hex.** Use classes like
`bg-surface-background-primary`, `text-content-primary`, `border-surface-border`,
`bg-action-primary-background`, `text-action-primary-foreground`, `hover:bg-action-primary-background-hover`,
`shadow-low`, `rounded-md`. Primitive utilities (`bg-blue-500`) exist but are for defining semantics,
not for use inside components.

### Dark mode

Toggled by `class="dark"` on `<html>`. Because color lives in the semantic layer, **do not write
`dark:` variants for color** — the token swaps itself. A theme toggle just adds/removes that class.

### The neutral is swappable

Nine ramps are neutrals — **Stone** (default), Taupe, Mauve, Mist, Olive, Slate, Gray, Zinc,
Neutral. Choosing one is `<html data-neutral="taupe">`, and it moves every surface, border, text
color, action, input, focus ring, shadow and neutral badge in both themes at once.

The seam is an eleven-step alias tier between primitives and semantics. **No semantic token names a
ramp** — `--surface-background-emphasized: var(--neutral-800)`, never `var(--color-stone-800)`. Because no
component reads a primitive either, the semantic layer is a complete choke point and the swap is
total with zero per-component work. That property is worth protecting: a component that reaches for
`bg-stone-200` would be the one thing on the page that does not follow.

Three things that are easy to get wrong:

- **`--neutral-800` ≠ `--color-neutral-800`.** The first is the tier, the second is Tailwind's
  Neutral ramp. `--color-` marks a primitive everywhere in this system, and that prefix is the whole
  distinction. The tier is deliberately **not** in `@theme`: there it would generate `bg-neutral-*`
  and shadow the real scale's utilities.
- **`:root[data-neutral=…]` is (0,2,0)**, so it beats bare `:root` (0,1,0) regardless of source
  order. Both selectors land on the same `<html>` element, so specificity is doing real work here.
- **The ramp is orthogonal to the theme.** It composes with `.dark` instead of multiplying against
  it — the semantic layer already decides which step each theme uses.

**A semantic alias to `@Stone/N` means the tier, not the ramp.** Figma has no neutral collection —
a semantic token aliases the *primitive* Stone scale — so `generate.py` reinterprets it and emits
`var(--neutral-N)`. That rule retires only if Figma grows a collection of its own.

There was a second rule beside it renaming `Decorative/Stone` to `Decorative/Neutral`, written into
the generator rather than the JSON so a re-export could not undo it. Figma has since renamed it at
source and the rule is gone — the regenerated `theme.css` came out byte-identical, which is what a
clean retirement looks like.

The generator also re-points the **alpha variants**. Ten of the raw hex values in the semantic layer
are the neutral at some alpha — ghost backgrounds, both overlays, both shadows. Left as `oklch()`
literals they freeze at Stone and stay stone-tinted on every other ramp, which is exactly what makes
a swap look half-applied. They are matched by RGB against the default ramp and emitted as
`color-mix(in oklab, var(--neutral-800) 10%, transparent)`; the run prints every one it re-points.
`#ffffff99` and `#00000080` do not match and stay literal, which is right — white and black are not
neutrals in the swappable sense. The Data Viz accessibility border used to sit in that list too; on
2026-08-27 Figma moved it from `#162020`/`#f3f4f4` to `#1b1816`/`#f5f5f5`, which *are* the neutral at
56%, so it now re-points onto `--neutral-900`/`--neutral-100` and follows the ramp like the rest. The
old value carried a faint teal cast (`oklch(23.4% 0.0143 196.218)`) that froze on every ramp.

**Contrast is not automatic.** The ramps differ in lightness at the same step, so a pair that clears
4.5:1 on Stone is not guaranteed to on Olive. `npm test` runs axe on every story but only at the
default ramp, so a non-default ramp wants a manual sweep of `content-subtle` on `surface-canvas`
and the secondary action pair.

**What stays pinned, on purpose.** The four `Data Viz` `@Neutral/*` tokens do not follow the ramp:
a chart benchmark wants a chromaless gray whatever the UI neutral is. They are now the *only*
`@Neutral/*` references left in the semantic layer, which is the invariant to keep — a fifth one
appearing is a Figma slip, not a decision. `Action/Overlay/Foreground` was exactly that: `@Neutral/950`
in dark among an otherwise all-Stone family, caught when the tier was built and fixed in Figma to
`@Black`, which is the symmetric partner of the `@White` it already had in light.

**The categorical series is twelve categories, and per-mode again.** It changed twice in two days,
and the second change reversed the first — worth reading as one story, because the reversal is the
useful part.

On **2026-08-27** all fourteen categories were made *mode-independent*: one alias serving both Light
and Dark. Nathan confirmed that was deliberate. But one value has to sit on both canvases, and that
is a hard ceiling: clearing 3:1 against both `Stone/100` and `Stone/950` confines a color to
relative luminance **0.108–0.271** — in practice only steps 500/600/700 of any hue — and **the best
any single color can manage against both at once is 4.28:1** (at L≈0.175). Nine of the fourteen
cleared 3:1 on only one canvas. A second problem sat underneath: the fourteen used just **ten**
distinct hues, four pairs separated by lightness alone, and inside that narrow band lightness is
gone as a separator (`Pink/500` vs `Pink/700` is 1.64:1).

On **2026-08-28** Nathan resolved both by splitting the modes again and dropping to **twelve**
categories. `Categorical/13` and `/14` were **deleted** — not renamed. All twelve now use a distinct
hue, so nothing depends on lightness to tell two categories apart, and ten of the twelve carry a
different step per mode (`09` Purple/500 and `10` Green/600 happen to land on the same step in both,
which is a coincidence of the ramp, not a return to the old rule).

**The reversal is the thing to remember: per-mode values exist to buy contrast headroom.** Splitting
the modes lifts the 4.28:1 ceiling entirely — `01` is now 6.69:1 on light and 10.77:1 on dark, which
no single-value token could have reached. So if a future change proposes collapsing the series back
to one value per category, that is the cost it is paying, and it has now been tried and reversed
once.

**Three still fall short on the light canvas** and are known: `04` `Yellow/500` at 1.74:1, `03`
`Emerald/500` at 2.25:1, and `10` `Green/600` at 2.95:1 — the last effectively on the line. Yellow
is the structural one; it needs roughly `Yellow/700` to clear 3:1 on `Stone/100`, which is a visibly
different yellow. Nathan is aware and has parked it, so **do not quietly "fix" these** — they are a
known, accepted state, and `Data Viz/Utility/Accessibility Overlay` is the mitigation for a mark that
needs separating from its ground.

The benchmark, alt and placeholder entries are the exception to all of it and still differ per mode
on their own logic, because they are ground, not series.

### Color is OKLCH, and Tailwind owns the primitives

Every color is emitted as `oklch()`. Figma cannot store OKLCH, so its hex values are 8-bit
roundings; nearly all 288 primitives are Tailwind palette colors, so `generate.py` reads
`node_modules/tailwindcss/theme.css` and uses Tailwind's canonical value, falling back to converting
the Figma hex only when there is no counterpart.

The exceptions are the four **custom neutral ramps — Taupe, Mauve, Mist and Olive** — which Tailwind
has no counterpart for, so their 44 values are converted from hex. Because they are scale-shaped
names, `generate.py` lists all 44 under "scale-shaped names with no Tailwind counterpart" on every
run. That warning exists to catch a *misspelling* in Figma; for these four it is expected.

**Consequence:** a primitive changed in Figma is ignored. `generate.py` reports any primitive that
differs from Tailwind by more than hex rounding (>0.05 in OKLab) so the override is visible. A color
that isn't a Tailwind value belongs in the **semantic** layer, which is fully Figma-driven.

### Motion

Motion is a token tier like color or radius, not a library. The scale is **Astryx's**, taken
verbatim: nine durations — `fast`/`medium`/`slow`, each with a `-min` and `-max` — and one easing
curve, `standard` (`cubic-bezier(0.24, 1, 0.4, 1)`).

Tailwind v4 has `--transition-duration-*` and `--ease-*` as theme namespaces, so the tokens arrive as
utilities on their own: **`duration-fast`**, **`ease-standard`**. The names are Astryx's; the prefixes
are Tailwind's. That translation is the same one `generate.py` already does turning Figma's
`border-radius/rounded-md` into `--radius-md`.

`tokens/motion.json` is **hand-seeded** — Figma does not have these variables yet. It uses the same
`[{n, t, v}]` shape as a real export, so once they exist in Figma they arrive through
`dimensions.json` and deleting `motion.json` is the whole migration. In Figma, durations are ordinary
FLOAT variables; the curve is a **STRING** variable, because Figma has no bezier type.

`prefers-reduced-motion: reduce` is honored globally in section 5 of `theme.css`, so no component has
to remember to. It clamps to **1ms rather than 0** on purpose: Base UI decides when a popup may
unmount by asking `element.getAnimations()`, and a zero-length transition can mean no animation is
ever observed — which would leave the popup mounted forever.

**Why no JS animation library.** We looked at `motion` (`motion/react`, formerly Framer Motion) and
turned it down twice over. Base UI's supported path is CSS transitions — `data-starting-style` /
`data-ending-style`, and it holds the element in the DOM until the transition ends; driving a popup
with Motion instead means making *every* overlay controlled, adding `keepMounted`, wrapping in
`AnimatePresence` and calling `actionsRef.current.unmount()` from `onAnimationComplete`. And its
durations and easings would live in JS objects — a second source of truth that Figma cannot reach,
which is the one thing this system exists to avoid.

**When a library would earn its place:** layout animation (FLIP), drag, and spring-based gestures —
none of which CSS does. Carousel is the one plausible candidate left on the roadmap. Reach for it
there, per component, not as the foundation.

A sliding Tabs indicator used to be the other candidate, and turned out not to need anything: Base
UI's `Tabs.Indicator` publishes the active tab's geometry as `--active-tab-left` / `--active-tab-width`,
so the slide is a CSS transition on `translate` and `width`. Worth remembering as the general shape
of the answer — check whether the headless primitive already measures the thing before assuming the
animation needs JavaScript.

### Font smoothing

Section 6 of `theme.css` sets `-webkit-font-smoothing: antialiased` +
`-moz-osx-font-smoothing: grayscale` on `html` — exactly Tailwind's `antialiased` utility, applied
once at the root rather than as a class on `<body>`. Figma draws text with grayscale antialiasing;
a browser on macOS defaults to a smoothing pass that thickens every stroke, so without this the same
Inter 400 reads heavier in the app than on the canvas. It lives in the stylesheet, not in
`index.html`, because that is the one file the playground, Storybook and consumers all import — a
body class would only fix the playground. Windows and Linux ignore both properties and need no
match; they never applied the extra pass.

### Focus

Every focusable thing in the library uses one ring, exported from `src/lib/focus.ts` as `focusRing`
(on the element itself) and `focusRingWithin` (on a card that should light up when a control inside
it takes focus). Import it; do not write focus classes by hand.

It draws two strokes, **both outside the component**: a 2px gap in `focus/focus-inner-border` — the
canvas color, white in light mode and stone-900 in dark, so it reads as a gap — then a 2px ring in
`focus/focus-outer-border`. Nothing is painted on or inside the component, so a focused component is
pixel-identical to an unfocused one.

**Why it is not `border-2`.** It was, and a 1px border going to 2px grew every hug-width component by
2px the moment it took focus: the Button grid visibly re-flowed as you tabbed across it. Each
component then worked round that in its own way — an `inset-ring`, an inset `outline`, a transparent
1px border at rest — which is how the library ended up with five focus idioms and a white line
painted *inside* a ticked checkbox. A ring and its offset are both `box-shadow`, so they cost no
layout anywhere and cannot create a scrollbar either; the problem cannot come back.

`outline` is deliberately left free: Avatar uses it for the canvas ring between overlapping avatars.

Two rings on one control is the thing to watch for. A Checkbox or Radio `inContainer` hands the ring
to the card and draws none on the box — the box is inside the card, so both would fire at once.

**Not to be confused with the `Token` component.** `tokens/` here is the Figma export;
`src/components/Token/` is the pill that shows one chosen value. Same word, unrelated things.

### Refreshing tokens

Figma → `tokens/*.json` → `generate.py` → `src/styles/theme.css`. When Figma changes, re-export the
three JSON files and run `python3 generate.py`. Never hand-edit the generated `theme.css`.

`generate.py` refuses to write if it would emit an invalid CSS custom property name. This matters:
an invalid name is dropped **silently** by the browser, which is how eight diverging colors once
went missing. Figma's `+`/`-` sign prefixes become `pos-`/`neg-` (`--data-viz-diverging-neg-08`).

**`src/styles/tokens.test.ts` is the same guard one layer up**, and it runs in CI. Tailwind builds
utilities from what it finds in `@theme`, so a class naming a token that does not exist generates
*nothing* — the element simply paints unstyled. Nothing else catches it: `tsc` sees a string, the
stories still render, and axe passes because transparent-on-canvas has fine contrast. That is
exactly how renaming `decorative-stone` reached `main` with Avatar's initials fallback and Toast's
default variant silently unpainted. **When a token is renamed, grep the whole of `src` for the old
name — and do not pipe that grep through `head`, because `theme.css` will fill the output before a
component does.** That is precisely how those two were missed.

### The Foundations group in Storybook

`src/foundations/` is a documentation group, not part of the published library — eight story files
under a `Foundations/` title, ordered ahead of `Components` by `storySort` in `.storybook/preview.tsx`.
Overview, Color, Semantic Color, Typography, Space, Shape, Elevation, Motion.

**Every page is parsed out of `theme.css` at load time** (`src/foundations/tokens.ts`, which imports
it with Vite's `?raw`). Nothing is hand-listed, so the pages cannot drift: add a ramp, rename a role,
retune the motion scale, and the documentation follows on the next reload. Same reasoning as
`tokens.test.ts` reading the file rather than trusting a copy of it.

The centerpiece is **Semantic Color → Mapping**: every role with its light *and* dark target side by
side, in one table, in either theme. That works because the two targets name the *ramp* tier
(`neutral-800`) or a primitive (`red-700`), neither of which depends on the theme — only the choice
between them does. The handful of roles that alias another semantic token (`feedback-success-background`
is `decorative-green-background`) are expanded per theme by `resolve()` in `tokens.ts`, or they would
quietly show the same color in both columns.

**Trap: Tailwind drops `@theme` variables nothing uses.** `--color-orange-500` is in `theme.css`, but
no utility and no token references it, so it is not in the stylesheet the browser gets —
`var(--color-orange-500)` resolves to nothing and the swatch paints blank. Half the primitive ramps
came out with holes in them before this was understood. It only bites code that reads a primitive as
a *variable* rather than through a `bg-*` class, which is to say: these pages, and SVG attributes.
`paint()` in `tokens.ts` substitutes primitives for their literal OKLCH from the same file. The ramp
and semantic tiers are left live on purpose — they live in plain `:root` blocks Tailwind never
touches, and that is what makes the Theme and Neutral toolbar switches move these pages.

A scrollable table needs `tabIndex={0}` and a label, or axe fails the story on
`scrollable-region-focusable` — a region you can only reach by dragging is unreachable from a
keyboard. `Showcase.tsx`'s `Table` does this once for all of them.

## Figma is the source of truth

- File key: `8bRBn0lf6TfPyFWR2XttDP` (Yet Another Design System)
- **Trap:** calling `get_metadata` with no `nodeId` lists only the 📓 Cover page, making the file look
  empty. It is not — components live under high-numbered node ids (`400020xx:xxxxx`). Ask for a link
  to the specific node rather than concluding the components are elsewhere.
- `search_design_system` also surfaces look-alike components from the Sprout Social org libraries
  ("Seeds Components", "Seeds Foundations"). Those are a different, read-only source — use this file.
- Code Connect (`get_context_for_code_connect`) requires a Dev/Full seat on an Org plan and is **not**
  available here. Read variants with `get_metadata` + `get_variable_defs` instead.
- Icon instances inside components are hidden by default, and hidden nodes report unreliable
  geometry — trust `get_variable_defs` over measured sizes.
- **`get_variable_defs` on a parent silently omits the variables of hidden children.** It does not
  report them as unset; it does not mention them at all — so a hidden slot reads exactly like a slot
  with no token bound. `Menu Item`'s `Slot Items` is hidden by default, and querying the variant
  returned no surface fill whatsoever, which looked like the Kbd inside it had been left on the old
  token. It had not. **Query the hidden node by its own id** (`40004278:7482` for the Action slot's
  Kbd, `40004278:7706` for Danger) and the bindings are all there. The general rule: an absent token
  in a parent's output is not evidence of anything until you have checked whether the node that
  would carry it is visible.
- **An instance inherits its main component's bindings**, so retokenizing a component updates every
  instance without touching them. Worth remembering before raising "the instances still point at the
  old token" — check one by id first.
- Colors come back as `{r,g,b,a}` 0–1 floats — convert to hex.

## Components

Each component gets its own folder with the component, its story, and a barrel `index.ts`.

### Which form control

The deciding question is **whether the value has to come from a known set**, not how it looks.

- **No** — free text, nothing to pick from: **Input**. A name, an email, a URL.
- **No, but suggestions help** — still free text, and a value that is not on the list is still
  allowed: **Autocomplete**. A search box that remembers recent searches.
- **Yes** — then it is only a question of how many, and whether you need to type to find one:
  - few enough to show all at once: **Radio** (with room to explain each) or **SegmentedControl**
    (a compact strip beside a Button)
  - too many to show, few enough to scroll: **Select**
  - too many to scroll: **Combobox** — typing filters, but the value must come from the list.

**Autocomplete and Combobox look identical and differ on exactly one thing:** whether off-list input
is allowed. That is the distinction to keep hold of, and Base UI puts it in the API rather than in a
prop — Autocomplete's `value` is the input *string*, and a row has no `selected` state at all. Both
are built.

Orthogonal to all of it: **Checkbox** for an intention a Save button later commits, **Switch** for a
setting that takes effect the moment you let go, **Slider** for an approximate number.

### Built

Every component's full decision record — its Figma nodes, its variants, what was left out and why —
lives in a `CLAUDE.md` in its own folder, and is loaded automatically when you work on files there.
**Read that file before changing a component.** Most of what looks like a free choice in the code was
settled once, against the Figma file, for a reason that is written down.

| Component | | |
|---|---|---|
| [Accordion](src/components/Accordion/CLAUDE.md) | a stack of sections, one open at a time | height animated off a measurement Base UI publishes |
| [Button](src/components/Button/CLAUDE.md) | the action control | five appearances, three sizes, icon-only derived from the absence of a label |
| [Icon](src/components/Icon/CLAUDE.md) | any Lucide glyph | four sizes, color inherited via `currentColor` |
| [Badge](src/components/Badge/CLAUDE.md) | a status label | all 18 hues of the Decorative ramp, one size; `neutral` follows the swappable ramp |
| [Breadcrumbs](src/components/Breadcrumbs/CLAUDE.md) | a trail to the current page | four separators, last child is current automatically |
| [Divider](src/components/Divider/CLAUDE.md) | a line separating content | orientation × emphasis, optional label |
| [Avatar](src/components/Avatar/CLAUDE.md) | a person, and a stack of them | photo, initials or `+N`; `AvatarGroup` overlaps, and `surface` says what the ring hides in |
| [Tooltip](src/components/Tooltip/CLAUDE.md) | a label for what you point at | first component on the motion tokens |
| [SegmentedControl](src/components/SegmentedControl/CLAUDE.md) | one of a few, all visible | a compact strip sized beside a Button |
| [Tabs](src/components/Tabs/CLAUDE.md) | switch between panels | sliding indicator, in pure CSS |
| [Banner](src/components/Banner/CLAUDE.md) | a persistent page message | four severities, optional actions |
| [Toast](src/components/Toast/CLAUDE.md) | a notification that leaves | a stack that collapses |
| [Checkbox](src/components/Checkbox/CLAUDE.md) | tick one thing on or off | plus `Checkbox.Group`, and `inContainer` |
| [Radio](src/components/Radio/CLAUDE.md) | exactly one of a visible list | plus `Radio.Group` |
| [Menu](src/components/Menu/CLAUDE.md) | actions in a popup | items, separators, submenus |
| [ContextMenu](src/components/ContextMenu/CLAUDE.md) | the same actions, on right-click | Menu's rows re-attached, not copied; opens at the pointer |
| [Popover](src/components/Popover/CLAUDE.md) | a panel of content, on click | the library's first `role="dialog"`; Figma's own drawing has no accessible name, which is why `label` exists |
| [Dialog](src/components/Dialog/CLAUDE.md) | a modal surface that blocks the page | the first genuinely modal component; `Body` is the scroll container Popover was standing in for |
| [AlertDialog](src/components/AlertDialog/CLAUDE.md) | confirm something you cannot undo | the sharing rule at its limit — Base UI hands over every part but the Root |
| [Switch](src/components/Switch/CLAUDE.md) | a setting that applies at once | knob grows 14 → 16 as it slides |
| [Slider](src/components/Slider/CLAUDE.md) | an approximate number | `range` derived from an array value |
| [Link](src/components/Link/CLAUDE.md) | inline and standalone navigation | what Button's removed `link` appearance became |
| [Input](src/components/Input/CLAUDE.md) | a line of free text | plus `InputGroup` for attachments |
| [Field](src/components/Field/CLAUDE.md) | label, sub-label, validation | wraps a control; owns the label |
| [Select](src/components/Select/CLAUDE.md) | one value from a long list | needs `items` on Root to render a label |
| [Token](src/components/Token/CLAUDE.md) | one chosen value as a pill | 20 / 24 tall, so a field full of them never grows |
| [Combobox](src/components/Combobox/CLAUDE.md) | a long list, filtered by typing | a trigger with a searchable popup, or a tokenizer |
| [ContentBlock](src/components/ContentBlock/CLAUDE.md) | a card that owns one region of a page | header slots, three emphases, the part a bento view is made of |
| [BentoGrid](src/components/BentoGrid/CLAUDE.md) | the mosaic those blocks sit in | columns, spans, and one breakpoint doing all the collapsing |
| [Kbd](src/components/Kbd/CLAUDE.md) | a keyboard shortcut | Figma draws the key and the group, Astryx's `keys` string API; `mod` resolves per platform |
| [Card](src/components/Card/CLAUDE.md) | the plain container | `rounded-md` inside ContentBlock's `rounded-lg`; the border tracks the fill unless the file says otherwise |
| [ClickableCard](src/components/Card/CLAUDE.md) | the same card as a hit target | `href` picks the element; `ghost` is the list row, `selected` is `aria-current` |
| [Autocomplete](src/components/Autocomplete/CLAUDE.md) | free text that suggests without constraining | Combobox with one rule removed; `Input`'s box, Combobox's popup, shared not copied |
| [Chart](src/components/Chart/CLAUDE.md) | the chrome every chart sits in | container, legend, tooltip, swatch, palette, axis rules; half the Figma page is a drawing mechanism, not an API |
| [LineSeries](src/components/LineSeries/CLAUDE.md) | change over time | the chart that proved the chrome; 30-odd Figma components become three props |
| [AreaSeries](src/components/AreaSeries/CLAUDE.md) | how much, over time | two fills that are different drawings; opaque areas make paint order part of the API |
| [VerticalBar](src/components/VerticalBar/CLAUDE.md) | how much, per category | Figma's three bar types are one boolean; rounded stacked segments Recharts cannot draw |
| [Spark](src/components/Spark/CLAUDE.md) | a shape the size of a word | the one chart that is not a `ChartContainer`; labeled or decorative, enforced by the type |
| [Donut](src/components/Donut/CLAUDE.md) | parts of one whole | a slice is a series with one value; hover is a halo that does not resize the slice |
| [Gauge](src/components/Gauge/CLAUDE.md) | how far along | a donut folded in half, which turns the hole into a shelf; the radius has to be computed |
| [Radar](src/components/Radar/CLAUDE.md) | several series across a few dimensions | translucent because no paint order can work; the grid's outer ring is a second element |
| [Metric](src/components/Metric/CLAUDE.md) | a labeled number and what it did | no Recharts at all; two of its four components are wrappers over `Badge` and `Card` |
| [HeatMap](src/components/HeatMap/CLAUDE.md) | how much, across two dimensions | a CSS grid, not a chart; the one caller of `ChartContainer`'s `responsive={false}` |
| [TreeMap](src/components/TreeMap/CLAUDE.md) | parts of a whole, past a donut's limit | the only chart whose marks carry their own text |

### Data visualization

Charts live on the Figma page **↪ Data Viz (In Progress)** (`40004316:13427`) and are built on
**Recharts**. Two things about that page decide how much work it is.

**Half of it does not become code.** Everything with a leading underscore — `_Line Series / Segment`
(16 variants), `_Radar / Areas` (20), `_Donut / Slice Sweep`, `_X-Axis Presets` (26) — exists because
Figma has to draw a chart by hand, one segment at a time, and cannot compute a tick from data.
Recharts does both. Those are a *drawing mechanism*, not an API: a segment's "Direction=Positive" is
not a decision, it is what the data did between two points. **Ask "decision or mechanism?" of every
underscored component before implementing it** — reading them as a component list turns ~15 real
components into 30-plus.

**shadcn's `ChartStyle` has no counterpart here, and must not gain one.** shadcn injects a `<style>`
block per chart mapping `--color-desktop` onto a hex, because its charts are handed raw colors with
nowhere theme-aware to put them. `--data-viz-*` are semantic tokens — `:root` plus `.dark` — so a
mark painted with one follows the theme with no injected CSS, no second palette and no `dark:`
variant. That is the whole point of the semantic layer, arriving somewhere new for free.

The Data Viz tokens had been in `theme.css` since the twelve-category split with **nothing reading
them**; `src/components/Chart/` is the first code that does.

Three rules worth having in mind before touching a chart:

- **The categorical order is fixed and never cycled by rank**, and past twelve series the scale
  returns the placeholder gray rather than wrapping. Two visible series sharing a color is worse
  than admitting the scale ran out. Figma agrees from the other end — its legend has a `+X more` row.
- **Text never wears the series color.** Identity comes from the swatch beside it. Three of the
  twelve hues are illegible as text on the light canvas, and coloring text also removes the channel
  a low-color-vision reader was relying on.
- **Charts do not animate.** Recharts animates in JavaScript with its own constants — a second source
  of truth Figma cannot reach — so `isAnimationActive={false}` everywhere, and any motion that is
  wanted goes back as CSS on the tokens. Its tooltip writes a `transition` *inline* even when series
  animation is off; see the Chart record.
- **Recharts' defaults are set for a different library than this one**, and two have already had to
  be turned off. `accessibilityLayer` defaults **on**, making the chart root focusable — fine inside
  `ChartContainer`, a real fault inside `Spark`'s `aria-hidden` wrapper, where axe caught it. Its
  automatic y-domain ends at the largest value present, which gives round ticks only when the data
  happens to be round. Assume a Recharts default is aimed at a chart with no design system behind it.
- **White does the separating, not a border.** The stacked bar's 1px gap, the solid area's
  surface-colored top edge, the donut's slice stroke and the tree map's tile inset are one idea in
  four places: a border would be ink that is not data. Recognize it before inventing a fifth
  mechanism.
- **Color is assigned over the full series list, never the visible one.** It is what makes the
  interactive legend safe — switching a series off cannot repaint the survivors. The fixed
  categorical order and the hidden-series filter are the same rule seen from two sides.
- **Figma's Data Viz page references one token that does not exist.** The tree map's tile metric
  binds `Overlay/Text`, and no `Overlay/*` token is in any of `tokens/*.json`. `content-inverse`
  stands in. Worth knowing that the file is not a complete description of the token layer.
- **Measure the geometry; do not read it off a screenshot.** Both chart bugs found so far were
  invisible in a picture and obvious in a number — a missing 1px gap between two stacked segments,
  and grouped bars at 7px because `barCategoryGap` is applied to each side of the band. Pull the
  rendered attributes out of the DOM, or pin the arithmetic in a node test, as `Chart/axes.test.ts`
  and `Chart/bars.test.ts` do.

### Patterns that recur across components

These were each settled inside one component and then held everywhere. They are the reason a new
component usually has fewer decisions in it than it looks.

- **Derive a variant instead of adding a prop, where the value already says it.** Figma models these
  as axes, but Avatar's `Content`, Button's icon-only form, Slider's `range` and Breadcrumbs' current
  page all follow from what you pass. A prop that can contradict the children is a prop that will.
- **Focus is `focusRing`, `focusRingUnhovered` or `focusRingWithin` from `src/lib/focus.ts`, never
  hand-written.** Reach for `focusRingUnhovered` in a list whose rows **take focus because you
  pointed at them** — anything on Base UI's `highlightItemOnHover`. There `:focus-visible` is not a
  safe proxy for "the keyboard put you here": Chrome decides it for a scripted `.focus()` by asking
  what the last interaction was, so hovering a menu row after any keypress paints a full keyboard
  ring under the cursor. Both menus had it; `ContextMenu` had it on *every* hover, because its
  trigger is a `<div>` that never takes focus, so nothing ever sets the pointer modality at all.
  The ring is scoped off the hovered row rather than removed — the hover background still marks it,
  and arrowing away from a parked mouse rings the row you moved to. Do **not** fold that scoping
  into `focusRing`: on a Button a mouse resting over something you tabbed to should not swallow the
  ring, because there the hover did not cause the focus. Use
  `focusRingWithin` when focus lands on a descendant — a card around a Checkbox, or Slider's thumb
  with its visually hidden input inside it. Watch for two rings on one control, and for the opposite
  failure: a container that rings identically wherever focus is inside it says nothing. Combobox's
  tokenizer has several focusable descendants, so its box scopes the ring to the caret and each chip
  carries its own. **One ring at a time, always on the thing that has focus.**
- **When Base UI hands over the same component object, share it rather than copy it.**
  `ContextMenu` is `Menu` opened by right-click — Base UI's `context-menu` subpath re-exports
  Menu's `Item`, `Group`, `SubmenuRoot` and `Popup` as the *same objects*, and Figma draws the two
  sets identically. So ContextMenu writes a Root, a Trigger and a Popup, and re-attaches the rest
  under its own namespace; the recipe they share sits in `Menu/styles.ts`. The test for this is
  not "do they look alike" but "is it the same primitive underneath" — Combobox looks like Select
  and is a different component, so it duplicates, correctly.
  **Autocomplete is the first case where the answer is neither, and the line runs through one
  component.** Base UI's `autocomplete` subpath re-exports Combobox's `Popup`, `Positioner`, `List`,
  `Group`, `GroupLabel`, `Collection`, `Empty` and `Input` as the same objects, while `Root`, `Item`,
  `Trigger`, `Value` and `Separator` are genuinely its own. So the popup recipes moved to
  `Combobox/styles.ts` and the field recipes stayed put — and the field itself is `Input`'s `box`
  imported outright, which is the same rule pointing at a third component. **Ask the question per
  part, not per component.**
- **A portalled popup needs a `z-index`, and gets it from `src/lib/layers.ts`.** Being appended to
  `<body>` last does not settle painting order: every positioned element with a positive `z-index`
  paints above every one left on `auto`, whatever the document order. So a popup on `auto` is
  punched through by any `z-10` on the page — which is not hypothetical, since `Token.Remove` is
  `relative z-10` and its crosses floated over an open Combobox menu. `overlayLayer` goes on the
  **Positioner**, which is the element Base UI positions, and sits at 40 so `Toast`'s `z-50` stays
  the top of the library.
- **Figma's `overflow-clip` is not ported** — eleven times now, across SegmentedControl, Banner,
  Toast, Menu, Switch, Slider, Select, Combobox, ContentBlock and Autocomplete. A canvas has no other
  way to bound a frame; here the focus ring paints outside the component on purpose, and clipping
  would slice it off.
- **Controls grow as you touch them.** Switch's knob 14 → 16 as it slides, Slider's handle 16 → 20 on
  hover, focus and drag.
- **Field owns the label — unless the label is a hit target.** A control with nothing to name itself
  gets its label from Field (Input, InputGroup, Select, Combobox and Autocomplete).
  Checkbox, Radio and Switch keep their own, because their `<label>` wraps the control and that is
  what makes the text clickable. **Whether the label is a real `<label>` is a third question**, and
  Field's `nativeLabel` is where it is answered: a `<button>` control wants it off, an `<input>` on.
  Combobox is the case that shows the two are independent — the same component, `false` in its
  single-select shape and `true` as a tokenizer. Autocomplete keeps the default `true` for the same
  reason the tokenizer does: its control is a real `<input>`, so clicking the label should land the
  caret.
- **Code sometimes goes first and Figma catches up.** Badge's four extra hues, Divider's `emphasis`,
  SegmentedControl's `large`, three of Slider's four decisions and Accordion's `container` were built
  here against a file that did not have them, then drawn into the file afterwards. The direction is
  unusual but it is allowed — what is not allowed is leaving the file behind. Accordion is the one to
  copy: its row went 32 → 40 in code and the Figma variants followed within the day, so the two never
  drifted far enough to argue about. **Menu's `destructive` is the longest-running case and it closed
  the same way**: built against a `Menu Item` whose `Type` was Action | Nested only, and drawn into
  the file as `Type=Danger` the day ContextMenu landed. Nothing in the code changed when it arrived,
  which is the test of whether a catch-up was really a catch-up.
  **Popover is the newest, and the largest**: `Title`, `Description` and `Close` were built against a
  node that drew a bare surface with one slot, and drawn into the file the same day — a whole part
  set catching up rather than a variant axis. It also shows what the catch-up is *for*. Figma's
  drawing had no title, and a `role="dialog"` with no title has no accessible name, so the file was
  not merely incomplete: as drawn it could not ship. Nothing in the code changed when the parts
  landed, and both sides were measured rather than eyeballed.
- **Catching up can mean the file deleting something, not adding it.** ContextMenu shipped sharing
  Menu's rows, on the grounds that Base UI hands over the same component objects and Figma drew the
  two identically. Figma then retired its own `Context Menu Item` and `Context Menu Group` sets so
  that `Context Menu` instances `Menu Group` and `Menu Item` directly. Both sides reached one shared
  row from opposite directions — which is a stronger signal than either one alone, and the reason to
  say out loud when a component is a *reuse* rather than a resemblance.
- **A prop named after a DOM attribute has to give way, one side or the other.** Three now, and each
  was found by the same `Omit`-or-rename type error: Divider's `style` became `lineStyle`, Banner's
  `title` kept the prop name and `Omit`ed the attribute, and ContentBlock's header slot was named
  `titleSlot` before it could collide with `slot`. The rule that decides it is whether the prop name
  is the one a caller would reach for first. `slot`, `title`, `style`, `color` and `content` are the
  ones to watch.
- **Each entry records which Base UI component it was.** Twenty so far, Divider first. Worth keeping
  up, because it is how the library tracks how much of Base UI it has actually exercised.
- **The default size is the first option, everywhere.** Reach for it in application stories — the
  `InContext` family, and anything standing in for a real screen — and in composition generally, so
  what gets built reads as the ordinary case rather than a styled one. `small` and `large` belong in
  the stories that exist to show the scale, or where something genuinely calls for them: a Button
  inside an addon is `small` because it has to fit inside a 32px field, and that is a reason. "It
  looked better" is not, and it is how a library ends up with no default anybody recognizes.
  **Check the reason before believing it.** ContentBlock's header actions were `small` on the
  assumption that a 48px row was tight; it is `min-h-12` with 8px of padding either side, so it has
  exactly the 32px a default Button is, and the constraint was imagined. A tight fit is easy to
  assume and quick to measure.
  **The rule cuts the other way too, and the kanban board is the case.** Its AvatarGroup was the
  default `base` against a composition that draws 24px avatars at 64px — so `size="small"` there is
  a measured constraint, not a preference, and it is the first place in the library where reaching
  past the default is the *correct* answer. The test is the same either way: go and measure the
  Figma node. Both failures look identical in review and only one of them is settled by opinion.
- **A ring that hides in the background has to be told what the background is.** CSS has no
  "the fill of whatever contains me", so an element that paints a band of its own backdrop —
  Avatar's group ring, its status dot's ring — cannot derive it and needs a prop. That is the
  exception to the derive-don't-declare rule above, and the boundary is worth stating: derive what
  the *element itself* already knows (its children, its `href`, whether it is inside a group);
  declare what only its **ancestors** know. `surface` names the token, so `card-primary` binds what
  `Surface/Background Primary` binds — Card's `padding={3}` rule again. Anything else that draws a
  knockout, a notch or a seam will hit this, and should copy the prop rather than invent a second
  spelling.

## Still to build

Foundational and static first:

1. **List Item** — variants/states; native, styled.
2. **Table Cell** — native, styled.
3. Then: Indicator, Chart Legend Buttons, Carousel Pagination Button.

**Dialog is built, and the entry it closes is the cleanest run of Card's rule so far.** The bar is
that a roadmap item earns its build when the file draws it *and* something has already been
reinvented in its absence — and both halves arrived together. Figma drew `Dialog` (`40004383:17046`),
and Popover's `max-h-(--available-height) overflow-y-auto` had been standing in for the scrolling
case with its own record calling it "a floor, not a home". `Dialog.Body` is the home, and both of
Astryx's "don't" rules for a popover now have somewhere to send people.

**AlertDialog came with it, and is worth reading for the sharing rule rather than for itself.**
Base UI's `alert-dialog` subpath re-exports every part but `Root` out of `dialog/` — and `Trigger`
is not even re-exported, it is `export const AlertDialogTrigger = DialogTrigger`. So it re-attaches
the library's *own* Dialog wrappers rather than the raw parts, which is a step past ContextMenu
(rows shared, Popup written) and past Autocomplete (parts shared from two components). It is also
the first component since BentoGrid with **no Figma node at all**, and it owes the file a drawing.

**Card is built, and the entry it closes is worth keeping.** It asked whether a card was anything
more than a `ContentBlock` with no `ContentBlock.Header`, and said to close the entry rather than
build if nobody asked. The file answered in geometry: a card is `rounded-md` (8px) on 12px of
padding where a block is `rounded-lg` (12px) on 16, and the compositions nest one inside the other.
So they are different objects that compose, not one component and its degenerate case. The
corroboration was already in the repo — sixteen story files had hand-rolled the div, at three
different paddings, one of them as a literal `function Card()`. **That is the shape of evidence to
look for on the entries above**: a roadmap item earns its build when the file draws it *and*
something has already been reinvented in its absence.

`ContentBlock` and `BentoGrid` landed together, because a block on its own does not show what it is
for. **BentoGrid is the first component in the library with no Figma node behind it at all** — not a
variant added ahead of the file, but a whole component. It owes the file a drawing.

**Content Block's debts are both closed, and the pair is the clearest illustration of the two
routes.** `Emphasis` went code → file: `subtle` and `accent` shipped ahead of any drawing, and the
file later added all three variants at exactly the token pairs the code already had —
Surface/Background Primary, Subtle and Emphasized, the last on Surface/Border Emphasized — so
nothing changed in code when it landed. That is the Accordion route again, after `Clickable Card`'s
`State=Selected` below, and the first time it has carried a whole variant axis rather than one
state. The header's right padding went the other way, file → code correcting file: `_Content Block
Header` drew `pl-4 pr-2`, which only reads as 16 both sides when the actions slot is filled, because
a 32px ghost Button's own 12px covers the missing 8. Empty, the header sat 8px short. Code went to
`px-4`, and Figma rebound the right padding to `spacing/4` to match.

**The check that made the second one trustworthy is worth repeating.** Reading the component alone
would not have settled it — a variant instance can pin an old padding as a local override and look
correct in the component while every real use is stale. Walk the set's instances and assert both the
number *and* the bound variable name: all twelve came back 16 bound to `spacing/4` with no override.
Same instinct as diffing a token export rather than trusting one node.

**Card's two debts are both settled, and only one of them by drawing.** `Clickable Card` gained a
`State=Selected` for both emphases the day after it shipped — Surface/Background Subtle on Surface/Border
Emphasized, exactly what the code had, so nothing changed here. That is the Accordion route working.

The `Padding` one closed the other way, and it is the more useful precedent: **not every code axis
can become a Figma property, and the answer is sometimes an instance override rather than a
variant.** Figma's four property kinds are VARIANT, BOOLEAN, TEXT and INSTANCE_SWAP — *none of them
is a number* — so padding could only ever have been a string axis, taking Card from 6 variants to 24
and Clickable Card from 10 to 40. Sixty-four frames for one value. Instead the override lives on the
instance, where it is verified to work, and **it must always be a token rebind** — repoint the
instance's padding at a different `spacing/N` variable, never type a raw number, or the value leaves
the system and has no counterpart in code.

That is also why the code prop is `padding={3}` and not `padding="default"`. When the shared
vocabulary is the token, a second set of size words is a translation table between a designer saying
`spacing/4` and a caller writing the prop. **The general rule: before adding a variant axis to the
file, check whether the property is one Figma can actually express — and if the value is a token,
let the prop say the token.**

The form family is complete against the file bar one: **Checkbox Group** and **Radio Group** are
built as `Checkbox.Group` and `Radio.Group`, Checkbox, Radio and Switch take their validity from a
Field as well as from their own prop, and Slider is closed as a deliberate non-change (see its
entry). Combobox landed and took Token with it — `Combobox.Chips` / `Chip` / `ChipRemove` supply
the behavior, Token supplies the look, and the 20 / 24 against a field's inner 22 / 30 / 38 held
when measured. **Autocomplete has since landed and closed the family** — Combobox with one rule
removed, and the clearest case yet of the sharing rule doing real work: Base UI's `autocomplete`
subpath re-exports Combobox's `Popup`, `List`, `Group`, `Collection` and `Empty` as the *same
component objects*, so those recipes moved to `Combobox/styles.ts` rather than being written twice.
Its field is `Input`'s box for the same reason from the other direction — the file draws an Input
Group, and `focusRingWithin` is correct there because `Autocomplete.InputGroup` has exactly one
focusable descendant. Nothing in the form family is left unbuilt against the file.

For each: read its Figma variants → model them as typed props → implement with `tailwind-variants` →
cover all states → write a story showing every variant in light and dark. Then write the component's
`CLAUDE.md` alongside it, and add a row to the table above.

## Working style

- Propose a short plan and get a yes before scaffolding or installing.
- Keep commits/steps small and explain them in plain language.
- Don't hardcode colors, spacing, radii, or shadows — always tokens.
- Verify by measuring (computed styles, screenshots) rather than assuming.
