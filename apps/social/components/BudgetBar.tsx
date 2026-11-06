import { ChartSwatch } from '../../../src/components/Chart'
import { StackedBar } from '../../../src/components/StackedBar'
import { Text } from '../../../src/components/Text'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/**
 * A campaign's creator budget (`Block / Budget`, `40006187:42949`): three
 * figures with their swatches, over one stacked bar: paid, allocated and not
 * yet paid, and the rest of the total. The bar is decorative because the
 * figures above it already say all of this in text.
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
  const figures = [
    { label: 'Paid', value: paid, color: 'var(--data-viz-mono-a08)' },
    { label: 'Allocated', value: allocated, color: 'var(--data-viz-mono-a06)' },
    { label: 'Total', value: total, color: 'var(--data-viz-mono-a04)' },
  ]
  const segments = [
    { label: 'Paid', value: paid, color: figures[0]!.color },
    { label: 'Allocated', value: allocated - paid, color: figures[1]!.color },
    { label: 'Unallocated', value: total - allocated, color: figures[2]!.color },
  ]

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
      <StackedBar decorative segments={segments} />
    </div>
  )
}
