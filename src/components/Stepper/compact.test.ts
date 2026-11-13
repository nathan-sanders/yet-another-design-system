import { describe, expect, it } from 'vitest'

import { COMPACT_BELOW, compactThreshold } from './compact'

/**
 * The collapse thresholds are written out as literal classes, because Tailwind
 * cannot generate a class it does not find in the source. So the table and the
 * rule it encodes — 112px a step plus the 4px gaps — are two copies of one
 * number, and this keeps them from drifting. A typo here renders perfectly at
 * every width but the one where it matters.
 */
describe('Stepper compact thresholds', () => {
  for (let count = 2; count <= 10; count++) {
    it(`collapses ${count} steps below ${compactThreshold(count)}px`, () => {
      const width = compactThreshold(count)
      expect(COMPACT_BELOW[count]).toBe(
        `@max-[${width}px]/stepper:[--stepper-full:none] @max-[${width}px]/stepper:[--stepper-compact:flex]`,
      )
    })
  }
})
