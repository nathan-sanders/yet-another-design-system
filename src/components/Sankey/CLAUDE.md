# Sankey

Where a quantity went, from one stage to the next. Figma's `Sankey` section (`40004378:41237`):
`Sankey` (`40004453:16908`) and `_Sankey / Sankey` (`40004452:16910`). **Read
[Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## Nothing was read off a node, and every decision below says which rule it came from

The section was **empty** when this was built — a placeholder someone created and never filled. So
unlike every other chart here, nothing was read off the file. That made it the largest code-first
component since BentoGrid, and it is why the record carries more weight than usual: each choice names
the rule it followed rather than the node it came from.

The drawing landed on **2026-08-30**, and the direction is worth being precise about. This is not the
file catching up with a verdict of its own — **it is the code's geometry transcribed into Figma**,
pulled straight off the rendered chart at 1048 × 320 so the two cannot disagree. Every decision below
is still the code's, and the file now agrees with it rather than having ratified it.

That makes it the clearest case in the library of the direction running one way. `Accordion` and
`ContentBlock` went code-first and Figma then made its *own* drawing that happened to match; here
there was nothing to match against, so the drawing was derived. **If a future change disagrees with
the drawing, the code is the older authority, not the file.**

## What is drawn, and what is not

`_Sankey / Sankey` holds three frames — `Links`, `Nodes`, `Labels`. The ribbons are **stroked
vectors, not filled shapes**: the band's thickness is the stroke weight, which is how Recharts draws
them too, and it is the only reason an eight-ribbon diagram is eight nodes rather than eight
hand-built outlines.

There is deliberately **no `_Sankey / Node` component**. Every bar's height is what the data did and
every ribbon is a unique path — mechanism, not decision, in the Chart record's terms. A component
per mark would be the trap that file warns about, turning a drawing into an API.

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
which is why `nodeDepths` exists — it reproduces Recharts' columns from the longest path, so the
renderer can work out the column step and its own column before the layout is anywhere a caller
could read it.

**And a third bound, because a left-placed label shares its gap.** Only the last column ever goes
left — right is the default and fails only at the plot's edge — so a left plate reaches back into the
same gap the previous column's *right* plates already occupy. Two plates that each clear the column
bound on their own can still collide, and did: `Reactivated` ran back over `Archived` in
`TooManyNodes`. The bound is therefore on the **pair**, with the widest plate the previous column
will actually draw subtracted first. One that is going to be dropped reserves nothing, or a single
long name would quietly cost its neighbours their labels too.

Widening the text into a plate is what surfaced it — at 16px narrower the same two labels cleared
each other. Worth stating plainly: **the plate did not cause the bug, it made an existing one
reachable.** A pair bound was always the correct rule.

**Every label sits over data, and takes `TreeMap`'s plate for it.** A label goes on the side its own
ribbon leaves from, so it is never over bare canvas — and at 0.4 opacity the ribbons are exactly
muddy enough to swallow a subtle gray. `Data Viz/Utility/Accessibility Overlay` at `rounded-md` on
8 × 2 of padding, with `content-inverse` text: the same recipe, the same numbers, because two charts
that both have to put text over their own marks should not invent two ways to make it legible.

The token is the neutral at 56% and **flips with the theme** — `neutral-900` in light,
`neutral-100` in dark — so `content-inverse` is right in both with no `dark:` variant. A
surface-colored halo (`Radar`'s answer for its scale numbers) was the first attempt and works, but a
plate is the stronger one where the ground is a saturated fill rather than a gridline, and it is
already the library's answer for exactly this.

The plate is **a single line**, so it has no value row and its height is one `LABEL_LINE` between the
padding. That is the only place it departs from the treemap's.

A label that fits neither side is **dropped, not narrowed** — SVG text neither wraps nor clips to a
box, so a narrowed label does not shrink, it runs on over whatever is beside it. `TreeMap`'s rule,
and its record has the detail. Verified by measurement rather than by eye: across four widths and four stories, **no two plates
overlap in both axes** and none falls outside the plot. The drop-off is gradual — all six labels to
about 450px, five to 384, four to 320, and only "Paid" left at 256.

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
