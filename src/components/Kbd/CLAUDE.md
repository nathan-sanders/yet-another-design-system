# Kbd

A keyboard shortcut, drawn as one small key per keystroke.

**Two sources, split cleanly.** Figma node `40004073:20923` owns the look: 20px key, `min-w-5`,
`px-1` (spacing/1), `rounded-xs`, `Surface/Background Subtle`, `Content/Primary`, `text-sm/normal`,
`Elevation/Drop Shadow/Extra Low`. Meta's Astryx `Kbd` owns the API: one `keys` string, split on
`+`, one key per token. Nathan asked for both by name.

**One size only** — 20px, which is exactly the `text-sm` line-height, so the height falls out of the
type. Figma sets no height at all. `min-h-5` holds it anyway, the Badge precedent.

**Sans, not mono.** `--font-mono` exists and Slider uses it; a shortcut is not code. Figma and
Astryx both draw these in the body face, and a mono ⌘ is a worse ⌘. The deliberate non-use is the
decision here, not an oversight.

**The fill is translucent, on a token of its own.** The key was first drawn on `Surface/Background Subtle`,
which is byte-identical to `Surface/Canvas` *and* to the menu row's `data-highlighted` background
(`oklch(0.97 0.001 106.424)` light — all three measured, not assumed). So an opaque key was invisible
on the page canvas, and invisible again the moment you hovered the menu row it was sitting in,
surviving only on its drop shadow. Nathan called it on 2026-08-24 once the End Slot landed and the
hover collision showed up. Astryx reaches for a translucent fill for the same reason.

It shipped for a few hours on `surface-canvas-overlay`, which had the right *value* and the wrong
*name* — that token is for scrims. Nathan added **`Surface/Overlay Subtle`** to Figma the same day,
so the borrowed name is gone and the component sits on a token that means what it is for. The two
are still byte-identical (`#2924231a` / `#f5f5f51a`), and that is fine: they are one value serving
two roles, and the roles are what the names are for. **Nothing rendered differently when it
landed** — which is the test of whether a catch-up was really a catch-up, the same test the Kbd
Group passed.

`generate.py` re-points it onto the neutral tier automatically, like the other seventeen raw alpha
colours, so the key follows a swapped ramp instead of staying stone-tinted.

**Do not reach for a border instead.** Besides not being drawn, a CSS border adds height a Figma
stroke does not — the trap Token already walked into, which needed `leading-4.5` to climb back out
of.

**The wrapper carries the accessible name, and needs `role="img"` to do it.** `<kbd>` has no
implicit ARIA role, so an `aria-label` on a bare one is not reliably announced; the role makes the
whole group read as "Command + Shift + P" instead of three glyphs. Every key is then `aria-hidden`,
because a screen reader spelling ⌘ out as "place of interest sign" helps nobody. Astryx reaches for
the same trick. Nesting `<kbd>` inside `<kbd>` is the HTML spec's own idiom for a combination, so
the markup stays honest underneath the role.

**`mod` is resolved after mount, via `useSyncExternalStore`** (`src/lib/platform.ts`). `navigator`
does not exist on the server, so reading it during render either crashes there or disagrees with
itself at hydration. The server snapshot and the first client render both say Apple — ⌘ paints
first — and React swaps in the real answer on mount for everyone else. Prefer `mod` at call sites
over `cmd` or `ctrl`: one call site, right on both platforms.

**`font-sans` is set on the key as well as the group, and has to be.** Tailwind's Preflight styles
`code, kbd, samp, pre` with `--font-mono`, and that rule beats anything inherited — so a key drops
into Geist Mono while the group around it stays in Inter. Found by reading computed styles in
Storybook, not by looking at it; at 12px the two faces are close enough to pass a glance.

**No `children`, no `size`, no `color`.** Deriving the keys from the string is the whole API, and a
`children` escape hatch would be a prop that can contradict `keys`.

**The key table is a deliberate superset of Astryx's.** They map twelve tokens and let everything
else fall through an uppercasing branch, which is why `space` and `delete` arrive there shouted as
`SPACE` and `DELETE`. Both are common enough to deserve a glyph and a spoken name; `home`, `end` and
the page keys cost nothing alongside them. Unknown tokens still render as typed, uppercased only
when a single character — so `k` draws `K` and `F5` is left alone.

**Not a Base UI component.** A plain nested `<kbd>`, like Badge's `<span>`. Nothing here needs
state, positioning or focus management.

**Figma caught up the next day, and nothing in the code changed** — which is the test of whether a
catch-up was really a catch-up. `Kbd Group` (`40004278:7480`) is a slot with `flex`, `items-center`
and `gap: spacing/1`, holding Kbd instances 4px apart; the component already read `inline-flex
items-center gap-1`. The group shipped code-first the way BentoGrid and Accordion's row height did,
and the file closed the gap rather than the code moving.

The same day, `Menu Item` gained an `End Slot` property (`40004278:7481`, and `40004278:7705` on
`Type=Danger`) drawn holding a Kbd — so the menu-shortcuts case is now real `Menu.Item`s with
`endSlot`, not a mocked-up card list. `Type=Nested` deliberately has no slot: a submenu trigger
already spends its trailing edge on a chevron.
