import { describe, expect, it } from 'vitest'

import { readAnswers, recapAnswers } from './answers'

describe('readAnswers', () => {
  it('reads a single-select item as one string', () => {
    expect(readAnswers([['neutral', 'stone']], new Set())).toEqual({ neutral: 'stone' })
  })

  it('reads a multiple item as an array, even with one value', () => {
    expect(readAnswers([['themes', 'light']], new Set(['themes']))).toEqual({
      themes: ['light'],
    })
    expect(
      readAnswers(
        [
          ['themes', 'light'],
          ['themes', 'dark'],
        ],
        new Set(['themes']),
      ),
    ).toEqual({ themes: ['light', 'dark'] })
  })

  it('lets free text join the ticked boxes under a multiple name', () => {
    expect(
      readAnswers(
        [
          ['themes', 'light'],
          ['themes', 'High contrast'],
        ],
        new Set(['themes']),
      ),
    ).toEqual({ themes: ['light', 'High contrast'] })
  })

  it('leaves a skipped or empty item absent rather than empty', () => {
    expect(readAnswers([['docs', 'storybook']], new Set(['themes']))).toEqual({
      docs: 'storybook',
    })
  })

  it('keeps the order the entries arrived in', () => {
    const answers = readAnswers(
      [
        ['neutral', 'stone'],
        ['themes', 'light'],
        ['docs', 'storybook'],
      ],
      new Set(['themes']),
    )
    expect(Object.keys(answers)).toEqual(['neutral', 'themes', 'docs'])
  })

  it('lets the last value win under a single name — defined, not reachable', () => {
    // The primitive unchecks the radios when the free-text field fills, so a
    // single-select item never submits two entries. Pinned so the behavior is
    // a decision rather than an accident of iteration order.
    expect(
      readAnswers(
        [
          ['neutral', 'stone'],
          ['neutral', 'Taupe'],
        ],
        new Set(),
      ),
    ).toEqual({ neutral: 'Taupe' })
  })

  it('skips file entries', () => {
    const file = new File(['x'], 'x.txt')
    expect(readAnswers([['upload', file], ['neutral', 'stone']], new Set())).toEqual({
      neutral: 'stone',
    })
  })
})

describe('recapAnswers', () => {
  const items = [
    {
      name: 'neutral',
      prompt: 'Which neutral?',
      choices: [
        { value: 'stone', label: 'Stone' },
        { value: 'slate', label: 'Slate' },
      ],
    },
    {
      name: 'themes',
      prompt: 'Which themes?',
      choices: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ],
    },
    { name: 'docs', prompt: 'Where documented?', choices: [{ value: 'storybook', label: 'Storybook' }] },
  ]

  it('maps values back to labels, in the questions\' order', () => {
    expect(recapAnswers(items, { docs: 'storybook', neutral: 'stone', themes: ['light', 'dark'] })).toEqual([
      { name: 'neutral', prompt: 'Which neutral?', answer: ['Stone'] },
      { name: 'themes', prompt: 'Which themes?', answer: ['Light', 'Dark'] },
      { name: 'docs', prompt: 'Where documented?', answer: ['Storybook'] },
    ])
  })

  it('prints free text as typed', () => {
    expect(recapAnswers(items, { neutral: 'Taupe' })[0].answer).toEqual(['Taupe'])
  })

  it('keeps a skipped question as a line with no answer', () => {
    const entries = recapAnswers(items, { neutral: 'stone', docs: 'storybook' })
    expect(entries.map((e) => e.answer)).toEqual([['Stone'], null, ['Storybook']])
  })

  it('leaves a disabled question out', () => {
    expect(recapAnswers([{ ...items[0], disabled: true }, items[2]], { docs: 'storybook' })).toEqual([
      { name: 'docs', prompt: 'Where documented?', answer: ['Storybook'] },
    ])
  })
})
