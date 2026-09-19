# Scatter

Two measures against each other, one mark per observation. Figma's `Scatter` section
(`40004378:41242`): the `Scatter` set (`40005307:17563`, `Type=Standard` `40005304:42466` |
`Type=Quadrant` `40005307:17354`), `_Scatter / Points` (`40005304:16972`, 980 × 260) and
`_Scatter / Quadrant Points` (`40005304:17112`, 1048 × 304). It also closes `_Quadrant Grid`
(`40004318:14452`), which had no chart on it. **Read [Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## Built code-first, and the drawing is the code's

The section was empty, so this is the Sankey route: nothing was read off a node of its own, and
every decision below names the rule it followed. What *was* read is everything the chart borrows —
the plot point from `_Line Series / Plot Point`, the grid and axes from `_Chart Grid`, the crosshair
from `_Quadrant Grid`. The file's drawing was then made **from the code's numbers**: the same three
sample series, on the same domains (0–2k across, 0–1k up), scaled into the file's own plot box — the
980 × 260 inset at (56, 12) that `_Line Series / Line Series` sits in, and the 1048 × 304 box with an
8px inset for the quadrant form. Fifty-six `Plot Point` instances per component, one per point,
placed by script and read back by script: every fill bound to `Categorical/01`–`03`, every ring's
background to `Surface/Background Primary`. **If the two ever disagree, the code is the older
authority.**

## No shared x, so the points live on the series

Every other cartesian chart here takes one `data` array with a row per x value and a column per
series. A scatter has nothing lining its observations up, so `ScatterSeries` carries its own
`points` — the same move `Donut` makes when a slice is a series with one value. `ChartContainer`
still gets `series` (for color, marker and the legend) and a hand-built `table`, one row per point,
because its default table is rows × series and there are no rows.

## The marks are the file's plot points, at full opacity

8px square, 9px circle, 1.5px ring — `LineSeries`' numbers, read off `_Line Series / Plot Point`, the
only plot point the file draws. The hovered point grows to the swatch's 12 / 2, the same shape at the
size the legend draws it. An outline marker is **surface-filled**, so it hides what is under it,
exactly as a plot point on a line does; a scatter inherits the rule rather than inventing a
translucent one. Radar and Sankey are translucent because their *areas* cross, and no paint order
keeps crossing areas readable. A point is small enough that a second marker beside it is still a
second marker, and the marker cycle already puts a hollow shape between every two solid ones.

## The numeric x axis, and why it has five ticks

`numericXAxisProps` in `Chart/axes.ts` is `xAxisProps` with the interval rule swapped for a tick
count, because a numeric axis has no points to skip. **Five wide, three narrow**, and the top rounded
for the wider case: four intervals divide by two, so the domain does not move at the breakpoint and a
narrowing chart only sheds labels. `axes.test.ts` pins it.

Nine ticks was the first number and was wrong for a reason worth keeping: a step of 250 over 2,000
puts 1,250 on the axis, and the compact formatter writes it `1.3k` — round to read and wrong to
trust. Four intervals keep every step on the 1 / 2 / 5 ladder, where the compact form is exact.

## The quadrant form

`quadrant` switches off the grid and the tick labels and draws the crosshair with a label at each
end — because a threshold is a line the reader compares against, not a number they look up. The axes
are still there scaling the points; only their chrome goes. Read off `_Quadrant Grid`: the lines are
`Surface/Border Emphasized` at 1px (the x baseline's token, which is right — a threshold is a thing
values are measured from, not scenery), the labels 12px mono `content-subtle` on a
`Surface/Background Primary` plate with 8px of padding on every side but the one facing the edge.

**The plate is a `<foreignObject>`, not SVG text on a rect.** SVG cannot size a rectangle to the text
it holds, and a plate that is not hugging its label is either clipping it or leaking the line it was
meant to cover. HTML inside the SVG hugs, and the plate sits *on* the line's end so the surface color
is what separates label from rule — "white does the separating" again, in a fifth place.

**The domain is pinned from every series, hidden ones included**, so switching a series off in the
legend cannot move the crosshair. The plain form leaves the domain to Recharts the way the rest of
the family does.

**Thresholds default to the middle of the drawn domain**, which is the only crosshair the file can
draw: `_Quadrant Grid`'s lines carry `CENTER` constraints, so an instance stretches and stays
centered. The `Quadrant` story matches the file; `QuadrantThresholds` shows the half Figma cannot —
lines at 1,000 and 300 — and the record says so rather than leaving a designer hunting for a
threshold control that does not exist.

**The hidden table gains a `Quadrant` column.** A quadrant chart says one thing by position, and a
screen reader gets it in words: "High impact · Low effort". `quadrant.ts` holds the arithmetic
(`resolveThresholds`, `quadrantOf`, `describeQuadrant`) and `quadrant.test.ts` pins it, for
`HeatMap`'s reason — a point in the wrong box renders as a perfectly plausible chart. A point *on* a
line goes up and to the right: it has reached the threshold, not left it.

The file's hidden per-end value text ("30.9k") is not ported. Hidden in the file means off, and
nothing has asked for it.

## The tooltip builds its own rows

Recharts hands a scatter's tooltip **two entries for one point** — `x` and `y` — with the series on
the datum, not the entry. `ChartTooltip`'s matcher walks series and finds entries by `dataKey`, which
is the shape of every chart with one value per series and not this one. Rather than teach the
matcher a second shape, `ChartTooltip` grew a `rows` render prop and the chart says what the rows
are: heading = the point's `label` if it has one, otherwise the series; a swatch row naming the
series only when the heading did not already; then the two measures. Every other chart is untouched.

## The legend key is the marker, rule and all

`_Swatch` has no "marker without a line" style, so a scatter's key is the same rule-and-marker the
line chart draws. The alternative was `colorSwatch`, and it loses the second identity channel at the
moment it matters most — twelve series on one plot is where the shapes are doing the separating.

## What the Figma build had to change, and why it is allowed

- **`_Quadrant Grid` could not be instanced.** Its four hidden value texts were SF Mono, a font this
  machine does not have, and `createInstance` loads every font in the tree. They were rebuilt in
  Geist Mono — same characters, same `text-sm/mono regular` style, same hidden state, fill moved from
  the stale `Text/Subtext` to `Content/Subtle` to match the visible label beside them — and the
  originals removed. Same family as the SF Pro Text grid labels: a font nobody has is a component
  nobody can use.
- **The file has no numeric x preset.** `_X-Axis Presets` is thirteen time ranges and `Categories`.
  The Standard variant's `_Chart Grid` instance keeps the `31 Days` preset and hides 26 of its 31
  label anchors; `_X-Labels` is `SPACE_BETWEEN`, so the five that remain land at 0, 245, 490, 735,
  980 — exactly where 0 / 500 / 1k / 1.5k / 2k go. A nested override, not a new variant, because the
  mechanism set did not need to grow for one chart.
- **The points sit above the grid.** `Line Series` stacks its plot *under* `_Chart Grid`; here the
  points instance comes after the grid, so a mark is never crossed by a gridline.

## When not to use it

Two measures. A third belongs on the size of the mark, which this chart does not do — a bubble is a
different reading and would be its own decision. Past twelve series the scale returns the
placeholder gray (`ManySeries` shows the thirteenth); facet before that. And a scatter with a shared
x — every point at the same dates — is a line chart with the line removed, and wants `LineSeries`
with `showPoints`.
