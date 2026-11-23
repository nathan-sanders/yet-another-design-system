import { createContext } from 'react'

/**
 * The level a task's section titles take: h4 under the panel's h3 title, h2
 * under the full view's h1, so the outline never skips a step.
 */
export const SectionLevel = createContext<2 | 4>(4)
