import type { ReactNode } from 'react'
import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleHelp,
  CirclePause,
  Frown,
  Meh,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Smile,
  Ticket as TicketIcon,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Icon } from '../../../src/components/Icon'
import { Menu } from '../../../src/components/Menu'
import { Token } from '../../../src/components/Token'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { people, personFor } from '../data/people'
import type {
  Ticket,
  TicketEdit,
  TicketPriority,
  TicketSentiment,
  TicketStatus,
} from '../data/types'

interface Option<T extends string> {
  value: T
  label: string
  icon: LucideIcon
}

const STATUS: Option<TicketStatus>[] = [
  { value: 'new', label: 'New', icon: CircleDashed },
  { value: 'in-progress', label: 'In progress', icon: CircleDot },
  { value: 'on-hold', label: 'On hold', icon: CirclePause },
  { value: 'complete', label: 'Complete', icon: CircleCheck },
]

const PRIORITY: Option<TicketPriority>[] = [
  { value: 'low', label: 'Low', icon: SignalLow },
  { value: 'medium', label: 'Medium', icon: SignalMedium },
  { value: 'high', label: 'High', icon: SignalHigh },
  { value: 'critical', label: 'Critical', icon: Signal },
]

const SENTIMENT: Option<TicketSentiment>[] = [
  { value: 'positive', label: 'Positive', icon: Smile },
  { value: 'neutral', label: 'Neutral', icon: Meh },
  { value: 'negative', label: 'Negative', icon: Frown },
  { value: 'undefined', label: 'Undefined', icon: CircleHelp },
]

const UNASSIGNED = 'unassigned'

function find<T extends string>(options: Option<T>[], value: T): Option<T> {
  return options.find((o) => o.value === value)!
}

/** A word only a screen reader hears, so "Low" is read as "Priority: Low". */
function Spoken({ children }: { children: string }) {
  return <span className="sr-only">{children} </span>
}

/**
 * One meta token that opens a menu of the values it can take.
 *
 * The trigger is a real `<button>` wearing a view-only Token, not the Token
 * itself. Rendering the trigger *onto* a Token does not work: Token takes
 * `onClick` for an invisible `<button>` of its own, so Base UI's handler lands
 * on that inner button — a click opens the menu, Enter does nothing, and the
 * token gets two tab stops and no ring. FINDINGS, slice 3.
 */
function MenuToken({
  label,
  value,
  onValueChange,
  token,
  children,
}: {
  /** What the menu sets — "Status" — for the popup's name. */
  label: string
  value: string
  onValueChange: (value: string) => void
  /** The Token's own props: what it shows at rest. */
  token: { startIcon?: LucideIcon; avatar?: ReactNode; children: ReactNode }
  /** The `Menu.RadioItem`s. */
  children: ReactNode
}) {
  return (
    <Menu>
      <Menu.Trigger className={cn('flex cursor-pointer rounded-md', focusRing)}>
        {/* `interactive` for Token's hover shadow; the button does the rest. */}
        <Token interactive startIcon={token.startIcon} avatar={token.avatar}>
          {token.children}
        </Token>
      </Menu.Trigger>
      <Menu.Popup aria-label={label}>
        <Menu.RadioGroup value={value} onValueChange={(next) => onValueChange(next as string)}>
          {children}
        </Menu.RadioGroup>
      </Menu.Popup>
    </Menu>
  )
}

/**
 * A radio row with the option's icon or face beside its label. `closeOnClick`,
 * because Base UI keeps a menu open after a radio pick by default — right for
 * a view-settings menu toggled several times, wrong for a picker of one value.
 */
function Choice({ value, start, children }: { value: string; start: ReactNode; children: string }) {
  return (
    <Menu.RadioItem value={value} closeOnClick>
      <span className="flex items-center gap-2">
        {start}
        {children}
      </span>
    </Menu.RadioItem>
  )
}

function OptionIcon({ icon }: { icon: LucideIcon }) {
  return <Icon icon={icon} size="base" />
}

/**
 * `_Ticket Meta` (`40005827:15465`): ticket number, status, assignee, priority
 * and sentiment as a row of `Token`s, 4px apart.
 *
 * View-only by default — in the message list the whole card is the hit
 * target, and a token inside it would be a click target inside a click target.
 * Pass `onChange` and every token but the ticket number opens a menu of its
 * values: that is the conversation's toolbar and the thread's marked comment.
 *
 * The file's `Show Assignee` is `showAssignee`. The list hides the assignee on
 * an unassigned ticket; an editable row always shows it, as "Unassigned", so
 * there is something to click to assign one.
 */
export function TicketMeta({
  ticket,
  showAssignee = true,
  onChange,
  className,
}: {
  ticket: Ticket
  showAssignee?: boolean
  onChange?: (edit: TicketEdit) => void
  className?: string
}) {
  const status = find(STATUS, ticket.status)
  const priority = find(PRIORITY, ticket.priority)
  const sentiment = find(SENTIMENT, ticket.sentiment)
  const assignee = ticket.assigneeId ? personFor(ticket.assigneeId) : undefined

  const number = (
    <Token startIcon={TicketIcon}>
      <Spoken>Ticket</Spoken>#{ticket.number}
    </Token>
  )

  if (!onChange) {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {number}
        <Token startIcon={status.icon}>
          <Spoken>Status:</Spoken>
          {status.label}
        </Token>
        {showAssignee && assignee ? (
          <Token avatar={<Token.Avatar name={assignee.name} src={assignee.avatar} alt="" />}>
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

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {number}
      <MenuToken
        label="Status"
        value={status.value}
        onValueChange={(value) => onChange({ status: value as TicketStatus })}
        token={{
          startIcon: status.icon,
          children: (
            <>
              <Spoken>Status:</Spoken>
              {status.label}
            </>
          ),
        }}
      >
        {STATUS.map((o) => (
          <Choice key={o.value} value={o.value} start={<OptionIcon icon={o.icon} />}>
            {o.label}
          </Choice>
        ))}
      </MenuToken>
      <MenuToken
        label="Assignee"
        value={assignee?.id ?? UNASSIGNED}
        onValueChange={(value) =>
          onChange({ assigneeId: value === UNASSIGNED ? undefined : value })
        }
        token={
          assignee
            ? {
                avatar: <Token.Avatar name={assignee.name} src={assignee.avatar} alt="" />,
                children: (
                  <>
                    <Spoken>Assigned to</Spoken>
                    {assignee.name}
                  </>
                ),
              }
            : {
                startIcon: UserRound,
                children: (
                  <>
                    <Spoken>Assignee:</Spoken>
                    Unassigned
                  </>
                ),
              }
        }
      >
        <Choice value={UNASSIGNED} start={<OptionIcon icon={UserRound} />}>
          Unassigned
        </Choice>
        {people.map((person) => (
          <Choice
            key={person.id}
            value={person.id}
            start={<Avatar name={person.name} src={person.avatar} alt="" size="x-small" />}
          >
            {person.name}
          </Choice>
        ))}
      </MenuToken>
      <MenuToken
        label="Priority"
        value={priority.value}
        onValueChange={(value) => onChange({ priority: value as TicketPriority })}
        token={{
          startIcon: priority.icon,
          children: (
            <>
              <Spoken>Priority:</Spoken>
              {priority.label}
            </>
          ),
        }}
      >
        {PRIORITY.map((o) => (
          <Choice key={o.value} value={o.value} start={<OptionIcon icon={o.icon} />}>
            {o.label}
          </Choice>
        ))}
      </MenuToken>
      <MenuToken
        label="Sentiment"
        value={sentiment.value}
        onValueChange={(value) => onChange({ sentiment: value as TicketSentiment })}
        token={{
          startIcon: sentiment.icon,
          children: (
            <>
              <Spoken>Sentiment:</Spoken>
              {sentiment.label}
            </>
          ),
        }}
      >
        {SENTIMENT.map((o) => (
          <Choice key={o.value} value={o.value} start={<OptionIcon icon={o.icon} />}>
            {o.label}
          </Choice>
        ))}
      </MenuToken>
    </div>
  )
}
