import { describe, expect, it } from 'vitest'

import type { Ticket } from '../../data/types'
import { scopeCount, scopeFilter, visibleTickets, type InboxScope } from './model'

const ticket = (number: string, extra: Partial<Ticket> = {}): Ticket => ({
  number,
  customerId: 'kaiya',
  network: 'threads',
  subject: '',
  body: '',
  ago: '1m',
  status: 'new',
  priority: 'low',
  sentiment: 'neutral',
  ...extra,
})

const tickets = [
  ticket('1', {}),
  ticket('2', { assigneeId: 'nathan' }),
  ticket('3', { assigneeId: 'katie', status: 'in-progress' }),
  ticket('4', { assigneeId: 'nathan', status: 'complete' }),
  ticket('5', { status: 'complete' }),
  ticket('6', { spam: true }),
  // Not spam any more: an edit sets it back to false.
  ticket('7', { spam: false }),
]

const numbers = (scope: InboxScope, params = { unassigned: false, complete: false }) => {
  const { filter, status } = scopeFilter(scope, params)
  return visibleTickets(tickets, filter, 'received', true, status).map((t) => t.number)
}

describe('inbox scopes', () => {
  it('All messages shows everything but spam, open and complete alike', () => {
    expect(numbers('all')).toEqual(['1', '2', '3', '4', '5', '7'])
    expect(numbers('all', { unassigned: true, complete: false })).toEqual(['1', '5', '7'])
  })

  it('My inbox is yours, split by Open and Complete', () => {
    expect(numbers('mine')).toEqual(['2'])
    expect(numbers('mine', { unassigned: false, complete: true })).toEqual(['4'])
  })

  it('All assignments is every open ticket anybody owns', () => {
    expect(numbers('assigned')).toEqual(['2', '3'])
  })

  it('Complete is everything completed, whoever owns it', () => {
    expect(numbers('complete')).toEqual(['4', '5'])
  })

  it('Spam holds only what the system flagged', () => {
    expect(numbers('spam')).toEqual(['6'])
  })

  it('counts what each page lists first', () => {
    expect(scopeCount(tickets, 'mine')).toBe(1)
    expect(scopeCount(tickets, 'assigned')).toBe(2)
    expect(scopeCount(tickets, 'spam')).toBe(1)
  })
})
