import { Layers, Palette, Sun } from 'lucide-react'

import type { QuestionnaireItemDefinition } from './Questionnaire'

/**
 * Dummy content for the Questionnaire stories: an assistant clarifying a
 * request about this design system before it acts on it. Not exported from
 * the library barrel — story furniture, like Chat's `story-data.ts`.
 *
 * The labels are kept to a word or two on purpose. The geometry stories
 * draw the questionnaire at Figma's 280, and a label that wraps there would
 * turn a 40px row into a 64px one and fail the measurement for no reason.
 */
export const questions = [
  {
    name: 'neutral',
    required: true,
    prompt: 'Which neutral should it use?',
    description: 'Choose an option or describe an alternative.',
    choices: [
      { value: 'stone', label: 'Stone' },
      { value: 'slate', label: 'Slate' },
      { value: 'zinc', label: 'Zinc' },
    ],
    input: { 'aria-label': 'Another neutral', placeholder: 'Describe another option...' },
  },
  {
    name: 'themes',
    required: true,
    multiple: true,
    prompt: 'Which themes should it cover?',
    description: 'Select every one that applies.',
    choices: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'contrast', label: 'High contrast' },
    ],
  },
  {
    name: 'docs',
    required: true,
    prompt: 'Where should it be documented?',
    choices: [
      { value: 'storybook', label: 'Storybook' },
      { value: 'figma', label: 'Figma' },
      { value: 'both', label: 'Both' },
    ],
  },
] as const satisfies readonly QuestionnaireItemDefinition[]

/** The same first question with Figma's `Icon` and `Sub Label` booleans on. */
export const describedChoices = [
  { value: 'stone', label: 'Stone', description: 'Warm, the default', icon: Palette },
  { value: 'slate', label: 'Slate', description: 'Cool, a little blue', icon: Layers },
  { value: 'zinc', label: 'Zinc', description: 'Neutral, almost gray', icon: Sun },
] as const

