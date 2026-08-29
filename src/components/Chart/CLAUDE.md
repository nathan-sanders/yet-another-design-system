# Chart

The shared chrome every chart in the library sits in: the container, the legend, the tooltip, the
swatch, the marker shapes, the palette and the axis rules. Nothing here draws a chart. It is the
`Menu`/`ContextMenu` and `Combobox`/`Autocomplete` arrangement again — the recipes live in one place
and each chart imports them rather than copying.

Figma page: **↪ Data Viz (In Progress)** (`40004316:13427`). Sections `Legend & Tooltip`
(`40004318:14467`), `Grids` (`40004318:14336`), `X-Axis` (`40004318:14868`), `Y-Axis`
(`40004318:14768`).

## Half the Figma page does not become code, and that is the main thing to know

Everything on that page with a **leading underscore** — `_Line Series / Segment` (16 variants),
`_Donut / Slice Sweep`, `_Radar / Areas` (20 variants), `_Line Series / Plot Point`, `_X-Axis
Presets` (26 variants) — exists because **Figma has to draw a chart by hand**, one segment at a
time, and a Figma component cannot be parameterised by a number or compute a tick from data.
Recharts does both. Those components are a *drawing mechanism*, not an API.

Reading them as a component list is the single biggest way this work could balloon: it turns roughly
15 real components into 30-plus, most of which would be re-implementations of things Recharts
already does. **Before building anything off this page, ask whether the Figma component is a
decision or a mechanism.** A segment's "Direction=Positive" is not a decision — it is what the data
did between two points.

What survives the crossing is the part that *is* a decision: the interpolation, the dash, the marker
shape, the colour order, the tick rules.

## Why there is no `ChartStyle`, and no port of shadcn's container

shadcn/ui's `ChartContainer` injects a `<style>` element per chart mapping names like
`--color-desktop` onto hex values, one block per theme. It exists because its charts are handed raw
colours with nowhere theme-aware to put them.

This library has somewhere. `--data-viz-*` are **semantic tokens**: defined at `:root` in section 3
of `theme.css` and redefined in `.dark`. A mark painted `stroke="var(--data-viz-categorical-01)"`
follows the theme with no injected CSS, no second palette, no JavaScript and no `dark:` variant.
Verified by switching the Storybook theme with nothing in the component changing.

**Do not port `ChartStyle`.** It would be a second, worse copy of a tier that already exists — and it
is the exact thing the semantic layer was built to make unnecessary.

## Colour rules that are not preferences

- **The categorical order is fixed and never cycled by rank.** `resolveSeries` assigns colour from a
  series' index in the caller's array, not from a counter over visible ones. A palette that re-flows
  when a series is filtered out repaints the survivors and silently invalidates the legend the
  reader just learned.
- **Past twelve series, `categorical()` returns the placeholder grey rather than wrapping.** Two
  visible series sharing a colour is worse than admitting the scale ran out: the reader cannot tell
  them apart and nothing signals that they should stop trying. Figma reaches the same conclusion from
  the other end — its `Chart Legend` has a `+X more` row, which `ChartLegend`'s `max` implements.
  A thirteenth series means group, facet or filter; it does not mean grow the scale.
- **Markers cycle where colours do not**, and the asymmetry is the point. A repeated *shape* is still
  separated by colour, so a second channel that runs out beats no second channel.
- **A benchmark does not consume a categorical slot.** Adding a target line leaves every real series
  the colour it already had.
- **Text never wears the series colour** — `content-subtle` throughout, identity from the swatch
  beside it. Three of the twelve hues are illegible as text on the light canvas (yellow at 1.74:1 is
  the worst), and colouring text also removes the channel a low-colour-vision reader relies on.
- **The three short-contrast hues are known and parked.** The root `CLAUDE.md` records them as
  accepted. Do not "fix" them here; `accessibilityOverlay` and the outline marker shapes are the
  sanctioned mitigations.

## Stroke weights are read, never derived

The series line is **1.5px**. A marker's ring is **2px in a swatch and 1.5px on a plot point** — not
`2 × 8/12 = 1.33`, which is what scaling would predict. Every one of those numbers was read off the
Figma node. A stroke weight is not geometry and cannot be recovered from a shape's size; this file
has been caught by that before.

Shape *sizes* do scale, because Figma drew them to scale: the set is defined in a nominal-12 space
(the square's width in a 24px swatch) and multiplied by `size / 12`. The check that this is faithful
rather than approximate is Figma's own second size — the plot point's square is 8, and 13 × 8/12 =
8.67 against Figma's circle of 9. Measured back out of the DOM, all seven shapes land on the file's
numbers exactly.

**The hexagon is written from half-extents, not an angle sweep.** Six vertices at 60° off one radius
gives a *regular* hexagon, 11.6 across for 13.4 tall. Figma's is 12 across. Stating both extents hits
the number and is easier to check against the file than trigonometry is.

## An outline shape means two different things at two sizes

At **swatch** size an outline marker is a true ring with no fill, so the rule behind it is drawn as
two pieces with a gap — a continuous rule would show through the middle and turn a hollow marker into
a struck-through one. The gap widths are per-shape and read off the file (8 for square, triangle and
hexagon; 7 for circle and diamond); deriving them from the shape's width gets the round ones wrong.

At **plot-point** size the same marker is filled with the *surface* colour, because there it sits on
its own line and has to hide it.

One function serves both: `markerShape` takes `surface` as a colour, so `'none'` yields the ring and
the real token yields the filled marker. That is why it is a colour and not a boolean.

## The accessible alternative is a table, and its position is load-bearing

`ChartContainer` renders the plot inside `role="img"` with an `aria-label`, **and** a visually hidden
`<table>` of every value. An `aria-label` alone passes an automated check and leaves a screen reader
user with one sentence where everyone else has thirty-one days of data.

**The table is a sibling of the labelled plot, never a child.** `role="img"` makes its whole subtree
opaque to assistive technology, so a table inside it would be announced to nobody. Easy to get
backwards, and nothing would flag it.

Recharts' `accessibilityLayer` is set on each chart for keyboard traversal of the points.

## Motion

Every series sets `isAnimationActive={false}`, and so does `Tooltip`. Recharts animates in JavaScript
with its own constants — a second source of truth Figma cannot reach, which is what the motion tokens
exist to prevent.

The tooltip is the subtle one. Recharts writes `transition: transform 400ms` **inline** on its
tooltip wrapper even when series animation is off. The global `prefers-reduced-motion` clamp does
still beat it (that rule is `!important` on `*`, which outranks an inline declaration), so it was
never an accessibility hole — but 400ms is close enough to `--transition-duration-medium` (410ms) to
look like it came from the system when it did not. So Recharts' tween is off and the movement is put
back through `wrapperStyle` referencing the tokens as custom properties.

**`wrapperClassName` is a trap:** Recharts puts it on `DefaultTooltipContent`, not on `Tooltip`.
Passing it to `Tooltip` type-checks and does nothing at all. Use `wrapperStyle`.

All of that lives in **one object**, `chartTooltipWrapperStyle` in `styles.ts`, used by all six
charts — it was copied inline into each of them first, which is six places to fix the next time
Recharts changes its mind. It sits in `styles.ts` rather than beside the component because a module
exporting both a component and a constant breaks Fast Refresh.

## The tooltip stacks above the chart's own overlay

That same object carries `zIndex: 10`. A donut's total and a gauge's figure go through
`ChartContainer`'s `overlay`, which is a **sibling after** the plot — so by document order it painted
*on top of* the tooltip, and hovering a slice put the tooltip behind the number in the middle.

It is deliberately **not** `overlayLayer` from `src/lib/layers.ts`. That constant is for popups
portalled to `<body>`, which have to out-rank arbitrary page content; this tooltip is a child of the
chart and only ever competes with the chart's own overlay. Borrowing the portal layer would put a
chart tooltip above a Toast.

## Tooltip values are `text-base`, not `text-sm`

Figma binds `text-base/mono regular` for a value against `text-base/normal` for its label, and
`text-base/mono bold` for the Total. **The difference between a value and its label is the face, not
the size.**

They shipped at 12px first, from a real misreading worth recording: `text-sm/mono regular` is the
**axis tick** style, where 12px is right because a tick is chrome. A tooltip value is the number the
reader came for, and shrinking it below its own label inverts the card's hierarchy. When a mono style
turns up in `get_variable_defs` output, check *which* node it was bound to.

## `ResponsiveContainer` renders nothing at zero width

Not a small chart — an empty one, which looks exactly like a broken component. `height` is therefore
a required number rather than a percentage, and the wrapper carries `min-w-0` so a flex or grid
parent cannot collapse it. When verifying in the Browser pane, pass explicit `width`/`height` to
`resize_window` first or every chart will measure as broken.

## Dates are formatted in UTC by default

These charts plot **buckets** — a day's sessions, a month's signups — and a bucket's label has to read
the same for every reader. `new Date('2026-01-01')` is parsed as UTC midnight, so local formatting
slides the whole axis back a day for anyone west of Greenwich. This was caught in the first
screenshot: the 31-day chart opened on "Dec 31". `formatDateTick` takes a `timeZone`, defaulting to
`UTC`; pass one for wall-clock times that genuinely belong to a place.

The month is written only where it changes ("Jan 1", then 3, 5, 7) — and the field comparison is done
through the *same* zone the label is written in, so "has the month changed?" cannot disagree with
what the label says.

## The axis presets became rules

Figma's 13 x presets × wide/narrow and 8 y presets are `tickInterval` plus `formatDateTick` plus
`inferXPreset`. The check that the rules reproduce the design: 31 points in a wide chart gives
`ceil(31/16) - 1 = 1`, labelling days 1, 3, 5 … 31 — exactly the sixteen labels the file draws.

Wide/narrow is Figma's own `Chart Breakpoint` variable (600), measured by a `ResizeObserver` rather
than declared. A zero width is treated as "not laid out yet" rather than "narrow", and the initial
state is wide, so a chart does not visibly shed its labels and put them back.

## The legend does not scale down with the chart

It is on by default and stays on — not for two or more series, but for **every** chart. Two
exceptions look reasonable and are both wrong: a single-series chart still needs the swatch to say
which colour means the thing the title names (in greyscale, or for a reader who cannot separate two
hues, that mapping is the only thing carrying identity), and a chart narrowed to one data point still
plots a series. A key that disappeared exactly when a filter narrowed the data would be missing at
the moment the chart was least familiar.

`ChartLegend` therefore reads only `series`, never `data`. `legend={false}` on a chart remains the
escape hatch for when something else already names the series.

An earlier version of this file recommended the opposite for a single series, following generic
charting guidance. Nathan reversed it on 2026-08-28.

## Y-axis tops are rounded, not left to Recharts

Recharts' automatic domain ends at the largest value present and divides it by the tick count, which
is fine when the data happens to be round and poor when it is not — one value of 1,800 produced the
ticks 0, 450, 900, 1.4k, 1.8k. `niceMax` rounds the **top** to the smallest countable number at or
above the data that divides evenly by the gridline count; rounding the top is what makes every tick
round at once, since each is then `max × n / intervals`.

It only applies where the data is entirely non-negative, which is the case a zero baseline is right
for. Anything with negatives needs a floor as well as a ceiling and a midpoint pinned at zero, so it
is left to Recharts rather than half-handled.

The check that this is a fix and not a change of taste: it reproduces every scale Recharts already
got right (1,990 → 2k, 20,000 → 20k, 456 → 600) and only moves the bad ones. `axes.test.ts` pins
that.

## The interactive legend, and the rule it depends on

Figma's `Chart Legend Buttons` — on Donut, Gauge and Radar, the charts where series overlap and
switching one off is how you read the others. `interactiveLegend` on `ChartContainer` turns it on for
any chart; it is off by default, because a legend that looks clickable and is not is worse than a
plain one.

**A row becomes a `<button>` only when `toggleSeries` is present in context.** Deriving the affordance
from the capability means the two cannot disagree — the same "derive it, do not declare it" rule as
Button's icon-only form.

**The whole feature rests on colour being assigned before the filter, not after.** `resolveSeries`
numbers the full series array; `visibleSeries` is a filter over the result. So switching one series
off leaves every other one the colour it already had. Assigning colour to the *visible* list instead
would repaint the survivors on every click and silently invalidate the legend the reader had just
learned — which is the same failure the fixed categorical order exists to prevent, arriving through a
different door. Verified by reading the fills before and after a toggle: `01,02,03,04,05,06` becomes
`01,03,04,05,06`, not `01,02,03,04,05`.

A switched-off row keeps its place — you have to be able to click it back — and carries **two**
signals, the placeholder grey and a strikethrough, because a colour change alone is a poor way to
state a binary. The state is `aria-pressed`, not `aria-hidden` or `disabled`: it is a toggle that is
still available.

Plots read `useVisibleSeries()` rather than `chart.visibleSeries` directly. The `?? []` fallback
looks harmless and is not — a fresh array every render defeats every `useMemo` downstream of it.

## `overlay`, and the `role="img"` trap for the second time

A donut's total and a gauge's figure go through `ChartContainer`'s `overlay`, rendered as a
**sibling** of the `role="img"` plot. Inside it, they would be numbers no screen reader could reach —
exactly the mistake the hidden data table is positioned to avoid, arriving in a second place. If a
third thing ever needs to sit over a plot, it goes here for the same reason.

## `plotWidth`

The container already measures its width for the breakpoint, so it publishes it. One chart needs it:
a **semicircle cannot size itself from Recharts' rules**, which derive a pie's radius from
`min(width, height) / 2`. That is right for a full circle and leaves a gauge at half the size it
should be, because a half circle needs `R` of height but `2R` of width. See the Gauge record.

## The hover cursor is the accessibility overlay, not a gridline

The crosshair on a line or area chart, and the band behind a bar chart's category, both take
`Data Viz/Utility/Accessibility Overlay` via `cursorHighlight`.

**They used to take `gridline`, and it was too light to see.** The two tokens are one line apart in
the file and a world apart in what they are for: a gridline is scenery a reader looks *past*, while a
cursor is the one element they are actively following. Reusing the quietest colour in the chart for
it had it vanishing over the data.

The overlay token is the right home because a hover highlight has exactly the job it was made for —
sitting over the data and staying visible against whatever is under it, in either theme, without
being ink that competes with the marks. The band takes it at a lower opacity than the rule, because a
band is larger.

## A chart that fills its box exactly has nowhere to draw its own decorations

Donut and Gauge draw the hover halo **outside** the ring. Both originally sized themselves to fill
the plot box, so the halo was cut off top and bottom, and the gauge's apex was clipped even at rest
because the separator stroke straddles the outer edge.

Two things worth carrying forward. First, **the bug only appeared on hover**, so a screenshot at rest
proved nothing — the same reason the stacked-bar gap needed a measurement rather than a picture.
Second, the fix belongs in a pure function (`donutRadius`, `gaugeGeometry`) precisely so it *can* be
tested: `polar.test.ts` asserts the invariant — everything drawn, halo included, lands inside the box
— across a range of sizes, rather than pinning one number that happens to be right today.

Before adding anything that paints outside a mark's own bounds, check the chart has reserved room for
it.

## Left for later, deliberately

- **`_Quadrant Grid`** has no chart built on it in Figma yet.
- Figma's `Chart Key / Metric` and `_Swatch Label` are absorbed into `ChartLegend`'s row and
  `ChartTooltip`'s row rather than being separate components. Split them out if a third caller
  appears.
