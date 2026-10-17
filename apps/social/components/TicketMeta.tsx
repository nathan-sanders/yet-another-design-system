import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  Frown,
  Meh,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Smile,
  Ticket as TicketIcon,
  type LucideIcon,
} from 'lucide-react'

import { Token } from '../../../src/components/Token'
import { cn } from '../../../src/lib/cn'
import { personFor } from '../data/people'
import type { Ticket, TicketPriority, TicketSentiment, TicketStatus } from '../data/types'

const STATUS: Record<TicketStatus, { label: string; icon: LucideIcon }> = {
  new: { label: 'New', icon: CircleDashed },
  open: { label: 'Open', icon: CircleDot },
  closed: { label: 'Closed', icon: CircleCheck },
}

const PRIORITY: Record<TicketPriority, { label: string; icon: LucideIcon }> = {
  low: { label: 'Low', icon: SignalLow },
  medium: { label: 'Medium', icon: SignalMedium },
  high: { label: 'High', icon: SignalHigh },
}

const SENTIMENT: Record<TicketSentiment, { label: string; icon: LucideIcon }> = {
  positive: { label: 'Positive', icon: Smile },
  neutral: { label: 'Neutral', icon: Meh },
  negative: { label: 'Negative', icon: Frown },
}

/** A word only a screen reader hears, so "Low" is read as "Priority: Low". */
function Spoken({ children }: { children: string }) {
  return <span className="sr-only">{children} </span>
}

/**
 * `_Ticket Meta` (`40005827:15465`): ticket number, status, assignee, priority
 * and sentiment as a row of view-only `Token`s, 4px apart. The file's
 * `Show Assignee` is `showAssignee` — the list hides it for unassigned tickets,
 * which is every one but the ticket that is yours.
 */
export function TicketMeta({
  ticket,
  showAssignee = true,
  className,
}: {
  ticket: Ticket
  showAssignee?: boolean
  className?: string
}) {
  const status = STATUS[ticket.status]
  const priority = PRIORITY[ticket.priority]
  const sentiment = SENTIMENT[ticket.sentiment]
  const assignee = ticket.assigneeId ? personFor(ticket.assigneeId) : undefined

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      <Token startIcon={TicketIcon}>
        <Spoken>Ticket</Spoken>#{ticket.number}
      </Token>
      <Token startIcon={status.icon}>
        <Spoken>Status:</Spoken>
        {status.label}
      </Token>
      {showAssignee && assignee ? (
        <Token avatar={<Token.Avatar name={assignee.name} src={assignee.avatar} />}>
          <Spoken>Assigned to</Spoken>
          {assignee.name}
        </Token>
      ) : null}
      <Token startIcon={priority.icon}>
        <Spoken>Priority:</Spoken>
        {priority.label}
      </Token>
      <Token startIcon={sentiment.icon}>
        <Spoken>Sentiment:</Spoken>
        {sentiment.label}
      </Token>
    </div>
  )
}
