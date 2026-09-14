import { tv } from 'tailwind-variants'

import { focusRingFromParent } from '../../lib/focus'

/**
 * TreeList's recipes. The row is Figma's `Tree List Item`: 32px tall, 8px
 * right padding and none on the left, `gap-2` between its parts, `rounded-md`.
 * Nothing sets a height — 32 is `py-1` round a 24px line, and a description
 * adds its own 20 for 52. Table's arithmetic.
 */

/** No gap: a child's rail has to touch its parent's, or the guide line breaks. */
export const tree = tv({ base: 'flex flex-col font-sans' })

/** SideNav.Section's header, on the semantic tier. Not a heading element — see the record. */
export const treeHeader = 'px-2 py-1 text-sm text-content-subtle'

/**
 * The children of an open parent. Base UI measures the panel and publishes the
 * result as `--collapsible-panel-height`; this transitions to it and collapses
 * to zero for the frame before opening and before closing — SideNav.Group's
 * panel, one component over.
 *
 * `overflow-clip` rather than `overflow-hidden`, and with a 4px clip margin:
 * the focus ring paints 2+2px *outside* a row, and a plain `overflow-hidden`
 * keeps clipping it long after the height has returned to `auto`. The margin
 * lets the ring through on every side while still bounding the collapsing
 * content.
 */
export const panel = tv({
  base: [
    'h-(--collapsible-panel-height) transition-[height] duration-fast ease-standard',
    'data-[starting-style]:h-0 data-[ending-style]:h-0',
    'overflow-clip [overflow-clip-margin:--spacing(1)]',
  ],
})

/**
 * The painted row. Hover and selected share the translucent
 * `surface-overlay-subtle` — Table's fill, chosen over Figma's
 * `Surface/Background Subtle` because that token *is* the canvas in both
 * themes, so a tree sitting on the page would show nothing at all. A wash
 * darkens whatever it is laid over, so a hovered selected row still departs.
 *
 * The ring comes from the parent `<li>`'s focus, not this element's — it is
 * never focused itself. See `focusRingFromParent`.
 */
export const row = tv({
  base: [
    'flex min-h-8 items-center gap-2 rounded-md pr-2',
    'cursor-pointer select-none text-left',
    'transition-colors duration-fast-min ease-standard',
    'hover:bg-surface-overlay-subtle',
    ...focusRingFromParent,
  ],
  variants: {
    selected: { true: 'bg-surface-overlay-subtle', false: '' },
    // A variant rather than a `disabled:` modifier: the row is a <div> or an
    // <a>, and neither has the attribute. Card's reason.
    disabled: { true: 'pointer-events-none opacity-40', false: '' },
  },
  defaultVariants: { selected: false, disabled: false },
})

/**
 * Figma's `_Tree Rail`: 16 wide, the row's full height, with a 1px
 * `Surface/Border` line on its right edge. One per ancestor level, packed with
 * no gap, so the line for level *n* lands at `16n − 1` — under the centre of
 * the parent's chevron. `guides={false}` keeps the width and drops the line:
 * the indent never moves.
 *
 * Two utilities (`border-r` + the color) rather than `border-r-<token>`, so
 * `tokens.test.ts` can see the token name.
 */
export const rail = tv({
  base: 'w-4 shrink-0 self-stretch',
  variants: {
    guides: { true: 'border-r border-surface-border', false: '' },
  },
  defaultVariants: { guides: true },
})

/** The 16px chevron box. `outline-none` because it is never a tab stop; the row's ring speaks for it. */
export const chevron = 'flex size-4 shrink-0 items-center justify-center outline-none'
