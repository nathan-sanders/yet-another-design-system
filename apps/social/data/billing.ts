/**
 * The workspace's plan, card and invoices, for Settings › Billing. Like the
 * schedule, it is relative to today: the plan renews on the 19th, so the next
 * renewal is always ahead and the newest invoice is always this month's or
 * last month's.
 */

export const BILLING_DAY = 19

export const plan = {
  name: 'Team',
  price: 99,
  seats: 5,
  seatsUsed: 4,
  channels: 15,
}

/** Yak's monthly allowance. It resets on the billing day with the plan. */
export const yakCredits = {
  included: 1000,
  used: 640,
  /** What a top-up pack adds, and costs. */
  pack: 500,
  packPrice: 25,
}

export interface PaymentCard {
  brand: 'Visa'
  last4: string
  /** `MM/YYYY`. */
  expires: string
}

/** Expires the February after next, so it is never already expired. */
export function defaultCard(today: Date): PaymentCard {
  return { brand: 'Visa', last4: '6135', expires: `02/${today.getFullYear() + 1}` }
}

export type InvoiceStatus = 'paid'

export interface Invoice {
  id: string
  date: Date
  description: string
  total: number
  status: InvoiceStatus
}

/**
 * Newest first. `monthsBack` counts billing cycles back from the latest
 * renewal; `day` puts a charge between renewals, the way a credit top-up lands.
 */
const history: { monthsBack: number; day?: number; description: string; total: number }[] = [
  { monthsBack: 0, description: 'Team plan', total: 99 },
  {
    monthsBack: 1,
    day: BILLING_DAY + 8,
    description: `${yakCredits.pack} Yak credits`,
    total: yakCredits.packPrice,
  },
  { monthsBack: 1, description: 'Team plan', total: 99 },
  { monthsBack: 2, description: 'Team plan, upgraded from Starter', total: 81.4 },
  { monthsBack: 3, description: 'Starter plan', total: 29 },
  { monthsBack: 4, description: 'Starter plan', total: 29 },
]

/** The most recent billing day on or before `today`. */
export function lastRenewal(today: Date): Date {
  const back = today.getDate() >= BILLING_DAY ? 0 : 1
  return new Date(today.getFullYear(), today.getMonth() - back, BILLING_DAY)
}

/** The first billing day after `today`: when the plan renews and Yak credits reset. */
export function nextRenewal(today: Date): Date {
  const last = lastRenewal(today)
  return new Date(last.getFullYear(), last.getMonth() + 1, BILLING_DAY)
}

export function invoicesFor(today: Date): Invoice[] {
  const last = lastRenewal(today)
  return history.map((entry, index) => {
    const date = new Date(
      last.getFullYear(),
      last.getMonth() - entry.monthsBack,
      entry.day ?? BILLING_DAY,
    )
    return {
      id: `inv-${index + 1}`,
      date,
      description: entry.description,
      total: entry.total,
      status: 'paid',
    }
  })
}
