# HeatMap

How much, across two dimensions at once. Figma's `Heat Map` (`40004343:21701`), on
`_Heat Map / Cell` (`40004343:21697`). **Read [Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## It is a CSS grid, not a chart

The only component in the data viz set that draws no SVG. Recharts has nothing to offer a grid of
rounded squares — no axis to scale, no path to compute, no layout to solve. The usual trick is a
`ScatterChart` with a custom shape, which buys a harder version of `grid-template-columns`.

It still goes through `ChartContainer` with **`responsive={false}`**, a prop added for it, because
`ResponsiveContainer` requires a Recharts child while everything *else* the container does is wanted
here: the `role="img"` labelling, the hidden data table, the legend header.

`Spark` is the opposite call — it uses no container at all, because it wants none of those things.
The two are different answers to different questions, not one question at two settings.

## The numbers, and where they came from

Cell radius **4** and a **2px** gap. The gap is *derived* rather than read: Figma's frame reports
`itemSpacing: 8`, which its GRID layout does not use as the visual gap. The real number falls out of
its own geometry — 24 columns of 39.3px in a 992px frame leaves 2.1px per gap, and 7 rows of 32.3px
in 240px leaves 2.0. Measured back out of the DOM at 4px and 2px.

`TreeMap` reports the same `itemSpacing: 8` and has the same real gap of 2 — it was taken at face
value there first and had to be corrected. **An `itemSpacing` on a Figma GRID frame is not a gap.**

**Height is computed from the row count**, not taken as a prop: a heat map's height is its data.

## Colour is sequential, never categorical

Cells encode **magnitude**, so they take one hue getting darker — one of `monoScales`. The twelve
categorical colours would say that Tuesday 9am is a different *kind* of thing from Tuesday 10am,
rather than more of the same.

**The domain is computed once over the whole grid.** Per-row scaling would make every row's darkest
cell equally dark and destroy the comparison the chart exists for — the most common way a heat map is
made meaningless. `min`/`max` override it, which is what holds a scale still across two charts that
must be compared.

All of that lives in `scale.ts` and is unit-tested, because **none of its failures is visible**: a
cell one step too dark looks exactly like a cell with a slightly higher value.

## An empty cell is drawn as nothing

`null` in, nothing out. Figma leaves gaps where there is no data and that is right — painting a
missing value with the lightest step claims a measurement of "almost none" where there was no
measurement. The sample data is deliberately sparse so the stories exercise it; it was not at first,
and the path went untested.

## The tooltip is an addition to the file

Figma draws no hover state. A cell shows a colour and nothing else, so without one the only way to
read an exact value is the hidden table, which sighted readers never see.

It is `ChartTooltip` positioned from local state rather than Recharts' — there is no Recharts here to
provide one — and it is **one tooltip for the whole grid**, not one per cell. A 7 × 24 grid is 168
cells, and 168 mounted popups is a real cost for something only ever visible once.

It passes `swatch="colorSwatch"`: a cell is an area, so a rule-and-marker key would draw a line that
is not there. That prop was added to `ChartTooltip` for this, mirroring `ChartContainer`'s.

## Dark mode inverts the ramp, on purpose

`--data-viz-mono-a01` is the *lightest* purple in light mode and the *darkest* in dark. So in both
themes a higher value is the more prominent mark, and the gradient legend inverts with it. That is
the semantic layer working, not a bug to fix.
