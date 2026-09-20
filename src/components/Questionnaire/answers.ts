import type { ReactNode } from 'react'

/**
 * Every answer a Questionnaire submitted, by item name. A `multiple` item is
 * always an array, even with one box ticked; every other item is the one
 * string it was answered with. An item that was skipped, or whose free-text
 * field was left empty, is **absent** rather than `''` — the primitive strips
 * the `name` off those controls, so they never reach `FormData` at all.
 */
export type QuestionnaireAnswers = Record<string, string | string[]>

/**
 * Turns a form's entries into `QuestionnaireAnswers`.
 *
 * Pure, so it can be pinned in a node test: the interesting part is not
 * reading `FormData`, it is knowing which names are arrays. `FormData` alone
 * cannot say — a `multiple` item with one box ticked and a single-select item
 * look identical in it — so the caller passes the set of names whose controls
 * are checkboxes, which the component reads off the form's own elements.
 *
 * Under a single name the last value wins. That is a defined behavior rather
 * than a reachable one: the primitive unchecks the radios the moment the
 * free-text field fills, so a single-select item never submits two entries.
 * `File` entries are skipped — nothing here is a file input.
 */
export function readAnswers(
  entries: Iterable<[string, FormDataEntryValue]>,
  multiple: ReadonlySet<string>,
): QuestionnaireAnswers {
  const answers: QuestionnaireAnswers = {}

  for (const [name, value] of entries) {
    if (typeof value !== 'string') continue

    if (multiple.has(name)) {
      const current = answers[name]
      answers[name] = Array.isArray(current) ? [...current, value] : [value]
    } else {
      answers[name] = value
    }
  }

  return answers
}

/** The shape `recapAnswers` reads: a question's name, its prompt and its choices' labels. */
export interface QuestionnaireRecapItem {
  name: string
  prompt: ReactNode
  disabled?: boolean
  choices?: readonly { value: string; label: ReactNode }[]
}

/** One line of a recap: the question, and what was answered — `null` when it was skipped. */
export interface QuestionnaireRecapEntry {
  name: string
  prompt: ReactNode
  answer: ReactNode[] | null
}

/**
 * Turns submitted answers back into words, one entry per question, in the
 * questions' order.
 *
 * A value that matches a choice becomes that choice's label; one that does not
 * — the free-text field — is printed as typed. A `multiple` question's array
 * becomes one entry with several labels. A question absent from `answers` was
 * skipped (or left empty) and comes back with `answer: null`, so a recap can
 * say so rather than drop the line: a recap that omits a question reads as if
 * it was never asked. A `disabled` question was not part of the flow and is
 * left out.
 */
export function recapAnswers(
  items: readonly QuestionnaireRecapItem[],
  answers: QuestionnaireAnswers,
): QuestionnaireRecapEntry[] {
  return items
    .filter((item) => !item.disabled)
    .map((item) => {
      const value = answers[item.name]
      if (value === undefined) return { name: item.name, prompt: item.prompt, answer: null }
      const values = Array.isArray(value) ? value : [value]
      const answer = values.map(
        (v) => item.choices?.find((choice) => choice.value === v)?.label ?? v,
      )
      return { name: item.name, prompt: item.prompt, answer }
    })
}
