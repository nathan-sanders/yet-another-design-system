import type { Meta, StoryObj } from '@storybook/react-vite'

import { VerticalBar } from './VerticalBar'
import { dailyData, monthlyData } from '../Chart/sample-data'

const SERIES = [
  { key: 'conversions', label: 'Conversions' },
  { key: 'signups', label: 'Signups' },
  { key: 'sessions', label: 'Sessions' },
]

const meta = {
  title: 'Data Viz/VerticalBar',
  component: VerticalBar,
  argTypes: {
    stacked: { control: 'boolean' },
    showTotal: { control: 'boolean' },
    accessibilityBorder: { control: 'boolean' },
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    yLines: { control: { type: 'range', min: 2, max: 8, step: 1 } },
    height: { control: { type: 'range', min: 120, max: 480, step: 20 } },
  },
  args: {
    data: dailyData(31),
    xKey: 'date',
    series: SERIES,
    label: 'Sessions, signups and conversions over 31 days',
    stacked: true,
    yLines: 5,
    legend: 'horizontal',
    height: 280,
  },
} satisfies Meta<typeof VerticalBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma's chart: three series stacked, every segment rounded on all four corners
 * with a 1px gap between them.
 *
 * That gap is the whole reason the segments go through a custom shape — Recharts
 * stacks flush and has no notion of one. Hover a column to see the Total row,
 * which appears because the chart is stacked.
 */
export const Playground: Story = {}

/**
 * Stacked against grouped — and the reason `stacked` defaults to **false**.
 *
 * Stacking asserts that the parts sum to a meaningful whole. When they do, it is
 * the better chart: one column per category, and the total is readable at a
 * glance. When they do not, it invents a number the reader will try to read
 * anyway. Grouped makes no such claim, which is why it is the default and
 * stacking is something the caller opts into.
 */
export const StackedAndGrouped: Story = {
  render: (args) => (
    <div className="flex max-w-4xl flex-col gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">stacked — the parts sum to something</figcaption>
        <VerticalBar {...args} stacked data={dailyData(14)} height={220} />
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">grouped — the default; no total claimed</figcaption>
        <VerticalBar {...args} stacked={false} data={dailyData(14)} height={220} />
      </figure>
    </div>
  ),
}

/**
 * One series — Figma's "Single" bar type, which needs no prop of its own.
 *
 * "Single" and "Group" are the same drawing; they differ only in how many series
 * there are, which the `series` array already says. Figma needs three variants
 * because a component cannot count its own children.
 */
export const SingleSeries: Story = {
  args: {
    data: monthlyData(),
    series: [{ key: 'sessions', label: 'Sessions' }],
    label: 'Sessions over 12 months',
    stacked: false,
  },
}

/**
 * The radius clamping, which matters more than it sounds.
 *
 * A 4px radius on a 5px-tall segment is a lozenge, and on a 2px one the arcs
 * overlap and SVG draws something arbitrary. A stacked chart produces short
 * segments constantly — any small category — so the radius is clamped to half
 * the smaller dimension. This story stacks ten series to force the case.
 */
export const ShortSegments: Story = {
  render: (args) => {
    const series = Array.from({ length: 10 }, (_, i) => ({
      key: `s${i}`,
      label: `Dataset ${i + 1}`,
    }))
    const data = Array.from({ length: 12 }, (_, row) => {
      const entry: Record<string, unknown> = {
        date: new Date(Date.UTC(2026, row, 1)).toISOString(),
      }
      for (let i = 0; i < 10; i++) entry[`s${i}`] = 20 + ((row * 7 + i * 13) % 60)
      return entry
    })
    return <VerticalBar {...args} stacked data={data} series={series} label="Ten stacked series" height={300} />
  },
}

/**
 * `accessibilityBorder`, the sanctioned mitigation for the three categorical
 * colours that fall short of 3:1 on the light canvas.
 *
 * Yellow (`04`) at 1.74:1 is the structural one: as a thin line it is nearly
 * invisible, and as a large flat fill it is hard to find against the surface.
 * The root `CLAUDE.md` records those three as a known, accepted, parked state —
 * this is the way to handle a chart that needs them, not a reason to change a
 * token.
 */
export const AccessibilityBorder: Story = {
  render: (args) => {
    const series = Array.from({ length: 5 }, (_, i) => ({ key: `s${i}`, label: `Dataset ${i + 1}` }))
    const data = Array.from({ length: 8 }, (_, row) => {
      const entry: Record<string, unknown> = { name: `Cat ${row + 1}` }
      for (let i = 0; i < 5; i++) entry[`s${i}`] = 40 + ((row * 11 + i * 17) % 70)
      return entry
    })
    return (
      <div className="flex max-w-4xl flex-col gap-8">
        <figure className="flex flex-col gap-2">
          <figcaption className="text-content-subtle font-mono text-sm">off — the default</figcaption>
          <VerticalBar {...args} data={data} series={series} xKey="name" label="Without border" height={200} />
        </figure>
        <figure className="flex flex-col gap-2">
          <figcaption className="text-content-subtle font-mono text-sm">on</figcaption>
          <VerticalBar
            {...args}
            accessibilityBorder
            data={data}
            series={series}
            xKey="name"
            label="With border"
            height={200}
          />
        </figure>
      </div>
    )
  },
}
