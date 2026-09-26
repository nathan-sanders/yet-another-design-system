import { tv } from 'tailwind-variants'

import { checkboxBox, controlRow, radioDial } from '../Checkbox/styles'

/**
 * The form. Figma's `Questionnaire` frame: a column at `spacing/4` (16px)
 * between the question, its answers and the footer. `min-w-0` because the
 * ordinary home is a chat bubble in a flex column, and a form that will not
 * shrink below its content pushes the bubble out of the log.
 */
export const root = tv({
  base: 'flex w-full min-w-0 flex-col gap-4 font-sans',
})

/**
 * One question — the `<fieldset>`. Same 16px rhythm inside it: header, then
 * the answers, then the message. `m-0 border-0 p-0` undoes what a fieldset
 * draws by default; `min-w-0` because a fieldset's default
 * `min-inline-size: min-content` refuses to shrink in a narrow column.
 *
 * No focus ring, on purpose. The primitive moves focus here when a question
 * opens (it is `tabindex="-1"`), and a ring round a whole question — its
 * title, every row and the message — is the container-ring problem TreeList
 * solved by not doing it. The newly revealed question is the signal, and the
 * next Tab lands on the first answer with a ring of its own.
 */
export const item = tv({
  base: 'flex w-full min-w-0 flex-col gap-4 m-0 border-0 p-0 outline-none',
})

/** Figma's "Question" frame: the count sits `spacing/2` (8px) above the title. */
export const header = tv({ base: 'flex flex-col gap-2' })

/** "Question 1 of 3" — `text-sm/normal` on Content/Subtle. */
export const progress = tv({ base: 'text-sm font-normal text-content-subtle' })

/** Figma's "Span": the title and its description with no gap between them. */
export const titleGroup = tv({ base: 'flex flex-col' })

/** The question itself — `text-base/semibold` on Content/Emphasized. */
export const title = tv({ base: 'm-0 text-base font-semibold text-content-emphasized' })

/**
 * The line under the question — `text-sm/normal` on Content/Subtle, the same
 * step as every other sub-label in the library (Field's description, a
 * Radio's, a Choice's below). The file first bound it to Content/Primary, one
 * step darker; Nathan moved it to Subtle on 2026-09-20 and the code followed.
 */
export const description = tv({ base: 'm-0 text-sm font-normal text-content-subtle' })

/** Figma's "Selections": the rows and the free-text field, `spacing/2` apart. */
export const choices = tv({ base: 'flex flex-col gap-2' })

/** The validation message, in Field's voice: small, italic, Content/Danger. */
export const error = tv({ base: 'm-0 text-sm font-normal italic text-content-danger' })

/**
 * One answer — the `<label>` card round a hidden native radio or checkbox.
 *
 * It is the shared control card (`Checkbox/styles.ts`), laid out flat like
 * Radio's and with no fill: Figma's `Questionnaire Item Radio` / `Checkbox`
 * draw the same `px-3 py-2 gap-3 rounded-md` row with the same 1px inside
 * stroke on Surface/Border, and the answers stack inside a bubble that is
 * already the primary surface. `disabled` and `invalid` come from the shared
 * card too — the primitive puts `data-invalid` on the input, which the card's
 * `has-` rule reads, and `disabled` is passed as a prop.
 *
 * Three things are this row's alone, added on top. It is `group/row`, which is
 * where the indicator inside reads its state (the primitive sets
 * `data-checked` on this label, not on a control). Selected swaps the ring to
 * Surface/Border Emphasized — the file draws it, and Radio's card does not.
 * And focus paints the same wash hover does; the file draws both.
 */
export const choice = tv({
  base: [
    controlRow({ inContainer: true, layout: 'row', fill: false }),
    'group/row',
    'has-focus-visible:bg-surface-background-subtle',
    'data-checked:inset-ring-surface-border-emphasized',
  ],
  variants: {
    disabled: {
      true: controlRow({ inContainer: true, layout: 'row', fill: false, disabled: true }),
      false: '',
    },
  },
  defaultVariants: { disabled: false },
})

/**
 * The 20px dial and box are Radio's and Checkbox's, reading their state off
 * the row: `stateFrom: 'row'` in the shared module is the `group-data-*`
 * spelling of the same rules. No focus variant of their own — the card
 * draws the ring.
 */
export const dial = radioDial({ stateFrom: 'row', inContainer: true })
export const box = checkboxBox({ stateFrom: 'row', inContainer: true })

/** r="4" in Figma's exported SVG, so 8px across. Shown only when selected. */
export const dialDot = tv({
  base: 'hidden size-2 rounded-full bg-input-selected-foreground group-data-checked/row:block',
})

/** Checkbox's 14px `Check`. Shown only when ticked. */
export const boxGlyph = tv({
  base: 'hidden group-data-checked/row:block',
})

/** The label column takes the leftover width so a long description wraps. */
export const choiceText = tv({ base: 'flex min-w-0 flex-1 flex-col items-start' })

/**
 * `text-base/normal` on Content/Primary. Lighter than Radio's card label,
 * which is semibold Emphasized — the file draws the two differently, and a
 * questionnaire row is one of several equals rather than a card on its own.
 */
export const choiceLabel = tv({ base: 'text-base font-normal text-content-primary' })

/** Figma's `Sub Label` — `text-sm/normal` on Content/Subtle. */
export const choiceDescription = tv({ base: 'text-sm font-normal text-content-subtle' })

/** Figma's `Icon` boolean: a 16px glyph between the indicator and the label. */
export const choiceIcon = tv({ base: 'shrink-0 text-content-primary' })

/**
 * Figma's "Footer": `flex justify-end gap-2`. Built on `Form.Actions`, which
 * exists because twelve stories had hand-rolled this row; the classes here
 * only add what a footer inside a form column needs.
 */
export const actions = tv({ base: 'w-full items-center' })

/**
 * The recap — Figma's `Questionnaire Recap` (`40005537:65099`): a Card at
 * `padding={3}` whose content is a column of question / answer pairs at
 * `spacing/2`, each pair a column with no gap, both lines `text-sm/normal`.
 * The question is Content/Subtle and the answer Content/Primary — the recap
 * inverts the questionnaire's weighting, because here the answer is the news.
 * A skipped question is the same line in italic Subtle, not drawn in the file.
 */
export const recapList = tv({ base: 'flex w-full flex-col gap-2 font-sans' })
export const recapPair = tv({ base: 'flex flex-col' })
export const recapQuestion = tv({ base: 'text-sm font-normal text-content-subtle' })
export const recapAnswer = tv({
  base: 'text-sm font-normal',
  variants: {
    skipped: {
      false: 'text-content-primary',
      true: 'italic text-content-subtle',
    },
  },
  defaultVariants: { skipped: false },
})
