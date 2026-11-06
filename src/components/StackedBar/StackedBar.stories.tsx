import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { StackedBar } from './StackedBar'
import { categorical, placeholder, sentiment } from '../Chart'
import { onSurface } from '../Chart/story-surface'
import { Text } from '../Text'

const budget = [
  { label: 'Paid', value: 3200 },
  { label: 'Allocated', value: 4800 },
  { label: 'Unallocated', value: 2000 },
]

const meta = {
  title: 'Data Viz/Stacked Bar',
  component: StackedBar,
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'small'] },
  },
  args: { label: 'Campaign budget', segments: budget, size: 'default' },
  parameters: { surfaceWidth: 'w-80' },
  decorators: [onSurface],
} satisfies Meta<typeof StackedBar>

export default meta
type Story = StoryObj<typeof meta>

const drawn = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-segment]')]

/** Paints a token the way a segment does, so both go through one serializer. */
function probeColor(token: string, parent: HTMLElement) {
  const probe = document.createElement('span')
  probe.style.backgroundColor = token
  parent.append(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}

/** Shares in proportion, a 1px gap between parts, and every part named for a screen reader. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole('img', {
      name: 'Campaign budget: Paid 32%, Allocated 48%, Unallocated 20%',
    })
    const [paid, allocated, rest] = drawn(img).map((s) => s.getBoundingClientRect())
    await expect(allocated!.left - paid!.right).toBeCloseTo(1, 1)
    await expect(rest!.left - allocated!.right).toBeCloseTo(1, 1)
    await expect(allocated!.width / paid!.width).toBeCloseTo(1.5, 1)
    await expect(rest!.right - paid!.left).toBeCloseTo(img.getBoundingClientRect().width, 1)
    await expect(img.getBoundingClientRect().height).toBe(16)
    await expect(getComputedStyle(drawn(img)[0]!).borderTopLeftRadius).toBe('4px')
  },
}

/** `default` is the file's 16px bar; `small` is 8px, the height of a Progress Bar. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <StackedBar segments={args.segments} label="Default size" />
      <StackedBar segments={args.segments} label="Small size" size="small" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const small = canvas.getByRole('img', { name: /^Small size/ })
    await expect(small.getBoundingClientRect().height).toBe(8)
    await expect(
      canvas.getByRole('img', { name: /^Default size/ }).getBoundingClientRect().height,
    ).toBe(16)
  },
}

/**
 * The parts are a scale of their own, so they bring their own color. An empty
 * part is skipped, and the ones after it keep the color they already had.
 */
export const StatusColors: Story = {
  args: {
    label: 'Portfolio health',
    formatValue: (value) => `${value} projects`,
    segments: [
      { label: 'Off track', value: 0, color: sentiment.negative },
      { label: 'On track', value: 3, color: sentiment.positive },
      { label: 'Not started', value: 1, color: placeholder },
    ],
  },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole('img', {
      name: 'Portfolio health: On track 3 projects, Not started 1 projects',
    })
    const [first, second] = drawn(img)
    await expect(drawn(img)).toHaveLength(2)
    await expect(getComputedStyle(first!).backgroundColor).toBe(probeColor(sentiment.positive, img))
    await expect(getComputedStyle(second!).backgroundColor).toBe(probeColor(placeholder, img))
  },
}

/** Without overrides, color is the part's position in the categorical scale. */
export const CategoricalOrder: Story = {
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole('img')
    const painted = drawn(img).map((s) => getComputedStyle(s).backgroundColor)
    await expect(painted).toEqual([0, 1, 2].map((i) => probeColor(categorical(i), img)))
  },
}

/** Nothing yet: the row keeps its shape, and the name says there is no data. */
export const NothingToShow: Story = {
  args: {
    label: 'Campaign budget',
    segments: [
      { label: 'Paid', value: 0 },
      { label: 'Allocated', value: 0 },
    ],
  },
  play: async ({ canvasElement }) => {
    const img = within(canvasElement).getByRole('img', { name: 'Campaign budget: no data' })
    const [only] = drawn(img)
    await expect(only!.getBoundingClientRect().width).toBeCloseTo(
      img.getBoundingClientRect().width,
      1,
    )
  },
}

/**
 * The size it is mostly for: a small bar in a row, with the numbers in text
 * beside it. `decorative` stops a screen reader hearing them twice.
 */
export const InARow: Story = {
  parameters: { surfaceWidth: 'w-120' },
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { name: 'Store expansion', parts: [1, 2, 1] },
        { name: 'Menu', parts: [0, 2, 1] },
        { name: 'Digital', parts: [1, 1, 0] },
      ].map(({ name, parts }) => (
        <div key={name} className="flex items-center gap-3">
          <Text render={<span />} className="w-36 shrink-0">
            {name}
          </Text>
          <StackedBar
            decorative
            size="small"
            segments={[
              { label: 'Off track', value: parts[0]!, color: sentiment.negative },
              { label: 'On track', value: parts[1]!, color: sentiment.positive },
              { label: 'Not started', value: parts[2]!, color: placeholder },
            ]}
          />
          <Text render={<span />} color="subtle" className="shrink-0">
            {parts.reduce((a, b) => a + b, 0)} projects
          </Text>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('img')).toBeNull()
    await expect(canvasElement.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
  },
}
