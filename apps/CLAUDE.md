# Mock apps

Real, routed products built only from the library, for two jobs: **show the range of the system**
to anyone with a link, and **stress-test it** — every app screen is a place a component meets a
use it was not written for. Started 2026-10-17 with Yet Social.

## Layout

- `apps/vite.config.ts` — its own Vite project, multi-page. `index.html` is the showcase; each
  app is a folder with its own `index.html`, listed in `build.rollupOptions.input`.
- `apps/showcase/` — the front door. `apps.ts` holds one entry per app (pitch, what is built, the
  components it leans on, its Figma page, a screenshot).
- `apps/shared/` — `setup.ts` (fonts and stylesheet, imported first by every app), `app.css`
  (the token layer plus `@source '../../src'`), `theme.ts` (the document's light/dark switch).
- `apps/<app>/` — `main.tsx` (router), `shell/`, `screens/`, `components/` (app-level pieces —
  Figma's `_` local symbols), `data/` (typed fixtures), `assets/`, and `FINDINGS.md`.

```bash
npm run apps:dev      # localhost:5174 — the showcase; each app at /<slug>/
npm run apps:build    # into dist-apps/; `npm run build` runs it too, so CI type-checks and builds the apps
```

Deployed with Storybook: the Pages workflow builds the apps with
`APPS_BASE=/yet-another-design-system/apps/` into `storybook-static/apps/`, so they live at
`…github.io/yet-another-design-system/apps/`.

## Rules

- **Import the library from `../../src`, never copy it.** A component edit has to show up in every
  app on the next reload. That is the whole stress test.
- **Library changes go in their own PR.** An app PR touches `apps/` (and the wiring files), never
  `src/`. When a screen needs the library to change, log it in that app's `FINDINGS.md` as open,
  work around it in the app with a comment pointing at the entry, and fix it in `src/` separately.
- **An app component moves into the library only when a second screen or app needs it**, or it is
  plainly generic. Until then it lives in `apps/<app>/components/`, named after its Figma `_`
  symbol and citing its node.
- **Hash routes** (`#/plan/calendar`). GitHub Pages has no server to rewrite a deep path, and
  every state worth showing should have a link — put view state in the URL.
- **Every nav item goes somewhere.** A screen drawn in Figma and not built says so and links the
  frame; an area with no design says that instead (`screens/NotBuilt.tsx`).
- **Mock data is typed, and relative to today.** Yet Social pins "today" to the Monday of the real
  week because its data and Figma are written from a Monday — see `screens/calendar/model.ts`.
- The library's rules hold here too: semantic tokens only, `focusRing` for focus, default sizes
  first, runtime values in custom properties read by utilities.

## Traps found building them

- **Tailwind scans from Vite's `root`.** With `root: apps/` the library's classes were never
  generated and every component rendered bare — no frame, no fills — with no error. `app.css`
  carries the `@source`. Do not import `theme.css` directly from an app.
- **`launch.json` is read at session start**, so a preview config added mid-chat is invisible to
  `preview_start` by name. Start `npm run apps:dev` and attach by URL.
- **The Browser pane freezes transitions.** A `Panel` reads 60px wide mid-slide forever. Call
  `document.getAnimations().forEach(a => a.finish())` before measuring, and do not trust a
  screenshot taken right after a state change: it can show the frame before.
- **axe runs on the live app** by fetching
  `/@fs/<repo>/node_modules/axe-core/axe.min.js` through the dev server and `axe.run(document)`.
  The stories' a11y run only sees stories; this sees composed screens.
