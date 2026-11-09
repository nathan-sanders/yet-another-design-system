import { useId } from 'react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '../../../src/components/Button'
import { Icon } from '../../../src/components/Icon'
import { Text } from '../../../src/components/Text'

/**
 * `_Home Task Row` (`40005973:79247`), Yet Social's, which the file reuses for
 * Home's "Needs you": the icon in a 32px subtle tile, what needs doing over
 * why and by when, and the one action that does it. The list draws the rule
 * between rows.
 *
 * The action's visible label is one word ("Review"), ambiguous in a list of
 * four, so the row's title describes it.
 */
export function HomeTaskRow({
  icon,
  title,
  meta,
  action,
  onAction,
}: {
  icon: LucideIcon
  title: string
  meta: string
  action: string
  onAction: () => void
}) {
  const titleId = useId()
  return (
    <li className="flex min-w-0 items-center gap-3 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-background-subtle text-content-primary">
        <Icon icon={icon} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Text id={titleId} weight="semibold" truncate>
          {title}
        </Text>
        <Text size="sm" color="subtle" truncate>
          {meta}
        </Text>
      </div>
      <Button appearance="secondary" size="small" aria-describedby={titleId} onClick={onAction}>
        {action}
      </Button>
    </li>
  )
}
