import { describe, expect, it } from 'vitest'

import { formatFileSize, matchesAccept, sameFiles, screen } from './files'

/**
 * The rules decide what a person is allowed to hand over, and a wrong answer
 * renders perfectly — a PDF sitting happily in an image field. So they are
 * pinned here, and the stories are left to prove the drop and the geometry.
 */

const file = (name: string, bytes = 10, type = '') =>
  new File([new Uint8Array(bytes)], name, { type })

describe('matchesAccept', () => {
  it('matches an extension, case-insensitively', () => {
    expect(matchesAccept(file('CV.PDF'), '.pdf,.docx')).toBe(true)
    expect(matchesAccept(file('cv.txt'), '.pdf,.docx')).toBe(false)
  })

  it('matches a wildcard MIME family', () => {
    expect(matchesAccept(file('a.png', 1, 'image/png'), 'image/*')).toBe(true)
    expect(matchesAccept(file('a.pdf', 1, 'application/pdf'), 'image/*')).toBe(false)
  })

  it('matches an exact MIME type, and tolerates spaces', () => {
    expect(matchesAccept(file('a.pdf', 1, 'application/pdf'), 'image/*, application/pdf')).toBe(true)
  })
})

describe('formatFileSize', () => {
  it('uses decimal units and one decimal place', () => {
    expect(formatFileSize(999)).toMatch(/^999\s?byte/)
    expect(formatFileSize(2_400_000)).toMatch(/^2\.4\s?MB$/)
    expect(formatFileSize(5_000_000)).toMatch(/^5\s?MB$/)
  })
})

describe('screen', () => {
  it('keeps one file when multiple is off, and says so', () => {
    const { accepted, rejected } = screen([file('a'), file('b')], {})
    expect(accepted.map((f) => f.name)).toEqual(['a'])
    expect(rejected).toEqual([expect.objectContaining({ reason: 'count', message: 'Choose one file.' })])
  })

  it('applies type, then size, then count — in that order', () => {
    const rules = { accept: '.png', maxSize: 100, maxFiles: 1, multiple: true }
    const { accepted, rejected } = screen(
      [file('a.txt'), file('big.png', 500), file('ok.png'), file('extra.png')],
      rules,
    )
    expect(accepted.map((f) => f.name)).toEqual(['ok.png'])
    expect(rejected.map((r) => r.reason)).toEqual(['type', 'size', 'count'])
    expect(rejected[1].message).toMatch(/^big\.png is larger than 100\s?byte/)
    expect(rejected[2].message).toBe('Choose up to 1 file.')
  })
})

describe('sameFiles', () => {
  it('compares identity and order, not names', () => {
    const a = file('a')
    const b = file('a')
    expect(sameFiles([a], [a])).toBe(true)
    expect(sameFiles([a], [b])).toBe(false)
  })
})
