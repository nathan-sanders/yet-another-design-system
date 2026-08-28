import type { Meta, StoryObj } from '@storybook/react-vite'

import { AreaSeries } from './AreaSeries'
import { dailyData, monthlyData } from '../Chart/sample-data'

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
} satisfies Meta<typeof AreaSeries>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The chart Figma draws: two opaque areas, separated by a surface-coloured edge.
 *
 * Note the legend keys — plain colour squares, not the rule-and-marker a line
 * chart uses. An area has no point to echo, so the key is just the colour.
 */
export const Playground: Story = {}

/**
 * The two fills, which are different drawings rather than a style toggle.
 *
 * `solid` fills at full opacity and strokes its top edge in the **surface**
 * colour, so where two areas meet the boundary is made of white rather than of
 * extra ink. `gradient` fades to transparent downward and strokes its edge in
 * the **series** colour — the familiar line-with-a-wash.
 *
 * The edge swapping colour between them is the part that matters: a solid area
 * with a coloured edge would lose its separation, and a gradient area with a
 * surface edge would lose its line.
 */
export const Fills: Story = {
  render: (args) => (
    <div className="flex max-w-4xl flex-col gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">solid — opaque, surface-coloured edge</figcaption>
        <AreaSeries {...args} fill="solid" data={dailyData(14)} height={200} />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">gradient — fades out, series-coloured edge</figcaption>
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
