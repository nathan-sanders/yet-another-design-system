# BentoGrid

The mosaic a set of `ContentBlock`s sits in: the columns, one gutter for both axes, the spans, and
the collapse to a single column on a phone. Nothing else — what goes in the cells is the caller's.

**Not in Figma.** Code goes first here, which the library allows and has done before (Badge's extra
hues, Divider's `emphasis`, Accordion's row height). What is not allowed is leaving the file behind,
so the grid belongs in Figma next — as an auto-layout wrapper, or as a set of frame sizes on the
Content Block page.

**The spans belong to the cell, not to the block.** `ContentBlock` should not know how wide it is
any more than a paragraph knows its column width, and a block used outside a grid would carry a
`colSpan` that means nothing. This was the question asked before building; the answer was a separate
`BentoGrid.Cell`.

## What the props encode

Each one is a bento principle with somewhere to live, rather than a knob:

- **`columns` 2 | 3 | 4, default 4** — four is the count that divides, so halves and quarters both
  land and an anchor cell can sit beside two tiles with no leftover.
- **`gap` default | loose** — `spacing/4` and `spacing/6`, one value on both axes, so a 2-wide cell
  is exactly two tiles plus one gutter and the mosaic stays on its grid.
- **`colSpan` 1–4 and `rowSpan` 1–3 on the Cell** — the varied box sizes hierarchy is made of.

**Everything is written behind `md:`, including the column count.** The base is `grid-cols-1`, so
below 768px the grid is one column *and* the spans stop applying, at the same moment — a 2-wide cell
can never end up in a 1-wide grid, and the caller writes no breakpoint of their own. Verified at
420px: one 372px column, every `grid-column` back to `auto`, and no horizontal overflow.

**Both span maps are written out in full, and that is not stylistic.** Tailwind finds classes by
scanning source text, so `` `md:col-span-${colSpan}` `` generates nothing — and the failure is
silent: the cell lays out one column wide and reads as a design mistake rather than a missing class.
`src/lib/focus.ts` carries the same warning, from the same cause.

**No `auto-rows-fr`.** A dashboard's rows are genuinely different heights — a row of stat tiles over
a row of charts — and equalizing them stretches the short row to match the tall one. Rows stay
content-sized; a `rowSpan` covers two of them plus the gutter between, which is what it should mean.
Tiles within one row still end level, because `ContentBlock` is `h-full`.

**A `colSpan` wider than the grid is not an error** — CSS clamps it to the full width. It is also not
a feature: it looks like a bug. Keep spans at or under `columns`.

**"Nine or fewer" stays guidance.** It is a judgment about a whole view, and a component that threw
on the tenth child would be wrong about it as often as it was right. It lives in the docs and in the
`Dashboard` story, which uses seven.

**A block that covers one column needs no cell at all** — put it straight in the grid. The
`Dashboard` story does exactly that for five of its seven blocks, which is also the honest picture
of how much of this component most layouts touch.
