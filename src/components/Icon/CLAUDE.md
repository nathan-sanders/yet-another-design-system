# Icon

Wraps any Lucide glyph. `size`: small 12 | base 16 | large 20 | x-large 24. Color is
`currentColor` so it inherits (that is what lets it sit inside a Button correctly). Stroke weight
uses `--icon-stroke-weight` applied as CSS plus `vector-effect: non-scaling-stroke` — Lucide draws
on a 24×24 viewBox, so without that a 1.5 stroke paints at 1px at 16px size.

## Best practices

Mirrored from the **Best practices** block on `↪ Icon` (`40004242:14911`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Pair icons with text labels for accessibility; icon-only elements need an accessible label.
- For a meaningful standalone icon (no adjacent text), give it an accessible name via the label prop: it sets role="img" + aria-label and unhides the icon.
- Use color tokens for icon colors, not hardcoded hex values.
- Be mindful of context; decorative icons in compact components can distract rather than help.

**Don't**

- Use icons as the sole means of conveying meaning; always provide a text alternative.
- Resize icons with arbitrary pixel values; use the provided size props.
- Render raw SVG elements; always wrap in Icon for consistent sizing and color.
