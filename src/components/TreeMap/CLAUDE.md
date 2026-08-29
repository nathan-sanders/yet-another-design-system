# TreeMap

Parts of a whole, when there are too many parts for a donut. Figma's `Tree Map` (`40004343:24130`),
on `_Tree Map / Data Group` (`40004343:24124`). **Read [Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

It answers the same question [Donut](../Donut/CLAUDE.md) does and keeps working where a donut stops:
past about six slices a donut's small arcs are unreadable, while a treemap's small rectangles are
merely small. The cost is that readers compare **areas** here rather than arc lengths, which they do
less accurately — so it is right when the story is "these few dominate" and wrong when two similar
values have to be told apart.

## `type="flat"`, and the hour that cost

Recharts' `nest` is a **drill-down** mode: it renders one level and waits for a click. A nested
dataset came out as an empty chart with a legend above it — the SVG contained
`recharts-treemap-depth-1` layers holding empty `<g>` elements, which is what pointed at the cause.

`flat` renders the leaves, and the squarified layout still solves the top level first and recurses
into each group's rectangle — so groups stay contiguous and the colours read as regions rather than
confetti, which is the thing `nest` sounded like it was for.

**The tile renderer tests for leaves by looking for children, not by counting depth.** Recharts calls
`content` for every node including the invisible root and each group rectangle, and without the check
the groups paint solid over their own tiles. Depth was the obvious test and is the wrong one —
`depth` means different things under the two `type` modes, so a depth check would break on a prop
change elsewhere. "Has no children" is what a tile actually is.

## Colour belongs to the group

Every tile in a group shares one hue, so the twelve-colour scale counts **groups**, not tiles. That
is what lets a treemap show forty rectangles without needing forty colours, and it is why the legend
names three things above eleven tiles.

## The only chart whose marks carry their own text

Every other chart here keeps text outside the data, because several of the twelve categorical hues
are illegible underneath it. A treemap has nowhere else to put a label, and Figma solves it with a
**plate**: a translucent panel behind the text using `Data Viz/Utility/Accessibility Border` at its
own 56%.

That token's first job is outlining a mark that cannot separate from its ground. This is a second,
and it works for the same reason — it is the neutral at 56%, exactly what a legible plate needs, and
it **flips with the theme** (`neutral-900` in light, `neutral-100` in dark), so `content-inverse` is
the right text colour in both. Verified in dark, where the plates invert to light with dark text.

**Figma binds `Overlay/Text` for the metric line, and that token does not exist** — no `Overlay/*`
token is in any of `tokens/*.json`. `content-inverse` stands in and is correct in both themes. The
gap is in the file, not here.

## A label that will not fit is dropped, not narrowed

The plate is sized to its text (roughly 7.2px a character at 12px mono — mono is the one face whose
width can be counted rather than measured, which is what makes this possible in an SVG with no layout
engine).

**Clamping the plate to the tile does not work**, and was the first attempt: SVG text neither wraps
nor clips to its box, so the plate shrank and the text carried on into the next tile. "Retarget" hung
off its own rectangle. A label clipped by its tile is worse than no label, and the value is still in
the tooltip and the table either way — so below the width its text needs, a tile gets no label.

Pinned by measurement rather than by eye: with the long-tail data, nine tiles render four labels and
**none** of them falls outside a tile's bounds.

## The gap comes out of the tile

Recharts hands over rectangles that already tile the space exactly, so the 8px separation is taken
*out of* each tile rather than added between them. Third instance of one idea, after the stacked
bar's segment gap and the donut's slice separator: **white does the separating**, and no ink is spent
on a border.
