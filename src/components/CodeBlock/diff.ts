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
