import type { ReactNode } from 'react'

import { Avatar } from '../../../src/components/Avatar'
import { cn } from '../../../src/lib/cn'
import { personFor } from '../data/people'

/**
 * `_Timeline Task Bar` (`40006261:1651`): a 28px bar on its hue, a 20px face
 * 4 in from the left, then the name in small semibold, truncated by the bar's
 * end. The Roadmap draws a project with it and Workload a task; the caller
 * places it and gives it its hue. A project's Timeline draws the same bar
 * inline with its own label rules.
 */
export function TimelineBar({
  personId,
  tone,
  children,
  className,
}: {
  personId?: string
  /** The hue's background and foreground classes. */
  tone: string
  children: ReactNode
  className?: string
}) {
  const person = personId ? personFor(personId) : undefined
  return (
    <span
      className={cn(
        'flex h-7 min-w-0 items-center gap-1.5 rounded-md pr-2 pl-1',
        person ? '' : 'pl-2',
        tone,
        className,
      )}
    >
      {person ? <Avatar name={person.name} src={person.avatar} alt="" size="x-small" /> : null}
      <span className="truncate text-sm font-semibold">{children}</span>
    </span>
  )
}
