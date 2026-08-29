import type { Meta, StoryObj } from '@storybook/react-vite'

import { Radar } from './Radar'
import { radarData } from '../Chart/sample-data'

const SERIES = [
  { key: 'modelA', label: 'Model A' },
  { key: 'modelB', label: 'Model B' },
  { key: 'modelC', label: 'Model C' },
]

const meta = {
  title: 'Data Viz/Radar',
  component: Radar,
  argTypes: {
    showScale: { control: 'boolean' },
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    interactiveLegend: { control: 'boolean' },
    height: { control: { type: 'range', min: 200, max: 520, step: 20 } },
  },
  args: {
    data: radarData(5),
    axisKey: 'dimension',
    series: SERIES,
    label: 'Three models compared across five dimensions',
    showScale: false,
    legend: 'horizontal',
    height: 340,
  },
} satisfies Meta<typeof Radar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma's pentagon grid: five concentric rings in `Surface/Border`, with the
 * outermost in `Surface/Border Emphasized` — the same gridline-versus-baseline
 * distinction the cartesian charts make.
 *
 * That emphasis takes two elements. Recharts' `PolarGrid` paints every ring one
 * colour, so the heavier boundary comes from `PolarAngleAxis`'s own `axisLine`
 * drawn as a polygon over the top.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="w-100">
      <Radar {...args} />
    </div>
  ),
}

/**
 * Five points and six — Figma's `_Radar Grid` offers exactly these two, and the
 * range is honest rather than arbitrary. Past about eight axes the polygon
 * approximates a circle and the dimensions stop being distinguishable.
 */
export const Points: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-8">
      <figure className="flex w-100 flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">5 points</figcaption>
        <Radar {...args} data={radarData(5)} />
      </figure>
      <figure className="flex w-100 flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">6 points</figcaption>
        <Radar {...args} data={radarData(6)} label="Three models compared across six dimensions" />
      </figure>
    </div>
  ),
}

/**
 * `showScale` — Figma's `Polar Axis` boolean.
 *
 * Off by default: on a radar the *shape* is the message, and a ladder of numbers
 * running through the middle competes with the shapes for exactly the space they
 * need. Turn it on when a reader has to read values off the chart rather than
 * compare outlines.
 */
export const WithScale: Story = {
  args: { showScale: true },
  render: (args) => (
    <div className="w-100">
      <Radar {...args} />
    </div>
  ),
}

/**
 * Why radar areas are translucent where `AreaSeries`'s `solid` fill is opaque.
 *
 * A cartesian area chart stacks front to back, so ordering the series largest
 * first keeps them all visible. A radar's shapes overlap in every direction at
 * once and **no paint order exists** that keeps them readable — translucency is
 * the only thing that works, which is also why a radar tolerates more
 * overlapping series than an area chart does.
 *
 * Figma sets `opacity: 0.4` on the whole area, fill and stroke alike. The
 * outline still reads stronger because the 2px stroke composites over the fill
 * beneath it, landing the edge near 0.64 while the interior stays at 0.4.
 */
export const Overlap: Story = {
  args: { interactiveLegend: true },
  render: (args) => (
    <div className="w-100">
      <Radar {...args} />
    </div>
  ),
}
