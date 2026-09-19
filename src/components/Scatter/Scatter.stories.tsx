import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'

import { Scatter, type ScatterSeries } from './Scatter'
import { scatterData } from '../Chart/sample-data'

const SAMPLE = scatterData()
const QUADRANT_LABELS = { top: 'High impact', bottom: 'Low impact', left: 'Low effort', right: 'High effort' }

/** The number of points a story draws, for the assertions. */
const pointCount = (series: readonly ScatterSeries[]) => series.reduce((n, s) => n + s.points.length, 0)

/** The markers Recharts drew, one per point. Every marker shape is a `<g>`-free element inside a scatter symbol layer. */
const markers = (canvasElement: HTMLElement) =>
  canvasElement.querySelectorAll('.recharts-scatter-symbol > :is(rect, circle, polygon, path, line, g)')

const meta = {
  title: 'Data Viz/Scatter',
  component: Scatter,
  argTypes: {
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    yLines: { control: { type: 'range', min: 2, max: 8, step: 1 } },
    height: { control: { type: 'range', min: 160, max: 480, step: 20 } },
  },
  args: {
    series: SAMPLE,
    label: 'Signups against spend, by campaign',
    xLabel: 'Spend',
    yLabel: 'Signups',
    yLines: 5,
    legend: 'horizontal',
    height: 280,
  },
} satisfies Meta<typeof Scatter>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Three campaigns, spend against signups — the plain form, with controls.
 *
 * Every point is one of the file's plot points: an 8px marker from the cycle,
 * hollow every other series, in the categorical color the series' position
 * gives it. Hover one and it grows to the swatch's 12px, and the tooltip names
 * the series and gives both measures. Nothing here is a scatter-only rule; it
 * is `LineSeries`' plot point with the line taken away.
 *
 * The Theme switch in the toolbar swaps the tokens; nothing in the component
 * changes.
 */
export const Playground: Story = {
  play: async ({ canvasElement, args }) => {
    // A marker per point, and no more — the claim the story is named for.
    await waitFor(() => expect(markers(canvasElement).length).toBe(pointCount(args.series)))
  },
}

/**
 * The quadrant form.
 *
 * `quadrant` swaps the grid and the tick labels for a crosshair with a label
 * at each end — `_Quadrant Grid` in the file — because a threshold is a line
 * the reader compares against, not a number they look up. The thresholds
 * default to the middle of each axis, which is what the file draws; see
 * `QuadrantThresholds` for putting the lines where the decision actually is.
 * The hidden data table gains a `Quadrant` column so a screen reader gets the
 * box the crosshair encodes by position.
 *
 * The domain is pinned from every series, including any switched off in the
 * legend, so hiding one cannot move the crosshair.
 */
export const Quadrant: Story = {
  args: {
    label: 'Signups against spend, by campaign, split down the middle of each axis',
    quadrant: { labels: QUADRANT_LABELS },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(markers(canvasElement).length).toBe(pointCount(args.series)))

    // Two reference lines, four end labels, in the file's words.
    const lines = canvasElement.querySelectorAll('.recharts-reference-line line')
    expect(lines.length).toBe(2)
    for (const end of ['top', 'bottom', 'left', 'right'] as const) {
      const plate = canvasElement.querySelector(`[data-quadrant-label="${end}"]`)
      expect(plate?.textContent).toBe(QUADRANT_LABELS[end])
    }

    // No gridlines and no tick labels in this form: the crosshair is the only rule.
    expect(canvasElement.querySelector('.recharts-cartesian-grid')).toBeNull()
    expect(canvasElement.querySelectorAll('.recharts-cartesian-axis-tick').length).toBe(0)

    // The table says which box each point is in.
    const table = canvas.getByRole('table', { name: args.label })
    expect(within(table).getByRole('columnheader', { name: 'Quadrant' })).toBeInTheDocument()
    expect(within(table).getAllByRole('cell', { name: /impact · .* effort/ }).length).toBe(pointCount(args.series))
  },
}

/**
 * The crosshair where the decision is.
 *
 * A threshold is rarely the middle of the axis: here the lines sit at 1,000
 * of spend and 300 signups, and every point's box in the hidden table moves
 * with them. This is the half of the form Figma cannot draw — `_Quadrant
 * Grid`'s lines are pinned to the center of their frame — so the file shows
 * the default and the code carries the number.
 */
export const QuadrantThresholds: Story = {
  args: {
    label: 'Signups against spend, by campaign, split at 1,000 spend and 300 signups',
    quadrant: { x: 1000, y: 300, labels: QUADRANT_LABELS },
  },
}

/**
 * Points with names.
 *
 * A point's `label` becomes the tooltip's heading — the region, the product,
 * the person — and the series drops to a swatch row underneath it, so the
 * card reads "West / Email / Spend / Signups" rather than naming the series
 * twice. Only the third series is named here, which is the ordinary case: a
 * cloud of anonymous observations and a handful the reader will ask about.
 */
export const LabeledPoints: Story = {
  args: {
    series: [SAMPLE[2], SAMPLE[0]],
    label: 'Signups against spend, email by region against search',
  },
}

/**
 * One series.
 *
 * **The legend stays**, as it does on every chart in the family: the swatch is
 * what says which color and marker mean the thing the title names. That is
 * also why the marker is a solid square — the first shape in the cycle — and
 * not a plain dot. A single-series scatter is still a series.
 */
export const SingleSeries: Story = {
  args: {
    series: [SAMPLE[0]],
    label: 'Signups against spend, search campaigns',
  },
}

/**
 * Thirteen series.
 *
 * The categorical scale runs out at twelve and **returns the placeholder gray
 * rather than wrapping** — two series sharing a color is worse than admitting
 * the scale is spent. The marker cycle is longer than the color one on
 * purpose: eleven shapes against twelve hues, so the second identity channel
 * keeps separating pairs the first has started to repeat. Thirteen series on
 * one scatter is the point at which to facet.
 */
export const ManySeries: Story = {
  args: {
    series: Array.from({ length: 13 }, (_, i) => ({
      key: `campaign-${i + 1}`,
      label: `Campaign ${i + 1}`,
      points: scatterData(30 + i)[i % 2].points.slice(0, 8),
    })),
    label: 'Signups against spend, thirteen campaigns',
  },
}

/**
 * Click a legend row to switch a series off.
 *
 * The survivors keep their colors and their markers — color is assigned from
 * position in the full list before the filter, never re-flowed over what is
 * visible. Overlapping clouds are the case this exists for: switching one off
 * is how you read the other two.
 */
export const InteractiveLegend: Story = {
  args: { interactiveLegend: true },
}

/**
 * Under Figma's 600px breakpoint.
 *
 * Nothing is declared — the container measures itself and the x axis drops
 * from five ticks to three. The top of the axis does not move: it is rounded
 * for four intervals, which also divide by two, so a chart crossing the
 * breakpoint keeps its scale and only sheds labels.
 */
export const Narrow: Story = {
  render: (args) => (
    <div className="w-[420px]">
      <Scatter {...args} legend="vertical" />
    </div>
  ),
}

/**
 * Without the legend — for when something else already names the series.
 *
 * A caption, a heading, a surrounding table. The key is not being dropped to
 * save space; the naming has moved.
 */
export const WithoutLegend: Story = {
  args: {
    legend: false,
    series: [SAMPLE[0]],
    label: 'Signups against spend, search campaigns',
  },
  render: (args) => (
    <figure className="flex max-w-4xl flex-col gap-2">
      <figcaption className="text-content-primary text-base font-semibold">Search campaigns</figcaption>
      <Scatter {...args} />
    </figure>
  ),
}
