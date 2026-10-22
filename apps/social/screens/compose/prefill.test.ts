import { describe, expect, it } from 'vitest'

import type { Draft } from '../../data/drafts'
import type { Idea } from '../../data/types'
import { formatFromTitle, prefillFromDraft, prefillFromIdea } from './prefill'

const idea: Idea = {
  id: 'back-in-stalk',
  title: 'Threads: Back in stalk 🌽',
  body: 'Stop scrolling… our cult fave is back. Announce it with a carousel of the grill.',
  image: 'corn.jpg',
  campaignId: 'summer-menu',
  tagNames: ['Launch', 'Menu'],
  assigneeId: 'katie',
}

describe('prefillFromIdea', () => {
  it('writes the caption from the title and the notes, and keeps the link', () => {
    const fields = prefillFromIdea(idea)
    expect(fields.caption).toBe(
      'Back in stalk 🌽\n\nStop scrolling… our cult fave is back. Announce it with a carousel of the grill.',
    )
    expect(fields.media).toEqual(['corn.jpg'])
    expect(fields.campaignId).toBe('summer-menu')
    expect(fields.tagNames).toEqual(['Launch', 'Menu'])
    expect(fields.assigneeId).toBe('katie')
    expect(fields.ideaId).toBe('back-in-stalk')
    expect(fields.at).toBeNull()
  })

  it('reads the format off the notes when the title does not say', () => {
    expect(prefillFromIdea(idea).format).toBe('carousel')
    expect(prefillFromIdea({ ...idea, title: 'Reel: Harvest Glow', body: 'Top down.' }).format).toBe(
      'reel',
    )
  })

  it('starts with nothing where the idea has nothing', () => {
    const bare = prefillFromIdea({ id: 'x', title: 'A thought', body: '' })
    expect(bare.caption).toBe('A thought')
    expect(bare.media).toEqual([])
    expect(bare.tagNames).toEqual([])
    expect(bare.format).toBe('post')
  })
})

describe('formatFromTitle', () => {
  it('reads the prefix', () => {
    expect(formatFromTitle('IG Story: Protein Plates teaser')).toBe('story')
    expect(formatFromTitle('Reel: Harvest Glow in 60 seconds')).toBe('reel')
    expect(formatFromTitle('Summer carousel of the grill')).toBe('carousel')
    expect(formatFromTitle('Back in stalk')).toBe('post')
  })
})

describe('prefillFromDraft', () => {
  it('locks the draft’s own channel and keeps what it carried', () => {
    const draft: Draft = {
      id: 'd-1',
      profileId: 'vv-x',
      body: 'Hot take',
      authorId: 'katie',
      edited: 'now',
      needsApproval: true,
    }
    const fields = prefillFromDraft(draft)
    expect(fields.profileIds).toEqual(['vv-x'])
    expect(fields.caption).toBe('Hot take')
    expect(fields.needsApproval).toBe(true)
    expect(fields.captions).toEqual({})
  })
})
