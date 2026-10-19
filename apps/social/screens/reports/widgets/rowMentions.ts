import type { MentionQuery } from '../../../data/mentions'
import type { useMentions } from '../../mentions/useMentions'

/** What a row's first cell does when pressed: opens the mentions behind it. */
export interface RowMentions<T> {
  open: (item: T) => void
  isOpen: (item: T) => boolean
}

/** Wires a row's button to the mentions panel, given how to ask for its mentions. */
export function rowMentions<T>(
  mentions: ReturnType<typeof useMentions>,
  query: (item: T) => MentionQuery | undefined,
): RowMentions<T> {
  return {
    open: (item) => {
      const q = query(item)
      if (q) mentions.toggle(q)
    },
    isOpen: (item) => {
      const q = query(item)
      return q ? mentions.isOpen(q.key) : false
    },
  }
}
