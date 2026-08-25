import { tv } from 'tailwind-variants'

/**
 * The popup. Figma's Menu frame: a card with the Medium elevation.
 *
 * **Shared with `ContextMenu`**, which is why it lives here rather than in
 * `Menu.tsx`. The two components draw the same card — Figma's `Context Menu`
 * (`40004155:13536`) reads back the same `width/w-30`, `border-radius/rounded-lg`,
 * `Surface/Primary`, `Surface/Border` and `Elevation/Drop Shadow/Medium` as
 * the Menu frame does — and Base UI's context-menu subpath re-exports Menu's own
 * `Popup` component object, so there is one popup here in every sense. The two
 * wrappers differ only in what they hand the positioner.
 *
 * **`overflow-clip` is not ported, for the fourth time** — but for a new reason.
 * SegmentedControl, Banner and Toast all left it out because it would slice a
 * focus ring; here an item sits 8px in from the popup edge and its ring reaches
 * 4px, so clipping would be safe. It is replaced by `overflow-y-auto` instead,
 * which clips to the radius just the same and lets a long menu scroll rather
 * than run off the screen. Figma draws no long menu; Astryx's guidance ("no
 * more than 10-12 items without sections") assumes the case exists.
 */
export const popup = tv({
  base: [
    // min-w-30 = 120px, the min-width Figma sets on Menu Group.
    'flex min-w-30 flex-col',
    'rounded-lg border border-surface-border bg-surface-primary shadow-medium',
    'font-sans',
    // Base UI parks focus on the popup itself when a menu is opened by click,
    // and the browser draws its own focus ring on it — the system accent colour,
    // which is nothing to do with this theme. The popup is a way-station, not a
    // stop: the ring belongs on the item you land on.
    'outline-none',
    // Base UI publishes the room left between the anchor and the viewport edge.
    'max-h-(--available-height) overflow-y-auto',
    // Tooltip's motion, unchanged. Base UI sets --transform-origin to the point
    // nearest the trigger, so the popup grows out of its own trigger — or, in a
    // context menu, out of the point that was clicked.
    'transition-[opacity,scale] duration-fast ease-standard origin-(--transform-origin)',
    'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
    'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
    // Base UI sets data-instant when animating would be wrong — dismissal, and
    // moving between triggers in the same group.
    'data-[instant]:duration-0',
  ],
})
