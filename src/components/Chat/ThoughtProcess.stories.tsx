import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Button } from '../Button'
import { Mark } from './story-mark'
import { ThoughtProcess } from './ThoughtProcess'
import { ToolCall } from './ToolCall'

const meta = {
  title: 'Components/ThoughtProcess',
  component: ThoughtProcess,
  argTypes: {
    thinking: { control: 'boolean' },
    label: { control: 'text' },
    elapsed: { control: 'text' },
  },
  args: {
    thinking: false,
    children: (
      <>
        <ToolCall status="done">Toolcall label</ToolCall>
        <ToolCall status="done">Toolcall label</ToolCall>
        <ToolCall status="done">Toolcall label</ToolCall>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-100 rounded-lg bg-surface-background-primary p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThoughtProcess>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma's `Process=Thought`: the summary row, closed, with the chevron down.
 * Press it and the panel opens onto a Card of tool calls, the chevron turning
 * as it goes.
 *
 * Measured: the row is Figma's 24px; opening sets `aria-expanded`, Base UI
 * publishes the panel's height, and the chevron reads 180°.
 */
export const Thought: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Thought summary' })
    await expect(trigger.getBoundingClientRect().height).toBe(24)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!
    await waitFor(() => expect(panel).toBeVisible())
    await expect(panel.style.getPropertyValue('--collapsible-panel-height')).not.toBe('')

    const chevron = trigger.querySelector('svg:last-of-type')!
    await waitFor(() => expect(getComputedStyle(chevron).rotate).toBe('180deg'))
    await expect(within(panel).getAllByText('Toolcall label')).toHaveLength(3)
  },
}

/**
 * Figma's `Process=Thinking`: the assistant's mark leads the row, the label
 * says so, and the time so far sits beside it. The mark comes in through the
 * `icon` slot — it is the application's, and here it is a story-only SVG. The
 * row's left padding tightens from 12 to 8 to hold it, which is derived from
 * the slot being filled.
 *
 * **This is the one place the mark moves.** `<Mark animate />` runs Nathan's
 * thinking scribble — the path draws itself in and out while the mark wobbles,
 * on one 1.8s loop — and only the Thinking row gets it; beside a reply and in
 * the welcome heading the mark is a still frame. The animation is the
 * application's, like the mark itself, so it lives in the story file and not
 * in `ThoughtProcess`.
 *
 * `aria-busy` marks the row while it lasts. Measured: two animations running
 * on the mark, both 1800ms, and none on a still one.
 */
export const Thinking: Story = {
  args: {
    thinking: true,
    elapsed: '1s',
    icon: <Mark animate />,
    children: (
      <>
        <ToolCall status="done">Read the design system</ToolCall>
        <ToolCall status="running">Checking the token layer</ToolCall>
        <ToolCall>Drafting a reply</ToolCall>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /Thinking 1s/ })
    await expect(trigger.getBoundingClientRect().height).toBe(24)
    await expect(trigger.closest('[aria-busy="true"]')).not.toBeNull()
    await expect(getComputedStyle(trigger).paddingLeft).toBe('8px')
    await expect(getComputedStyle(trigger).paddingRight).toBe('12px')

    const mark = canvas.getByRole('img', { name: 'Yet, thinking' })
    const animations = mark.getAnimations({ subtree: true }) as CSSAnimation[]
    await expect(animations.map((a) => a.animationName).sort()).toEqual([
      'scribble-draw',
      'scribble-wobble',
    ])
    for (const a of animations) await expect(a.effect!.getTiming().duration).toBe(1800)
  },
}

/** Both states, open — what Figma's `Open=True` variants draw. */
export const Open: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <ThoughtProcess {...args} thinking elapsed="1s" icon={<Mark animate />} defaultOpen />
      <ThoughtProcess {...args} defaultOpen />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const trigger of canvas.getAllByRole('button')) {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    }
  },
}

/**
 * Controlled from outside — an app that opens every thought process at once,
 * or closes the last one when the reply lands.
 */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false)
    return (
      <div className="flex flex-col items-start gap-4">
        <Button appearance="secondary" onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide thinking' : 'Show thinking'}
        </Button>
        <ThoughtProcess {...args} open={open} onOpenChange={setOpen} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show thinking' }))
    await expect(canvas.getByRole('button', { name: 'Thought summary' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  },
}
