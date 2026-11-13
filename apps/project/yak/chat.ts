import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import type { Task } from '../data/types'
import { scriptedReply, type ScriptedReply } from './replies'

export interface Turn {
  id: number
  prompt: string
  /** `thinking` until the reply lands. */
  state: 'thinking' | 'done'
  /** Settled when the turn was asked. */
  reply: ScriptedReply
  sentAt: Date
  repliedAt?: Date
  /** What became of the reply's proposal: applied, or put off with Not now. */
  decision?: 'applied' | 'dismissed'
}

export interface YakChat {
  turns: Turn[]
  thinking: boolean
  /** Ask in the current chat. */
  ask: (prompt: string) => void
  /** Ask as the first thing in a fresh chat: the floating bar, Home's composer. */
  start: (prompt: string) => void
  stop: () => void
  clear: () => void
  /** Record what was done with a turn's proposal; `undefined` puts it back. */
  decide: (turnId: number, decision: Turn['decision']) => void
}

/**
 * One conversation for the whole app, held by the shell, so the rail, the
 * floating bar, Home and the Overview's Ask all reach the same chat. Yet
 * Social's `useYakChatState`, without its search, composer target and
 * page work: here a reply needs only the tasks, read when it is asked.
 */
export function useYakChatState({ tasks }: { tasks: Task[] }): YakChat {
  const [turns, setTurns] = useState<Turn[]>([])
  const nextId = useRef(1)
  // The tasks as they are the moment a question is asked.
  const tasksNow = useRef(tasks)
  useEffect(() => {
    tasksNow.current = tasks
  }, [tasks])

  const add = useCallback((prompt: string, fresh: boolean) => {
    const id = nextId.current++
    const next: Turn = {
      id,
      prompt,
      state: 'thinking',
      reply: scriptedReply(prompt, tasksNow.current),
      sentAt: new Date(),
    }
    setTurns((current) => (fresh ? [next] : [...current, next]))
    window.setTimeout(() => {
      setTurns((current) =>
        current.map((t) => (t.id === id ? { ...t, state: 'done', repliedAt: new Date() } : t)),
      )
    }, 1800)
  }, [])

  const ask = useCallback((prompt: string) => add(prompt, false), [add])
  const start = useCallback((prompt: string) => add(prompt, true), [add])

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

  const decide = useCallback(
    (turnId: number, decision: Turn['decision']) =>
      setTurns((current) => current.map((t) => (t.id === turnId ? { ...t, decision } : t))),
    [],
  )

  return useMemo<YakChat>(
    () => ({
      turns,
      thinking: turns.some((t) => t.state === 'thinking'),
      ask,
      start,
      stop,
      clear,
      decide,
    }),
    [turns, ask, start, stop, clear, decide],
  )
}

export const YakChatContext = createContext<YakChat | null>(null)

export function useYakChat(): YakChat {
  const chat = useContext(YakChatContext)
  if (!chat) throw new Error('useYakChat needs the ProjectShell around it')
  return chat
}
