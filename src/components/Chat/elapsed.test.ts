import { describe, expect, it } from 'vitest'

import { formatElapsed } from './elapsed'

describe('formatElapsed', () => {
  it('prints seconds under a minute', () => {
    expect(formatElapsed(0)).toBe('0s')
    expect(formatElapsed(4)).toBe('4s')
    expect(formatElapsed(59)).toBe('59s')
  })

  it('prints minutes and seconds from a minute on', () => {
    expect(formatElapsed(60)).toBe('1m 0s')
    expect(formatElapsed(65)).toBe('1m 5s')
    expect(formatElapsed(3599)).toBe('59m 59s')
  })

  it('floors fractions and clamps negatives', () => {
    expect(formatElapsed(4.9)).toBe('4s')
    expect(formatElapsed(-3)).toBe('0s')
  })
})
