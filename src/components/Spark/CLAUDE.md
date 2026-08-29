# Spark

A shape, at the size of a word. Figma's `Spark` (`40004332:42192`), 272×96, section
`40004332:42101`.

## It deliberately does not use `ChartContainer`

Every other chart in the library goes through it. This one does not, and that is the main decision in
the component.

A spark is **not a chart with the chrome switched off** — it is a different thing that happens to be
drawn from numbers. No axes, no grid, no legend, no tooltip, no hidden table, because it is not
making claims a reader is meant to measure. It sits beside a number and says which way that number
has been moving. Routing it through the container would mean five props set to `false` plus an
accessibility table nobody asked for, which is a worse description of the component than a plain
`ResponsiveContainer` is.

What it *does* share is the palette and `barSegment`, so its bars round exactly like a real bar
chart's.

## Labeled or decorative — one of the two, enforced by the type

`SparkProps` is a union: either `label` is present, or `decorative: true` is. **An unlabeled,
non-decorative spark does not compile**, because that is the silent third case — a `role="img"` with
no accessible name, which an audit flags and a reader gets nothing from.

The common case is `decorative`. A spark almost always sits next to the figure it summarizes, where
the trend is already stated in text; announcing "line chart" there gives a screen reader a vaguer
second version of a number it has just read. `label` is for the rarer case where the spark is the
only thing carrying the information.

## `accessibilityLayer` is off, and axe is why

Recharts 3 turns `accessibilityLayer` **on by default**, which makes the chart root focusable. Inside
this component that is a genuine fault: a `tabindex="0"` element inside an `aria-hidden` wrapper is
something a keyboard user can land on and a screen reader cannot describe. The labeled case has the
same shape, because `role="img"` also makes its subtree opaque.

axe caught it on the `InAMetric` story — worth remembering as the general lesson, since the same
default is on in every other chart in the library too. There it is wanted; here it is not.

It is turned off rather than worked around with `tabindex="-1"`, because a spark has nothing to
traverse: no tooltip, no axis, no per-point readout. Its keyboard layer would navigate between points
that announce nothing.

## One series, always

At this size a second series is two lines a few pixels apart — decoration rather than comparison. If
two series need comparing, the answer is a real chart with an axis.

## `area` is not in Figma

Figma has `Line` and `Vertical Bar`. `area` is the same line with a wash under it at 16% opacity, and
it is what the metric-card story uses, because at 40px tall a bare line is thin and a filled shape
reads at a glance. Code going first is allowed here and has precedent (Badge's extra hues,
BentoGrid); what is not allowed is leaving the file behind, so it belongs in Figma next.

Note the fill is a **wash**, unlike `AreaSeries`'s opaque `solid` — at this height an opaque fill
would read as a solid block and swallow the line on top of it.
