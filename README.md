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
| **Button** | 6 appearances (primary, secondary, destructive, ghost, overlay, link) × 3 sizes × default/hover/focus/disabled, with icon slots |
| **Icon** | Any [Lucide](https://lucide.dev) glyph at 4 sizes (12/16/20/24), stroke 1.5 |

```tsx
import { Button, Icon } from './src'
import { Plus, Star } from 'lucide-react'

<Button appearance="primary" size="large" startIcon={Plus}>Create</Button>
<Icon icon={Star} size="large" />
```

Icons take the Lucide component itself (`startIcon={Plus}`, not `<Plus />`) so the design system
controls size and stroke weight rather than the call site. Lucide icons aren't re-exported from this
library — import them from `lucide-react` directly so bundlers tree-shake to only what you use.

Still to build: Card, List Item, Table Cell, Tabs, Indicator, Chart Legend Buttons, Carousel
Pagination Button.

## Project structure

```
├─ tokens/                  # Figma exports — the input to generate.py
│  ├─ primitives.json  semantic.json  dimensions.json
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
