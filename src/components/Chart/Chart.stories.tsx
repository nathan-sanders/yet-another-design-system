import type { Meta, StoryObj } from '@storybook/react-vite'

import { ChartSwatch, type ChartSwatchShape } from './Swatch'
import { ChartLegend } from './ChartLegend'
import { ChartTooltip } from './ChartTooltip'
import { categorical, categoricalScale } from './palette'
import { chartMarkers } from './shapes'

/**
 * The pieces every chart is made of: the swatch that stands for a series, the
 * legend that names them, and the tooltip that gives the exact numbers.
 *
 * These are shown on their own because they are shared — a change here lands in
 * every chart in the library at once, so it is worth being able to look at them
 * without a chart around them.
 */
const meta = {
  title: 'Data Viz/Chart',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const SHAPES: ChartSwatchShape[] = [...chartMarkers, 'colorSwatch', 'solidLine', 'dashedLine']

/**
 * All fourteen swatch styles, in the series colour.
 *
 * The eleven markers draw a rule with a shape on it — the key for a line chart,
 * saying both the colour and the point shape at once. `colorSwatch` is the key
 * for a chart made of areas (a donut slice, a bar), where there is no line to
 * echo. The two line styles are for a series drawn without points, and for
 * benchmarks.
 *
 * Note what happens under a hollow marker: the rule splits, because at this size
 * an outline shape is a genuine ring and a continuous rule would strike through
 * it.
 */
export const Swatches: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
      {SHAPES.map((shape, i) => (
        <div key={shape} className="flex items-center gap-2">
          <ChartSwatch shape={shape} color={categorical(i % 12)} />
          <span className="text-content-subtle font-mono text-sm">{shape}</span>
        </div>
      ))}
    </div>
  ),
}

/** The twelve categorical colours, in the fixed order a chart assigns them. */
export const CategoricalScale: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-wrap gap-3">
      {categoricalScale.map((color, i) => (
        <div key={color} className="flex items-center gap-2">
          <ChartSwatch shape="colorSwatch" color={color} />
          <span className="text-content-subtle font-mono text-sm tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>
        </div>
      ))}
    </div>
  ),
}

const SERIES = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'signups', label: 'Signups' },
  { key: 'conversions', label: 'Conversions' },
]

/** Twelve, to show where the categorical scale runs out and the legend says so. */
const MANY_SERIES = Array.from({ length: 12 }, (_, i) => ({
  key: `series-${i}`,
  label: `Dataset ${i + 1}`,
}))

/**
 * The four legend types.
 *
 * The two categorical ones name series. The two continuous ones label the ends
 * of a sequential ramp instead, because a magnitude scale has no categories to
 * name — `stepped` for a chart that paints in the ten discrete steps, `gradient`
 * for one that is genuinely continuous. Using the wrong one tells the reader
 * they can read a value between two steps when they cannot.
 */
export const Legends: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-col gap-10">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">horizontal</figcaption>
        <ChartLegend type="horizontal" series={SERIES} />
      </figure>

      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">vertical</figcaption>
        <ChartLegend type="vertical" series={SERIES} />
      </figure>

      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">stepped</figcaption>
        <ChartLegend type="stepped" startLabel="Low" endLabel="High" />
      </figure>

      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">gradient</figcaption>
        <ChartLegend type="gradient" startLabel="Low" endLabel="High" />
      </figure>

      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">
          twelve series, capped at six — the rest collapse rather than repeat a colour
        </figcaption>
        <ChartLegend type="horizontal" max={6} series={MANY_SERIES} />
      </figure>
    </div>
  ),
}

/**
 * The tooltip card, rendered outside a chart so it can be inspected at rest.
 *
 * Values are mono and tabular so a column of them aligns; names are the sans the
 * rest of the library uses. Neither wears the series colour — identity comes
 * from the swatch beside the name, because several of the twelve hues are
 * illegible as text on the canvas.
 */
export const Tooltip: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      <ChartTooltip
        active
        series={SERIES}
        label="Jan 17"
        payload={[
          { dataKey: 'sessions', value: 1943 },
          { dataKey: 'signups', value: 1544 },
          { dataKey: 'conversions', value: 312 },
        ]}
      />

      <ChartTooltip
        active
        showTotal
        series={SERIES}
        label="Jan 17"
        payload={[
          { dataKey: 'sessions', value: 1943 },
          { dataKey: 'signups', value: 1544 },
          { dataKey: 'conversions', value: 312 },
        ]}
      />
    </div>
  ),
}
