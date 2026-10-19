import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Every menu's rows sit inside a `Menu.Group`.
 *
 * The 8px round the rows is the Group's, not the Popup's — Figma draws it on
 * `Menu Group`, and that is what lets a separator run edge to edge between two
 * groups. So items written straight into a `Menu.Popup` sit flush against its
 * edge. Nothing else catches it: it type-checks, axe is happy, and in a
 * screenshot at a glance it is just a slightly tight menu. It shipped in four
 * stories, then two Chat stories, then the calendar's + menu in Yet Social —
 * the rule was written down in Menu's record each time, which only loads for
 * someone working inside this folder. So it is a test now, over `src` and
 * `apps` both.
 *
 * `Menu.RadioGroup` does not count: it is Base UI's raw part and carries no
 * padding, so it goes inside a `Menu.Group` like any other row.
 */

const REPO = join(import.meta.dirname, '..', '..', '..')

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) return []
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sources(path)
    return entry.name.endsWith('.tsx') ? [path] : []
  })
}

/** The first element written inside each `Menu.Popup` / `ContextMenu.Popup`. */
function popupFirstChildren(source: string): { line: number; first: string }[] {
  const found: { line: number; first: string }[] = []
  for (const open of source.matchAll(/<(Menu|ContextMenu)\.Popup\b/g)) {
    const start = source.indexOf('>', open.index) + 1
    const end = source.indexOf(`</${open[1]}.Popup>`, start)
    if (end === -1) continue
    const first = /<([A-Z][\w.]*)/.exec(source.slice(start, end))
    if (first)
      found.push({ line: source.slice(0, open.index).split('\n').length, first: first[1]! })
  }
  return found
}

describe('menus', () => {
  const files = [...sources(join(REPO, 'src')), ...sources(join(REPO, 'apps'))]

  it('finds menus to check', () => {
    expect(files.some((file) => popupFirstChildren(readFileSync(file, 'utf8')).length > 0)).toBe(
      true,
    )
  })

  it('put their rows in a Menu.Group', () => {
    const bare = files.flatMap((file) =>
      popupFirstChildren(readFileSync(file, 'utf8'))
        .filter(({ first }) => !/(^|\.)Group$/.test(first) || first.endsWith('RadioGroup'))
        .map(({ line, first }) => `${relative(REPO, file)}:${line} opens with <${first}>`),
    )
    expect(bare).toEqual([])
  })
})
