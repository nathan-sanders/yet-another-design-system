import { describe, expect, it } from 'vitest'

import {
  inlineShortcut,
  joinInline,
  linkAround,
  normalizeHref,
  parseInline,
  readInline,
  serializeInline,
  setLink,
  splitInline,
  toggleMark,
  type Run,
} from './richText'

describe('inline formatting', () => {
  it('reads bold, italic and links, nested', () => {
    expect(parseInline('a **bold *both* bold** [site](https://x.co) end')).toEqual([
      { text: 'a ' },
      { text: 'bold ', bold: true },
      { text: 'both', bold: true, italic: true },
      { text: ' bold', bold: true },
      { text: ' ' },
      { text: 'site', href: 'https://x.co' },
      { text: ' end' },
    ])
    expect(parseInline('***x***')).toEqual([{ text: 'x', bold: true, italic: true }])
  })

  it('keeps a line with no formatting exactly as it was saved', () => {
    const plain = 'Soft open runs {2027-01-08} to {2027-01-10:d}, with Katie.'
    expect(serializeInline(parseInline(plain))).toBe(plain)
  })

  it('reads stars and brackets that do not close as characters', () => {
    expect(parseInline('2 * 3 and [not a link]')).toEqual([{ text: '2 * 3 and [not a link]' }])
  })

  it('escapes typed stars and brackets, and reads them back', () => {
    const runs: Run[] = [{ text: 'a *star* and [b]' }, { text: 'bold', bold: true }]
    const md = serializeInline(runs)
    expect(md).toBe('a \\*star\\* and \\[b\\]**bold**')
    expect(parseInline(md)).toEqual(runs)
  })

  it('writes dates out and keeps the formatting', () => {
    expect(readInline('**Permits** by {2026-11-18}')).toMatch(
      /^\*\*Permits\*\* by [A-Z][a-z]{2} \d+$/,
    )
  })

  it('splits and joins a line without losing a mark', () => {
    expect(splitInline('a **bold** b', 4)).toEqual(['a **bo**', '**ld** b'])
    expect(joinInline('a **bo**', '**ld** b')).toBe('a **bold** b')
  })

  it('toggles a mark off a stretch that is all marked, on otherwise', () => {
    const runs = parseInline('one **two** three')
    expect(serializeInline(toggleMark(runs, 4, 7, 'bold'))).toBe('one two three')
    expect(serializeInline(toggleMark(runs, 0, 7, 'bold'))).toBe('**one two** three')
    expect(serializeInline(toggleMark(runs, 8, 13, 'italic'))).toBe('one **two** *three*')
  })

  it('puts a link on, finds all of it, and takes it off', () => {
    const linked = setLink(parseInline('read **the** plan'), 5, 13, 'https://x.co')
    expect(serializeInline(linked)).toBe('read [**the** plan](https://x.co)')
    expect(linkAround(linked, 6)).toEqual({ start: 5, end: 13, href: 'https://x.co' })
    expect(linkAround(linked, 2)).toBeNull()
    expect(serializeInline(setLink(linked, 5, 13))).toBe('read **the** plan')
  })

  it('takes typed addresses', () => {
    expect(normalizeHref('example.com/plan')).toBe('https://example.com/plan')
    expect(normalizeHref('http://a.b')).toBe('http://a.b')
    expect(normalizeHref('not a link')).toBeNull()
  })

  it('turns **closed** and *closed* stars into marks as they are typed', () => {
    const bold = inlineShortcut([{ text: 'a **big**' }], 9)!
    expect(serializeInline(bold.runs)).toBe('a **big**')
    expect(bold.runs).toEqual([{ text: 'a ' }, { text: 'big', bold: true }])
    expect(bold.caret).toBe(5)
    const italic = inlineShortcut([{ text: 'so *very*' }], 9)!
    expect(italic.runs).toEqual([{ text: 'so ' }, { text: 'very', italic: true }])
    expect(inlineShortcut([{ text: 'a **big*' }], 8)).toBeNull()
    expect(inlineShortcut([{ text: '2 * 3 *' }], 7)).toBeNull()
  })
})
