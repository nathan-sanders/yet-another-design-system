import { createContext, useCallback, useContext, useRef, useState } from 'react'

import { pageWork, type PageWork } from './insights'
import { search, type SearchResults } from './search'

export interface Turn {
  id: number
  prompt: string
  /** `thinking` until the canned reply lands. */
  state: 'thinking' | 'done'
  /** The page it was asked beside, which decides what Yak reads to answer. */
  work: PageWork
  /** What a search bar's words turned up, shown under the answer. */
  results?: SearchResults
  sentAt: Date
  repliedAt?: Date
}

export interface YakChat {
  turns: Turn[]
  thinking: boolean
  /** Ask in the current chat. `from` is the page it is about. */
  ask: (prompt: string, from: string) => void
  /** A search bar's words: a new chat, answered with results. */
  search: (query: string, from: string) => void
  stop: () => void
  clear: () => void
}

/**
 * One conversation for the whole app, held by the shell, so the panel and the
 * full view are two windows on the same chat: expand mid-answer and it is still
 * answering.
 */
export function useYakChatState(): YakChat {
  const [turns, setTurns] = useState<Turn[]>([])
  const nextId = useRef(1)

  const add = useCallback((turn: Omit<Turn, 'id' | 'state' | 'sentAt'>, fresh: boolean) => {
    const id = nextId.current++
    const next: Turn = { ...turn, id, state: 'thinking', sentAt: new Date() }
    setTurns((current) => (fresh ? [next] : [...current, next]))
    window.setTimeout(() => {
      setTurns((current) =>
        current.map((t) => (t.id === id ? { ...t, state: 'done', repliedAt: new Date() } : t)),
      )
    }, 1800)
  }, [])

  const ask = useCallback(
    (prompt: string, from: string) => add({ prompt, work: pageWork(from) }, false),
    [add],
  )

  const runSearch = useCallback(
    (query: string, from: string) => {
      const results = search(query, from)
      add({ prompt: query, work: results.work, results }, true)
    },
    [add],
  )

  const stop = useCallback(
    () =>
      setTurns((current) =>
        current.map((t) =>
          t.state === 'thinking' ? { ...t, state: 'done', repliedAt: new Date() } : t,
        ),
      ),
    [],
  )

  const clear = useCallback(() => setTurns([]), [])

  return {
    turns,
    thinking: turns.some((t) => t.state === 'thinking'),
    ask,
    search: runSearch,
    stop,
    clear,
  }
}

export const YakChatContext = createContext<YakChat | null>(null)

export function useYakChat(): YakChat {
  const chat = useContext(YakChatContext)
  if (!chat) throw new Error('useYakChat needs the SocialShell around it')
  return chat
}
