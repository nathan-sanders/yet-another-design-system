import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { ProgressBar } from './ProgressBar'
import type { ProgressBarType } from './ProgressBar'
import { CircleCheckBig, FileUp } from 'lucide-react'

import { Card } from '../Card'
import { Button } from '../Button'
import { Icon } from '../Icon'

const types: { type: ProgressBarType; label: string; value: number }[] = [
  { type: 'default', label: 'Default', value: 60 },
  { type: 'success', label: 'Success', value: 80 },
  { type: 'warning', label: 'Warning', value: 50 },
  { type: 'danger', label: 'Danger', value: 92 },
]

/**
 * The fill, given the bar's root.
 *
 * Base UI stamps the status attribute — `data-progressing`, `data-complete` or
 * `data-indeterminate` — on **Label, Value, Track and Indicator alike**, so
 * `[data-progressing]` on its own matches four elements and the first of them is
 * the label. The indicator is the one whose *parent* also carries the attribute:
 * it is the only part nested inside another part.
 *
 * Worth having in one place, because the wrong element here reads as a passing
 * test — a label's background is `rgba(0, 0, 0, 0)` for every variant, so a
 * "the five fills differ" assertion run against it collapses to one color and
 * fails for a reason that has nothing to do with the fills.
 */
const STATUS = '[data-progressing],[data-complete],[data-indeterminate]'

function fillOf(bar: HTMLElement): HTMLElement {
  const parts = [...bar.querySelectorAll<HTMLElement>(STATUS)]
  const indicator = parts.find((part) => part.parentElement?.matches(STATUS))
  if (!indicator) throw new Error('no indicator inside that progress bar')
  return indicator
}

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  decorators: [
    (Story) => (
      <div className="max-w-96">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: { control: 'text' },
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    type: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger'],
    },
    valueLabel: { control: 'boolean' },
    labelHidden: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Uploading files',
    value: 45,
    type: 'default',
    valueLabel: true,
    labelHidden: false,
    disabled: false,
  },
} satisfies Meta<typeof ProgressBar>

export default meta

/**
 * `StoryObj<typeof ProgressBar>` rather than `StoryObj<typeof meta>`, for the
 * reason written up in `Slider.stories.tsx`: `ProgressBarProps` is a union —
 * `label` or `aria-label`, one of them required — and Storybook works out which
 * args a story still owes by running `Omit` over the component's props. `Omit`
 * does not distribute across a union, so the inference demands `args` on every
 * story. Naming the component directly skips that step.
 */
type Story = StoryObj<typeof ProgressBar>

/**
 * Drag `value` to move the bar, or set it to `null` in the code to make it
 * indeterminate. The bar always needs a name: either a visible `label` or an
 * `aria-label`, and the types will not compile without one.
 */
export const Playground: Story = {}

/**
 * The four semantic colors. `default` is the ordinary one — reach for a severity
 * only when the number itself is the news, as with a quota nearly spent.
 *
 * There is no `neutral`, though Astryx has one: `default` is already this
 * library's gray, and every other gray in the semantic layer collides with it in
 * one theme or the other. See the type's own comment.
 *
 * Use the Theme switch in the toolbar for dark mode.
 */
export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      {types.map(({ type, label, value }) => (
        <ProgressBar key={type} {...args} type={type} label={label} value={value} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // A demo story is a claim: assert every row, not just the first one.
    for (const { label, value } of types) {
      const bar = canvas.getByRole('progressbar', { name: label })
      await expect(bar).toHaveAttribute('aria-valuenow', String(value))
    }

    // The four fills are four different colors, which is the whole point of the
    // story — and the one thing a passing render does not prove.
    const fills = types.map(({ label }) =>
      getComputedStyle(fillOf(canvas.getByRole('progressbar', { name: label })))
        .backgroundColor,
    )
    await expect(new Set(fills).size).toBe(types.length)
  },
}

/**
 * `valueLabel` prints the formatted value beside the label. It is off by
 * default, as in Astryx — a bar with nothing else to say does not need the
 * number twice.
 */
export const WithValue: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <ProgressBar {...args} label="Storage used" value={75} valueLabel />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('progressbar', { name: 'Storage used' })

    // The visible text and what a screen reader hears have to be the same
    // sentence, and they come from two different Base UI parts.
    await expect(canvas.getByText('75%')).toBeInTheDocument()
    await expect(bar).toHaveAttribute('aria-valuetext', '75%')
  },
}

/**
 * `value={null}` is an indeterminate bar: the fill sweeps instead of filling,
 * and the root drops `aria-valuenow` entirely rather than claiming a number it
 * does not have.
 *
 * The sweep cannot be screenshotted — a captured frame is a still — so the story
 * asserts the animation instead of showing it.
 */
export const Indeterminate: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => <ProgressBar {...args} label="Preparing export" value={null} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('progressbar', { name: 'Preparing export' })

    await expect(bar).toHaveAttribute('data-indeterminate')
    await expect(bar).not.toHaveAttribute('aria-valuenow')

    const indicator = fillOf(bar)
    const animations = indicator.getAnimations()
    await expect(animations).toHaveLength(1)
    await expect((animations[0] as CSSAnimation).animationName).toBe(
      'progress-indeterminate',
    )

    // Base UI writes no inline style at all when the value is null, so the
    // indicator's height comes from the class. Without it the bar is 0 tall and
    // looks like nothing rendered.
    await expect(indicator.getBoundingClientRect().height).toBe(8)
  },
}

/**
 * Marks are targets on the track — a quota, a goal, the point a download becomes
 * playable. A bare number is an unlabeled tick; give it a `label` and the label
 * is drawn underneath and folded into what the bar announces.
 *
 * They sit *behind* the track and poke 2px out of each side, which is Slider's
 * tick. Astryx draws them on top of the bar instead; the reason that rule is not
 * followed here is measured, and written up in this component's record.
 */
export const Marks: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <ProgressBar
        {...args}
        label="Storage used"
        value={45}
        valueLabel
        marks={[{ value: 80, label: 'Free tier' }]}
      />
      <ProgressBar {...args} label="Sync" value={62} marks={[25, 50, 75]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // A labeled mark is spoken as part of the value, because nothing else on the
    // component says where the target is.
    const labeled = canvas.getByRole('progressbar', { name: 'Storage used' })
    await expect(labeled).toHaveAttribute('aria-valuetext', '45%, Free tier 80%')
    await expect(canvas.getByText('Free tier')).toBeInTheDocument()

    // Bare numbers are ticks with nothing to say, so the value text is untouched.
    const bare = canvas.getByRole('progressbar', { name: 'Sync' })
    await expect(bare).toHaveAttribute('aria-valuetext', '62%, 25%, 50%, 75%')
  },
}

/**
 * `format` and `locale` reach Base UI, so the value can be anything
 * `Intl.NumberFormat` can print — and `max` sets the scale it is printed
 * against. Astryx's disk-usage example, in this library's props.
 */
export const CustomFormat: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <ProgressBar
        {...args}
        label="Disk usage"
        value={3.2}
        max={5}
        valueLabel
        format={{ style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1 }}
      />
      <ProgressBar
        {...args}
        label="Seats used"
        value={17}
        max={25}
        valueLabel
        format={{ style: 'decimal' }}
        formatValue={(formatted) => `${formatted} of 25`}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('3.2 GB')).toBeInTheDocument()
    await expect(canvas.getByText('17 of 25')).toBeInTheDocument()

    // `max` is the scale, not the value — a bar that printed 3.2 out of 100
    // would look almost empty and be wrong.
    const disk = canvas.getByRole('progressbar', { name: 'Disk usage' })
    await expect(disk).toHaveAttribute('aria-valuemax', '5')
  },
}

/**
 * `labelHidden` keeps the name for screen readers and takes it off the page —
 * for a bar in a table cell or a list row, where the surrounding text already
 * says what is loading. The label stays required.
 */
export const HiddenLabel: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <ProgressBar {...args} label="Rendering video" value={30} labelHidden valueLabel />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Still named, still findable by that name — that is the whole feature.
    await expect(
      canvas.getByRole('progressbar', { name: 'Rendering video' }),
    ).toBeInTheDocument()

    // And the value stays on the right, which is why it is `ml-auto` and not
    // `justify-between`: an `sr-only` label is absolutely positioned and is not
    // a flex item, so `justify-between` would have put the value hard left.
    //
    // Measured, not read off the declaration: `getComputedStyle` resolves
    // `margin-left: auto` to the used pixel value, so asserting the string
    // 'auto' only ever fails.
    const value = canvas.getByText('30%')
    const row = value.parentElement as HTMLElement
    await expect(value.getBoundingClientRect().right).toBeCloseTo(
      row.getBoundingClientRect().right,
      0,
    )
  },
}

/**
 * A canceled or inactive operation. The whole component fades — Slider's idiom —
 * and the root carries `aria-disabled`, which is what lets the faded text
 * through the contrast rules rather than failing them.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <ProgressBar {...args} label="Upload paused" value={40} valueLabel disabled />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('progressbar', { name: 'Upload paused' })
    await expect(bar).toHaveAttribute('aria-disabled', 'true')
  },
}

/**
 * A bar doing its actual job: a file upload that finishes, inside a Card. The
 * default type and the default size, which is what an ordinary screen looks
 * like.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: function UploadStory() {
    const [value, setValue] = useState(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setValue((current) => Math.min(100, current + 7))
      }, 400)
      return () => clearInterval(interval)
    }, [])

    const done = value >= 100

    return (
      <Card>
        <div className="flex items-center gap-3">
          <Icon icon={done ? CircleCheckBig : FileUp} size="large" />
          <div className="flex flex-col">
            <span className="text-base font-semibold text-content-primary">
              quarterly-report.pdf
            </span>
            <span className="text-sm text-content-subtle">4.2 MB</span>
          </div>
          <Button appearance="ghost" className="ml-auto">
            {done ? 'View' : 'Cancel'}
          </Button>
        </div>
        <ProgressBar
          label={done ? 'Upload complete' : 'Uploading'}
          value={value}
          type={done ? 'success' : 'default'}
          valueLabel
        />
      </Card>
    )
  },
}
