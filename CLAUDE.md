# Yet Another Design System

A production design system built by a **product designer who does not write code**. Treat the human
as an expert on design-system concepts (tokens, variants, semantics, a11y) but assume they will not
hand-edit code — explain choices in plain language, and keep the setup runnable with simple commands.

## Goal

Ship a themeable React component library whose look is driven entirely by design tokens exported from
Figma, so the code matches Figma and both stay in sync.

## Stack

- **React + TypeScript**, built with **Vite**
- **Tailwind CSS v4** (via `@tailwindcss/vite`) — theme lives in CSS, not `tailwind.config.js`
- **Base UI** — headless, accessible primitives. Package is **`@base-ui/react`** (v1+; it was renamed
  from `@base-ui-components/react`, so ignore older docs that use the old name). Import e.g.
  `import { Dialog } from '@base-ui/react'` or subpath `'@base-ui/react/dialog'`. Components use the
  compound pattern (a `Root` orchestrates state; child parts consume context).
- **Storybook** for previewing/testing each component in isolation
- Recommended for variants: **`tailwind-variants`** (or `cva`) to map Figma variants → class sets
- Fonts: **Inter** (sans), **Geist Mono** (mono)

## Target repo structure

Scaffold into this layout (adjust only with the human's OK):

```
nates-design-system/
├─ CLAUDE.md  README.md
├─ package.json  vite.config.ts  tsconfig.json  index.html
├─ tokens/                     # Figma exports — source for generate.py
│  ├─ primitives.json  semantic.json  dimensions.json
├─ generate.py                 # tokens/*.json -> src/styles/theme.css
├─ .storybook/                 # main.ts, preview.ts (imports theme.css; light/dark bg)
└─ src/
   ├─ styles/theme.css         # GENERATED — do not hand-edit
   ├─ lib/cn.ts                # className merge helper (clsx + tailwind-merge)
   ├─ components/
   │  └─ Button/               # Button.tsx, Button.stories.tsx, index.ts
   ├─ index.ts                 # library barrel export
   └─ main.tsx  App.tsx        # dev playground: token swatches + dark-mode toggle
```

Each component gets its own folder with the component, its Storybook story, and a barrel `index.ts`.

## Design tokens (already built — do not regenerate by hand)

`theme.css` is generated from Figma and is the styling foundation. Structure:

- `@theme { --color-* … }` — the **primitive** palette (e.g. `--color-blue-500`) → utilities like
  `bg-blue-500`. Also holds static dimensions: `--spacing: 0.25rem` (drives the whole numeric
  spacing/width/height scale), `--radius-*`, `--text-*` (+ `--text-*--line-height`), `--blur-*`,
  `--shadow-*`, `--inset-shadow-*`, `--font-sans/-mono`, `--font-weight-*`.
- `:root { --surface-canvas … }` and `.dark { … }` — the **semantic** tokens (role-based, theme-aware).
- `@theme inline { --color-surface-canvas: var(--surface-canvas) … }` — exposes semantic tokens as
  color utilities.

### The golden rule for components

**Style components with semantic-token utilities, never raw primitives or hex.** Use classes like
`bg-surface-card-primary`, `text-content-primary`, `border-surface-border`,
`bg-action-primary-background`, `text-action-primary-foreground`, `hover:bg-action-primary-background-hover`,
`shadow-low`, `rounded-md`. Primitive utilities (`bg-blue-500`) exist but are for defining semantics,
not for use inside components.

### Dark mode

Toggled by `class="dark"` on `<html>`. Because color lives in the semantic layer, **do not write
`dark:` variants for color** — the token swaps itself. A theme toggle just adds/removes that class.

### Refreshing tokens

Tokens come from Figma → `tokens/*.json` → `generate.py` → `src/styles/theme.css`. When Figma changes,
re-export the JSON and run `python3 generate.py`. Never hand-edit the generated `theme.css`.

## Figma is the source of truth

- File key: `8bRBn0lf6TfPyFWR2XttDP` (Yet Another Design System)
- If the Figma MCP is available here, read component variants/props directly before building each one:
  - `search_design_system` — find published components
  - `use_figma` with the Plugin API (`figma.variables.*`, `figma.getNodeByIdAsync`, `findAllWithCriteria`)
    to inspect variant sets, or `get_context_for_code_connect` for a component's property/variant tree
  - Colors come back as `{r,g,b,a}` 0–1 floats — convert to hex
- If the Figma MCP is **not** wired into Claude Code, proceed from `theme.css` + the exported JSON, and
  ask the human to paste a screenshot or the variant list for each component.

## Components to build (from the Figma library)

Build order — foundational/static first, interactive later:

1. **Button** — variants: primary, secondary, destructive, ghost, overlay; sizes; states
   (default/hover/disabled/loading). Likely a native `<button>` styled with tokens (Base UI has no
   generic Button). Read the exact variant matrix from Figma first.
2. **Card** — native container using `bg-surface-card-primary`, `border-surface-border`, elevation.
3. **List Item** — variants/states; native, styled.
4. **Table Cell** — native, styled.
5. **Tab Button / Tabs** — use **Base UI `Tabs`** for behavior; style with tokens.
6. Then: Indicator, Chart Legend Buttons, Carousel Pagination Button.

For each component: read its Figma variants → model them as typed props → implement with
`tailwind-variants` → cover all states → write a Storybook story showing every variant in light and
dark.

## Suggested first steps (let the human confirm before large actions)

1. Scaffold Vite + React + TS.
2. Wire Tailwind v4 (`@tailwindcss/vite`) and import `theme.css`; load Inter + Geist Mono.
3. Install `@base-ui/react`, `tailwind-variants`; set up Storybook.
4. Prove the pipeline: a page showing token swatches + a dark-mode toggle, so we can see tokens working.
5. Build **Button** end-to-end as the reference pattern, then proceed down the list.

## Working style

- Propose a short plan and get a yes before scaffolding or installing.
- Keep commits/steps small and explain them in plain language.
- Don't hardcode colors, spacing, radii, or shadows — always tokens.
