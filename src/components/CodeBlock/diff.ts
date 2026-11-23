/**
 * A unified diff, read line by line into Figma's `_Code Line` types.
 *
 * The rules are Astryx's `isDiff`: `+` is added, `-` is removed, `@@` is a hunk
 * header, and anything else is context. A `---` / `+++` pair directly before a
 * hunk is the file header, not a removed and an added line — read naively,
 * `--- a/theme.css` is a deletion of the text `-- a/theme.css`.
 *
 * The marker is split off into its own column so the rest of the line can be
 * syntax highlighted as the block's language; copying still returns the source
 * exactly, because the block copies its `code` prop and never this.
 */

/** Figma's `_Code Line` `Type` axis, minus `Default` and `Highlighted`. */
export type DiffLineType = 'added' | 'removed' | 'context' | 'hunk'

export interface DiffLine {
  type: DiffLineType
  /** `+`, `-` or a space; empty for a hunk, which has no marker column. */
  marker: string
  /** The line with its marker removed. For a hunk, the whole line. */
  text: string
}

export function parseDiff(lines: string[]): DiffLine[] {
  return lines.map((line, i) => {
    if (line.startsWith('@@')) return { type: 'hunk', marker: '', text: line }
    // `---` then `+++` then `@@` is a file header; it reads as hunk chrome.
    if (
      (line.startsWith('--- ') && lines[i + 1]?.startsWith('+++ ')) ||
      (line.startsWith('+++ ') && lines[i - 1]?.startsWith('--- '))
    ) {
      return { type: 'hunk', marker: '', text: line }
    }
    if (line.startsWith('+')) return { type: 'added', marker: '+', text: line.slice(1) }
    if (line.startsWith('-')) return { type: 'removed', marker: '-', text: line.slice(1) }
    // Context lines carry a leading space in a real diff; a hand-written one
    // may not, and then nothing is removed.
    return { type: 'context', marker: ' ', text: line.startsWith(' ') ? line.slice(1) : line }
  })
}

/** One side of a split row: the line, its index in the parsed diff, and its number on that side. */
export interface SplitCell {
  line: DiffLine
  index: number
  number: number
}

/** A row of the split view: a hunk header across both sides, or a before and an after. */
export type SplitRow =
  | { kind: 'hunk'; line: DiffLine; index: number }
  | { kind: 'pair'; before?: SplitCell; after?: SplitCell }

/**
 * The split view's rows. Context sits on both sides; a run of removed lines
 * sits beside the run of added lines that replaced it, the shorter side left
 * empty, so the context after them stays level. Each side numbers from its
 * hunk header — `@@ -24,5 +24,9 @@` starts before at 24 and after at 24 — or
 * from `start` before the first hunk.
 */
export function splitRows(lines: DiffLine[], start = 1): SplitRow[] {
  const rows: SplitRow[] = []
  let before = start
  let after = start
  let removed: SplitCell[] = []
  let added: SplitCell[] = []
  const flush = () => {
    for (let i = 0; i < Math.max(removed.length, added.length); i++) {
      rows.push({ kind: 'pair', before: removed[i], after: added[i] })
    }
    removed = []
    added = []
  }
  lines.forEach((line, index) => {
    if (line.type === 'removed') return removed.push({ line, index, number: before++ })
    if (line.type === 'added') return added.push({ line, index, number: after++ })
    flush()
    if (line.type === 'hunk') {
      const numbers = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(line.text)
      if (numbers) {
        before = Number(numbers[1])
        after = Number(numbers[2])
      }
      rows.push({ kind: 'hunk', line, index })
      return
    }
    rows.push({
      kind: 'pair',
      before: { line, index, number: before++ },
      after: { line, index, number: after++ },
    })
  })
  flush()
  return rows
}
