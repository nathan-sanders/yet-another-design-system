# Table

Structured data in rows and columns. Figma draws two atoms under **`40005049:39146`** — `Table Cell`
(**`40005049:39090`**, Density × Align) and `Table Head` (**`40005047:38832`**, Density × Align) — plus
`_Table Column Sort` (**`40005047:38802`**), which is a drawing and not an API. The shape of the API
above those atoms follows Meta's **Astryx** Table, which is the reference Nathan brought.

This closes roadmap item 2, **Table Cell**, by absorbing it — the `Carousel Pagination Button` move.
A table cell outside a table has nothing to be.

## Numbers are mono, and nobody has to say so

This is the requirement the component was built around, and it is derived rather than declared: a
cell whose child is a real, finite JS `number` gets `font-mono tabular-nums`. Always the pair —
`Metric`'s rule, for the same reason. Mono so a column of figures has one glyph width, `tabular-nums`
so every digit takes the width of a `0` and the decimal points line up down the column.

**Why not a prop.** The root record's rule is to derive a variant where the value already says it,
and a cell holding `42` already said it. A `numeric` prop on every cell is a prop that can contradict
its own children, and in a table of a thousand cells it is a prop somebody forgets on one row.

**Why `typeof` and not a regex over the text.** React hands a single numeric child through as a
`number`, and two children arrive as an array, so `{42}` is a number and `{['$', 42]}` is not. The
tempting version sniffs the rendered text for digits — and also catches order ids, years in a
sentence, "3 of 5" and phone numbers, with no way to opt any of them out.

A value that *is* digits but arrives as a **string** — `"$1.2M"`, `"82%"`, `"12,400"` — is what a
column's `numeric` flag is for. The column knows it is a money column; the cell only sees a string.

**`Number.isFinite`, not a bare `typeof`.** `NaN` and `Infinity` render as *words*, and setting a
word in tabular figures is wrong for the same reason setting a name in them would be. Same guard
`HeatMap`'s `scale.ts` uses: a non-finite number is not a measurement.

**We never walk into an element.** `renderCell` returning `<Badge>3</Badge>` stays sans. A rule that
reaches through a component to restyle its insides is a rule that will one day restyle somebody's
`Avatar`.

**Alignment does not derive the same way, on purpose.** The typeface is a property of the *value*, so
a cell can decide it and be right every time. Which edge a column hangs off is a property of the
*column*, and deriving it from the data would make it unstable — an empty table would left-align and
then jump right when the first rows arrived. So `align` is declared, with `numeric` supplying its
default. `numeric` answers "are these digits?"; `align` answers "which edge?", and an order-number
column wants mono for scanning and left alignment because it reads as a label.

## The rules are pseudo-elements, not borders

Figma draws every rule here as an absolutely positioned 1px frame — `Border` at `top-0`, `Grid
Divider` and `Resize` at `right-0` — and `styles.ts` keeps it that way with `after:` and `before:`
over a table set `border-separate border-spacing-0`. Four reasons, in weight order:

1. **The arithmetic.** A cell's height is content-driven: `py-1` plus a 24px line-height is exactly
   the file's 32. Add a real `border-b` and it is 33, and 41 and 57 at the other two densities.
   Holding the file's numbers with real borders means writing `pb-[3px]` — an untokenized magic
   number in a library whose premise is that the numbers come from tokens. `Density`'s play function
   *asserts* 32/40/56 rather than approving them, which it could not do either way round.
2. **The divider and the resize handle share an edge.** As real borders only one can exist; as
   overlays the handle paints over the divider, which is what the file shows.
3. **`dividers` has four values that have to compose.** Under `border-collapse: collapse` adjacent
   cells' borders go through conflict resolution, and a selected row's emphasized rule can lose to
   its neighbour's ordinary one with nothing to see and nothing to debug.
4. **It dissolves Calendar's transparent-border problem rather than solving it.** `Calendar/styles.ts`
   reserves `border border-transparent` on every day because its stroke is a real border and hover
   would reflow the grid. Here there is no border at rest and none under the pointer. The reserved
   transparent border is the answer when the stroke *must* be a border; it is not needed when the
   file already drew the stroke as an overlay.

It also keeps a sticky header cheap to add later — `border-collapse: collapse` famously drops
collapsed borders off a sticky `<th>`.

## Density moves both axes

The side padding runs **8/12/16** alongside the vertical **4/8/16**, so a spacious table is roomier
in both directions rather than being a compact table with taller rows. The heights still fall out of
the padding and the 24px line-height with nothing declared: 32, 40, 56.

`Table Head` carries the same three side values and **has to** — a header whose padding did not track
the cell's would put every label 4px or 8px out of line with the column under it. But it keeps its own
**32px height at every density**: the rows get roomier and the header they sit under does not grow
with them. That is the file's reading, and it is why `Table Head`'s density axis has three values for
horizontal padding and none for vertical.

**`h-8`, not `min-h-8`, for that 32px.** On a table cell `height` is specified as a *minimum* — the
cell grows past it when its content needs the room — where `min-height` is not reliably honored at
all. Under `min-h-8` the header rendered **28px**: a 20px line-height plus its 4px of padding, with
the constraint quietly ignored, and nothing to see unless you measured it. `Density`'s play function
now asserts the header's height and both side paddings alongside the row heights.

**The header draws no rule of its own.** `rowBorder` is on the body cell at `top-0`, so the line
under the header belongs to the first row and the last row has nothing under it — the container's
border closes the table. That is why `Table Head` has no `rowBorder` boolean, and the absence is the
specification.

## The three row fills, and the one that was backwards

A zebra table has to survive hover and selection landing on either parity, so three fills have to
stay distinct — and in the right **order**: pointing at a row should add ink, never take it away.

The first pass had it inverted. It struck the stripe in `surface-overlay-subtle` and left hover on
`surface-background-subtle`, the house's usual hover fill. Measured, the stripe composites to about
93% lightness and that hover fill is 97%: hovering a striped row made it *lighter* than at rest, so
the pointer read as less attention rather than more, on every other row. Nothing in the first version
of the story caught it, because the story asserted the fills were **distinct** and they were.

So they are the other way round:

- **stripe** is `surface-background-subtle` — an opaque whisper, quieter than anything that responds
  to you, which is all a zebra should be.
- **hover** is `surface-overlay-subtle`, and the property that earns it is that it is **translucent**:
  a 10% ink wash darkens whatever it is laid over, so a hovered row departs from its resting state at
  either parity, which no opaque fill can promise once rows have two resting states. The token set
  already does this — `--nav-item-background-hover` is `surface-overlay-subtle` in the
  theme-following nav mode.
- **selected** is that same wash *plus* the emphasized rule on its cells. `Card`'s split: the fill
  says something is true of this row, the rule says which thing, and the two stay apart when both are
  true at once. The hover class is repeated so the pointer cannot wash the selection off.

That is still an overlay token doing a surface's job, and **the file owes either a `Striped` drawing
or a pair of row-state tokens.** Until then this is the code-first route the root record documents
for Badge's hues and Divider's `emphasis`.

Before moving the stripe: `surface-background-subtle` is the same stone as `surface-canvas` in both
themes, so a striped table on the canvas would have invisible stripes. The table's own surface is
`surface-background-primary`, which is what keeps them visible.

**The stripe is a prop computed from the data index, never `odd:`/`even:`.** An expanded row's detail
panel is a `<tr>` sibling, so `:nth-child` parity flips the moment anything expands and the whole
zebra shifts under the user.

## Accessibility

**The `<th>` is named by its label, not by its contents.** A header cell's accessible name is
computed from what is inside it, and what is inside it now includes a sort button and a resize grip
that each need names of their own. Left alone, a sortable resizable "Name" column announces as
*"Name Sort by Name Resize Name column"* — and it does so on every cell in that column, because the
column header is what a screen reader repeats as you move down it. `aria-labelledby` points the
header at its own label span, which works for arbitrary children where an `aria-label` would need the
header to be a string. The `Sorting` story had been papering over this with a regex match.

**Row checkboxes are named with `label`, never `aria-label`.** `Checkbox` always wraps itself in a
real `<label>`, even with no label text, and Base UI resolves that wrapper into `aria-labelledby` —
which **outranks `aria-label`** in the name computation and points at a label whose only content is
the box itself. So `<Checkbox aria-label="Select row" />` computes to *no name at all*, and the axe
failure reads as if the attribute were missing. `label={<span className="sr-only">…</span>}` is the
fix, and the same sr-only text gives the select-all `<th>` real content, which is what keeps
`empty-table-header` quiet. Pass `rowLabel` — six boxes all called "Select row" is a list a screen
reader cannot navigate.

**No `Checkbox.Group`.** It renders `<div role="group">`, which cannot wrap a `<thead>` and a
`<tbody>`. The indeterminate arithmetic lives in `rows.ts` and is passed as the prop.

**No `aria-selected` on a `<tr>`.** It is only valid on a row inside `role="grid"`; on a `table` row
axe fires `aria-allowed-attr`. The checkbox's own state is the state. Making this a `grid` — with
`aria-required-children`, a roving tabindex and arrow-key cell movement — is a different component.

**Sorting.** `aria-sort` goes only on columns that can sort; `aria-sort="none"` on a column you
cannot sort announces an affordance that is not there. No `aria-pressed`: `aria-sort` carries the
state, and a toggle-button state would double-announce it.

**Figma's separate sort button beats Astryx's label-as-button.** Astryx wraps the whole header label
in the sort control, which makes the header's name *"Revenue, button"* and puts a role announcement
inside every cell's column context; it also cannot let a sortable and a non-sortable column share
typography — a distinction the file kept, and the reason its head has never had a "sortable" variant.
At 30 × 24 the separate
button clears WCAG 2.2 SC 2.5.8's 24 × 24 minimum exactly. **Do not "compromise" by also putting an
`onClick` on the `<th>`** — that is a click target with no keyboard equivalent.

**The resize grip is a focusable `separator`, not a button.** A button does one thing; this does a
continuous one. Being focusable makes `separator` a *widget* role, which obliges all three of
`aria-valuenow`/`valuemin`/`valuemax` — axe checks for exactly that, and a screen reader has nothing
to announce without them. The keyboard path (arrows ±8, Shift ±40, Home to the floor) is what the
story drives: a drag is the one interaction with no keyboard equivalent unless somebody writes one,
so it is the path that can regress unnoticed, and a synthetic pointer drag in a browser runner is
flaky in a way that teaches you nothing.

**The scroll region takes focus.** `tabIndex={0}` plus `role="region"` plus the label — a region you
can only reach by dragging is unreachable from a keyboard, and axe fails the story for it. `label` is
a **required prop** so that lands as a red squiggle rather than a red CI run. Two tables in one story
need two different labels, or `landmark-unique` fires.

**Expansion.** The chevron lives in the row's first cell, which is what the file's `expand` boolean
means — and it means no extra empty `<th>`. A row expands because `renderExpanded` returned a node
for it, derived rather than a second flag that could disagree with the panel's own existence. The
detail row is rendered **only while open**: `hidden` on a `<tr>` fights `display: table-row` and
leaves a row that is invisible but still in the accessibility tree. The detail panel gets no
`role="region"` — an unnamed region is a finding, and naming it duplicates the trigger.

## Two bugs that were invisible until they were measured

**The grip announced the floor.** Reading the header refs during render to fill `aria-valuenow` gives
the *minimum* on the first paint, because ref callbacks have not run yet — a grip confidently saying
"120" about a 300px column, to the one user who cannot see that it is wrong. The widths are measured
in a layout effect instead, keyed on the layout's shape rather than on the `columns` array, which is
almost always written inline at the call site and so is a new array every render.

**Every width freezes to pixels on the first resize.** Without it the untouched proportional columns
re-solve on every pointer move and the whole table breathes while you drag one edge.

## Widths

`table-fixed`, always, not conditionally. Three things need it and none can be optional: `truncate` is
meaningless under `auto` (the browser sizes columns to content, so nothing overflows and the ellipsis
never appears), a resized column does not stay resized because widths are re-solved every render, and
a text-heavy column with no declared width squishes toward nothing on a narrow viewport.

So every column has a width whether the caller gave it one or not — `proportional(1)` by default. A
proportional column resolves to `calc((100% - <fixed>px) * <share>)` and not to a bare percentage: the
two agree only when there are no pixel columns, and the moment one exists a percentage of the *whole*
table over-allocates by exactly that column's width. The table carries a `min-width` of the sum of its
columns' floors, which is what makes the frame scroll instead of the columns collapsing.

Children mode gets no `<colgroup>` and no resizing — the caller owns the widths, and so owns what
changes them.

## Two APIs, one implementation

`<Table columns data />` is the one to reach for: it owns sorting, selection, expansion and resizing,
because all four need to know about every row at once. `Table.Header / Body / Row / Head / Cell /
Footer` are the escape hatch.

**The columns API renders through those same parts.** That is the thing to preserve: two renderers
would drift, and the drift would show up as a composed table that looks subtly unlike a generated
one. Children mode is presentation only — the caller passes `sortDirection`, `selected` and the
controls themselves, which is what keeps `Table.Row` from needing to know its own index.

There are no raw third-party parts to re-export the way `Menu` does; nothing here sits on a Base UI
primitive. The absence of a `Table.Root` is a decision.

## What the tests cannot reach

**Hover is not measured, and cannot be.** `userEvent.hover` dispatches pointer events but does not
move a real cursor, so CSS `:hover` never matches and the row reads back exactly as it did before —
the same limitation `ContextMenu`'s story records. It does not need to be: the hover fill and the
selected fill are the *same token*, so proving the selected fill departs from plain and from striped
proves hover does too. Verified by eye in a real browser in both themes as well.

**The stripe's translucency is written down rather than asserted.** It comes back from
`getComputedStyle` as an `oklab(... / 0.1)` string whose exact shape is the browser's to change, and
pattern-matching a color string is how you get a test that fails on a Chromium upgrade and passes on
a broken token. The three distinct fills and their order are the properties that matter.

## Deferred, deliberately

Each of these is an absence with a reason, not an oversight.

- **Sticky header.** Genuinely wanted by real tables, drawn nowhere. Deferring stays cheap *because*
  of the `border-separate` plus overlay choice.
- **Multi-column sort**, and Astryx's sort-priority number. The file's control has three states and
  no priority badge. `sort` is typed `TableSort | null`; multi-sort would be a **new prop**, because
  widening this one to an array later is a breaking change and should not be papered over.
- **Controlled column widths.** `onColumnResize` reports; add the controlled pair when someone needs
  to persist widths.
- **Pagination.** There is no `Pagination` component in this library. `rowCount`/`rowIndexStart` is
  the hook a paginated view would use; do not invent the component here.
- **Loading and skeleton rows.** No `Skeleton` exists, and inventing a shimmer inside `Table` puts a
  new visual primitive in the wrong place.
- **`onRowClick`.** A click handler on a `<tr>` is a target with no keyboard equivalent. `hasHover`
  is asked for directly instead. It can come back properly alongside sticky headers.
- **`role="grid"` with cell-level keyboard navigation.** A different component — and the reason
  `aria-selected` is absent.
- **A `footer` prop on the columns API.** `Table.Footer` ships as a composable part, because Astryx
  has a Footer section and a totals row is a real thing. But a total is data the caller already has,
  and there is no drawing to derive one from.

## Showcase's table is a different object

`src/foundations/Showcase.tsx` used to export a documentation helper literally named `Table`, used by
the eight Foundations pages. It is now **`ShowcaseTable`** — two components called `Table` in one repo
is a five-minute detour every time somebody opens the wrong one. Its cells went with it, as
`ShowcaseTh` and `ShowcaseTd`. It hardcodes its classes rather than taking a recipe, has no density
or alignment, and is not in `src/index.ts`. Reach for the real `Table` in a component story.

Its `<th>` also sets `font-semibold` where `40005047:38832` measures weight **400**. The Figma is the
specification for this component; `Showcase.tsx` predates the node, is not a component, and is
deliberately left alone. Do not "fix" the Table to match the showcase.
