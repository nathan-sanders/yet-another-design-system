import { useId } from 'react'
import { Calendar, FolderKanban } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { ClickableCard } from '../../../../src/components/Card'
import { Icon } from '../../../../src/components/Icon'
import { Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { statusFor } from '../../components/taskMeta'
import { LATER_TIMES } from '../../data/inbox'
import { personFor } from '../../data/people'
import { projectFor } from '../../data/projects'
import type { Task } from '../../data/types'
import { YakMark } from '../../yak/YakMark'
import type { Message } from './inboxState'
import { dueText, KIND_ICON, senderName, timeLabel } from './model'

/** The sender's face, or Yak's mark in a 24px subtle tile. */
export function Sender({ from }: { from: string }) {
  if (from === 'yak') {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-surface-background-subtle text-content-emphasized">
        <YakMark className="size-3.5" />
      </span>
    )
  }
  const person = personFor(from)
  return <Avatar name={person.name} src={person.avatar} alt="" size="small" />
}

/**
 * One message: `_Project Message Content` (`40006278:12738`) in a Ghost
 * `Clickable Card`. The pink dot for new, the sender and the kind's glyph,
 * the time; the summary over what they asked; then what it is about as View
 * Only tokens — the task with its status glyph, or the project, and the due
 * date where it matters. Put off, the time says when it comes back.
 *
 * The card is a link to the message (`?item=`), so its words are spans, and
 * its name is the sender and the summary; the rest describes it.
 */
export function MessageCard({
  message,
  task,
  href,
  selected,
}: {
  message: Message
  task?: Task
  href: string
  selected: boolean
}) {
  const id = useId()
  const project = projectFor(message.projectId)
  const later =
    message.place.where === 'later'
      ? LATER_TIMES.find((t) => t.id === (message.place as { back: string }).back)
      : undefined
  return (
    <ClickableCard
      emphasis="ghost"
      href={href}
      selected={selected}
      aria-labelledby={`${id}-name ${id}-summary`}
      aria-describedby={`${id}-body ${id}-meta ${id}-time`}
      className="w-full"
    >
      <span className="relative flex w-full min-w-0 flex-col gap-2 pl-3 text-left">
        {message.unread ? (
          <span
            role="img"
            aria-label="New"
            className="absolute top-2 -left-1 size-2 rounded-full bg-decorative-pink-highlight"
          />
        ) : null}
        <span className="flex h-6 min-w-0 items-center gap-2">
          <Sender from={message.from} />
          <Icon icon={KIND_ICON[message.kind]} className="shrink-0 text-content-primary" />
          <Text
            id={`${id}-name`}
            render={<span />}
            weight="semibold"
            color="emphasized"
            truncate
            className="min-w-0 flex-1"
          >
            {senderName(message.from)}
          </Text>
          <Text id={`${id}-time`} render={<span />} size="sm" color="subtle" className="shrink-0">
            {later ? `Back ${later.back}` : timeLabel(message)}
          </Text>
        </span>
        <Text id={`${id}-summary`} render={<span />} size="sm" weight="semibold" color="subtle">
          {message.summary}
        </Text>
        <Text id={`${id}-body`} render={<span />} truncate>
          {message.body}
        </Text>
        <span id={`${id}-meta`} className="flex min-w-0 flex-wrap items-center gap-1">
          {task && message.kind !== 'approval' && message.kind !== 'assigned' ? (
            <Token startIcon={statusFor(task.status).icon}>{task.title}</Token>
          ) : project ? (
            <Token startIcon={FolderKanban}>{project.name}</Token>
          ) : null}
          {task && message.showDue ? <Token startIcon={Calendar}>{dueText(task)}</Token> : null}
        </span>
      </span>
    </ClickableCard>
  )
}
