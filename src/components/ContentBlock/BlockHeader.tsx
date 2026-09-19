import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import type { VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { header } from './styles'

export interface BlockHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The Figma "Icon" slot, at 16px, before the heading. */
  icon?: LucideIcon
  /**
   * The heading, already rendered. An element rather than text because the
   * three callers make different ones: `ContentBlock` an `<h3>` colored by its
   * emphasis, `Panel` an `<h2>`, `Drawer` a Base UI `Title` so the popup's
   * `aria-labelledby` points at it. What they share is where it sits.
   */
  heading: ReactElement
  /** After the heading, left-aligned with it — a Badge, usually. */
  titleSlot?: ReactNode
  /** Pushed to the right edge. */
  actions?: ReactNode
  /**
   * After the actions, outside their gap — the × a `Panel` or `Drawer` draws
   * by default. Its own slot so a caller's `actions` never has to know it is
   * there.
   */
  end?: ReactNode
  /** `block` (48, ContentBlock's) or `bar` (56, the TopBar's — Panel's and Drawer's). */
  height?: NonNullable<VariantProps<typeof header>['height']>
}

/**
 * The header row `ContentBlock`, `Panel` and `Drawer` share. Internal: not
 * exported from the barrel, because the three public headers are the API and
 * this is only where their layout lives once.
 */
export function BlockHeader({
  icon,
  heading,
  titleSlot,
  actions,
  end,
  height = 'block',
  className,
  ...props
}: BlockHeaderProps) {
  return (
    <div className={cn(header({ height }), className)} {...props}>
      {/*
        Figma's "Span": the icon, the title and the header slot travel together
        as one group, so the actions push against the group rather than against
        the text. min-w-0 lets a long unbroken title wrap instead of shoving the
        actions off the edge — Banner's fix, in the same place.
      */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {icon && <Icon icon={icon} size="base" />}
        {heading}
        {titleSlot}
      </div>

      {(actions || end) && (
        <div className="flex shrink-0 items-center justify-end gap-2">
          {actions}
          {end}
        </div>
      )}
    </div>
  )
}
