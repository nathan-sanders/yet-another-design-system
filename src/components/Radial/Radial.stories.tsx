import type { Meta, StoryObj } from '@storybook/react-vite'

import { Radial } from './Radial'
import { radialData } from '../Chart/sample-data'

const DATA = radialData(5)

const meta = {
  title: 'Data Viz/Radial',
  component: Radial,
  argTypes: {
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    interactiveLegend: { control: 'boolean' },
    height: { control: { type: 'range', min: 160, max: 480, step: 20 } },
    max: { control: { type: 'number' } },
    valueLabel: { control: 'text' },
  },
  args: {
    data: DATA,
    nameKey: 'team',
    valueKey: 'complete',
    label: 'Rollout completion by team',
    valueLabel: 'Complete',
    max: 100,
    legend: 'horizontal',
    interactiveLegend: false,
    height: 280,
  },
} satisfies Meta<typeof Radial>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma's radial: five rings starting at twelve o'clock and running clockwise,
 * each over a full-sweep track in the placeholder gray.
 *
 * The track is the part that makes the form honest. A radial bar's length is an
 * *angle*, and the same angle covers less ink at a small radius than at a large
 * one — so without a band showing each ring's full extent, an inner ring reads
 * as smaller than an outer ring holding exactly the same value.
 *
 * Hover a ring to see the highlight: a 1px outline in
 * `Data Viz/Utility/Accessibility Overlay`, which is the same token and the same
 * weight the line and area charts mark the pointer with. Nothing about the
 * ring's geometry moves — on a chart whose encoding is size, growing what you
 * point at makes pointing look like it changed the value.
 */
export const Playground: Story = {}

/**
 * `max` is the one prop `Donut` and `Gauge` do not need.
 *
 * Those two are parts of a whole, so their own sum is the scale. A radial bar's
 * rings are independent values against a shared ceiling, and here that ceiling
 * is 100% whatever the largest team happens to have reached. Leaving `max`
 * unset instead pins the scale to the largest value present, which fills the
 * outermost ring — right when there is no external target, and misleading when
 * there is.
 */
export const ScaledToTheData: Story = {
  args: { max: undefined, label: 'Rollout completion by team, scaled to the data' },
}

/**
 * The hole is where a headline figure goes, through `ChartContainer`'s `overlay`
 * — a sibling of the `role="img"` plot rather than SVG text inside it, so unlike
 * a number drawn into the chart it is something a screen reader can reach.
 */
export const WithCenter: Story = {
  args: {
    center: (
      <>
        <span className="text-content-subtle text-sm">Average</span>
        <span className="text-content-emphasized text-3xl font-semibold">64%</span>
      </>
    ),
  },
}

/**
 * Click a ring's key to switch it off.
 *
 * Two things are worth watching. The survivors keep the colors they already had
 * — color is assigned over the full series list and hiding is a filter applied
 * afterwards — and the remaining rings *thicken* to fill the space rather than
 * leaving a hole where the hidden one was, because the band count is what the
 * geometry is derived from.
 */
export const InteractiveLegend: Story = {
  args: { interactiveLegend: true },
}

/** A vertical legend beside the rings, which is what a long list wants. */
export const VerticalLegend: Story = {
  args: { legend: 'vertical', interactiveLegend: true },
}

/**
 * Where it stops working.
 *
 * At eight rings the bands are thin enough that the color is hard to match
 * against the legend, and the innermost arcs are short enough that comparing
 * them is guesswork. `VerticalBar` stays readable at any count and puts every
 * value on one baseline; reach for it when the exact comparison is the point
 * rather than the shape.
 */
export const TooManyRings: Story = {
  args: { data: radialData(8), label: 'Rollout completion by team, eight rings' },
}
