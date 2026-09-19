import { useContext, useMemo } from 'react'
import type { CSSProperties, ComponentPropsWithRef, ReactElement, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'

import { cn } from '../../lib/cn'
import { overlayLayer } from '../../lib/layers'
import { usePhone } from '../../lib/viewport'
import { Button } from '../Button'
import { BlockHeader } from '../ContentBlock/BlockHeader'
import { title } from '../ContentBlock/styles'
import { DrawerContext, type DrawerContextValue } from './context'
import {
  drawerBackdrop,
  drawerBody,
  drawerContent,
  drawerPopup,
  drawerViewport,
  type DrawerSide,
} from './styles'

/**
 * Drawer — a surface that slides in from an edge of the screen, over the page.
 *
 * **No Figma node yet; the code goes first.** The `↪ Panel (In Progress)` page
 * draws the in-flow `Panel` and nothing for this, so the shape here is Base
 * UI's `Drawer` under Dialog's wrapper, and the file owes a page. Composed the
 * way Dialog is:
 *
 *     <Drawer>
 *       <Drawer.Trigger render={<Button>Filters</Button>} />
 *       <Drawer.Popup>
 *         <Drawer.Header>Filters</Drawer.Header>
 *         <Drawer.Body>…</Drawer.Body>
 *       </Drawer.Popup>
 *     </Drawer>
 *
 * **It overlays; `Panel` pushes.** A drawer is a modal moment — the page waits
 * behind a scrim until it is dismissed — where a panel is a second place to
 * work beside the first. Base UI's own guideline draws the line the other
 * way round too: "a panel that slides in from the edge of the screen and
 * doesn't need gesture support is a positioned Dialog". This one has the
 * gestures: swipe toward its edge to dismiss, and the scrim thins as you go.
 *
 * **Base UI's `Drawer`, the seventh Base UI component that portals.** It is
 * Dialog with gestures — Base UI's `drawer` subpath has its own `Root`,
 * `Popup`, `Viewport` and `Backdrop`, so nothing is re-attached from Dialog
 * here; what is shared is the *recipe* for the scrim and the *shape* of the
 * wrapper. `Drawer.Popup` swallows Portal, Backdrop, Viewport and Content,
 * Dialog's move.
 *
 * **Three sides, and the phone takes one of them away.** `right` is the
 * default and matches `Panel`; `left` mirrors it; `bottom` is the sheet the
 * primitive was built for. Below 768 a side drawer *becomes* a bottom sheet —
 * a 384-wide column on a 393-wide phone is a bottom sheet with a worse
 * gesture. `swipeDirection` is a prop, not a class, so this is the library's
 * one `matchMedia` reader (`usePhone`), and it is allowed here for a reason
 * `ResponsiveNav`'s record spells out: a closed drawer paints nothing, so
 * there is no first paint to get wrong.
 *
 * **Flush to the edge, rounded on the inner corners.** The shell's docked
 * rule — a thing hard against the window edge squares the edge it touches —
 * and the MobileNav sheet's shape, on three sides.
 */

export interface DrawerProps extends Omit<
  ComponentPropsWithRef<typeof DrawerPrimitive.Root>,
  'swipeDirection'
> {
  /**
   * The edge the drawer comes from, and swipes back to. `right` by default,
   * `Panel`'s side. Below 768 `right` and `left` become `bottom`.
   */
  side?: DrawerSide
}

/**
 * Which way a swipe dismisses, per side. Base UI's words for it are the
 * direction of travel, so a bottom sheet swipes `down`.
 */
const SWIPE: Record<DrawerSide, 'right' | 'left' | 'down'> = {
  right: 'right',
  left: 'left',
  bottom: 'down',
}

/**
 * The root. Everything Base UI puts here arrives free — `open`, `defaultOpen`,
 * `onOpenChange`, `onOpenChangeComplete`, `modal`, `disablePointerDismissal`,
 * `snapPoints`, `actionsRef`, `handle` — except `swipeDirection`, which is
 * `side`'s to set. The phone rule is applied here, once, and the popup reads
 * the result through context so the classes and the gesture cannot disagree.
 */
export function Drawer({ side = 'right', modal = true, children, ...props }: DrawerProps) {
  const phone = usePhone()
  const effective: DrawerSide = phone && side !== 'bottom' ? 'bottom' : side
  const ctx = useMemo<DrawerContextValue>(
    () => ({ side: effective, modal: modal !== false }),
    [effective, modal],
  )

  return (
    <DrawerPrimitive.Root swipeDirection={SWIPE[effective]} modal={modal} {...props}>
      {typeof children === 'function'
        ? // Base UI's payload form: a detached trigger's payload arrives as an
          // argument, and the provider has to wrap what the function returns.
          (arg) => <DrawerContext.Provider value={ctx}>{children(arg)}</DrawerContext.Provider>
        : <DrawerContext.Provider value={ctx}>{children}</DrawerContext.Provider>}
    </DrawerPrimitive.Root>
  )
}

Drawer.displayName = 'Drawer'

export interface DrawerPopupProps extends Omit<
  ComponentPropsWithRef<typeof DrawerPrimitive.Popup>,
  'className' | 'render' | 'aria-label'
> {
  /**
   * The drawer's width in pixels, for `right` and `left`. Figma's `Panel` is
   * 384 and this matches it; a bottom sheet is the viewport's width.
   */
  width?: number
  /**
   * The drawer's accessible name, for a drawer with no `Drawer.Title`. Prefer a
   * Title — it names the drawer *and* shows the name to everybody.
   */
  label?: string
  /** Extra classes for the surface. */
  className?: string
}

/**
 * The surface, which swallows Portal, Backdrop, Viewport and Content.
 *
 * The Backdrop is only drawn when the drawer is modal — a non-modal drawer
 * has nothing to block — and both the Backdrop and the Viewport carry
 * `overlayLayer`, for Dialog's reason: they are `fixed` siblings with no
 * Positioner to put the z-index on. `Drawer.Content` is always inside the
 * popup, because Base UI uses it to let text be selected with a mouse without
 * starting a swipe.
 */
function DrawerPopup({ children, width = 384, label, className, ...props }: DrawerPopupProps) {
  const { side, modal } = useContext(DrawerContext)

  return (
    <DrawerPrimitive.Portal>
      {modal && <DrawerPrimitive.Backdrop className={cn(drawerBackdrop(), overlayLayer)} />}
      <DrawerPrimitive.Viewport
        className={cn(drawerViewport({ side, modal }), overlayLayer)}
        // On the viewport rather than the popup, Dialog's two reasons: it
        // inherits, and Base UI writes its own variables onto the popup's style.
        style={{ '--drawer-width': `${width}px` } as CSSProperties}
      >
        <DrawerPrimitive.Popup
          className={cn(drawerPopup({ side, modal }), className)}
          // Spread only when it is a string: an `aria-*` prop forwarded as
          // undefined deletes what Base UI computed. Popover's guard.
          {...(label != null && { 'aria-label': label })}
          {...props}
        >
          <DrawerPrimitive.Content className={drawerContent()}>{children}</DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

DrawerPopup.displayName = 'Drawer.Popup'

/** Which heading the title sits in. Dialog's prop, for Dialog's reason. */
export type DrawerHeadingLevel = 2 | 3 | 4 | 5 | 6

/** Dialog's map: elements, because Base UI's Title takes `render`. */
const HEADINGS: Record<DrawerHeadingLevel, ReactElement> = {
  2: <h2 />,
  3: <h3 />,
  4: <h4 />,
  5: <h5 />,
  6: <h6 />,
}

export interface DrawerTitleProps extends Omit<
  ComponentPropsWithRef<typeof DrawerPrimitive.Title>,
  'className' | 'render'
> {
  /** Which heading element to render. */
  headingLevel?: DrawerHeadingLevel
  /** Extra classes for the title. */
  className?: string
}

/**
 * The title, and the thing that names the drawer: Base UI points
 * `aria-labelledby` at it. `Drawer.Header` renders one; use this directly for
 * a header of your own shape.
 */
function DrawerTitle({ headingLevel = 2, className, ...props }: DrawerTitleProps) {
  return (
    <DrawerPrimitive.Title
      render={HEADINGS[headingLevel]}
      className={cn(title(), className)}
      {...props}
    />
  )
}

DrawerTitle.displayName = 'Drawer.Title'

export interface DrawerDescriptionProps extends Omit<
  ComponentPropsWithRef<typeof DrawerPrimitive.Description>,
  'className' | 'render'
> {
  /** Extra classes for the description. */
  className?: string
}

/** The body paragraph, which Base UI points `aria-describedby` at. Dialog's. */
function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return <DrawerPrimitive.Description className={cn('text-content-subtle', className)} {...props} />
}

DrawerDescription.displayName = 'Drawer.Description'

export interface DrawerHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The title. Keep it short — "Filters", not a sentence. */
  children: ReactNode
  /** A 16px icon before the title. Pass the component: `icon={Filter}`. */
  icon?: LucideIcon
  /** After the title, left-aligned with it — a Badge, usually. ContentBlock's slot. */
  titleSlot?: ReactNode
  /** Controls for the drawer, pushed to the right edge. Default-size ghost Buttons fit. */
  actions?: ReactNode
  /**
   * The ghost × after the actions. On by default; `false` removes it — put
   * a `Drawer.Close` somewhere else, or let the scrim and Escape do it.
   */
  closeButton?: boolean
  /** Which heading the title sits in. */
  headingLevel?: DrawerHeadingLevel
}

/**
 * The title row: ContentBlock's header, with a × on the end, and the title
 * is a `Drawer.Title` so the popup is named by it. Same recipe as `Panel`'s,
 * so a drawer and a panel holding the same thing look the same.
 */
function DrawerHeader({
  children,
  icon,
  titleSlot,
  actions,
  closeButton = true,
  headingLevel = 2,
  ...props
}: DrawerHeaderProps) {
  return (
    <BlockHeader
      icon={icon}
      heading={<DrawerTitle headingLevel={headingLevel}>{children}</DrawerTitle>}
      titleSlot={titleSlot}
      actions={actions}
      end={closeButton ? <DrawerClose /> : null}
      {...props}
    />
  )
}

DrawerHeader.displayName = 'Drawer.Header'

export interface DrawerBodyProps extends ComponentPropsWithRef<'div'> {
  /** Extra classes for the scrolling region. */
  className?: string
}

/**
 * The scrolling middle. The header stays put and this moves under it —
 * Dialog's Body, with ContentBlock's 16px. A side drawer is as tall as the
 * viewport, so it is always wanted there; a short bottom sheet can leave it out.
 */
function DrawerBody({ className, ...props }: DrawerBodyProps) {
  return <div className={cn(drawerBody(), className)} {...props} />
}

DrawerBody.displayName = 'Drawer.Body'

export interface DrawerCloseProps extends Omit<
  ComponentPropsWithRef<typeof DrawerPrimitive.Close>,
  'className'
> {
  /** Accessible name for the default icon button. Ignored when `render` is given. */
  label?: string
  /** Extra classes for the button. */
  className?: string
}

/**
 * The dismiss button. Dialog's part: the default *is* the × and `render`
 * replaces it outright — `<Drawer.Close render={<Button>Done</Button>} />`.
 */
function DrawerClose({ label = 'Close', render, className, ...props }: DrawerCloseProps) {
  return (
    <DrawerPrimitive.Close
      render={render ?? <Button appearance="ghost" startIcon={X} aria-label={label} />}
      className={className}
      {...props}
    />
  )
}

DrawerClose.displayName = 'Drawer.Close'

/**
 * The trigger. Used with `render`, so the caller's own element becomes the
 * button. A Link trigger needs `nativeButton={false}` alongside it — Dialog's
 * note.
 */
Drawer.Trigger = DrawerPrimitive.Trigger
Drawer.Popup = DrawerPopup
Drawer.Header = DrawerHeader
Drawer.Title = DrawerTitle
Drawer.Description = DrawerDescription
Drawer.Body = DrawerBody
Drawer.Close = DrawerClose

/**
 * The raw parts, for shapes the wrappers cannot express — Dialog's escape
 * hatch. `Drawer.Popup` above is the styled surface; `RawPopup` is Base UI's.
 * A `RawPopup` outside a `Viewport` loses swipe handling, and Base UI only
 * warns about it.
 */
Drawer.Root = DrawerPrimitive.Root
Drawer.Portal = DrawerPrimitive.Portal
Drawer.Backdrop = DrawerPrimitive.Backdrop
Drawer.Viewport = DrawerPrimitive.Viewport
Drawer.RawPopup = DrawerPrimitive.Popup
Drawer.Content = DrawerPrimitive.Content
Drawer.createHandle = DrawerPrimitive.createHandle
