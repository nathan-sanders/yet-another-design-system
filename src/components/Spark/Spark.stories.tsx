import type { Meta, StoryObj } from '@storybook/react-vite'

import { Spark } from './Spark'
import { dailyData } from '../Chart/sample-data'
import { categorical, sentiment } from '../Chart'

const meta = {
  title: 'Data Viz/Spark',
  component: Spark,
  argTypes: {
    type: { control: 'inline-radio', options: ['line', 'bar', 'area'] },
    height: { control: { type: 'range', min: 24, max: 160, step: 8 } },
  },
  args: {
    data: dailyData(14),
    dataKey: 'sessions',
    type: 'line',
    height: 96,
    label: 'Sessions over 14 days',
  },
} satisfies Meta<typeof Spark>

export default meta
type Story = StoryObj<typeof meta>

/** Figma draws it at 96px tall. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-68">
      <Spark {...args} />
    </div>
  ),
}

/** The three types. Figma has the first two; `area` is the same line with a wash. */
export const Types: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-8">
      {(['line', 'bar', 'area'] as const).map((type) => (
        <figure key={type} className="flex w-68 flex-col gap-2">
          <figcaption className="text-content-subtle font-mono text-sm">{type}</figcaption>
          <Spark {...args} type={type} />
        </figure>
      ))}
    </div>
  ),
}

/**
 * The size it is actually for.
 *
 * A spark belongs beside the number it summarizes, at roughly the height of a
 * couple of lines of text. This is what `Metric Overview` will use it at.
 *
 * Note `decorative` here rather than a label: the value and its delta are
 * already stated in text beside it, so announcing "line chart" would give a
 * screen reader a vaguer second version of a number it has just read.
 */
export const InAMetric: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {[
        { label: 'Sessions', value: '12,480', delta: '+8%', color: sentiment.positive, key: 'sessions' },
        { label: 'Signups', value: '3,204', delta: '−3%', color: sentiment.negative, key: 'signups' },
        { label: 'Conversions', value: '862', delta: '+1%', color: categorical(0), key: 'conversions' },
      ].map((metric) => (
        <div
          key={metric.label}
          className="border-surface-border flex w-60 flex-col gap-1 rounded-lg border p-4"
        >
          <p className="text-content-subtle text-sm">{metric.label}</p>
          <p className="text-content-emphasized text-2xl font-semibold">{metric.value}</p>
          <p className="text-content-subtle font-mono text-sm">{metric.delta} vs last month</p>
          <Spark data={dailyData(14)} dataKey={metric.key} type="area" color={metric.color} height={40} decorative />
        </div>
      ))}
    </div>
  ),
}

/**
 * Labeled rather than decorative.
 *
 * When a spark is the only thing carrying the information — no value beside it —
 * it takes a `label` and becomes a labeled image. The types make one of the two
 * required: an unlabeled, non-decorative spark will not compile, because the
 * silent third case is the one an audit flags and a reader gets nothing from.
 */
export const Labeled: Story = {
  args: { label: 'Sessions trend over the last 14 days' },
  render: (args) => (
    <div className="w-68">
      <Spark {...args} />
    </div>
  ),
}
