import { describe, expect, it } from 'vitest'

import type { Draft } from '../../data/drafts'
import type { Post } from '../../data/types'
import {
  dayId,
  parseTarget,
  placeFor,
  slotId,
  slotTime,
  targetOpen,
  type CalendarDragData,
} from './drag'

// Tuesday 21 October 2026, 10:30 in the morning.
const now = new Date(2026, 9, 21, 10, 30)
const tomorrow = new Date(2026, 9, 22)
const yesterday = new Date(2026, 9, 20)
const today = new Date(2026, 9, 21)

const post: Post = { id: 'p-1', profileId: 'vv-x', week: 0, day: 2, time: '09:15', body: 'Hi' }
const draft: Draft = { id: 'd-1', profileId: 'vv-x', body: 'Hi', authorId: 'nathan', edited: 'now' }
const carryPost: CalendarDragData = { source: 'post', post, label: 'post' }
const carryDraft: CalendarDragData = { source: 'draft', draft, label: 'draft' }
const from = { date: tomorrow, time: '09:15' }

describe('placeFor', () => {
  it('keeps a post’s minutes in the hour it is dropped on', () => {
    expect(placeFor(carryPost, { kind: 'slot', date: tomorrow, hour: 14 }, { from, now })).toEqual({
      date: tomorrow,
      time: '14:15',
    })
  })

  it('puts a draft on the hour itself', () => {
    expect(placeFor(carryDraft, { kind: 'slot', date: tomorrow, hour: 14 }, { now })?.time).toBe(
      '14:00',
    )
  })

  it('keeps a post’s time on a month day', () => {
    const elsewhere = { date: new Date(2026, 9, 25), time: '09:15' }
    expect(
      placeFor(carryPost, { kind: 'day', date: tomorrow }, { from: elsewhere, now })?.time,
    ).toBe('09:15')
  })

  it('sends a draft on a month day out at 9 am', () => {
    expect(placeFor(carryDraft, { kind: 'day', date: tomorrow }, { now })?.time).toBe('09:00')
  })

  it('sends a draft on today, once 9 has gone, at the next whole hour', () => {
    expect(placeFor(carryDraft, { kind: 'day', date: today }, { now })?.time).toBe('11:00')
  })

  it('has no hour left for a draft on today after 11 pm', () => {
    const late = new Date(2026, 9, 21, 23, 10)
    expect(placeFor(carryDraft, { kind: 'day', date: today }, { now: late })).toBeNull()
  })

  it('refuses the past', () => {
    expect(placeFor(carryDraft, { kind: 'day', date: yesterday }, { now })).toBeNull()
    expect(placeFor(carryDraft, { kind: 'slot', date: today, hour: 9 }, { now })).toBeNull()
    // 10:15 today is a quarter of an hour ago.
    expect(placeFor(carryPost, { kind: 'slot', date: today, hour: 10 }, { from, now })).toBeNull()
  })

  it('treats a drop where the post already is as no move', () => {
    expect(placeFor(carryPost, { kind: 'slot', date: tomorrow, hour: 9 }, { from, now })).toBeNull()
    expect(placeFor(carryPost, { kind: 'day', date: tomorrow }, { from, now })).toBeNull()
  })
})

describe('targets', () => {
  it('round-trips through their ids', () => {
    expect(parseTarget(slotId(tomorrow, 14))).toEqual({ kind: 'slot', date: tomorrow, hour: 14 })
    expect(parseTarget(dayId(tomorrow))).toEqual({ kind: 'day', date: tomorrow })
    expect(parseTarget('post:p-1')).toBeNull()
  })

  it('closes days and today’s hours that have gone', () => {
    expect(targetOpen({ kind: 'day', date: yesterday }, now)).toBe(false)
    expect(targetOpen({ kind: 'day', date: today }, now)).toBe(true)
    expect(targetOpen({ kind: 'slot', date: today, hour: 9 }, now)).toBe(false)
    expect(targetOpen({ kind: 'slot', date: today, hour: 10 }, now)).toBe(true)
  })
})

describe('slotTime', () => {
  it('starts a post on the hour clicked', () => {
    expect(slotTime(tomorrow, 14, now)).toBe('14:00')
    expect(slotTime(today, 11, now)).toBe('11:00')
  })

  it('starts one in the hour under way at its next quarter', () => {
    expect(slotTime(today, 10, now)).toBe('10:45')
    expect(slotTime(today, 10, new Date(2026, 9, 21, 10, 5))).toBe('10:15')
  })

  it('has nothing in an hour or a day gone by', () => {
    expect(slotTime(today, 9, now)).toBeNull()
    expect(slotTime(yesterday, 14, now)).toBeNull()
    expect(slotTime(today, 10, new Date(2026, 9, 21, 10, 45))).toBeNull()
  })
})
