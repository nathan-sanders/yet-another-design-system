import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Gauge } from './Gauge'
import { gaugeData } from '../Chart/sample-data'
import { Badge } from '../Badge'
import { onSurface } from '../Chart/story-surface'
import { Text } from '../Text'

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
  decorators: [onSurface],
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
  parameters: { surfaceWidth: 'w-100' },
  render: (args) => <Gauge {...args} />,
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
  parameters: { surfaceWidth: 'w-100' },
  render: (args) => (
    <Gauge
      {...args}
      center={
        <>
          <Text render={<span />} size="sm" color="subtle">Quarterly target</Text>
          <span className="flex items-center gap-2">
            <Text render={<span />} size="2xl" weight="bold" color="emphasized" mono className="tabular-nums">1,234</Text>
            <Badge color="green" startIcon={TrendingUp}>
              8%
            </Badge>
          </span>
        </>
      }
    />
  ),
}

/** The interactive legend works here too — see `Donut` for what it guarantees. */
export const InteractiveLegend: Story = {
  args: { interactiveLegend: true },
  parameters: { surfaceWidth: 'w-100' },
  render: (args) => <Gauge {...args} />,
}

/**
 * A slice that opens something — `onSliceClick`, the same three ways in as
 * `Donut`'s: click a slice; tab to the gauge and walk it with the arrow keys,
 * Home and End, then press Enter; or a screen reader's button in the hidden
 * table.
 */
export const SliceClick: Story = {
  render: function Render(args) {
    const [opened, setOpened] = useState<string>()
    return (
      <div className="flex flex-col gap-4">
        <Gauge {...args} onSliceClick={({ name, index }) => setOpened(`${name} (row ${index})`)} />
        <Text role="status" size="sm" color="subtle">
          {opened ? `Opened ${opened}` : 'Click a slice'}
        </Text>
      </div>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole('status')

    await step('a click on a slice opens it', async () => {
      await userEvent.click(canvasElement.querySelectorAll('.recharts-pie-sector')[1]!)
      await expect(status).toHaveTextContent('Opened In progress (row 1)')
    })

    await step('End, then Enter, opens the last slice', async () => {
      canvasElement.querySelector<SVGElement>('.recharts-surface')!.focus()
      await userEvent.keyboard('{End}')
      await waitFor(() => expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent('Remaining'))
      await userEvent.keyboard('{Enter}')
      await expect(status).toHaveTextContent('Opened Remaining (row 2)')
    })

    await step('the hidden table has a button per slice', async () => {
      await userEvent.click(within(canvasElement.querySelector('table')!).getByRole('button', { name: 'Committed' }))
      await expect(status).toHaveTextContent('Opened Committed (row 0)')
    })
  },
}
