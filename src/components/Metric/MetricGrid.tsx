import type { ComponentPropsWithRef, ReactNode } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * MetricGrid — the row of metric cards a dashboard opens with.
 *
 * Figma's `Metric Grid` (`40004342:15698`): a horizontal run of `Metric Card`s
 * at a 16px gap.
 *
 * ## Why this is not `BentoGrid`
 *
 * It very nearly is, and the question was asked before building it. `BentoGrid`
 * already does columns and a gutter, and its default gap is the same 16px.
 *
 * **The difference is what happens on a phone, and it is the whole reason this
 * exists.** `BentoGrid` collapses to a single column, which is right for
 * content blocks — a chart at half a phone's width is unreadable. Four *numbers*
 * are not: they stay perfectly legible two-up, and stacking them turns a glance
 * into four screens of scrolling. So this grid collapses to **two** columns and
 * stops there.
 *
 * If that ever stops being true, this component has no reason to exist and
 * should be deleted in favour of `BentoGrid`. It is worth writing that down,
 * because from the outside the two look like duplicates.
 *
 * ## The count is a hint, not a promise
 *
 * `columns` sets the count from `md` up. Below that it is always two, so a
 * caller never writes a breakpoint — the same arrangement `BentoGrid` uses, and
 * for the same reason: a responsive rule that lives in one place cannot be
 * half-applied.
 */
const metricGrid = tv({
  base: [
    'grid w-full',
    // Two columns on a phone rather than one. See the note above — this is the
    // single thing that distinguishes this component from BentoGrid.
    'grid-cols-2',
    // Rows are content-sized, and MetricCard is `h-full`, so cards in a row end
    // level however long their labels are.
  ],
  variants: {
    /** Columns from `md` up. Four is the dashboard default and what Figma draws. */
    columns: {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
    },
    /** The gutter. `default` is Figma's 16px. */
    gap: {
      default: 'gap-4',
      tight: 'gap-2',
    },
  },
  defaultVariants: {
    columns: 4,
    gap: 'default',
  },
})

type MetricGridVariants = VariantProps<typeof metricGrid>
export type MetricGridColumns = NonNullable<MetricGridVariants['columns']>
export type MetricGridGap = NonNullable<MetricGridVariants['gap']>

export interface MetricGridProps extends ComponentPropsWithRef<'div'> {
  /** `MetricCard`s, usually. */
  children: ReactNode
  /** Columns from `md` up. Below that it is always two. */
  columns?: MetricGridColumns
  /** The gutter between cards. */
  gap?: MetricGridGap
}

export function MetricGrid({ children, columns = 4, gap = 'default', className, ...props }: MetricGridProps) {
  return (
    <div className={cn(metricGrid({ columns, gap }), className)} {...props}>
      {children}
    </div>
  )
}

MetricGrid.displayName = 'MetricGrid'
