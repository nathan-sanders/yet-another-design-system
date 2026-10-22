import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Donut } from './Donut'
import { sliceData } from '../Chart/sample-data'
import { formatFullNumber, sentiment } from '../Chart'
import { onSurface } from '../Chart/story-surface'
import { Text } from '../Text'

const DATA = sliceData(6)
const TOTAL = DATA.reduce((sum, row) => sum + (row.sessions as number), 0)

const meta = {
  title: 'Data Viz/Donut',
  component: Donut,
  argTypes: {
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    interactiveLegend: { control: 'boolean' },
    height: { control: { type: 'range', min: 160, max: 480, step: 20 } },
  },
  args: {
    data: DATA,
    nameKey: 'browser',
    valueKey: 'sessions',
    label: 'Sessions by browser',
    legend: 'horizontal',
    interactiveLegend: false,
    height: 280,
  },
  decorators: [onSurface],
} satisfies Meta<typeof Donut>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma's chart: six slices, starting at twelve o'clock and running clockwise,
 * separated by a surface-colored stroke rather than a gap in the geometry.
 *
 * Hover a slice to see the halo — a thin arc of the series color just outside
 * the ring. The slice itself does not grow, which is deliberate: on a chart
 * whose entire encoding is size, enlarging what you point at makes pointing look
 * like it changed the value.
 */
export const Playground: Story = {}

/**
 * The hole is where the total goes — Figma's `Metric Total`.
 *
 * `center` is a slot rather than a label/value prop pair, because what belongs
 * there is a metric and metrics are their own component. It renders as a sibling
 * of the `role="img"` plot, so unlike SVG text inside the chart it is ordinary
 * content a screen reader can actually reach.
 */
export const WithTotal: Story = {
  args: {
    center: (
      <>
        <Text render={<span />} size="sm" color="subtle">Total sessions</Text>
        <Text render={<span />} size="3xl" weight="semibold" color="emphasized">{formatFullNumber(TOTAL)}</Text>
      </>
    ),
  },
}

/**
 * The interactive legend — Figma's `Chart Legend Buttons`.
 *
 * Click a slice's key to switch it off. The thing to watch is what does **not**
 * happen: the remaining slices keep the colors they already had. Color is
 * assigned over the full series list and the hidden set is a filter applied
 * afterwards, so toggling can never repaint the survivors and invalidate the
 * legend the reader has just learned.
 *
 * A switched-off row stays in the legend — you have to be able to click it back
 * — and carries two signals, the placeholder gray and a strikethrough, because a
 * color change alone is a poor way to state a binary.
 */
export const InteractiveLegend: Story = {
  args: { interactiveLegend: true },
}

/** A vertical legend beside the ring, which is what a long slice list wants. */
export const VerticalLegend: Story = {
  args: { legend: 'vertical', interactiveLegend: true },
}

/**
 * Where a donut stops working.
 *
 * At eight slices the small ones are arcs of a few degrees and the legend is
 * doing the work the chart was supposed to. The answer is to group the tail into
 * "Other" or to use a bar chart, which stays readable at any count —
 * `HorizontalBar` when the slices have names, since it labels every row.
 * Figma's own example uses six, and that is about the limit.
 */
export const TooManySlices: Story = {
  args: { data: sliceData(8), label: 'Sessions by browser, eight slices' },
}

/**
 * A slice that opens something — `onSliceClick`.
 *
 * Three ways in, and the story walks all three: click a slice; tab to the chart,
 * arrow to a slice and press Enter; or, with a screen reader, the slice's button
 * in the hidden table, since the plot itself is a picture to assistive
 * technology. The handler gets the row and its index into `data`, which stays
 * right after the legend has switched a slice off — the play switches Chrome off
 * first to prove it.
 */
export const SliceClick: Story = {
  args: { interactiveLegend: true },
  render: function Render(args) {
    const [opened, setOpened] = useState<string>()
    return (
      <div className="flex flex-col gap-4">
        <Donut {...args} onSliceClick={({ name, index }) => setOpened(`${name} (row ${index})`)} />
        <Text role="status" size="sm" color="subtle">
          {opened ? `Opened ${opened}` : 'Click a slice'}
        </Text>
      </div>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole('status')
    // A slice's name is on two buttons: its legend toggle, and its row in the
    // hidden table. The toggle is the one with a pressed state.
    const legendButton = (name: string) =>
      canvas.getAllByRole('button', { name }).find((button) => button.hasAttribute('aria-pressed'))!
    const table = within(canvasElement.querySelector('table')!)

    await step('a click on a slice opens that slice, by its row in data', async () => {
      await userEvent.click(legendButton('Chrome'))
      const sectors = await waitFor(() => {
        const found = canvasElement.querySelectorAll('.recharts-pie-sector')
        expect(found).toHaveLength(5)
        return found
      })
      // Chrome is off, so the first slice drawn is Safari — Recharts calls it 0,
      // and the caller's data calls it 1.
      // Hover first and let the active shape render, then click the slice that
      // is there now — see Gauge's SliceClick for why a bare click is lost.
      const slice = () => canvasElement.querySelectorAll('.recharts-pie-sector')[0]!
      await userEvent.hover(sectors[0]!)
      await waitFor(() => expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent('Safari'))
      await userEvent.click(slice())
      await waitFor(() => expect(status).toHaveTextContent('Opened Safari (row 1)'))
    })

    await step('Enter on the focused chart opens the slice the tooltip is on', async () => {
      const surface = canvasElement.querySelector<SVGElement>('.recharts-surface')!
      surface.focus()
      await userEvent.keyboard('{ArrowRight}')
      await waitFor(() => expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent('Firefox'))
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(status).toHaveTextContent('Opened Firefox (row 2)'))
    })

    await step('the hidden table has a button per slice', async () => {
      await userEvent.click(table.getByRole('button', { name: 'Edge' }))
      await waitFor(() => expect(status).toHaveTextContent('Opened Edge (row 3)'))
    })
  },
}

const SENTIMENT = [
  { tone: 'Positive', mentions: 612, color: sentiment.positive },
  { tone: 'Neutral', mentions: 431, color: sentiment.neutral },
  { tone: 'Negative', mentions: 188, color: sentiment.negative },
]

/**
 * `colorKey` names the property holding a slice's own color, for categories
 * that are a scale with colors of their own. Sentiment is the case: Positive
 * is green because it is positive, not because it came first. The legend
 * follows, because the slices and the swatches both read the series.
 */
export const Sentiment: Story = {
  args: {
    data: SENTIMENT,
    nameKey: 'tone',
    valueKey: 'mentions',
    colorKey: 'color',
    label: 'Brand sentiment this week',
  },
  play: async ({ canvasElement }) => {
    // Each slice is painted with its row's token, in the data's order.
    const fills = [...canvasElement.querySelectorAll('.recharts-pie-sector path')].map((p) => p.getAttribute('fill'))
    await expect(fills).toEqual([sentiment.positive, sentiment.neutral, sentiment.negative])
    // The legend's swatches follow the slices, since both read the series.
    const swatches = [...canvasElement.querySelectorAll('svg rect[fill^="var(--data-viz-sentiment"]')]
    await expect(swatches.map((r) => r.getAttribute('fill'))).toEqual([sentiment.positive, sentiment.neutral, sentiment.negative])
  },
}
