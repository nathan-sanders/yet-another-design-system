import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type {
  CSSProperties,
  ComponentPropsWithRef,
  KeyboardEvent,
  ReactNode,
  RefObject,
} from 'react'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import { useRender } from '@base-ui/react/use-render'

import { cn } from '../../lib/cn'
import { usePresence } from '../../lib/presence'
import { AppShellContext } from '../AppShell/context'
import { Button } from '../Button'
import { BlockHeader } from '../ContentBlock/BlockHeader'
import { HEADING, title } from '../ContentBlock/styles'
import { ResizeHandle } from '../Resize'
import { PanelContext, type PanelContextValue } from './context'
import { panel, panelBody, panelCard, panelClip, type PanelSide } from './styles'

/**
 * Panel — a region beside the page that pushes the page over to make room.
 *
 * Mirrors the frames on the Figma page `↪ Panel (In Progress)`
 * (`40004748:43534`): a 384-wide `Surface/Background Primary` card on the far
 * side of the Page, 8px from it, drawn in both the floating and the contained
 * shell. Composed, like the rest of the shell:
 *
 *     <AppShell>
 *       <SideNav aria-label="Main">…</SideNav>
 *       <AppShell.Page>…</AppShell.Page>
 *       <Panel aria-label="Details" open={open} onOpenChange={setOpen} resizable>
 *         <Panel.Header>Details</Panel.Header>
 *         <Panel.Body>…</Panel.Body>
 *       </Panel>
 *     </AppShell>
 *
 * **It pushes; `Drawer` overlays.** That is the whole difference, and it is a
 * difference in what the user is doing. A drawer is a modal moment — the page
 * waits — and Base UI has a primitive for it. A panel is a second place to
 * work that sits beside the first, and the user moves between them: a
 * details pane, a chat, an inspector. So it is an in-flow `<aside>`, a
 * `complementary` landmark a screen reader lists next to the `<main>`, with
 * no focus trap, no scrim, nothing inert. Focus moves into it when it opens
 * — that is what opening it *for* — and comes back out when it closes;
 * Escape closes it from inside, and only from inside.
 *
 * **Not a Base UI component, and that was checked.** `Collapsible` renders a
 * Root that stays in the row when the panel is closed, an empty flex item the
 * shell's 8px gap still counts. A non-modal `Dialog` portalled back into the
 * row is `role="dialog"` machinery — `aria-modal`, nested-dialog counters,
 * outside-press tracking — bolted onto a landmark. What a panel needs from a
 * primitive is mount-with-an-entrance and unmount-after-an-exit, and that is
 * `usePresence` in `lib/`, in Base UI's own `data-starting-style` /
 * `data-ending-style` vocabulary. Closed, the panel renders nothing at all.
 *
 * **The slide is the width.** An in-flow box cannot translate in from the
 * edge; what it can do is grow from 0 to 384 while the page eases over, which
 * is what "pushes the content" looks like. The card inside is held at the full
 * width the whole time so its contents never reflow — see `styles.ts` for the
 * three boxes. On a phone the same slide happens on the other axis.
 *
 * **Below 768 it is under the page, not beside it.** There is no room for two
 * columns on a phone, so the shell turns into a column (`data-panel` is the
 * marker; the rule is the shell's, like `MobileNav`'s), the panel takes the
 * full width and a height instead, and the resize handle turns horizontal so
 * the user drags the page/panel split. Two handles are rendered and one is
 * `display: none` — the same CSS-only swap `ResponsiveNav` uses, because a
 * panel paints on first load and a `matchMedia` hook would flash. A
 * `navigation="top"` shell is a column at every width, so there the same
 * arrangement holds on a desktop too — read off the shell's context, not the
 * breakpoint.
 *
 * **Resizable from the seam, the rail's way.** `resizable` draws a
 * `ResizeHandle` that is exactly the shell's 8px gap, on the panel's *near*
 * edge — so it is `sized="after"`, the handle's new axis: ArrowLeft grows a
 * right-hand panel, because the arrow moves the separator.
 *
 * **ContentBlock's default surface, with its `floating` axis.** A panel is a
 * region, not a bento cell, so `subtle` and `accent` do not come along; the
 * shadow does, and its default is the shell's, the way the nav's is: lifted
 * in a floating framed shell, flush in a contained or docked one, flat on
 * its own.
 */

export type PanelHeadingLevel = 2 | 3 | 4 | 5 | 6

/** Figma's card. */
export const PANEL_WIDTH = 384
export const PANEL_MIN_WIDTH = 320
export const PANEL_MAX_WIDTH = 640
/** The phone split: how tall the panel is under the page. */
export const PANEL_HEIGHT = 320
export const PANEL_MIN_HEIGHT = 160
/** Leaves an 852 phone about 200px of page above the bar. */
export const PANEL_MAX_HEIGHT = 560

export interface PanelProps extends Omit<
  ComponentPropsWithRef<'aside'>,
  'children' | 'className' | 'aria-label'
> {
  /** A `Panel.Header` and a `Panel.Body`, or any content. */
  children: ReactNode
  /**
   * What the panel is, as its accessible name: "Details", "Chat". Required —
   * it names the landmark, and the resize handle ("Resize Details").
   */
  'aria-label': string
  /** Whether the panel is open. Controlled; pair with `onOpenChange`. */
  open?: boolean
  /** Whether the panel starts open. Uncontrolled. */
  defaultOpen?: boolean
  /** Called when the panel asks to close — Escape, or its own × — or is opened. */
  onOpenChange?: (open: boolean) => void
  /**
   * The edge it enters from, and the edge the handle sits on. `right` is the
   * default and the Figma frame. The caller puts the panel where it goes in
   * the DOM — after the Page for `right`, before it for `left` — because DOM
   * order is layout order, and tab order.
   */
  side?: PanelSide
  /** Draw the handle on the seam, so the user can drag the panel wider. */
  resizable?: boolean
  /** The width in pixels. Controlled; pair with `onWidthChange`. */
  width?: number
  /** The starting width. Uncontrolled. Figma's 384. */
  defaultWidth?: number
  /** Every step of a drag, so persist on your own schedule. */
  onWidthChange?: (width: number) => void
  minWidth?: number
  maxWidth?: number
  /** Below 768, the height in pixels. Controlled; pair with `onHeightChange`. */
  height?: number
  /** Below 768, the starting height. Uncontrolled. */
  defaultHeight?: number
  onHeightChange?: (height: number) => void
  minHeight?: number
  maxHeight?: number
  /**
   * The heading `Panel.Header` renders. Default 2: a panel is a section of the
   * page, one step under its `<h1>`.
   */
  headingLevel?: PanelHeadingLevel
  /**
   * Lift the card off the canvas with the low drop shadow — ContentBlock's
   * `Floating`. Defaults to the shell's mode: lifted in a floating framed
   * shell, flush otherwise.
   */
  floating?: boolean
  /**
   * What to focus when the panel opens, instead of the panel itself. A field,
   * usually. Dialog's prop.
   */
  initialFocus?: RefObject<HTMLElement | null>
  /**
   * Where focus goes when the panel closes, when the thing that opened it is
   * gone — a Menu item, say. Otherwise focus returns to the opener.
   */
  finalFocus?: RefObject<HTMLElement | null>
  className?: string
}

export function Panel({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = 'right',
  resizable = false,
  width: widthProp,
  defaultWidth = PANEL_WIDTH,
  onWidthChange,
  minWidth = PANEL_MIN_WIDTH,
  maxWidth = PANEL_MAX_WIDTH,
  height: heightProp,
  defaultHeight = PANEL_HEIGHT,
  onHeightChange,
  minHeight = PANEL_MIN_HEIGHT,
  maxHeight = PANEL_MAX_HEIGHT,
  headingLevel = 2,
  floating: floatingProp,
  initialFocus,
  finalFocus,
  className,
  onKeyDown,
  ...props
}: PanelProps) {
  const label = props['aria-label']
  const shell = useContext(AppShellContext)
  const framed = shell?.frame === true
  const docked = shell ? !shell.frame : false
  // A column shell has no "beside": the panel stacks under the page at every width.
  const stacked = shell?.navigation === 'top'
  // The nav's rule: the shell states the fact once, an explicit prop wins.
  const floating = floatingProp ?? (shell ? shell.mode === 'floating' && shell.frame : false)

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  const clampWidth = (next: number) => Math.max(minWidth, Math.min(maxWidth, next))
  const [uncontrolledWidth, setUncontrolledWidth] = useState(defaultWidth)
  const width = clampWidth(widthProp ?? uncontrolledWidth)
  const setWidth = (next: number) => {
    if (widthProp === undefined) setUncontrolledWidth(next)
    onWidthChange?.(next)
  }

  const clampHeight = (next: number) => Math.max(minHeight, Math.min(maxHeight, next))
  const [uncontrolledHeight, setUncontrolledHeight] = useState(defaultHeight)
  const height = clampHeight(heightProp ?? uncontrolledHeight)
  const setHeight = (next: number) => {
    if (heightProp === undefined) setUncontrolledHeight(next)
    onHeightChange?.(next)
  }

  // A pointer drag is in flight: the size transition is off for its length.
  const [resizing, setResizing] = useState(false)

  const asideRef = useRef<HTMLElement>(null)
  const { mounted, status } = usePresence(open, asideRef)

  /*
    Focus in when the panel opens — but not when it starts open. A panel that
    is already there when the page loads was not opened by anybody, and
    stealing focus from the page on load is the mistake `defaultOpen` invites.
    Popover's rule. The element that had focus is remembered so the close can
    hand it back.
  */
  const openerRef = useRef<Element | null>(null)
  const wasMountedRef = useRef(mounted)
  useEffect(() => {
    const wasMounted = wasMountedRef.current
    wasMountedRef.current = mounted
    if (!mounted || wasMounted) return
    openerRef.current = document.activeElement
    const target = initialFocus?.current ?? asideRef.current
    target?.focus({ preventScroll: true })
  }, [mounted, initialFocus])

  /*
    Focus out as the panel starts to leave, while it is still in the DOM —
    only if focus is inside it, so closing a panel the user was not in moves
    nothing. Back to the opener when it still exists; a Menu item that opened
    the panel is unmounted by now, which is what `finalFocus` is for.
  */
  useEffect(() => {
    if (status !== 'ending') return
    const aside = asideRef.current
    if (!aside || !aside.contains(document.activeElement)) return
    const opener = openerRef.current
    const target =
      finalFocus?.current ?? (opener instanceof HTMLElement && opener.isConnected ? opener : null)
    target?.focus({ preventScroll: true })
  }, [status, finalFocus])

  const close = useCallback(() => {
    if (openProp === undefined) setUncontrolledOpen(false)
    onOpenChange?.(false)
  }, [openProp, onOpenChange])
  const ctx = useMemo<PanelContextValue>(() => ({ headingLevel, close }), [headingLevel, close])

  if (!mounted) return null

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event)
    // A Menu or Popover inside has already stopped its own Escape; a Combobox
    // prevents default on the one that clears its input. Both leave this alone.
    if (event.key !== 'Escape' || event.defaultPrevented) return
    event.preventDefault()
    setOpen(false)
  }

  const right = side === 'right'
  const handleLabel = `Resize ${label}`

  return (
    <aside
      ref={asideRef}
      className={cn(panel({ side, framed, resizing, stacked }), className)}
      style={
        {
          '--panel-width': `${width}px`,
          '--panel-height': `${height}px`,
        } as CSSProperties
      }
      // Focusable by script, not by Tab: the landmark takes focus on open so a
      // screen reader announces it, and nothing else. Dialog's spelling.
      tabIndex={-1}
      // The marker an `AppShell` turns into a column for below 768. Only a
      // marker: the breakpoint and the rule are the shell's.
      data-panel=""
      data-starting-style={status === 'starting' ? '' : undefined}
      data-ending-style={status === 'ending' ? '' : undefined}
      // On for the whole of either transition: the clip box reads it.
      data-transitioning={status !== 'open' ? '' : undefined}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div className={panelClip({ side, stacked })}>
        <div className={panelCard({ floating, docked, stacked })}>
          <PanelContext.Provider value={ctx}>{children}</PanelContext.Provider>
        </div>
      </div>

      {resizable && (
        <>
          {/*
            The desktop handle, on the near edge: the shell's 8px gap when
            there is one, straddling the seam when docked. SideNav's two lines,
            mirrored. `sized="after"` because the panel is on the far side of
            the handle — the arrow moves the separator, the value follows.
          */}
          <ResizeHandle
            label={handleLabel}
            orientation="vertical"
            sized={right ? 'after' : 'before'}
            value={width}
            min={minWidth}
            max={maxWidth}
            step={8}
            largeStep={40}
            valueText={(value) => `${value} pixels`}
            onResize={(next) => setWidth(clampWidth(next))}
            onResizeStart={() => setResizing(true)}
            onResizeEnd={() => setResizing(false)}
            className={cn(
              'absolute inset-y-0 z-10 w-2',
              stacked ? 'hidden' : 'max-md:hidden',
              right
                ? ['left-0', framed ? '-translate-x-full' : '-translate-x-1/2']
                : ['right-0', framed ? 'translate-x-full' : 'translate-x-1/2'],
            )}
          />
          {/*
            The phone handle, on the seam between the page and the panel —
            above a right panel, which sits under the page, below a left one.
            Hidden above 768; the two are never in the accessibility tree at
            once, so one label serves both.
          */}
          <ResizeHandle
            label={handleLabel}
            orientation="horizontal"
            sized={right ? 'after' : 'before'}
            value={height}
            min={minHeight}
            max={maxHeight}
            step={8}
            largeStep={40}
            valueText={(value) => `${value} pixels`}
            onResize={(next) => setHeight(clampHeight(next))}
            onResizeStart={() => setResizing(true)}
            onResizeEnd={() => setResizing(false)}
            className={cn(
              'absolute inset-x-0 z-10 h-2',
              stacked ? 'flex' : 'hidden max-md:flex',
              right
                ? ['top-0', framed ? '-translate-y-full' : '-translate-y-1/2']
                : ['bottom-0', framed ? 'translate-y-full' : 'translate-y-1/2'],
            )}
          />
        </>
      )}
    </aside>
  )
}

Panel.displayName = 'Panel'

export interface PanelHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The title. Keep it short — "Details", not a sentence. */
  children: ReactNode
  /** A 16px icon before the title. Pass the component: `icon={Info}`. */
  icon?: LucideIcon
  /** After the title, left-aligned with it — a Badge, usually. ContentBlock's slot. */
  titleSlot?: ReactNode
  /** Controls for the panel, pushed to the right edge. Default-size ghost Buttons fit. */
  actions?: ReactNode
  /**
   * The ghost × after the actions, which closes the panel. On by default;
   * `false` removes it — put a `Panel.Close` somewhere else, or let Escape
   * and the caller's own control do it.
   */
  closeButton?: boolean
}

/**
 * The title row: ContentBlock's header with a × on the end, at the TopBar's
 * height — 56 on 12 of padding rather than the block's 48 on 8 — so the
 * panel's title row lines up with the bar beside it.
 */
function PanelHeader({ children, icon, titleSlot, actions, closeButton = true, ...props }: PanelHeaderProps) {
  const { headingLevel } = useContext(PanelContext)
  const Heading = HEADING[headingLevel]

  return (
    <BlockHeader
      icon={icon}
      heading={<Heading className={title()}>{children}</Heading>}
      titleSlot={titleSlot}
      actions={actions}
      end={closeButton ? <PanelClose /> : null}
      height="bar"
      {...props}
    />
  )
}

PanelHeader.displayName = 'Panel.Header'

export interface PanelBodyProps extends ComponentPropsWithRef<'div'> {
  /** Extra classes for the scrolling region. */
  className?: string
}

/**
 * The scrolling middle. The header stays put and this moves under it —
 * Dialog's Body, with ContentBlock's 16px. A panel is as tall as the shell,
 * so unlike Dialog's this one is always wanted.
 */
function PanelBody({ className, ...props }: PanelBodyProps) {
  return <div className={cn(panelBody(), className)} {...props} />
}

PanelBody.displayName = 'Panel.Body'

export interface PanelCloseProps {
  /** Accessible name for the default icon button. Ignored when `render` is given. */
  label?: string
  /** Replace the × with your own element — a "Done" button, say. Dialog's shape. */
  render?: useRender.RenderProp
  /** Extra classes for the button. */
  className?: string
}

/**
 * The dismiss button. The default *is* the × and `render` replaces it
 * outright, Dialog.Close's contract without Base UI's part — there is no
 * root here to wire it to, only the context.
 */
function PanelClose({ label = 'Close', render, className }: PanelCloseProps) {
  const { close } = useContext(PanelContext)

  return useRender({
    render: render ?? <Button appearance="ghost" startIcon={X} aria-label={label} />,
    props: { onClick: close, className },
  })
}

PanelClose.displayName = 'Panel.Close'

Panel.Header = PanelHeader
Panel.Body = PanelBody
Panel.Close = PanelClose
