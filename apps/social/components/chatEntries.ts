import type { Ticket, TicketSentiment } from '../data/types'

/** One line of a private conversation, before runs are grouped. */
export type ChatEntry =
  | {
      kind: 'message'
      id: string
      /** A customer id, or a brand profile id for a reply the team sent. */
      authorId: string
      body: string
      ago: string
      sentBy?: string
      sentiment?: TicketSentiment
      /** Sent from this screen in this session: not read yet. */
      justSent?: boolean
    }
  | { kind: 'system'; id: string; text: string }

/**
 * The ticket as a list of chat entries, oldest first: the first message, the
 * routing note, then the history, whose system lines stay where they happened.
 */
export function chatEntries(ticket: Ticket): ChatEntry[] {
  const entries: ChatEntry[] = [
    {
      kind: 'message',
      id: `${ticket.number}-body`,
      authorId: ticket.customerId,
      body: ticket.body,
      ago: ticket.startedAgo ?? ticket.ago,
    },
  ]
  if (ticket.note) entries.push({ kind: 'system', id: `${ticket.number}-note`, text: ticket.note })
  for (const reply of ticket.history ?? []) {
    entries.push(
      reply.system
        ? { kind: 'system', id: reply.id, text: reply.body }
        : { kind: 'message', ...reply },
    )
  }
  return entries
}

export type Message = Extract<ChatEntry, { kind: 'message' }>

/**
 * Consecutive messages from one sender, sent by one teammate, become one
 * `ChatMessage` — the library's rule, one Bubble Group per run. A system line
 * ends a run.
 */
export function runs(entries: ChatEntry[]): (Message[] | Extract<ChatEntry, { kind: 'system' }>)[] {
  const out: (Message[] | Extract<ChatEntry, { kind: 'system' }>)[] = []
  for (const entry of entries) {
    const last = out.at(-1)
    if (entry.kind === 'system') out.push(entry)
    else if (
      Array.isArray(last) &&
      last[0]!.authorId === entry.authorId &&
      last[0]!.sentBy === entry.sentBy
    )
      last.push(entry)
    else out.push([entry])
  }
  return out
}
