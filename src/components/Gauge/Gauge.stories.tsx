import { TrendingUp } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Gauge } from './Gauge'
import { gaugeData } from '../Chart/sample-data'
import { Badge } from '../Badge'

const meta = {
  title: 'Data Viz/Gauge',
  component: Gauge,
  argTypes: {
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    interactiveLegend: { control: 'boolean' },
    height: { control: { type: 'range', min: 120, max: 360, step: 20 } },
  },
  args: {
    data: gaugeData(),
    nameKey: 'stage',
    valueKey: 'amount',
    label: 'Quarterly target by stage',
    legend: 'horizontal',
    height: 200,
  },
} satisfies Meta<typeof Gauge>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A donut folded into a half circle, with a thinner ring — 80% inner radius
 * against the donut's 72%, which is Figma's number.
 *
 * The same band stretched over half the sweep reads much heavier, so a gauge at
 * the donut's ratio looks like an arch rather than a gauge, and it crowds the
 * figure underneath.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="w-100">
      <Gauge {...args} />
    </div>
  ),
}

/**
 * The figure under the arch, which is the whole reason this is a separate
 * component rather than a `Donut` prop.
 *
 * Folding a donut in half turns the hole into a **shelf**: the arc's center sits
 * at the bottom edge, so the free space is the lower half of the box rather than
 * the middle of it. A donut centers its content; a gauge tucks it under. Those
 * are different components pretending to be one prop.
 */
export const WithMetric: Story = {
  render: (args) => (
    <div className="w-100">
      <Gauge
        {...args}
        center={
          <>
            <span className="text-content-subtle text-sm">Quarterly target</span>
            <span className="flex items-center gap-2">
              <span className="text-content-emphasized font-mono text-2xl font-bold tabular-nums">1,234</span>
              <Badge color="green" startIcon={TrendingUp}>
                8%
              </Badge>
            </span>
          </>
        }
      />
    </div>
  ),
}

/** The interactive legend works here too — see `Donut` for what it guarantees. */
export const InteractiveLegend: Story = {
  args: { interactiveLegend: true },
  render: (args) => (
    <div className="w-100">
      <Gauge {...args} />
    </div>
  ),
}
