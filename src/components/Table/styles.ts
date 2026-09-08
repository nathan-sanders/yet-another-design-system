import { tv, type VariantProps } from 'tailwind-variants'

/**
 * The recipes behind `Table` and every one of its parts.
 *
 * Drawn in Figma under `40005049:39146` — `Table Cell` (`40005049:39090`,
 * Density × Align) and `Table Head` (`40005047:38832`, Type × Align). They are
 * shared by two callers — the columns API renders through the same parts a
 * caller composes by hand — so the recipes live here rather than in
 * `Table.tsx`, the way `Card`'s and `Calendar`'s do.
 *
 * ## The rules are pseudo-elements, not borders
 *
 * Figma draws every rule in this component as an **absolutely positioned 1px
 * frame** — `Border` at `top-0`, `Grid Divider` and `Resize` at `right-0` — and
 * this file keeps it that way with `after:` and `before:` on the cell, over a
 * table set `border-separate border-spacing-0`. Four reasons, in weight order:
 *
 * 1. **The arithmetic.** A cell's height is content-driven: `py-1` plus a 24px
 *    line-height is exactly the file's 32. Add a real `border-b` and it is 33,
 *    and 41 and 57 at the other two densities. Holding the file's numbers with
 *    real borders means writing `pb-[3px]` — an untokenized magic number in a
 *    library whose whole premise is that the numbers come from tokens. A
 *    pseudo-element is out of flow and costs nothing, so `Density`'s play
 *    function can *assert* 32/40/56 instead of approving them.
 * 2. **The divider and the resize handle share an edge.** The file paints the
 *    divider `surface/border` and the handle `surface/border-emphasized`, both
 *    at `right-0`. As real borders only one of them can exist; as overlays the
 *    handle paints over the divider, which is what the file shows.
 * 3. **`dividers` has four values that have to compose.** Under
 *    `border-collapse: collapse` adjacent cells' borders go through conflict
 *    resolution, and a selected row's emphasized rule can lose to its
 *    neighbour's ordinary one with nothing to see and nothing to debug.
 * 4. **It dissolves Calendar's transparent-border problem instead of solving
 *    it.** `Calendar/styles.ts` reserves `border border-transparent` on every
 *    day because its stroke is a real border and hover would otherwise reflow
 *    the grid. Here there is no border at rest and none under the pointer — a
 *    pseudo-element changes color with no layout at all. The reserved
 *    transparent border is the answer when the stroke *must* be a border; it is
 *    not needed when the file already drew the stroke as an overlay.
 *
 * It also keeps a sticky header cheap to add later: `border-collapse: collapse`
 * famously drops collapsed borders off a sticky `<th>`.
 */

/**
 * The frame around the table.
 *
 * `bg-surface-background-primary` and not the canvas: hover and selection are
 * both `surface-background-subtle`, which is the *same stone* as
 * `surface-canvas` in both themes, so a table sitting on the canvas would have
 * an invisible hover state.
 */
export const scrollRegion = [
  'overflow-x-auto rounded-lg border border-surface-border bg-surface-background-primary',
].join(' ')

/**
 * The table element itself.
 *
 * **`table-fixed`, always, not conditionally.** Three separate things need it
 * and none can be made optional: `truncate` is meaningless under `auto` (the
 * browser sizes columns to their content, so nothing ever overflows and the
 * ellipsis never appears), a resized column does not stay resized because the
 * browser re-solves widths on every render, and a text-heavy column with no
 * declared width squishes toward nothing on a narrow viewport. The cost —
 * columns no longer size themselves to their contents — is what the width API
 * and the table's own `min-width` are for.
 *
 * `border-separate border-spacing-0` rather than `collapse`, for the reasons
 * at the top of this file.
 */
export const tableRoot = ['w-full table-fixed border-separate border-spacing-0 font-sans'].join(' ')

/**
 * A body row, and the three fills it has to keep apart.
 *
 * ## The stripe is the quiet one and the hover is the loud one
 *
 * A zebra table has to survive hover and selection landing on either parity, so
 * three fills have to stay distinct, and they have to stay in the right *order*
 * — pointing at a row should always add ink, never take it away.
 *
 * The first pass had this backwards. It struck the stripe in
 * `surface-overlay-subtle` and left hover on `surface-background-subtle`, which
 * is the house's usual hover fill. Measured, the stripe composites to about 93%
 * lightness and that hover fill is 97%: hovering a striped row made it
 * *lighter* than it was at rest, so the pointer read as less attention rather
 * than more, on every other row.
 *
 * So they are the other way round:
 *
 * - **stripe** is `surface-background-subtle` — an opaque whisper, quieter than
 *   anything that responds to you, which is all a zebra should be.
 * - **hover** is `surface-overlay-subtle`, and the property that earns it is
 *   that it is **translucent**. A 10% ink wash darkens whatever it is laid
 *   over, so a hovered row is darker than its resting state whichever parity it
 *   is — which no opaque fill can promise once rows have two resting states.
 *   The token set already does this: `--nav-item-background-hover` is
 *   `surface-overlay-subtle` in the theme-following nav mode.
 * - **selected** is the same wash *plus* the emphasized rule on its cells.
 *   `Card`'s split: the fill says something is true of this row, the rule says
 *   which thing, and the two stay apart when both are true at once. The hover
 *   class is repeated so the pointer cannot wash the selection off.
 *
 * That is still an overlay token doing a surface's job, and the file owes
 * either a `Striped` drawing or a pair of row-state tokens. Until it has them
 * this is the code-first route the root record already documents for Badge's
 * hues and Divider's `emphasis`. The `Striped` story measures all three and
 * asserts they differ, so a token edit cannot quietly collapse them.
 *
 * One thing to know before moving the stripe: `surface-background-subtle` is
 * the same stone as `surface-canvas` in both themes, so a striped table sitting
 * on the canvas would have invisible stripes. The table's own surface is
 * `surface-background-primary`, which is what keeps them visible.
 */
export const row = tv({
  base: 'transition-colors duration-fast-min ease-standard',
  variants: {
    hoverable: { true: 'hover:bg-surface-overlay-subtle', false: '' },
    striped: { true: 'bg-surface-background-subtle', false: '' },
    selected: { true: 'bg-surface-overlay-subtle hover:bg-surface-overlay-subtle', false: '' },
  },
  defaultVariants: { hoverable: false, striped: false, selected: false },
})

/**
 * Figma's `Grid Divider` — a 1px `surface/border` down a cell's right edge.
 *
 * `not-last:` so the last column in a row draws nothing, in both APIs, without
 * a caller ever having to count columns.
 */
const columnDividerClass = [
  'not-last:before:absolute not-last:before:inset-y-0 not-last:before:right-0',
  'not-last:before:w-px not-last:before:bg-surface-border not-last:before:content-[""]',
].join(' ')

/**
 * A body cell.
 *
 * ## The slots, and why the text is not the cell
 *
 * `root` is the `<td>` and paints no background of its own, so the row's fill
 * shows through it. `line` is the flex row that carries the checkbox, the
 * expand chevron, the content and the spacer. `text` is a separate span because
 * **`truncate` on a flex container does nothing** — its children are flex
 * items, and an ellipsis needs inline content to clip. The mono rule lands
 * there for the same reason: it should style the value, not the row of
 * controls beside it.
 */
export const cell = tv({
  slots: {
    root: [
      'relative bg-transparent font-sans text-base font-normal text-content-primary',
      'transition-colors duration-fast-min ease-standard',
    ],
    line: 'flex min-w-0 items-center',
    text: 'min-w-0',
    /**
     * Figma's `Sort By Spacer` — 30 × 24, reserved at the end of a
     * right-aligned cell so the value lines up under its column's *label*
     * rather than under the sort button beside it. 30px is exactly the sort
     * button's box (`h-6 px-2` + a 1px border around a 12px icon), and
     * `w-7.5` is 30px because `--spacing` is 4px.
     */
    spacer: 'h-6 w-7.5 shrink-0',
  },

  variants: {
    /**
     * Figma's `Density` axis.
     *
     * Every height falls out of the padding and the 24px `text-base`
     * line-height, with no explicit height anywhere: 4+24+4 = 32, 8+24+8 = 40,
     * 16+24+16 = 56.
     *
     * **Both axes move, not just the vertical one.** The side padding runs
     * 8/12/16 alongside the 4/8/16 above it, so a spacious table is roomier in
     * both directions rather than being a compact table with taller rows. Read
     * back from the file after it was changed; the first version held the sides
     * at 8 throughout.
     *
     * `head` carries the same three side values, and has to: a header whose
     * padding did not track the cell's would put every label 4px or 8px out of
     * line with the column under it.
     */
    density: {
      compact: { root: 'px-2 py-1' },
      balanced: { root: 'px-3 py-2' },
      spacious: { root: 'p-4' },
    },

    /**
     * Figma's `Align` axis. Two values, because that is what the file draws —
     * there is no centre.
     *
     * The gaps differ on purpose. Left is `gap-2` (8px) between the controls
     * and the value; right is `gap-0.5` (2px) between the value and the
     * spacer, which puts a right-aligned value exactly 32px from the padding
     * edge — 2 + the spacer's 30 — which is where the header's label sits.
     * That equality is the spacer's entire job, and `Alignment` measures it.
     */
    align: {
      left: { root: 'text-left', line: 'justify-start gap-2' },
      right: { root: 'text-right', line: 'justify-end gap-0.5' },
    },

    verticalAlign: {
      top: { root: 'align-top' },
      middle: { root: 'align-middle' },
      bottom: { root: 'align-bottom' },
    },

    textOverflow: {
      wrap: { text: 'whitespace-normal' },
      truncate: { text: 'truncate' },
    },

    /**
     * `Metric`'s idiom, and always as a pair: mono so a column of figures has
     * one glyph width, `tabular-nums` so every digit gets the width of a `0`
     * and the decimal points line up down the column.
     */
    numeric: {
      true: { text: 'font-mono tabular-nums' },
      false: {},
    },

    /**
     * Figma's `rowBorder`, at `top-0` — the rule belongs to the row *below* it.
     * That is why `Table Head` has no `rowBorder` of its own: the line under
     * the header is the first body row's own top rule, and the last row has
     * nothing under it because the container's border closes the table.
     */
    rowDivider: {
      true: {
        root: 'after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-surface-border after:content-[""]',
      },
      false: {},
    },

    columnDivider: {
      true: { root: columnDividerClass },
      false: {},
    },

    /**
     * A selected row's rule steps up to the emphasized stroke — the half of
     * `Card`'s selected state that hover does not have, and what keeps
     * "selected" and "the pointer is here" apart in a table where both can be
     * true of the same row.
     *
     * **Key order here is load-bearing.** `selected` is declared after
     * `rowDivider` so `tailwind-variants`' merge lets it win. Sorting these
     * keys alphabetically would silently give the row back its ordinary rule.
     */
    selected: {
      true: { root: 'after:bg-surface-border-emphasized' },
      false: {},
    },
  },

  defaultVariants: {
    density: 'balanced',
    align: 'left',
    verticalAlign: 'middle',
    textOverflow: 'wrap',
    numeric: false,
    rowDivider: true,
    columnDivider: false,
    selected: false,
  },
})

/**
 * A column header.
 *
 * `text-sm` at weight **400**, not semibold. Read back from `40005047:38832`,
 * and worth stating because `src/foundations/Showcase.tsx` — the docs helper
 * the Foundations pages use — sets its own `<th>` in `font-semibold`. That file
 * predates this node and is not a component; the Figma is the specification
 * here, and `Showcase.tsx` is deliberately left alone.
 *
 * There is **no `rowDivider` variant**, because the file gives the head no
 * `rowBorder` boolean. The absence is the specification, not an oversight.
 */
export const head = tv({
  slots: {
    root: [
      /*
        `h-8`, not `min-h-8`, for the file's 32px. On a table cell `height` is
        *specified* as a minimum — the cell grows past it if its content needs
        the room — where `min-height` is not reliably honored at all. The head
        rendered 28px under `min-h-8`: a 20px line-height plus its 4px of
        padding, with the constraint quietly ignored.
      */
      'relative h-8 bg-transparent py-1 align-middle',
      'font-sans text-sm font-normal text-content-subtle',
    ],
    line: 'flex min-w-0 items-center',
    /**
     * Figma's `Span` — the label and its sort control at a 2px gap, with the
     * sort *after* the label in both alignments.
     */
    sortGroup: 'flex min-w-0 items-center gap-0.5',
    /**
     * A header label always truncates, at every `textOverflow` setting. A
     * wrapping header would change the height of the header row as columns
     * resize, which is the one row whose height has to be stable.
     */
    label: 'min-w-0 truncate',
  },
  variants: {
    /**
     * The side padding only — the header keeps `min-h-8 py-1` at every density,
     * which is the file's own reading: the rows get roomier and the header they
     * sit under does not grow with them.
     *
     * It cannot simply be left at 8, though. The header's padding has to track
     * the cell's or every label sits 4px or 8px out of line with its column.
     */
    density: {
      compact: { root: 'px-2' },
      balanced: { root: 'px-3' },
      spacious: { root: 'px-4' },
    },
    align: {
      left: { root: 'text-left', line: 'justify-start gap-2' },
      right: { root: 'text-right', line: 'justify-end gap-0' },
    },
    columnDivider: {
      true: { root: columnDividerClass },
      false: {},
    },
  },
  defaultVariants: { density: 'balanced', align: 'left', columnDivider: false },
})

export type TableCellVariants = VariantProps<typeof cell>
export type TableRowVariants = VariantProps<typeof row>

/** Figma's `Density` axis, and the only thing that sets a row's height. */
export type TableDensity = NonNullable<TableCellVariants['density']>
/** Figma's `Align` axis. Two values, as the file draws it. */
export type TableAlign = NonNullable<TableCellVariants['align']>
export type TableVerticalAlign = NonNullable<TableCellVariants['verticalAlign']>
export type TableTextOverflow = NonNullable<TableCellVariants['textOverflow']>

/**
 * Which rules the table draws.
 *
 * Astryx's four values. `rows` is the default because it is Figma's — the cell
 * ships with `rowBorder` on and `gridDivider` off.
 */
export type TableDividers = 'rows' | 'columns' | 'grid' | 'none'

/** Whether a given `dividers` mode draws the rule between rows. */
export function hasRowDivider(dividers: TableDividers): boolean {
  return dividers === 'rows' || dividers === 'grid'
}

/** Whether a given `dividers` mode draws the rule between columns. */
export function hasColumnDivider(dividers: TableDividers): boolean {
  return dividers === 'columns' || dividers === 'grid'
}
