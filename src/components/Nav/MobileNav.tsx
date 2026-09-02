import { useCallback, useMemo, useState } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { navLayer, overlayLayer } from '../../lib/layers'
import { Dialog } from '../Dialog'
import { backdrop, viewport } from '../Dialog/styles'
import { Icon } from '../Icon'
import { NavContext, type NavContextValue } from './context'
import { navItem, navSheet, navSurface } from './styles'

/**
 * MobileNav — the phone navigation bar, and the sheet its trigger opens.
 *
 * Mirrors the Figma component set "Mobile Navigation" (`40004531:35584`, the
 * `Floating` axis), its "Mobile Nav Section Trigger" (`40004531:35355`) and the
 * "Mobile Navigation Popover" (`40004531:35587`) that slides up from the bottom
 * of the screen.
 *
 *     <MobileNav aria-label="Main" logo={<Logo />} section="Home" sectionIcon={House}>
 *       <SideNav.Section header="Workspace">
 *         <NavItem href="/" startIcon={House} selected>Home</NavItem>
 *       </SideNav.Section>
 *     </MobileNav>
 *
 * `children` are the sheet's contents — the same `SideNav.Section` and `NavItem`
 * the rail uses, so a responsive app writes its navigation once and hands the
 * same tree to whichever bar is on screen.
 *
 * **This is the component `TopNav`'s record was waiting for.** That one says a
 * responsive collapse was "a decision rather than an omission", because which
 * breakpoint and what it collapses into were questions Figma had not answered.
 * It has now, and the answer is not a collapsed `TopNav` — it is a different
 * bar with a different trigger and a sheet behind it.
 *
 * **It positions itself, unlike every other nav here.** `SideNav`, `TopNav` and
 * `TopBar` are all placed by the application, on the grounds that a nav does not
 * know what is beside it. This one is pinned to a viewport edge, which is close
 * to the definition of a phone nav, and Figma's example frames do exactly that
 * with constraints. `placement` is the prop; `bottom` is the default because
 * that is where the thumb is.
 *
 * **The sheet always comes from the bottom**, including when the bar is at the
 * top. Figma draws it that way in both example frames and it is right for the
 * same reason: the sheet is where the hand is, not where its trigger is.
 */

const bar = {
  // min-h-14 = height/h-14 (56px). gap-4 = spacing/4 (16), px-3 = spacing/3,
  // py-2 = spacing/2 — Figma's 8/12/8/12. `rounded-lg` and the fill come from
  // `navSurface`, shared with the rail and the top bar.
  //
  // No `w-full`, deliberately: `placement` pins the bar with `inset-x-2`, and a
  // width of 100% alongside a left/right pair over-constrains the box — the
  // browser drops `right` and the bar runs 8px past the edge it was supposed to
  // be inset from. Measured that way before it was removed: 358 wide in a 358
  // box, hanging 7px off the right.
  root: 'flex min-h-14 items-center gap-4 px-3 py-2',
  // The 8px inset Figma's example frames draw with constraints: its bar is 377
  // wide inside a 393 frame, and 8 from the edge it sits on.
  bottom: 'fixed inset-x-2 bottom-2',
  top: 'fixed inset-x-2 top-2',
}

export interface MobileNavProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'children' | 'className'> {
  /**
   * The sheet's contents — `SideNav.Section`s, or bare `NavItem`s. The same
   * tree the rail takes.
   */
  children: ReactNode
  /**
   * Names the landmark, and names the sheet as well. Required: a phone page
   * still has more than one `<nav>` often enough that two unnamed ones cannot
   * be told apart.
   */
  'aria-label': string
  /** The brand mark, in the 40px square at the start of the bar. */
  logo?: ReactNode
  /**
   * The section you are currently in, which is what the trigger pill reads.
   * It is a label rather than a lookup: the bar cannot know which of the rows
   * in the sheet is selected without inspecting children, and a prop that says
   * it is both simpler and honest.
   */
  section: string
  /** The glyph beside that label. Figma draws `house`. */
  sectionIcon?: LucideIcon
  /** The icon buttons at the end of the bar. They default to `size="small"`. */
  utilities?: ReactNode
  /**
   * Which edge the bar is pinned to. `bottom` is the default, and the one to
   * reach for — a bar at the top of a phone is a long way from the thumb.
   */
  placement?: 'bottom' | 'top'
  /**
   * Whether the bar is lifted off the page. Figma's `Floating` axis, and as on
   * both other bars it is **only the drop shadow** — the radius and padding are
   * identical either way.
   */
  floating?: boolean
  /** Sheet open state, controlled. */
  open?: boolean
  /** The sheet's starting state when `open` is not controlled. */
  defaultOpen?: boolean
  /** Called when the sheet opens or closes. */
  onOpenChange?: (open: boolean) => void
  /**
   * Where the sheet is portalled. Defaults to `document.body`, which is right
   * for a real phone.
   *
   * It is here because the sheet's backdrop and viewport are `fixed`, and a
   * `fixed` element resolves against the nearest ancestor carrying a
   * `transform` — so portalling into a transformed element scopes the whole
   * sheet to that box instead of the screen. That is what lets a story draw a
   * phone frame with a working sheet inside it, and what an app wants if it
   * renders into its own root rather than `<body>`.
   */
  container?: React.ComponentProps<typeof Dialog.Portal>['container']
  className?: string
}

export function MobileNav({
  children,
  logo,
  section,
  sectionIcon,
  utilities,
  placement = 'bottom',
  floating = true,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  container,
  className,
  ...props
}: MobileNavProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const open = openProp ?? uncontrolled

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolled(next)
      onOpenChange?.(next)
    },
    [onOpenChange, openProp],
  )

  const barCtx = useMemo<NavContextValue>(
    () => ({ collapsed: false, size: 'default', indent: false }),
    [],
  )
  const utilityCtx = useMemo<NavContextValue>(
    () => ({ collapsed: false, size: 'small', indent: false }),
    [],
  )
  const sheetCtx = useMemo<NavContextValue>(
    () => ({ collapsed: false, size: 'default', indent: false }),
    [],
  )

  const label = props['aria-label']

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <nav
        className={cn(
          navSurface({ floating }),
          bar.root,
          bar[placement],
          navLayer,
          className,
        )}
        {...props}
      >
        <NavContext.Provider value={barCtx}>
          {logo ? (
            <span className="flex size-10 shrink-0 items-center justify-center">{logo}</span>
          ) : null}

          {/*
            The trigger is the `navItem` recipe at `selected`, on a plain
            button — deliberately **not** the `NavItem` component. Its fill,
            border and semibold label are exactly what that variant draws, and
            Figma binds precisely those two tokens. But `NavItem`'s `selected`
            also sets `aria-current="page"`, and this is a disclosure button
            that opens a dialog, not the entry for the page you are on. Taking
            the recipe keeps the look and drops the wrong ARIA; Base UI supplies
            `aria-haspopup="dialog"` and `aria-expanded` in its place.
          */}
          <Dialog.Trigger
            className={cn(navItem({ selected: true }), 'min-w-0 flex-1')}
            // Figma: FILL with layoutGrow 1 — the pill absorbs everything left
            // between the logo and the utilities.
          >
            {sectionIcon ? (
              <span className="flex size-6 shrink-0 items-center justify-center">
                <Icon icon={sectionIcon} />
              </span>
            ) : null}
            {/* truncate, and Figma agrees: the trigger's label is the one text
                in the family set to ENDING truncation with maxLines 1. */}
            <span className="min-w-0 flex-1 truncate px-1 text-left">{section}</span>
            {/* `chevrons-up-down`, the stepper glyph — not a disclosure
                chevron. It is the one part of the pill on Nav Content/Subtle. */}
            <Icon icon={ChevronsUpDown} className="shrink-0 text-nav-content-subtle" />
          </Dialog.Trigger>

          {utilities ? (
            // `[&>*]:w-auto` undoes `navItem`'s `w-full`, which is right in a
            // rail and wrong in a row. TopNav's idiom.
            <NavContext.Provider value={utilityCtx}>
              <div className="flex shrink-0 items-center gap-0 [&>*]:w-auto">{utilities}</div>
            </NavContext.Provider>
          ) : null}
        </NavContext.Provider>
      </nav>

      {/*
        The raw Dialog parts, because `Dialog.Popup` hardcodes centring on a
        Viewport that takes no `className` — a caller cannot turn it into a
        bottom sheet. `Dialog.tsx` says the raw parts exist for "the shapes the
        wrappers above cannot express", and this is one. The cost of going raw
        is that `overlayLayer` has to be re-applied to both fixed siblings by
        hand, exactly as `DialogPopup` does.
      */}
      <Dialog.Portal container={container}>
        {/*
          A visible scrim, which Figma does not draw. The sheet is modal either
          way — focus trapped, Escape closes, the page behind inert — and the
          dim is the only thing that shows it. Undimmed, content that cannot be
          touched still looks like it can, which reads as broken rather than as
          modal.
        */}
        <Dialog.Backdrop className={cn(backdrop(), overlayLayer)} />
        {/*
          `items-end` bottom-anchors the sheet where Dialog's viewport centres
          it, and `p-0` lets it run full-bleed to the screen edges. Both merge
          over the shared recipe rather than forking it.
        */}
        <Dialog.Viewport className={cn(viewport(), overlayLayer, 'items-end p-0')}>
          {/*
            Named by the bar's own `aria-label` rather than a `Dialog.Title`.
            Figma draws no title — the sheet opens straight onto its first
            section header — and a Title renders a real heading, which
            `SideNav.Section` already declined for group labels.
          */}
          <Dialog.RawPopup aria-label={label} className={navSheet()}>
            <NavContext.Provider value={sheetCtx}>
              {/*
                gap-2 between sections is Figma's Nav Sections slot. The scroll
                is the other half of the height cap: with it the sheet stops
                growing, without it the cap would just clip.

                Clicking a row closes the sheet — the same call the collapsed
                group's flyout makes, for the same reason. A sheet still
                covering the page after you have followed a link out of it is
                what makes the pattern feel broken.
              */}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
                onClick={() => setOpen(false)}
              >
                {children}
              </div>
            </NavContext.Provider>
          </Dialog.RawPopup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

MobileNav.displayName = 'MobileNav'
