# Badge

`color`: all 18 hues of the Decorative ramp — neutral first, then red, orange, amber,
yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose.
(Figma shipped 14; orange/lime/emerald/teal are being added there to match.)
`startIcon`/`endIcon` take a `LucideIcon`
and render at 12px. One size only — 20px tall, which is exactly the `text-sm` line-height, so the
height falls out of the type rather than being set. Not interactive: Figma gives it no hover,
focus or disabled state, so it renders as a `<span>`. Uses the ramp's `Background` + `Foreground`;
the `Highlight` is unused because Figma's Badge has no border.

## Best practices

Mirrored from the **Best practices** block on `↪ Badge` (`40004242:14683`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Use it to label a status somebody reads: a state, a category, a stage.
- Keep the label to a word or two. It is one 20px line and it does not wrap gracefully.
- Use the same hue for the same meaning everywhere, and let the word carry the meaning too.

**Don't**

- Do not make a badge a hit target. It has no hover, focus or disabled state and renders as a span; a value somebody chose and can take back is a Token.
- Do not lean on the color alone. Somebody who cannot see it still has to know what the badge says.
- Do not line several colored badges up as a filter row. Past two or three they stop reading as status.
