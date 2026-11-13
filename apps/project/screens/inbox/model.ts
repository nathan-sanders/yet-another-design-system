import {
  AtSign,
  HeartPulse,
  Layers,
  Megaphone,
  MessageCircle,
  MessageCircleQuestionMark,
  Stamp,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

import { day, sameDay, today, weekdayShort } from '../../data/dates'
import type { InboxItem, InboxKind } from '../../data/inbox'
import { personFor } from '../../data/people'
import type { Task } from '../../data/types'
import { workDueLabel } from '../my-work/model'
import type { Message } from './inboxState'

/** The Top Bar's segments: Primary and Other are the inbox, Later and Cleared what you set aside. */
export const INBOX_TABS = [
  { id: 'primary', label: 'Primary' },
  { id: 'other', label: 'Other' },
  { id: 'later', label: 'Later' },
  { id: 'cleared', label: 'Cleared' },
] as const

export type InboxView = (typeof INBOX_TABS)[number]['id']

export function inboxPath(view: InboxView, itemId?: string): string {
  return `/inbox/${view}${itemId ? `?item=${itemId}` : ''}`
}

/** The `Type` glyph beside the sender, as the frame draws each kind. */
export const KIND_ICON: Record<InboxKind, LucideIcon> = {
  approval: Stamp,
  mention: AtSign,
  question: MessageCircleQuestionMark,
  bundle: Layers,
  assigned: UserPlus,
  health: HeartPulse,
  update: Megaphone,
  comment: MessageCircle,
}

/** "Due today", "Due Friday", "Due Nov 13", as the meta's Due token reads. */
export function dueText(task: Task): string {
  const label = workDueLabel(task)
  const weekday: Record<string, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  }
  return label === 'Today' ? 'Due today' : `Due ${weekday[label] ?? label}`
}

export function senderName(from: string): string {
  return from === 'yak' ? 'Yak' : personFor(from).name
}

/** The messages a segment lists, newest first. */
export function messagesIn(messages: Message[], view: InboxView): Message[] {
  const listed = messages.filter((m) =>
    view === 'later'
      ? m.place.where === 'later'
      : view === 'cleared'
        ? m.place.where === 'cleared'
        : m.place.where === 'inbox' && m.tab === view,
  )
  return [...listed].sort((a, b) => sortKey(b) - sortKey(a))
}

function sortKey(item: InboxItem): number {
  const [time, part] = item.time.split(' ')
  const [h, min] = time.split(':').map(Number)
  const hours = (h % 12) + (part === 'pm' ? 12 : 0)
  return day(item.date).getTime() + (hours * 60 + min) * 60_000
}

/**
 * A segment's count, as its label carries it: new messages in Primary and
 * Other ("Primary · 4"), everything waiting in Later ("Later · 2"), and none
 * on Cleared.
 */
export function countFor(messages: Message[], view: InboxView): number {
  if (view === 'cleared') return 0
  const listed = messagesIn(messages, view)
  return view === 'later' ? listed.length : listed.filter((m) => m.unread).length
}

/** Today, Yesterday or Earlier, the list's group headings. */
export function dayGroup(item: InboxItem, now: Date = today): string {
  const date = day(item.date)
  if (sameDay(date, now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return sameDay(date, yesterday) ? 'Yesterday' : 'Earlier'
}

/** The time on a message: the clock for today's, the weekday for anything older. */
export function timeLabel(item: InboxItem, now: Date = today): string {
  const date = day(item.date)
  return sameDay(date, now) ? item.time : weekdayShort.format(date)
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']

/** All caught up's line: what comes back from Later, and when. */
export function caughtUpLine(later: Message[]): string {
  const rest = 'Nothing else needs you today.'
  if (!later.length) return rest
  const order = ['today', 'tomorrow', 'monday']
  const soonest = [...later].sort(
    (a, b) =>
      order.indexOf(a.place.where === 'later' ? a.place.back : '') -
      order.indexOf(b.place.where === 'later' ? b.place.back : ''),
  )[0]
  const when =
    soonest.place.where === 'later'
      ? { today: 'later today', tomorrow: 'tomorrow morning', monday: 'on Monday' }[
          soonest.place.back
        ]
      : ''
  const n = later.length
  const count = WORDS[n] ?? String(n)
  return n === 1
    ? `${count} item comes back ${when}. ${rest}`
    : `${count} items come back${allSame(later) ? ` ${when}` : ', the first ' + when}. ${rest}`
}

function allSame(later: Message[]): boolean {
  const backs = new Set(later.map((m) => (m.place.where === 'later' ? m.place.back : '')))
  return backs.size === 1
}
