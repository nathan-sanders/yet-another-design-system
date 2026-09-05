import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Calendar } from './Calendar'
import type { CalendarValue } from './Calendar'
import { formatDateInput } from './month'
import type { DateRange } from './month'

/**
 * Every story pins a fixed month rather than opening on today, so the grid a
 * reviewer sees is the one the Figma frame draws and a snapshot does not change
 * shape when the real month rolls over into a six-row one.
 *
 * The exception is today's marker, which cannot be pinned — it is genuinely the
 * machine's date — so the story that shows it puts today inside the visible
 * month by navigating to today rather than to January 2025.
 */
const JANUARY_2025 = new Date(2025, 0, 1)
const RANGE: DateRange = [new Date(2025, 0, 12), new Date(2025, 1, 8)]

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  argTypes: {
    numberOfMonths: { control: 'inline-radio', options: [1, 2] },
    monthHeader: { control: 'inline-radio', options: ['default', 'picker'] },
    weekStartsOn: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6] },
    hasOutsideDays: { control: 'boolean' },
    value: { control: false },
    defaultValue: { control: false },
    min: { control: false },
    max: { control: false },
  },
  args: {
    defaultFocusMonth: JANUARY_2025,
    'aria-label': 'Choose a date',
  },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

/** A single date. Use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {
  args: { defaultValue: new Date(2025, 0, 8) },
}

/**
 * Range mode, derived from the value: an array — even an empty `[null, null]` —
 * makes this a range picker, and a bare `Date` makes it a single one. There is
 * no `mode` prop to disagree with the value.
 *
 * The days between the two ends carry the same solid fill as the ends
 * themselves, square where the ends are rounded. That is what the file draws.
 */
export const Range: Story = {
  args: { defaultValue: RANGE, numberOfMonths: 2 },
  parameters: { controls: { disable: true } },
}

/**
 * Two months side by side, for a range that crosses a boundary. Only the outer
 * arrows are drawn — the file gives January a left one and February a right
 * one, and nothing between them.
 */
export const TwoMonths: Story = {
  args: { defaultValue: [new Date(2025, 0, 25), new Date(2025, 1, 5)], numberOfMonths: 2 },
  parameters: { controls: { disable: true } },
}

/**
 * `monthHeader="picker"` swaps the caption for month and year Selects — the
 * header the file's `Type=Single` date picker is drawn with, and the faster way
 * to reach a month a long way off.
 */
export const MonthPicker: Story = {
  args: { defaultValue: new Date(2025, 0, 8), monthHeader: 'picker' },
  parameters: { controls: { disable: true } },
}

/**
 * `min`, `max` and `dateConstraints` between them decide what is selectable.
 * Unavailable days stay focusable, so the keyboard can cross a disabled stretch
 * rather than stopping at it.
 */
export const Constrained: Story = {
  args: {
    defaultValue: new Date(2025, 0, 15),
    min: new Date(2025, 0, 6),
    max: new Date(2025, 0, 24),
    dateConstraints: [(date: Date) => date.getDay() !== 0 && date.getDay() !== 6],
  },
  parameters: { controls: { disable: true } },
}

/** Days from neighbouring months can be left blank instead of numbered. */
export const NoOutsideDays: Story = {
  args: { defaultValue: new Date(2025, 0, 8), hasOutsideDays: false },
  parameters: { controls: { disable: true } },
}

/** A Monday-first week, for anywhere that does not start on Sunday. */
export const WeekStartsMonday: Story = {
  args: { defaultValue: new Date(2025, 0, 8), weekStartsOn: 1 },
  parameters: { controls: { disable: true } },
}

/**
 * Today gets the file's raised white card and a 2px rule above the number.
 * This story opens on the real current month, because today is the one thing a
 * story cannot pin.
 */
export const Today: Story = {
  args: { defaultFocusMonth: new Date(), 'aria-label': 'Today' },
  parameters: { controls: { disable: true } },
}

/**
 * Picking a range: click a start, and the days under the pointer fill in before
 * the second click commits them.
 *
 * The preview is behavior the file cannot draw, in the same way `Dialog.Body`'s
 * scrolling is — but a range picker without it gives no feedback between the
 * two clicks.
 */
export const RangeSelection: Story = {
  args: { defaultValue: [null, null] as DateRange },
  parameters: { controls: { disable: true } },
  render: function RangeSelectionStory(args) {
    const [value, setValue] = useState<CalendarValue>([null, null])
    return (
      <div className="flex flex-col gap-4">
        <Calendar {...args} value={value} onValueChange={setValue} />
        <p className="font-mono text-sm text-content-subtle">
          {(value as DateRange).map((d) => (d ? formatDateInput(d, 'en-US') : '—')).join('  →  ')}
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'January 12, 2025' }))
    // The first click opens a half-picked range, so the start is selected and
    // nothing else is.
    await expect(canvas.getByRole('button', { name: 'January 12, 2025' })).toHaveAttribute(
      'tabindex',
      '0',
    )

    await userEvent.click(canvas.getByRole('button', { name: 'January 20, 2025' }))
    await waitFor(() => expect(canvas.getByText(/1\/12\/2025.*1\/20\/2025/)).toBeInTheDocument())

    // A day between the two ends is marked selected on its cell, which is where
    // `aria-selected` belongs in a grid.
    const middle = canvas.getByRole('button', { name: 'January 16, 2025' })
    await expect(middle.closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true')

    // Clicking a third time starts over rather than extending.
    await userEvent.click(canvas.getByRole('button', { name: 'January 5, 2025' }))
    await waitFor(() => expect(canvas.getByText(/1\/5\/2025.*—/)).toBeInTheDocument())
  },
}

/**
 * The keyboard map, exercised.
 *
 * Only one day is tabbable — the roving tabindex — so Tab reaches the grid once
 * and the arrows move within it. Arrowing off the end of a month pulls the
 * visible month along with it.
 */
export const Keyboard: Story = {
  args: { defaultValue: new Date(2025, 0, 15) },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const start = canvas.getByRole('button', { name: 'January 15, 2025' })
    await expect(start).toHaveAttribute('tabindex', '0')
    // Exactly one day is in the tab order.
    await expect(
      canvas.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0'),
    ).toHaveLength(1)

    start.focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'January 16, 2025' })).toHaveFocus(),
    )

    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'January 23, 2025' })).toHaveFocus(),
    )

    // Home goes to the start of that week — Sunday 19 January.
    await userEvent.keyboard('{Home}')
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'January 19, 2025' })).toHaveFocus(),
    )

    // PageDown holds the day of the month and moves the grid with it.
    await userEvent.keyboard('{PageDown}')
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'February 19, 2025' })).toHaveFocus(),
    )
    await expect(canvas.getByRole('grid', { name: 'February 2025' })).toBeInTheDocument()

    // Enter selects the focused day.
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'February 19, 2025' }).closest('[role="gridcell"]'),
      ).toHaveAttribute('aria-selected', 'true'),
    )
  },
}

/** The month arrows, and the bounds that switch them off. */
export const Navigation: Story = {
  args: { min: new Date(2024, 11, 1), max: new Date(2025, 1, 28) },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('grid', { name: 'January 2025' })).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }))
    await waitFor(() =>
      expect(canvas.getByRole('grid', { name: 'February 2025' })).toBeInTheDocument(),
    )
    // February is the last month `max` allows, so there is nowhere further on.
    await expect(canvas.getByRole('button', { name: 'Next month' })).toBeDisabled()

    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }))
    await waitFor(() =>
      expect(canvas.getByRole('grid', { name: 'December 2024' })).toBeInTheDocument(),
    )
    await expect(canvas.getByRole('button', { name: 'Previous month' })).toBeDisabled()
  },
}
