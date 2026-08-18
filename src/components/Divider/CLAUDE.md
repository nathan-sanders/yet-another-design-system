# Divider

A line separating content. Mirrors Figma node `40002032:610` one-for-one: its three
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
