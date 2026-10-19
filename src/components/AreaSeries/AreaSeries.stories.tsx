import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { AreaSeries } from './AreaSeries'
import { dailyData, monthlyData } from '../Chart/sample-data'
import { onSurface } from '../Chart/story-surface'
import { Text } from '../Text'

/** Ordered largest-first, which is what an opaque `solid` fill requires. */
const SERIES = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'signups', label: 'Signups' },
]

const meta = {
  title: 'Data Viz/AreaSeries',
  component: AreaSeries,
  argTypes: {
    interpolation: { control: 'inline-radio', options: ['curve', 'linear'] },
    fill: { control: 'inline-radio', options: ['solid', 'gradient'] },
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    yLines: { control: { type: 'range', min: 2, max: 8, step: 1 } },
    height: { control: { type: 'range', min: 120, max: 480, step: 20 } },
  },
  args: {
    data: dailyData(31),
    xKey: 'date',
    series: SERIES,
    label: 'Sessions and signups over 31 days',
    interpolation: 'curve',
    fill: 'solid',
    yLines: 5,
    legend: 'horizontal',
    height: 280,
  },
  decorators: [onSurface],
} satisfies Meta<typeof AreaSeries>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The chart Figma draws: two opaque areas, separated by a surface-colored edge.
 *
 * Note the legend keys — plain color squares, not the rule-and-marker a line
 * chart uses. An area has no point to echo, so the key is just the color.
 */
export const Playground: Story = {}

/**
 * The two fills, which are different drawings rather than a style toggle.
 *
 * `solid` fills at full opacity and strokes its top edge in the **surface**
 * color, so where two areas meet the boundary is made of white rather than of
 * extra ink. `gradient` fades to transparent downward and strokes its edge in
 * the **series** color — the familiar line-with-a-wash.
 *
 * The edge swapping color between them is the part that matters: a solid area
 * with a colored edge would lose its separation, and a gradient area with a
 * surface edge would lose its line.
 */
export const Fills: Story = {
  render: (args) => (
    <div className="flex max-w-4xl flex-col gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">solid — opaque, surface-colored edge</figcaption>
        <AreaSeries {...args} fill="solid" data={dailyData(14)} height={200} />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">gradient — fades out, series-colored edge</figcaption>
        <AreaSeries {...args} fill="gradient" data={dailyData(14)} height={200} />
      </figure>
    </div>
  ),
}

/**
 * Why order is load-bearing for `solid`.
 *
 * An opaque area hides whatever is behind it, and Recharts paints in element
 * order — so the series array is the paint order, back to front. Largest first
 * and both are readable; smallest first and the smaller series buries the larger
 * one under a flat slab.
 *
 * The second chart is the mistake, kept visible on purpose. If no order works
 * because the data genuinely crosses, that is the signal to use `gradient`, or
 * to use `LineSeries` — two lines can cross and stay readable, two opaque areas
 * cannot.
 */
export const PaintOrder: Story = {
  render: (args) => (
    <div className="flex max-w-4xl flex-col gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">largest first — correct</figcaption>
        <AreaSeries {...args} data={dailyData(14)} series={SERIES} height={200} />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">smallest first — the larger series is buried</figcaption>
        <AreaSeries {...args} data={dailyData(14)} series={[...SERIES].reverse()} height={200} />
      </figure>
    </div>
  ),
}

/** A single series, over twelve months. */
export const SingleSeries: Story = {
  args: {
    data: monthlyData(),
    series: [{ key: 'sessions', label: 'Sessions' }],
    label: 'Sessions over 12 months',
    fill: 'gradient',
  },
}

/** "Jan 5", in UTC like the axis — see `formatDateTick`. */
const day = (row: Record<string, unknown>) =>
  new Date(String(row.date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/**
 * A day that opens something — `onPointClick`, as on `LineSeries`.
 *
 * Click inside an area and the click carries that area's series as well as the
 * day under the pointer. With two series drawn, the keyboard and the hidden
 * table open the day for both, and `series` stays unset.
 */
export const PointClick: Story = {
  render: function Render(args) {
    const [opened, setOpened] = useState<string>()
    return (
      <div className="flex flex-col gap-4">
        <AreaSeries
          {...args}
          onPointClick={({ row, index, series }) =>
            setOpened(`${day(row)} · ${series?.label ?? 'every series'} (row ${index})`)
          }
        />
        <Text role="status" size="sm" color="subtle">
          {opened ? `Opened ${opened}` : 'Click a day'}
        </Text>
      </div>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole('status')

    await step('a click inside an area opens the day under the pointer, for that area', async () => {
      // Signups is painted last, so it is on top along the baseline.
      const area = canvasElement.querySelectorAll('.recharts-area-area')[1]!
      const box = area.getBoundingClientRect()
      const coords = { clientX: box.left + box.width / 2, clientY: box.bottom - 4 }
      await userEvent.pointer({ target: area, coords })
      // The tooltip lands on the day under the pointer; the click opens that one.
      const heading = await waitFor(() => {
        const text = canvasElement.querySelector('.recharts-tooltip-wrapper')?.textContent ?? ''
        expect(text).toMatch(/^Jan \d+/)
        return text.match(/^Jan \d+/)![0]
      })
      await userEvent.pointer({ keys: '[MouseLeft]', target: area, coords })
      await expect(status).toHaveTextContent(`Opened ${heading} · Signups`)
    })

    await step('Enter on the focused chart opens the day the tooltip is on', async () => {
      await userEvent.unhover(canvasElement.querySelector('.recharts-surface')!)
      canvasElement.querySelector<SVGElement>('.recharts-surface')!.focus()
      await userEvent.keyboard('{ArrowRight}')
      await waitFor(() => expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent('Jan 2'))
      await userEvent.keyboard(' ')
      await expect(status).toHaveTextContent('Opened Jan 2 · every series (row 1)')
    })

    await step('the hidden table has a button per day', async () => {
      await userEvent.click(within(canvasElement.querySelector('table')!).getByRole('button', { name: 'Jan 10' }))
      await expect(status).toHaveTextContent('Opened Jan 10 · every series (row 9)')
    })
  },
}
