import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { inboxItems, NOTIFY_RULES, QUIET_RULES, type LaterTime } from '../../data/inbox'
import type { TaskComment } from '../../data/types'
import { InboxContext, type InboxState, type Message, type Place } from './inboxState'

const initialMessages: Message[] = inboxItems.map((item) => ({
  ...item,
  place: { where: 'inbox' },
  replies: [],
}))

const initialSettings: Record<string, boolean> = Object.fromEntries([
  ...NOTIFY_RULES.flatMap((rule) => [
    [`${rule.id}.inbox`, rule.inbox],
    [`${rule.id}.email`, rule.email],
  ]),
  ...QUIET_RULES.map((rule) => [rule.id, rule.on]),
])

/**
 * The inbox, held above the router like the tasks, so the rail's badge, the
 * Inbox screen and Home's "Needs you" read the same messages, and a message
 * cleared stays cleared after you leave the page.
 */
export function InboxProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState(initialMessages)
  const [settings, setSettings] = useState(initialSettings)
  // Every change pushes what the inbox was, so Undo can step back through them.
  const history = useRef<{ messages: Message[]; also?: () => void }[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const current = useRef(messages)
  current.current = messages

  const remember = useCallback((also?: () => void) => {
    history.current.push({ messages: current.current, also })
    setCanUndo(true)
  }, [])
  const undo = useCallback(() => {
    const last = history.current.pop()
    if (!last) return
    setMessages(last.messages)
    last.also?.()
    setCanUndo(history.current.length > 0)
  }, [])

  const move = useCallback((ids: string[], place: Place) => {
    setMessages((all) =>
      all.map((m) =>
        ids.includes(m.id)
          ? { ...m, place, unread: place.where === 'inbox' ? m.unread : false }
          : m,
      ),
    )
  }, [])
  const later = useCallback(
    (ids: string[], back: LaterTime) => move(ids, { where: 'later', back }),
    [move],
  )
  const clear = useCallback((ids: string[]) => move(ids, { where: 'cleared' }), [move])
  const restore = useCallback((ids: string[]) => move(ids, { where: 'inbox' }), [move])
  const markRead = useCallback((ids: string[]) => {
    setMessages((all) => all.map((m) => (ids.includes(m.id) ? { ...m, unread: false } : m)))
  }, [])
  const addReply = useCallback((id: string, reply: TaskComment) => {
    setMessages((all) =>
      all.map((m) => (m.id === id ? { ...m, unread: false, replies: [...m.replies, reply] } : m)),
    )
  }, [])
  const setSetting = useCallback(
    (key: string, on: boolean) => setSettings((all) => ({ ...all, [key]: on })),
    [],
  )

  const value = useMemo<InboxState>(
    () => ({
      messages,
      later,
      clear,
      restore,
      markRead,
      addReply,
      undo,
      canUndo,
      remember,
      settings,
      setSetting,
    }),
    [
      messages,
      later,
      clear,
      restore,
      markRead,
      addReply,
      undo,
      canUndo,
      remember,
      settings,
      setSetting,
    ],
  )
  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
