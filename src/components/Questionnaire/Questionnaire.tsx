import {
  useContext,
  useId,
  type ComponentProps,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react'
import { Questionnaire as QuestionnairePrimitive } from '@shadcn/react/questionnaire'
import type {
  QuestionnaireChoiceDefinition as PrimitiveChoiceDefinition,
  QuestionnaireItemDefinition as PrimitiveItemDefinition,
} from '@shadcn/react/questionnaire'
import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Button, type ButtonProps } from '../Button'
import { Card, type CardProps } from '../Card'
import { Form, type FormActionsProps } from '../Form'
import { Icon } from '../Icon'
import { box as inputBox, control as inputControl, type InputSize } from '../Input/styles'
import { Kbd, type KbdProps } from '../Kbd'
import { readAnswers, recapAnswers, type QuestionnaireAnswers, type QuestionnaireRecapItem } from './answers'
import { QuestionnaireContext, QuestionnaireItemContext } from './context'
import {
  actions,
  box,
  boxGlyph,
  choice,
  choiceDescription,
  choiceIcon,
  choiceLabel,
  choiceText,
  choices,
  description as descriptionText,
  dial,
  dialDot,
  error as errorText,
  header,
  item,
  progress as progressText,
  recapAnswer,
  recapList,
  recapPair,
  recapQuestion,
  root,
  title as titleText,
  titleGroup,
} from './styles'

export type { QuestionnaireAnswers, QuestionnaireRecapEntry, QuestionnaireRecapItem } from './answers'
export type { QuestionnaireItemStatus } from '@shadcn/react/questionnaire'

/**
 * Questionnaire — an assistant that needs answers before it can go on, one
 * question at a time.
 *
 * Mirrors the Figma section "Questionnaire" (node 40005494:63853): the
 * `Questionnaire` frame (40005494:64409), `Questionnaire Options`
 * (40005494:64349, `Type` Single Select | Multi Select) and the two row sets
 * `Questionnaire Item Radio` (40005494:64023) and `Questionnaire Item
 * Checkbox` (40005494:63972), each `State` (Default | Hover | Focus | Disabled)
 * x `Selected`, with `Icon` and `Sub Label` booleans and a `Kbd` at the end.
 *
 *     <Questionnaire onAnswers={reply}>
 *       <Questionnaire.Item name="neutral" required prompt="Which neutral?"
 *         description="Choose one or describe another.">
 *         <Questionnaire.Choice value="stone" label="Stone" />
 *         <Questionnaire.Choice value="slate" label="Slate" />
 *         <Questionnaire.Input aria-label="Another neutral" placeholder="Describe another…" />
 *       </Questionnaire.Item>
 *       <Questionnaire.Item name="themes" multiple required prompt="Which themes?">
 *         <Questionnaire.Choice value="light" label="Light" />
 *         <Questionnaire.Choice value="dark" label="Dark" />
 *       </Questionnaire.Item>
 *       <Questionnaire.Actions />
 *     </Questionnaire>
 *
 * **The library's first form primitive that is not Base UI's.** Base UI has
 * the radio and the checkbox but not the step machine around them — which
 * question is open, whether it has been answered or skipped, validating one
 * before moving on, focusing the next, letter shortcuts, Enter to continue —
 * and the bar for a library here is the one `@dnd-kit` cleared: check what the
 * platform or the headless primitive already does before writing it. shadcn's
 * `@shadcn/react/questionnaire` does all of it on native `<form>`, `<fieldset>`,
 * `<input type="radio|checkbox">` and `<button>` elements, renders nothing
 * styled, and has no dependency but React. So it is the engine, and every
 * pixel here is ours.
 *
 * **Every question is a `<fieldset>`, and the one that is open is the only one
 * in the page.** The others are `hidden` and `inert`, which is what keeps Tab,
 * the accessibility tree and `FormData` honest at once. The open question's
 * title names it (`aria-labelledby`), its description and — while it is
 * invalid — its message describe it (`aria-describedby`).
 *
 * **Answers come out as a native form submits them.** `onAnswers` reads the
 * form's `FormData` once every question has validated: one string per
 * question, an array for a `multiple` one, and a skipped question absent
 * rather than empty. The native `onSubmit` still fires first, for a caller
 * that wants the event.
 *
 * **Shortcuts are on by default** because the file draws a Kbd on every row.
 * A letter selects and never advances; Enter is what continues, and
 * Cmd/Ctrl+Enter continues from anywhere. Both pause while you type in the
 * free-text field.
 */

type PrimitiveRootProps = ComponentProps<typeof QuestionnairePrimitive.Root>
type PrimitiveItemProps = ComponentProps<typeof QuestionnairePrimitive.Item>
type PrimitiveChoiceProps = ComponentProps<typeof QuestionnairePrimitive.Choice>
type PrimitiveInputProps = ComponentProps<typeof QuestionnairePrimitive.Input>

/** Which key each answer gets, or `none` for no Kbd at all. */
export type QuestionnaireShortcuts = 'letters' | 'numbers' | 'none'

export interface QuestionnaireProps
  extends Omit<PrimitiveRootProps, 'className' | 'shortcuts' | 'children'> {
  /**
   * A letter or a number on every answer, or none. Defaults to `letters`
   * because the file draws the key on every row; the primitive's own default
   * is off. A shortcut selects its answer and does not advance.
   */
  shortcuts?: QuestionnaireShortcuts
  /**
   * Draws "Question 1 of 3" above each question. Figma's `Number of
   * Questions` boolean. A questionnaire with one question never shows it,
   * whatever this says — there is nothing to count.
   */
  progress?: boolean
  /**
   * Every answer, by question name, once the last question submits. A
   * `multiple` question is an array; a skipped one is absent. Prevents the
   * native submit, since a chat answers in place. `onSubmit` still fires,
   * first, for a caller that wants the event or the navigation.
   */
  onAnswers?: (answers: QuestionnaireAnswers) => void
  /** `Questionnaire.Item`s, then a `Questionnaire.Actions`. */
  children: ReactNode
  className?: string
}

export function Questionnaire({
  shortcuts = 'letters',
  progress = true,
  onAnswers,
  onSubmit,
  className,
  children,
  ...props
}: QuestionnaireProps) {
  const handleSubmit: PrimitiveRootProps['onSubmit'] = (event) => {
    onSubmit?.(event)
    if (!onAnswers) return
    event.preventDefault()

    const form = event.currentTarget
    // FormData cannot tell one ticked box from one picked radio, so the names
    // whose controls are checkboxes are read off the form itself. Only the
    // open question's controls are enabled, but a hidden, inert fieldset
    // still submits — that is what makes one FormData hold every answer.
    const multiple = new Set<string>()
    for (const element of form.elements) {
      if (element instanceof HTMLInputElement && element.type === 'checkbox' && element.name) {
        multiple.add(element.name)
      }
    }
    onAnswers(readAnswers(new FormData(form).entries(), multiple))
  }

  return (
    <QuestionnaireContext.Provider value={{ progress }}>
      <QuestionnairePrimitive.Root
        shortcuts={shortcuts === 'none' ? undefined : shortcuts}
        onSubmit={handleSubmit}
        className={cn(root(), className)}
        {...props}
      >
        {children}
      </QuestionnairePrimitive.Root>
    </QuestionnaireContext.Provider>
  )
}

Questionnaire.displayName = 'Questionnaire'

export interface QuestionnaireItemProps
  extends Omit<PrimitiveItemProps, 'className' | 'children' | 'title'> {
  /**
   * The question. Figma's `Question Text`. Not `title`, which is a DOM
   * attribute a fieldset already has — the naming trap Banner and Divider
   * walked into first.
   */
  prompt: ReactNode
  /** The line under it. Figma's `Question Description`. */
  description?: ReactNode
  /**
   * The message when the question fails validation. The primitive's own copy
   * otherwise — "Choose an answer to continue." or, for an optional
   * question, "Choose an answer or skip this question."
   */
  error?: ReactNode
  /** `Questionnaire.Choice`s, and a `Questionnaire.Input` if another answer is allowed. */
  children: ReactNode
  className?: string
}

/**
 * One question: its number, its title, its description, its answers and its
 * message, in a `<fieldset>` the primitive opens and closes.
 *
 * The title is a `<p>` named to the fieldset with `aria-labelledby` rather
 * than a `<legend>`, which is the primitive's own documented composition. Two
 * reasons. A legend is never a flex item — the browser draws it in the
 * fieldset's border — so the file's "Question 1 of 3" sitting 8px above the
 * title inside the same column cannot be drawn round one. And the ordinary
 * home is a chat log, where a run of headings would enter the page outline
 * (Toast's reason for its `<p>` title too).
 */
function QuestionnaireItem({
  prompt,
  description,
  error,
  multiple = false,
  className,
  children,
  ...props
}: QuestionnaireItemProps) {
  const titleId = useId()
  const { progress } = useContext(QuestionnaireContext)

  return (
    <QuestionnaireItemContext.Provider value={{ multiple }}>
      <QuestionnairePrimitive.Item
        multiple={multiple}
        aria-labelledby={titleId}
        className={cn(item(), className)}
        {...props}
      >
        <div className={header()}>
          <QuestionnairePrimitive.Progress
            // Nothing, rather than a hidden progressbar, when there is one
            // question: an empty `role="progressbar"` in the tree says
            // something is loading.
            render={(renderProps, state) =>
              progress && state.total > 1 ? (
                <div {...(renderProps as ComponentPropsWithRef<'div'>)} className={progressText()} />
              ) : null
            }
          />
          <div className={titleGroup()}>
            <QuestionnairePrimitive.Title render={<p id={titleId} className={titleText()} />}>
              {prompt}
            </QuestionnairePrimitive.Title>
            {description != null && (
              <QuestionnairePrimitive.Description className={descriptionText()}>
                {description}
              </QuestionnairePrimitive.Description>
            )}
          </div>
        </div>

        <QuestionnairePrimitive.Choices className={choices()}>{children}</QuestionnairePrimitive.Choices>

        {/* `undefined` children leave the primitive's own copy in place. */}
        <QuestionnairePrimitive.Error className={errorText()}>{error}</QuestionnairePrimitive.Error>
      </QuestionnairePrimitive.Item>
    </QuestionnaireItemContext.Provider>
  )
}

QuestionnaireItem.displayName = 'Questionnaire.Item'

export interface QuestionnaireChoiceProps
  extends Omit<PrimitiveChoiceProps, 'className' | 'render' | 'children'> {
  /** The visible answer. Figma's `Label Text`. */
  label: ReactNode
  /** Secondary line under it. Figma's `Sub Label`. */
  description?: ReactNode
  /**
   * A 16px glyph before the label. Figma's `Icon` boolean. Pass the
   * component itself: `icon={Palette}`, not `<Palette />`.
   */
  icon?: LucideIcon
  className?: string
}

/**
 * One answer. A `<label>` round a native radio or checkbox the primitive
 * owns, so clicking anywhere on the row picks it, and the row is what the
 * eye sees: the input is `sr-only`, the indicator beside it is painted off
 * the row's `data-checked`, and the ring goes round the row.
 *
 * Whether it is a dial or a box comes from the question's `multiple`, read
 * through context — the same fact the primitive puts on the row as
 * `data-type`, but the glyph inside differs by element (a dot, a `Check`),
 * so the branch has to be JavaScript either way.
 */
function QuestionnaireChoice({
  label,
  description,
  icon,
  disabled,
  className,
  ...props
}: QuestionnaireChoiceProps) {
  const { multiple } = useContext(QuestionnaireItemContext)
  const id = useId()
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`

  return (
    <QuestionnairePrimitive.Choice
      disabled={disabled}
      className={cn(choice({ disabled: Boolean(disabled) }), className)}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        className="sr-only"
        // Named by its own text and described by its own sub-label, as Radio
        // does: a wrapping <label> would otherwise name the input with
        // everything in the row, sub-label included, run together. Only
        // spread when there is text to point at.
        aria-labelledby={labelId}
        {...(description != null && { 'aria-describedby': descriptionId })}
      />

      <span aria-hidden className={multiple ? box : dial}>
        {multiple ? (
          <Icon icon={Check} size="small" className={boxGlyph()} />
        ) : (
          <span className={dialDot()} />
        )}
      </span>

      {icon && <Icon icon={icon} size="base" className={choiceIcon()} />}

      <QuestionnairePrimitive.ChoiceLabel className={choiceText()}>
        <span id={labelId} className={choiceLabel()}>
          {label}
        </span>
        {description != null && (
          <span id={descriptionId} className={choiceDescription()}>
            {description}
          </span>
        )}
      </QuestionnairePrimitive.ChoiceLabel>

      <QuestionnairePrimitive.ChoiceShortcut
        // The library's own Kbd, which is what the file draws. The primitive
        // hands over the letter as `children` and `KbdProps` has no children
        // (the key is drawn from `keys`), so it is dropped here. The span
        // arrives `aria-hidden` and, with no shortcut, `hidden` — and
        // `[hidden]` beats Kbd's `inline-flex`, so nothing more is needed.
        render={(renderProps, state) => {
          const { children: _shortcut, ...rest } = renderProps as Omit<KbdProps, 'keys'> & {
            children?: ReactNode
          }
          return <Kbd {...rest} keys={state.shortcut ?? ''} />
        }}
      />
    </QuestionnairePrimitive.Choice>
  )
}

QuestionnaireChoice.displayName = 'Questionnaire.Choice'

export interface QuestionnaireInputProps
  extends Omit<PrimitiveInputProps, 'className' | 'render' | 'size'> {
  /**
   * Required: the field has no visible label, and a placeholder is not one.
   * ChatComposer's rule. Say what an answer typed here is — "Another neutral".
   */
  'aria-label': string
  /**
   * Input's scale. Defaults to `large` (40px) rather than Input's own
   * `default` (32): the file draws the field at `px-3 py-2` on 14/24, which is
   * 40, the same height as the rows above it. A measured constraint, not a
   * preference — the one kind of reason for reaching past the default.
   */
  size?: InputSize
  className?: string
}

/**
 * Another answer, typed. Figma's `User Option Input`: Input's box and
 * caret, the placeholder italic in Content/Subtle as every placeholder here
 * is. The primitive keeps the field out of the form until something is typed
 * into it, and in a single-select question typing here unpicks the radio.
 * It lights up on a failed validation through the box's own
 * `has-[[data-invalid]]` rule, because the primitive puts `data-invalid` on
 * the input.
 */
function QuestionnaireInput({ size = 'large', className, ...props }: QuestionnaireInputProps) {
  return (
    // `ring: 'within'` is right here where NumberInput needed `input`: this
    // box has exactly one focusable descendant.
    <div className={cn(inputBox({ size, ring: 'within' }), className)}>
      <QuestionnairePrimitive.Input className={inputControl({ size })} {...props} />
    </div>
  )
}

QuestionnaireInput.displayName = 'Questionnaire.Input'

export interface QuestionnaireActionsProps extends Omit<FormActionsProps, 'align' | 'children'> {
  /**
   * The buttons. Leave it out for Previous, Skip, Next and Submit in that
   * order — the primitive shows and hides each as the open question changes,
   * so the default set is the right set on every question. Pass children to
   * replace it.
   */
  children?: ReactNode
}

/**
 * The footer. Figma draws `flex justify-end gap-2` with one primary "Next",
 * and that is `Form.Actions`, which exists because twelve stories had
 * hand-rolled the row before it did.
 */
function QuestionnaireActions({ className, children, ...props }: QuestionnaireActionsProps) {
  return (
    <Form.Actions align="end" className={cn(actions(), className)} {...props}>
      {children ?? (
        <>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </>
      )}
    </Form.Actions>
  )
}

QuestionnaireActions.displayName = 'Questionnaire.Actions'

export interface QuestionnaireNavigationProps
  extends Omit<ComponentPropsWithRef<'button'>, 'type' | 'children' | 'color'> {
  /** The label. "Previous", "Skip", "Next" or "Submit" by default. */
  children?: ReactNode
  /** Button's appearance. Previous is `secondary`, Skip `ghost`, Next and Submit `primary`. */
  appearance?: ButtonProps['appearance']
  startIcon?: LucideIcon
  endIcon?: LucideIcon
}

/**
 * The four navigation buttons are the primitive's, drawn as `Button` through
 * `render`. The merge is element-wins, so what is written on the `<Button>`
 * here is what shows; the primitive's own props — `type="submit"` on Submit,
 * `hidden` and `inert` when a button does not apply, `aria-keyshortcuts` —
 * still arrive, because Button's `type="button"` is a destructuring default
 * rather than something written on the element. Never write `type` on the
 * render element, and always write `children`: `ButtonProps` requires it.
 */
function QuestionnairePrevious({
  children = 'Previous',
  appearance = 'secondary',
  startIcon,
  endIcon,
  ...props
}: QuestionnaireNavigationProps) {
  return (
    <QuestionnairePrimitive.Previous
      {...props}
      render={
        <Button appearance={appearance} startIcon={startIcon} endIcon={endIcon}>
          {children}
        </Button>
      }
    />
  )
}

QuestionnairePrevious.displayName = 'Questionnaire.Previous'

function QuestionnaireSkip({
  children = 'Skip',
  appearance = 'ghost',
  startIcon,
  endIcon,
  ...props
}: QuestionnaireNavigationProps) {
  return (
    <QuestionnairePrimitive.Skip
      {...props}
      render={
        <Button appearance={appearance} startIcon={startIcon} endIcon={endIcon}>
          {children}
        </Button>
      }
    />
  )
}

QuestionnaireSkip.displayName = 'Questionnaire.Skip'

function QuestionnaireNext({
  children = 'Next',
  appearance = 'primary',
  startIcon,
  endIcon,
  ...props
}: QuestionnaireNavigationProps) {
  return (
    <QuestionnairePrimitive.Next
      {...props}
      render={
        <Button appearance={appearance} startIcon={startIcon} endIcon={endIcon}>
          {children}
        </Button>
      }
    />
  )
}

QuestionnaireNext.displayName = 'Questionnaire.Next'

function QuestionnaireSubmit({
  children = 'Submit',
  appearance = 'primary',
  startIcon,
  endIcon,
  ...props
}: QuestionnaireNavigationProps) {
  return (
    <QuestionnairePrimitive.Submit
      {...props}
      render={
        <Button appearance={appearance} startIcon={startIcon} endIcon={endIcon}>
          {children}
        </Button>
      }
    />
  )
}

QuestionnaireSubmit.displayName = 'Questionnaire.Submit'

export interface QuestionnaireRecapProps extends Omit<CardProps, 'children'> {
  /** The questions, as they were mapped into the `Questionnaire.Item`s. */
  items: readonly QuestionnaireRecapItem[]
  /** What `onAnswers` handed over. */
  answers: QuestionnaireAnswers
  /** What a skipped question says. */
  skippedLabel?: ReactNode
}

/**
 * The questionnaire, answered — what stands in the assistant's turn once the
 * form has done its job, so the log keeps the answers and not a dead form.
 *
 * Mirrors the Figma component "Questionnaire Recap" (node 40005537:65099): a
 * Card holding one pair per question, the question in Content/Subtle over the
 * answer in Content/Primary. It is a `<dl>` — a question is a term and its
 * answer the definition, which is what a screen reader reads it as — and the
 * words come from `recapAnswers`: a value becomes its choice's label, free
 * text prints as typed, a `multiple` answer's labels are joined, and a skipped
 * question is still a line, saying so in italic, because a recap that drops a
 * question reads as if it was never asked.
 *
 * No edit action. Changing an answer is a new turn in the conversation, not a
 * button on the record of the last one.
 */
function QuestionnaireRecap({
  items,
  answers,
  skippedLabel = 'Skipped',
  className,
  ...props
}: QuestionnaireRecapProps) {
  const entries = recapAnswers(items, answers)

  return (
    <Card className={className} {...props}>
      <dl className={recapList()}>
        {entries.map((entry) => (
          <div key={entry.name} className={recapPair()}>
            <dt className={recapQuestion()}>{entry.prompt}</dt>
            <dd className={recapAnswer({ skipped: entry.answer === null })}>
              {entry.answer === null
                ? skippedLabel
                : entry.answer.map((label, index) => (
                    // Index is the key: an answer is a fixed list of labels
                    // that never reorders, and two can legitimately match.
                    <span key={index}>
                      {index > 0 && ', '}
                      {label}
                    </span>
                  ))}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

QuestionnaireRecap.displayName = 'Questionnaire.Recap'

Questionnaire.Item = QuestionnaireItem
Questionnaire.Choice = QuestionnaireChoice
Questionnaire.Recap = QuestionnaireRecap
Questionnaire.Input = QuestionnaireInput
Questionnaire.Actions = QuestionnaireActions
Questionnaire.Previous = QuestionnairePrevious
Questionnaire.Skip = QuestionnaireSkip
Questionnaire.Next = QuestionnaireNext
Questionnaire.Submit = QuestionnaireSubmit

/**
 * The shape of a question as data, for a caller — an agent's tool result,
 * say — that holds the questions and maps them into the parts. It is the
 * primitive's own `QuestionnaireItemDefinition` with the words added, so the
 * same array can be handed to the root as `items` for validation and
 * server-rendered order, and mapped into `Questionnaire.Item`s.
 */
export interface QuestionnaireChoiceDefinition extends PrimitiveChoiceDefinition {
  label: ReactNode
  description?: ReactNode
  icon?: LucideIcon
}

export interface QuestionnaireItemDefinition extends Omit<PrimitiveItemDefinition, 'choices'> {
  prompt: ReactNode
  description?: ReactNode
  multiple?: boolean
  choices: readonly QuestionnaireChoiceDefinition[]
  /** A free-text alternative under the choices. */
  input?: { 'aria-label': string; placeholder?: string }
}
