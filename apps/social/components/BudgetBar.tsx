import type { CSSProperties } from 'react'

import { ChartSwatch } from '../../../src/components/Chart'
import { Text } from '../../../src/components/Text'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/**
 * A campaign's creator budget (`Block / Budget`, `40006187:42949`): three
 * figures with their swatches, over one stacked bar — paid, allocated and not
 * yet paid, and the rest of the total. The file draws it with `Chart Key /
 * Metric` and `Horizontal Bar / Bar`. A HorizontalBar is a whole Recharts chart
 * with an axis per row, so the bar is drawn here on the same Mono tokens,
 * with the chart family's 1px white gap between segments (FINDINGS 202).
 */
export function BudgetBar({
  paid,
  allocated,
  total,
}: {
  paid: number
  /** Everything promised, the paid part included. */
  allocated: number
  total: number
}) {
  const share = (n: number) => `${total > 0 ? Math.max(0, (n / total) * 100) : 0}%`
  const figures = [
    { label: 'Paid', value: paid, color: 'var(--data-viz-mono-a08)' },
    { label: 'Allocated', value: allocated, color: 'var(--data-viz-mono-a06)' },
    { label: 'Total', value: total, color: 'var(--data-viz-mono-a04)' },
  ]
  const segments = [
    { width: share(paid), color: figures[0]!.color },
    { width: share(allocated - paid), color: figures[1]!.color },
    { width: share(total - allocated), color: figures[2]!.color },
  ].filter((s) => s.width !== '0%')

  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {figures.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <dt className="flex items-center gap-1">
              <ChartSwatch color={f.color} />
              <Text render={<span />} color="subtle">
                {f.label}
              </Text>
            </dt>
            <Text render={<dd />} color="subtle" mono>
              {money.format(f.value)}
            </Text>
          </div>
        ))}
      </dl>
      <div aria-hidden="true" className="flex h-4 w-full gap-px">
        {segments.map((s) => (
          <span
            key={s.color}
            className="h-full rounded-sm bg-(--segment) [width:var(--width)]"
            style={{ '--segment': s.color, '--width': s.width } as CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
