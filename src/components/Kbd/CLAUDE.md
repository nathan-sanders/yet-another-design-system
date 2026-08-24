# Kbd

A keyboard shortcut, drawn as one small key per keystroke.

**Two sources, split cleanly.** Figma node `40004073:20923` owns the look: 20px key, `min-w-5`,
`px-1` (spacing/1), `rounded-xs`, `Surface/Card Subtle`, `Content/Primary`, `text-sm/normal`,
`Elevation/Drop Shadow/Extra Low`. Meta's Astryx `Kbd` owns the API: one `keys` string, split on
`+`, one key per token. Nathan asked for both by name.

**One size only** — 20px, which is exactly the `text-sm` line-height, so the height falls out of the
type. Figma sets no height at all. `min-h-5` holds it anyway, the Badge precedent.

**Sans, not mono.** `--font-mono` exists and Slider uses it; a shortcut is not code. Figma and
Astryx both draw these in the body face, and a mono ⌘ is a worse ⌘. The deliberate non-use is the
decision here, not an oversight.

**`Surface/Card Subtle` is the same value as `Surface/Canvas`** — `neutral-100` light,
`neutral-950` dark — so a Kbd on the bare page canvas is held only by its shadow. That is not a
token bug. It says Kbd is a **card-surface component**, which is also where it really lives: menu
rows, tooltips, command palettes, help text on a card. Every story sits on
`bg-surface-card-primary` for that reason. **Do not add a border to "fix" it.** Besides deviating
from the file, a CSS border adds height a Figma stroke does not — the trap Token already walked
into, which needed `leading-4.5` to climb back out of.

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

**Figma owes this one a drawing.** The node covers the *single key*. The group — the 4px gap between
keys, and the `keys` string API itself — is code-first, the way BentoGrid and Accordion's row height
were. The 4px is `spacing/1`, the same token as the key's own padding, and the value Astryx measures
at. It should be drawn into the file as a component with a key-count property.

**`Menu` has no shortcut slot**, so the menu-style example in `InContext` is a plain card list rather
than real `Menu.Item`s. Worth closing: `Menu.Item` renders `ItemLabel` and nothing after it, so a
trailing slot is a small change to `Menu.tsx`.
