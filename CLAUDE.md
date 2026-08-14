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

1. **Button** — `appearance`: primary | secondary | destructive | ghost | overlay | **link**;
   `size`: small (24px) | default (32px) | large (40px); `startIcon`/`endIcon` take a `LucideIcon`.
   Hover/focus/disabled are CSS states, not props. Focus is a 2px inner border + 3px outer ring from
   the focus tokens, on `:focus-visible`. Disabled is `opacity-40`.
2. **Icon** — wraps any Lucide glyph. `size`: small 12 | base 16 | large 20 | x-large 24. Colour is
   `currentColor` so it inherits (that is what lets it sit inside a Button correctly). Stroke weight
   uses `--icon-stroke-weight` applied as CSS plus `vector-effect: non-scaling-stroke` — Lucide draws
   on a 24×24 viewBox, so without that a 1.5 stroke paints at 1px at 16px size.

**Still to build**, foundational/static first:

3. **Card** — native container using `bg-surface-card-primary`, `border-surface-border`, elevation.
4. **List Item** — variants/states; native, styled.
5. **Table Cell** — native, styled.
6. **Tab Button / Tabs** — use **Base UI `Tabs`** for behaviour; style with tokens.
7. Then: Indicator, Chart Legend Buttons, Carousel Pagination Button.

For each: read its Figma variants → model them as typed props → implement with `tailwind-variants` →
cover all states → write a story showing every variant in light and dark.

## Working style

- Propose a short plan and get a yes before scaffolding or installing.
- Keep commits/steps small and explain them in plain language.
- Don't hardcode colours, spacing, radii, or shadows — always tokens.
- Verify by measuring (computed styles, screenshots) rather than assuming.
