import type { ReactNode } from 'react'
import { Ellipsis } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Button } from '../../../src/components/Button'
import { ChatMessage } from '../../../src/components/Chat'
import { Text } from '../../../src/components/Text'
import { Token } from '../../../src/components/Token'
import veggieVault from '../assets/veggie-vault.png'
import { authorOf, customerFor } from '../data/inbox'
import { personFor } from '../data/people'
import { profiles } from '../data/posts'
import type { Ticket } from '../data/types'
import { runs, type ChatEntry } from './chatEntries'
import { SentimentToken } from './TicketMeta'

/** A line from the system, centered in the log: an assignment, a completion. */
export function SystemLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center">
      <Text
        size="sm"
        color="subtle"
        className="rounded-md bg-surface-background-subtle px-3 py-1 text-center italic"
      >
        {children}
      </Text>
    </div>
  )
}

/**
 * A private message as a chat, after Nathan's Sprout inbox screens: the
 * customer's bubbles on the left over Yak's read of them, the brand's on the
 * right in the emphasized bubble, beside the brand's mark and over the
 * teammate who sent them. It is a `ChatMessage` because a private message is
 * a chat turn — the counterpart of `InboxComment`, which is not (FINDINGS 17).
 *
 * The Token under a run is a row after the message, not inside it:
 * `ChatMessage` has no slot below its metadata (FINDINGS 139). It pads in by
 * the 24px avatar and the 8px gap, so it lines up with the bubble's edge.
 *
 * Fragments, not a log: the caller's `role="log"` holds these.
 */
export function PrivateChat({
  ticket,
  entries,
  onMore,
}: {
  ticket: Ticket
  entries: ChatEntry[]
  onMore: () => void
}) {
  const customer = customerFor(ticket.customerId)
  return runs(entries).map((run) => {
    if (!Array.isArray(run)) return <SystemLine key={run.id}>{run.text}</SystemLine>

    const first = run[0]!
    const last = run.at(-1)!
    const fromCustomer = first.authorId === ticket.customerId
    const author = authorOf(first.authorId)
    const isBrand = profiles.some((p) => p.id === first.authorId)
    const sender = first.sentBy ? personFor(first.sentBy) : undefined
    const sentiment = fromCustomer ? last.sentiment : undefined

    return (
      <div key={first.id} className="flex flex-col gap-1">
        <ChatMessage
          direction={fromCustomer ? 'received' : 'sent'}
          sender={sender ? `${author.name}, sent by ${sender.name}` : author.name}
          avatar={
            <Avatar
              name={author.name}
              src={isBrand ? veggieVault : author.avatar}
              alt=""
              size="small"
            />
          }
          metadata={
            fromCustomer ? (
              <ChatMessage.Metadata
                timestamp={last.ago}
                actions={
                  <Button
                    appearance="ghost"
                    size="small"
                    startIcon={Ellipsis}
                    aria-label={`More for ${customer.handle}'s message`}
                    onClick={onMore}
                  />
                }
              />
            ) : (
              <ChatMessage.Metadata
                status={last.justSent ? 'delivered' : 'read'}
                timestamp={last.justSent ? 'now' : last.ago}
              />
            )
          }
        >
          {run.map((message) => (
            <ChatMessage.Bubble
              key={message.id}
              appearance={fromCustomer ? 'default' : 'emphasized'}
            >
              {message.body}
            </ChatMessage.Bubble>
          ))}
        </ChatMessage>
        {sentiment || sender ? (
          <div className={fromCustomer ? 'flex pl-8' : 'flex justify-end pr-8'}>
            {sentiment ? <SentimentToken sentiment={sentiment} /> : null}
            {sender ? (
              <Token avatar={<Token.Avatar name={sender.name} src={sender.avatar} />}>
                {sender.name}
              </Token>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  })
}
