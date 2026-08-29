import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer } from 'recharts'

import { cn } from '../../lib/cn'
import { BAR_MAX_WIDTH, barSegment, categorical } from '../Chart'

/**
 * Spark — a shape, at the size of a word.
 *
 * Figma's `Spark` (`40004332:42192`), 272×96, with a `Line` and a
 * `Vertical Bar` type.
 *
 * ## Why this does not use `ChartContainer`
 *
 * Every other chart in the library goes through it, and this one deliberately
 * does not. A spark is not a chart with the chrome switched off — it is a
 * different thing that happens to be drawn from numbers. It has no axes, no
 * grid, no legend, no tooltip and no hidden table, because it is not making
 * claims a reader is meant to measure. It sits beside a number and says which
 * way that number has been moving.
 *
 * Routing it through the container would mean five props set to `false` and an
 * accessibility table nobody asked for, which is a worse description of the
 * component than this is.
 *
 * ## Accessibility: usually decorative, and honest about it
 *
 * A spark almost always sits next to the figure it summarises — a metric card's
 * value and its delta. In that arrangement the trend is **already stated in
 * text**, and announcing "line chart" adds a second, vaguer version of a number
 * the reader has just heard. So `decorative` marks it `aria-hidden` and that is
 * the common case.
 *
 * When a spark is genuinely the only thing carrying the information, pass a
 * `label` and it becomes a labelled image instead. What is not offered is
 * silence: one of the two has to be true, and neither is guessed for you.
 *
 * ## One series, always
 *
 * At this size a second series is two lines a few pixels apart, which is a
 * decoration rather than a comparison. If two series need comparing, the answer
 * is a real chart with an axis.
 */

export type SparkType = 'line' | 'bar' | 'area'

interface SparkBaseProps {
  /** The rows to plot. */
  data: readonly Record<string, unknown>[]
  /** The property holding the value. */
  dataKey: string
  /** Line, bar, or a line with a wash under it. */
  type?: SparkType
  /** The series color. Defaults to the first categorical. */
  color?: string
  /** Height in px. Figma draws it at 96; a metric card usually wants less. */
  height?: number
  className?: string
}

/**
 * A spark is either labelled or explicitly decorative. Requiring one of the two
 * is what stops the silent third case — an unlabelled `role="img"`, which is the
 * one an audit flags and a reader gets nothing from.
 */
export type SparkProps = SparkBaseProps &
  (
    | { label: string; decorative?: false }
    | { decorative: true; label?: never }
  )

/** Figma: the spark's own bar radius is the chart bar's. */
const SPARK_BAR_GAP = 1
/** Thicker than the 1.5px chart line — at 96px tall a hairline disappears. */
const SPARK_LINE_WIDTH = 2

export function Spark({
  data,
  dataKey,
  type = 'line',
  color = categorical(0),
  height = 96,
  className,
  ...rest
}: SparkProps) {
  const decorative = 'decorative' in rest && rest.decorative === true
  const label = 'label' in rest ? rest.label : undefined

  const accessibility = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': label } as const)

  const rows = data as Record<string, unknown>[]

  /**
   * Recharts 3 turns `accessibilityLayer` on by default, which makes the chart
   * root focusable. Inside this component that is a genuine fault, and axe
   * caught it: a `tabindex="0"` element inside an `aria-hidden` wrapper is
   * something a keyboard user can land on and a screen reader cannot describe.
   * The labelled case has the same shape, because `role="img"` also makes the
   * subtree opaque.
   *
   * Off rather than worked around, because a spark has nothing to traverse: no
   * tooltip, no axis, no per-point readout. Its keyboard layer would navigate
   * between points that announce nothing.
   */
  const chartProps = { data: rows, accessibilityLayer: false } as const

  return (
    <div {...accessibility} style={{ height }} className={cn('w-full min-w-0', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart {...chartProps} margin={{ top: 1, right: 0, bottom: 0, left: 0 }} barCategoryGap="20%">
            <Bar
              dataKey={dataKey}
              fill={color}
              maxBarSize={BAR_MAX_WIDTH}
              isAnimationActive={false}
              shape={barSegment({ gap: SPARK_BAR_GAP })}
            />
          </BarChart>
        ) : type === 'area' ? (
          <AreaChart {...chartProps} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
            <Area
              dataKey={dataKey}
              type="monotone"
              stroke={color}
              strokeWidth={SPARK_LINE_WIDTH}
              fill={color}
              // A wash rather than a block: at this height an opaque fill would
              // read as a solid shape and the line on top would vanish into it.
              fillOpacity={0.16}
              isAnimationActive={false}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        ) : (
          <LineChart {...chartProps} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
            <Line
              dataKey={dataKey}
              type="monotone"
              stroke={color}
              strokeWidth={SPARK_LINE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={false}
              // No points, and no active point either: there is nothing to hover
              // because there is no tooltip to show.
              dot={false}
              activeDot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

Spark.displayName = 'Spark'
