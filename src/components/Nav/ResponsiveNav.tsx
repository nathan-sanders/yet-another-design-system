import type { ComponentPropsWithRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { MobileNav } from './MobileNav'
import { TopNav } from './TopNav'

/**
 * ResponsiveNav — `TopNav` above 768px, `MobileNav` below it.
 *
 *     <ResponsiveNav
 *       aria-label="Main"
 *       logo={<Logo />}
 *       utilities={<>…</>}
 *       pages={<><NavItem href="/">Home</NavItem>…</>}
 *       sections={<SideNav.Section header="Workspace">…</SideNav.Section>}
 *     />
 *
 * **`md:`, and the component owns it.** 768px is the library's one phone
 * boundary — `BentoGrid` already collapses there, and its record gives the
 * reason this follows: the caller should write no breakpoint of their own.
 * There is no `breakpoint` prop, because two components disagreeing about where
 * a phone stops is worse than not being able to move the line.
 *
 * **A CSS swap, not a media-query hook.** Both bars render and one is
 * `display: none`, which is what `BentoGrid` does and what keeps this working
 * on a server, through hydration, and on the first paint. A `matchMedia` hook
 * would render nothing until JavaScript ran and then flash the wrong bar.
 *
 * **Both bars take the same `aria-label`, deliberately.** A hidden element is
 * out of the accessibility tree entirely, so only one landmark is ever exposed
 * and there is nothing to disambiguate. Giving them different names would put
 * a name in the tree that depends on the window width, which is worse.
 *
 * **`pages` and `sections` are separate on purpose.** They are not the same
 * tree: a top bar carries a flat list of the few pages that fit, while the
 * sheet carries the whole navigation — sections, headers, collapsible groups.
 * Flattening one into the other would have to drop the headers and the groups,
 * and a component that silently discards structure is worse than one that asks
 * for both. The `sections` tree is the same one `SideNav` takes, so an app with
 * a rail already has it.
 */

export interface ResponsiveNavProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'children' | 'className'> {
  /**
   * Names both landmarks. Required, as on every bar in this family — only one
   * is ever in the accessibility tree, so they share it.
   */
  'aria-label': string
  /** The brand mark. Both bars put it in a 40px square at the start. */
  logo?: ReactNode
  /** The icon buttons at the end. Shared by both bars. */
  utilities?: ReactNode
  /** The wide bar's page list — `NavItem`s, centred between the ends. */
  pages: ReactNode
  /**
   * The phone sheet's contents — `SideNav.Section`s and `NavItem`s, the same
   * tree the rail takes.
   */
  sections: ReactNode
  /**
   * What the phone trigger reads. Optional: derived from whichever `NavItem` in
   * `sections` carries `selected`. See `MobileNav`.
   */
  section?: string
  /** The glyph beside it, also derived from the selected row when omitted. */
  sectionIcon?: LucideIcon
  /** Which edge the phone bar pins to. `bottom` by default. */
  placement?: 'bottom' | 'top'
  /** Whether both bars are lifted off the page. Only the drop shadow. */
  floating?: boolean
  /** Where the phone sheet is portalled. See `MobileNav`. */
  container?: ComponentPropsWithRef<typeof MobileNav>['container']
  /** Extra classes for the wide bar, which is the one in normal flow. */
  className?: string
}

export function ResponsiveNav({
  'aria-label': label,
  logo,
  utilities,
  pages,
  sections,
  section,
  sectionIcon,
  placement,
  floating,
  container,
  className,
  ...props
}: ResponsiveNavProps) {
  return (
    <>
      {/*
        `hidden md:flex` rather than `md:block`: TopNav's root is a flex row, so
        restoring it has to restore `flex` specifically. tailwind-merge keeps
        both — `hidden` replaces the base `flex`, and `md:flex` is a different
        variant group, so the pair survives intact.
      */}
      <TopNav
        {...props}
        aria-label={label}
        logo={logo}
        utilities={utilities}
        floating={floating}
        className={cn('hidden md:flex', className)}
      >
        {pages}
      </TopNav>

      {/*
        Only `aria-label` is shared onward. The rest of `props` goes to the wide
        bar alone: they are `<nav>` attributes, and an `id` among them would
        otherwise appear twice in the document — invalid even though one copy is
        hidden.
      */}
      <MobileNav
        aria-label={label}
        logo={logo}
        utilities={utilities}
        section={section}
        sectionIcon={sectionIcon}
        placement={placement}
        floating={floating}
        container={container}
        className="md:hidden"
      >
        {sections}
      </MobileNav>
    </>
  )
}

ResponsiveNav.displayName = 'ResponsiveNav'
