import { Ellipsis } from 'lucide-react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { LineSeries } from './LineSeries'
import { dailyData, hourlyData, monthlyData } from '../Chart/sample-data'
import { BentoGrid } from '../BentoGrid'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'

const SERIES = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'signups', label: 'Signups' },
  { key: 'conversions', label: 'Conversions' },
]

const meta = {
  title: 'Data Viz/LineSeries',
  component: LineSeries,
  argTypes: {
    interpolation: { control: 'inline-radio', options: ['curve', 'linear'] },
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    showPoints: { control: 'boolean' },
    yLines: { control: { type: 'range', min: 2, max: 8, step: 1 } },
    height: { control: { type: 'range', min: 120, max: 480, step: 20 } },
  },
  args: {
    data: dailyData(31),
    xKey: 'date',
    series: SERIES,
    label: 'Sessions, signups and conversions over 31 days',
    interpolation: 'curve',
    showPoints: true,
    yLines: 5,
    legend: 'horizontal',
    height: 280,
  },
} satisfies Meta<typeof LineSeries>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Thirty-one days, three series — the chart Figma draws, with controls.
 *
 * Use the Theme switch in the toolbar for dark mode: the series colours are
 * semantic tokens, so they swap themselves and there is no `dark:` variant
 * anywhere in this component. The Neutral switch moves the grid and the axis
 * labels but deliberately leaves the series alone — a chart's categories are not
 * part of the UI's neutral.
 */
export const Playground: Story = {}

/**
 * Curve against linear.
 *
 * `curve` is Recharts' *monotone* interpolation rather than a plain spline, and
 * the difference matters: a monotone curve cannot overshoot a data point, so it
 * never draws a peak higher than anything that was measured. A plain cubic
 * would, which is a chart telling a small lie in order to look smooth.
 */
export const Interpolation: Story = {
  render: (args) => (
    <div className="flex max-w-4xl flex-col gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">curve — monotone, cannot overshoot</figcaption>
        <LineSeries {...args} interpolation="curve" data={dailyData(14)} />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">linear</figcaption>
        <LineSeries {...args} interpolation="linear" data={dailyData(14)} />
      </figure>
    </div>
  ),
}

/**
 * The three x-axis presets, each inferred from the data rather than declared.
 *
 * Figma models these as 26 component variants because it cannot compute a tick.
 * Here the same three rules fall out of the values: hours when the span is under
 * two days, days under about three months, months beyond that. The month name is
 * written only where it changes.
 */
export const AxisPresets: Story = {
  render: (args) => (
    <div className="flex max-w-4xl flex-col gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">24 hours</figcaption>
        <LineSeries
          {...args}
          data={hourlyData()}
          series={[{ key: 'sessions', label: 'Sessions' }]}
          label="Sessions over 24 hours"
          height={200}
        />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">31 days</figcaption>
        <LineSeries {...args} data={dailyData(31)} height={200} />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">12 months</figcaption>
        <LineSeries
          {...args}
          data={monthlyData()}
          series={[
            { key: 'sessions', label: 'Sessions' },
            { key: 'signups', label: 'Signups' },
          ]}
          label="Sessions and signups over 12 months"
          height={200}
        />
      </figure>
    </div>
  ),
}

/**
 * A benchmark is not a series.
 *
 * It takes the chromaless benchmark grey and a dashed line, and — the part worth
 * noticing — it does **not** consume a categorical slot. Adding a target to a
 * chart leaves every real series the colour it already had.
 */
export const WithBenchmark: Story = {
  render: (args) => (
    <div className="max-w-4xl">
      <LineSeries
        {...args}
        data={dailyData(14)}
        series={[
          { key: 'sessions', label: 'Sessions' },
          { key: 'signups', label: 'Signups' },
          { key: 'conversions', label: 'Target', benchmark: true },
        ]}
        label="Sessions and signups against target, over 14 days"
      />
    </div>
  ),
}

/**
 * Dense data, with the points turned off.
 *
 * Past roughly forty points per series the markers stop separating anything and
 * merge into a thick band along the line. The shape is still doing the work, so
 * drop them.
 */
export const Dense: Story = {
  args: {
    data: dailyData(90),
    showPoints: false,
    label: 'Sessions, signups and conversions over 90 days',
  },
}

/**
 * Narrow, below Figma's 600px `Chart Breakpoint`.
 *
 * Nothing is declared here — the container measures itself and the x axis drops
 * to six labels. This is what the wide/narrow half of Figma's 26 axis variants
 * becomes in code.
 */
export const Narrow: Story = {
  render: (args) => (
    <div className="w-[420px]">
      <LineSeries {...args} data={dailyData(31)} legend="vertical" />
    </div>
  ),
}

/**
 * One data point.
 *
 * **The legend stays.** It does not depend on how much data there is — it names
 * the series, and a series with one reading is still a series. A chart that
 * dropped its key as soon as a filter narrowed to a single day would be at its
 * least readable exactly when it changed.
 *
 * Two things had to be fixed for this case, and both were invisible until a
 * chart was actually drawn with one row:
 *
 * - **The x label was the raw ISO string.** A lone date has no span to measure,
 *   so the preset fell through to `categories`, and a category is passed to the
 *   axis untouched: `2026-01-01T00:00:00.000Z` under a single mark.
 * - **The y scale was not round.** One value of 1,800 gave Recharts the ticks 0,
 *   450, 900, 1.4k, 1.8k. The axis now rounds its top to a number that divides
 *   evenly by the gridline count, which makes every tick round at once.
 */
export const SinglePoint: Story = {
  render: (args) => (
    <div className="flex max-w-4xl flex-col gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">one point, three series</figcaption>
        <LineSeries {...args} data={dailyData(1)} label="Sessions, signups and conversions for one day" />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">one point, one series</figcaption>
        <LineSeries
          {...args}
          data={dailyData(1)}
          series={[{ key: 'sessions', label: 'Sessions' }]}
          label="Sessions for one day"
        />
      </figure>
    </div>
  ),
}

/**
 * `legend={false}` — the deliberate opt-out.
 *
 * The legend is on by default for every chart, whatever its series count and
 * whatever its data length, and that is the right default: it is the identity
 * channel a reader who cannot separate two hues depends on, and the one that
 * survives greyscale.
 *
 * Turning it off is for the case where something *else* already names the
 * series — a caption, a heading, a surrounding table — so the box would repeat
 * a label the reader has just read. It is a statement that the naming happens
 * elsewhere, not a way to save space.
 */
export const WithoutLegend: Story = {
  render: (args) => (
    <figure className="flex max-w-4xl flex-col gap-2">
      <figcaption className="text-content-emphasized text-base font-semibold">Sessions</figcaption>
      <LineSeries
        {...args}
        data={dailyData(14)}
        series={[{ key: 'sessions', label: 'Sessions' }]}
        label="Sessions over 14 days"
        legend={false}
      />
    </figure>
  ),
}

/**
 * The dashboard the charts are for — `BentoGrid` and `ContentBlock`, both of
 * which already existed, with charts as their content.
 *
 * This is the composition Figma's `Examples` frame draws, and it is the point of
 * the whole exercise: a chart is ordinary content inside a block, so it needs no
 * card, no title and no menu of its own. Those belong to `ContentBlock`, which
 * already has them.
 */
export const Dashboard: Story = {
  render: () => (
    <BentoGrid columns={4}>
      <BentoGrid.Cell colSpan={4}>
        <ContentBlock>
          <ContentBlock.Header
            actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Block options" />}
          >
            Line series
          </ContentBlock.Header>
          <ContentBlock.Content>
            <LineSeries
              data={dailyData(31)}
              xKey="date"
              series={SERIES}
              label="Sessions, signups and conversions over 31 days"
              height={260}
            />
          </ContentBlock.Content>
        </ContentBlock>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <ContentBlock>
          <ContentBlock.Header
            actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Block options" />}
          >
            Last 24 hours
          </ContentBlock.Header>
          <ContentBlock.Content>
            <LineSeries
              data={hourlyData()}
              xKey="date"
              series={[{ key: 'sessions', label: 'Sessions' }]}
              label="Sessions over the last 24 hours"
              height={200}
            />
          </ContentBlock.Content>
        </ContentBlock>
      </BentoGrid.Cell>

      <BentoGrid.Cell colSpan={2}>
        <ContentBlock>
          <ContentBlock.Header
            actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Block options" />}
          >
            This year
          </ContentBlock.Header>
          <ContentBlock.Content>
            <LineSeries
              data={monthlyData()}
              xKey="date"
              series={[
                { key: 'sessions', label: 'Sessions' },
                { key: 'signups', label: 'Signups' },
              ]}
              label="Sessions and signups over 12 months"
              height={200}
            />
          </ContentBlock.Content>
        </ContentBlock>
      </BentoGrid.Cell>
    </BentoGrid>
  ),
}
