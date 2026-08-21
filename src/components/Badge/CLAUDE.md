# Badge

`color`: all 18 hues of the Decorative ramp — neutral first, then red, orange, amber,
yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose.
(Figma shipped 14; orange/lime/emerald/teal are being added there to match.)
`startIcon`/`endIcon` take a `LucideIcon`
and render at 12px. One size only — 20px tall, which is exactly the `text-sm` line-height, so the
height falls out of the type rather than being set. Not interactive: Figma gives it no hover,
focus or disabled state, so it renders as a `<span>`. Uses the ramp's `Background` + `Foreground`;
the `Highlight` is unused because Figma's Badge has no border.
