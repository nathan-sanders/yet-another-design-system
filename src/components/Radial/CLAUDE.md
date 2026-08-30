# Radial

How much, per category, against a common scale. Figma's `Radial` section (`40004355:41100`).
**Read [Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## The Figma page is a stub, and that is the first thing to know

The section holds two things and neither is the chart: `_Radial / Slice Sweep` (`40004355:41215`),
one arc, and `_Radial / Radial` (`40004355:41236`), the concentric track. There is no composed
`Radial` component, no legend, no example and no hover state. This is the **code-first route** the
root `CLAUDE.md` sanctions — Accordion, Popover, ContentBlock's `Emphasis` — with the rule attached:
*what is not allowed is leaving the file behind.*

**What the file owes:** a `Radial` component drawing the composed chart with its legend, and a
decision about hover. Everything below that the file *does* settle is settled; everything it does not
is marked as this library's choice.

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

## No halo, and no `POLAR_MARGIN`

Donut and Gauge reserve `POLAR_MARGIN` for the hover halo Figma draws outside the ring. Figma draws
no hover state for a radial, and nothing here paints outside the outermost bar — the arcs carry a
fill and no stroke. Borrowing the constant would shrink every chart by eight pixels to leave room for
something that is never drawn.

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
