import { describe, expect, it } from 'vitest'

import { composeFrom, composePath, parseCompose } from './paths'

// Tuesday 21 October 2026, 10:30 in the morning.
const now = new Date(2026, 9, 21, 10, 30)
const tomorrow = new Date(2026, 9, 22)

const query = (path: string) => new URLSearchParams(path.split('?')[1] ?? '')

describe('parseCompose', () => {
  it('is a new post with nothing in the query', () => {
    expect(parseCompose(new URLSearchParams(), now)).toEqual({ kind: 'new', at: null })
  })

  it('takes a draft over a post, a post over an idea, an idea over a date', () => {
    expect(parseCompose(new URLSearchParams('draft=d-1&post=p-1&idea=i-1'), now)).toEqual({
      kind: 'draft',
      draftId: 'd-1',
    })
    expect(parseCompose(new URLSearchParams('post=p-1&idea=i-1&date=2026-10-22'), now)).toEqual({
      kind: 'post',
      postId: 'p-1',
    })
    expect(parseCompose(new URLSearchParams('idea=i-1&date=2026-10-22'), now)).toEqual({
      kind: 'idea',
      ideaId: 'i-1',
    })
  })

  it('reads a date and time', () => {
    expect(parseCompose(new URLSearchParams('date=2026-10-22&time=14:30'), now)).toEqual({
      kind: 'new',
      at: { date: tomorrow, time: '14:30' },
    })
  })

  it('gives a date with no time the hour a dropped draft would get', () => {
    expect(parseCompose(new URLSearchParams('date=2026-10-22'), now).kind === 'new').toBe(true)
    expect(parseCompose(new URLSearchParams('date=2026-10-22'), now)).toEqual({
      kind: 'new',
      at: { date: tomorrow, time: '09:00' },
    })
    // Today, with 9 gone: the next whole hour.
    expect(parseCompose(new URLSearchParams('date=2026-10-21'), now)).toEqual({
      kind: 'new',
      at: { date: new Date(2026, 9, 21), time: '11:00' },
    })
  })

  it('ignores a bad time and a bad date', () => {
    expect(parseCompose(new URLSearchParams('date=2026-10-22&time=25:99'), now)).toEqual({
      kind: 'new',
      at: { date: tomorrow, time: '09:00' },
    })
    expect(parseCompose(new URLSearchParams('date=soon'), now)).toEqual({ kind: 'new', at: null })
  })

  it('has no time once today’s grid has run out', () => {
    const late = new Date(2026, 9, 21, 23, 10)
    expect(parseCompose(new URLSearchParams('date=2026-10-21'), late)).toEqual({
      kind: 'new',
      at: null,
    })
  })
})

describe('composePath', () => {
  it('round-trips through parseCompose', () => {
    expect(parseCompose(query(composePath({ draft: 'd-2' })), now)).toEqual({
      kind: 'draft',
      draftId: 'd-2',
    })
    expect(parseCompose(query(composePath({ date: tomorrow, time: '14:30' })), now)).toEqual({
      kind: 'new',
      at: { date: tomorrow, time: '14:30' },
    })
  })

  it('leaves the default back-link off', () => {
    expect(composePath({ from: '/plan/calendar' })).toBe('/plan/compose')
    expect(composePath({ from: '/home' })).toBe('/plan/compose?from=%2Fhome')
  })
})

describe('composeFrom', () => {
  it('goes back to the calendar unless told otherwise', () => {
    expect(composeFrom(new URLSearchParams())).toBe('/plan/calendar')
    expect(composeFrom(new URLSearchParams('from=/plan/ideas'))).toBe('/plan/ideas')
  })

  it('never goes back to the composer itself, or off the app', () => {
    expect(composeFrom(new URLSearchParams('from=/plan/compose?draft=d-1'))).toBe('/plan/calendar')
    expect(composeFrom(new URLSearchParams('from=https://x.test'))).toBe('/plan/calendar')
  })
})
