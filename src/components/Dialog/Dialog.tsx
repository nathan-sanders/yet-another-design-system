import type { CSSProperties, ComponentPropsWithRef, ReactElement } from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'

import { Button } from '../Button'
import { cn } from '../../lib/cn'
import { overlayLayer } from '../../lib/layers'
import { backdrop, body, popup, viewport } from './styles'

/**
 * Dialog — a modal surface that blocks the page until you answer it.
 *
 * Mirrors Figma node `40004383:17046` on the `↪ Dialog` page (`40004383:16847`),
 * which has **no variant set** and exactly two component properties — a TEXT
 * called `Title Text` and a SLOT called `Content`. So, like Tooltip and Popover,
 * there is not a single `tv()` variant here and everything interesting is
 * behavior.
 *
 * **This is the component the library has been pointing at.** Both of Astryx's
 * "don't" rules for a popover — content that needs heavy input, and content long
 * enough to scroll — say *use a Dialog instead*, and until now there was nothing
 * to send anyone to. Popover's `max-h-(--available-height) overflow-y-auto` was
 * recorded as "a floor, not a home" for that case; `Dialog.Body` is the home.
 *
 * **Sixth Base UI component that portals**, and the second to carry
 * `role="dialog"` — but the first that is genuinely modal, which changes three
 * things Popover settled the other way. Focus moves *into* the dialog on open
 * rather than staying on the trigger. Everything outside the portal goes inert.
 * And a Backdrop is required rather than skippable.
 *
 * **What Figma draws, exactly.** 600 wide; padding 12 / 16 / 16 / 16, and the 12
 * on top is optical compensation rather than a slip — see `styles.ts`. A 12px
 * stack gap, `rounded-lg`, a 1px `Surface/Border` inside the width, and
 * `Elevation/Drop Shadow/High`. The header is a 32-tall row on an 8 gap holding
 * `text-base/semibold` on `Content/Primary` beside a 42x32 ghost close button.
 *
 * **What Figma did not draw, and was built here first.** The Backdrop, the
 * Description, and `Body`. Astryx marks Backdrop and Body *required* elements,
 * and a modal dialog with no scrim has nothing that says the page is blocked.
 * That is the Accordion route — code first, the file catches up — and it is the
 * same one Popover's whole part set took.
 *
 * **Two of the three have since landed in the file, and nothing here changed
 * when they did**, which is the test of whether a catch-up was really a
 * catch-up. The component gained a `Description` line and the `Title` /
 * `Description` / `Is Dismissable` booleans, so its property set is now
 * Popover's vocabulary exactly; the Docs previews draw the scrim in both themes.
 * `Body` is the one that cannot land: Figma has no way to draw scrolling, so it
 * is carried as a Best Practices rule on the page instead of as geometry.
 *
 * **`Dialog.Popup` swallows Portal, Backdrop and Viewport** — Menu's move, held
 * by Popover. The caller writes `<Dialog><Dialog.Trigger /><Dialog.Popup />`,
 * not a five-deep nesting.
 *
 * **No `purpose` prop, and that is a decision rather than an omission.** Astryx
 * has one word — `info` / `form` / `required` — over two unrelated Base UI
 * mechanisms: `form` is `disablePointerDismissal` on the Root, and `required` is
 * cancelling the `escape-key` reason inside `onOpenChange`. Both already reach
 * the caller free through the Root pass-through, and folding them into one word
 * buys a name while losing the ability to mix them. The `Form` and `Required`
 * stories show each.
 *
 * **No `Dialog.Header`**, for the reason Popover's record settled: Figma needs a
 * frame to sit a title beside a button and the code does not, so
 * `flex items-center justify-between gap-2` at the call site is the whole of it.
 * Seeing `Header` in the layer tree is not evidence that the part should exist.
 */

export interface DialogPopupProps
  extends Omit<
    ComponentPropsWithRef<typeof DialogPrimitive.Popup>,
    'className' | 'render' | 'aria-label'
  > {
  /**
   * Dialog width in pixels. Figma draws 600 and cannot draw anything else —
   * none of its four property kinds is a number — so this is a code-only axis
   * rather than a variant waiting for the file to catch up. Popover's `width`,
   * for Popover's reason. Astryx defaults to 400; the file wins.
   */
  width?: number
  /**
   * The dialog's accessible name, for a dialog with no `Dialog.Title`. Prefer a
   * Title — it names the dialog *and* shows the name to everybody.
   */
  label?: string
  /** Extra classes for the surface. */
  className?: string
}

/**
 * The surface, which swallows Portal, Backdrop and Viewport.
 *
 * **The z-index goes on two elements here, and that is new.** Every other
 * portalled popup in the library has a single Positioner to put `overlayLayer`
 * on. A Dialog has no Positioner at all: the Backdrop and the Viewport are
 * `fixed` siblings inside the Portal, and either one left on `z-index: auto`
 * would be punched through by any positioned `z-10` on the page — which is not
 * hypothetical, since that is exactly how `Token.Remove`'s crosses once floated
 * over an open Combobox. Both get 40, and the Viewport is written second so it
 * paints above the scrim. Toast's `z-50` stays the top of the library.
 */
function DialogPopup({
  children,
  width = 600,
  label,
  className,
  ...props
}: DialogPopupProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className={cn(backdrop(), overlayLayer)} />
      <DialogPrimitive.Viewport
        className={cn(viewport(), overlayLayer)}
        /*
         * The width goes here rather than on the popup for two reasons that
         * agree, both Popover's: a custom property inherits, so
         * `w-(--dialog-width)` still resolves one level down; and the popup's
         * own `style` is already spoken for — Base UI writes `--nested-dialogs`
         * onto it — so leaving it alone avoids a merge.
         */
        style={{ '--dialog-width': `${width}px` } as CSSProperties}
      >
        <DialogPrimitive.Popup
          className={cn(popup(), className)}
          /*
           * Spread only when it is a string, never as `undefined`: forwarding an
           * `aria-*` prop as undefined deletes what Base UI computed, which here
           * would wipe the `aria-labelledby` a `Dialog.Title` had supplied.
           * Popover's guard, in Popover's spelling.
           */
          {...(label != null && { 'aria-label': label })}
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  )
}

DialogPopup.displayName = 'Dialog.Popup'

/**
 * Which heading the dialog's title sits in. A dialog title belongs in the page
 * outline, but only the page knows at what depth — and getting it wrong is an
 * axe `heading-order` failure rather than a matter of taste. Popover's prop, for
 * Popover's reason.
 */
export type DialogHeadingLevel = 2 | 3 | 4 | 5 | 6

/**
 * An explicit map rather than a computed tag, because `` `h${level}` `` widens
 * to `string`, which is not a JSX tag. Level 2 is Base UI's own default element,
 * so the default changes nothing.
 */
const HEADINGS: Record<DialogHeadingLevel, ReactElement> = {
  2: <h2 />,
  3: <h3 />,
  4: <h4 />,
  5: <h5 />,
  6: <h6 />,
}

export interface DialogTitleProps
  extends Omit<ComponentPropsWithRef<typeof DialogPrimitive.Title>, 'className' | 'render'> {
  /** Which heading element to render. */
  headingLevel?: DialogHeadingLevel
  /** Extra classes for the title. */
  className?: string
}

/**
 * The title, and the thing that names the dialog: Base UI points
 * `aria-labelledby` at it. Figma's `Title Text` property.
 */
function DialogTitle({ headingLevel = 2, className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      render={HEADINGS[headingLevel]}
      // min-w-0 so a long word can break rather than force the flex row that
      // usually holds this wider than the dialog.
      className={cn('min-w-0 font-semibold [word-break:break-word]', className)}
      {...props}
    />
  )
}

DialogTitle.displayName = 'Dialog.Title'

export interface DialogDescriptionProps
  extends Omit<ComponentPropsWithRef<typeof DialogPrimitive.Description>, 'className' | 'render'> {
  /** Extra classes for the description. */
  className?: string
}

/**
 * The body paragraph, which Base UI points `aria-describedby` at. Astryx's
 * "subtitle".
 *
 * Popover's pairing: the size is held at the dialog's 14/24 and only the color
 * changes, because this is body text and not a sub-label under a row. Hierarchy
 * comes from `font-semibold` on the title above it.
 */
function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <DialogPrimitive.Description className={cn('text-content-subtle', className)} {...props} />
}

DialogDescription.displayName = 'Dialog.Description'

export interface DialogBodyProps extends ComponentPropsWithRef<'div'> {
  /** Extra classes for the scrolling region. */
  className?: string
}

/**
 * The scrolling middle, and the part this whole component was owed for.
 *
 * Wrap the content that should scroll while the title and the close button stay
 * put. Figma's `Content` slot is what this is the code name of, so unlike
 * `Header` it is not invented — the file draws the frame, and Astryx marks Body
 * a required element.
 *
 * **It is not required here, and a short dialog should not use it.** A `flex-1`
 * region in a `max-h-full` column with nothing to overflow just makes the dialog
 * as tall as the viewport allows. Reach for it when the content is long.
 *
 * A plain `<div>` rather than a Base UI part, because Base UI has none — Dialog
 * ships `Root`, `Trigger`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`,
 * `Description` and `Close`, and the scroll region is ours.
 */
function DialogBody({ className, ...props }: DialogBodyProps) {
  return <div className={cn(body(), className)} {...props} />
}

DialogBody.displayName = 'Dialog.Body'

export interface DialogCloseProps
  extends Omit<ComponentPropsWithRef<typeof DialogPrimitive.Close>, 'className'> {
  /** Accessible name for the default icon button. Ignored when `render` is given. */
  label?: string
  /** Extra classes for the button. */
  className?: string
}

/**
 * The dismiss button. Popover's part, unchanged, and for the same reason: Astryx
 * uses Close in two visually unrelated forms — the `x` in a header and a
 * "Cancel" beside a confirm action — so rather than a variant deciding which,
 * the default *is* the `x` and `render` replaces it outright:
 *
 * ```tsx
 * <Dialog.Close />                                             // the x
 * <Dialog.Close render={<Button appearance="secondary">Cancel</Button>} />
 * ```
 *
 * `ghost` at the default size, which is what Figma draws: a 42x32 button, being
 * 12 of padding either side of a 16px icon plus the 1px border on each edge.
 */
function DialogClose({ label = 'Close', render, className, ...props }: DialogCloseProps) {
  return (
    <DialogPrimitive.Close
      render={render ?? <Button appearance="ghost" startIcon={X} aria-label={label} />}
      className={className}
      {...props}
    />
  )
}

DialogClose.displayName = 'Dialog.Close'

export interface DialogProps extends ComponentPropsWithRef<typeof DialogPrimitive.Root> {}

/**
 * The root. Nothing is re-declared, so everything Base UI puts here arrives free
 * and there is no second doc surface to drift: `open`, `defaultOpen`,
 * `onOpenChange`, `onOpenChangeComplete`, `modal`, `disablePointerDismissal`,
 * `actionsRef`, `handle`.
 *
 * `modal` defaults to `true`, which is the opposite of Popover's default and the
 * reason both exist.
 */
export function Dialog(props: DialogProps) {
  return <DialogPrimitive.Root {...props} />
}

Dialog.displayName = 'Dialog'

/**
 * The trigger. Used with `render`, so the caller's own element becomes the
 * button instead of being wrapped in a Base UI one. A Link trigger needs
 * `nativeButton={false}` alongside it, or the anchor cannot take focus and the
 * trigger quietly does nothing for a keyboard.
 */
Dialog.Trigger = DialogPrimitive.Trigger
Dialog.Popup = DialogPopup
Dialog.Title = DialogTitle
Dialog.Description = DialogDescription
Dialog.Body = DialogBody
Dialog.Close = DialogClose

/**
 * The raw Base UI parts, for the shapes the wrappers above cannot express: a
 * dialog with its own backdrop, or one whose scrim needs to sit somewhere other
 * than behind the whole viewport.
 */
Dialog.Root = DialogPrimitive.Root
Dialog.Portal = DialogPrimitive.Portal
Dialog.Backdrop = DialogPrimitive.Backdrop
Dialog.Viewport = DialogPrimitive.Viewport
Dialog.RawPopup = DialogPrimitive.Popup
