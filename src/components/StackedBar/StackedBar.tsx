import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { describeSegments, resolveSegments } from './segments'
import type { StackedBarSegment } from './segments'

/**
 * StackedBar — one bar split into the parts of a whole, with no axes.
 *
 *     <StackedBar label="Budget" segments={[{ label: 'Spent', value: 312 }, …]} />
 *     <StackedBar decorative size="small" segments={mix} />
 *
 * It sits in a table cell, a card or a row, beside text that gives the numbers.
 * **`HorizontalBar` is for comparing rows against an axis**; this is for reading
 * one breakdown at a glance. Figma: `Stacked Bar`, section on `↪ Data Viz`.
 *
 * **It is not a `HorizontalBar` with the chrome off**, for the reason `Spark`
 * gives. A chart is a Recharts tree, a `ResizeObserver` and a hidden table per
 * instance, and a portfolio table has a bar in every row. This is a flex row.
 *
 * **Shares come from `flex-grow`, not a width.** Percentages would sum to 100
 * and then overflow by the gaps; grow splits what is left after them.
 *
 * **The radius looks after itself.** `barSegment` has to clamp a short segment
 * by hand because SVG paths do not. CSS already scales corners down when they
 * would overlap, so a 3px sliver stays a sliver with no code here.
 */

const bar = tv({
  base: 'flex w-full gap-px',
  variants: {
    size: {
      default: 'h-4',
      small: 'h-2',
    },
  },
  defaultVariants: { size: 'default' },
})

export type StackedBarSize = 'default' | 'small'

interface StackedBarBaseProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The parts, in the order they are drawn. Empty ones are skipped. */
  segments: readonly StackedBarSegment[]
  /** `default` is 16px, Figma's bar. `small` is 8px, for a table cell or a row of text. */
  size?: StackedBarSize
  /** How a value reads in the accessible name. Defaults to its share, as a percent. */
  formatValue?: (value: number) => string
}

/**
 * Labeled or decorative, enforced by the type, as on `Spark`. An unlabeled
 * `role="img"` is the silent third case. Use `decorative` when the same figures
 * are already in text beside the bar.
 */
export type StackedBarProps = StackedBarBaseProps &
  ({ label: string; decorative?: false } | { decorative: true; label?: never })

export function StackedBar({
  segments,
  size,
  formatValue,
  label,
  decorative,
  className,
  ...props
}: StackedBarProps) {
  const a11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({
        role: 'img',
        'aria-label': describeSegments(label, segments, formatValue),
      } as const)

  return (
    <div {...a11y} {...props} className={cn(bar({ size }), className)}>
      {resolveSegments(segments).map((segment, index) => (
        <span
          key={`${segment.label}-${index}`}
          data-segment=""
          className="bg-(--segment) grow-(--share) min-w-0 basis-0 rounded-xs"
          style={{ '--segment': segment.color, '--share': segment.value } as CSSProperties}
        />
      ))}
    </div>
  )
}
