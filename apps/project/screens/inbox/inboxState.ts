import { createContext, useContext } from 'react'

import type { InboxItem, LaterTime } from '../../data/inbox'
import type { TaskComment } from '../../data/types'

/** Where a message is: still in the inbox, put off until a time, or cleared. */
export type Place = { where: 'inbox' } | { where: 'later'; back: LaterTime } | { where: 'cleared' }

/** One message, and what has been done with it. */
export interface Message extends InboxItem {
  place: Place
  /** What you wrote back from the inbox, after its conversation. */
  replies: TaskComment[]
}

export interface InboxState {
  messages: Message[]
  /** Puts messages off until a time; they wait in Later. */
  later: (ids: string[], back: LaterTime) => void
  /** Clears messages; they wait in Cleared. */
  clear: (ids: string[]) => void
  /** Puts cleared or put-off messages back in the inbox. */
  restore: (ids: string[]) => void
  /** Takes the dot off. */
  markRead: (ids: string[]) => void
  /** Records a reply written from the inbox, and marks the message read. */
  addReply: (id: string, reply: TaskComment) => void
  /**
   * Takes back the last thing done — Clear, Later, Clear all, Approve — as
   * the toast's Undo and ⌘Z both do. `also` undoes what it did elsewhere,
   * an approval's change to its task.
   */
  undo: () => void
  canUndo: boolean
  /** Saves the inbox as it is, so the next change can be undone. */
  remember: (also?: () => void) => void
  /** Inbox settings' switches, by rule and channel: `mentioned.email`. */
  settings: Record<string, boolean>
  setSetting: (key: string, on: boolean) => void
}

export const InboxContext = createContext<InboxState | null>(null)

export function useInbox(): InboxState {
  const state = useContext(InboxContext)
  if (!state) throw new Error('useInbox needs the InboxProvider around it')
  return state
}
