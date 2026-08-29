# Radar

Several series compared across the same handful of dimensions. Figma's `Radar` (`40004343:23764`),
section `40004343:23750`, on `_Radar Grid` (`40004318:14373`). **Read
[Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## Its data is shaped like every other chart's

Unlike Donut and Gauge, a radar has **one row per axis and one column per series** — a row is a
dimension, not a category. So it takes an ordinary `series` array and needs none of the pie-shaped
machinery those two do. Worth noticing: being polar is not what makes Donut's data shape unusual;
being *parts of a whole* is.

## The grid is two elements, because Figma's outer ring is heavier

Figma draws five concentric polygons at 96, 136, 176, 216 and 256. The inner four are
`Surface/Border`; the **outermost is `Surface/Border Emphasized`** — the same gridline-versus-baseline
distinction the cartesian charts make, for the same reason.

Recharts' `PolarGrid` paints every ring one colour and has nowhere to put a second stroke, so the
emphasis comes from `PolarAngleAxis`'s own `axisLine` drawn as a polygon over the top. Two elements,
one appearance.

**`PolarRadiusAxis` is always rendered, even when the scale is hidden.** `PolarGrid` takes its ring
radii from the radius axis, so that element is what pins the count at Figma's five — leave it out and
Recharts picks its own and the grid quietly stops matching the file. `tick={false}` hides the numbers
without removing the thing the rings are derived from.

## Translucent areas, and why that is the opposite of `AreaSeries`

Figma sets `opacity: 0.4` on the whole area vector, fill *and* stroke, with a 2px stroke. That the
outline still reads stronger than the interior is not a second opacity — it is the stroke compositing
over the fill beneath it, landing the edge near 0.64 while the interior stays at 0.4.

[AreaSeries](../AreaSeries/CLAUDE.md)'s `solid` fill is fully opaque, and the difference is the form,
not a change of mind. A cartesian area chart stacks front to back, so ordering the series largest
first keeps them all visible. **A radar's shapes overlap in every direction at once and no paint
order exists that keeps them readable** — translucency is the only thing that works. It is also why a
radar tolerates more overlapping series than an area chart does.

## Everything on the chart is mono, because everything on it is an axis label

The dimension names and the scale numbers are both 12px Geist Mono in `Content/Subtle` — which is
what Figma binds (`text-sm/mono regular` on both) and what every other axis in the library uses. The
dimension names shipped as sans first; that was a slip, not a gap in the file.

**Mono is wider than sans at the same size**, so making the switch immediately pushed "Efficiency"
and "Reliability" off both edges — Recharts places dimension labels *outside* the polygon and
reserves no room for them. The polygon shrank to 70% with margins rather than the type shrinking:
the labels are the part a reader needs legible, and a radar's shape survives being smaller perfectly
well.

## Making the scale readable took three separate fixes

It was illegible, and each cause would have been enough on its own:

1. **It was painted under the data.** Recharts paints in element order and `PolarRadiusAxis` was
   declared before the `<Radar>` elements, so the numbers sat beneath three translucent fills and
   whatever muddy colour they composited into. It is now declared last. Chrome normally belongs under
   the data and the grid still does — axis *text* is the exception, and a radar is the one chart here
   whose marks cover the middle where its own scale lives.
2. **It had no halo.** Each glyph now carries a surface-coloured stroke with `paint-order: stroke`,
   which puts the stroke under the fill so 3px reads as a 1.5px outline of canvas rather than a smear
   over the character. Same idea as the stacked bar's gap and the donut's slice separator, so it
   follows the theme for free.
3. **It was slanted.** Recharts rotates each tick to follow the ray (`rotate(36, …)` here), and a
   `tick` props object cannot override a transform the axis sets itself — so the ticks are a custom
   renderer that simply does not apply it. Horizontal is a deliberate departure from Figma, which
   rotates them -90°: both the quarter-turn and the slant ask a reader to tilt their head to read a
   number that exists to be read.

The colour stayed `Content/Subtle` throughout, which is Figma's. The problem was never the colour.

## The scale runs between two spokes, not along one

Recharts puts the first vertex at 90°, so a radius axis at 90° runs straight through the topmost
dimension label — which is exactly what it did, stacking "Speed" on top of the numbers. The angle is
`90 - 180 / points`: half a segment round, the widest gap available whatever the point count.

Figma runs its scale toward a vertex and has a mild version of the same collision. This is a
deliberate, small departure from the file.

`showScale` is **off** by default: on a radar the shape is the message, and a ladder of numbers
through the middle competes with the shapes for exactly the space they need.

## When not to use it

Past about four series it is a knot whatever the opacity. Past about eight axes the polygon
approximates a circle and the dimensions stop being distinguishable. Figma's grid offers five or six
points, which is the honest range.
