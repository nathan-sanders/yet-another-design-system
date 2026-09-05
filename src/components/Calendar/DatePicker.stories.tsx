import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { DatePicker } from './DatePicker'
import type { CalendarValue } from './Calendar'
import { formatDateInput } from './month'
import type { DateRange } from './month'
import { DATE_RANGE_PRESETS } from './presets'

/**
 * Fixed months again, so the grid matches the Figma frame and does not change
 * row count as the real month moves. The presets stories are the exception:
 * a preset resolves against today by design, so those assert on the shape of
 * what happens rather than on a particular date.
 */
const JANUARY_2025 = new Date(2025, 0, 1)
const RANGE: DateRange = [new Date(2025, 0, 12), new Date(2025, 1, 8)]

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  argTypes: {
    numberOfMonths: { control: 'inline-radio', options: [1, 2] },
    monthHeader: { control: 'inline-radio', options: ['default', 'picker'] },
    presets: { control: false },
    value: { control: false },
    defaultValue: { control: false },
  },
  args: {
    focusMonth: JANUARY_2025,
    'aria-label': 'Choose a date range',
  },
  decorators: [
    (Story) => (
      // The panel casts `shadow-medium`, which is 0 8px 16px — it needs room
      // below it to be visible at all.
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

/** The file's `Type=Range - 1 Column`: presets, one month, and a wrapped footer. */
export const Playground: Story = {
  args: { defaultValue: RANGE, onApply: fn(), onCancel: fn() },
}

/**
 * The file's `Type=Single` — a `Date` rather than a pair, so the presets rail
 * and the footer both come off and what is left is the bare card.
 *
 * Drawn in Figma with the month-picker header. That is an instance override on
 * one of three variants rather than a rule, so `monthHeader` still defaults to
 * `default` and this story asks for the picker explicitly.
 */
export const Single: Story = {
  args: { defaultValue: new Date(2025, 0, 8), monthHeader: 'picker' },
  parameters: { controls: { disable: true } },
}

/**
 * `Type=Range - 2 Columns`. The only difference from one column is
 * `numberOfMonths` — the footer's other shape falls out of `flex-wrap` at the
 * wider size rather than being a second component.
 */
export const RangeTwoColumns: Story = {
  args: {
    defaultValue: RANGE,
    numberOfMonths: 2,
    onApply: fn(),
    onCancel: fn(),
  },
  parameters: { controls: { disable: true } },
}

/**
 * Presets are a caller's list, and `DATE_RANGE_PRESETS` — Figma's eight — is
 * the fallback. Anything needing a fiscal quarter passes its own instead of
 * forking the component.
 */
export const CustomPresets: Story = {
  args: {
    defaultValue: [null, null] as DateRange,
    presets: [
      { label: 'This quarter', range: () => [new Date(2025, 0, 1), new Date(2025, 2, 31)] },
      { label: 'Last quarter', range: () => [new Date(2024, 9, 1), new Date(2024, 11, 31)] },
      { label: 'Year to date', range: () => [new Date(2025, 0, 1), new Date(2025, 0, 22)] },
    ],
  },
  parameters: { controls: { disable: true } },
}

/** `presets={false}` removes the rail and leaves the calendar with its footer. */
export const NoPresets: Story = {
  args: { defaultValue: RANGE, presets: false, onApply: fn(), onCancel: fn() },
  parameters: { controls: { disable: true } },
}

/** Without `onApply` and `onCancel` there is nothing for the actions to do, so they come off. */
export const NoActions: Story = {
  args: { defaultValue: RANGE },
  parameters: { controls: { disable: true } },
}

/**
 * A preset writes the range, moves the grid to it, and updates both inputs.
 *
 * The month it lands on is anchored on the range's **end** — after "Last 30
 * days" that is today, which is the end you are most likely to adjust next.
 */
export const PresetsApply: Story = {
  args: { defaultValue: [null, null] as DateRange, onApply: fn(), onCancel: fn() },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: 'All time' })).toBeInTheDocument()
    await expect(canvas.getAllByRole('button', { name: /Last|Today|Yesterday|All time/ })).toHaveLength(
      DATE_RANGE_PRESETS.length,
    )

    await userEvent.click(canvas.getByRole('button', { name: 'Today' }))

    const today = formatDateInput(new Date(), 'en-US')
    await waitFor(() => expect(canvas.getByLabelText('Start date')).toHaveValue(today))
    await expect(canvas.getByLabelText('End date')).toHaveValue(today)

    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }))
    await expect(args.onApply).toHaveBeenCalled()
  },
}

/**
 * The footer inputs are editable, and commit on blur or Enter. Anything
 * `parseDateInput` cannot read reverts rather than clearing the field — a
 * half-typed date is not a reason to lose the one that was there.
 */
export const TypedDates: Story = {
  args: { defaultValue: RANGE },
  parameters: { controls: { disable: true } },
  render: function TypedDatesStory(args) {
    const [value, setValue] = useState<CalendarValue>(RANGE)
    return (
      <div className="flex flex-col gap-4">
        <DatePicker {...args} value={value} onValueChange={setValue} />
        <p className="font-mono text-sm text-content-subtle" data-testid="value">
          {(value as DateRange).map((d) => (d ? formatDateInput(d, 'en-US') : '—')).join('  →  ')}
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const start = canvas.getByLabelText('Start date')

    await expect(start).toHaveValue('1/12/2025')

    await userEvent.clear(start)
    await userEvent.type(start, '1/20/2025{Enter}')
    await waitFor(() => expect(canvas.getByTestId('value')).toHaveTextContent('1/20/2025'))

    // Nonsense reverts to the value that was there rather than clearing it.
    await userEvent.clear(start)
    await userEvent.type(start, 'not a date')
    await userEvent.tab()
    await waitFor(() => expect(start).toHaveValue('1/20/2025'))
  },
}
