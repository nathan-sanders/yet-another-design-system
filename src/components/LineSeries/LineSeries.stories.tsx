import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { LineSeries } from './LineSeries'
import { dailyData, hourlyData, monthlyData } from '../Chart/sample-data'
import { onSurface } from '../Chart/story-surface'
import { Text } from '../Text'

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
  decorators: [onSurface],
} satisfies Meta<typeof LineSeries>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Thirty-one days, three series — the chart Figma draws, with controls.
 *
 * Use the Theme switch in the toolbar for dark mode: the series colors are
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
 * It takes the chromaless benchmark gray and a dashed line, and — the part worth
 * noticing — it does **not** consume a categorical slot. Adding a target to a
 * chart leaves every real series the color it already had.
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
  parameters: { surfaceWidth: 'w-[420px]' },
  render: (args) => <LineSeries {...args} data={dailyData(31)} legend="vertical" />,
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
 * survives grayscale.
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

/** "Jan 5", in UTC like the axis — see `formatDateTick`. */
const day = (row: Record<string, unknown>) =>
  new Date(String(row.date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** Move the pointer to an element's center and click there, in one gesture. */
async function clickAt(element: Element) {
  const box = element.getBoundingClientRect()
  const coords = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }
  await userEvent.pointer([{ target: element, coords }, { keys: '[MouseLeft]', target: element, coords }])
}

/**
 * A day that opens something — `onPointClick`.
 *
 * A line is too thin to aim at, so a click anywhere in a day's column counts,
 * the same column the tooltip answers for. On a dot it also says which series;
 * off one, with three series drawn, it cannot, and leaves `series` unset. From
 * the keyboard: tab to the chart, arrow along the days, Enter. A screen reader
 * gets a button per day in the hidden table.
 */
export const PointClick: Story = {
  render: function Render(args) {
    const [opened, setOpened] = useState<string>()
    return (
      <div className="flex flex-col gap-4">
        <LineSeries
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

    await step('a click on a dot opens that day, for that series', async () => {
      // Hover the fifth day's first dot, then click the second series' active dot.
      const dot = canvasElement.querySelectorAll('.recharts-line-dots')[0]!.children[4]!
      const box = dot.getBoundingClientRect()
      await userEvent.pointer({ target: dot, coords: { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 } })
      const active = await waitFor(() => {
        const found = canvasElement.querySelectorAll('.recharts-active-dot')
        expect(found).toHaveLength(3)
        return found
      })
      // The dot is the circle inside Recharts' `.recharts-active-dot` group,
      // and that circle is where its handler is.
      await clickAt(active[1]!.firstElementChild!)
      await expect(status).toHaveTextContent('Opened Jan 5 · Signups (row 4)')
    })

    await step('Enter on the focused chart opens the day the tooltip is on', async () => {
      await userEvent.unhover(canvasElement.querySelector('.recharts-surface')!)
      canvasElement.querySelector<SVGElement>('.recharts-surface')!.focus()
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      await waitFor(() => expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent('Jan 4'))
      await userEvent.keyboard('{Enter}')
      await expect(status).toHaveTextContent('Opened Jan 4 · every series (row 3)')
    })

    await step('the hidden table has a button per day', async () => {
      await userEvent.click(within(canvasElement.querySelector('table')!).getByRole('button', { name: 'Jan 7' }))
      await expect(status).toHaveTextContent('Opened Jan 7 · every series (row 6)')
    })
  },
}

/** A sprint burndown on day 6 of 11: `remaining` stops at today, `ideal` runs to the end. */
const burndown = Array.from({ length: 11 }, (_, i) => ({
  day: `Day ${i + 1}`,
  remaining: [12, 12, 11, 10, 9, 9][i],
  ideal: 12 - (12 / 10) * i,
}))

/**
 * A series with gaps — rows that have no value for it.
 *
 * A burndown halfway through its sprint is the ordinary case: the ideal line
 * runs to the last day, and the remaining work stops at today. The line breaks
 * where the values stop, and so do the points. A row with no value for a series
 * draws nothing for it; it used to put that series' marker on the top edge of
 * the plot, one per missing day (Yet Project's FINDINGS 105).
 */
export const MissingValues: Story = {
  args: {
    data: burndown,
    xKey: 'day',
    xPreset: 'categories',
    interpolation: 'linear',
    series: [
      { key: 'remaining', label: 'Remaining' },
      { key: 'ideal', label: 'Ideal', dashed: true, marker: false },
    ],
    label: 'Sprint burndown: tasks remaining against the ideal',
  },
  play: async ({ canvasElement }) => {
    const dots = canvasElement.querySelector('.recharts-line-dots')!
    await expect(dots.children).toHaveLength(6)

    // The top gridline is the plot's top edge; no marker is anywhere near it.
    const lines = [...canvasElement.querySelectorAll('.recharts-cartesian-grid-horizontal line')]
    const top = Math.min(...lines.map((line) => line.getBoundingClientRect().top))
    for (const dot of dots.children) {
      const box = dot.getBoundingClientRect()
      await expect(box.top + box.height / 2).toBeGreaterThan(top + 20)
    }
  },
}

/**
 * Thirty days across a month, at the breakpoint.
 *
 * Every other day is labeled, and the month is written once, where it changes
 * between two labels: "31", "Nov 2", "4". The axis used to compare each label
 * with the row before it rather than the label before it, so every label from
 * Nov 2 to Nov 12 wrote the month — and at 600px "Nov 10" and "Nov 12" ran into
 * each other (Yet Project's FINDINGS 106). The rule is pinned in
 * `Chart/axes.test.ts`; this story measures the labels on screen.
 */
export const AcrossMonths: Story = {
  // 600 inside the surface's 16px padding, so the chart is exactly wide.
  parameters: { surfaceWidth: 'w-[632px]' },
  args: {
    data: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 9, 21 + i)).toISOString(),
      completed: [6, 7, 5, 8, 6, 3, 2][i % 7],
      overdue: 3 + (i % 4),
    })),
    series: [
      { key: 'completed', label: 'Completed', marker: false },
      { key: 'overdue', label: 'Overdue', marker: false },
    ],
    showPoints: false,
    label: 'Tasks completed and overdue each day, last 30 days',
  },
  play: async ({ canvasElement }) => {
    const ticks = await waitFor(() => {
      const found = [...canvasElement.querySelectorAll('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-label')]
      expect(found).toHaveLength(15)
      return found
    })
    await expect(ticks.map((tick) => tick.textContent)).toEqual([
      'Oct 21', '23', '25', '27', '29', '31', 'Nov 2', '4', '6', '8', '10', '12', '14', '16', '18',
    ])

    const boxes = ticks.map((tick) => tick.querySelector('text')!.getBoundingClientRect())
    for (let i = 1; i < boxes.length; i++) {
      await expect(boxes[i]!.left).toBeGreaterThan(boxes[i - 1]!.right)
    }
  },
}
