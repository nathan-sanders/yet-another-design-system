import { describe, expect, it } from 'vitest'

import { scriptedReply, threadsVersion } from './replies'

const ctx = { posts: [] }

describe('scriptedReply', () => {
  it('writes the Threads version on the composer, and nowhere else', () => {
    const reply = scriptedReply('Write the Threads version', '/plan/compose', {
      ...ctx,
      caption: 'Back in stalk 🌽🌽🌽 The trio is back through August. Swipe for the full spread. #corn #summer',
    })
    expect(reply).toBeDefined()
    const card = reply!.bubbles.find((b) => b.kind === 'caption')
    expect(card && card.kind === 'caption' && card.network).toBe('threads')
    expect(card && card.kind === 'caption' && card.text).not.toMatch(/#/)
    expect(card && card.kind === 'caption' && card.text.length).toBeLessThanOrEqual(500)
    expect(reply!.tools?.[0]?.label).toMatch(/Threads limit/)
    expect(reply!.followUps).toContain('Check Saturday for conflicts')
    expect(scriptedReply('Write the Threads version', '/plan/calendar', ctx)).toBeUndefined()
  })

  it('answers the idea page', () => {
    const reply = scriptedReply('Draft a caption', '/plan/ideas/back-in-stalk', {
      ...ctx,
      idea: { id: 'x', title: 'Threads: Back in stalk 🌽', body: 'Our cult fave is back. Carousel of the grill.' },
    })
    const card = reply?.bubbles.find((b) => b.kind === 'caption')
    expect(card && card.kind === 'caption' && card.text).toBe('Back in stalk 🌽 — Our cult fave is back.')
    expect(scriptedReply('Draft a caption', '/plan/ideas', ctx)).toBeUndefined()
  })

  it('falls through for anything else', () => {
    expect(scriptedReply('What should I post?', '/plan/compose', ctx)).toBeUndefined()
  })
})

describe('threadsVersion', () => {
  it('keeps whole sentences under 200 characters and offers a shorter cut', () => {
    const { text, shorter } = threadsVersion(
      'One sentence here. Two sentences now, with a bit more to say. Three makes it long enough that it should not all fit inside the two hundred character budget we gave the Threads version to work with, right?',
    )
    expect(text.length).toBeLessThanOrEqual(200)
    expect(text.endsWith('.')).toBe(true)
    expect(shorter.length).toBeLessThan(text.length)
  })

  it('has a house line when the composer is empty', () => {
    expect(threadsVersion('').text).toMatch(/Back in stalk/)
  })
})
