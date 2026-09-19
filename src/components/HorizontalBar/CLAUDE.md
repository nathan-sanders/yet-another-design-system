# HorizontalBar

A magnitude per named category, as rows. **Read [Chart/CLAUDE.md](../Chart/CLAUDE.md) and
[VerticalBar/CLAUDE.md](../VerticalBar/CLAUDE.md) first** — this is that chart on its side, and
only what changes when it turns is written here.

Figma's `Horizontal Bar` (`FIGMA_MAIN`), section `FIGMA_SECTION`, with `Horizontal Bar / Bar`
(`FIGMA_BAR_SET`), `_Horizontal Bar / Horizontal Bars` (`FIGMA_BARS_SET`) and, in the Grids section,
`_Chart Grid / Vertical` (`FIGMA_GRID_SET`). **The drawing was made from the code**, 2026-09-19 — the
Scatter and Sankey route. Nothing existed for it in the file: no section, no node, no vertical-
gridline grid. So the code is the older authority here, and the file's numbers are the code's
sample data (`sliceData(8)`, `channelData()`) scaled into the file's own plot box.

## Why it is a chart and not a `direction` on VerticalBar

Turning a bar chart swaps what each axis *is*. The category axis takes the baseline and every
label; the value axis takes the gridlines. Every axis rule changes hands, and the one rule this chart
adds — every row is labeled, so a chart with more rows is taller, not sparser — has no counterpart
on the column chart, where a date axis thins its labels because the points are closer than the
labels are wide. Two charts sharing a segment, not one chart with a flag. What they share is
`barSegment` in `Chart/bars.tsx` and the axis siblings in `Chart/axes.ts`; what they do not share is
the interface.

Recharts calls this `layout="vertical"`, after the category axis. Every name here describes the
bar. Expect the word to be the wrong way round whenever Recharts says it.

## It is never a chart over time

The category axis is a list of names, formatted as strings: browsers, teams, questions, countries.
Time reads left to right, and a bar over time is a `VerticalBar`. That is why there is no `xPreset`,
no `timeZone` and no `inferXPreset` here — not an omission, a claim about what the chart is for.

## The height follows the rows

Every other `ChartContainer` chart defaults to 280. This one defaults to `horizontalBarHeight` in
`Chart/bars.tsx`: 32 per row — Table's row height, so a list of bars sits at a list's rhythm — or,
for a grouped chart, enough that each of the group's `n` bars still reaches Figma's 16 after
`barGap` and the 20% of the band that `barCategoryGap` spends on air; plus 34 for the x axis and the
top margin. Measured: six stacked rows render at 226 with 19px bars; six grouped rows of three at
454 with 16px bars 4 apart.

A fixed default would thin the rows out exactly when there were most of them, which is when this
chart was chosen. `HeatMap` is the precedent for "its height is its data"; the difference is that
`height` stays a prop here, because the `Composable` dashboard's rows own their charts' heights and
pass `rowHeight - CHART_CHROME`. Nathan's call, 2026-09-18.

## The gap moves to the right edge, and the test moved with it

Figma's 1px gap between stacked segments comes off each segment's **outer** edge — the top of a
column, the right end of a row — and the outermost segment keeps its full length so the stack's
total stays true. `barSegment({ orientation: 'horizontal' })` takes it off `width` and leaves `x`
alone, so the row stays welded to the zero baseline on the left. Recharts stacks from the baseline
outward in both layouts (d3's `stackOrderNone`), so `isTop` is still the last series.

`Chart/bars.test.ts` pins the horizontal case the way it pins the vertical one: every neighboring
pair in a row is separated by exactly the gap, and the leftmost `x` never moves. Measured in the
browser at 1px between `01`/`02` and `02`/`03` on every row of `StackedAndGrouped`.

A stack that grows *negative* is not drawn correctly in either orientation — the inset is taken off
the far-from-origin edge of the normalized rectangle regardless of sign — and both bar charts leave
negative stacks to Recharts' own domain. Known, and the same in both.

## The two axes, and what each one gives up

`categoryYAxisProps` is `xAxisProps` on its side: the emphasized baseline comes with it because
zero is now the left edge the bars grow from, the tick marks stay off, and the interval rule does
**not** come with it — `interval: 0`, because Recharts' default `preserveEnd` silently drops labels
on rows tighter than a label's height, and a horizontal bar with an unlabeled row has lost the one
thing it was chosen for. Its `width` is `'auto'`: Recharts measures the longest label after the first
render and the plot settles on the second pass. There is no cap. `LongLabels` shows what a 34-
character category costs the plot, honestly, rather than truncating it.

`valueXAxisProps` is `yAxisProps` on its side: no axis line, because the gridlines already cross the
bars at every labeled value and the baseline belongs to the category axis; the caller's `xLines`;
`niceMax` for the top. `axes.test.ts` asserts it rounds exactly as the y axis would for the same
line count, so a stacked bar of the same data has the same scale whichever way it points. It is
**not** Scatter's `numericXAxisProps`, which draws the baseline (a scatter has no category axis to
carry it) and fixes its ticks by breakpoint.

Both `type`s are stated. Neither axis infers its type from the chart's `layout`; a `YAxis` is
`number` unless told otherwise, and that is a silent failure, not an error.

`verticalGridProps` is the same gridline rule turned: **gridlines run perpendicular to the value
axis and never along the category axis.** `chartGridProps`' "horizontal lines only" was always an
instance of that, and its comment now says so.

## What did not change

`stacked` and `showTotal` mean what they mean on VerticalBar. `barCategoryGap` is 20% stacked and
10% grouped for the reason given there. The tooltip cursor is the same translucent band on
`cursorHighlight`, now a row's height, and the tooltip's label is the category string with no
formatter. `accessibilityOverlay` is the same sanctioned mitigation. The hidden table gets `yKey` as
its category column — `ChartContainer`'s `xKey` is just "the property holding the category" and
nothing in the container is orientation-aware.

## Best practices

The family's rules are in [Chart/CLAUDE.md](../Chart/CLAUDE.md) and on the `↪ Data Viz` Docs frame;
these are the ones that are this chart's alone.

**Do**

- Reach for it when the category names need the room. A column label sits under a 24px bar; a row
  label has the whole row.
- Give it the rows in the order you want them read. It reads top-down like a table, and a ranked
  list arrives sorted.
- Let the height follow the rows. Set `height` only when something else owns it, as a dashboard
  row does.

**Don't**

- Don't use it for change over time. Time reads left to right; a bar over time is a Vertical Bar.
- Don't stack series that do not sum to something. The rule is the column chart's, on its side.
- Don't give it a paragraph for a category name. The axis takes the room it needs from the plot,
  and it has no cap.
