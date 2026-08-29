# LineSeries

Change over time, for up to twelve series. Figma's `Line Series` (`40004319:22371`, 1048×344) in the
`Line Series` section (`40004319:21917`).

The first chart in the library, and chosen first for that reason: it is the only form that exercises
the whole of the shared chrome at once — both axes, the grid, the legend, the tooltip and the
plot-point markers. Everything in `src/components/Chart/` was proved here before nine more charts
came to depend on it. **Read [Chart/CLAUDE.md](../Chart/CLAUDE.md) first**; almost every decision
visible in this component was settled there.

## What Recharts made disappear

Figma builds this chart out of `_Line Series / Segment` — sixteen variants covering curve against
linear, four directions and dashed against solid — placed one per interval, with a
`_Line Series / Plot Point` at each vertex. **None of it becomes code.** A segment's "direction" is
not a design decision, it is what the data did between two points; Recharts computes the path from
the numbers.

Three props are what is left once the mechanism is removed: `interpolation`, the per-series `dashed`,
and the per-series `marker`. That ratio — thirty-odd Figma components to three props — is the shape
of this whole page, and the reason to check every underscored component against "decision or
mechanism" before implementing it.

## `curve` is monotone, not a spline

Recharts' `monotone` interpolation cannot overshoot a data point. A plain cubic can, and will draw a
peak higher than anything that was measured — a chart telling a small lie in order to look smooth.
`linear` is Figma's other option, unchanged.

The prop is chart-level with a per-series override, because Figma's `Type` axis sits on the segment
and a segment is not something a caller has.

## The numbers

- Line **1.5px**, round cap and join.
- Plot point **8px** square / **9px** circle, ring **1.5px** — against the swatch's 12px and 2px.
  Both pairs read off the file. See the Chart record on why a stroke is never derived.
- Dash `6 4`.
- Default height 280, five y gridlines.

## `showPoints` is a real choice, not decoration

Past roughly forty points per series the markers stop separating anything and merge into a band along
the line. The `Dense` story is 90 days with them off. The line's shape is still doing the work.

## A benchmark is not a series

`benchmark: true` takes the chromaless benchmark grey and a dashed line, and — the part worth
noticing — **does not consume a categorical slot**. Adding a target to a chart leaves every real
series the color it already had. A dashed line is also the only dashed thing on the plot, which is
why the gridlines are solid.

## The legend defaults on, and stays on

It is the dependable identity channel, and the alternative is asking the reader to match hues by eye.

**It does not scale down with the chart.** Two exceptions look reasonable and are both wrong:

- **A single series still gets one.** The swatch is what says which color means the thing the title
  names, and in greyscale — or for a reader who cannot separate two hues — that mapping is the only
  thing carrying it. This used to be the other way round, and the `Dashboard` story's 24-hour block
  opted out; Nathan reversed it on 2026-08-28 and the block now keeps its key like every other.
- **A single data point still gets one.** A series with one reading is still a series. A chart that
  dropped its key the moment a filter narrowed to one day would be at its least readable exactly when
  it changed.

`legend={false}` stays available for the case where something *else* already names the series — a
caption, a heading, a surrounding table — so the box would repeat a label just read. That is a
statement about where the naming happens, not a way to save space, and `WithoutLegend` is the story
for it.

## One data point

Worth its own story, because two things broke there and neither was visible until a chart was drawn
with a single row:

- **The x label was the raw ISO string.** A lone date has no span to measure, so `inferXPreset` fell
  through to `categories` — and a category is handed to the axis untouched, giving
  `2026-01-01T00:00:00.000Z` under a single mark. A lone parseable date now reads as `days`.
- **The y scale was not round.** One value of 1,800 gave Recharts the ticks 0, 450, 900, 1.4k, 1.8k.
  `niceMax` rounds the axis *top* to a number that divides evenly by the gridline count, which is
  what makes every tick round at once rather than fixing them one at a time.

Both are pinned in `Chart/axes.test.ts`, which is a plain node test — the story suite would only
catch a regression here by screenshot, and a subtly wrong tick label reads as a design choice rather
than a bug.

## The Dashboard story is the point of the exercise

`BentoGrid` + `ContentBlock`, both of which already existed, with charts as their content — which is
what Figma's `Examples` frame (`40004343:24448`) draws, its cells being `Content Block` instances.

**A chart is ordinary content inside a block.** It has no card, no title and no overflow menu of its
own, because those belong to `ContentBlock` and it already has them. That line is the same one
`ContentBlock`'s own record draws about a metric.

It also demonstrates the breakpoint doing real work with nothing declared: the two half-width blocks
land under 600px, so their axes drop to six labels while the full-width block above keeps sixteen.
