import type { Meta, StoryObj } from '@storybook/react-vite'

import { Donut } from './Donut'
import { sliceData } from '../Chart/sample-data'
import { formatFullNumber } from '../Chart'

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
        <span className="text-content-subtle text-sm">Total sessions</span>
        <span className="text-content-emphasized text-3xl font-semibold">{formatFullNumber(TOTAL)}</span>
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
 * "Other" or to use `VerticalBar`, which stays readable at any count. Figma's
 * own example uses six, and that is about the limit.
 */
export const TooManySlices: Story = {
  args: { data: sliceData(8), label: 'Sessions by browser, eight slices' },
}
