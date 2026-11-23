import { describe, expect, it } from 'vitest'

import { parseDiff, splitRows } from './diff'

const read = (diff: string) => splitRows(parseDiff(diff.split('\n')))

/** Each row as "before | after", a side's number and marker, `·` for an empty side. */
function sides(diff: string): string[] {
  return read(diff).map((row) =>
    row.kind === 'hunk'
      ? row.line.text
      : [row.before, row.after]
          .map((cell) => (cell ? `${cell.number}${cell.line.marker.trim()}` : '·'))
          .join(' | '),
  )
}

describe('splitRows', () => {
  it('sets a removed line beside the added lines that replaced it, and keeps context level', () => {
    expect(sides('@@ -8,3 +8,5 @@\n a\n-b\n+c\n+d\n e')).toEqual([
      '@@ -8,3 +8,5 @@',
      '8 | 8',
      '9- | 9+',
      '· | 10+',
      '10 | 11',
    ])
  })

  it('numbers each side from its own hunk header', () => {
    expect(sides('@@ -41,3 +41,3 @@\n x\n-y\n+z\n w\n@@ -60,1 +60,2 @@\n v\n+u')).toEqual([
      '@@ -41,3 +41,3 @@',
      '41 | 41',
      '42- | 42+',
      '43 | 43',
      '@@ -60,1 +60,2 @@',
      '60 | 60',
      '· | 61+',
    ])
  })

  it('starts from the given number when the diff has no hunk header', () => {
    expect(
      splitRows(parseDiff([' a', '-b']), 24).map((r) => r.kind === 'pair' && r.before?.number),
    ).toEqual([24, 25])
  })

  it('points each side back at its line in the parsed diff', () => {
    const rows = read('@@ -1 +1 @@\n-old\n+new')
    expect(rows[1]).toMatchObject({ kind: 'pair', before: { index: 1 }, after: { index: 2 } })
  })
})
