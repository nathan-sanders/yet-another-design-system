import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Divider } from '../../../../src/components/Divider'
import { Select } from '../../../../src/components/Select'
import { cn } from '../../../../src/lib/cn'
import { InboxMessageAvatar, InboxMessageCard } from '../../components/InboxMessageCard'
import type { Ticket } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import type { SortKey } from './model'

/**
 * The list column (`Message List`, `40005911:33632`): a toolbar — sort, sort
 * direction, Bulk edit — over the messages, each a card with a `Divider` under
 * it. 380 wide.
 *
 * It folds to a 72px rail of faces and ages (`Message List (Collapsed)`,
 * `40005911:33946`) when the page is narrower than 860px — a 380 list beside
 * a conversation of at least 480 — by the room there is, not by whether a
 * panel is open. The file draws the fold beside an
 * open panel because at 1440 that leaves an 800 page; on a wider window, or
 * with the panel dragged narrower, the previews stay. Both forms are rendered
 * and a container query on the page picks one, so the switch follows a panel
 * drag live with no measuring in script. Never on a phone, where the list is a
 * screen of its own.
 */
export function MessageList({
  tickets,
  openNumber,
  sort,
  descending,
  onSortChange,
  onDirectionChange,
  onOpen,
  className,
}: {
  tickets: Ticket[]
  openNumber?: string
  sort: SortKey
  descending: boolean
  onSortChange: (sort: SortKey) => void
  onDirectionChange: (descending: boolean) => void
  onOpen: (ticket: Ticket) => void
  className?: string
}) {
  const shell = useShell()

  return (
    <>
      <nav
        aria-label="Messages"
        className={cn(
          'hidden w-18 shrink-0 flex-col overflow-y-auto border-r border-surface-border',
          'md:@max-[860px]/page:flex',
          className,
        )}
      >
        <ul className="flex flex-col gap-1 p-1">
          {tickets.map((ticket) => (
            <li key={ticket.number}>
              <InboxMessageAvatar
                ticket={ticket}
                selected={ticket.number === openNumber}
                onOpen={onOpen}
              />
            </li>
          ))}
        </ul>
      </nav>
      <nav
        aria-label="Messages"
        className={cn(
          'flex w-95 shrink-0 flex-col border-r border-surface-border max-md:w-full max-md:border-r-0',
          'md:@max-[860px]/page:hidden',
          className,
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-3 py-2">
          <Select
            size="small"
            hug
            aria-label="Sort messages"
            value={sort}
            onValueChange={(value) => onSortChange(value as SortKey)}
            items={[
              { value: 'received', label: 'Last received' },
              { value: 'priority', label: 'Priority' },
            ]}
          >
            <Select.Item value="received">Last received</Select.Item>
            <Select.Item value="priority">Priority</Select.Item>
          </Select>
          <Button
            appearance="ghost"
            startIcon={descending ? ArrowDownWideNarrow : ArrowUpNarrowWide}
            aria-label="Reverse the order"
            aria-pressed={!descending}
            onClick={() => onDirectionChange(!descending)}
          />
          <div className="flex-1" />
          <Button appearance="ghost" size="small" onClick={() => shell.notBuilt('Bulk edit')}>
            Bulk edit
          </Button>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2">
          {tickets.map((ticket, index) => (
            <li key={ticket.number} className="flex flex-col gap-1">
              <InboxMessageCard
                ticket={ticket}
                selected={ticket.number === openNumber}
                onOpen={onOpen}
              />
              {index < tickets.length - 1 ? <Divider /> : null}
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
