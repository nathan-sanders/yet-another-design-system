import { describe, expect, it } from 'vitest'

import { invoicesFor, lastRenewal, nextRenewal } from './billing'
import { toISODate } from './dates'

describe('renewals', () => {
  it('renews on the 19th after today', () => {
    expect(toISODate(nextRenewal(new Date(2026, 9, 30)))).toBe('2026-11-19')
    expect(toISODate(nextRenewal(new Date(2026, 9, 3)))).toBe('2026-10-19')
  })

  it('counts the billing day itself as the last renewal', () => {
    expect(toISODate(lastRenewal(new Date(2026, 9, 19)))).toBe('2026-10-19')
    expect(toISODate(nextRenewal(new Date(2026, 9, 19)))).toBe('2026-11-19')
  })

  it('crosses the year', () => {
    expect(toISODate(nextRenewal(new Date(2026, 11, 25)))).toBe('2027-01-19')
    expect(toISODate(lastRenewal(new Date(2027, 0, 4)))).toBe('2026-12-19')
  })
})

describe('invoicesFor', () => {
  const invoices = invoicesFor(new Date(2026, 9, 30))

  it('is newest first, and none is in the future', () => {
    const times = invoices.map((invoice) => invoice.date.getTime())
    expect(times).toEqual([...times].sort((a, b) => b - a))
    expect(times[0]).toBeLessThanOrEqual(new Date(2026, 9, 30).getTime())
  })

  it('lands the credit top-up between two renewals', () => {
    expect(invoices.map((invoice) => toISODate(invoice.date))).toEqual([
      '2026-10-19',
      '2026-09-27',
      '2026-09-19',
      '2026-08-19',
      '2026-07-19',
      '2026-06-19',
    ])
  })
})
