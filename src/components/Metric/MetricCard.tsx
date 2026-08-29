import { Card } from '../Card'
import { cn } from '../../lib/cn'
import { Metric, type MetricProps } from './Metric'

/**
 * MetricCard — a `Metric` on a surface.
 *
 * Figma's `Metric Card` (`40004342:15669`), and like `TrendBadge` it is a
 * wrapper rather than a new thing: Figma's component contains a **`Card`**
 * instance, and the tokens already agree —
 * `emphasis="subtle"` is `bg-surface-background-subtle
 * border-surface-background-subtle`, which is what Figma fills *and* strokes
 * with; `padding={3}` is its 12px; `rounded-md` is its radius 8.
 *
 * So the whole component is a `Card` around a `Metric`, and the reason it exists
 * at all is that the pairing is used constantly and getting either half wrong is
 * easy — a `default` card would draw a border the design does not have, and
 * `subtle` on the canvas would be invisible, which `Card`'s own record already
 * warns about.
 *
 * **It is `h-full` on purpose.** Cards in a row have labels of different
 * lengths, and a metric row where one card is a line taller than its neighbours
 * reads as a mistake. Filling the row's height is what keeps them level, and it
 * is the same thing `ContentBlock` does inside `BentoGrid`.
 */

export interface MetricCardProps extends MetricProps {
  className?: string
}

export function MetricCard({ className, ...metric }: MetricCardProps) {
  return (
    <Card emphasis="subtle" padding={3} className={cn('h-full', className)}>
      <Metric {...metric} />
    </Card>
  )
}

MetricCard.displayName = 'MetricCard'
