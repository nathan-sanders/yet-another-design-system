import { tv } from 'tailwind-variants'

/**
 * The three looks a drag has: the item being carried, the place it could
 * land, and the grip you carry it by. Every value is a token — the lifted
 * card's shadow is `shadow-medium`, its opacity the file's `opacity/opacity-50`,
 * and the drop ring is the emphasized border that `ClickableCard` already
 * uses for `selected`, so a board reads as one system in both themes.
 */

/**
 * The element `Sortable.Item` renders. `rounded-md` so the drop ring follows
 * a card's corners; a caller with a `rounded-lg` block overrides it.
 *
 * **The ring is here and not on the card inside**, because `ClickableCard`'s
 * focus ring is also a `ring` and two on one element overwrite each other.
 * `z-10` lifts the carried item above later siblings, which otherwise paint
 * over it as it crosses them — the same painting-order rule `layers.ts`
 * documents, one layer down.
 */
export const sortableItem = tv({
  base: 'relative rounded-md',
  variants: {
    dragging: {
      true: 'z-10 opacity-50 shadow-medium select-none',
      false: '',
    },
    over: {
      true: 'ring-2 ring-surface-border-emphasized',
      false: '',
    },
  },
  defaultVariants: {
    dragging: false,
    over: false,
  },
})

/**
 * The element `Sortable` renders. Only an *empty* container is ever "over" in
 * practice — with items in it the item under the pointer wins the collision —
 * so this is the ring an empty column shows when a card is carried into it.
 * Inset, because the container's own border is the outer edge.
 */
export const dropTarget = tv({
  base: '',
  variants: {
    over: {
      true: 'ring-2 ring-inset ring-surface-border-emphasized',
      false: '',
    },
  },
  defaultVariants: {
    over: false,
  },
})

/**
 * The grip. `touch-none` is what lets a finger drag from it: a press on the
 * item's body pans the page (the browser wins and dnd-kit ends cleanly), a
 * press here does not, so the handle is the touch activator without a third
 * sensor. `Table.ResizeHandle` makes the same call.
 */
export const dragHandle = tv({
  base: 'cursor-grab touch-none',
  variants: {
    dragging: {
      true: 'cursor-grabbing',
      false: '',
    },
  },
  defaultVariants: {
    dragging: false,
  },
})
