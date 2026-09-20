import { createContext } from 'react'

/**
 * What the root tells every item without each being told one by one.
 * `progress` is Figma's `Number of Questions` boolean; the item draws the
 * "Question 1 of 3" line only when it is on *and* there is more than one
 * question to count.
 */
export const QuestionnaireContext = createContext<{ progress: boolean }>({ progress: true })

/**
 * What an item tells its choices: whether they are boxes or dials. The
 * primitive knows this too and publishes it as `data-type` on the row, but the
 * glyph inside the indicator is a different element either way (a dot, or a
 * Lucide `Check`), so the branch lives in JavaScript rather than in a recipe
 * that would have to carry both shapes and hide one.
 */
export const QuestionnaireItemContext = createContext<{ multiple: boolean }>({ multiple: false })
