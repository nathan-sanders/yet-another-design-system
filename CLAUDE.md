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
python3 generate.py  # rebuild src/styles/theme.css from tokens/*.json
```

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

**Built:**

1. **Button** — `appearance`: primary | secondary | destructive | ghost | overlay;
   `size`: small (24px) | default (32px) | large (40px); `startIcon`/`endIcon` take a `LucideIcon`.
   **No `link` appearance** — it was removed deliberately. A link navigates and belongs in an `<a>`;
   a `<button>` dressed as one loses middle-click/⌘-click/"open in new tab" and announces as
   "button". It is also fixed-height `inline-flex`, so it could never sit inside a sentence. Coming
   back later as its own **Link** component; the `action-link-*` tokens stay in the theme for it.
   Hover/focus/disabled are CSS states, not props. Focus is a 2px inner border + 3px outer ring from
   the focus tokens, on `:focus-visible`. Disabled is `opacity-40`.
   **Icon-only:** pass `startIcon` with no children. It keeps the same height *and the same
   horizontal padding* as its labelled twin, so the width follows the icon — 42×32 at default size
   per Figma (node 40002016:6867), **not** a 32×32 square. It is derived from the absence of a label, not a prop, and
   the props are a union so `aria-label` is *required* in that form — an unlabelled icon button will
   not compile.
2. **Icon** — wraps any Lucide glyph. `size`: small 12 | base 16 | large 20 | x-large 24. Colour is
   `currentColor` so it inherits (that is what lets it sit inside a Button correctly). Stroke weight
   uses `--icon-stroke-weight` applied as CSS plus `vector-effect: non-scaling-stroke` — Lucide draws
   on a 24×24 viewBox, so without that a 1.5 stroke paints at 1px at 16px size.

3. **Badge** — `color`: all 18 hues of the Decorative ramp — stone first, then red, orange, amber,
   yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose.
   (Figma shipped 14; orange/lime/emerald/teal are being added there to match.)
   `startIcon`/`endIcon` take a `LucideIcon`
   and render at 12px. One size only — 20px tall, which is exactly the `text-sm` line-height, so the
   height falls out of the type rather than being set. Not interactive: Figma gives it no hover,
   focus or disabled state, so it renders as a `<span>`. Uses the ramp's `Background` + `Foreground`;
   the `Highlight` is unused because Figma's Badge has no border.

4. **Breadcrumbs** — a trail of links to the current page. Mirrors Figma nodes `40004041:11934`
   (Breadcrumbs), `40004041:11838` (Breadcrumb Item) and `40004041:11868` (Separator).
   Composed API: `<Breadcrumbs>` + `<Breadcrumbs.Item>`, modelled on Meta's Astryx.
   `separator`: slash | chevron | arrow | dot — slash is the character, the rest are Lucide glyphs
   at 16px. One size only, as in Figma.
   **The last child is the current page automatically** (a private context, not a prop), rendering as
   plain text with `aria-current="page"`; `isCurrent` overrides it. Renders `<nav aria-label>` → `<ol>`
   → one `<li>` per crumb, with the separator inside the preceding `<li>` so the list count matches
   the crumb count.
   **Colour trap:** breadcrumb links are `content-subtle` + underline-on-hover, *not* the blue
   `action-link-foreground`. A trail is navigation chrome.
   **Focus trap:** the ring is an inset `outline` + `ring`, not Button's `border-2` — a crumb has no
   border and no fixed height, so a border would grow the row on focus. Note that `outline-none` sets
   Tailwind's `--tw-outline-style: none`, so `focus-visible:outline-solid` is required or the inner
   border silently never paints.

5. **Divider** — a line separating content. Mirrors Figma node `40002032:610` one-for-one: its three
   properties `Orientation` horizontal | vertical, `Line Style` solid | dashed and `Emphasis`
   default | emphasized are the three props, and its eight variants are the eight combinations.
   1px in all of them. Static, like Badge.
   **First Base UI component in the library** — it wraps `Separator` from `@base-ui/react/separator`,
   which supplies `role="separator"` and `data-orientation`; all styling is ours.
   `emphasis` started as Astryx's subtle/strong: Figma had no weight property, but both
   `surface-border` tokens already existed, so it was a gap in the file (as with Badge's four hues)
   and was added to Figma afterwards. The values are named for the tokens rather than for Astryx, so
   a prop value and the token it reaches for are always the same word.
   Astryx's `label` and `isFullBleed` were left out.
   **Naming trap:** the prop cannot be `style` — that is React's inline-style attribute on every DOM
   element, so it would collide and shadow that escape hatch. It is `lineStyle`, and the Figma
   property was renamed `Style` → `Line Style` to match.
   **Dashed trap:** Figma specifies `stroke-dasharray="4 4"`; `border-dashed` lets the *browser*
   choose the dash length (near 2/2 at 1px, and engine-dependent), so dashes are a hard-stopped
   `repeating-linear-gradient` instead. Colour is set once with `text-surface-border` and picked up
   as `currentColor`, so one class swap covers solid and dashed alike.
   **Sizing:** vertical is `self-stretch` so it matches the row it sits in, plus `min-h-5` — outside
   a flex container `self-stretch` does nothing and a 0-height div renders as nothing at all.

6. **Avatar / AvatarGroup** — a person as a photo, initials, or a `+N` count. Mirrors Figma nodes
   `40004102:5483` (Avatar), `40004102:5619` (Avatar Status) and `40004113:14594` (Avatar Group).
   Second Base UI component: wraps `Avatar` (Root / Image / Fallback) from `@base-ui/react/avatar`
   for image-loading state and the delayed fallback; all styling is ours, in `styles.ts` because
   the group's overflow circle draws the same shape.
   `size`: x-small 20 | small 24 | base 36 | large 40 | x-large 128 — Icon's names, Figma's
   XS/S/M/L/XL. Initials scale 10 / 10 / 12 / 14 / 48px.
   **Content is derived, not a prop.** Figma's `Content` (Image | Initials | Overflow) follows from
   what you pass: `src` → photo, `name` → initials, `count` → `+N`, none → a `User` glyph. Same
   move as Button deriving icon-only from having no label.
   `status`: online | offline | unavailable — each has a *shape* as well as a colour (filled disc,
   ring, disc with a bar), so they survive red/green colour blindness. The dot's size is chosen by
   the avatar (8 / 8 / 12 / 12 / 20), not exposed as a second knob.
   Group: `<AvatarGroup size>` + `<AvatarGroup.Overflow count>`. It does **not** count for you —
   you slice the list, as Astryx does.
   **The trap: Figma's strokes here are *outside* strokes.** The Status "S" symbol is an 8px frame
   that renders 12×12, and the group's five 36px avatars measure 164px (`5 × 36 − 4 × 4`). So the
   canvas rings are `outline` (group) and `ring` (dot), never `border` — a border would eat into
   the circle and shrink the photo. **164px at `base` is the number to check** when this changes.
   The overlap equals the ring width, which is what leaves a clean band of canvas between circles.
   **Focus trap:** the ring is `inset-ring-2` + `ring-3`, not Breadcrumbs' `outline` — `outline` is
   already carrying the group ring, and `border` would shrink the photo.
   **The one untokenised value in the library:** x-large initials get `tracking-[-0.02em]`. Figma's
   `text-5xl` style carries −2% letter-spacing, but letter-spacing is not exported by the token
   pipeline at all — no `--text-*--letter-spacing` in `theme.css`, no `letterSpacing` in
   `tokens/dimensions.json` — so there is no token to reach for.
   Two things go past Figma, both gaps in the file rather than inventions: Figma gives Avatar no
   Focus state, but `href`/`onClick` make one interactive; and there is no "no data" variant, so
   the `User` glyph is borrowed from the end of Astryx's fallback chain. Astryx's built-in tooltip
   is left out: an avatar that needs a name should be wrapped in `Tooltip`.

7. **Tooltip** — a short label describing the thing you are pointing at. Mirrors Figma node
   `40004073:20833`, which has **no variant set at all** — one look, no sizes, no colours, no arrow —
   so there is not a single `tv()` variant. Everything interesting is behaviour.
   Third Base UI component and the **first that portals**, so it sets the pattern every later overlay
   (Popover, Dialog, Select, Menu) will copy. Base UI supplies the lifecycle: hover/focus delays,
   `role="tooltip"`, `aria-describedby`, Escape, collision flipping, and holding the node in the DOM
   until the closing transition ends.
   **API:** a wrapper, not a compound — `<Tooltip label="Copy link"><Button …/></Tooltip>`. `children`
   goes to Base UI's `render`, so the caller's own element becomes the trigger instead of being
   wrapped in a Base UI `<button>`; Button, Avatar and Badge all work unchanged. `Tooltip.Provider`
   (shared hover delay across a toolbar) and the raw `Root`/`Trigger`/`Portal`/`Positioner`/`Popup`
   are attached for controlled or externally-anchored tooltips.
   `side`/`align`/`sideOffset` are **not** Figma variants and deliberately not `tv()` variants —
   they are behaviour, and they go to the positioner, which is what makes collision flipping work.
   **First component to use the motion tokens:** `duration-fast` + `ease-standard`, fading and
   scaling from `origin-(--transform-origin)` so it grows out of the edge nearest its trigger.
   `data-[instant]:duration-0` covers the cases where animating is wrong — keyboard focus, dismissal,
   and the second tooltip in a Provider group.
   **A11y trap:** a tooltip *describes*, it does not name. It lands on `aria-describedby`, so an
   icon-only Button still needs its own `aria-label` — which `ButtonProps` already requires at compile
   time. A tooltip is never a substitute for a label.
   **Wrapping trap:** Figma's text layer is `nowrap` because it is auto-width on canvas, but the frame
   also carries `max-w-96` and `word-break: break-word`, which are dead properties unless the text can
   wrap. It wraps.
   **Height trap: 32px**, and the last 2px come from an inner Span frame with 1px of vertical padding.
   Flattening it gives 30, and no round `py-*` splits the difference: 24 (line-height) + 2×1 (span) +
   2×2 (popup) + 2×1 (border). **32px is the number to check** when this changes.

8. **SegmentedControl** — pick one of a small set of mutually exclusive options, all visible at
   once. Mirrors Figma nodes `40004127:14774` (Segment Control, `Appearance` Secondary | Ghost) and
   `40002016:7049` (Segments, `Active` × `State` × `Size`). Composed API, like Breadcrumbs:
   `<SegmentedControl>` + `<SegmentedControl.Item>`.
   `appearance`: secondary | ghost — the same track token pairs Button's two appearances use, which
   is what makes it pair with them. `size`: small | default | large. `layout`: hug | fill.
   **Labels come from the Content ramp, not the Action one:** unselected is `content-primary` and
   selected darkens to `content-emphasized`, so selection is carried by colour as well as by weight
   and the raised card — and in dark mode that reads stone-100 → white, which is what keeps the
   selected segment legible when its card (`surface-card-primary`, stone-900) is *darker* than the
   track. Hover changes only the background. Focus darkens the label to `content-emphasized` too;
   that is a no-op on a selected segment and only shows on a group rendered with nothing selected.
   **Fourth Base UI component, first built on `RadioGroup` + `Radio`.** It is an *input*, not
   navigation, so it renders `role="radiogroup"` → `role="radio"` with `aria-checked`, roving
   tabindex and arrow-key movement — the same DOM Astryx emits. That is *why* it is not a
   ToggleGroup: a group of `aria-pressed` toggles can be left with nothing selected, and a segmented
   control always has exactly one. Tabs are wrong for the opposite reason — they navigate between
   panels — which is item 9 below, on Base UI `Tabs`.
   **Base UI's `Radio` renders a `<span>`** (inside a group, a `CompositeItem` with `tag: "span"`).
   It takes **both** `nativeButton` and `render={<button type="button" />}` to become a real button —
   that pairing is what gives `:focus-visible` and the native `disabled` attribute.
   **Selection follows focus:** `RadioGroup` clicks the hidden input on arrow-key focus. Correct
   radiogroup behaviour, and what Astryx does. Don't fight it. `enableHomeAndEndKeys` is off, so
   Home/End do nothing here (Button's toolbar cousins differ).
   **Heights are Button's, and they fall out of the parts:** a 20px segment inside 1px of padding
   inside a 1px border is 24px, and the same for 28→32 and 36→40. **24 / 32 / 40 are the numbers to
   check** when this changes. Horizontal padding does *not* follow Button: it steps 8 / 12 / 12, so
   large is taller but no wider, where Button goes 8 / 12 / 16. The track itself has no `Size`
   property in Figma — it takes its height from the segments inside it.
   Segments are a fixed `h-*`, not Figma's `min-h`, so
   `focus-visible:border-2` cannot resize them, and each carries a transparent 1px border at rest so
   selecting one doesn't grow it.
   **Do not add `overflow-clip` to the track**, even though Figma has it. Figma draws focus as an
   overlay *inside* the segment; here it is a 3px ring painting outside a segment that sits 1px in
   from the track edge, so clipping would slice the ring off the first and last segments.
   **Second component to use the motion tokens**, after Tooltip: `duration-fast-min` +
   `ease-standard` crossfading colour, background, border and shadow. Astryx measures at 125ms on
   `cubic-bezier(0.24, 1, 0.4, 1)` — the same curve, and 130ms is the nearest token. No sliding
   indicator: that needs the JS layout library this system deliberately turned down.
   **A `Tooltip` composes onto a segment** — Tooltip hands `children` to Base UI's `render`, so the
   segment's own `<button>` becomes the trigger and keeps its roving tabindex and arrow keys. That
   is what Tooltip's `SharedDelay` story is built from now. A tooltip still only *describes*: an
   icon-only segment needs its own `aria-label`, which the union prop type requires anyway.
   **`layout="fill"`** is the one thing here Figma does not draw — Astryx's, for a fixed-width
   panel, and a gap in the file rather than an invention. Figma's focus ring is drawn at
   `rounded-xs` on a `rounded-sm` segment — an artefact of it being a separate overlay layer; the
   segment's own radius is used instead, as in Button.
   This component shipped first and Figma caught up second, which is the reverse of the usual
   direction: `large` and the Content-ramp label colours were both added to the file afterwards
   (as with Badge's four hues and Divider's `emphasis`), then synced back into the code. Large's
   `px-3` and the `content-primary` / `content-emphasized` pair came from Figma, not from us.

9. **Tabs** — switch between panels of related content. Mirrors Figma nodes `40002087:6609`
   (Tab Item, `Size` × `Active` × `State`) and `40002087:6745` (Tabs, the strip and its bottom
   rule). Composed API: `<Tabs>` + `<Tabs.List>` + `<Tabs.Tab>` + `<Tabs.Panel>`.
   `size`: small | default | large — Button's 24 / 32 / 40 again, `px-3` at every size as in
   SegmentedControl. `layout`: hug | fill (Astryx's, not in Figma — the same gap-in-the-file call
   as SegmentedControl's). `startIcon` takes a `LucideIcon`; `endSlot` takes any node, because
   Figma's "End Slot Items" frame usually holds a count Badge rather than an icon.
   **Fifth Base UI component, and the first that is really navigation:** `role="tablist"` →
   `role="tab"` → `role="tabpanel"`, `aria-selected`, the tab↔panel id wiring, roving tabindex and
   arrow keys all come from Base UI. **Selection does not follow focus**, the deliberate opposite of
   SegmentedControl: with panels attached, arrowing past a tab must not swap the content under you,
   so Enter or Space activates. Home/End work here, unlike SegmentedControl.
   **The indicator slides, in pure CSS.** `Tabs.Indicator` publishes `--active-tab-left` and
   `--active-tab-width`, so one shared element transitions `translate` and `width` at
   `duration-fast` + `ease-standard` — 175ms, which is what Astryx transitions its own indicator at.
   Labels crossfade at `duration-fast-min`, as in SegmentedControl. Third component on the motion
   tokens.
   **The bold-weight trap.** Figma draws inactive labels at 400 and the active one at 600, so
   selecting a tab widens it and shoves the rest of the strip sideways — under an indicator that is
   mid-animation towards a target that keeps moving. The label is rendered twice, the visible copy
   plus an `aria-hidden` semibold twin stacked in the same grid cell, so the cell is always as wide
   as the bold text. Astryx does exactly this. `invisible`, not `hidden`: a `display: none` twin
   reserves nothing. **Tab width unchanged between selected and unselected is the thing to check**
   when this changes.
   **Disabled hangs off `data-disabled`, not `:disabled`.** Base UI builds tabs with
   `focusableWhenDisabled`, so a disabled tab keeps its place in the roving tabindex and is
   announced — which means `aria-disabled="true"` and `data-disabled`, and never the native
   attribute. SegmentedControl's `disabled:` classes work because its Radio takes the real one; the
   same classes here fire on nothing, silently.
   **The bottom rule cannot be the Divider component**, even though Figma draws it as one: `Divider`
   renders `role="separator"`, and a `tablist` may only contain tabs — axe fails the story suite on
   `aria-required-children`. It is an `after:` pseudo-element on the same `surface-border` token.
   Nor can it be `border-b`: a border sits outside the padding box, making the strip 41px instead of
   40 and leaving the 2px indicator hovering above the line rather than painting over it.
   **The strip is 40px at `default`** — 4 (py-1) + 32 + 4, and the indicator hangs in that last 4px,
   which is Figma's `bottom-[-4px]`. **40 / 32 / 48 are the numbers to check.**
   Focus is Breadcrumbs' inset `outline` + `ring`, not Button's `border-2`: a tab has no border and
   a min-height, so a border would grow it on focus.
   Left out: `orientation="vertical"` (Base UI has it, Figma has no vertical variant, and it is
   omitted from the props rather than left to break quietly); Astryx's `href` link tabs, which are a
   `<nav>` of anchors and a different a11y contract; and its overflow `TabMenu`, which needs a Menu.

10. **Banner** — a persistent message about the page or section it sits in. Mirrors Figma node
    `40004135:15894`: `Type` info | success | warning | danger × `Floating` false | true, which is the
    whole variant set. Figma's Title / Description / Has Action / Is Dismissable booleans become
    slots: `title`, `children`, `action`, `onDismiss`.
    **The first consumer of the `feedback-*` tokens.** They have existed since the first export with
    nothing using them — every other component draws on Action, Content or Decorative. Each type is a
    `Background` + `Foreground` pair already tuned for contrast in both themes, so there is no `dark:`
    class and nothing to solve. The ramp's `Highlight` goes unused: Figma's Banner has no border, the
    same call as Badge.
    Not a Base UI component — there is no headless Banner or Alert primitive, so it is a native
    `<div>` like Badge. What it takes from Astryx is the composition and the a11y model.
    **Role is derived from `type`,** which is what Astryx's own DOM does: info/success render
    `role="status"` (polite), warning/danger render `role="alert"` (interrupts). It is set before the
    props spread, so a caller can override it when the banner already sits in a live region.
    **Dismissal is the caller's.** Passing `onDismiss` renders the close button and Banner never hides
    itself — derived-from-what-you-pass, as Button derives icon-only from having no label, and it
    keeps Banner stateless like everything else here. Astryx self-hides with internal state; a banner
    that quietly returns on the next render is the worse surprise. The button is just
    `<Button appearance="overlay" size="small" startIcon={X} aria-label>` — overlay is the one
    appearance that works on all four feedback backgrounds, because its own background is a dark
    translucent wash rather than a theme colour. Its union prop type already requires the label.
    **Naming trap, the mirror of Divider's.** `title` is a real DOM attribute on every element (the
    browser's hover tooltip), typed `string`, so `ComponentPropsWithRef<'div'>` has to be
    `Omit`ed to retype it as a ReactNode. Divider resolved the same collision the other way and
    renamed its prop to `lineStyle`; here the prop name is the right one, so the attribute gives way.
    **The icon rail's `py-1` is load-bearing:** 4px above a 16px glyph centres it on the 24px
    line-height of the title beside it. Measured at exactly 0.0px offset; drop it and the glyph
    top-aligns and reads high.
    **Do not port Figma's `overflow-clip`** — nothing overflows, and it is SegmentedControl's
    clipped-focus-ring hazard. Verified `overflow: visible`, with 16px/12px of room between the
    dismiss button and the banner's edge for its 3px ring.
    Width is `w-full`: Figma's 400px is a canvas frame, not a constraint.
    **48 / 72 are the numbers to check** — title-only, and title + description (12 + 24 + 24 + 12).
    **Story trap:** the variant matrix is a grid, not Badge's `<table>`. A `w-full` component in an
    auto-layout table cell collapses to its longest word (measured 77px instead of 320). And the
    corner cell cannot be Badge's `sr-only` span — `sr-only` is `position: absolute`, so it drops out
    of grid flow and shifts every row one column left.
    Left out of Astryx: `container="section"` (full-bleed, no radius), the collapsible
    `children`/`defaultIsExpanded` detail area, and the four-step `elevation` scale — Figma draws one
    raised state, so that is the `floating` boolean. Its `icon` override is kept.
    **The `icon` override exists in Figma too, as an exposed nested instance** — the mechanism Button
    and Badge already use for their icon slots. Not an `INSTANCE_SWAP` property: no component set in
    the file uses one, and a set-level swap property carries a single shared default, which would
    flatten the four per-type glyphs into one. Exposing the nested instance keeps each variant's own
    glyph as its default. Seven of the eight variants were already exposed; `Type=Info, Floating=False`
    — the default variant — was not, which is worth knowing as a shape of bug this file can carry:
    a property set on every variant *except* the default one reads as fine until someone drops in a
    fresh instance.

11. **Toast** — a brief notification that confirms something happened and then leaves. Mirrors Figma
    node `40004135:15969`: `Type` default | success | danger, plus the Description / Has Action /
    Is Dismissable booleans, which become slots as Banner's do. Banner's transient twin, and the two
    should be described against each other: a banner stays, a toast interrupts and goes.
    **Default is the Decorative/Stone ramp, not `feedback-info`.** A toast that only confirms
    something is neutral; the file says so, and Astryx agrees (it has just info and error). Success
    and danger are Banner's `feedback-*` pairs, so again no `dark:` class anywhere.
    **No icon rail** — Banner centres a glyph in a 16px column, Toast's text starts flush against the
    16px padding. A real difference between the two, not an omission. **72 / 48 are the numbers to
    check** (title + description, and title only). Figma draws the dismiss button 28×24 (`px-2` round
    a 12px glyph); `Button` makes an icon-only small button a 24px square and the code is right —
    Figma is the one that drifts. `overflow-clip` not ported, for the third time.
    **The first component that is not just a rendered element.** It is created imperatively, queues,
    dismisses on a timer, pauses that timer while you look at it, and animates in a portal. Sixth
    Base UI component. API follows Astryx's split: `Toast.Provider` + `Toast.Viewport` +
    `Toast.useToast()` for real use, and a plain `<Toast>` that draws the card inline "for previews
    and documentation" — which *is* the Figma component, and is what makes the variant story a static
    grid like Banner's. `Toast.Viewport` takes no children, deliberately unlike Base UI's docs, which
    have every app hand-assemble Root/Content/Title/Description/Close. Raw parts attached as usual.
    **Unlike Tooltip there is no ARIA to patch** — verified in `node_modules`, not assumed. The
    viewport is a `role="region"` `aria-live="polite"` landmark named "Notifications", reachable with
    F6, and it pauses every timer while hovered or focused; each root is a non-modal `role="dialog"`
    named by its title. That is why `title` is required and only `description` is a slot.
    **The stack is CSS.** Base UI publishes `--toast-index`, `--toast-offset-y`, `--toast-height` and
    `--toast-frontmost-height`; collapsed, cards peek 12px and shrink 5% each (capped at three deep)
    and all clamp to the frontmost height, and `Toast.Content[data-behind]` fades the buried text out.
    `duration-medium-min` + `ease-standard` for the move, `duration-fast` for the fade. Fourth
    component on the motion tokens, and more evidence for the rule above: check what the headless
    primitive already measures before reaching for JavaScript.
    **One authoritative `[transform:…]`,** fed by `--stack-y` / `--stack-scale`, because the swipe
    offset has to compose into the same transform as the stack offset. `data-[expanded]:` sets only
    those two properties (0,2,0) so it beats the base rule (0,1,0); entry and exit replace `transform`
    outright at 0,2,0; the swipe-direction exits stack a third attribute to 0,3,0. Nothing depends on
    the order Tailwind emits.
    `position` bottom-right | bottom-center | top-right | top-center is ours, not Figma's — the file
    draws a card, never a viewport — and the corner, the growth direction, the entry/exit direction
    and `swipeDirection` all derive from it rather than being separate knobs. The `after:` strip on
    each toast bridges the 8px gap between expanded cards: `mouseleave` does not fire over a
    descendant, but the gap belongs to neither card, so without it the stack collapses as you move
    down it.
    **Two a11y traps, both about `aria-hidden` on something focusable, and neither caught by the
    story suite** — a11y runs on first render, when the stack is empty. Found by running axe against
    a live stack in the browser; do that for any component whose interesting state is not its initial
    one. (1) Base UI puts `aria-hidden` on `Toast.Close` while the stack is collapsed but leaves it
    tabbable, so the tabindex is kept in lockstep via `Toast.Content`'s render callback. (2) A
    `priority: 'high'` toast is aria-hidden until the viewport is focused; the root's tabindex is read
    back off its own resolved `aria-hidden` so it cannot drift, but an action button *inside* the
    hidden subtree is still focusable and axe flags that too. Which is why **danger gets `timeout: 0`
    but not `priority: 'high'`** — a toast that never leaves does not need to interrupt, and the
    viewport's polite live region announces it anyway.
    **`optimizeDeps` again.** `@base-ui/react/toast` had to be named in `vite.config.ts`: it was the
    first Base UI subpath no story imported at module scope, so the optimizer discovered it mid-run,
    re-bundled, reloaded the page under the test, and all eight Toast stories failed with "Failed to
    fetch dynamically imported module". Name any new Base UI subpath there.
    Left out of Astryx: `collisionBehavior: 'ignore'` (Base UI's ids always overwrite),
    `onHide(reason)`, and anchored toasts — `Toast.Positioner` and `Toast.Arrow` are attached but the
    managed viewport does not use them, and anchored toasts want their own provider.

12. **Checkbox** — a box you tick to turn one thing on or off. Mirrors Figma node `40004007:4067`:
    `In Container` false | true × `State` default | hover | focus | invalid | disabled ×
    `Selected State` default | indeterminate | selected, plus the `Label`, `Sub Label` and `Slot`
    booleans. Twenty-four of the thirty combinations are drawn; the gaps are all "hover or invalid
    on an already-ticked box", which the CSS covers anyway.
    **Seventh Base UI component**, first on `Checkbox`. It supplies `role="checkbox"`,
    `aria-checked` (including `"mixed"`), the hidden `<input type="checkbox">` that makes it submit
    with a form, and `data-checked` / `data-unchecked` / `data-indeterminate`.
    **Indeterminate is a prop, not a third value of `checked`** — which matches the DOM, where
    `input.indeterminate` has always been separate. The glyph is chosen from the prop rather than
    from Base UI's state, because a box can be indeterminate whether or not it is also checked.
    Ticked and indeterminate share one fill (`input-selected` for background *and* border) and
    differ only in the glyph: `Check` or `Minus`, at 14px because Figma binds `width/w-3,5` and
    Icon's own scale is 12/16/20/24 — the one place a `className` overrides an Icon size.
    **The row is a real `<label>`**, which is what makes clicking the text toggle the box, and is
    the path Base UI supports for naming a root that is not a native button. **This is the opposite
    call from SegmentedControl**, which pairs `nativeButton` with `render={<button>}`: a segment
    sits in a radiogroup with roving tabindex and no label element around it, so it has to be a
    button to get `:focus-visible`. A checkbox already has one wrapped round it. Verified in the
    browser: `aria-labelledby` resolves to the label text, and label-click and box-click both toggle.
    **The card's line is an `inset-ring`, not a border.** Figma draws the container 40px tall —
    24 of line-height plus 8 above and below — and a border would add its 2px on top and make it 42.
    A ring is a shadow, so it costs no layout. That is Avatar's trick, and it settles the focus
    idiom for the card too: `inset-ring-2` + `ring-3`, Avatar's, while the 20px box keeps Button's
    `border-2` + `ring-3` because it has a real border and a fixed size the inward border cannot
    grow. **40 is the number to check**, and 20 for the box.
    `invalid` is a prop rather than a CSS state, and the one member of Figma's `State` axis that
    stays one: Base UI publishes `data-invalid` only for a checkbox inside a `Field`, which this
    library does not have yet. Swap it for `data-invalid:` when Field lands.
    **Open question for Figma:** the box is centred against the whole label block, which is what
    Figma's auto-layout does, but most systems top-align once a sub-label makes the text two lines.
    Figma has a **Checkbox Group** set too (and Base UI a `CheckboxGroup`); neither is built, so the
    `Parent` story does the indeterminate arithmetic by hand.

**Still to build**, foundational/static first:

13. **Radio** — Figma node `40004007:4096`, the same axes as Checkbox. Then **Menu**, which needs both.
14. **Card** — native container using `bg-surface-card-primary`, `border-surface-border`, elevation.
15. **List Item** — variants/states; native, styled.
16. **Table Cell** — native, styled.
17. Then: Indicator, Chart Legend Buttons, Carousel Pagination Button.

For each: read its Figma variants → model them as typed props → implement with `tailwind-variants` →
cover all states → write a story showing every variant in light and dark.

## Working style

- Propose a short plan and get a yes before scaffolding or installing.
- Keep commits/steps small and explain them in plain language.
- Don't hardcode colours, spacing, radii, or shadows — always tokens.
- Verify by measuring (computed styles, screenshots) rather than assuming.
