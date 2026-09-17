import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Card } from '../Card'
import { ToolCall } from './ToolCall'

const statuses = ['pending', 'running', 'done', 'error'] as const

const meta = {
  title: 'Components/ToolCall',
  component: ToolCall,
  argTypes: {
    status: { control: 'inline-radio', options: statuses },
  },
  args: {
    status: 'pending',
    children: 'Toolcall label',
  },
  decorators: [
    (Story) => (
      <div className="w-100">
        <Card>
          <Story />
        </Card>
      </div>
    ),
  ],
} satisfies Meta<typeof ToolCall>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma's `Type=Default`: a glyph and a label, nothing to open. The glyph
 * carries the status for a screen reader, so the label does not have to.
 *
 * Measured: the row is Figma's 24px, and there is no button in it.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
    const row = canvas.getByText('Toolcall label').parentElement!
    await expect(row.getBoundingClientRect().height).toBe(24)
  },
}

/**
 * The four statuses. Figma draws one — the hollow circle, `pending` — and the
 * other three go past the file: a spinner while it runs, a check when it is
 * done, a cross in the danger color when it failed. The spinner rests under
 * `prefers-reduced-motion`.
 */
export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <ToolCall status="pending">Drafting a reply</ToolCall>
      <ToolCall status="running">Checking the token layer</ToolCall>
      <ToolCall status="done">Read the design system</ToolCall>
      <ToolCall status="error">Fetch the changelog</ToolCall>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const name of ['Pending', 'Running', 'Done', 'Failed']) {
      await expect(canvas.getByRole('img', { name })).toBeInTheDocument()
    }
    const spinner = canvas.getByRole('img', { name: 'Running' })
    await expect(spinner.getAnimations()).toHaveLength(1)
  },
}

/**
 * Figma's `Type=Collapsable`, which is derived: give a row a `detail` and it
 * becomes a disclosure with a chevron, opening onto the detail indented past
 * the glyph. There is no boolean to set.
 *
 * Measured: the row is a button with `aria-expanded`; the panel's content
 * starts 24px in.
 */
export const WithDetail: Story = {
  args: {
    status: 'done',
    children: 'Read Button.tsx',
    detail: 'src/components/Button/Button.tsx — 214 lines, 1 export.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { expanded: false })
    await expect(trigger.getBoundingClientRect().height).toBe(24)

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const detail = canvas.getByText(/214 lines/)
    await waitFor(() => expect(detail).toBeVisible())
    await expect(getComputedStyle(detail).paddingLeft).toBe('24px')
  },
}

/** Open from the start — Figma's `Type=Collapsable, Open=True`. */
export const Open: Story = {
  args: {
    status: 'done',
    children: 'Read Button.tsx',
    detail: 'src/components/Button/Button.tsx — 214 lines, 1 export.',
    defaultOpen: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { expanded: true })).toBeInTheDocument()
  },
}
