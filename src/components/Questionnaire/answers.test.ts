import { describe, expect, it } from 'vitest'

import { readAnswers } from './answers'

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
