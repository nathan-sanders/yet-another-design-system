import { Avatar } from '../../../src/components/Avatar'
import { Button } from '../../../src/components/Button'
import { Text } from '../../../src/components/Text'
import { cn } from '../../../src/lib/cn'
import { personFor } from '../data/people'
import type { Ticket, TicketEdit } from '../data/types'

const completedAt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** "Feb 15, 2023, 10:14 am", as the file writes it: a lowercase am/pm. */
function formatCompleted(iso: string): string {
  return completedAt
    .format(new Date(iso))
    .replace(/\s?([AP]M)$/, (_, half: string) => ` ${half.toLowerCase()}`)
}

/**
 * What takes the reply box's place on a ticket nobody should answer — Figma's
 * `Reply / . / Inputs Box`, `Type=Case Closed` (in `40006078:63232`): a 48px
 * row on the canvas color, 8px corners, 12 either side. A completed ticket says
 * who completed it and when, with Reopen; one the system flagged as spam says
 * so, with Not spam. Either button puts the reply box back.
 *
 * The file's 13px Body and Headline text are the 14px body here, as every
 * other inbox line is.
 */
export function StatusBar({
  ticket,
  onTicketChange,
  className,
}: {
  ticket: Ticket
  onTicketChange: (edit: TicketEdit) => void
  className?: string
}) {
  const box = cn(
    'flex min-h-12 w-full items-center justify-between gap-2 rounded-md bg-surface-background-subtle px-3 py-2',
    className,
  )

  if (ticket.spam) {
    return (
      <div className={box}>
        <Text className="min-w-0">Marked as spam automatically. Replies are off.</Text>
        <Button
          appearance="secondary"
          className="shrink-0"
          onClick={() => onTicketChange({ spam: false })}
        >
          Not spam
        </Button>
      </div>
    )
  }

  // A fixture from before this session may have no `completedBy`; the owner
  // is who completed it then.
  const byId = ticket.completedBy ?? ticket.assigneeId
  const by = byId ? personFor(byId) : undefined
  return (
    <div className={box}>
      <Text className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span>Completed by</span>
        {by ? (
          <span className="flex items-center gap-2">
            <Avatar name={by.name} src={by.avatar} alt="" size="small" />
            <Text render={<span />} weight="bold" color="emphasized">
              {by.name}
            </Text>
          </span>
        ) : null}
        {ticket.completedAt ? <span>on {formatCompleted(ticket.completedAt)}</span> : null}
      </Text>
      <Button
        appearance="secondary"
        className="shrink-0"
        onClick={() =>
          onTicketChange({ status: 'new', completedBy: undefined, completedAt: undefined })
        }
      >
        Reopen
      </Button>
    </div>
  )
}
