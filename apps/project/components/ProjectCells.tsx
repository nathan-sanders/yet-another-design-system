import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
import { ProgressBar } from '../../../src/components/ProgressBar'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import { personFor } from '../data/people'
import type { Project } from '../data/types'
import { HEALTH, PROJECT_DOT } from './taskMeta'

/** A project's 16px dot, decoration beside its name. */
export function ProjectDot({ project, className }: { project: Project; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-4 shrink-0 rounded-full inset-ring',
        PROJECT_DOT[project.color],
        className,
      )}
    />
  )
}

/**
 * A project's name with its dot: `_Campaign Name Cell` (`40006171:40646`),
 * borrowed from Yet Social by the file. With `href` the name is the row's
 * link, in the cell's own text color, as Yet Social's campaign cell is.
 */
export function ProjectNameCell({ project, href }: { project: Project; href?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ProjectDot project={project} />
      {href ? (
        <a href={href} className={cn('truncate rounded-xs hover:underline', focusRing)}>
          {project.name}
        </a>
      ) : (
        <span className="truncate">{project.name}</span>
      )}
    </span>
  )
}

/** A person's face and name: `_Measure Owner Cell` (`40005882:26335`), from Yet Social. */
export function OwnerCell({ id }: { id: string }) {
  const person = personFor(id)
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={person.name} src={person.avatar} alt="" size="x-small" />
      <span className="truncate">{person.name}</span>
    </span>
  )
}

export function HealthBadge({ project }: { project: Project }) {
  const health = HEALTH[project.health]
  return <Badge color={health.color}>{health.label}</Badge>
}

/**
 * The bar and its percent, 8 apart, the bar taking whatever the percent
 * leaves (133 beside "46%" in a 166 cell). The percent is drawn beside the
 * bar in the file, so it is real text and the bar's own name is `labelHidden`.
 */
export function ProjectProgress({ project, className }: { project: Project; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <ProgressBar
        value={project.progress}
        label={`${project.name} progress`}
        labelHidden
        className="min-w-0 flex-1"
      />
      <span aria-hidden className="shrink-0 text-sm text-content-subtle">
        {project.progress}%
      </span>
    </span>
  )
}
