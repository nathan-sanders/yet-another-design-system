import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { CircleHelp, Ellipsis, Mic, Plus, Search } from 'lucide-react'

import { Avatar } from '../Avatar'
import samplePhoto from '../Avatar/sample-photo.png'
import { Breadcrumbs } from '../Breadcrumbs'
import { Button } from '../Button'
import { ChatComposer, ChatMessage, ThoughtProcess, ToolCall } from '../Chat'
import { chats } from '../Chat/story-data'
import { Mark } from '../Chat/story-mark'
import { Link } from '../Link'
import { NavItem, SideNav } from '../Nav'
import { Logo } from '../Nav/story-logo'
import { SegmentedControl } from '../SegmentedControl'
import { TopBar } from '../TopBar'
import {
  Questionnaire,
  type QuestionnaireAnswers,
  type QuestionnaireItemDefinition,
  type QuestionnaireItemStatus,
} from './Questionnaire'
import { describedChoices, questions } from './story-data'

const shortcuts = ['letters', 'numbers', 'none'] as const

/** Maps the story data into the parts — what an application does with an agent's questions. */
function Items({ items }: { items: readonly QuestionnaireItemDefinition[] }) {
  return items.map((question) => (
    <Questionnaire.Item
      key={question.name}
      name={question.name}
      required={question.required}
      multiple={question.multiple}
      prompt={question.prompt}
      description={question.description}
    >
      {question.choices.map((choice) => (
        <Questionnaire.Choice
          key={choice.value}
          value={choice.value}
          label={choice.label}
          description={choice.description}
          icon={choice.icon}
          disabled={choice.disabled}
        />
      ))}
      {question.input && (
        <Questionnaire.Input
          aria-label={question.input['aria-label']}
          placeholder={question.input.placeholder}
        />
      )}
    </Questionnaire.Item>
  ))
}

const meta = {
  title: 'Components/Questionnaire',
  component: Questionnaire,
  argTypes: {
    shortcuts: { control: 'inline-radio', options: shortcuts },
    progress: { control: 'boolean' },
  },
  args: {
    shortcuts: 'letters',
    progress: true,
    onAnswers: fn(),
    onItemChange: fn(),
    children: (
      <>
        <Items items={questions} />
        <Questionnaire.Actions />
      </>
    ),
  },
} satisfies Meta<typeof Questionnaire>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma draws the questionnaire 280 wide. Story-level rather than on the
 * meta: Storybook adds a story's decorators to the meta's rather than
 * replacing them, and `InContext` needs the whole viewport.
 */
const atFigmaWidth: Story['decorators'] = [
  (Story) => (
    <div className="max-w-70">
      <Story />
    </div>
  ),
]

/** Room for a description beside a 16px icon without wrapping. */
const atCardWidth: Story['decorators'] = [
  (Story) => (
    <div className="max-w-96">
      <Story />
    </div>
  ),
]

/**
 * Reads a semantic color token the way the browser will serialize it in a
 * computed style, so a ring or a fill can be compared to it as a string
 * rather than by regexing a color out of `getComputedStyle`.
 */
function tokenColor(token: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(--${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

/** The `<label>` card round an answer control. */
const rowOf = (control: HTMLElement) => control.closest('label')!

/**
 * The Figma mock: three questions, the first with a free-text alternative,
 * letters on every answer, and one primary Next in the footer. The controls
 * drive `shortcuts` and `progress`.
 *
 * Measured: "Question 1 of 3" is a named progressbar at 1 of 3; a row is
 * 40px tall with a 20px dial and a 1px inset ring; the Kbd on the first row
 * reads A; Next on an unanswered question marks the fieldset invalid and
 * shows the message; answering and pressing Next opens question 2 and
 * reports it through `onItemChange`.
 */
export const Playground: Story = {
  decorators: atFigmaWidth,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const progress = canvas.getByRole('progressbar', { name: 'Questionnaire progress' })
    await expect(progress).toHaveTextContent('Question 1 of 3')
    await expect(progress).toHaveAttribute('aria-valuenow', '1')
    await expect(progress).toHaveAttribute('aria-valuemax', '3')

    const stone = canvas.getByRole('radio', { name: 'Stone' })
    const row = rowOf(stone)
    await expect(row.getBoundingClientRect().height).toBe(40)
    const dial = row.querySelector('[aria-hidden]')!
    await expect(dial.getBoundingClientRect().width).toBe(20)
    await expect(dial.getBoundingClientRect().height).toBe(20)
    await expect(getComputedStyle(row).boxShadow).toContain('0px 0px 0px 1px inset')
    await expect(row.querySelector('kbd')).toHaveTextContent('A')

    // The fieldset is named by the question, not by a legend.
    const fieldset = stone.closest('fieldset')!
    await expect(fieldset).toHaveAccessibleName('Which neutral should it use?')

    // Next with nothing chosen: the question goes invalid and says so.
    const next = canvas.getByRole('button', { name: 'Next' })
    await userEvent.click(next)
    await expect(fieldset).toHaveAttribute('aria-invalid', 'true')
    // Scoped to the open question: the closed ones carry the same message,
    // hidden, and a page-wide query finds all three.
    await expect(within(fieldset).getByText('Choose an answer to continue.')).toBeVisible()
    await expect(stone).toHaveFocus()

    // Answer, and Next opens the second question.
    await userEvent.click(stone)
    await expect(row).toHaveAttribute('data-checked')
    await userEvent.click(next)
    await expect(progress).toHaveTextContent('Question 2 of 3')
    await expect(args.onItemChange).toHaveBeenCalledWith('themes')
    await expect(args.onAnswers).not.toHaveBeenCalled()
  },
}

/**
 * `multiple` turns a question's answers into checkboxes: the indicator is a
 * 6px-rounded box with a tick, and more than one row can be checked.
 *
 * Measured: the inputs are `type="checkbox"`; the indicator's radius is 6px;
 * two rows are checked at once; Enter from a checked box continues.
 */
export const MultiSelect: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  args: {
    children: (
      <>
        <Items items={[questions[1], questions[2]]} />
        <Questionnaire.Actions />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const light = canvas.getByRole('checkbox', { name: 'Light' })
    const dark = canvas.getByRole('checkbox', { name: 'Dark' })
    await expect(getComputedStyle(rowOf(light).querySelector('[aria-hidden]')!).borderRadius).toBe('6px')

    await userEvent.click(light)
    await userEvent.click(dark)
    await expect(rowOf(light)).toHaveAttribute('data-checked')
    await expect(rowOf(dark)).toHaveAttribute('data-checked')

    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('progressbar')).toHaveTextContent('Question 2 of 2')
  },
}

/**
 * A free-text alternative under the fixed answers. Typing into it is an
 * answer of its own: in a single-select question it unpicks the radio, and a
 * letter typed here is a letter, not a shortcut.
 *
 * Measured: the field is the rows' 40px; typing "Slate" after picking Stone
 * leaves Stone unchecked and the field filled; Enter submits the typed text.
 */
export const Freeform: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  args: {
    children: (
      <>
        <Items items={[questions[0]]} />
        <Questionnaire.Actions />
      </>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const stone = canvas.getByRole('radio', { name: 'Stone' })
    const field = canvas.getByRole('textbox', { name: 'Another neutral' })
    await expect(field.closest('div')!.getBoundingClientRect().height).toBe(rowOf(stone).getBoundingClientRect().height)

    // One question: no count, and Submit rather than Next.
    await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()

    await userEvent.click(stone)
    await expect(stone).toBeChecked()
    await userEvent.type(field, 'Slate')
    await expect(field).toHaveValue('Slate')
    await expect(stone).not.toBeChecked()
    await expect(field).toHaveAttribute('data-filled')

    await userEvent.keyboard('{Enter}')
    await expect(args.onAnswers).toHaveBeenCalledWith({ neutral: 'Slate' })
  },
}

/**
 * An optional question gets a Skip. Next still insists on an answer — the
 * message says an answer *or* a skip — and Skip records that the question
 * was left on purpose, which `onStatusChange` reports as `skipped`.
 *
 * Measured: the message copy; the status callback; the next question opens
 * and takes focus.
 */
export const Skip: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  render: function SkipStory(args) {
    const [status, setStatus] = useState<QuestionnaireItemStatus>('unanswered')
    return (
      <div className="flex flex-col gap-4">
        <Questionnaire {...args}>
          <Questionnaire.Item
            name="neutral"
            prompt="Which neutral should it use?"
            description="Skip this if you have no preference."
            onStatusChange={setStatus}
          >
            {questions[0].choices.map((choice) => (
              <Questionnaire.Choice key={choice.value} value={choice.value} label={choice.label} />
            ))}
          </Questionnaire.Item>
          <Items items={[questions[2]]} />
          <Questionnaire.Actions />
        </Questionnaire>
        <p className="m-0 text-sm text-content-subtle">
          First question: <output>{status}</output>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const skip = canvas.getByRole('button', { name: 'Skip' })
    await expect(skip).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    const first = canvas.getByRole('radio', { name: 'Stone' }).closest('fieldset')!
    await expect(within(first).getByText('Choose an answer or skip this question.')).toBeVisible()

    await userEvent.click(skip)
    await expect(canvas.getByRole('status')).toHaveTextContent('skipped')
    await expect(canvas.getByRole('progressbar')).toHaveTextContent('Question 2 of 2')
    const second = canvas.getByRole('radio', { name: 'Storybook' }).closest('fieldset')!
    await expect(second).toHaveFocus()
  },
}

/**
 * Figma's `Kbd` on every row, and what it does: `numbers` assigns 1 to 9,
 * `none` draws no key at all. A shortcut selects and never advances.
 *
 * Measured: the keys read 1, 2, 3; pressing 2 checks the second row and
 * leaves the count alone; with `none` the keys are hidden and a letter does
 * nothing.
 */
export const Shortcuts: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8 sm:flex-row">
      <section aria-label="Numbers" className="max-w-70 flex-1">
        <Questionnaire {...args} shortcuts="numbers" />
      </section>
      <section aria-label="None" className="max-w-70 flex-1">
        <Questionnaire {...args} shortcuts="none" />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const numbers = within(canvas.getByRole('region', { name: 'Numbers' }))
    const none = within(canvas.getByRole('region', { name: 'None' }))

    const slate = numbers.getByRole('radio', { name: 'Slate' })
    await expect(rowOf(numbers.getByRole('radio', { name: 'Stone' })).querySelector('kbd')).toHaveTextContent('1')
    await expect(rowOf(slate).querySelector('kbd')).toHaveTextContent('2')
    await expect(slate).toHaveAttribute('aria-keyshortcuts', '2')

    // A shortcut is read by the form, so focus has to be inside it. The
    // fieldset is where the primitive itself puts it when a question opens.
    slate.closest('fieldset')!.focus()
    await userEvent.keyboard('2')
    await expect(slate).toBeChecked()
    await expect(numbers.getByRole('progressbar')).toHaveTextContent('Question 1 of 3')

    const noneStone = none.getByRole('radio', { name: 'Stone' })
    await expect(rowOf(noneStone).querySelector('kbd')).not.toBeVisible()
    noneStone.closest('fieldset')!.focus()
    await userEvent.keyboard('a')
    await expect(noneStone).not.toBeChecked()
  },
}

/**
 * Figma's `Icon` and `Sub Label` booleans on: a 16px glyph after the dial
 * and a second line under the label, which makes the row 60.
 *
 * Measured: row height; the glyph's box; the control is described by its
 * own sub-label.
 */
export const WithIconsAndDescriptions: Story = {
  decorators: atCardWidth,
  parameters: { controls: { disable: true } },
  args: {
    children: (
      <>
        <Items items={[{ ...questions[0], choices: describedChoices }, questions[2]]} />
        <Questionnaire.Actions />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const stone = canvas.getByRole('radio', { name: 'Stone' })
    const row = rowOf(stone)
    await expect(row.getBoundingClientRect().height).toBe(60)
    const glyph = row.querySelector('svg')!
    await expect(glyph.getBoundingClientRect().width).toBe(16)
    await expect(glyph).toHaveAttribute('aria-hidden', 'true')
    await expect(stone).toHaveAccessibleDescription('Warm, the default')
  },
}

/**
 * The row's states, from the two Figma sets: at rest, selected (the ring
 * turns to Surface/Border Emphasized), disabled (the whole row at 40%), and
 * — not drawn in Figma — invalid, reached by pressing Next with nothing
 * chosen. Hover and focus are live states; `FocusRing` covers the second.
 *
 * Measured: the selected ring's color against the token; the disabled
 * row's opacity and its input; the invalid ring's color, the message, and
 * focus landing on the first answer; Submit is the one `type="submit"`.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-8 sm:flex-row">
      <section aria-label="Rows" className="max-w-70 flex-1">
        <Questionnaire {...args}>
          <Questionnaire.Item name="row" required prompt="Which neutral should it use?">
            <Questionnaire.Choice value="rest" label="At rest" />
            <Questionnaire.Choice value="selected" label="Selected" defaultChecked />
            <Questionnaire.Choice value="disabled" label="Disabled" disabled />
          </Questionnaire.Item>
          <Questionnaire.Actions />
        </Questionnaire>
      </section>
      <section aria-label="Invalid" className="max-w-70 flex-1">
        <Questionnaire {...args}>
          <Items items={[questions[0], questions[2]]} />
          <Questionnaire.Actions />
        </Questionnaire>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = within(canvas.getByRole('region', { name: 'Rows' }))
    const invalid = within(canvas.getByRole('region', { name: 'Invalid' }))

    const selected = rowOf(rows.getByRole('radio', { name: 'Selected' }))
    await expect(selected).toHaveAttribute('data-checked')
    await expect(getComputedStyle(selected).boxShadow).toContain(tokenColor('surface-border-emphasized'))

    const disabled = rows.getByRole('radio', { name: 'Disabled' })
    await expect(disabled).toBeDisabled()
    await expect(getComputedStyle(rowOf(disabled)).opacity).toBe('0.4')

    // One question: Submit is the visible action and the only submit button.
    const submit = rows.getByRole('button', { name: 'Submit' })
    await expect(submit).toHaveAttribute('type', 'submit')
    await expect(rows.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()

    await userEvent.click(invalid.getByRole('button', { name: 'Next' }))
    const stone = invalid.getByRole('radio', { name: 'Stone' })
    const fieldset = stone.closest('fieldset')!
    await expect(fieldset).toHaveAttribute('aria-invalid', 'true')
    await expect(within(fieldset).getByText('Choose an answer to continue.')).toBeVisible()
    await expect(stone).toHaveFocus()
    await expect(getComputedStyle(rowOf(stone)).boxShadow).toContain(tokenColor('feedback-danger-highlight'))
  },
}

/**
 * The keyboard contract, all of it the primitive's. Tab reaches the answers
 * as one group; a letter picks; ArrowDown moves *and* picks, as a native
 * radio group does; Enter continues and puts focus on the new question;
 * ArrowLeft from there goes back; Cmd/Ctrl+Enter continues from anywhere.
 *
 * Measured: each step's checked state, the count, and where focus is.
 */
export const Keyboard: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const progress = canvas.getByRole('progressbar')
    const stone = canvas.getByRole('radio', { name: 'Stone' })
    const slate = canvas.getByRole('radio', { name: 'Slate' })
    const zinc = canvas.getByRole('radio', { name: 'Zinc' })

    await userEvent.tab()
    await expect(stone).toHaveFocus()

    await userEvent.keyboard('b')
    await expect(slate).toBeChecked()
    await expect(progress).toHaveTextContent('Question 1 of 3')

    await userEvent.keyboard('{ArrowDown}')
    await expect(zinc).toBeChecked()
    await expect(zinc).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect(progress).toHaveTextContent('Question 2 of 3')
    const second = canvas.getByRole('checkbox', { name: 'Light' }).closest('fieldset')!
    await expect(second).toHaveFocus()

    // From the question itself, Tab reaches its first answer.
    await userEvent.tab()
    await expect(canvas.getByRole('checkbox', { name: 'Light' })).toHaveFocus()

    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    await expect(progress).toHaveTextContent('Question 3 of 3')

    // ArrowLeft from the question goes back.
    await userEvent.keyboard('{ArrowLeft}')
    await expect(progress).toHaveTextContent('Question 2 of 3')
    await expect(second).toHaveFocus()
  },
}

/**
 * The answers as they come out. `onAnswers` reads the form once every
 * question validates: a string per question, an array for the `multiple`
 * one, and nothing for a question that was skipped.
 *
 * Measured: the record `onAnswers` receives, once.
 */
export const Submit: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const next = canvas.getByRole('button', { name: 'Next' })

    await userEvent.click(canvas.getByRole('radio', { name: 'Stone' }))
    await userEvent.click(next)
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Light' }))
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Dark' }))
    await userEvent.click(next)
    await userEvent.click(canvas.getByRole('radio', { name: 'Storybook' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }))

    await expect(args.onAnswers).toHaveBeenCalledTimes(1)
    await expect(args.onAnswers).toHaveBeenCalledWith({
      neutral: 'stone',
      themes: ['light', 'dark'],
      docs: 'storybook',
    })
  },
}

/**
 * The open question controlled from outside, with the same array handed to
 * the root as `items` so the primitive can check the rendered questions
 * against it. A host that keeps its own checkpoint — or returns to a
 * question its own validator rejected — does this.
 *
 * Measured: the control opens the question it names; Next reports through
 * `onItemChange` and the host moves.
 */
export const Controlled: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  render: function ControlledStory(args) {
    const [item, setItem] = useState<string>('neutral')
    return (
      <div className="flex flex-col gap-4">
        <SegmentedControl aria-label="Question" value={item} onValueChange={setItem}>
          {questions.map((question, index) => (
            <SegmentedControl.Item key={question.name} value={question.name}>
              {index + 1}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
        <Questionnaire {...args} items={questions} item={item} onItemChange={setItem}>
          <Items items={questions} />
          <Questionnaire.Actions />
        </Questionnaire>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const progress = canvas.getByRole('progressbar')
    await userEvent.click(canvas.getByRole('radio', { name: '3' }))
    await expect(progress).toHaveTextContent('Question 3 of 3')
    await expect(canvas.getByRole('radio', { name: 'Storybook' })).toBeVisible()

    await userEvent.click(canvas.getByRole('radio', { name: '1' }))
    await userEvent.click(canvas.getByRole('radio', { name: 'Stone' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(progress).toHaveTextContent('Question 2 of 3')
    await expect(canvas.getByRole('radio', { name: '2' })).toBeChecked()
  },
}

/**
 * One ring at a time, on the thing that has focus. The answer's input is
 * `sr-only`, so the row draws the ring for it (`focusRingWithin`); the
 * free-text field's box draws its own. Real Tab presses — a scripted
 * `focus()` never matches `:focus-visible`.
 *
 * Measured: the 4px outer ring on the focused row and not on the field,
 * then the reverse after one more Tab.
 */
export const FocusRing: Story = {
  decorators: atFigmaWidth,
  parameters: { controls: { disable: true } },
  args: {
    children: (
      <>
        <Items items={[questions[0]]} />
        <Questionnaire.Actions />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const row = rowOf(canvas.getByRole('radio', { name: 'Stone' }))
    const field = canvas.getByRole('textbox', { name: 'Another neutral' }).closest('div')!

    await userEvent.tab()
    await expect(getComputedStyle(row).boxShadow).toContain('0px 0px 0px 4px')
    await expect(getComputedStyle(field).boxShadow).not.toContain('0px 0px 0px 4px')

    await userEvent.tab()
    await expect(getComputedStyle(field).boxShadow).toContain('0px 0px 0px 4px')
    await expect(getComputedStyle(row).boxShadow).not.toContain('0px 0px 0px 4px')
  },
}

/**
 * The questionnaire, answered: Figma's `Questionnaire Recap` (40005537:65099),
 * a Card of question / answer pairs, the answer the darker line. The
 * `multiple` question's labels are joined; values come back as their labels.
 *
 * Measured: three terms and three definitions in a `<dl>`; the pairs 8px
 * apart with no gap inside; both lines 12/20; the question on
 * `content-subtle` and the answer on `content-primary`.
 */
export const Recap: Story = {
  decorators: atCardWidth,
  parameters: { controls: { disable: true } },
  render: () => (
    <Questionnaire.Recap
      items={questions}
      answers={{ neutral: 'stone', themes: ['light', 'dark'], docs: 'storybook' }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const terms = canvas.getAllByRole('term')
    const answers = canvas.getAllByRole('definition')
    await expect(terms).toHaveLength(3)
    await expect(answers[1]).toHaveTextContent('Light, Dark')

    await expect(getComputedStyle(terms[0]).color).toBe(tokenColor('content-subtle'))
    await expect(getComputedStyle(answers[0]).color).toBe(tokenColor('content-primary'))
    await expect(getComputedStyle(terms[0]).fontSize).toBe('12px')
    await expect(answers[0].getBoundingClientRect().top - terms[0].getBoundingClientRect().bottom).toBe(0)
    await expect(terms[1].getBoundingClientRect().top - answers[0].getBoundingClientRect().bottom).toBe(8)
  },
}

/**
 * A skipped question stays on the page, saying so in italic — a recap that
 * drops a line reads as if the question was never asked — and a typed answer
 * prints as typed.
 *
 * Measured: the skipped definition's text and italic; the free text verbatim.
 */
export const RecapSkippedAndFreeText: Story = {
  decorators: atCardWidth,
  parameters: { controls: { disable: true } },
  render: () => <Questionnaire.Recap items={questions} answers={{ neutral: 'Taupe', docs: 'both' }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const answers = canvas.getAllByRole('definition')
    await expect(answers[0]).toHaveTextContent('Taupe')
    await expect(answers[1]).toHaveTextContent('Skipped')
    await expect(getComputedStyle(answers[1]).fontStyle).toBe('italic')
    await expect(answers[2]).toHaveTextContent('Both')
  },
}

const askedAt = { label: '12:30 PM', dateTime: '2026-09-20T12:30' }

/**
 * Where it lives: an assistant's turn. The person asks for something
 * underspecified, the assistant checks what it has, and instead of guessing
 * it asks — the questionnaire sits in a received, `fill` bubble on the
 * primary surface. Once it is answered, the recap takes its place in the
 * same bubble: the log keeps the answers, not a dead form, and the person
 * never had to type them.
 *
 * Measured: the questionnaire fills the bubble's width rather than
 * three-quarters of it; after Submit the form is gone, the recap is in the
 * same bubble, and the log still has two turns.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: function InContextStory() {
    const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null)

    return (
      <div className="flex h-[calc(100dvh-3rem)] gap-2 p-2">
        <SideNav
          aria-label="Main"
          logo={<Logo />}
          utilities={
            <>
              <NavItem href="#help" startIcon={CircleHelp}>
                Help
              </NavItem>
              <NavItem
                href="#account"
                start={<Avatar size="x-small" src={samplePhoto} name="Nathan Sanders" status="online" />}
              >
                Nathan · Pro
              </NavItem>
            </>
          }
        >
          <SideNav.Section>
            <NavItem href="#new" startIcon={Plus}>
              New
            </NavItem>
            <NavItem href="#search" startIcon={Search}>
              Search
            </NavItem>
          </SideNav.Section>
          <SideNav.Section header="Chats">
            {chats.map((chat, i) => (
              <NavItem key={chat} href={`#chat-${i}`} selected={i === 0}>
                {chat}
              </NavItem>
            ))}
          </SideNav.Section>
        </SideNav>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-background-primary">
          <TopBar
            breadcrumbs={
              <Breadcrumbs>
                <Breadcrumbs.Item>Neutral for the new app</Breadcrumbs.Item>
              </Breadcrumbs>
            }
            actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="More" />}
          />
          <div role="log" aria-label="Conversation" className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mx-auto flex w-full max-w-175 flex-col gap-2">
              <ChatMessage
                direction="sent"
                sender="Nathan"
                metadata={<ChatMessage.Metadata timestamp={askedAt.label} dateTime={askedAt.dateTime} />}
              >
                <ChatMessage.Bubble>Set up the new app on the design system.</ChatMessage.Bubble>
              </ChatMessage>
              <ThoughtProcess label="Checked what the request leaves open">
                <ToolCall status="done">Read the app's package.json</ToolCall>
                <ToolCall status="done">Listed the nine neutral ramps</ToolCall>
                <ToolCall status="done">Found no theme or docs preference on file</ToolCall>
              </ThoughtProcess>
              <ChatMessage sender="Yet" layout="fill">
                <ChatMessage.Bubble appearance="ghost">
                  {answers
                    ? 'Got it. Setting it up with these:'
                    : 'Three things decide the setup. Answer these and I will do the rest.'}
                </ChatMessage.Bubble>
                <ChatMessage.Bubble appearance="ghost" className="w-full">
                  {answers ? (
                    <Questionnaire.Recap items={questions} answers={answers} />
                  ) : (
                    <Questionnaire onAnswers={setAnswers}>
                      <Items items={questions} />
                      <Questionnaire.Actions />
                    </Questionnaire>
                  )}
                </ChatMessage.Bubble>
              </ChatMessage>
              <div className="p-3 text-content-emphasized">
                <Mark />
              </div>
            </div>
          </div>
          <div className="px-4 pb-2 pt-1">
            <div className="mx-auto flex w-full max-w-175 flex-col items-center gap-1">
              <ChatComposer
                aria-label="Reply"
                placeholder="Reply"
                actions={<Button appearance="ghost" startIcon={Plus} aria-label="Attach" />}
                endActions={<Button appearance="ghost" startIcon={Mic} aria-label="Dictate" />}
              />
              <Link href="#disclaimer" size="sm">
                Yet is AI and AI can make mistakes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const log = within(canvas.getByRole('log', { name: 'Conversation' }))
    await expect(log.getAllByRole('article')).toHaveLength(2)

    // `fill` on the message and `w-full` on the bubble: the questionnaire is
    // as wide as the thread, less the bubble's own padding, rather than the
    // three quarters a hugging message would give it.
    const form = log.getByRole('radio', { name: 'Stone' }).closest('form')!
    const thread = form.closest('[role="log"]')!.firstElementChild!
    const bubble = form.parentElement!
    const padding = parseFloat(getComputedStyle(bubble).paddingLeft) * 2
    await expect(form.getBoundingClientRect().width).toBe(thread.getBoundingClientRect().width - padding)

    const next = log.getByRole('button', { name: 'Next' })
    await userEvent.click(log.getByRole('radio', { name: 'Stone' }))
    await userEvent.click(next)
    await userEvent.click(log.getByRole('checkbox', { name: 'Light' }))
    await userEvent.click(next)
    await userEvent.click(log.getByRole('radio', { name: 'Both' }))
    await userEvent.click(log.getByRole('button', { name: 'Submit' }))

    // The recap stands where the form stood, in the same bubble.
    await waitFor(() => expect(log.queryByRole('radio', { name: 'Stone' })).not.toBeInTheDocument())
    const recap = log.getAllByRole('term')
    await expect(recap).toHaveLength(3)
    await expect(bubble.contains(recap[0])).toBe(true)
    await expect(log.getAllByRole('definition')[2]).toHaveTextContent('Both')
    await expect(log.getAllByRole('article')).toHaveLength(2)
  },
}
