import { Flag, Target } from 'lucide-react'

import { Avatar } from '../../../../../src/components/Avatar'
import { Badge } from '../../../../../src/components/Badge'
import { ClickableCard } from '../../../../../src/components/Card'
import { Icon } from '../../../../../src/components/Icon'
import { ProgressBar } from '../../../../../src/components/ProgressBar'
import { Text } from '../../../../../src/components/Text'
import { cn } from '../../../../../src/lib/cn'
import { focusRing } from '../../../../../src/lib/focus'
import { HealthBadge, ProjectNameCell } from '../../../components/ProjectCells'
import type { Goal } from '../../../data/goals'
import { personFor } from '../../../data/people'
import type { Project } from '../../../data/types'
import { projectPath } from '../../project/paths'
import { usePlan } from '../planState'
import { GOAL_HEALTH } from './health'
import { childrenOf, healthOf, progressOf } from './model'

/** The connectors' ink: Decorative Neutral Highlight, 1px, as drawn. */
const LINE = 'border-decorative-neutral-highlight'

/**
 * Goals › Map (`Plan - Goals / Map`, `40006298:26717`): three columns — the
 * company goals, their subgoals, and the project each subgoal reads — joined
 * by 1px elbows. A goal is a `Clickable Card` holding `_Goal Card Content`
 * (`40006298:26667`) and opens its panel; a project is a bordered row that
 * links to it. Each goal sits centered against its subgoals, so its stub
 * meets the vertical at its middle.
 */
export function GoalsMap({
  goals,
  openId,
  onOpen,
}: {
  goals: Goal[]
  openId?: string
  onOpen: (id: string) => void
}) {
  const plan = usePlan()
  const companyGoals = goals.filter((g) => !g.parentId)
  return (
    <div
      role="region"
      aria-label="Goals map"
      tabIndex={0}
      className={cn('shrink-0 overflow-x-auto rounded-sm', focusRing)}
    >
      <ul className="flex min-w-250 flex-col gap-5">
        {companyGoals.map((goal) => {
          const children = childrenOf(goal, goals)
          return (
            <li
              key={goal.id}
              className="grid grid-cols-[minmax(0,1fr)_6.375rem_minmax(0,1fr)_6.375rem_minmax(0,1fr)]"
            >
              <div className="relative col-start-1 self-center">
                <GoalCard goal={goal} selected={goal.id === openId} onOpen={onOpen} />
                {children.length > 0 ? (
                  <span
                    aria-hidden
                    className={cn('absolute top-1/2 left-full w-[3.1875rem] border-t', LINE)}
                  />
                ) : null}
              </div>
              {children.length > 0 ? (
                <ul
                  aria-label={`${goal.title} subgoals`}
                  className="col-span-4 col-start-2 grid grid-cols-subgrid gap-y-3.5"
                >
                  {children.map((child, i) => {
                    const project = plan.projects.find((p) => p.id === child.projectId)
                    return (
                      <li key={child.id} className="col-span-4 grid grid-cols-subgrid">
                        <Elbow first={i === 0} last={i === children.length - 1} />
                        <GoalCard goal={child} selected={child.id === openId} onOpen={onOpen} />
                        {project ? (
                          <>
                            <span aria-hidden className="relative">
                              <span className={cn('absolute inset-x-0 top-1/2 border-t', LINE)} />
                            </span>
                            <ProjectCard project={project} />
                          </>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * The connector column beside one subgoal: a horizontal from the vertical
 * to the card, and the vertical itself — from the middle down on the first
 * row, up on the last, full height between, none for an only child.
 */
function Elbow({ first, last }: { first: boolean; last: boolean }) {
  return (
    <span aria-hidden className="relative">
      <span className={cn('absolute top-1/2 right-0 left-1/2 border-t', LINE)} />
      {first && last ? null : (
        <span
          className={cn(
            'absolute left-1/2 border-l',
            LINE,
            first ? 'top-1/2 -bottom-3.5' : last ? 'top-0 bottom-1/2' : 'top-0 -bottom-3.5',
          )}
        />
      )}
    </span>
  )
}

function GoalCard({
  goal,
  selected,
  onOpen,
}: {
  goal: Goal
  selected: boolean
  onOpen: (id: string) => void
}) {
  const plan = usePlan()
  const owner = personFor(goal.ownerId)
  const progress = progressOf(goal, plan.goals, plan.projects)
  const health = GOAL_HEALTH[healthOf(goal, plan.goals, plan.projects, plan.said)]
  return (
    <ClickableCard selected={selected} onClick={() => onOpen(goal.id)} className="gap-2">
      <span className="flex items-center gap-2">
        <Icon icon={goal.parentId ? Target : Flag} />
        <Text render={<span />} weight="semibold" color="emphasized" truncate>
          {goal.title}
        </Text>
      </span>
      <span className="flex items-center gap-2">
        <Avatar name={owner.name} src={owner.avatar} alt="" size="x-small" />
        <ProgressBar
          value={progress}
          label={`${goal.title} progress`}
          labelHidden
          className="min-w-0 flex-1"
        />
        <Text render={<span />} size="sm" color="subtle">
          {progress}%
        </Text>
        <Badge color={health.color}>{health.label}</Badge>
      </span>
    </ClickableCard>
  )
}

/** A project at the end of a subgoal: its dot and name, its percent and its health. */
function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="flex items-center gap-2 self-center rounded-lg border border-surface-border bg-surface-background-primary p-3">
      <span className="min-w-0 flex-1">
        <ProjectNameCell project={project} href={`#${projectPath(project.id)}`} />
      </span>
      <Text render={<span />} size="sm" color="subtle">
        {project.progress}%
      </Text>
      <HealthBadge project={project} />
    </div>
  )
}
