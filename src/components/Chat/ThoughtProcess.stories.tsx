import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Button } from '../Button'
import { Mark } from './story-mark'
import { THINKING_PHRASES } from './styles'
import { ThoughtProcess } from './ThoughtProcess'
import { ToolCall } from './ToolCall'

const meta = {
  title: 'Components/ThoughtProcess',
  component: ThoughtProcess,
  argTypes: {
    thinking: { control: 'boolean' },
    label: { control: 'text' },
    elapsed: { control: 'number' },
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
 * **The label rotates while it thinks.** Every 2.4 seconds the row says the
 * next of its `phrases`, fading in on `duration-fast` — and the default set
 * is the system in its own voice: "Reading the record", "Measuring, not
 * assuming", "Yet another pass". Pass `phrases` for an app's lines, or
 * `label` to pin one.
 *
 * **The timer counts up on the left.** It starts at `elapsed` and ticks once
 * a second while the row thinks. It sits before the phrase, so the phrase's
 * changing length never moves it — and tabular figures with a small floor
 * keep the phrase's own start still while the count climbs.
 *
 * `aria-busy` marks the row while it lasts. Measured: two animations running
 * on the mark, both 1800ms; the timer at 1s then 2s with the phrase not
 * moving; the phrase moving on after the interval, with a fade-in whose
 * duration is the `fast` token.
 */
export const Thinking: Story = {
  args: {
    thinking: true,
    elapsed: 1,
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
    const trigger = canvas.getByRole('button', { name: /1s/ })
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

    // The timer counts up from `elapsed`, on the left of the phrase, and the
    // phrase starts where it started once the count has moved on.
    const timer = canvas.getByTestId('thought-process-timer')
    await expect(timer).toHaveTextContent('1s')
    const phraseLeft = timer.nextElementSibling!.getBoundingClientRect().left
    await waitFor(() => expect(timer).toHaveTextContent('2s'), { timeout: 2500 })
    await expect(timer.nextElementSibling!.getBoundingClientRect().left).toBe(phraseLeft)
    await expect(timer.getBoundingClientRect().left).toBeLessThan(phraseLeft)

    // The phrases turn over, and each arrival fades in on the motion tokens.
    const [first, second] = THINKING_PHRASES
    const phrase = () => canvas.getByText(first!, { exact: true }) ?? null
    const fade = phrase().getAnimations()[0] as CSSAnimation
    await expect(fade.animationName).toBe('fade-in')
    await expect(fade.effect!.getTiming().duration).toBe(175)
    await waitFor(() => expect(canvas.getByText(second!)).toBeInTheDocument(), { timeout: 4000 })
    await expect(canvas.queryByText(first!)).not.toBeInTheDocument()
  },
}

/**
 * An app's own lines, and a pinned one. `phrases` replaces the default set;
 * `label` stops the rotation altogether — for a product whose voice is not
 * this one, or a row that reports a specific step.
 */
export const OwnPhrases: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <ThoughtProcess
        {...args}
        thinking
        elapsed={2}
        icon={<Mark animate />}
        phrases={['Working on it', 'Nearly there', 'One more thing']}
      />
      <ThoughtProcess {...args} thinking elapsed={2} icon={<Mark animate />} label="Running the tests" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Working on it')).toBeInTheDocument()
    await expect(canvas.getByText('Running the tests')).toBeInTheDocument()
    // A pinned label does not fade — nothing is arriving.
    await expect(canvas.getByText('Running the tests').getAnimations()).toHaveLength(0)
  },
}

/** Both states, open — what Figma's `Open=True` variants draw. */
export const Open: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <ThoughtProcess {...args} thinking elapsed={1} icon={<Mark animate />} defaultOpen />
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
