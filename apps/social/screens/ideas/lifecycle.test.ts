import { describe, expect, it } from 'vitest'

import type { Draft } from '../../data/drafts'
import type { Post } from '../../data/types'
import { isLinked } from './lifecycle'

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
describe('isLinked', () => {
  it('is true once a draft or a post carries the idea', () => {
    expect(isLinked('corn', [draft('d-1', 'corn')], [])).toBe(true)
    expect(isLinked('corn', [], [post('p-1', 2, '09:00', 'corn')])).toBe(true)
    expect(isLinked('corn', [draft('d-1')], [post('p-1', 2, '09:00')])).toBe(false)
  })
})
