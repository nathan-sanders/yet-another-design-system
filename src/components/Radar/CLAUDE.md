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
