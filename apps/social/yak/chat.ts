import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

import type { Network } from '../data/types'
import { pageWork, type PageWork } from './insights'
import { scriptedReply, type ReplyContext, type ScriptedReply } from './replies'
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
  /** A scripted answer, settled when the turn was asked. Without one, the house line. */
  reply?: ScriptedReply
  sentAt: Date
  repliedAt?: Date
}

/**
 * The composer, while it is open: which networks the post goes to and what
 * its shared caption says, so Yak can write a network's version and the
 * caption card knows it has somewhere to land.
 */
export interface ComposeTarget {
  networks: Network[]
  caption: string
}

/**
 * Something Yak put into the composer from a reply: a network's caption, or
 * a preview switch. The chat holds the list and the composer watches it, so
 * the form's state never leaves the composer and Undo is removing the entry.
 */
export interface AppliedAction {
  id: string
  turnId: number
  kind: 'caption' | 'preview'
  network: Network
  text: string
}

export interface YakChat {
  turns: Turn[]
  thinking: boolean
  /** Ask in the current chat. `from` is the page it is about. */
  ask: (prompt: string, from: string) => void
  /** Ask as the first thing in a fresh chat — the floating bar opening the panel. */
  start: (prompt: string, from: string) => void
  /** A search bar's words: a new chat, answered with results. */
  search: (query: string, from: string) => void
  stop: () => void
  clear: () => void
  composeTarget: ComposeTarget | null
  setComposeTarget: (target: ComposeTarget | null) => void
  applied: AppliedAction[]
  apply: (action: Omit<AppliedAction, 'id'>) => string
  unapply: (id: string) => void
}

/**
 * One conversation for the whole app, held by the shell, so the panel and the
 * full view are two windows on the same chat: expand mid-answer and it is still
 * answering. `getContext` is what Yak may read to answer a prompt asked beside
 * a page — the schedule, the open idea — and the shell supplies it.
 */
export function useYakChatState({
  getContext,
}: {
  getContext: (from: string) => Omit<ReplyContext, 'caption'>
}): YakChat {
  const [turns, setTurns] = useState<Turn[]>([])
  const [composeTarget, setComposeTargetState] = useState<ComposeTarget | null>(null)
  const [applied, setApplied] = useState<AppliedAction[]>([])
  const nextId = useRef(1)
  const nextActionId = useRef(1)
  // What the composer last reported, readable the moment a prompt is asked.
  const target = useRef<ComposeTarget | null>(null)

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

  const askOn = useCallback(
    (prompt: string, from: string, fresh: boolean) => {
      const reply = scriptedReply(prompt, from, {
        ...getContext(from),
        caption: target.current?.caption,
      })
      add({ prompt, work: pageWork(from), reply }, fresh)
    },
    [add, getContext],
  )

  const ask = useCallback((prompt: string, from: string) => askOn(prompt, from, false), [askOn])
  const start = useCallback((prompt: string, from: string) => askOn(prompt, from, true), [askOn])

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

  const clear = useCallback(() => {
    setTurns([])
    setApplied([])
  }, [])

  const setComposeTarget = useCallback((next: ComposeTarget | null) => {
    target.current = next
    setComposeTargetState(next)
  }, [])

  const apply = useCallback((action: Omit<AppliedAction, 'id'>) => {
    const id = `yak-apply-${nextActionId.current++}`
    setApplied((current) => [...current, { ...action, id }])
    return id
  }, [])

  const unapply = useCallback((id: string) => {
    setApplied((current) => current.filter((action) => action.id !== id))
  }, [])

  // One object per state, so an effect that depends on the chat does not run
  // on every render of the shell.
  return useMemo<YakChat>(
    () => ({
      turns,
      thinking: turns.some((t) => t.state === 'thinking'),
      ask,
      start,
      search: runSearch,
      stop,
      clear,
      composeTarget,
      setComposeTarget,
      applied,
      apply,
      unapply,
    }),
    [turns, ask, start, runSearch, stop, clear, composeTarget, setComposeTarget, applied, apply, unapply],
  )
}

export const YakChatContext = createContext<YakChat | null>(null)

export function useYakChat(): YakChat {
  const chat = useContext(YakChatContext)
  if (!chat) throw new Error('useYakChat needs the SocialShell around it')
  return chat
}
