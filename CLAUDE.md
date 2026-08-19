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
- `:root { --surface-canvas … }` and `.dark { … }` — the **semantic** tokens (role-based, theme-aware).
- `@theme inline { --color-surface-canvas: var(--surface-canvas) … }` — exposes semantic tokens as
  colour utilities.
- A trailing `:root` for reference-only values: `--border-width-*`, `--opacity-*`,
  `--icon-stroke-weight`.

### The golden rule for components

**Style components with semantic-token utilities, never raw primitives or hex.** Use classes like
`bg-surface-card-primary`, `text-content-primary`, `border-surface-border`,
`bg-action-primary-background`, `text-action-primary-foreground`, `hover:bg-action-primary-background-hover`,
`shadow-low`, `rounded-md`. Primitive utilities (`bg-blue-500`) exist but are for defining semantics,
not for use inside components.

### Dark mode

Toggled by `class="dark"` on `<html>`. Because colour lives in the semantic layer, **do not write
`dark:` variants for colour** — the token swaps itself. A theme toggle just adds/removes that class.

### Colour is OKLCH, and Tailwind owns the primitives

Every colour is emitted as `oklch()`. Figma cannot store OKLCH, so its hex values are 8-bit
roundings; all 288 primitives are Tailwind palette colours, so `generate.py` reads
`node_modules/tailwindcss/theme.css` and uses Tailwind's canonical value, falling back to converting
the Figma hex only when there is no counterpart (just `white` and `black`).

**Consequence:** a primitive changed in Figma is ignored. `generate.py` reports any primitive that
differs from Tailwind by more than hex rounding (>0.05 in OKLab) so the override is visible. A colour
that isn't a Tailwind value belongs in the **semantic** layer, which is fully Figma-driven.

### Motion

Motion is a token tier like colour or radius, not a library. The scale is **Astryx's**, taken
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

`prefers-reduced-motion: reduce` is honoured globally in section 5 of `theme.css`, so no component has
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
canvas colour, white in light mode and stone-900 in dark, so it reads as a gap — then a 3px ring in
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

### Refreshing tokens

Figma → `tokens/*.json` → `generate.py` → `src/styles/theme.css`. When Figma changes, re-export the
three JSON files and run `python3 generate.py`. Never hand-edit the generated `theme.css`.

`generate.py` refuses to write if it would emit an invalid CSS custom property name. This matters:
an invalid name is dropped **silently** by the browser, which is how eight diverging colours once
went missing. Figma's `+`/`-` sign prefixes become `pos-`/`neg-` (`--data-viz-diverging-neg-08`).

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
- Colours come back as `{r,g,b,a}` 0–1 floats — convert to hex.

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
is allowed. That is the distinction to keep hold of. Base UI ships both, and neither is built here.

Orthogonal to all of it: **Checkbox** for an intention a Save button later commits, **Switch** for a
setting that takes effect the moment you let go, **Slider** for an approximate number.

### Built

Every component's full decision record — its Figma nodes, its variants, what was left out and why —
lives in a `CLAUDE.md` in its own folder, and is loaded automatically when you work on files there.
**Read that file before changing a component.** Most of what looks like a free choice in the code was
settled once, against the Figma file, for a reason that is written down.

| Component | | |
|---|---|---|
| [Button](src/components/Button/CLAUDE.md) | the action control | five appearances, three sizes, icon-only derived from the absence of a label |
| [Icon](src/components/Icon/CLAUDE.md) | any Lucide glyph | four sizes, colour inherited via `currentColor` |
| [Badge](src/components/Badge/CLAUDE.md) | a status label | all 18 hues of the Decorative ramp, one size |
| [Breadcrumbs](src/components/Breadcrumbs/CLAUDE.md) | a trail to the current page | four separators, last child is current automatically |
| [Divider](src/components/Divider/CLAUDE.md) | a line separating content | orientation × emphasis, optional label |
| [Avatar](src/components/Avatar/CLAUDE.md) | a person, and a stack of them | photo, initials or `+N`; `AvatarGroup` overlaps |
| [Tooltip](src/components/Tooltip/CLAUDE.md) | a label for what you point at | first component on the motion tokens |
| [SegmentedControl](src/components/SegmentedControl/CLAUDE.md) | one of a few, all visible | a compact strip sized beside a Button |
| [Tabs](src/components/Tabs/CLAUDE.md) | switch between panels | sliding indicator, in pure CSS |
| [Banner](src/components/Banner/CLAUDE.md) | a persistent page message | four severities, optional actions |
| [Toast](src/components/Toast/CLAUDE.md) | a notification that leaves | a stack that collapses |
| [Checkbox](src/components/Checkbox/CLAUDE.md) | tick one thing on or off | plus `Checkbox.Group`, and `inContainer` |
| [Radio](src/components/Radio/CLAUDE.md) | exactly one of a visible list | plus `Radio.Group` |
| [Menu](src/components/Menu/CLAUDE.md) | actions in a popup | items, separators, submenus |
| [Switch](src/components/Switch/CLAUDE.md) | a setting that applies at once | knob grows 14 → 16 as it slides |
| [Slider](src/components/Slider/CLAUDE.md) | an approximate number | `range` derived from an array value |
| [Link](src/components/Link/CLAUDE.md) | inline and standalone navigation | what Button's removed `link` appearance became |
| [Input](src/components/Input/CLAUDE.md) | a line of free text | plus `InputGroup` for attachments |
| [Field](src/components/Field/CLAUDE.md) | label, sub-label, validation | wraps a control; owns the label |
| [Select](src/components/Select/CLAUDE.md) | one value from a long list | needs `items` on Root to render a label |

### Patterns that recur across components

These were each settled inside one component and then held everywhere. They are the reason a new
component usually has fewer decisions in it than it looks.

- **Derive a variant instead of adding a prop, where the value already says it.** Figma models these
  as axes, but Avatar's `Content`, Button's icon-only form, Slider's `range` and Breadcrumbs' current
  page all follow from what you pass. A prop that can contradict the children is a prop that will.
- **Focus is `focusRing` or `focusRingWithin` from `src/lib/focus.ts`, never hand-written.** Use
  `focusRingWithin` when focus lands on a descendant — a card around a Checkbox, or Slider's thumb
  with its visually hidden input inside it. Watch for two rings on one control.
- **Figma's `overflow-clip` is not ported** — seven times now, across SegmentedControl, Banner, Toast,
  Menu, Switch and Slider. A canvas has no other way to bound a frame; here the focus ring paints
  outside the component on purpose, and clipping would slice it off.
- **Controls grow as you touch them.** Switch's knob 14 → 16 as it slides, Slider's handle 16 → 20 on
  hover, focus and drag.
- **Field owns the label — unless the label is a hit target.** A control with nothing to name itself
  gets its label from Field (Input, InputGroup, Select, and Autocomplete/Combobox when they land).
  Checkbox, Radio and Switch keep their own, because their `<label>` wraps the control and that is
  what makes the text clickable.
- **Code sometimes goes first and Figma catches up.** Badge's four extra hues, Divider's `emphasis`,
  SegmentedControl's `large` and three of Slider's four decisions were built here against a file that
  did not have them, then drawn into the file afterwards. The direction is unusual but it is allowed —
  what is not allowed is leaving the file behind.
- **Each entry records which Base UI component it was.** Sixteen so far, Divider first. Worth keeping
  up, because it is how the library tracks how much of Base UI it has actually exercised.
- **Application stories use the default size.** A story that shows a component *in use* — the
  `InContext` family, and anything else standing in for a real screen — takes the default of every
  size scale in it, so the composition reads as the ordinary case rather than a styled one. `small`
  and `large` belong in the stories that exist to show the scale, or where something genuinely calls
  for them: a Button inside an addon is `small` because it has to fit inside a 32px field, and that
  is a reason. "It looked better" is not, and it is how a library ends up with no default anybody
  recognises.

## Still to build

Foundational and static first:

1. **Card** — native container using `bg-surface-card-primary`, `border-surface-border`, elevation.
2. **List Item** — variants/states; native, styled.
3. **Table Cell** — native, styled.
4. Then: Indicator, Chart Legend Buttons, Carousel Pagination Button.

The form family is complete against the file: **Checkbox Group** and **Radio Group** are built as
`Checkbox.Group` and `Radio.Group`, Checkbox, Radio and Switch take their validity from a Field as
well as from their own prop, and Slider is closed as a deliberate non-change (see its entry). What is
in Figma and still unbuilt is **Autocomplete** and **Combobox** — both already have a `Type` in the
Field set, so Field is waiting for them rather than the other way round.

For each: read its Figma variants → model them as typed props → implement with `tailwind-variants` →
cover all states → write a story showing every variant in light and dark. Then write the component's
`CLAUDE.md` alongside it, and add a row to the table above.

## Working style

- Propose a short plan and get a yes before scaffolding or installing.
- Keep commits/steps small and explain them in plain language.
- Don't hardcode colours, spacing, radii, or shadows — always tokens.
- Verify by measuring (computed styles, screenshots) rather than assuming.
