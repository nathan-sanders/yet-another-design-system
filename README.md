# Yet Another Design System

A themeable React component library whose entire look is driven by design tokens exported from
Figma — so the code and the design file stay in sync, and dark mode costs nothing to support.

Built with React 19, TypeScript, Vite, Tailwind CSS v4, and [Base UI](https://base-ui.com).
Previewed in Storybook.

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
| `python3 generate.py` | Rebuild `theme.css` from `tokens/*.json` |

## How it works

Three layers, each generated from the one above it.

```
Figma variables  →  tokens/*.json  →  generate.py  →  src/styles/theme.css  →  components
```

| Figma collection | Becomes | Gives you |
|---|---|---|
| **Colors** (primitives) | `@theme { --color-blue-500 … }` | `bg-blue-500` |
| **Semantic Theme** (Light/Dark) | `:root { … }` + `.dark { … }` | `bg-surface-canvas`, `text-content-primary` |
| **Design Tokens** (spacing, type, radius, shadows) | `@theme { --radius-md … }` | `rounded-md`, `text-base`, `shadow-low` |
| **Motion** (durations, easing) | `@theme { --transition-duration-fast … }` | `duration-fast`, `ease-standard` |

`src/styles/theme.css` is **generated — never edit it by hand.** When Figma changes, re-export the
three JSON files into `tokens/` and run `python3 generate.py`.

### The rule for components

Style with **semantic** tokens, never primitives or raw colour:

```tsx
// yes
<div className="bg-surface-card-primary text-content-primary border-surface-border" />

// no — primitives are for defining semantics, not for using in components
<div className="bg-stone-100 text-stone-800" />
```

### Dark mode

Add `class="dark"` to `<html>`. That's the whole mechanism. Because colour lives in the semantic
layer, components **never** need a `dark:` variant — the token swaps itself.

### Colour is OKLCH

Every colour ships as `oklch()`. Figma can only store hex, so the exported values are 8-bit
roundings of colours that are really defined in OKLCH. Every primitive here is a Tailwind palette
colour, so `generate.py` reads the installed Tailwind and uses its canonical value:

```css
--color-red-500: oklch(63.7% 0.237 25.331);
```

**Tailwind is the source of truth for colour primitives.** A primitive changed in Figma is ignored
in favour of Tailwind's value — `generate.py` reports any such disagreement rather than discarding
it silently. Colours that aren't Tailwind values belong in the semantic layer, which is entirely
Figma-driven.

## Components

| Component | Variants |
|---|---|
| **Avatar** | Photo, initials or `+N` at 5 sizes (20/24/36/40/128); online/offline/unavailable status, each with its own shape |
| **AvatarGroup** | Overlapping row at one shared size, with an overflow circle |
| **Badge** | 18 Decorative hues, one size (20px), with icon slots — static, no states |
| **Banner** | 4 feedback types (info, success, warning, danger) × inline/floating, with title, description, action and dismiss slots |
| **Breadcrumbs** | Composed trail; 4 separators (slash, chevron, arrow, dot); link/current-page items × default/hover/focus/disabled, with icon slots |
| **Button** | 5 appearances (primary, secondary, destructive, ghost, overlay) × 3 sizes × default/hover/focus/disabled, with icon slots, plus an icon-only form |
| **Checkbox** | Unticked, ticked or indeterminate × bare/in-container × default/hover/focus/invalid/disabled, with label and sub-label |
| **Divider** | Horizontal/vertical × solid/dashed × default/emphasized — 1px in all eight |
| **Field** | The label, sub-label and validation message around any control — Input, InputGroup, Checkbox, Radio |
| **Icon** | Any [Lucide](https://lucide.dev) glyph at 4 sizes (12/16/20/24), stroke 1.5 |
| **Input** | A single line of free text; 3 sizes (24/32/40) × default/hover/focus/invalid/disabled |
| **InputGroup** | The same field with addons attached — an icon, a button, a `https://` prefix — each choosing its own side: beside the text or on a row of its own |
| **Link** | A styled anchor at any of the 13 type steps — or at none, inheriting the sentence it sits in; external links get an arrow, a new tab and safe `rel`; `render` swaps in a router link |
| **Menu** | Composed popup; action, submenu, checkbox and radio items × default/highlighted/disabled, plus destructive items and labelled groups |
| **Radio** | Composed group; unselected/selected × bare/in-container × default/hover/focus/invalid/disabled, with label and sub-label |
| **SegmentedControl** | Composed group; 2 appearances (secondary, ghost) × 3 sizes × hug/fill, with icon slots — the same 24/32/40 heights as Button |
| **Slider** | One handle, or a pair for a range × default/disabled, with label, sub-label, bounds labels, marks and a value tooltip |
| **Switch** | Off/on × bare/in-container × default/hover/focus/invalid/disabled, with label and sub-label — the knob grows from 14 to 16px as it slides |
| **Tabs** | Composed strip + panels; 3 sizes × hug/fill, with icon and end slots — the underline slides between tabs in pure CSS |
| **Toast** | 3 types (default, success, danger) with description, action and dismiss slots; fired from a `useToast()` hook into a stack that collapses into one card and expands on hover, in pure CSS |
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
or a Radio (few enough to show at once); an Autocomplete looks like a Combobox and differs on the one
thing that matters, which is that it suggests without constraining.

The text around a control belongs to `Field`, not to the control — so a labelled input is a `Field`
wrapping an `Input`, and the same `Field` works for a Checkbox or a group of Radios. It wires itself
up: the label points at whatever is inside it, and the sub-label and validation message both land in
`aria-describedby`, so they are read out rather than just seen. Passing `error` is enough to put the
field in its invalid state — a red message beside a neutral border would be a bug.

```tsx
<Field label="Email" description="We'll only use it to sign you in" error="Email must include an @">
  <Input type="email" placeholder="ada@example.com" />
</Field>
```

An `InputGroup` is the same field with things attached, and each addon picks its own side
independently, so an icon can sit beside the text while a row of actions sits underneath. Its stacked
height is exactly three of its inline heights, which falls out of the parts rather than being set.

A checkbox and a switch look like the same control twice, and they are not. A checkbox states an
intention that a Save button later commits; a switch *is* the commit, taking effect the moment you
let go. So a form full of settings wants checkboxes and a button, and a settings pane with no button
at the bottom wants switches. Both wrap their label in a real `<label>`, which is what makes the text
a hit target as well as the accessible name.

Still to build: Card, List Item, Table Cell, Indicator, Chart Legend Buttons, Carousel
Pagination Button.

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
