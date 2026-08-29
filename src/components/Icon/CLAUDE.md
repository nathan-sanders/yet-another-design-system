# Icon

Wraps any Lucide glyph. `size`: small 12 | base 16 | large 20 | x-large 24. Color is
`currentColor` so it inherits (that is what lets it sit inside a Button correctly). Stroke weight
uses `--icon-stroke-weight` applied as CSS plus `vector-effect: non-scaling-stroke` — Lucide draws
on a 24×24 viewBox, so without that a 1.5 stroke paints at 1px at 16px size.
