import type { CSSProperties, ComponentPropsWithRef, ReactElement } from 'react'
import { X } from 'lucide-react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { tv } from 'tailwind-variants'

import { Button } from '../Button'
import { cn } from '../../lib/cn'
import { overlayLayer } from '../../lib/layers'

/**
 * Popover — a click-triggered panel anchored to a button or a link.
 *
 * Mirrors Figma node `40004379:42395`, which draws a bare surface: one `Content`
 * slot, no variant set, no title, no close button, no arrow. So there is not a
 * single `tv()` variant here — Tooltip's situation, and everything interesting
 * is behavior.
 *
 * **Fifth Base UI component that portals**, after Tooltip, Menu, Select and
 * Combobox, and the first in the library that carries `role="dialog"`.
 *
 * **The file's own drawing cannot ship as it stands, and that shaped this
 * build.** Base UI names the dialog from `Popover.Title` via `aria-labelledby`;
 * with no Title and no `aria-label` it has no accessible name at all, which is
 * an axe `aria-dialog-name` violation — and the Figma Docs previews are exactly
 * that shape, a titleless popover holding a media block. Astryx is right that a
 * header is required and the file is the one that is behind, so `Title`,
 * `Description` and `Close` are built here ahead of it: Accordion's route.
 * `label` on the popup covers the genuinely titleless case.
 *
 * **What Figma measures.** Both Docs previews agree, so the positioning defaults
 * are read off the canvas rather than inherited: the popover's top sits **8px**
 * below its trigger's bottom and their left edges are **flush**, under both a
 * 102×32 Button and a 128×24 Link. Hence `side="bottom"`, `align="start"`,
 * `sideOffset={8}` — not Menu's 4, and not Base UI's `center`. The 8 is right
 * for a second reason the canvas cannot show: `shadow-medium` is `0 8px 16px`,
 * so a 4px gap would drop the panel's own shadow onto its trigger.
 *
 * **Left out on purpose:** `Arrow` and `Backdrop` (Figma draws neither, and Base
 * UI already catches the outside press), and `Viewport` together with
 * `Handle`/`createHandle` — one decision rather than two, because Viewport
 * exists only for a popup opened by several triggers with animated content
 * transitions, every clause of which presupposes the detached-trigger system.
 *
 * **Two Base UI traps worth knowing before you reach for them.** `modal` is a
 * no-op for focus trapping unless a `Popover.Close` is rendered inside
 * (`modal !== false && hasClosePart`) — silently, with no warning. And a Link
 * trigger needs `nativeButton={false}`, or Base UI renders an `<a>` with no
 * `href`, which cannot take focus, and the trigger quietly does nothing.
 *
 * `openOnHover` reaches the trigger through the pass-through and should stay
 * unused: Astryx puts hover previews on HoverCard and helper text on Tooltip,
 * and a `role="dialog"` opened by hover is a bad contract. Astryx also says not
 * to nest popovers; Base UI will happily let you.
 */
const popup = tv({
  base: [
    // Figma: 324 fixed, VERTICAL auto-layout. It arrives as a custom property
    // set on the Positioner so `width` can move it, and so a caller's own `w-*`
    // still beats it through tailwind-merge.
    //
    // Tailwind's box-sizing is border-box, so the 1px border sits *inside* the
    // 324 and the content column measures 298 where Figma's slot is 300. The
    // library matches the outer number — Tooltip's 32, Select's 24/32/40 — so
    // 324 is right and those 2px are the border Figma's frames do not carry.
    // Do not "fix" this to 326.
    'flex w-(--popover-width) flex-col',
    // An invention, and labelled one. Figma binds the slot's gap to spacing/0,
    // but the frame has exactly one child, so its itemSpacing was never a
    // decision anybody made — mechanism, not decision. Owed to the file.
    'gap-2',
    // p-3 = spacing/3 (12px); rounded-lg = border-radius/rounded-lg (12px);
    // border = border-width/border (1px) on Surface/Border, over Surface/
    // Background Primary, under the Elevation/Drop Shadow/Medium effect style.
    // That shadow's color is itself a semantic token, so it flips for dark mode
    // on its own and there is no `dark:` class here.
    'p-3 rounded-lg border border-surface-border bg-surface-background-primary shadow-medium',
    // 14/24 body type, so a panel's content starts from the library's base
    // rather than from whatever the page happens to set.
    'font-sans text-base text-content-primary',
    // Base UI spreads `tabIndex: -1` onto the popup unconditionally, and its
    // default initial focus lands on the popup itself whenever nothing inside is
    // tabbable — which is Figma's own drawing, a popover holding a media block.
    // The browser then paints its own ring there in the system accent color.
    // Menu's finding, on a stronger trigger: Menu's popup is only focused when
    // the menu is opened by click.
    'outline-none',
    // Figma's overflow-clip, honestly. Not ported — the twelfth time — and here
    // it would have been safe, since content sits 12px in and a focus ring
    // reaches 4px outside its control. `auto` clips to the radius just the same
    // and keeps a panel that lands near the viewport edge on screen, off the
    // room the positioner publishes. A floor, not a feature: Astryx says content
    // that needs to scroll should have been a Dialog.
    'max-h-(--available-height) overflow-y-auto',
    // Tooltip's motion, unchanged, now on its fifth popup. Base UI sets
    // --transform-origin to the point nearest the trigger, so the panel grows
    // out of whatever opened it.
    'transition-[opacity,scale] duration-fast ease-standard origin-(--transform-origin)',
    'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
    'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
    // Base UI sets data-instant when animating would be wrong — dismissal, and
    // moving between triggers in the same group.
    'data-[instant]:duration-0',
  ],
})

export interface PopoverPopupProps
  extends Omit<
    ComponentPropsWithRef<typeof PopoverPrimitive.Popup>,
    'className' | 'render' | 'aria-label'
  > {
  /**
   * Panel width in pixels. Figma draws 324 and cannot draw anything else —
   * none of its four property kinds is a number — so this is a code-only axis
   * rather than a variant waiting for the file to catch up. Astryx has the same
   * prop and uses a different value in every example.
   */
  width?: number
  /** Preferred side. Flips automatically to avoid leaving the viewport. */
  side?: 'top' | 'right' | 'bottom' | 'left' | 'inline-start' | 'inline-end'
  /** Alignment along that side. */
  align?: 'start' | 'center' | 'end'
  /** Gap between trigger and panel, in pixels. */
  sideOffset?: number
  /** Shift along the alignment axis, in pixels. */
  alignOffset?: number
  /**
   * The panel's accessible name, for a popover with no `Popover.Title`. Prefer
   * a Title — it names the dialog *and* shows the name to everybody.
   */
  label?: string
  /** Extra classes for the panel. */
  className?: string
}

/**
 * The panel, which swallows Portal and Positioner. Base UI's docs have every
 * caller nest Root → Trigger → Portal → Positioner → Popup by hand; that is
 * their surface, not this library's — Menu's move.
 *
 * `side` / `align` / `sideOffset` / `alignOffset` are behavior and go to the
 * positioner, which is what makes collision flipping work. They are deliberately
 * not `tv()` variants — Tooltip's call, held by Menu, Select and ContextMenu.
 */
function PopoverPopup({
  children,
  width = 324,
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  alignOffset = 0,
  label,
  className,
  ...props
}: PopoverPopupProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        className={overlayLayer}
        /*
         * The width goes here rather than on the popup for two reasons that
         * agree: a custom property inherits, so `w-(--popover-width)` still
         * resolves one level down; and putting it here leaves the popup's own
         * `style` prop free for the caller instead of something to merge with.
         */
        style={{ '--popover-width': `${width}px` } as CSSProperties}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <PopoverPrimitive.Popup
          className={cn(popup(), className)}
          /*
           * Spread only when it is a string, never as `undefined`: forwarding an
           * `aria-*` prop as undefined deletes what Base UI computed, which here
           * would wipe the `aria-labelledby` a `Popover.Title` had supplied.
           * ContextMenu's guard, in ContextMenu's spelling.
           */
          {...(label != null && { 'aria-label': label })}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

PopoverPopup.displayName = 'Popover.Popup'

/**
 * Which heading the panel's title sits in. A popover title belongs in the page
 * outline, but only the page knows at what depth — and getting it wrong is an
 * axe `heading-order` failure rather than a matter of taste. ContentBlock's
 * prop, for ContentBlock's reason.
 */
export type PopoverHeadingLevel = 2 | 3 | 4 | 5 | 6

/**
 * An explicit map rather than a computed tag, because `` `h${level}` `` widens
 * to `string`, which is not a JSX tag. ContentBlock keeps the same map.
 * Level 2 is Base UI's own default element, so the default changes nothing.
 */
const HEADINGS: Record<PopoverHeadingLevel, ReactElement> = {
  2: <h2 />,
  3: <h3 />,
  4: <h4 />,
  5: <h5 />,
  6: <h6 />,
}

export interface PopoverTitleProps
  extends Omit<ComponentPropsWithRef<typeof PopoverPrimitive.Title>, 'className' | 'render'> {
  /** Which heading element to render. */
  headingLevel?: PopoverHeadingLevel
  /** Extra classes for the title. */
  className?: string
}

/**
 * The panel's title, and the thing that names the dialog: Base UI points
 * `aria-labelledby` at it. Built ahead of Figma, which draws no title at all.
 */
function PopoverTitle({ headingLevel = 2, className, ...props }: PopoverTitleProps) {
  return (
    <PopoverPrimitive.Title
      render={HEADINGS[headingLevel]}
      // ContentBlock's title, verbatim. min-w-0 so a long word can break rather
      // than force the flex row that usually holds this wider than the panel.
      className={cn('min-w-0 font-semibold [word-break:break-word]', className)}
      {...props}
    />
  )
}

PopoverTitle.displayName = 'Popover.Title'

export interface PopoverDescriptionProps
  extends Omit<
    ComponentPropsWithRef<typeof PopoverPrimitive.Description>,
    'className' | 'render'
  > {
  /** Extra classes for the description. */
  className?: string
}

/**
 * The body paragraph, which Base UI points `aria-describedby` at. Astryx's
 * "subheader".
 *
 * Banner's pairing rather than Menu's: the size is held at the panel's 14/24 and
 * only the color changes, because this is the popover's body text and not a
 * sub-label under a row. Hierarchy comes from `font-semibold` on the title above
 * it.
 */
function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <PopoverPrimitive.Description
      className={cn('text-content-subtle', className)}
      {...props}
    />
  )
}

PopoverDescription.displayName = 'Popover.Description'

export interface PopoverCloseProps
  extends Omit<ComponentPropsWithRef<typeof PopoverPrimitive.Close>, 'className'> {
  /** Accessible name for the default icon button. Ignored when `render` is given. */
  label?: string
  /** Extra classes for the button. */
  className?: string
}

/**
 * The dismiss button. Astryx uses Close in two visually unrelated forms — the
 * `×` in a header and a "Cancel" beside a confirm action — so rather than a
 * variant deciding which, the default *is* the `×` and `render` replaces it
 * outright:
 *
 * ```tsx
 * <Popover.Close />                                             // the ×
 * <Popover.Close render={<Button appearance="secondary">Cancel</Button>} />
 * ```
 *
 * The `×` is Banner's and Toast's dismiss button at `ghost` rather than
 * `overlay`, because a popover's surface is Surface/Background Primary and not
 * an emphasized one — and at the default size, per the library's rule that a
 * smaller one needs a measured constraint rather than an assumed tight fit.
 */
function PopoverClose({ label = 'Close', render, className, ...props }: PopoverCloseProps) {
  return (
    <PopoverPrimitive.Close
      render={render ?? <Button appearance="ghost" startIcon={X} aria-label={label} />}
      className={className}
      {...props}
    />
  )
}

PopoverClose.displayName = 'Popover.Close'

export interface PopoverProps extends ComponentPropsWithRef<typeof PopoverPrimitive.Root> {}

/**
 * The root. Nothing is re-declared, so everything Base UI puts here arrives
 * free and there is no second doc surface to drift: `open`, `defaultOpen`,
 * `onOpenChange`, `onOpenChangeComplete`, `modal`, `actionsRef`.
 */
export function Popover(props: PopoverProps) {
  return <PopoverPrimitive.Root {...props} />
}

Popover.displayName = 'Popover'

/**
 * The trigger. Used with `render`, so the caller's own element becomes the
 * button instead of being wrapped in a Base UI one — Button and Link both work
 * unchanged. A Link needs `nativeButton={false}` alongside it.
 */
Popover.Trigger = PopoverPrimitive.Trigger
Popover.Popup = PopoverPopup
Popover.Title = PopoverTitle
Popover.Description = PopoverDescription
Popover.Close = PopoverClose

/**
 * The raw Base UI parts, for the shapes the wrappers above cannot express: a
 * panel positioned against something other than its trigger, or one held open
 * for a screenshot.
 */
Popover.Root = PopoverPrimitive.Root
Popover.Portal = PopoverPrimitive.Portal
Popover.Positioner = PopoverPrimitive.Positioner
Popover.RawPopup = PopoverPrimitive.Popup
