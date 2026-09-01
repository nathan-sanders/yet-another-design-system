import { useContext } from 'react'
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react'
import { useRender } from '@base-ui/react/use-render'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { Tooltip } from '../Tooltip'
import { NavContext } from './context'
import { navItem, type NavItemSize } from './styles'

/**
 * NavItem — one row of a navigation bar, in either direction.
 *
 * Mirrors the Figma component set "Nav Item" (`40004484:25394`), whose axes are
 * `Type` Primary | Secondary × `State` Default | Hover | Selected, plus the
 * booleans `Label`, `Start Slot`, `End Slot`, `Indent`, `Expand` and
 * `Expand Open`. It is the atom every other navigation component is built from
 * — `SideNav`'s rows, its collapse toggle and its utilities, and every link in
 * `TopNav` are all this component.
 *
 *     <NavItem href="/inbox" startIcon={Inbox} selected>Inbox</NavItem>
 *
 * **`Type` became `size`.** Primary and Secondary differ only in type size and
 * weight — 14/24 against 12/20 — and nothing else: same fills, same borders,
 * same geometry. `size` is what the axis is, and `type` is a DOM attribute that
 * the library's naming rule says has to give way. Figma's Primary is the
 * default, first as everywhere.
 *
 * **`selected` sets `aria-current="page"`**, not `ClickableCard`'s bare `true`.
 * That component deliberately picked `true` because a card is *an item in a
 * list*, not the navigation entry for the page you are on. This is the other
 * case — the one `page` exists for.
 *
 * **The element follows what you pass**, the same contract as `Link` and
 * `ClickableCard`: `href` makes an `<a>`, everything else a
 * `<button type="button">`, and `render={<NextLink href="/inbox" />}` replaces
 * either with a router link. `useRender` from Base UI, so the library still has
 * one polymorphism idiom and no `asChild`.
 *
 * **Collapsed, it grows a tooltip — which Figma does not draw.** A 40x40 icon
 * with its label hidden has no accessible name and no way to find out what it
 * is. The name is the harder problem of the two: axe fails an unlabelled
 * control, and every story in this repo is an axe run. So a collapsed item
 * takes its `children` as both the accessible name and the tooltip text when
 * they are a string, and falls back to `aria-label` when they are not.
 *
 * **The new indicator is folded in rather than exported.** Figma drew it as its
 * own `Status` component and now exposes it as the `New Indicator` boolean, but
 * it is eight pixels of geometry with no properties, and the one interesting
 * thing about it is the 2px ring bound to the nav background — a cut-out, so the
 * dot reads as punched through whatever surface it lands on.
 * `bg-decorative-pink-highlight` is `Pink/600` in both themes, which is exactly
 * the primitive Figma binds, reached through the semantic layer as the token
 * rule requires.
 *
 * **Figma now draws a Focus state, and it is the ring this library already
 * had.** The `State` axis gained a fourth value whose `Focus Ring` instance is a
 * 2px `Focus/Focus Inner Border` stroke with an `Element States/Focus Outer
 * Border` effect outside it — two concentric strokes, which is exactly what
 * `focusRing` composes out of `ring` and `ring-offset`. Nothing changed here as
 * a result; the note is that the two sides now agree. Figma draws that ring at
 * `rounded-md` while the item is `rounded-lg`; `ring` follows the element's own
 * radius, which is the better answer, so it was not copied.
 */

/** Props shared by both arms of the label union. */
interface NavItemBaseProps
  extends Omit<ComponentPropsWithRef<'button'>, 'type' | 'disabled' | 'children'> {
  /**
   * Type size. Figma's `Type` axis: `default` is Primary (14/24), `small` is
   * Secondary (12/20). Inherited from the bar when there is one — `SideNav`
   * gives its utilities `small` — so it rarely needs setting by hand.
   */
  size?: NavItemSize
  /** Makes the item an `<a>`. Without it, it is a `<button type="button">`. */
  href?: string
  /**
   * Marks this as the entry for the page being viewed. Sets `aria-current="page"`
   * and draws Figma's `State=Selected`: the selected fill and border, and a
   * semibold label.
   */
  selected?: boolean
  /**
   * The leading Lucide glyph, at 16px. Colored by the row, which is what Figma
   * binds the icon stroke to.
   */
  startIcon?: LucideIcon
  /**
   * Anything else for the start slot — an `Avatar`, most often. Figma lists
   * Icon and Avatar as the slot's two preferred values. Ignored when
   * `startIcon` is set.
   */
  start?: ReactNode
  /** The end slot. A `Badge` with an unread count, in Figma's composition. */
  end?: ReactNode
  /**
   * The 8px dot in the top-right corner of the start slot, with a 2px cut-out
   * ring in the nav background so it reads as punched through the surface.
   *
   * Named for Figma's `New Indicator` property. It was called `Status` when it
   * was its own component, and the rename is worth keeping: `Avatar` already
   * has a `status` prop meaning presence, and these are different things.
   */
  newIndicator?: boolean
  /** Renders the item at 40% opacity, out of the tab order, and inert. */
  disabled?: boolean
  /**
   * Adds the 16px leading indent Figma gives a child of an open group. Set for
   * you inside `SideNav.Group`; exposed for a hand-composed hierarchy.
   */
  indent?: boolean
  /**
   * Draws the expand chevron, which rotates when the group opens. Set by
   * `SideNav.Group` — on its own this only draws the affordance, it does not
   * make anything open.
   */
  expandable?: boolean
  /** Replaces the element with your own — a router link, usually. */
  render?: useRender.RenderProp
}

/**
 * An item with no label has to say what it is. The icon-only row cannot compile
 * without an `aria-label`, the same union `TabsTabProps` uses.
 */
export type NavItemProps = NavItemBaseProps &
  (
    | { children: ReactNode; 'aria-label'?: string }
    | { children?: never; 'aria-label': string }
  )

export function NavItem({
  children,
  size,
  href,
  selected = false,
  startIcon,
  start,
  end,
  newIndicator = false,
  disabled = false,
  indent,
  expandable = false,
  render,
  className,
  ref,
  ...props
}: NavItemProps) {
  const ctx = useContext(NavContext)
  const isLink = href !== undefined
  const resolvedSize = size ?? ctx.size
  const resolvedIndent = indent ?? ctx.indent

  // Collapsed, the label comes off the row and the item becomes a square. The
  // children are still the best name it has, so they are reused rather than
  // asking every caller to repeat itself in an aria-label.
  const labelled = children !== undefined && children !== null && children !== false
  const showLabel = labelled && !ctx.collapsed
  const childText = typeof children === 'string' ? children : undefined
  const explicitLabel = (props as { 'aria-label'?: string })['aria-label']
  const accessibleName = explicitLabel ?? (ctx.collapsed ? childText : undefined)

  const hasStart = startIcon !== undefined || start !== undefined || newIndicator

  const element = useRender({
    render,
    ref: ref as Ref<HTMLElement>,
    /*
      A disabled link is not a link. `<a>` has no disabled attribute and
      `pointer-events-none` alone would leave it in the tab order, so a disabled
      link becomes a `<span>`. ClickableCard's answer, and Link's before it.
    */
    defaultTagName: isLink ? (disabled ? 'span' : 'a') : 'button',
    props: {
      ...props,
      className: cn(
        navItem({ size: resolvedSize, selected, iconOnly: ctx.collapsed && !showLabel }),
        className,
      ),
      href: disabled ? undefined : href,
      // Not `submit`, which is what a bare <button> in a form defaults to.
      type: isLink ? undefined : 'button',
      disabled: isLink ? undefined : disabled || undefined,
      /*
        On the <span> path there is no native attribute to carry it, and
        opacity-40 puts the label below 4.5:1 — axe only exempts an inactive
        control by finding a disabled or aria-disabled ancestor.
      */
      'aria-disabled': isLink && disabled ? true : undefined,
      /*
        `page`, not `true`: this is the navigation entry for the current page,
        which is the case the value exists for.
      */
      'aria-current': selected ? ('page' as const) : undefined,
      /*
        Only when there is one. Spreading `'aria-label': undefined` would delete
        an aria-label a wrapper had already computed — Base UI's Tooltip trigger
        merges its props into this element, and an explicit undefined wins over
        what it put there.
      */
      ...(accessibleName ? { 'aria-label': accessibleName } : {}),
      children: (
        <>
          {/*
            24px, the same box as the icon slot — which is what lines a child's
            label up with its parent's: both are 8px of padding, a 24px box and
            a 4px gap, so both labels start at 36.
          */}
          {resolvedIndent ? <span aria-hidden className="size-6 shrink-0" /> : null}
          {hasStart ? (
            // Figma's Icon and Avatar slots are both a 24px box with the glyph
            // centred in it — a 16px icon lands at 4,4 and a 20px avatar at 2,2,
            // which is what centring gives for free. The indicator is pinned to
            // the top-right corner (16,0 in a 24 box), not laid out beside it.
            <span className="relative flex size-6 shrink-0 items-center justify-center">
              {startIcon ? <Icon icon={startIcon} /> : start}
              {newIndicator ? (
                <span
                  aria-hidden
                  className="absolute top-0 right-0 size-2 rounded-full bg-decorative-pink-highlight ring-2 ring-nav-background"
                />
              ) : null}
            </span>
          ) : null}
          {showLabel ? (
            // truncate rather than wrap: the rail is a fixed 224px and a
            // two-line row breaks the rhythm of the stack. px-1 is Figma's
            // spacing/1, which it sets on both sides of the label frame.
            <span className="min-w-0 flex-1 truncate px-1">{children}</span>
          ) : null}
          {end !== undefined && !ctx.collapsed ? (
            <span className="flex shrink-0 items-center gap-1">{end}</span>
          ) : null}
          {expandable && !ctx.collapsed ? (
            <Icon
              icon={ChevronDown}
              // The one part of the row that is NOT Nav Content/Primary: Figma
              // binds the chevron's stroke to Nav Content/Subtle, so it has to
              // say so rather than inherit the row's color like the start icon.
              className="shrink-0 text-nav-content-subtle transition-transform duration-fast-min ease-standard group-data-[panel-open]:rotate-180"
            />
          ) : null}
        </>
      ),
    },
  })

  // Wrapped only when the label has actually come off. An expanded item keeps
  // its text and a tooltip repeating it would be noise.
  if (ctx.collapsed && labelled && accessibleName) {
    return (
      <Tooltip label={accessibleName} side="right">
        {element}
      </Tooltip>
    )
  }

  return element
}

NavItem.displayName = 'NavItem'
