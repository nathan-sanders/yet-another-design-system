import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

import { collectHeadings, type OutlineItem, type OutlineLevel } from './scrollspy'

export interface UseOutlineFromDOMOptions {
  /** Which heading levels to list. Defaults to `[2, 3]` — sections and their subsections. */
  levels?: readonly OutlineLevel[]
}

/**
 * The `items` for an Outline, read off the headings inside a container.
 *
 *     const article = useRef<HTMLElement>(null)
 *     const items = useOutlineFromDOM(article)
 *     <article ref={article}>…</article>
 *     <Outline items={items} />
 *
 * For content that is rendered rather than authored — markdown, a CMS, a
 * streaming reply — where hand-writing the list would mean writing it twice.
 * Only headings with an `id` are listed: a heading nothing can link to has no
 * place in an outline, so give them ids (a markdown pipeline's slugger does).
 *
 * Reads in a layout effect, so the first paint already has the list, and
 * re-reads through a `MutationObserver` when headings are added, removed,
 * re-labelled or given a new id — content that streams in is picked up as it
 * lands. The array's identity only changes when its contents do, so passing it
 * to Outline does not resubscribe the spy on every mutation.
 */
export function useOutlineFromDOM(
  containerRef: RefObject<HTMLElement | null>,
  { levels = [2, 3] }: UseOutlineFromDOMOptions = {},
): OutlineItem[] {
  const [items, setItems] = useState<OutlineItem[]>([])
  // Compare by value: a `levels` literal is a new array each render.
  const levelsKey = levels.join(',')

  useLayoutEffect(() => {
    const root = containerRef.current
    if (!root) return
    const wanted = levelsKey.split(',').filter(Boolean).map(Number) as OutlineLevel[]

    const read = () => {
      const next = collectHeadings(root, wanted)
      setItems((previous) => (sameItems(previous, next) ? previous : next))
    }
    read()

    const observer = new MutationObserver(read)
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['id'],
    })
    return () => observer.disconnect()
  }, [containerRef, levelsKey])

  return items
}

function sameItems(a: readonly OutlineItem[], b: readonly OutlineItem[]) {
  if (a.length !== b.length) return false
  return a.every((entry, index) => {
    const other = b[index]
    return entry.id === other.id && entry.label === other.label && entry.level === other.level
  })
}
