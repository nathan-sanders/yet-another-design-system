# Donut

Parts of one whole. Figma's `Donut` (`40004333:11705`), section `40004333:11690`. **Read
[Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## The data is shaped the other way round

Every other chart here has one row per *x value* and one series per column. A donut has one row per
**slice** — the row *is* the category. So `Donut` takes `nameKey` and `valueKey` rather than a
`series` array, and builds the series list from the rows.

Doing it that way instead of inventing pie-shaped context means everything downstream keeps working
unchanged: **a slice is just a series with one value**, so the twelve-colour order, the `+N more`
overflow and the interactive toggle all apply with no special case.

The one thing it cannot reuse is the hidden table, whose default shape is rows × series. A pie's
natural table is category and value, so this passes its own through `ChartContainer`'s `table`.

## A hole, not a pie

Inner radius **72%** of outer — Figma's `_Donut / Slice Sweep` arc, and not a style choice. A thin
band makes the eye compare arc *lengths*, which people are tolerably good at; a full pie asks them to
compare wedge *areas*, which they are not. The hole is what makes the form defensible, and it is also
where the total goes.

## Hover is a halo, and does not resize the slice

Figma draws the hover state as a second ellipse at 268 against the ring's 256 with `innerRadius:
0.97`, held at `opacity: 0` in Default and `1` in Hover — a 4px arc sitting 2px outside the slice.

**The slice itself does not change, and that restraint is the point.** The common hover treatment
grows the hovered slice — Recharts' own documented example does exactly that — and on a chart whose
entire encoding is size, enlarging what you point at makes pointing look like it changed the value.

## The ring is sized to leave the halo somewhere to go

At `outerRadius="100%"` the ring reaches the edge of the SVG, and the halo — drawn *outside* it —
is simply cut off, top and bottom. **The chart looked correct until you hovered it**, which is why
this survived the first round of checking: every screenshot was taken at rest.

`donutRadius` subtracts `POLAR_MARGIN` — the halo's gap and thickness, half the separator stroke,
and a pixel of slack for rounding. `polar.test.ts` asserts the property rather than the number: for
a range of box sizes, everything drawn including the halo lands inside the box.

## The separator is surface-coloured, not a gap

Figma strokes every slice in `Surface/Background Primary`. Third chart in a row using the same idea:
the stacked bar's 1px gap, the solid area's top edge, and now this. **White does the separating, not
a border** — a border is ink that is not data. Worth recognising as one idea rather than three
coincidences.

## `center` is a slot, and a sibling

What belongs in the hole is a metric, and metrics are their own component — so `center` takes a node
rather than a label/value pair. It renders through `ChartContainer`'s `overlay`, which is a **sibling
of the `role="img"` plot rather than a child**: inside it, the total would be a number no screen
reader could reach. Same reasoning as the hidden table, and just as easy to get backwards.

It is `pointer-events-none`, so hovering *through* the total onto the slices behind it still works.

## When not to use it

Past about six slices the small ones are arcs of a few degrees and the legend is doing the work the
chart was supposed to. Group the tail into "Other", or use `VerticalBar`, which stays readable at any
count. Figma's own example uses six, and `TooManySlices` shows eight so the failure is on record.
