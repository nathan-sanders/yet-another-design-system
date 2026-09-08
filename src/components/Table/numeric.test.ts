import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { isNumericChild, resolveNumeric } from './numeric'

/**
 * The mono rule is the one derivation this component makes, and every one of
 * its failures is invisible: a column that quietly is not tabular looks fine in
 * a screenshot and misaligns by a pixel per digit the moment you compare two
 * rows. So the edges are pinned here rather than checked by eye.
 */

describe('isNumericChild', () => {
  it('accepts a real number', () => {
    expect(isNumericChild(42)).toBe(true)
    expect(isNumericChild(-3.5)).toBe(true)
  })

  /**
   * The falsy-zero trap. `typeof` is immune to it and a truthiness check is
   * not, which is the whole reason this is a function and not an inline `!!`.
   */
  it('accepts zero', () => {
    expect(isNumericChild(0)).toBe(true)
  })

  /**
   * Both of these render as words. Mono on "NaN" is wrong, and a non-finite
   * number is not a measurement.
   */
  it('rejects NaN and Infinity', () => {
    expect(isNumericChild(NaN)).toBe(false)
    expect(isNumericChild(Infinity)).toBe(false)
    expect(isNumericChild(-Infinity)).toBe(false)
  })

  /** A formatted number is a string. That is what the column flag is for. */
  it('rejects a numeric string', () => {
    expect(isNumericChild('42')).toBe(false)
    expect(isNumericChild('$1.2M')).toBe(false)
  })

  it('rejects nothing at all', () => {
    expect(isNumericChild(null)).toBe(false)
    expect(isNumericChild(undefined)).toBe(false)
    expect(isNumericChild('')).toBe(false)
  })

  /**
   * We never walk into an element to find a number inside it. A rule that
   * reaches through a component to restyle its insides is a rule that will one
   * day restyle somebody's `Avatar` — the element brought its own typography
   * and it wins.
   */
  it('rejects a React element, even one wrapping a number', () => {
    expect(isNumericChild(createElement('span', null, 3))).toBe(false)
  })

  /** Two children arrive as an array, which is a formatted value, not a number. */
  it('rejects an array of children', () => {
    expect(isNumericChild(['$', 42])).toBe(false)
  })
})

describe('resolveNumeric', () => {
  it('derives from the children when the column says nothing', () => {
    expect(resolveNumeric(undefined, 42)).toBe(true)
    expect(resolveNumeric(undefined, 'Acme Inc')).toBe(false)
  })

  it('lets a numeric column carry a formatted string', () => {
    expect(resolveNumeric(true, '$1.2M')).toBe(true)
    expect(resolveNumeric(true, '82%')).toBe(true)
  })

  /**
   * `??`, not `||`. An order-number column that has opted out stays opted out
   * even in the row where the id happens to be all digits.
   */
  it('lets an explicit false beat a number', () => {
    expect(resolveNumeric(false, 42)).toBe(false)
  })
})
