import { useCallback, useContext, useMemo, useState } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { PanelLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Tooltip } from '../Tooltip'
import { NavContext, type NavContextValue } from './context'
import { NavItem } from './NavItem'
import { navSurface } from './styles'

/**
 * SideNav — the vertical navigation rail of an application.
 *
 * Mirrors the Figma component set "Side Navigation" (`40004484:25806`, the
 * `Collapsed` × `Floating` axes) together with "Nav Section List"
 * (`40004504:29320`) and "Nav Section Header" (`40004511:33365`, itself now a
 * set with a `Collapsed` axis), which are its `Section`. Composed
 * API, like Tabs, Menu and Accordion:
 *
 *     <SideNav aria-label="Main">
 *       <SideNav.Section header="Workspace">
 *         <NavItem href="/" startIcon={Home} selected>Home</NavItem>
 *         <SideNav.Group label="Projects" startIcon={Folder}>
 *           <NavItem href="/p/atlas">Atlas</NavItem>
 *         </SideNav.Group>
 *       </SideNav.Section>
 *     </SideNav>
 *
 * **`aria-label` is required by the type.** A `<nav>` is a landmark, an app
 * with a side rail almost always has a second one in the header, and two
 * unnamed landmarks of the same role are indistinguishable in a screen
 * reader's list. Cheap to demand at the point where the answer is known.
 *
 * **The logo and the utilities are props, not children.** Figma draws them as
 * slots rather than as free content, and it pins the utilities to the bottom —
 * which a child cannot be relied on to do, because it depends on being last.
 * As props they are placed by the component, `TopNav` takes the same two, and
 * `children` means one thing in both bars: the pages.
 *
 * **Nineteenth Base UI component, and the standalone `Collapsible` the library
 * had deliberately left out.** `Accordion` skipped it on the grounds that
 * "Figma draws only the accordion, and a disclosure with no group around it is
 * a different component". Figma has since drawn one: `Nav Item`'s `Expand` /
 * `Expand Open` / `Indent` booleans are a disclosure, and `SideNav.Group` is
 * it. The open and close are one CSS transition on Base UI's measured
 * `--collapsible-panel-height`, exactly as Accordion's panel is.
 *
 * **Collapsed, the rail is 56px and every label becomes a tooltip.** That part
 * is `NavItem`'s doing; see its note on why an unlabelled icon is not shippable
 * even though Figma draws no tooltip.
 */

const sideNav = {
  root: 'flex h-full flex-col gap-3 p-2 transition-[width] duration-medium ease-standard',
  // 224px and 56px, Figma's two variants. w-14 is the 40px item plus the root's
  // 8px padding either side.
  expanded: 'w-56',
  collapsed: 'w-14',
}

export interface SideNavProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'children' | 'className'> {
  /** The sections. `SideNav.Section` and `SideNav.Group`, or bare `NavItem`s. */
  children: ReactNode
  /**
   * Names the landmark. Required: a page with a side rail almost always has a
   * second `<nav>` in its header.
   */
  'aria-label': string
  /** The brand mark, in the 40px square at the top of the rail. */
  logo?: ReactNode
  /**
   * The rows pinned to the bottom — help, notifications, the account. They
   * default to `size="small"`, which is Figma's Secondary.
   */
  utilities?: ReactNode
  /** Collapsed to the 56px icon rail. Controlled. */
  collapsed?: boolean
  /** The starting state when `collapsed` is not controlled. */
  defaultCollapsed?: boolean
  /** Called with the next state when the collapse toggle is pressed. */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Extra content directly under the header. Figma's Top Slot. */
  top?: ReactNode
  /** Extra content directly above the utilities. Figma's Bottom Slot. */
  bottom?: ReactNode
  /**
   * Whether the rail is lifted off the page. Figma's `Floating` axis, and it is
   * **only the drop shadow** — the radius and padding are identical either way.
   * `false` is the docked case the docs frame shows: the rail inset inside the
   * app window, still rounded, just not casting onto it.
   */
  floating?: boolean
  className?: string
}

export function SideNav({
  children,
  logo,
  utilities,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  top,
  bottom,
  floating = true,
  className,
  ...props
}: SideNavProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultCollapsed)
  const collapsed = collapsedProp ?? uncontrolled

  const toggle = useCallback(() => {
    const next = !collapsed
    if (collapsedProp === undefined) setUncontrolled(next)
    onCollapsedChange?.(next)
  }, [collapsed, collapsedProp, onCollapsedChange])

  const ctx = useMemo<NavContextValue>(
    () => ({ collapsed, size: 'default', indent: false }),
    [collapsed],
  )
  const utilityCtx = useMemo<NavContextValue>(
    () => ({ collapsed, size: 'small', indent: false }),
    [collapsed],
  )

  return (
    <nav
      className={cn(
        navSurface({ floating }),
        sideNav.root,
        collapsed ? sideNav.collapsed : sideNav.expanded,
        className,
      )}
      {...props}
    >
      <NavContext.Provider value={ctx}>
        {/*
          Figma's Header frame. Expanded it is a 12px-gapped row with the logo
          and the toggle pushed apart; collapsed it stacks them with **no gap**
          at all, two 40px squares making an 80px block. The collapsed gap was
          12 here and that is the spacing that read as too loose.
        */}
        <div
          className={cn(
            'flex shrink-0',
            collapsed ? 'flex-col items-center gap-0' : 'items-center justify-between gap-3',
          )}
        >
          {logo ? (
            <span className="flex size-10 shrink-0 items-center justify-center">{logo}</span>
          ) : null}
          {/*
            Figma draws the toggle as a Nav Item with the label off, which is
            what this is. `aria-expanded` describes the rail it controls, and
            the label names the action rather than the state — "Collapse
            navigation" while it is open.
          */}
          {/*
            Tooltipped in both states, which is the one place a nav tooltip is
            not about the rail being collapsed: the toggle never has a label, so
            it is the only control here that is unexplained even at full width.
            The tooltip text and the accessible name are the same string on
            purpose — a visible label that is not part of the accessible name is
            a WCAG 2.5.3 failure, and keeping them identical makes that
            impossible to get wrong later.
          */}
          <Tooltip label={collapsed ? 'Expand' : 'Collapse'} side="right">
            <NavItem
              startIcon={PanelLeft}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              aria-expanded={!collapsed}
              onClick={toggle}
            />
          </Tooltip>
        </div>

        {top}

        {/*
          The one scrolling region. `min-h-0` because a flex child will not
          shrink below its content without it, which would push the utilities
          off the bottom instead of scrolling.

          `gap-2` — Figma's Nav Sections slot is 8, in both the expanded and the
          collapsed variant. It is the root that uses 12.

          The negative margins are not a trick: `overflow-y-auto` establishes a
          clip box, and the focus ring paints 4px outside the row it is on, so
          without them the first and last rows lose the outer half of their
          ring. The padding pushes the clip box out by exactly that 4px and the
          margin takes the space back, leaving the layout where it was.
        */}
        <div className="-mx-1 -my-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 py-1">
          {children}
        </div>

        {bottom}

        {utilities ? (
          <NavContext.Provider value={utilityCtx}>
            <div className="flex shrink-0 flex-col">{utilities}</div>
          </NavContext.Provider>
        ) : null}
      </NavContext.Provider>
    </nav>
  )
}

export interface SideNavSectionProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'className'> {
  /** The rows. */
  children: ReactNode
  /**
   * The group label above the rows — Figma's Nav Section Header. Dropped
   * entirely when the rail is collapsed, which is what the Figma variant does:
   * there is no room for it, and a heading over an unlabelled icon says
   * nothing anyway.
   */
  header?: string
  className?: string
}

function SideNavSection({ children, header, className, ...props }: SideNavSectionProps) {
  const { collapsed } = useContext(NavContext)

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {header ? (
        collapsed ? (
          /*
            Collapsed, Figma swaps the header text for a rule — its
            `Nav Section Header / Collapsed=True` is a 12px band holding a 1px
            line, which is how the groups stay legible once their names are
            gone. `aria-hidden`, and not the library's `Divider`: that renders
            `role="separator"`, and a separator with no name between two groups
            of links is noise to a screen reader rather than structure — the
            call Accordion made about its own item rules.

            `nav-content-subtle` at 40%: Figma carries the opacity on the
            Divider *instance* rather than on the paint, so the stroke reads as
            a full-strength Nav Content/Subtle and only the node is faded. Both
            halves are needed — the token alone is twice as strong as drawn.
          */
          <div aria-hidden className="flex h-3 items-center">
            <span className="h-px w-full bg-nav-content-subtle/40" />
          </div>
        ) : (
          // px-3 = spacing/3, py-1 = spacing/1, text-sm = 12/20, and the one
          // place `nav-content-subtle` paints text. Not a heading element:
          // these are group labels inside a landmark, and putting four of them
          // in the page outline is noise rather than structure. Tabs reached
          // the same conclusion about its strip.
          <span className="px-3 py-1 text-sm text-nav-content-subtle">{header}</span>
        )
      ) : null}
      {children}
    </div>
  )
}

SideNavSection.displayName = 'SideNav.Section'

export interface SideNavGroupProps {
  /** The rows revealed when the group opens. They carry the 16px indent. */
  children: ReactNode
  /** The trigger's label. */
  label: ReactNode
  /** The trigger's leading glyph. */
  startIcon?: LucideIcon
  /** Open on first render, without controlling it. */
  defaultOpen?: boolean
  /** Open state, controlled. */
  open?: boolean
  /** Called when the group opens or closes. */
  onOpenChange?: (open: boolean) => void
  className?: string
}

function SideNavGroup({
  children,
  label,
  startIcon,
  defaultOpen,
  open,
  onOpenChange,
  className,
}: SideNavGroupProps) {
  const parent = useContext(NavContext)
  const childCtx = useMemo<NavContextValue>(
    () => ({ ...parent, indent: true }),
    [parent],
  )

  /*
    Collapsed, there is nowhere to put the children: the panel would open into a
    56px rail and every row inside it would be an indistinguishable icon. Figma
    does not draw this case either. The trigger stays as a plain item so the
    rail keeps its shape, and the group's own rows are unreachable until it is
    expanded — the honest behavior, and the reason a flyout is the obvious next
    thing to build here.
  */
  if (parent.collapsed) {
    return (
      <NavItem startIcon={startIcon} className={className}>
        {label}
      </NavItem>
    )
  }

  return (
    <CollapsiblePrimitive.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      className={cn('flex flex-col', className)}
    >
      {/*
        The label goes inside the rendered element rather than on the Trigger.
        Both put it in the same place at runtime, but only this one satisfies
        NavItem's own type: an item with no children has to carry an
        `aria-label`, and children handed to the Trigger are invisible to the
        checker looking at `<NavItem />`.
      */}
      <CollapsiblePrimitive.Trigger
        render={
          <NavItem startIcon={startIcon} expandable>
            {label}
          </NavItem>
        }
      />
      <CollapsiblePrimitive.Panel
        // The whole animation. Base UI measures the panel and publishes the
        // result as --collapsible-panel-height; this transitions to it and
        // collapses to zero for the frame before opening and before closing.
        // Accordion's panel, one component over.
        className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-fast ease-standard data-[ending-style]:h-0 data-[starting-style]:h-0"
      >
        <NavContext.Provider value={childCtx}>
          <div className="flex flex-col">{children}</div>
        </NavContext.Provider>
      </CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  )
}

SideNavGroup.displayName = 'SideNav.Group'

SideNav.Section = SideNavSection
SideNav.Group = SideNavGroup
SideNav.displayName = 'SideNav'
