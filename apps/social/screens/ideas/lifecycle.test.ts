import { describe, expect, it } from 'vitest'

import type { Draft } from '../../data/drafts'
import type { Idea, Post } from '../../data/types'
import { today } from '../calendar/model'
import { derivedColumns, isLinked } from './lifecycle'

const ideas: Record<string, Idea> = {
  corn: { id: 'corn', title: 'Corn', body: '' },
  soup: { id: 'soup', title: 'Soup', body: '' },
  gone: { id: 'gone', title: 'Gone', body: '', archived: true },
}
const draft = (id: string, ideaId?: string): Draft => ({
  id,
  profileId: 'vv-x',
  body: '',
  authorId: 'nathan',
  edited: 'now',
  ideaId,
})
// `day` counts from the Figma Monday that `postMoment` slides onto today, so
// day 1 is today, day 2 tomorrow and day 0 yesterday.
const post = (id: string, day: number, time: string, ideaId?: string): Post => ({
  id,
  profileId: 'vv-x',
  week: 0,
  day,
  time,
  body: '',
  ideaId,
})
const noon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)

describe('derivedColumns', () => {
  it('puts drafts and posts under the idea they came from', () => {
    const cols = derivedColumns(
      ideas,
      [draft('d-1', 'corn'), draft('d-2')],
      [post('p-1', 2, '11:00', 'corn'), post('p-2', 0, '09:00', 'soup'), post('p-3', 3, '10:00')],
      { now: noon },
    )
    expect(cols.drafting.map((c) => c.draft.id)).toEqual(['d-1'])
    expect(cols.scheduled.map((c) => c.post.id)).toEqual(['p-1'])
    expect(cols.published.map((c) => c.post.id)).toEqual(['p-2'])
  })

  it('splits scheduled from published on the clock it is given', () => {
    const posts = [post('p-1', 1, '09:00', 'corn'), post('p-2', 1, '15:00', 'corn')]
    const cols = derivedColumns(ideas, [], posts, { now: noon })
    expect(cols.published.map((c) => c.post.id)).toEqual(['p-1'])
    expect(cols.scheduled.map((c) => c.post.id)).toEqual(['p-2'])
  })

  it('sorts scheduled soonest first and published latest first', () => {
    const posts = [
      post('late', 4, '09:00', 'corn'),
      post('soon', 2, '09:00', 'corn'),
      post('old', -3, '09:00', 'corn'),
      post('older', -6, '09:00', 'corn'),
    ]
    const cols = derivedColumns(ideas, [], posts, { now: noon })
    expect(cols.scheduled.map((c) => c.post.id)).toEqual(['soon', 'late'])
    expect(cols.published.map((c) => c.post.id)).toEqual(['old', 'older'])
  })

  it('ignores an archived idea and an id that no longer resolves', () => {
    const cols = derivedColumns(
      ideas,
      [draft('d-1', 'gone'), draft('d-2', 'missing')],
      [post('p-1', 2, '11:00', 'gone')],
      { now: noon },
    )
    expect(cols.drafting).toEqual([])
    expect(cols.scheduled).toEqual([])
  })
})

describe('isLinked', () => {
  it('is true once a draft or a post carries the idea', () => {
    expect(isLinked('corn', [draft('d-1', 'corn')], [])).toBe(true)
    expect(isLinked('corn', [], [post('p-1', 2, '09:00', 'corn')])).toBe(true)
    expect(isLinked('corn', [draft('d-1')], [post('p-1', 2, '09:00')])).toBe(false)
  })
})
