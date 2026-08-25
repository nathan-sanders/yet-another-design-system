import { tv } from 'tailwind-variants'

import { focusRing } from '../../lib/focus'

/**
 * The popup half of a Combobox — and of an `Autocomplete`, which is why these
 * live here rather than inside `Combobox.tsx`.
 *
 * ## Why this is a share and not a resemblance
 *
 * Base UI's `autocomplete` subpath re-exports `Popup`, `Positioner`, `List`,
 * `Group`, `GroupLabel`, `Collection`, `Empty`, `Row`, `Portal`, `Icon`, `Clear`
 * and `Input` as **the same component objects** as `combobox`'s — not
 * lookalikes, the same functions. CLAUDE.md's test for sharing is exactly that:
 * not "do they look alike" but "is it the same primitive underneath". It is,
 * and Figma draws the two menus identically down to the 20px header inset — so
 * `ContextMenu`'s arrangement applies, and these recipes sit in one module the
 * way Menu's rows do in `Menu/styles.ts`.
 *
 * **Where the share stops.** `Root`, `Item`, `Trigger`, `Value` and `Separator`
 * are genuinely different components in the two namespaces, so the *field* half
 * is not here: `trigger`, `value`, `field`, `chips`, `chipsInput`, `search`,
 * `searchInput` and `indicatorBox` stay in `Combobox.tsx` where only a Combobox
 * can reach them. Autocomplete's field is `Input`'s box instead — it is an
 * `<input>` in a bordered frame, which is what `Input/styles.ts` already draws.
 *
 * The second reason for the split is the one `Input/styles.ts` and
 * `Avatar/styles.ts` give: a module exporting both a component and constants
 * breaks React Fast Refresh.
 */

/**
 * The popup. Figma's Combobox Menu and Autocomplete Menu: a card on the Medium
 * elevation, `rounded-lg`.
 *
 * Select's block, for the same reasons — `outline-none` because Base UI parks
 * focus inside and the browser would otherwise paint its own system ring on the
 * panel, and Tooltip's motion off `--transform-origin` so it grows out of its
 * anchor.
 *
 * **`overflow-clip` is not ported.** Figma sets it on the menu frame; here it
 * would slice the focus ring off the first and last rows.
 *
 * Unlike Select this hangs *below* its anchor rather than overlapping it —
 * `alignItemWithTrigger` has no meaning when the popup carries a search field,
 * and none when the field itself is the input — so there are no scroll arrows to
 * build. Base UI ships none for either component. The list scrolls inside the
 * panel instead.
 */
export const popup = tv({
  base: [
    'flex flex-col',
    'rounded-lg border border-surface-border bg-surface-card-primary shadow-medium',
    'font-sans',
    'outline-none',
    'min-w-(--anchor-width) max-h-(--available-height)',
    'transition-[opacity,scale] duration-fast ease-standard origin-(--transform-origin)',
    'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
    'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
    'data-[instant]:duration-0',
  ],
})

/**
 * The scrolling list. The panel caps its own height at `--available-height`, so
 * this is what actually scrolls inside it.
 */
export const list = tv({
  base: 'flex min-h-0 flex-1 flex-col overflow-y-auto',
})

/**
 * A row. Figma's Combobox Menu Item and Autocomplete Menu Item, which are the
 * same 32px row as Select's and Menu's, with the same padding and the same
 * hover.
 *
 * Hover and keyboard highlight are one attribute: `highlightItemOnHover`
 * defaults true, so Figma's separate Hover and Focus states collapse to
 * `data-highlighted` for the background plus the shared ring for the outline.
 *
 * **`focusRing` rather than `focusRingUnhovered`**, unlike Menu's rows. The rule
 * in CLAUDE.md is about lists whose rows take *real DOM focus* because you
 * pointed at them; in both of these components focus stays in an `<input>` — the
 * popup's search field in a Combobox, the field itself in an Autocomplete — and
 * the row is only ever highlighted through `aria-activedescendant`. So the
 * scripted-`.focus()` bug the unhovered variant exists to stop cannot arise
 * here, and the ring is left plain for the keyboard-in-a-hand-built-tree case.
 *
 * `group` is here so Combobox's multi-select box and radio dot can read
 * `data-selected` off the item, which is where Base UI puts it. An Autocomplete
 * row has no `selected` state at all — Base UI's `AutocompleteItem` does not
 * define one — so nothing hangs off it there.
 */
export const item = tv({
  base: [
    'group flex w-full items-center gap-3',
    // px-3 = spacing/3 (12px), py-1 = spacing/1 (4px), so 24 + 8 = 32px tall.
    'rounded-md px-3 py-1',
    'cursor-pointer text-base select-none',
    'text-content-primary',
    'data-highlighted:bg-surface-card-subtle',
    ...focusRing,
    'data-disabled:pointer-events-none data-disabled:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],
})

/** The label column of a row, with Figma's optional Sub Label under it. */
export const itemLabel = tv({
  base: 'flex min-w-px flex-1 flex-col items-start',
})

/**
 * A group's heading. `px-5` puts it 20px from the panel edge, which is where the
 * rows' text lands too — the items wrapper's `p-2` plus the row's own `px-3`.
 */
export const groupLabel = tv({
  base: 'px-5 pt-3 text-sm text-content-subtle',
})

/**
 * The rule above a group.
 *
 * **A sibling of the group, not a child.** Figma puts a Divider inside every
 * group including the first, where it is invisible only because it lands on the
 * panel's own border and gets clipped. Rendering it as a sibling lets
 * `first:hidden` do that honestly.
 */
export const separator = tv({
  base: 'h-px shrink-0 bg-surface-border first:hidden',
})

/** The "nothing matched" line. Figma draws no such state — see CLAUDE.md. */
export const empty = tv({
  base: 'px-5 py-3 text-base italic text-content-subtle',
})
