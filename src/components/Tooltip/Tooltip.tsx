import { useId, useState } from 'react'
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { overlayLayer } from '../../lib/layers'

/**
 * Tooltip — a short label describing the thing you are pointing at.
 *
 * Mirrors Figma node `40004073:20833`. That component has no variant set at all
 * — one look, no sizes, no colours, no arrow — so there is nothing here to model
 * as `tv()` variants. Everything interesting is behaviour.
 *
 * Third Base UI component in the library after Divider and Avatar, and the first
 * that portals. Base UI supplies the whole popup lifecycle: hover and focus
 * delays, `role="tooltip"`, `aria-describedby` on the trigger, Escape to close,
 * collision detection, and holding the element in the DOM until the closing
 * transition finishes. All the styling is ours.
 *
 * The common case is one prop:
 *
 *     <Tooltip label="Copy link">
 *       <Button startIcon={Link} aria-label="Copy link" />
 *     </Tooltip>
 *
 * `children` becomes the trigger via Base UI's `render`, so the caller's own
 * element is used rather than being wrapped in a Base UI `<button>`. Button,
 * Avatar and Badge all take a ref and spread their props, so they work as
 * triggers unchanged.
 *
 * **A tooltip describes; it is not a name.** It lands on `aria-describedby`, so
 * an icon-only Button still needs its own `aria-label` — which `ButtonProps`
 * already requires at compile time. A tooltip is not a substitute for one.
 *
 * **The one thing Base UI does not do for us.** Its Tooltip wires up hovering,
 * dismissal and positioning, but as of `@base-ui/react` 1.7.0 the popup carries
 * no `role="tooltip"` and the trigger gets no `aria-describedby` — `TooltipRoot`
 * only installs `useDismiss` and `useClientPoint`, and there is no `useRole`
 * anywhere in the package. Measured in the browser, not assumed. So the role
 * is set on the popup here, and the trigger is pointed at it by id while it is
 * open. Check whether this is still needed when Base UI is upgraded: if they add
 * it, this would produce a duplicate id reference.
 *
 * **`side` and `align` are not Figma variants** and deliberately are not `tv()`
 * variants either. They are behaviour: they go to Base UI's positioner, which is
 * also what flips the popup to the other side when it would leave the viewport.
 *
 * **Wrapping trap:** Figma's text layer is `white-space: nowrap` because it is
 * auto-width on the canvas, but the frame also carries `max-w-96` (384px) and
 * `word-break: break-word`. Those only mean anything if the text is allowed to
 * wrap, and a tooltip that refuses to wrap runs off the screen. So this wraps.
 *
 * **Height trap:** the popup is 32px in Figma, and the 2px that get it there
 * come from an inner Span frame with 1px of vertical padding. Flattening that
 * into one box gives 30px, and no round `py-*` utility splits the difference
 * without hardcoding a value. The inner span is kept, exactly as Figma draws it:
 * 24 (line-height) + 2×1 (span) + 2×2 (popup) + 2×1 (border) = 32.
 */
const tooltip = tv({
  base: [
    // Surface. shadow-low is Figma's Elevation/Drop Shadow/Low; its colour is a
    // semantic token, so it flips for dark mode on its own.
    'max-w-96 rounded-md border border-surface-border bg-surface-card-primary shadow-low',
    // Box: px-3 = spacing/3 (12px), py-0.5 = spacing/0-5 (2px).
    'flex items-center justify-center px-3 py-0.5',
    // Type: Figma's text-base/normal, 14px on a 24px line.
    'font-sans text-base font-normal text-content-primary [word-break:break-word]',
    // Motion, on the tokens added with this component. Base UI sets
    // --transform-origin to the point nearest the trigger, so the popup grows
    // out of whatever it is describing rather than out of its own middle.
    'transition-[opacity,scale] duration-fast ease-standard origin-(--transform-origin)',
    'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
    'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
    // Base UI sets data-instant when a transition would be wrong: opening from
    // keyboard focus, dismissing, and the second tooltip in a Provider group,
    // which is meant to appear immediately rather than animate again.
    'data-[instant]:duration-0',
  ],
})

export interface TooltipPopupProps
  extends ComponentPropsWithRef<typeof TooltipPrimitive.Popup> {}

/**
 * The styled popup. Exposed as `Tooltip.Popup` so a hand-assembled tooltip built
 * from the raw parts still looks like every other one — and so it carries
 * `role="tooltip"`, which Base UI does not add. Assembling a tooltip from the raw
 * parts still leaves you to point the trigger at it with `aria-describedby`; the
 * `label` API does that for you.
 */
function TooltipPopup({ children, className, ...props }: TooltipPopupProps) {
  return (
    <TooltipPrimitive.Popup role="tooltip" className={cn(tooltip(), className)} {...props}>
      {/* Figma's inner Span frame — the 2px that make the popup 32px tall. */}
      <span className="flex items-center justify-center py-px">{children}</span>
    </TooltipPrimitive.Popup>
  )
}

TooltipPopup.displayName = 'Tooltip.Popup'

export interface TooltipProps {
  /** The tooltip text. Maps to the Figma label. */
  label: ReactNode
  /** The element being described. Becomes the trigger. */
  children: ReactElement
  /** Preferred side. Flips automatically to avoid leaving the viewport. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment along that side. */
  align?: 'start' | 'center' | 'end'
  /** Gap between trigger and popup, in pixels. */
  sideOffset?: number
  /** How long to hover before it opens, in milliseconds. */
  delay?: number
  /** How long to wait before closing, in milliseconds. */
  closeDelay?: number
  /** Turns the tooltip off without unmounting the trigger. */
  disabled?: boolean
  /** Extra classes for the popup. */
  className?: string
}

export function Tooltip({
  label,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  delay,
  closeDelay,
  disabled,
  className,
}: TooltipProps) {
  const popupId = useId()
  // Watching the open state rather than owning it: Root stays uncontrolled, and
  // this only decides whether the trigger currently points at a popup. Pointing
  // at one that is not in the DOM would leave a dangling reference.
  const [open, setOpen] = useState(false)

  return (
    <TooltipPrimitive.Root disabled={disabled} onOpenChange={setOpen}>
      <TooltipPrimitive.Trigger
        render={children}
        delay={delay}
        closeDelay={closeDelay}
        aria-describedby={open ? popupId : undefined}
      />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          className={overlayLayer}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <TooltipPopup id={popupId} className={className}>
            {label}
          </TooltipPopup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

/**
 * Shared hover delay across a group of tooltips. Once one has opened, its
 * neighbours open instantly until the group goes quiet — which is what makes a
 * toolbar of icon buttons feel like one surface rather than a row of separate
 * waits. Base UI's `Tooltip.Provider`, unstyled and passed straight through.
 */
Tooltip.Provider = TooltipPrimitive.Provider

/**
 * The raw Base UI parts, for the two things the `label` API cannot express: a
 * controlled tooltip (`<Tooltip.Root open onOpenChange>`), and one anchored to
 * something other than its own child.
 */
Tooltip.Root = TooltipPrimitive.Root
Tooltip.Trigger = TooltipPrimitive.Trigger
Tooltip.Portal = TooltipPrimitive.Portal
Tooltip.Positioner = TooltipPrimitive.Positioner
Tooltip.Popup = TooltipPopup

Tooltip.displayName = 'Tooltip'
