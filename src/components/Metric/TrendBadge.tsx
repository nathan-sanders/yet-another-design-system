import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'

import { Badge } from '../Badge'

/**
 * TrendBadge — which way a number has moved, and whether that is good news.
 *
 * Figma's `Trend Badge` (`40004342:15852`), three variants. It is a **`Badge`**,
 * and not in the "looks similar" sense: Figma's component literally contains a
 * `Badge` instance, and every token already lines up —
 * `Decorative/Green|Neutral|Red/Background` are exactly what `Badge`'s
 * `color="green" | "neutral" | "red"` emit, its `min-h-5` is Figma's 20px, and
 * its `startIcon` renders at 12px, Figma's size.
 *
 * So this component contributes one thing: the mapping from a number to a
 * direction. That is the whole of it, and it should stay that way — a
 * `TrendBadge` that grew its own padding or radius would be a second badge.
 *
 * ## The direction is derived from the sign
 *
 * `trend={8}` is up, `trend={-3}` is down, `trend={0}` is neutral. Passing a
 * number *and* a direction would let the two contradict each other, which is the
 * same reasoning that removed Button's `iconOnly` and Slider's `range`.
 *
 * ## But "up is good" is not universal, so it is a separate question
 *
 * Direction and sentiment are two different things and the component keeps them
 * apart. Sessions rising is good; churn rising is not, and neither is load time,
 * cost, or error rate. `goodDirection="down"` flips the **colour** while leaving
 * the **arrow** alone — the arrow reports what the number did, the colour says
 * how to feel about it, and a component that fused them would be wrong for
 * roughly half of every dashboard.
 */

/** Which way a metric has to move for the news to be good. */
export type TrendGoodDirection = 'up' | 'down'

export interface TrendBadgeProps {
  /**
   * The change. Sign picks the arrow; magnitude is what gets displayed once
   * `format` has had it.
   */
  trend: number
  /** Which direction counts as good. Flips the colour, never the arrow. */
  goodDirection?: TrendGoodDirection
  /** How the number reads. Defaults to a signed percentage, Figma's `8%`. */
  format?: (trend: number) => string
  className?: string
}

const ARROW = {
  up: ArrowUpRight,
  flat: ArrowRight,
  down: ArrowDownRight,
} as const

const COLOR = {
  good: 'green',
  flat: 'neutral',
  bad: 'red',
} as const

/** Figma shows a bare magnitude — `8%` — with the arrow carrying the sign. */
function defaultFormat(trend: number): string {
  return `${Math.abs(trend)}%`
}

export function TrendBadge({ trend, goodDirection = 'up', format = defaultFormat, className }: TrendBadgeProps) {
  const direction = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'

  const sentiment =
    direction === 'flat' ? 'flat' : direction === goodDirection ? 'good' : 'bad'

  return (
    <Badge color={COLOR[sentiment]} startIcon={ARROW[direction]} className={className}>
      {format(trend)}
    </Badge>
  )
}

TrendBadge.displayName = 'TrendBadge'
