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
