import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { HorizontalBar } from './HorizontalBar'
import { channelData, longLabelData, sliceData } from '../Chart/sample-data'
import { onSurface } from '../Chart/story-surface'
import { Text } from '../Text'

const SERIES = [
  { key: 'conversions', label: 'Conversions' },
  { key: 'signups', label: 'Signups' },
  { key: 'sessions', label: 'Sessions' },
]

const meta = {
  title: 'Data Viz/HorizontalBar',
  component: HorizontalBar,
  argTypes: {
    stacked: { control: 'boolean' },
    showTotal: { control: 'boolean' },
    accessibilityOverlay: { control: 'boolean' },
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    xLines: { control: { type: 'range', min: 2, max: 8, step: 1 } },
    height: { control: { type: 'range', min: 120, max: 720, step: 20 } },
  },
  args: {
    data: sliceData(8),
    yKey: 'browser',
    series: [{ key: 'sessions', label: 'Sessions' }],
    label: 'Sessions by browser',
    stacked: false,
    xLines: 5,
    legend: 'horizontal',
  },
  decorators: [onSurface],
} satisfies Meta<typeof HorizontalBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A ranked list of named things — the case the chart is for. Eight browsers,
 * one bar each, every row labeled, and no `height` passed: the chart is as
 * tall as its rows, the way a table is.
 */
export const Playground: Story = {}

/**
 * Stacked against grouped, with VerticalBar's three series on named
 * categories instead of days. `stacked` is the same claim about data it is
 * there: the parts sum to something. A grouped row grows to keep each of its
 * bars at 16, which is why the second chart is the taller one.
 */
export const StackedAndGrouped: Story = {
  render: (args) => (
    <div className="flex max-w-4xl flex-col gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">stacked — the parts sum to something</figcaption>
        <HorizontalBar {...args} stacked data={channelData()} yKey="channel" series={SERIES} label="Sessions, signups and conversions by channel" />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">grouped — the default; no total claimed</figcaption>
        <HorizontalBar {...args} stacked={false} data={channelData()} yKey="channel" series={SERIES} label="Sessions, signups and conversions by channel" />
      </figure>
    </div>
  ),
}

/**
 * The reason this chart exists over VerticalBar. A column label has a 24px bar
 * to sit under and has to abbreviate, tilt or drop out; a row label has the
 * whole row. The axis measures its own width from the longest label — there is
 * no cap, so a label this long takes the room it needs from the plot.
 */
export const LongLabels: Story = {
  args: {
    data: longLabelData(),
    yKey: 'question',
    series: [{ key: 'responses', label: 'Responses' }],
    label: 'Help center questions by number of responses',
  },
}

/**
 * Twenty rows, and every one of them labeled. A date axis thins its labels
 * when the points are closer than the labels are wide; a category row is as
 * tall as its label, so a chart with more rows is taller, not sparser.
 */
export const ManyCategories: Story = {
  render: (args) => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      country: ['Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Poland', 'Belgium', 'Austria', 'Denmark', 'Norway', 'Finland', 'Portugal', 'Ireland', 'Greece', 'Czechia', 'Hungary', 'Romania', 'Croatia', 'Estonia'][i],
      sessions: Math.round(2200 * Math.exp(-i / 6)),
    }))
    return (
      <HorizontalBar {...args} data={data} yKey="country" series={[{ key: 'sessions', label: 'Sessions' }]} label="Sessions by country" />
    )
  },
}

/**
 * `accessibilityOverlay`, the sanctioned mitigation for the three categorical
 * colors that fall short of 3:1 on the light canvas — the same story as
 * VerticalBar's, on rows.
 */
export const AccessibilityBorder: Story = {
  render: (args) => {
    const series = Array.from({ length: 5 }, (_, i) => ({ key: `s${i}`, label: `Dataset ${i + 1}` }))
    const data = Array.from({ length: 6 }, (_, row) => {
      const entry: Record<string, unknown> = { name: `Category ${row + 1}` }
      for (let i = 0; i < 5; i++) entry[`s${i}`] = 40 + ((row * 11 + i * 17) % 70)
      return entry
    })
    return (
      <div className="flex max-w-4xl flex-col gap-8">
        <figure className="flex flex-col gap-2">
          <figcaption className="text-content-subtle font-mono text-sm">off — the default</figcaption>
          <HorizontalBar {...args} stacked data={data} series={series} yKey="name" label="Without border" />
        </figure>
        <figure className="flex flex-col gap-2">
          <figcaption className="text-content-subtle font-mono text-sm">on</figcaption>
          <HorizontalBar {...args} stacked accessibilityOverlay data={data} series={series} yKey="name" label="With border" />
        </figure>
      </div>
    )
  },
}

/**
 * A bar that opens something — `onBarClick`.
 *
 * A click on a bar carries its row and its series. From the keyboard — tab to
 * the chart, arrow through the rows, Enter — and from the hidden table's
 * buttons, a grouped chart opens the row, and `series` stays unset because
 * nothing says which of its bars was meant.
 */
export const BarClick: Story = {
  args: { data: channelData(), yKey: 'channel', series: SERIES, label: 'Sessions, signups and conversions by channel' },
  render: function Render(args) {
    const [opened, setOpened] = useState<string>()
    return (
      <div className="flex flex-col gap-4">
        <HorizontalBar
          {...args}
          onBarClick={({ row, index, series }) =>
            setOpened(`${String(row.channel)} · ${series?.label ?? 'every series'} (row ${index})`)
          }
        />
        <Text role="status" size="sm" color="subtle">
          {opened ? `Opened ${opened}` : 'Click a bar'}
        </Text>
      </div>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole('status')

    await step('a click on a bar opens its row, for its series', async () => {
      const signups = canvasElement.querySelectorAll('.recharts-bar')[1]!
      await userEvent.click(signups.querySelectorAll('.recharts-bar-rectangle')[1]!)
      await expect(status).toHaveTextContent('Opened Direct · Signups (row 1)')
    })

    await step('Enter on the focused chart opens the row the tooltip is on', async () => {
      await userEvent.unhover(canvasElement.querySelector('.recharts-surface')!)
      canvasElement.querySelector<SVGElement>('.recharts-surface')!.focus()
      await userEvent.keyboard('{ArrowRight}{ArrowRight}')
      await waitFor(() => expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent('Paid search'))
      await userEvent.keyboard('{Enter}')
      await expect(status).toHaveTextContent('Opened Paid search · every series (row 2)')
    })

    await step('the hidden table has a button per row', async () => {
      await userEvent.click(within(canvasElement.querySelector('table')!).getByRole('button', { name: 'Email' }))
      await expect(status).toHaveTextContent('Opened Email · every series (row 4)')
    })
  },
}
