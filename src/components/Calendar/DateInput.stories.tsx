import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { Button } from '../Button'
import { Dialog } from '../Dialog'
import { Field } from '../Field'
import { Text } from '../Text'
import { DateInput } from './DateInput'
import { formatDateInput } from './month'

/**
 * A fixed date, so the grid that opens is always October 2026 and the plays
 * can name its days.
 */
const OCT_19 = new Date(2026, 9, 19)

const meta = {
  title: 'Components/DateInput',
  component: DateInput,
  argTypes: {
    value: { control: false },
    defaultValue: { control: false },
    min: { control: false },
    max: { control: false },
    monthHeader: { control: 'inline-radio', options: ['default', 'picker'] },
  },
  args: { onValueChange: fn() },
  decorators: [
    (Story) => (
      // Room under the field for the 344-tall panel and its shadow.
      <div className="min-h-110 w-70 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateInput>

export default meta
type Story = StoryObj<typeof meta>

/** What the field holds right now, so a play can read the committed value. */
function Shown({ date }: { date: Date | null }) {
  return (
    <Text size="sm" color="subtle" mono data-testid="value">
      {date ? formatDateInput(date) : '—'}
    </Text>
  )
}

/**
 * The file's date field: a plain Input under a Field label, which opens
 * `Date Picker` `Type=Single` below it.
 */
export const Playground: Story = {
  args: { defaultValue: OCT_19 },
  render: (args) => (
    <Field label="Start date">
      <DateInput {...args} />
    </Field>
  ),
}

/** Empty, with the file's placeholder. */
export const Empty: Story = {
  render: (args) => (
    <Field label="End date">
      <DateInput {...args} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('End date')
    await expect(input).toHaveValue('')
    await expect(input).toHaveAttribute('placeholder', 'Select date')
  },
}

/**
 * Click into the field and the month opens under it; pick a day and the
 * field takes it, the panel closes and focus stays in the field.
 *
 * The field is a textbox, so it carries `aria-haspopup="dialog"` and
 * `aria-controls` while open — and no `aria-expanded`, which a textbox may not
 * have. That is why this is not `Popover.Trigger`.
 */
export const PickADay: Story = {
  render: function PickADayStory(args) {
    const [date, setDate] = useState<Date | null>(OCT_19)
    return (
      <div className="flex flex-col gap-4">
        <Field label="Start date">
          <DateInput {...args} value={date} onValueChange={setDate} />
        </Field>
        <Shown date={date} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    const input = canvas.getByLabelText('Start date')
    await expect(input).toHaveValue('10/19/2026')
    await expect(input).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(input).not.toHaveAttribute('aria-expanded')

    await userEvent.click(input)
    const panel = await waitFor(() => page.getByRole('dialog', { name: 'Choose date' }))
    await expect(input).toHaveAttribute('aria-controls', panel.id)
    // Settle the enter transition (it scales from 95%), then measure: the
    // file's Single card, left-aligned under the field's box, 4px below it.
    await Promise.all(panel.getAnimations({ subtree: true }).map((a) => a.finish()))
    const box = input.parentElement!.getBoundingClientRect()
    const card = panel.firstElementChild!.getBoundingClientRect()
    await expect([card.width, card.height]).toEqual([312, 344])
    await expect(card.left).toBe(box.left)
    await expect(card.top).toBe(box.bottom + 4)
    // Focus stays in the field, so typing still works with the panel open.
    await expect(input).toHaveFocus()

    // A second click into the field — to place the caret — keeps it open.
    await userEvent.click(input)
    await expect(page.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument()

    await userEvent.click(within(panel).getByRole('button', { name: /October 23, 2026/ }))
    await waitFor(() => expect(page.queryByRole('dialog', { name: 'Choose date' })).toBeNull())
    await expect(input).toHaveValue('10/23/2026')
    await expect(canvas.getByTestId('value')).toHaveTextContent('10/23/2026')
    await expect(input).toHaveFocus()
  },
}

/**
 * Typing commits on Enter or blur through the same parser as DatePicker's
 * footer. Anything it cannot read reverts; clearing the field clears the date.
 */
export const Typing: Story = {
  render: function TypingStory(args) {
    const [date, setDate] = useState<Date | null>(OCT_19)
    return (
      <div className="flex flex-col gap-4">
        <Field label="Start date">
          <DateInput {...args} value={date} onValueChange={setDate} />
        </Field>
        <Shown date={date} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Start date')

    await userEvent.clear(input)
    await userEvent.type(input, '11/2/2026{Enter}')
    await waitFor(() => expect(canvas.getByTestId('value')).toHaveTextContent('11/2/2026'))
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())

    await userEvent.clear(input)
    await userEvent.type(input, 'next tuesday')
    await userEvent.tab()
    await waitFor(() => expect(input).toHaveValue('11/2/2026'))

    await userEvent.clear(input)
    await userEvent.tab()
    await waitFor(() => expect(canvas.getByTestId('value')).toHaveTextContent('—'))
  },
}

/**
 * ArrowDown moves from the field into the grid, on the selected day; Escape
 * in the grid closes the panel and hands focus back to the field without
 * reopening it.
 */
export const Keyboard: Story = {
  args: { defaultValue: OCT_19 },
  render: (args) => (
    <Field label="Start date">
      <DateInput {...args} />
    </Field>
  ),
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByLabelText('Start date')
    const page = within(document.body)

    await userEvent.tab()
    await expect(input).toHaveFocus()
    await waitFor(() => page.getByRole('dialog', { name: 'Choose date' }))

    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/October 19, 2026/))

    // Move a day and take it with Enter.
    await userEvent.keyboard('{ArrowRight}{Enter}')
    await waitFor(() => expect(page.queryByRole('dialog', { name: 'Choose date' })).toBeNull())
    await expect(input).toHaveValue('10/20/2026')
    await expect(input).toHaveFocus()
    await expect(args.onValueChange).toHaveBeenLastCalledWith(new Date(2026, 9, 20))

    // Open again from the keyboard, then Escape out of the grid.
    await userEvent.click(input)
    await waitFor(() => page.getByRole('dialog', { name: 'Choose date' }))
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(page.queryByRole('dialog', { name: 'Choose date' })).toBeNull())
    await expect(input).toHaveFocus()
  },
}

/**
 * A start and an end, the note dialog's pair: the end's `min` is the start,
 * so its grid disables the days before it and a typed date before it reverts.
 */
export const StartAndEnd: Story = {
  render: function StartAndEndStory(args) {
    const [start, setStart] = useState<Date | null>(OCT_19)
    const [end, setEnd] = useState<Date | null>(null)
    return (
      <div className="flex gap-2">
        <Field label="Start date">
          <DateInput {...args} value={start} onValueChange={setStart} />
        </Field>
        <Field label="End date">
          <DateInput {...args} value={end} onValueChange={setEnd} min={start ?? undefined} />
        </Field>
      </div>
    )
  },
  decorators: [
    (Story) => (
      <div className="min-h-110 p-4">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(document.body)
    const end = canvas.getByLabelText('End date')

    await userEvent.click(end)
    const panel = await waitFor(() => page.getByRole('dialog', { name: 'Choose date' }))
    // Opens on the start's month, with the days before it unavailable.
    await expect(within(panel).getByRole('button', { name: /October 18, 2026/ })).toHaveAttribute('aria-disabled', 'true')
    await expect(within(panel).getByRole('button', { name: /October 19, 2026/ })).not.toHaveAttribute('aria-disabled')

    await userEvent.type(end, '10/1/2026{Enter}')
    await waitFor(() => expect(end).toHaveValue(''))
  },
}

/**
 * Inside a Dialog, Escape with the panel open closes the panel and leaves the
 * dialog where it is; a second Escape closes the dialog.
 */
export const InDialog: Story = {
  render: function InDialogStory(args) {
    const [open, setOpen] = useState(false)
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Trigger render={<Button appearance="secondary">New note</Button>} />
        <Dialog.Popup>
          <Dialog.Title>New note</Dialog.Title>
          <Dialog.Body className="flex flex-initial flex-col gap-3">
            <Field label="Start date">
              <DateInput {...args} defaultValue={OCT_19} />
            </Field>
          </Dialog.Body>
        </Dialog.Popup>
      </Dialog>
    )
  },
  play: async ({ canvasElement }) => {
    const page = within(document.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'New note' }))
    const dialog = await waitFor(() => page.getByRole('dialog', { name: 'New note' }))

    await userEvent.click(within(dialog).getByLabelText('Start date'))
    await waitFor(() => page.getByRole('dialog', { name: 'Choose date' }))

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(page.queryByRole('dialog', { name: 'Choose date' })).toBeNull())
    await expect(page.getByRole('dialog', { name: 'New note' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(page.queryByRole('dialog', { name: 'New note' })).toBeNull())
  },
}

/** Disabled: the field fades and nothing opens. */
export const Disabled: Story = {
  args: { defaultValue: OCT_19, disabled: true },
  render: (args) => (
    <Field label="Start date">
      <DateInput {...args} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('Start date')
    await expect(input).toBeDisabled()
    // Input takes a disabled field out of pointer events, and Tab skips it.
    await userEvent.tab()
    await expect(input).not.toHaveFocus()
    await expect(within(document.body).queryByRole('dialog')).toBeNull()
  },
}
