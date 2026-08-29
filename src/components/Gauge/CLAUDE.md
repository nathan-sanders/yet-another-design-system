# Gauge

The same parts-of-a-whole, folded into a half circle. Figma's `Gauge` (`40004343:23422`), section
`40004343:23420`. **Read [Donut/CLAUDE.md](../Donut/CLAUDE.md) first** — this shares its data shape,
its slice separator and its hover halo.

## Why it is not a `Donut` prop

Folding a donut in half turns the hole into a **shelf**. A donut's centre content is centred in a
ring; a gauge's sits under an arch, because the arc's own centre is at the bottom edge of the box.
Those are different layouts, and a `semicircle` boolean on `Donut` would be a prop that changes where
another prop renders — which is how one component quietly becomes two.

## Two numbers that are not the donut's

**Inner radius 80%**, against the donut's 72% — Figma's `_Gauge / Slice Sweep`. The same band
stretched over half the sweep reads much heavier, so a gauge at the donut's ratio looks like an arch
rather than a gauge, and it crowds the figure underneath.

**The radius is computed, not a percentage.** Recharts sizes a pie from `min(width, height) / 2`,
which is right for a full circle and leaves a gauge at roughly half the size it should be: a
semicircle needs `R` of height but `2R` of width, so the radius it can actually afford is
`min(width / 2, height)`. Recharts has no way to know that, so the gauge reads `plotWidth` off the
chart context — the container is already measuring for the breakpoint, so the number is free.

Before this, the gauge rendered at half size with its metric overlapping the ring. It looked like a
styling problem and was an arithmetic one.

## What a gauge is for

Progress toward one thing: a budget spent, a quota filled, a score out of a maximum. It is the
weakest of the three polar charts at comparison — half a circle gives every slice half the arc a
donut would — so reach for it when the story is "how far along", and for `Donut` when it is "of
what".
