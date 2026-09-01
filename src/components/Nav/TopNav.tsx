import { useMemo } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { NavContext, type NavContextValue } from './context'
import { navSurface } from './styles'

/**
 * TopNav — the horizontal navigation bar of an application or a site.
 *
 * Mirrors the Figma component "Top Navigation" (`40004484:25988`). Same three
 * parts as `SideNav`, laid on their side:
 *
 *     <TopNav aria-label="Main" logo={<Logo />} utilities={<NavItem … />}>
 *       <NavItem href="/" selected>Home</NavItem>
 *       <NavItem href="/inbox">Inbox</NavItem>
 *     </TopNav>
 *
 * **The page list is centered by the layout, not by a rule.** Figma sizes the
 * logo header and the utilities FILL and the list HUG, so the list ends up in
 * the middle because the two ends claim equal space. `flex-1` on both ends
 * reproduces that exactly, and it degrades the way the Figma frame does — a
 * long list pushes the ends rather than overlapping them.
 *
 * **Utilities default to `size="small"`**, which is Figma's Secondary, and they
 * are icon-only in its composition. A `NavItem` with no children needs an
 * `aria-label`, which the type enforces.
 *
 * **No collapse, and no responsive menu.** Figma draws neither, and both are
 * real decisions rather than omissions — which breakpoint, whether the list
 * moves into a `Menu` or a drawer, and what happens to the utilities are
 * questions the file does not answer. Guessing would put a component in the
 * library that no design agreed to. The obvious next move is a `Menu` flyout
 * below a named breakpoint.
 *
 * **Not built on `Tabs`, though it looks like a strip of them.** Tabs' own doc
 * rules this out: a set of `href` links is "a `<nav>` of anchors and a
 * different accessibility contract" — no `tablist`, no roving focus, and
 * `aria-current` rather than `aria-selected`. This is that component.
 */

export interface TopNavProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'children' | 'className'> {
  /** The pages. `NavItem`s, in the centre of the bar. */
  children: ReactNode
  /**
   * Names the landmark. Required: a page with a top bar often has a side rail
   * as well, and two unnamed `<nav>`s cannot be told apart.
   */
  'aria-label': string
  /** The brand mark, in the 40px square at the start of the bar. */
  logo?: ReactNode
  /** The rows at the end — search, notifications, the account. */
  utilities?: ReactNode
  className?: string
}

export function TopNav({ children, logo, utilities, className, ...props }: TopNavProps) {
  const ctx = useMemo<NavContextValue>(
    () => ({ collapsed: false, size: 'default', indent: false }),
    [],
  )
  const utilityCtx = useMemo<NavContextValue>(
    () => ({ collapsed: false, size: 'small', indent: false }),
    [],
  )

  return (
    <nav
      className={cn(
        navSurface(),
        // min-h-14 = height/h-14 (56px), px-3 = spacing/3, py-2 = spacing/2,
        // gap-3 = spacing/3. A min-height so a taller utility does not clip.
        'flex min-h-14 w-full items-center gap-3 px-3 py-2',
        className,
      )}
      {...props}
    >
      <NavContext.Provider value={ctx}>
        {/*
          flex-1 on both ends and nothing on the middle: the list sits centered
          because the ends are equal, which is how the Figma frame is built.
          min-w-0 so a long brand name truncates instead of pushing the list off
          centre.
        */}
        <div className="flex min-w-0 flex-1 items-center">
          {logo ? (
            <span className="flex size-10 shrink-0 items-center justify-center">{logo}</span>
          ) : null}
        </div>

        {/*
          w-auto on the items: the shared item recipe is w-full, which is right
          in a rail and wrong in a row, where every link would stretch to an
          equal share of the bar.
        */}
        <div className="flex shrink-0 items-center gap-1 [&>*]:w-auto">{children}</div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 [&>*]:w-auto">
          {utilities ? (
            <NavContext.Provider value={utilityCtx}>{utilities}</NavContext.Provider>
          ) : null}
        </div>
      </NavContext.Provider>
    </nav>
  )
}

TopNav.displayName = 'TopNav'
