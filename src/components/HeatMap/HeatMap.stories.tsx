import type { Meta, StoryObj } from '@storybook/react-vite'

import { HeatMap } from './HeatMap'
import { heatMapData } from '../Chart/sample-data'

const DATA = heatMapData()

const meta = {
  title: 'Data Viz/HeatMap',
  component: HeatMap,
  argTypes: {
    scale: { control: 'inline-radio', options: ['a', 'b', 'c'] },
    cellHeight: { control: { type: 'range', min: 16, max: 56, step: 4 } },
  },
  args: {
    rows: DATA.rows,
    columns: DATA.columns,
    values: DATA.values,
    label: 'Sessions by day of week and hour',
    valueLabel: 'Sessions',
    scale: 'a',
    cellHeight: 32,
  },
} satisfies Meta<typeof HeatMap>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma's chart: a week by hour, with the gradient legend above it.
 *
 * That legend is `ChartLegend type="gradient"`, built in PR 1 and used here for
 * the first time — a continuous key for a continuous scale. Hover any cell for
 * its exact value; without that, a cell shows a colour and nothing else.
 *
 * Note the empty cells. Figma draws nothing where there is no data, and so does
 * this: painting a missing value with the lightest step would claim a
 * measurement of "almost none" where there was no measurement at all.
 */
export const Playground: Story = {}

/**
 * The three sequential ramps.
 *
 * All three encode **magnitude** — one hue getting darker. The twelve
 * categorical colours would be wrong here whatever they looked like: they say
 * two things are different *kinds*, and 9am and 10am are the same kind of thing
 * in different amounts.
 */
export const Scales: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      {(['a', 'b', 'c'] as const).map((scale) => (
        <figure key={scale} className="flex flex-col gap-2">
          <figcaption className="text-content-subtle font-mono text-sm">scale {scale}</figcaption>
          <HeatMap {...args} scale={scale} cellHeight={24} />
        </figure>
      ))}
    </div>
  ),
}

/**
 * A small grid, and why the domain is computed once over the whole chart.
 *
 * Scaling per row would make every row's darkest cell equally dark and destroy
 * the comparison the chart exists for — the most common way a heat map is made
 * meaningless. `min` and `max` are the escape hatch, for holding the scale still
 * across two charts that have to be compared.
 */
export const SmallGrid: Story = {
  args: {
    rows: ['Q1', 'Q2', 'Q3', 'Q4'],
    columns: ['North', 'South', 'East', 'West'],
    values: [
      [120, 340, 210, 90],
      [180, 420, 260, 140],
      [210, 380, 300, null],
      [160, 460, 240, 110],
    ],
    label: 'Revenue by quarter and region',
    valueLabel: 'Revenue',
    cellHeight: 48,
    legend: { start: 'Quiet', end: 'Busy' },
  },
}
