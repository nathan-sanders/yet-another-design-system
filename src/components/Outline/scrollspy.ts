import type { ReactNode } from 'react'

/**
 * The arithmetic behind Outline, kept free of React and (in `pickActive`) of the
 * DOM, so the one question that is easy to get subtly wrong — *which heading is
 * the active one?* — has a test that runs in plain Node.
 */

export type OutlineLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface OutlineItem {
  /** The `id` of the heading element this entry links to. */
  id: string
  label: ReactNode
  /** Heading level. Defaults to 2 — a page's sections, under its one `<h1>`. */
  level?: OutlineLevel
}

/** The deepest indent the recipe draws. Four steps of 16px at 240 wide is where labels run out. */
export const MAX_DEPTH = 4

export type OutlineDepth = 0 | 1 | 2 | 3 | 4

/**
 * Level → indent step. Levels 1 and 2 share the base indent, as in Astryx: an
 * `<h1>` is the document's title, not a section deeper than the sections under
 * it, so treating it as one would push every `<h2>` in by a step for no reason.
 * Beyond that each level is one 16px step, capped at `MAX_DEPTH`.
 */
export function depthOf(level: OutlineLevel = 2): OutlineDepth {
  return Math.min(Math.max(level - 2, 0), MAX_DEPTH) as OutlineDepth
}

/**
 * Which heading is active, given each heading's top edge and the activation
 * line, both in the same coordinate space (in practice, viewport pixels).
 *
 * The rule is the last heading whose top edge has reached the line — the
 * section the reader is inside. Before the first heading has been reached, the
 * first one is active, so a page's outline never opens with nothing marked. An
 * empty list has nothing to mark and returns -1.
 *
 * One pixel of tolerance, because a smooth scroll that lands "exactly" on a
 * heading settles a fraction of a pixel short of it in every browser measured,
 * and without the slack the previous section would win at the moment the user
 * arrives at the one they clicked.
 */
export function pickActive(tops: readonly number[], line: number): number {
  if (tops.length === 0) return -1
  let active = 0
  for (let index = 0; index < tops.length; index += 1) {
    if (tops[index] <= line + 1) active = index
    else break
  }
  return active
}

/**
 * Read `items` off the headings under a root. Used by `useOutlineFromDOM`; a
 * function rather than part of the hook so a test can hand it a detached tree.
 *
 * Only headings with an `id` are kept — a heading nothing can link to has no
 * place in an outline — and only the requested levels, in document order.
 */
export function collectHeadings(root: ParentNode, levels: readonly OutlineLevel[]): OutlineItem[] {
  const selector = levels.map((level) => `h${level}`).join(',')
  if (!selector) return []
  const items: OutlineItem[] = []
  for (const heading of root.querySelectorAll<HTMLHeadingElement>(selector)) {
    if (!heading.id) continue
    items.push({
      id: heading.id,
      label: heading.textContent ?? '',
      level: Number(heading.tagName.slice(1)) as OutlineLevel,
    })
  }
  return items
}
