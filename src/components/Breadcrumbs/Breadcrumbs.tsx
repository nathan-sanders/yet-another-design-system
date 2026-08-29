import { Children, Fragment, createContext, isValidElement, useContext } from 'react'
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react'
import { ArrowRight, ChevronRight, Dot, type LucideIcon } from 'lucide-react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Icon } from '../Icon'

/**
 * Breadcrumbs — a trail of links from the root to the current page.
 *
 * Mirrors the Figma components "Breadcrumbs" (node 40004041:11934), the
 * "Breadcrumb Item" set (node 40004041:11838) and the "Separator" set
 * (node 40004041:11868).
 *
 * Note the color: Figma styles a breadcrumb link with Content/Subtle and
 * underlines it on hover — it does *not* use the blue Action/Link pair that
 * Button's `link` appearance reaches for. A trail is navigation chrome sitting
 * above the page, not a link inside body copy, so it stays neutral.
 *
 * Figma models Hover / Focus / Disabled as a `State` property. In code those are
 * real CSS states, so there is no `state` prop.
 *
 * The API is composed rather than an `items` array, matching Figma's structure
 * (a Breadcrumbs frame holding Breadcrumb Items with Separators between them):
 *
 *     <Breadcrumbs separator="chevron">
 *       <Breadcrumbs.Item href="/" startIcon={House}>Home</Breadcrumbs.Item>
 *       <Breadcrumbs.Item href="/projects">Projects</Breadcrumbs.Item>
 *       <Breadcrumbs.Item>My Project</Breadcrumbs.Item>
 *     </Breadcrumbs>
 */

/**
 * Which crumb is the current page. Set by Breadcrumbs for the last child and
 * read by each Item, so the two can never disagree — the same reasoning behind
 * Button deriving `iconOnly` from the absence of a label instead of taking a
 * prop. Deliberately not exported.
 */
const CurrentContext = createContext(false)

const SEPARATOR_ICON: Record<'chevron' | 'arrow' | 'dot', LucideIcon> = {
  chevron: ChevronRight,
  arrow: ArrowRight,
  dot: Dot,
}

const separatorStyles = tv({
  // 16px wide in Figma at every style, with the glyph centered and clipped. The
  // color is set here rather than on the glyph so the slash (text) and the
  // three Lucide icons (currentColor) both land on Content/Subtle.
  base: [
    'flex w-4 min-w-4 shrink-0 items-center justify-center overflow-hidden',
    'font-sans text-base font-normal text-content-subtle select-none',
  ],
})

const breadcrumbItem = tv({
  base: [
    'inline-flex items-center justify-center',
    // gap-2 = 8px (spacing/2) between icon and label, px-1 = 4px (spacing/1).
    // No height: the 24px comes from the text-base line-height, as in Figma.
    'gap-2 px-1',
    'font-sans text-base font-normal whitespace-nowrap',
  ],

  variants: {
    /**
     * The Figma `Type` property. Not a prop on Item — Breadcrumbs marks the last
     * child as the current page, and `isCurrent` overrides that if a trail ends
     * somewhere other than where the user is.
     */
    current: {
      // Type=Current Page: darker, and static. Figma gives it no hover, focus or
      // disabled state, so it gets no interactive classes at all.
      true: 'text-content-emphasized',
      // Type=Link.
      false: 'text-content-subtle',
    },

    interactive: {
      true: [
        'cursor-pointer rounded-md hover:underline',
        // Focus is the library's shared ring — see src/lib/focus.ts. A crumb has
        // no border and no fixed height, so it is the clearest case for a ring
        // that is pure `box-shadow`: nothing it does can move the trail.
        ...focusRing,
      ],
    },

    // Figma's Link/Disabled state is a flat 40% opacity (opacity/opacity-40).
    disabled: {
      true: 'opacity-40',
    },
  },

  defaultVariants: {
    current: false,
  },
})

export type BreadcrumbSeparator = 'slash' | 'chevron' | 'arrow' | 'dot'

export interface BreadcrumbsProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** `Breadcrumbs.Item` elements. Separators are inserted between them. */
  children: ReactNode
  /**
   * Glyph between crumbs. Maps to the Figma Separator `Style` property.
   * `slash` is the literal character; the rest are Lucide icons at 16px.
   */
  separator?: BreadcrumbSeparator
  /**
   * Name for the `<nav>` landmark. There is usually one trail per page, so the
   * default is fine unless a page has more than one.
   */
  'aria-label'?: string
}

export interface BreadcrumbsItemProps extends Omit<ComponentPropsWithRef<'a'>, 'color'> {
  /** The crumb's label. */
  children: ReactNode
  /** Where the crumb links to. Omit for a crumb that isn't navigable. */
  href?: string
  /**
   * Lucide icon before the label (the Figma `icon` slot, 16px). Pass the
   * component itself: `startIcon={House}`, not `<House />`.
   */
  startIcon?: LucideIcon
  /**
   * Overrides the "last crumb is the current page" rule. Only needed for a trail
   * that ends somewhere other than the page you are on.
   */
  isCurrent?: boolean
  /** Renders the crumb at 40% opacity and takes it out of the tab order. */
  disabled?: boolean
}

/**
 * The crumbs, in order.
 *
 * `Children.toArray` flattens arrays but *not* fragments — a trail wrapped in a
 * `<>…</>`, or one that groups a few crumbs conditionally, would arrive as a
 * single child, and the whole trail would render as one crumb with no
 * separators. Unwrapping fragments here keeps that from being a silent failure.
 */
function flattenCrumbs(children: ReactNode): ReactElement[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return []
    if (child.type === Fragment) {
      return flattenCrumbs((child.props as { children?: ReactNode }).children)
    }
    return [child]
  })
}

function Separator({ separator }: { separator: BreadcrumbSeparator }) {
  return (
    <span className={separatorStyles()} aria-hidden="true">
      {separator === 'slash' ? '/' : <Icon icon={SEPARATOR_ICON[separator]} size="base" />}
    </span>
  )
}

Separator.displayName = 'Breadcrumbs.Separator'

function BreadcrumbsItem({
  children,
  href,
  startIcon,
  isCurrent,
  disabled,
  className,
  ...props
}: BreadcrumbsItemProps) {
  const derivedCurrent = useContext(CurrentContext)
  const current = isCurrent ?? derivedCurrent
  // A crumb is only a link if it goes somewhere, isn't where you already are,
  // and isn't disabled. Anything else renders as plain text.
  const interactive = Boolean(href) && !current && !disabled

  const classes = cn(breadcrumbItem({ current, interactive, disabled }), className)

  const content = (
    <>
      {startIcon && <Icon icon={startIcon} size="base" />}
      {children}
    </>
  )

  if (interactive) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    )
  }

  // Not a link: the current page, a disabled crumb, or one with no href. A
  // <span> keeps it out of the tab order without needing aria-disabled to do
  // that job, and carries aria-current for the page you are on.
  return (
    <span
      className={classes}
      aria-current={current ? 'page' : undefined}
      aria-disabled={disabled ? true : undefined}
      {...props}
    >
      {content}
    </span>
  )
}

BreadcrumbsItem.displayName = 'Breadcrumbs.Item'

export function Breadcrumbs({
  children,
  separator = 'slash',
  className,
  'aria-label': ariaLabel = 'Breadcrumb',
  ...props
}: BreadcrumbsProps) {
  const crumbs = flattenCrumbs(children)
  const lastIndex = crumbs.length - 1

  return (
    <nav aria-label={ariaLabel} className={cn('font-sans', className)} {...props}>
      {/* gap-0 in Figma: the spacing is the item's px-1 plus the 16px separator. */}
      <ol className="flex items-center">
        {crumbs.map((crumb, index) => (
          // The separator lives inside the preceding <li> rather than as its own
          // list item, so the list length still matches the number of crumbs.
          <li key={crumb.key ?? index} className="flex items-center">
            <CurrentContext.Provider value={index === lastIndex}>{crumb}</CurrentContext.Provider>
            {index < lastIndex && <Separator separator={separator} />}
          </li>
        ))}
      </ol>
    </nav>
  )
}

Breadcrumbs.Item = BreadcrumbsItem
Breadcrumbs.displayName = 'Breadcrumbs'
