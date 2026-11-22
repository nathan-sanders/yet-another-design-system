import { useId } from 'react'

import { Avatar } from '../../../../src/components/Avatar'
import { ClickableCard } from '../../../../src/components/Card'
import { Text } from '../../../../src/components/Text'
import { personFor } from '../../data/people'
import type { IntakeRequest } from '../../data/requests'
import { subtitle, timeLabel } from './model'

/**
 * One request in the queue: `_Request Row Content` (`40006380:55450`) in a
 * Ghost `Clickable Card`. A 36px face, the title (base semibold) over who
 * sent it and what kind of request it is (sm subtle), and the time. The card
 * is a link to the request (`?item=`), so its words are spans; its name is
 * the title and the rest describes it.
 */
export function RequestCard({
  request,
  href,
  selected,
}: {
  request: IntakeRequest
  href: string
  selected: boolean
}) {
  const id = useId()
  const from = personFor(request.fromId)
  return (
    <ClickableCard
      emphasis="ghost"
      href={href}
      selected={selected}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-sub ${id}-time`}
      className="w-full"
    >
      <span className="flex w-full min-w-0 items-center gap-3 text-left">
        <Avatar name={from.name} src={from.avatar} alt="" />
        <span className="flex min-w-0 flex-1 flex-col">
          <Text id={`${id}-title`} render={<span />} weight="semibold" color="emphasized" truncate>
            {request.title}
          </Text>
          <Text id={`${id}-sub`} render={<span />} size="sm" color="subtle" truncate>
            {subtitle(request)}
          </Text>
        </span>
        <Text id={`${id}-time`} render={<span />} size="sm" color="subtle" className="shrink-0">
          {timeLabel(request)}
        </Text>
      </span>
    </ClickableCard>
  )
}
