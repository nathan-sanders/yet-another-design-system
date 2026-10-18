import { useState, type ReactNode } from 'react'
import {
  ArrowRight,
  CircleUserRound,
  Ellipsis,
  Info,
  MessagesSquare,
  StickyNote,
  Tag,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { Divider } from '../../../../src/components/Divider'
import { Icon } from '../../../../src/components/Icon'
import { Input } from '../../../../src/components/Input'
import { Panel } from '../../../../src/components/Panel'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { InboxMessageCard } from '../../components/InboxMessageCard'
import { NetworkIcon } from '../../components/NetworkIcon'
import { contactNotes, customerFor, pastCounts, pastTickets, tickets } from '../../data/inbox'
import { personFor } from '../../data/people'
import { useShell } from '../../shell/ShellContext'

/**
 * One section header in the panel: icon, title, an optional count Badge and a
 * "see all" arrow. Figma draws these as plain rows (`Past conversations`,
 * `Notes`, `About` …) at 14/24 semibold; they are `h3`s here under the panel's
 * `h2`, so a screen reader can walk the sections.
 */
function SectionHeader({
  icon,
  title,
  count,
  end,
  onOpen,
}: {
  icon: LucideIcon
  title: string
  count?: number
  end?: ReactNode
  onOpen?: () => void
}) {
  return (
    <div className="flex min-h-8 items-center gap-2">
      <Icon icon={icon} size="base" className="text-content-primary" />
      <Heading level={3} size="base" weight="semibold" className="min-w-0 flex-1">
        {title}
      </Heading>
      {count !== undefined ? <Badge>{count}</Badge> : null}
      {end}
      {onOpen ? (
        <Button appearance="ghost" startIcon={ArrowRight} aria-label={`Open ${title}`} onClick={onOpen} />
      ) : null}
    </div>
  )
}

/**
 * Contact detail (`40005911:33894`, the `Panel` instance `34138`): who wrote
 * in, the team's tags and notes on them, their past tickets, and the three
 * rows the real product would open into. A `Panel`, as post detail is, because
 * the conversation stays live beside it — the list folds to faces to make room.
 */
export function ContactDetailPanel({
  customerId,
  open,
  onClose,
}: {
  /** Kept after closing so the panel slides out with its content. */
  customerId?: string
  open: boolean
  onClose: () => void
}) {
  const shell = useShell()
  // Tags edited here live for the session, per customer.
  const [tagEdits, setTagEdits] = useState<Record<string, string[]>>({})
  const [draftTag, setDraftTag] = useState('')

  if (!customerId) return null
  const customer = customerFor(customerId)
  const tags = tagEdits[customerId] ?? customer.tags ?? []
  const setTags = (next: string[]) => setTagEdits((all) => ({ ...all, [customerId]: next }))
  const past = pastTickets.filter((t) => t.customerId === customerId)
  const pastCount = pastCounts[customerId] ?? past.length
  const notes = contactNotes.filter((n) => n.customerId === customerId)
  const network = tickets.find((t) => t.customerId === customerId)?.network

  const addTag = () => {
    const tag = draftTag.trim()
    if (tag && !tags.includes(tag)) setTags([...tags, tag])
    setDraftTag('')
  }

  return (
    <Panel
      aria-label="Contact detail"
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      <Panel.Header icon={CircleUserRound} closeButton>
        Contact detail
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={customer.handle} src={customer.avatar} alt="" size="large" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-1">
              {network ? <NetworkIcon network={network} /> : null}
              <Text render={<span />} size="lg" weight="semibold" color="emphasized" truncate>
                {customer.handle}
              </Text>
            </div>
            {customer.name || customer.location ? (
              <Text size="sm" color="subtle" truncate>
                {[customer.name, customer.location].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </div>
          <Button
            appearance="ghost"
            startIcon={Ellipsis}
            aria-label="Contact actions"
            onClick={() => shell.notBuilt('Contact actions')}
          />
        </div>

        <Divider />

        <section aria-labelledby="contact-tags" className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon icon={Tag} size="base" className="text-content-primary" />
            <Heading id="contact-tags" level={3} size="base" weight="semibold">
              Contact tags
            </Heading>
          </div>
          <Input
            aria-label="Add a tag"
            placeholder="Add tags…"
            value={draftTag}
            onChange={(event) => setDraftTag(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addTag()
              }
            }}
          />
          {tags.length ? (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Token
                  key={tag}
                  startIcon={Tag}
                  onRemove={() => setTags(tags.filter((t) => t !== tag))}
                  removeLabel={`Remove ${tag}`}
                >
                  {tag}
                </Token>
              ))}
            </div>
          ) : (
            <Text size="sm" color="subtle">
              No tags yet. Type one and press Enter.
            </Text>
          )}
        </section>

        <Divider />

        <section aria-label="Past conversations" className="flex flex-col gap-2">
          <SectionHeader
            icon={MessagesSquare}
            title="Past conversations"
            count={pastCount}
            onOpen={pastCount ? () => shell.notBuilt('Conversation history') : undefined}
          />
          {past.length ? (
            past.map((ticket) => (
              <InboxMessageCard
                key={ticket.number}
                ticket={ticket}
                emphasis="default"
                onOpen={() => shell.notBuilt('Closed conversations')}
              />
            ))
          ) : (
            <Text size="sm" color="subtle">
              This is their first conversation with you.
            </Text>
          )}
        </section>

        <Divider />

        <section aria-label="Notes" className="flex flex-col gap-2">
          <SectionHeader
            icon={StickyNote}
            title="Notes"
            count={notes.length}
            onOpen={notes.length ? () => shell.notBuilt('All notes') : undefined}
          />
          {notes.length ? (
            notes.map((note) => (
              <Card key={note.id} emphasis="subtle" className="gap-1">
                <Text>{note.body}</Text>
                <Text size="sm" color="subtle">
                  {personFor(note.authorId).name} · {note.date}
                </Text>
              </Card>
            ))
          ) : (
            <Text size="sm" color="subtle">
              No notes yet. Internal notes on a conversation land here.
            </Text>
          )}
        </section>

        <Divider />
        <SectionHeader icon={Info} title="About" onOpen={() => shell.notBuilt('About')} />
        <Divider />
        <SectionHeader
          icon={UsersRound}
          title="Audience"
          end={customer.followers ? <Token>{customer.followers} followers</Token> : null}
          onOpen={() => shell.notBuilt('Audience')}
        />
        <Divider />
        <SectionHeader
          icon={UserCheck}
          title="Following status"
          end={<Token>{customer.followsYou ? 'Follows you' : 'Not following'}</Token>}
          onOpen={() => shell.notBuilt('Following status')}
        />
      </Panel.Body>
    </Panel>
  )
}
