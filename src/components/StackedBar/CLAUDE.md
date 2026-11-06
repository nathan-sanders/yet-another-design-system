# StackedBar

One bar split into the parts of a whole, with no axes. Figma: `Stacked Bar` (`40006328:20137`) in
section `40006328:20136` on `↪ Data Viz`, `Size` Default (16px) | Small (8px), `Segment 1`–`10`
booleans. Code went first and the file caught up in the same sitting (2026-11-06). Yet Project needed
it in eight places and Yet Social had hand-built it as `BudgetBar`, which closes FINDINGS 202.

## Which one to use

- **`StackedBar`:** one breakdown read at a glance, in a table cell, a card or a row of text.
- **`HorizontalBar`:** several rows compared against an axis.
- **`ProgressBar`:** a single task or quota moving toward done. Two states, and one of them is empty
  track. If the bar has two or more named parts, it is this component.

## It is not a chart with the chrome off

The same call as `Spark`. `HorizontalBar` is a Recharts tree, a `ResizeObserver` and a hidden table per
instance, and a portfolio table wants a bar in every row. This is a flex row with no measuring.

It keeps the chart family's look: the categorical scale, the 1px gap that lets the surface do the
separating, and the 4px bar radius. **That radius is `rounded-xs`, not `rounded-sm`:** YADS's `sm` is
6px. `BudgetBar` had drifted to 6px exactly that way, and the `Playground` story pins it.

## The decisions

**Labeled or decorative, enforced by the type**, as on `Spark`. A `role="img"` with no name does not
compile. Use `decorative` when the figures are already in text beside the bar. The accessible name is
written out from the segments, because `role="img"` hides them: "Campaign budget: Paid 32%, Allocated
48%, Unallocated 20%". `formatValue` swaps the percent for a real unit.

**Color is assigned over the full list, then empty parts are dropped.** A segment reaching zero must not
repaint the ones after it. It is the chart family's hidden-series rule from the other side.

**`color` is per segment, and it is for scales.** Health, status or a Mono breakdown. Plain categories
stay on the default, so two bars on a page agree. There is no status palette yet: callers pass
`sentiment.*` and `placeholder` themselves.

**Shares come from `flex-grow`, not widths.** Percentages sum to 100 and then overflow by the gaps.

**Nothing to draw is still a bar.** One placeholder segment fills it, so a table row keeps its shape,
and the name says "no data". Negative and non-finite values count as empty.

**No hover or tooltip.** It sits beside its numbers. If someone needs to read a value off the bar, that
is a chart.

## In Figma

Segments are the chart family's `_Resizer`, so a segment's length is its width in the design: the file
cannot compute it. Ten are there; turn off what you do not need. A status bar overrides each segment's
fill. Bars on `↪ Yet Project` use Small; Yet Social's campaign budget uses Default.
