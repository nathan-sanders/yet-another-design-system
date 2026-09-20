import { tv } from 'tailwind-variants'

import { focusRingWithin } from '../../lib/focus'

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
 * Figma's `Questionnaire Item Radio` / `Questionnaire Item Checkbox`: a row
 * at `px-3 py-2`, `gap-3`, `rounded-md`, with a 1px **inside** stroke on
 * Surface/Border and no fill at rest. The stroke is an `inset-ring`, not a
 * border, for Radio and Checkbox `inContainer`'s reason — the file draws the
 * row 40px tall (24 of line-height plus 8 above and below), and a border would
 * make it 42.
 *
 * The states are the primitive's data attributes on this element, so nothing
 * inside has to be told: `data-checked` swaps the stroke to Surface/Border
 * Emphasized, `data-invalid` to Feedback/Danger/Highlight, `data-disabled`
 * fades the whole row at opacity-40. Hover and focus are the same wash of
 * Surface/Background Subtle — Figma draws both — and the focus ring goes round
 * this card (`focusRingWithin`), never round the `sr-only` input inside it:
 * one ring, on the thing you can see.
 *
 * `group/choice` is what the indicator and its glyph read their state off.
 */
export const choice = tv({
  base: [
    'group/choice flex w-full items-center gap-3 px-3 py-2',
    'rounded-md inset-ring inset-ring-surface-border',
    'cursor-pointer',
    'hover:bg-surface-background-subtle',
    'has-focus-visible:bg-surface-background-subtle',
    ...focusRingWithin,
    'data-checked:inset-ring-surface-border-emphasized',
    'data-invalid:inset-ring-feedback-danger-highlight',
    'data-invalid:hover:inset-ring-feedback-danger-highlight',
    'data-disabled:pointer-events-none data-disabled:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],
})

/**
 * The 20px dial — Radio's `dial`, with every `data-checked:` turned into
 * `group-data-checked/choice:` and no focus variant of its own.
 *
 * A deliberate copy rather than an import, and the fourth one: Checkbox,
 * Radio and Switch each carry these shapes because Figma keeps them as
 * separate sets that can drift, and Radio's record says a fourth copy is the
 * point to extract. This is that fourth — and it cannot import as things
 * stand anyway, because here the state lives on the `<label>` (the primitive
 * sets it there) rather than on a Base UI root, so every selector has to look
 * up at the group instead of at itself. Whether to extract is now a live
 * question; the record says so.
 */
export const dial = tv({
  base: [
    'flex shrink-0 items-center justify-center',
    // size-5 = width/w-5 (20px), rounded-full = border-radius/rounded-full.
    'size-5 rounded-full border',
    // Unselected. The Input ramp, not the Action one: this is a form control.
    'bg-input-background border-input-border',
    'group-hover/choice:border-input-border-hover',
    // Selected is a solid disc — Figma fills background and stroke with the
    // same token.
    'group-data-checked/choice:bg-input-selected group-data-checked/choice:border-input-selected',
    'group-data-invalid/choice:border-feedback-danger-highlight',
    'transition-colors duration-fast-min ease-standard',
  ],
})

/** r="4" in Figma's exported SVG, so 8px across. Shown only when selected. */
export const dialDot = tv({
  base: 'hidden size-2 rounded-full bg-input-selected-foreground group-data-checked/choice:block',
})

/**
 * The 20px box — Checkbox's `box`, with the same substitution as `dial` above
 * and for the same reason. `rounded-sm` is border-radius/rounded-sm (6px).
 */
export const box = tv({
  base: [
    'flex shrink-0 items-center justify-center',
    'size-5 rounded-sm border',
    'bg-input-background border-input-border',
    'group-hover/choice:border-input-border-hover',
    'group-data-checked/choice:bg-input-selected group-data-checked/choice:border-input-selected',
    // The glyph inherits this as currentColor, the way Icon is built to.
    'text-input-selected-foreground',
    'group-data-invalid/choice:border-feedback-danger-highlight',
    'transition-colors duration-fast-min ease-standard',
  ],
})

/** Checkbox's 14px `Check`. Shown only when ticked. */
export const boxGlyph = tv({
  base: 'hidden size-3.5 group-data-checked/choice:block',
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
