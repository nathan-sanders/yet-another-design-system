# Sankey

Where a quantity went, from one stage to the next. **Read
[Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## Figma draws nothing, and every decision below says which rule it came from

The `Sankey` section (`40004378:41237`) exists and is **empty** — a placeholder someone created and
never filled. So unlike every other chart here, nothing was read off a node. That makes this the
largest code-first component since BentoGrid, and the record has to carry more weight than usual: the
file cannot be consulted later to settle an argument, so each choice names the rule it followed.

**What the file owes:** a `Sankey` component, and with it a verdict on the four things below that
were decided here — link color, link opacity, the node bar's size and radius, and label placement.

## A ribbon takes its source node's color

Categorical color means **identity**, and a flow's identity is where it came from — tracing a ribbon
back to its origin is the question the form exists to answer. Two ribbons arriving at the same node
therefore stay different colors, which is what makes the mix visible: `Trial` is fed by Search and
Social, and the proportions can be read off the node rather than inferred from the legend.

The alternative — coloring by target — reads as "what fed into this", which is the same information
with the traceability removed. Neutral ribbons were the third option and lose the answer entirely.

## Translucent, for Radar's reason

Ribbons cross, and **no paint order exists that keeps crossing shapes all readable** — the same
argument `Radar` makes for its areas, arriving in a second place. So they are drawn at 0.4, the
number Radar uses, and an overlap simply reads darker. The constant is written here rather than
imported from `polar.ts`: a Sankey is not a polar chart, and borrowing that file's constant would
imply a shared geometry that does not exist.

Recharts' own link default is a **stroked** path — `fill: none`, thickness carried by `strokeWidth` —
and the renderer keeps that. The alternative is computing a filled outline by hand, which buys
nothing when the only things changing are the color and the opacity.

## Flows are named, and the translation is where the bugs would be

**Recharts addresses nodes by array position**: a link is `{ source: 0, target: 2, value }`. That is
a fine internal representation and a poor API — a caller who writes `source: 3` has written something
that silently means a different node the moment one is inserted above it, and the resulting diagram
looks entirely reasonable.

So the component takes `flows` by node **key** and `graph.ts` resolves them. It has its own tests for
`HeatMap`'s reason: *none of its failures is visible*. A link joined to the wrong node draws a
plausible picture, passes the type check, and has nothing in it for axe to object to.

Two flows are dropped rather than drawn: one naming a node that does not exist, and one from a node
to itself (no depth to advance to, and the layout solver spins rather than failing). They are
**returned as data**, not thrown and not only logged — a typo in one row should not take a page down,
and console noise is what the heat map's duplicate-key record says nobody reads to the bottom of.

## The tooltip's color is one level deeper than TreeMap's

`ChartTooltip`'s `pickColor` read `entry.payload.groupColor`, which was enough for a treemap tile.
**Sankey's payload searcher wraps its own datum as `{ payload, name, value }` before Recharts wraps
that again**, so the color sits at `entry.payload.payload.groupColor`. Reading one level found
nothing, fell through to `currentColor`, and painted every swatch in the text color — black, exactly
the failure `TreeMap` recorded, arriving again through a door one level deeper.

`pickColor` now checks the outer datum then the inner one, in that order, so nothing about
`TreeMap`'s case changes. **The general shape to watch for: a chart whose marks carry the color
rather than its series will hit this, and it will not necessarily hit it at the same depth.**

## Node labels: the edge is the obvious bound and the wrong one

A node's name is drawn **beside** its bar, not on it. `TreeMap` is the only chart here whose marks
carry their own text, and only because a tile has nowhere else to put it; a Sankey node is a thin bar
with clear space either side, so no `accessibilityOverlay` plate is needed. Mono, 12px,
`content-subtle` — `Radar`'s conclusion that everything beside a mark is an axis label.

Which side a label goes on is **measured, not derived from the graph**. "Is this a terminal node?"
is the obvious test and gets the middle columns wrong.

**The bound that mattered was the second one.** Checking only that a label stays inside the plot
looks sufficient and is not: at 256px, `Paid` and `Churned` were drawn straight through each other,
both comfortably inside the plot and both illegible. A label also has to fit inside its **column**,
which is why `depthCount` exists — it reproduces Recharts' column count from the longest path, so the
renderer can work out the column step before the layout is anywhere a caller could read it.

**Every label sits over data, and needs Radar's halo for it.** A label goes on the side its own
ribbon leaves from, so it is never over bare canvas — and at 0.4 opacity the ribbons are exactly
muddy enough to swallow a subtle gray. The fix is the one `Radar`'s scale already uses: a
surface-colored stroke with `paint-order: stroke`, which puts the stroke *under* the fill so 3px
reads as a 1.5px outline of canvas around each glyph rather than a smear over it. It follows the
theme for free, and it was visibly needed in both — "Trial" and "Paid" over the dark green were the
worst of it.

A label that fits neither side is **dropped, not narrowed** — SVG text neither wraps nor clips to a
box, so a narrowed label does not shrink, it runs on over whatever is beside it. `TreeMap`'s rule,
and its record has the detail. Verified by measurement rather than by eye: across four widths and
three stories, no two labels overlap in both axes and none falls outside the plot; at 256px two are
correctly dropped.

## Vertical order is Recharts', on purpose

`sort` is left at its default, so the layout arranges each column to reduce crossings. **Vertical
position in a Sankey is a layout result, not an encoding** — nothing is being said by one node
sitting above another — so pinning it to the caller's order would trade a legible diagram for an
ordering that means nothing. The caller's order still fixes the two things that *are* encodings: each
node's color, and the order of the legend. Neither is something the layout can touch.

## No interactive legend

Hiding a node would leave its flows dangling and re-lay-out everything else, so `ChartContainer`'s
default (off) is correct and is not exposed. This is the first chart where the absence is a decision
rather than a default nobody changed.

## The legend stays on, and turning it off is reasonable here

`ChartLegend` documents one escape hatch: `legend={false}`, "for when something else already names
the series". A Sankey's node labels do exactly that, so this is the one chart in the library where
the hatch is the *expected* call rather than an unusual one. It is still not the default, because a
label that will not fit is dropped — and a diagram narrow enough to drop them is precisely the one
that needs the key back.

## When not to use it

A few stages, a modest number of nodes. Past twelve nodes the categorical scale has run out and
`categorical()` returns the placeholder gray by design — which `TooManyNodes` shows with thirteen,
twelve distinct hues and one gray. Past a few stages the ribbons cross into a knot whatever the
opacity. Group the small paths into an "Other" node before reaching for more color.
