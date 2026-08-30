# Radial

How much, per category, against a common scale. Figma's `Radial` section (`40004355:41100`):
`Radial` (`40004451:16871`), `_Radial / Radial` (`40004450:16871`) and `_Radial / Slice Sweep`
(`40004355:41215`). **Read [Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## It was built code-first, and the file has since caught up

The section held only the mechanism when this was built — one arc and the concentric track, no
composed chart, no legend, no example. That is the **code-first route** the root `CLAUDE.md`
sanctions, with its rule attached: *what is not allowed is leaving the file behind.*

The debt is now closed. `Radial` was drawn on **2026-08-30** with the same shape as `Donut` — a
`Chart Wrap` holding a `Chart Legend` instance over the plot — and `_Radial / Radial` was promoted
from a frame to a component so it could be instanced, which is why its id moved from `40004355:41236`
to `40004450:16871`. **Nothing in the code changed when it landed**, which is the test of whether a
catch-up was really a catch-up.

One thing the file still does not draw: a **hover state**. The code's is described below and is this
library's choice, not the file's.

## The two numbers, and the one drawing that hides two rules

Read off the track at its native 256px: **five bands of 16, separated by 4, over a hole of radius
32.** `5 × 16 + 4 × 4 = 96 = 128 − 32`, which is exact. The arc agrees from the other side —
`arcData.innerRadius` is `0.8751687`, and `128 × (1 − 0.87517) = 15.98`.

**One drawing is consistent with two different rules**, and at five rings they are indistinguishable:
"the band is always 16px" and "the hole is always a quarter of the radius" produce the identical
picture. They only diverge at another ring count. `RADIAL_INNER_RATIO = 0.25` is the reading taken,
because Donut (`0.72`) and Gauge (`0.8`) both pin a *ratio* and this is the same family; a band that
never changes would have been the first constant in the set that does not. Same trap as
`figma-one-variant-hides-two-numbers`, and it had to be decided rather than discovered.

**A screenshot said the arc was 12px and it is 16.** The measurement crossed the arc's rounded end
cap — `border-radius/rounded-xs`, bound on the node — rather than its middle, and `16 − 4 = 12`
almost exactly. The Chart record already says not to read geometry off a picture; this is what that
looks like when the picture is nearly right.

## The one thing that cannot match the file, and why

Recharts centers each bar inside its band, so it insists on half a gap of padding outside the
outermost one. Figma's outermost band is flush to the frame's edge. So `radialGeometry` hands
Recharts a range **inflated by `RADIAL_TRACK_GAP / 2` at each end** — which puts the drawn bars
exactly on the hole and the outer edge — and `RADIAL_MARGIN` gives up that much radius to make room
for the inflation. The ratios are the file's; the outer radius lands 3px inside the box, and no
arrangement of the two recovers it.

Measured in a real browser at a 1184 × 280 plot: bands of 17.35, gaps of **exactly 4**, innermost
edge on 34.25 and outermost on 137 — both precisely the computed ring bounds.

**The Figma drawing does not make that concession, and should not.** There is no Recharts on the
canvas, so `_Radial / Radial` draws the intended 16 / 4 / 32 against a 128 radius. The two are the
same rule at the only two settings available to them, and the file is the one that states it
cleanly. Do not "fix" the drawing to match the code's three-pixel loss.

**Figma measures `arcData` from three o'clock, clockwise.** The chart starts at twelve, so every
sweep in the drawing is offset back by a quarter turn (`startingAngle: -π/2`). Drawn without it, the
rings all begin at three o'clock and the chart looks plausible and is wrong — which is exactly what
the first attempt produced.

## `plotWidth` is 0 in a hidden browser pane, and every polar chart falls back

Chasing what looked like a geometry bug ended somewhere else entirely: `ChartContainer` measures with
a `ResizeObserver`, and **a hidden tab never runs the rendering steps, so the observer never fires
even once.** `document.hidden` was `true`, `requestAnimationFrame` never ran, and a manually attached
observer got nothing either.

The consequence is not confined to this chart. `plotWidth` stays 0, so Donut, Gauge and Radial all
silently take their percentage fallbacks and *measure* as though their geometry were wrong. Donut's
outer radius came back as 121.5 — `90%` of Recharts' own max radius — rather than the 132 its code
computes. **Nothing is broken; the measurement is.** Verify these charts with a real browser (a
short Playwright script against the Storybook iframe works) rather than the Browser pane when the
pane is hidden.

## Hover is the cartesian cursor, not the donut's halo

The hovered ring is outlined in `Data Viz/Utility/Accessibility Overlay` at 1px — the same token and
the same weight a line or area chart marks the pointer with
(`cursor={{ stroke: cursorHighlight, strokeWidth: 1 }}`), and the same token a bar chart's band
takes. It reaches the mark as a props object on `activeShape`, which Recharts merges onto the sector
it was already drawing, so **nothing about the ring's geometry moves** — the restraint Donut's
record argues for, on a chart whose encoding is also size.

**Donut's halo is the wrong shape here**, and the reason is geometric rather than stylistic. That is
a second arc drawn *outside* the ring, which works because a donut has one ring with room around it.
A radial bar's rings are 4px apart, so a halo would land on the neighbour, and the outermost one has
nowhere to put it at all. The stroke sits on the mark instead.

Which is also why the chart reserves no `POLAR_MARGIN`. Donut and Gauge give up eight pixels for the
halo; nothing here paints outside the outermost bar except half of a 1px stroke, which the
`RADIAL_MARGIN` slack already covers.

## The track is the chart's honesty, not its decoration

Every ring sits on a full-sweep band in `Data Viz/Categorical/Placeholder`, which is what
`_Radial / Radial` is. **A radial bar's length is an angle, and the same angle covers less ink at a
small radius than at a large one** — so without a band showing each ring's full extent, an inner ring
reads as smaller than an outer ring holding exactly the same value. It is also the one place the
placeholder gray is doing its literal job: it is the absence of value, drawn.

## The first series is the outermost ring

Recharts puts the first row innermost. The legend and the tooltip both read top-down, so the rows are
reversed before plotting — otherwise the chart disagrees with its own key, which is the one thing a
legend cannot survive.

## `max`, the one prop Donut and Gauge do not have

Those two are *parts of a whole*, so their own sum is the scale. A radial bar's rings are independent
values against a shared ceiling, and a chart of percentages wants `100` whatever its largest value
happens to be. It defaults to the largest value present, which is what the track then means, and is
floored at 1 so a dataset of zeros produces an empty chart rather than a chart of `NaN`.

## `valueLabel`, because `RadialBar` has no `nameKey`

Recharts' source says so in a comment — "RadialBar does not have nameKey, why?" — so a tooltip row's
name is a constant or the raw data key, and every tooltip read "complete". `HeatMap` needed the same
prop for the same reason.

The heading is a second half of the same problem. Without a category axis Recharts labels the card
with the row's **index**, so every tooltip was headed "0". `PolarRadiusAxis type="category"` is there
for the tooltip rather than for the geometry — it changes no radius — and gives the card the ring's
name, which puts a Radial on the same shape as the cartesian charts: heading is the category, row is
the series.

## Hiding a ring makes the others thicker

The geometry is derived from how many rings are *drawn*, so switching one off in the legend closes
the space rather than leaving a hole. Verified along with the invariant that matters more: switching
off `02` leaves the survivors `05, 04, 03, 01` — color is assigned over the full series list and
hiding is a filter over the result, so it can never repaint the rings the reader has just learned.

## When not to use it

A reader compares arc lengths at different radii, which is harder than comparing bars on a shared
baseline. It is right when the shape — a few values against a common ceiling — is the message, and
wrong when the exact comparison is; `VerticalBar` is the answer there and stays readable at any
count. Past about eight rings the bands are too thin to carry a color, which `TooManyRings` shows.
