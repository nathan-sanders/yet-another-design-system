# AreaSeries

A magnitude over time, as a filled shape. Figma's `Area Series` (`40004326:32506`), section
`40004326:32148`.

An area says "how much" where a line says "what level" — the fill does the talking, which is why the
same data reads as bigger here than in [LineSeries](../LineSeries/CLAUDE.md). **Read
[Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

As with the line chart, `_Area Series / Segment`'s twelve variants are a drawing mechanism, not an
API. Two of its axes survive as props — `interpolation` and `fill` — and the four "directions" do
not, because a segment's direction is what the data did.

## The two fills are different drawings, not a style toggle

This is the thing to understand before changing anything here, and it only becomes obvious reading
the Figma variants side by side:

| | fill | top edge |
|---|---|---|
| `solid` | series color, **opacity 1** | **`Surface/Background Primary`** |
| `gradient` | series color → **transparent**, downward | **the series color** |

**The edge swaps color between the modes**, and that is the load-bearing part. A solid area's edge
is surface-colored because that is what separates it from the area behind it — the same trick the
stacked bar uses its 1px gap for, white doing the separating rather than more ink. A gradient area's
edge is the series color because there is nothing to separate from and the line is the mark.

Get it backwards and each mode loses the thing it exists for: a solid area with a colored edge has
no separation where two areas meet, and a gradient area with a surface edge has its line vanish into
the background.

## Solid areas are opaque, so paint order is part of the API

A `solid` area completely hides whatever is behind it. Recharts paints in element order, so **the
`series` array is the paint order, back to front — order the largest first.** Figma's own example is
drawn that way. The `PaintOrder` story shows both, including the wrong one, because the failure is
much easier to recognise than to describe.

`gradient` does not have the problem. If the data genuinely crosses and no order works, that is the
signal to use `LineSeries`: two lines can cross and stay readable, two opaque areas cannot.

## There is deliberately no stacking

Figma does not draw one, and stacking makes a claim the data has to earn — that the parts sum to a
meaningful whole. [VerticalBar](../VerticalBar/CLAUDE.md)'s `stacked` covers the case where they
genuinely do, and it is a better form for it: discrete columns make the parts countable in a way a
smooth stacked area never does.

## The legend keys with `colorSwatch`

An area has no plot point to echo, so its key is the plain color square rather than the
rule-and-marker a line chart uses. Figma binds exactly this. The chart states it once by passing
`swatch="colorSwatch"` to `ChartContainer`; see the note on `resolveSeries`.

## The gradient ids are scoped

Each series needs its own `<linearGradient>`, and the id comes from React's `useId`. Two area charts
on one page would otherwise define the same id twice and the second definition would silently win for
both — a bug that only appears on a dashboard, which is exactly where these charts live.
