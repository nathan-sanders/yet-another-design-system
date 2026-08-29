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

      {spark ? (
        /*
          The spark spans the whole block's height beside the label and the
          number — but its **bottom sits on the value's baseline**, not on the
          bottom of the value's line box, which is roughly 10px lower.
          That difference is invisible on a line spark, whose path rarely
          reaches the bottom of its box, and obvious on a bar spark, whose bars
          always do.
        */
        <span className="flex min-w-0 flex-1 items-baseline">
          <span className="min-w-0 flex-1">{spark}</span>
          {/*
            A zero-width strut carrying the value's own typography.

            This is what makes the alignment exact without a magic number. The
            strut has a real text baseline; the spark beside it is a box with no
            text, so flexbox synthesises one from its bottom edge — and
            `items-baseline` puts the two on the same line. The descender gap
            therefore comes from the font's own metrics at `text-xl`, so it stays
            correct if the type scale is regenerated from Figma.

            The obvious alternative, a hardcoded `mb-2.5`, is the same 10px today
            and silently wrong the day `--text-xl` moves.
          */}
          <span aria-hidden="true" className="w-0 overflow-hidden font-mono text-xl font-bold">
            &#8203;
          </span>
        </span>
      ) : null}
    </div>
  )
}

Metric.displayName = 'Metric'
