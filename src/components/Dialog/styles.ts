import { tv } from 'tailwind-variants'

/**
 * The recipes for a modal surface, shared by `Dialog` and `AlertDialog`.
 *
 * They live in their own file for exactly `Menu/styles.ts`'s reason — a second
 * component uses them — and the sharing is justified one level deeper here than
 * it was there. Base UI's `alert-dialog` subpath re-exports `Backdrop`, `Close`,
 * `Description`, `Popup`, `Portal`, `Title` and `Viewport` **from `../dialog/`**:
 * the same component objects, not lookalikes. Only `Root`, `Trigger` and
 * `Handle` are its own. So this is ContextMenu's case rather than Combobox's,
 * and copying the classes into a second file would be copying the styling of a
 * primitive onto itself.
 */

/**
 * The scrim.
 *
 * Figma drew no backdrop when this was built, and Astryx marks one *required* —
 * so it went in ahead of the file, the Accordion route that Popover's Title,
 * Description and Close took. A modal dialog without one has nothing that says
 * the page behind it is blocked, which is most of what "modal" means. **The file
 * has since caught up**: the Docs previews on the `↪ Dialog` page draw the scrim
 * behind the dialog in both themes. It lives there rather than inside the
 * component, because it sits behind the dialog rather than in it.
 *
 * **`surface-drop-shadow`, and the route to it is the point.** The obvious
 * candidate was `surface-canvas-overlay` — the token literally named "an overlay
 * on the canvas" — and it was built on that first. Measuring it killed it: it is
 * `neutral-800` at 10% in light but `neutral-100` at 10% in **dark**, because it
 * is a hover wash and a hover state lightens on a dark canvas. So in dark it
 * *raised* the page from `#0c0a09` to `#232121` while the dialog's own surface
 * is `#1c1917` — the page behind ended up brighter than the dialog on top of it,
 * and the dialog read as a hole rather than as something lifted. Exactly
 * backwards, and invisible in light mode, where it looked correct.
 *
 * `surface-drop-shadow` darkens in both themes (`neutral-800` at 25% light,
 * black at 50% dark), which is the one thing a scrim has to do. It is the
 * elevation family's token doing a surface job, which is the trade Kbd's record
 * warns about — right value, wrong name — and it is taken here knowingly rather
 * than by accident. The clean fix is a `Surface/Backdrop` token in Figma, and
 * that is what this owes the file. See the component's `CLAUDE.md` for the
 * measured numbers on both sides.
 *
 * Opacity only, no scale: a scrim that grew would be a scrim that had an edge.
 */
export const backdrop = tv({
  base: [
    'fixed inset-0 bg-surface-drop-shadow',
    'transition-opacity duration-fast ease-standard',
    'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
  ],
})

/**
 * The centering frame, and the thing that keeps a 600-wide dialog on a 375-wide
 * phone.
 *
 * Base UI's `Viewport` supplies **no positioning of its own** — read it: it
 * renders a `<div role="presentation">` and sets `pointer-events: none` while
 * closed, and nothing else. So the centering is ours, and `p-4` is the gutter.
 * That is Astryx's "clamp to the dynamic viewport with spacing-token gutters"
 * done with a token instead of a `calc()`: the popup's `max-w-full` and
 * `max-h-full` resolve against this element's content box, so the 16 either side
 * is subtracted for free.
 */
export const viewport = tv({
  base: ['fixed inset-0 flex items-center justify-center p-4'],
})

/**
 * The surface. Every number is measured off Figma node `40004383:17046`.
 *
 * **The padding is 16 / 12 / 16 / 16 and the 12 on top is not a slip.** Read
 * from the node: `paddingTop: 12`, `paddingBottom: 16`. It is optical
 * compensation — the header is a 32px row holding 24px of text, so 12 of frame
 * padding puts the title's own box 16 from the top, which is what the eye
 * measures. ContentBlock's header padding is the same idea. The consequence is
 * that a dialog with no title sits 4px high, and the file cannot express that
 * shape anyway: its only properties are `Title Text` and the `Content` slot.
 *
 * `shadow-high` (`0 16px 32px`) is the first use of the top of the elevation
 * scale in the library — Popover is `shadow-medium`, and a dialog floating over
 * a scrim should not sit at a panel's height.
 *
 * `outline-none` is load-bearing for Popover's reason, one step stronger: Base
 * UI spreads `FOCUSABLE_POPUP_PROPS` onto the popup unconditionally, and a modal
 * dialog is *always* focused on open, not only when nothing inside is tabbable.
 *
 * **No `origin-(--transform-origin)`** — there is no anchor to grow out of, so
 * it scales from its own center. And **no `data-[instant]:duration-0`**: the
 * string `instant` does not appear anywhere in `@base-ui/react/dialog`, so the
 * class could never match. Checked rather than copied across from Popover.
 */
export const popup = tv({
  base: [
    // w-600 from the node; max-w-full is what the viewport's gutter acts through.
    'flex w-(--dialog-width) max-w-full flex-col',
    // The cap that makes `Dialog.Body` work: the popup can never be taller than
    // the gutter allows, so the overflow has to happen somewhere inside it.
    'max-h-full min-h-0',
    // itemSpacing 12; padding [12, 16, 16, 16].
    'gap-3 px-4 pt-3 pb-4',
    // cornerRadius 12, strokeWeight 1 INSIDE, Surface/Background Primary,
    // Elevation/Drop Shadow/High. The shadow's color is a semantic token, so it
    // flips for dark mode on its own and there is no `dark:` class here.
    'rounded-lg border border-surface-border bg-surface-background-primary shadow-high',
    // 14/24 body type, so content starts from the library's base rather than
    // from whatever the page happens to set.
    'font-sans text-base text-content-primary',
    'outline-none',
    'transition-[opacity,scale] duration-fast ease-standard',
    'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
    'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
  ],
})

/**
 * The scrolling middle.
 *
 * This is the part that pays the debt Popover's record opened. Popover put
 * `overflow-y-auto` on the whole panel and called it "a floor, not a home" for
 * long content; here the popup is capped instead and *this* scrolls, so the
 * title and the × stay put while the content moves under them. Astryx's
 * `Scrollable` example, and its Body element.
 *
 * `min-h-0` is the whole trick: a flex child's default `min-height: auto`
 * refuses to shrink below its content, so without it the popup grows past its
 * own `max-h-full` and nothing scrolls at all.
 */
export const body = tv({
  base: ['min-h-0 flex-1 overflow-y-auto'],
})
