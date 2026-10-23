import { useMemo, useState, type ReactNode } from 'react'
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
import {
  Combobox,
  type ComboboxItemData,
  type ComboboxValue,
} from '../../../../src/components/Combobox'
import { Divider } from '../../../../src/components/Divider'
import { Icon } from '../../../../src/components/Icon'
import { Panel } from '../../../../src/components/Panel'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { InboxMessageCard } from '../../components/InboxMessageCard'
import { NoteThread } from '../../components/InternalNote'
import { NetworkIcon } from '../../components/NetworkIcon'
import { contactNotes, customerFor, pastCounts, pastTickets, tickets } from '../../data/inbox'
import { createContactTag, useContactTagCatalog } from '../../data/tags'
import { useShell } from '../../shell/ShellContext'

/**
 * One section header in the panel: icon, title, an optional count Badge and a
 * "see all" arrow. Figma draws these as plain rows (`Past conversations`,
 * `Notes`, `About` …) at 14/24 semibold; they are `h3`s here under the panel's
 * `h2`, so a screen reader can walk the sections.
 *
 * With `onOpen` the whole row is the button, not just the arrow: an `h3`
 * holding a `<button>`, as an accordion trigger is, so the heading survives
 * (a heading inside a button would be flattened into its name). The row bleeds
 * 8px each side so its hover wash has room round the icon and the arrow while
 * both stay on the panel's edges.
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
  const row = (
    <>
      <Icon icon={icon} size="base" className="text-content-primary" />
      <span className="min-w-0 flex-1">{title}</span>
      {count !== undefined ? <Badge>{count}</Badge> : null}
      {end}
    </>
  )
  if (!onOpen) {
    return (
      <Heading level={3} size="base" weight="semibold" className="flex min-h-8 items-center gap-2">
        {row}
      </Heading>
    )
  }
  return (
    <Heading level={3} size="base" weight="semibold" className="-mx-2 flex">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'flex min-h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left',
          'transition-colors duration-fast ease-standard hover:bg-action-ghost-background-hover',
          focusRing,
        )}
      >
        {row}
        {/* Where the ghost arrow button sat, so the row keeps its shape. */}
        <span className="flex size-8 shrink-0 items-center justify-center text-action-ghost-foreground">
          <Icon icon={ArrowRight} />
        </span>
      </button>
    </Heading>
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
  const tagCatalog = useContactTagCatalog()

  if (!customerId) return null
  const customer = customerFor(customerId)
  const tags = tagEdits[customerId] ?? customer.tags ?? []
  const setTags = (next: string[]) => setTagEdits((all) => ({ ...all, [customerId]: next }))
  const past = pastTickets.filter((t) => t.customerId === customerId)
  const pastCount = pastCounts[customerId] ?? past.length
  // Each note in the slip every other team note wears; the date stands in
  // for the age the slip prints.
  const notes = contactNotes
    .filter((n) => n.customerId === customerId)
    .map(({ id, authorId, body, date }) => ({ id, authorId, body, ago: date }))
  const network = tickets.find((t) => t.customerId === customerId)?.network

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
          <ContactTags tags={tags} catalog={tagCatalog} onChange={setTags} />
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
            <NoteThread notes={notes} label={`Notes on ${customer.handle}`} actions={false} />
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

/**
 * The contact's tags as Asset details has them (`40006105:40392`): chips
 * inside a multiple Combobox over the team's contact tags, where a name that
 * is not in the list is created and joins it. The catalog is shared, so a tag
 * made on one contact is offered on the next.
 */
function ContactTags({
  tags,
  catalog,
  onChange,
}: {
  tags: string[]
  catalog: ComboboxItemData[]
  onChange: (tags: string[]) => void
}) {
  // A stable array: Combobox matches chosen rows by identity.
  const chosen = useMemo(
    () => catalog.filter((t) => tags.includes(String(t.value))),
    [catalog, tags],
  )
  return (
    <Combobox
      multiple
      aria-labelledby="contact-tags"
      items={catalog}
      value={chosen}
      onValueChange={(value: ComboboxValue) =>
        onChange(Array.isArray(value) ? value.map((v) => String(v.value)) : [])
      }
      onCreate={createContactTag}
      placeholder="Add tags…"
    />
  )
}
