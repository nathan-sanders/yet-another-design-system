# Yet Another Design System — tokens (Tailwind v4)

This folder is the **token foundation** of your design system, generated straight from your Figma
variables. It's the first of the layers described below; components come next.

## What's here

- **`theme.css`** — the file your app imports. Contains all your tokens as Tailwind v4 theme
  variables. This is the deliverable.
- `tokens/*.json` — the raw values pulled from Figma (primitives, semantic, dimensions).
- `generate.py` — rebuilds `theme.css` from the JSON. Re-run it whenever your Figma tokens change.

## How the three tiers map to code

| Figma collection | In `theme.css` | Result |
|---|---|---|
| **Colors** (primitives) | `@theme { --color-blue-500 … }` | utilities like `bg-blue-500` |
| **Semantic Theme** (Light/Dark) | `:root { --surface-canvas … }` + `.dark { … }` | tokens that flip per theme |
| **Design Tokens** (spacing, type, radius, shadows) | `@theme { --radius-md, --text-base, --shadow-low … }` | `rounded-md`, `text-base`, `shadow-low` |

Your semantic tokens are exposed as utilities too, so you get readable classes such as
`bg-surface-canvas`, `text-content-primary`, `border-surface-border`, `bg-action-primary-background`.
Because dark mode is wired to the semantic layer, **you never write a `dark:` variant for color** —
the token swaps itself.

## Dark mode

Add `class="dark"` to your `<html>` element (or toggle it with JS). Everything using semantic tokens
updates automatically.

## Using it in a project (setup outline)

You don't have this running yet — these are the steps to stand it up. A developer can do this in
minutes; with an AI coding tool you can follow along.

1. Create a React app with Vite (TypeScript recommended).
2. Add Tailwind v4: install `tailwindcss` and `@tailwindcss/vite`, and enable the Vite plugin.
3. Install Base UI: `@base-ui/react` (unstyled, accessible component behavior). Note: v1 renamed
   the package from `@base-ui-components/react` to `@base-ui/react`.
4. Put `theme.css` in your `src/` and `import "./theme.css"` at your app entry. The
   `@import "tailwindcss";` at the top is already included.
5. Add the **Inter** and **Geist Mono** fonts (your `--font-sans` / `--font-mono`).
6. Add Storybook to preview components in isolation as you build them.

## Refreshing tokens later

When you change variables in Figma, re-export the three JSON files and run:

```
python3 generate.py
```

`theme.css` is regenerated. Nothing is hand-edited, so your Figma stays the source of truth.

## What's next (the component layer)

Each Figma component becomes a small React component: take the unstyled Base UI primitive
(Button, Dialog, Tabs, …) and apply Tailwind classes that point at these semantic tokens. Your
Figma variants (e.g. Button size / variant / state) become the component's props.
