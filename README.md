# Yet Another Design System

![A collage of the library's components around the YET wordmark: a context menu, success and info
banners, a text-formatting toolbar, a card with a slider and a token input, a profile card, and a
pair of radio options.](src/yads-hero.png)

A themeable React component library whose entire look is driven by design tokens exported from
Figma — so the code and the design file stay in sync, and dark mode costs nothing to support.

Built with React 19, TypeScript, Vite, Tailwind CSS v4, and [Base UI](https://base-ui.com), with
[Recharts](https://recharts.org) behind the charts. Previewed in Storybook.

**[Browse the components →](https://nathan-sanders.github.io/yet-another-design-system/)** ·
**[Open the Figma file →](https://www.figma.com/design/8bRBn0lf6TfPyFWR2XttDP/Yet-Another-Design-System)**

## Quick start

```bash
npm install
npm run dev          # token playground at localhost:5173
npm run storybook    # component library at localhost:6006
```

| Script | What it does |
|---|---|
| `npm run dev` | Playground showing every token, with a dark-mode toggle |
| `npm run storybook` | Every component, every variant, light and dark |
| `npm run build` | Type-check and build |
| `npm run lint` | Lint with oxlint |
| `npm test` | Run every story in real Chromium, checked with axe |
| `python3 generate.py` | Rebuild `theme.css` from `tokens/*.json` |

Lint, build and the story suite all run on every pull request — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml). Every push to `main` also
publishes Storybook to GitHub Pages — see
[`.github/workflows/deploy-storybook.yml`](.github/workflows/deploy-storybook.yml).

## How it works

Three layers, each generated from the one above it, starting from the
[Figma file](https://www.figma.com/design/8bRBn0lf6TfPyFWR2XttDP/Yet-Another-Design-System) — which
is the source of truth for everything below it.

```
Figma variables  →  tokens/*.json  →  generate.py  →  src/styles/theme.css  →  components
```

| Figma collection | Becomes | Gives you |
|---|---|---|
| **Colors** (primitives) | `@theme { --color-blue-500 … }` | `bg-blue-500` |
| — (a code-side tier) | `:root { --neutral-800 … }` | the ramp `data-neutral` chooses |
| **Semantic Theme** (Light/Dark) | `:root { … }` + `.dark { … }` | `bg-surface-canvas`, `text-content-primary` |
| **Design Tokens** (spacing, type, radius, shadows) | `@theme { --radius-md … }` | `rounded-md`, `text-base`, `shadow-low` |
| **Motion** (durations, easing) | `@theme { --transition-duration-fast … }` | `duration-fast`, `ease-standard` |

`src/styles/theme.css` is **generated — never edit it by hand.** When Figma changes, re-export the
three JSON files into `tokens/` and run `python3 generate.py`.

### The rule for components

Style with **semantic** tokens, never primitives or raw color:

```tsx
// yes
<div className="bg-surface-background-primary text-content-primary border-surface-border" />

// no — primitives are for defining semantics, not for using in components
<div className="bg-stone-100 text-stone-800" />
```

### Dark mode

Add `class="dark"` to `<html>`. That's the whole mechanism. Because color lives in the semantic
layer, components **never** need a `dark:` variant — the token swaps itself.

### Neutral scales

The neutral is swappable. Nine ramps ship — **Stone** (the default), Taupe, Mauve, Mist, Olive,
Slate, Gray, Zinc and Neutral — and picking one is a single attribute:

```html
<html data-neutral="taupe">
```

That changes every surface, border, text color, button, input, focus ring, shadow and neutral badge
at once, in both light and dark. Nothing else has to know.

It works because the semantic layer never names a ramp. It goes through an eleven-step alias tier:

```
--color-stone-800   primitive     nine ramps, unchanged
      ↓
--neutral-800       the tier      re-pointed by [data-neutral]
      ↓
--surface-background-emphasized: var(--neutral-800)
      ↓
bg-surface-background-emphasized
```

Two things worth knowing:

- `--neutral-800` (the tier) and `--color-neutral-800` (Tailwind's Neutral ramp) are different
  things. The `--color-` prefix is what marks a primitive throughout this system. The tier is
  deliberately **not** in `@theme`, so it generates no `bg-neutral-*` utilities and cannot shadow
  the real Neutral scale.
- It composes with dark mode rather than multiplying against it. The ramp is theme-independent; the
  semantic layer decides which of its steps each theme uses.

Contrast is not automatic. The ramps differ slightly in lightness at the same step, so a pair that
clears 4.5:1 on Stone is not guaranteed to on Olive. Check before shipping a non-default ramp.

### Color is OKLCH

Every color ships as `oklch()`. Figma can only store hex, so the exported values are 8-bit
roundings of colors that are really defined in OKLCH. Nearly every primitive here is a Tailwind
palette color, so `generate.py` reads the installed Tailwind and uses its canonical value:

```css
--color-red-500: oklch(63.7% 0.237 25.331);
```

**Tailwind is the source of truth for color primitives.** A primitive changed in Figma is ignored
in favor of Tailwind's value — `generate.py` reports any such disagreement rather than discarding
it silently. Colors that aren't Tailwind values belong in the semantic layer, which is entirely
Figma-driven.

The four custom neutral ramps — **Taupe, Mauve, Mist and Olive** — are the exception: they have no
Tailwind counterpart, so their 44 values are converted from the Figma hex. `generate.py` lists them
on every run under "scale-shaped names with no Tailwind counterpart", which is expected, not a fault.

## Components

| Component | Variants |
|---|---|
| **Accordion** | A stack of sections, single- or multi-open (`multiple`); card or flush (`container`); optional leading icon, heading level 2–6 |
| **AlertDialog** | The same surface asking you to confirm something you cannot undo — `role="alertdialog"`, a required description saying what will happen, and no close button. Base UI hands over every part but the Root, so these are literally Dialog's |
| **Autocomplete** | Free text with suggestions that do not constrain it; 3 sizes (24/32/40) × default/hover/focus/invalid/disabled, a magnifier in the start slot, and rows that can carry an avatar or a sub-label. Looks like a Combobox and differs on the one rule: an off-list value stands |
| **Avatar** | Photo, initials or `+N` at 5 sizes (20/24/36/40/128); online/offline/unavailable status, each with its own shape; `surface` names the fill behind it (the four `--surface-*` plus `nav`) so both rings read as gaps rather than halos |
| **AvatarGroup** | Overlapping row at one shared size, with an overflow circle |
| **Badge** | 18 Decorative hues, one size (20px), with icon slots — static, no states |
| **Banner** | 4 feedback types (info, success, warning, danger) × inline/floating, with title, description, action and dismiss slots |
| **BentoGrid** | The mosaic a set of `ContentBlock`s sits in; 2/3/4 columns × default/loose gutter, with a `BentoGrid.Cell` spanning 1–4 columns and 1–3 rows — one breakpoint collapses the grid to a single column and drops every span with it |
| **Breadcrumbs** | Composed trail; 4 separators (slash, chevron, arrow, dot); link/current-page items × default/hover/focus/disabled, with icon slots |
| **Button** | 5 appearances (primary, secondary, destructive, ghost, overlay) × 3 sizes × default/hover/focus/disabled, with icon slots, plus an icon-only form |
| **Card** | The plain container; 3 emphases (default, subtle, accent) × flat/floating, padding named as a spacing token — `rounded-md` on 12px where a `ContentBlock` is `rounded-lg` on 16, so the two are drawn to nest |
| **ClickableCard** | The same card as a hit target; 2 emphases (default, ghost) × default/hover/focus/disabled, plus `selected`. Passing `href` picks the element — an `<a>` with one, a `<button>` without — and `selected` lands on `aria-current` |
| **Checkbox** | Unticked, ticked or indeterminate × bare/in-container × default/hover/focus/invalid/disabled, with label and sub-label |
| **Checkbox.Group** | Vertical or horizontal set sharing one value, with an optional "select all" that computes its own half-selected state |
| **Combobox** | A list too long to scroll, filtered by typing; 3 sizes (24/32/40) × default/hover/focus/invalid/disabled — a trigger with a searchable popup, or a tokenizer whose chosen values sit in front of the caret as `Token`s |
| **ContentBlock** | A card owning one titled region of a page; composed header (title, icon, title slot, actions) + body, 3 emphases (default, subtle, accent) × flat/floating, heading level 2–6 |
| **ContextMenu** | The same popup as Menu, opened by right-click or long press at the pointer — action, submenu, checkbox and radio items, destructive items and labeled groups. Base UI hands over Menu's own parts, so these are literally the same rows |
| **Dialog** | A modal surface that blocks the page until you answer it; a title, a body and a row of actions, at 600px or any width you pass. `Dialog.Body` is the part that scrolls, so a long dialog keeps its title and close button in place while the middle moves |
| **Divider** | Horizontal/vertical × solid/dashed × default/emphasized — 1px in all eight |
| **Field** | The label, sub-label and validation message around any control — Input, InputGroup, Select, Checkbox, Radio |
| **Icon** | Any [Lucide](https://lucide.dev) glyph at 4 sizes (12/16/20/24), stroke 1.5 |
| **Input** | A single line of free text; 3 sizes (24/32/40) × default/hover/focus/invalid/disabled, in a default or ghost appearance |
| **InputGroup** | The same field with addons attached — an icon, a button, a `https://` prefix — each choosing its own side: beside the text or on a row of its own |
| **Kbd** | A keyboard shortcut, one 20px key per keystroke, from a single `keys` string split on `+`. Prefer `mod`: it draws ⌘ on Apple platforms and ⌃ everywhere else, so one call site is right on both |
| **Link** | A styled anchor at any of the 13 type steps — or at none, inheriting the sentence it sits in; external links get an arrow, a new tab and safe `rel`; `render` swaps in a router link |
| **Menu** | Composed popup; action, submenu, checkbox and radio items × default/highlighted/disabled, plus destructive items and labeled groups |
| **MobileNav** | The phone bar and the sheet its trigger opens; a 56px strip with a logo, a section-trigger pill naming where you are, and icon utilities. `placement` pins it to the bottom (default) or top edge, and the sheet slides up from the bottom either way. Takes the same `SideNav.Section` tree the rail does, so a responsive app writes its navigation once |
| **NavItem** | One row of a navigation bar; 2 sizes (Figma's Primary/Secondary, 14/24 and 12/20) × default/hover/selected/focus, with a 24px icon-or-avatar start slot, badge end slot, an 8px new indicator pinned to its corner, a 24px indent that aligns a child's label with its parent's, and an expand chevron in `nav-content-subtle`. `href` makes an `<a>`, otherwise a `<button>`, and `render` takes a router link |
| **Popover** | A click-triggered panel anchored to a button or a link; a title, a body and whatever the panel is for, at 324px or any width you pass. The library's first `role="dialog"` — so it wants a `Popover.Title`, which is what names it |
| **Radio** | Unselected/selected × bare/in-container × default/hover/focus/invalid/disabled, with label and sub-label |
| **Radio.Group** | Vertical or horizontal set owning the value, the roving tabindex and the arrow keys |
| **SegmentedControl** | Composed group; 2 appearances (secondary, ghost) × 3 sizes × hug/fill, with icon slots — the same 24/32/40 heights as Button |
| **Select** | Pick one value, or several, from a list; 3 sizes (24/32/40) × hug/fill × default/hover/focus/invalid/disabled, with grouped and described items — the popup opens *over* the trigger, macOS-style, with the chosen row landing on the value |
| **SideNav** | The application rail; 224px expanded and 56px collapsed, with `SideNav.Section` (optional group header) and `SideNav.Group` (a disclosure built on Base UI's Collapsible). Collapsed, every label becomes both the accessible name and a tooltip, each section header becomes a 1px rule, and a group opens sideways as a 224px flyout on hover or click. `floating` toggles the drop shadow and nothing else. Logo and bottom-pinned utilities are slots |
| **Slider** | One handle, or a pair for a range × default/disabled, with label, sub-label, bounds labels, marks and a value tooltip |
| **Switch** | Off/on × bare/in-container × default/hover/focus/invalid/disabled, with label and sub-label — the knob grows from 14 to 16px as it slides |
| **Tabs** | Composed strip + panels; 3 sizes × hug/fill, with icon and end slots — the underline slides between tabs in pure CSS |
| **ThemeControl** | The light/dark switch; a ghost icon-only Button whose glyph is the theme you would *get* (a moon while light). Reports the intent through `onThemeChange` and never touches the document — the theme has to survive a reload and sync with a user setting, and both are the app's call |
| **Toast** | 3 types (default, success, danger) with description, action and dismiss slots; fired from a `useToast()` hook into a stack that collapses into one card and expands on hover, in pure CSS |
| **Token** | One chosen value as a pill; view-only or interactive × 2 sizes (24/20) × default/hover/focus/disabled, with icon, avatar and remove slots |
| **TopBar** | The page header that sits above the content beside a `SideNav`; breadcrumbs, a search field and an actions slot. The search fills the centre up to 600px and takes a `surface-overlay-subtle` wash when a trail is present, so its boundary is visible where it is centred. A `<header>`, so one per page — semantic tokens, not the navigation theme |
| **TopNav** | The horizontal bar, for an app or a marketing site; logo, a centred page list and end utilities, with `floating` toggling the drop shadow. No collapse — Figma draws none, and which breakpoint and what it collapses into are decisions the file does not make |
| **Tooltip** | One look, as in Figma; 4 sides × 3 alignments, with collision flipping |

```tsx
import { Badge, Banner, Breadcrumbs, Button, Icon, SegmentedControl, Toast, Tooltip } from './src'
import { House, LayoutGrid, List, Plus, Star, Trash2 } from 'lucide-react'

<Button appearance="primary" size="large" startIcon={Plus}>Create</Button>
<Icon icon={Star} size="large" />
<Badge color="green">Live</Badge>

<Banner
  type="warning"
  title="Your trial expires in 3 days"
  action={<Button appearance="overlay" size="small">Upgrade</Button>}
  onDismiss={() => setShown(false)}
>
  Upgrade now to keep access to all features.
</Banner>

<Breadcrumbs separator="chevron">
  <Breadcrumbs.Item href="/" startIcon={House}>Home</Breadcrumbs.Item>
  <Breadcrumbs.Item href="/projects">Projects</Breadcrumbs.Item>
  <Breadcrumbs.Item>My Project</Breadcrumbs.Item>
</Breadcrumbs>

<SegmentedControl aria-label="View mode" value={view} onValueChange={setView}>
  <SegmentedControl.Item value="grid" startIcon={LayoutGrid}>Grid</SegmentedControl.Item>
  <SegmentedControl.Item value="list" startIcon={List}>List</SegmentedControl.Item>
</SegmentedControl>

<Tooltip label="Delete project">
  <Button appearance="destructive" startIcon={Trash2} aria-label="Delete project" />
</Tooltip>

// Toast: a provider and a viewport once at the app root…
<Toast.Provider>
  <App />
  <Toast.Viewport position="bottom-right" />
</Toast.Provider>

// …then fire one from anywhere.
const toast = Toast.useToast()
toast.add({ type: 'success', title: 'Changes saved' })
toast.add({
  title: 'Item deleted',
  description: 'Q3 report',
  action: { label: 'Undo', onClick: restore },
})
```

A banner announces itself according to its type: info and success are polite `role="status"`, warning
and danger interrupt with `role="alert"`. Passing `onDismiss` is what renders the close button — the
banner never hides itself, so whether it is on screen stays yours.

A toast is the banner's transient twin: it interrupts briefly and leaves, where a banner stays. Danger
toasts are the exception — they wait to be dismissed, because a failure that scrolls past unread is
the one thing a notification system must not do. Several at once collapse into a single stack that
expands when you hover it or move the keyboard into it, and the whole animation is a CSS transition on
the motion tokens.

A segmented control is an *input*, not navigation, so it renders as a radio group: exactly one option
is always selected, and the arrow keys move between them. Its three heights are Button's, so the two
line up in a toolbar row without anyone nudging a margin.

A tooltip wraps whatever it describes — the child becomes the trigger, so any component works. It
lands on `aria-describedby`, which means it *describes* rather than names: an icon-only button still
needs its own `aria-label`, and the types enforce that.

The last `Breadcrumbs.Item` becomes the current page on its own — plain text with
`aria-current="page"` rather than a link — so you never mark it up by hand.

Icons take the Lucide component itself (`startIcon={Plus}`, not `<Plus />`) so the design system
controls size and stroke weight rather than the call site. Lucide icons aren't re-exported from this
library — import them from `lucide-react` directly so bundlers tree-shake to only what you use.

Reach for an `Input` when the answer is not from a known set — a name, an email, a URL. If the value
has to come from a list, the control is a Select (short list), a Combobox (long list, type to filter)
or a Radio (few enough to show at once); an `Autocomplete` looks like a Combobox and differs on the
one thing that matters, which is that it suggests without constraining — type something nobody
thought of and the value stands.

The text around a control belongs to `Field`, not to the control — so a labeled input is a `Field`
wrapping an `Input`, and the same `Field` works for a Checkbox or a group of Radios. It wires itself
up: the label points at whatever is inside it, and the sub-label and validation message both land in
`aria-describedby`, so they are read out rather than just seen. Passing `error` is enough to put the
field in its invalid state — a red message beside a neutral border would be a bug.

```tsx
<Field label="Email" description="We'll only use it to sign you in" error="Email must include an @">
  <Input type="email" placeholder="ada@example.com" />
</Field>
```

A ghost input has no fill and no stroke until you go near it — a wash on hover, the full chrome on
focus — for a global search entry that should sit quieter than a form field. Give it something to be
found by, though: a leading icon, a label, or a placeholder. A borderless box with nothing in it is
invisible, and whatever sits beside it is doing the work the border used to.

An `InputGroup` is the same field with things attached, and each addon picks its own side
independently, so an icon can sit beside the text while a row of actions sits underneath. Its stacked
height is exactly three of its inline heights, which falls out of the parts rather than being set.

Groups of either share one value rather than each option holding its own. `Checkbox.Group` takes an
`allValues` list, which is what lets its optional "select all" work out on its own whether it is
checked, unchecked or half — you never compute that. `Radio.Group` owns the selected value and the
arrow keys, and all four of them move between options whichever way the row runs.

Both stay bare: the group's name, its sub-label and its validation message come from a `Field` around
it, the same way they do for an input.

A checkbox and a switch look like the same control twice, and they are not. A checkbox states an
intention that a Save button later commits; a switch *is* the commit, taking effect the moment you
let go. So a form full of settings wants checkboxes and a button, and a settings pane with no button
at the bottom wants switches. Both wrap their label in a real `<label>`, which is what makes the text
a hit target as well as the accessible name.

### Data visualization

Charts are built on [Recharts](https://recharts.org) — the library shadcn/ui uses — and file under
**Data Viz** in Storybook rather than Components. They share one container, one legend, one tooltip
and one categorical palette.

| Chart | What it shows |
|---|---|
| **Chart** | The chrome the others sit in, drawing nothing itself: `ChartContainer`, `ChartLegend` (horizontal, vertical, stepped, gradient), `ChartTooltip` and `ChartSwatch`, plus the categorical palette, the marker shapes and the axis rules |
| **LineSeries** | Change over time, for up to 12 series; curve or linear × points on/off, with gridline count, a horizontal, vertical or absent legend, and an x-axis preset inferred from the data unless you name one |
| **AreaSeries** | A magnitude over time, as a filled shape; curve or linear × solid or gradient fill — a solid area is opaque, so the surface-colored edge along its top is what separates one from the one behind it |
| **VerticalBar** | A magnitude per category; grouped or stacked × total label on/off, with an optional accessibility overlay. Figma's three bar types are the one `stacked` boolean |
| **Spark** | A shape at the size of a word; line, bar or area. The one chart that is not a `ChartContainer`, and the type makes you choose: either a `label` or an explicit `decorative` |
| **Donut** | Parts of one whole, with a free-form center slot; hovering a slice raises a halo around it rather than resizing it |
| **Gauge** | The same parts-of-a-whole folded into a half circle — Donut's data shape, slice separator and halo, but the fold turns the hole into a shelf, so the radius has to be computed |
| **Radar** | Several series across the same handful of dimensions; scale labels on/off. The areas are translucent because with every series overlapping, no paint order can work |
| **HeatMap** | How much, across two dimensions at once; 3 mono scales (a, b, c) of 10 steps × a start/end legend or none, over a derived or pinned min/max. A CSS grid, not a chart |
| **TreeMap** | Parts of a whole, past the point a donut can carry them; values on/off — the only chart whose marks hold their own text |
| **Metric** | A labeled number and what it did; optional trend, and a slot for a `Spark` |
| **MetricCard** | The same metric on a `Card` |
| **MetricGrid** | The row those cards sit in; 2–6 columns from `md` up, two on a phone, × default/tight gutter |
| **TrendBadge** | The delta as a `Badge` — up, down or flat arrow, colored by whether that direction is the good one, so a fall in churn reads green |

```tsx
import { LineSeries, MetricCard, MetricGrid, Spark } from './src'

<LineSeries
  label="Followers by network, last 30 days"
  data={rows}
  xKey="date"
  series={[{ key: 'instagram', label: 'Instagram' }, { key: 'x', label: 'X' }]}
  interactiveLegend
/>

<MetricGrid columns={4}>
  <MetricCard
    label="Total followers"
    value="128,412"
    trend={6.1}
    spark={<Spark data={rows} dataKey="followers" decorative />}
  />
</MetricGrid>
```

Every chart takes a `label`, because an SVG full of shapes says nothing on its own. `Spark` is the
one that lets you out of it, and only by saying `decorative` out loud — an unlabeled `role="img"` is
the case an audit flags and a reader gets nothing from, so the types make you pick.

Three rules the charts hold to, each of which is easier to keep than to restore:

- **The categorical order is fixed, and never cycled by rank.** Past twelve series the scale returns
  the placeholder gray rather than wrapping, because two visible series sharing a color is worse
  than admitting the scale ran out. Color is assigned over the full series list rather than the
  visible one, which is what makes the interactive legend safe: switching a series off cannot
  repaint the ones left.
- **Text never wears the series color.** Identity comes from the swatch beside it. Three of the
  twelve hues are illegible as text on the light canvas, and coloring text also removes the channel
  a reader with low color vision was relying on.
- **Charts do not animate.** Recharts animates in JavaScript against its own constants — a second
  source of truth that Figma cannot reach — so `isAnimationActive={false}` throughout, and any
  motion that is wanted comes back as CSS on the motion tokens.

Color reaches a chart as `stroke="var(--data-viz-categorical-01)"` rather than as a class, because
SVG attributes take values. That is also why there is no counterpart to shadcn's `ChartStyle`, which
injects a `<style>` block per chart to map a variable onto a hex: `--data-viz-*` are semantic tokens
with a `.dark` block already, so a mark painted with one follows the theme with no injected CSS, no
second palette and no `dark:` variant.

Still to build: List Item, Table Cell, Indicator, Chart Legend Buttons, Carousel Pagination Button.

## Project structure

```
├─ tokens/                  # Figma exports — the input to generate.py
│  ├─ primitives.json  semantic.json  dimensions.json
│  └─ motion.json           # hand-seeded until Figma has motion variables
├─ generate.py              # tokens/*.json -> src/styles/theme.css
├─ .storybook/              # loads theme.css, adds the light/dark toolbar switch
└─ src/
   ├─ styles/theme.css      # GENERATED — do not hand-edit
   ├─ lib/cn.ts             # class-name merge helper
   ├─ components/           # one folder per component: .tsx, .stories.tsx, index.ts
   ├─ index.ts              # library barrel export
   └─ main.tsx  App.tsx     # token playground
```

## License

[MIT](LICENSE) © Nathan Sanders
