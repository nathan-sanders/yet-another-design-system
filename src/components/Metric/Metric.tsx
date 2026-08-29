import type { ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { TrendBadge, type TrendGoodDirection } from './TrendBadge'

/**
 * Metric — a labelled number, and what it did.
 *
 * Figma's `Metric Overview` (`40004341:15530`). Named `Metric` here because that
 * is what it is; "Overview" is Figma disambiguating it from the card around it,
 * and the same call as renaming Swatch's `style` prop to `shape` when the file's
 * name could not survive the crossing.
 *
 * It is the smallest thing in the data viz set and the one a dashboard uses
 * most — the top row of a dashboard is four of these, and nothing else.
 *
 * ## The value is mono and the label is not
 *
 * `text-xl` **mono bold** for the value against `text-base` sans for the label,
 * straight from Figma. Mono because a column of these has to align down a
 * dashboard, and bold-at-18px because the number is the thing the row exists
 * for — every other element here is telling you how to read it.
 *
 * Note this is the **opposite** of the guidance for a hero figure, where
 * proportional digits look better because `tabular-nums` gives every digit the
 * width of a `0` and a large number reads loose. At 18px in a row of four, the
 * alignment matters more than the fit of any one number.
 *
 * ## The card is not part of it
 *
 * A `Metric` has no background, no border and no padding of its own — it is
 * content. `MetricCard` is the version with a surface; `Gauge` and `Donut` put
 * the very same component in the middle of a ring, where a card would be wrong.
 * That split is the same one `ContentBlock` draws around its own body, and it is
 * why the metric in a donut's hole needed no new component.
 */

export interface MetricProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** What the number counts. */
  label: ReactNode
  /** The number, already formatted — this component does not do locale. */
  value: ReactNode
  /** The change, as a number. Its sign picks the arrow. Omit for no badge. */
  trend?: number
  /** Which direction counts as good news. Flips the badge's colour, not its arrow. */
  goodDirection?: TrendGoodDirection
  /** How the trend reads. Passed through to `TrendBadge`. */
  formatTrend?: (trend: number) => string
  /**
   * Rendered to the right of the number — Figma's `Spark Chart` slot, at a
   * 24px gap.
   *
   * A slot rather than a `Spark`-shaped prop, because what belongs beside a
   * metric is *a small chart*, and `Spark` already knows how to be one. Pass it
   * `decorative`: the value and its trend are stated in text right here, so
   * announcing the shape as well would give a screen reader a vaguer second
   * version of a number it has just read.
   *
   * **Use `type="line"`, not `area`.** Beside a number the fill is the loudest
   * thing in the card and it is carrying no information the line does not — the
   * shape is the whole point, and a wash under it competes with the value for
   * the eye. `area` earns its fill where a spark stands alone.
   */
  spark?: ReactNode
}

export function Metric({
  label,
  value,
  trend,
  goodDirection,
  formatTrend,
  spark,
  className,
  ...props
}: MetricProps) {
  return (
    // `items-end`, not `items-center`.
    //
    // The spark's baseline is the **value's** baseline, not the block's centre.
    // Centred, it floats between the label and the number and belongs to
    // neither; sitting on the same line as the value and its badge, it reads as
    // part of the same statement — this number, and how it got here.
    <div className={cn('flex min-w-0 items-end gap-6', className)} {...props}>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-content-subtle truncate text-base">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-content-emphasized font-mono text-xl font-bold tabular-nums">{value}</span>
          {trend === undefined ? null : (
            <TrendBadge trend={trend} goodDirection={goodDirection} format={formatTrend} />
          )}
        </span>
      </div>
      {spark ? <div className="min-w-0 flex-1">{spark}</div> : null}
    </div>
  )
}

Metric.displayName = 'Metric'
