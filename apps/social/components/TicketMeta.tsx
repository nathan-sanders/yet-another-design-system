import type { ReactElement, ReactNode } from 'react'
import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleHelp,
  CirclePause,
  Frown,
  Meh,
  Smile,
  Ticket as TicketIcon,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
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
  /** The glyph's color — a text utility on a theme-aware token. */
  tone: string
}

// Colors after Nathan's status and sentiment filter menus: pink open, green in
// progress, yellow on hold, gray complete; blue positive, gray neutral, red
// negative, and unclassified in the text color. Each is a Decorative
// `highlight`, the mid-tone of its hue, which has its own dark value; the
// grays are `content-subtle`. Written out whole so Tailwind can see them.
const STATUS: Option<TicketStatus>[] = [
  { value: 'new', label: 'New', icon: CircleDashed, tone: 'text-decorative-pink-highlight' },
  {
    value: 'in-progress',
    label: 'In progress',
    icon: CircleDot,
    tone: 'text-decorative-green-highlight',
  },
  {
    value: 'on-hold',
    label: 'On hold',
    icon: CirclePause,
    tone: 'text-decorative-yellow-highlight',
  },
  { value: 'complete', label: 'Complete', icon: CircleCheck, tone: 'text-content-subtle' },
]

const SENTIMENT: Option<TicketSentiment>[] = [
  { value: 'positive', label: 'Positive', icon: Smile, tone: 'text-decorative-blue-highlight' },
  { value: 'neutral', label: 'Neutral', icon: Meh, tone: 'text-content-subtle' },
  { value: 'negative', label: 'Negative', icon: Frown, tone: 'text-decorative-red-highlight' },
  { value: 'undefined', label: 'Undefined', icon: CircleHelp, tone: 'text-content-primary' },
]

/**
 * A status or sentiment glyph in its color. In a Token it goes in the leading
 * `avatar` slot rather than `startIcon`, which draws in the label's color and
 * takes no class. FINDINGS 32.
 */
function Glyph({ option, size }: { option: Option<string>; size: 'small' | 'base' }) {
  return <Icon icon={option.icon} size={size} className={option.tone} />
}

interface PriorityOption {
  value: TicketPriority
  label: string
  level: number
  tone: string
}

/**
 * The priority scale, 0 to 4. Each level is a number in a tinted box rather
 * than a glyph — after the `Token - Priority` set Nathan dropped on the page
 * (`40005917:33421`…`33425`), which draws a 16 × 14 box at a 4px radius on a
 * Decorative hue. The classes are written out whole so Tailwind can see them.
 */
const PRIORITY: PriorityOption[] = [
  {
    value: 'none',
    label: 'No priority',
    level: 0,
    tone: 'bg-decorative-neutral-background text-decorative-neutral-foreground',
  },
  {
    value: 'low',
    label: 'Low',
    level: 1,
    tone: 'bg-decorative-green-background text-decorative-green-foreground',
  },
  {
    value: 'medium',
    label: 'Medium',
    level: 2,
    tone: 'bg-decorative-yellow-background text-decorative-yellow-foreground',
  },
  {
    value: 'high',
    label: 'High',
    level: 3,
    tone: 'bg-decorative-orange-background text-decorative-orange-foreground',
  },
  {
    value: 'critical',
    label: 'Critical',
    level: 4,
    tone: 'bg-decorative-red-background text-decorative-red-foreground',
  },
]

const UNASSIGNED = 'unassigned'

function find<T extends { value: string }>(options: T[], value: string): T {
  return options.find((o) => o.value === value)!
}

/**
 * The priority's number in its tinted box. Decoration: the label beside it
 * already says the priority, so it is hidden from assistive tech.
 */
function PriorityMark({ priority }: { priority: TicketPriority }) {
  const option = find(PRIORITY, priority)
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-3.5 w-4 shrink-0 items-center justify-center rounded-xs',
        'text-sm leading-none font-semibold tabular-nums',
        option.tone,
      )}
    >
      {option.level}
    </span>
  )
}

/** A word only a screen reader hears, so "Low" is read as "Priority: Low". */
function Spoken({ children }: { children: string }) {
  return <span className="sr-only">{children} </span>
}

/**
 * A menu of the values one ticket field can take, opened by whatever
 * `trigger` is — a meta token, or the toolbar's Assign button.
 */
function PickerMenu({
  label,
  value,
  onValueChange,
  trigger,
  children,
}: {
  /** What the menu sets — "Status" — for the popup's name. */
  label: string
  value: string
  onValueChange: (value: string) => void
  /** The element that opens it. Base UI merges the trigger's props onto it. */
  trigger: ReactElement
  /** The `Choice`s. */
  children: ReactNode
}) {
  return (
    <Menu>
      <Menu.Trigger render={trigger} />
      <Menu.Popup aria-label={label}>
        {/* Menu.Group carries Figma's 8px around the rows; the popup has none
            of its own. The library's radio story nests it the same way. */}
        <Menu.Group>
          <Menu.RadioGroup value={value} onValueChange={(next) => onValueChange(next as string)}>
            {children}
          </Menu.RadioGroup>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}

/**
 * A meta token as a menu trigger: a real `<button>` wearing a view-only Token.
 * Rendering the trigger *onto* a Token does not work — Token takes `onClick`
 * for an invisible `<button>` of its own, so Enter did nothing and the token
 * had two tab stops. FINDINGS 24.
 */
function TokenTrigger({
  startIcon,
  avatar,
  children,
  ...props
}: {
  startIcon?: LucideIcon
  avatar?: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={cn('flex cursor-pointer rounded-md', focusRing)}
      // Base UI's trigger props (handlers, ARIA, ref) arrive here via `render`.
      {...props}
    >
      {/* `interactive` for Token's hover shadow; the button does the rest. */}
      <Token interactive startIcon={startIcon} avatar={avatar}>
        {children}
      </Token>
    </button>
  )
}

/**
 * A radio row with the option's icon, face or mark beside its label.
 * `closeOnClick`, because Base UI keeps a menu open after a radio pick by
 * default — right for a view-settings menu, wrong for a picker of one value.
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

/**
 * Who a ticket is assigned to, as a menu: Unassigned, then the teammates. The
 * toolbar's Assign button opens it, and so does the assignee token once there
 * is one.
 */
export function AssigneeMenu({
  ticket,
  onChange,
  trigger,
}: {
  ticket: Ticket
  onChange: (edit: TicketEdit) => void
  trigger: ReactElement
}) {
  return (
    <PickerMenu
      label="Assign to"
      value={ticket.assigneeId ?? UNASSIGNED}
      onValueChange={(value) => onChange({ assigneeId: value === UNASSIGNED ? undefined : value })}
      trigger={trigger}
    >
      <Choice value={UNASSIGNED} start={<Icon icon={UserRound} size="base" />}>
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
    </PickerMenu>
  )
}

/**
 * `_Ticket Meta` (`40005827:15465`): ticket number, status, assignee, priority
 * and sentiment as a row of `Token`s, 4px apart. The assignee shows only when
 * there is one — an unassigned ticket is assigned from the toolbar's Assign
 * button, not from a token reading "Unassigned".
 *
 * View-only by default — in the message list the whole card is the hit
 * target, and a token inside it would be a click target inside a click target.
 * There every token but the ticket number shows only its glyph (`labelHidden`,
 * a square pill), with the label still read out — the number has no glyph that
 * could stand in for it.
 * Pass `onChange` and every token but the ticket number opens a menu of its
 * values: that is the conversation's toolbar and the thread's marked comment.
 */
export function TicketMeta({
  ticket,
  onChange,
  className,
}: {
  ticket: Ticket
  onChange?: (edit: TicketEdit) => void
  className?: string
}) {
  const status = find(STATUS, ticket.status)
  const priority = find(PRIORITY, ticket.priority)
  const sentiment = find(SENTIMENT, ticket.sentiment)
  const assignee = ticket.assigneeId ? personFor(ticket.assigneeId) : undefined

  const statusLabel = (
    <>
      <Spoken>Status:</Spoken>
      {status.label}
    </>
  )
  const assigneeAvatar = assignee ? (
    <Token.Avatar name={assignee.name} src={assignee.avatar} alt="" />
  ) : null
  const assigneeLabel = assignee ? (
    <>
      <Spoken>Assigned to</Spoken>
      {assignee.name}
    </>
  ) : null
  const priorityMark = <PriorityMark priority={priority.value} />
  const priorityLabel = (
    <>
      <Spoken>Priority:</Spoken>
      {priority.label}
    </>
  )
  const sentimentLabel = (
    <>
      <Spoken>Sentiment:</Spoken>
      {sentiment.label}
    </>
  )

  // The ticket number is an identifier you read, never a value you change, so
  // it is a Badge rather than a Token. Badge is a 20px pill; `min-h-6` brings
  // it to the tokens. 24 so the row keeps one height. FINDINGS 61.
  const number = (
    <Badge startIcon={TicketIcon} className="min-h-6">
      <Spoken>Ticket</Spoken>#{ticket.number}
    </Badge>
  )

  if (!onChange) {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {number}
        <Token labelHidden avatar={<Glyph option={status} size="small" />}>
          {statusLabel}
        </Token>
        {assignee ? (
          <Token labelHidden avatar={assigneeAvatar}>
            {assigneeLabel}
          </Token>
        ) : null}
        <Token labelHidden avatar={priorityMark}>
          {priorityLabel}
        </Token>
        <Token labelHidden avatar={<Glyph option={sentiment} size="small" />}>
          {sentimentLabel}
        </Token>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {number}
      <PickerMenu
        label="Status"
        value={status.value}
        onValueChange={(value) => onChange({ status: value as TicketStatus })}
        trigger={
          <TokenTrigger avatar={<Glyph option={status} size="small" />}>{statusLabel}</TokenTrigger>
        }
      >
        {STATUS.map((o) => (
          <Choice key={o.value} value={o.value} start={<Glyph option={o} size="base" />}>
            {o.label}
          </Choice>
        ))}
      </PickerMenu>
      {assignee ? (
        <AssigneeMenu
          ticket={ticket}
          onChange={onChange}
          trigger={<TokenTrigger avatar={assigneeAvatar}>{assigneeLabel}</TokenTrigger>}
        />
      ) : null}
      <PickerMenu
        label="Priority"
        value={priority.value}
        onValueChange={(value) => onChange({ priority: value as TicketPriority })}
        trigger={<TokenTrigger avatar={priorityMark}>{priorityLabel}</TokenTrigger>}
      >
        {PRIORITY.map((o) => (
          <Choice key={o.value} value={o.value} start={<PriorityMark priority={o.value} />}>
            {o.label}
          </Choice>
        ))}
      </PickerMenu>
      <PickerMenu
        label="Sentiment"
        value={sentiment.value}
        onValueChange={(value) => onChange({ sentiment: value as TicketSentiment })}
        trigger={
          <TokenTrigger avatar={<Glyph option={sentiment} size="small" />}>
            {sentimentLabel}
          </TokenTrigger>
        }
      >
        {SENTIMENT.map((o) => (
          <Choice key={o.value} value={o.value} start={<Glyph option={o} size="base" />}>
            {o.label}
          </Choice>
        ))}
      </PickerMenu>
    </div>
  )
}
