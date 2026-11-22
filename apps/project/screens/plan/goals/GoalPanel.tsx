import { Calendar, CircleUser, Flag, Folders, Gauge, Repeat, SquarePen, Target } from 'lucide-react'

import { Avatar } from '../../../../../src/components/Avatar'
import { Badge } from '../../../../../src/components/Badge'
import { Button } from '../../../../../src/components/Button'
import { Panel } from '../../../../../src/components/Panel'
import { ProgressBar } from '../../../../../src/components/ProgressBar'
import { Heading, Text } from '../../../../../src/components/Text'
import { Token } from '../../../../../src/components/Token'
import { PropertyRow } from '../../../components/PropertyRow'
import { day, recentDay, shortDate, today, weekdayShort } from '../../../data/dates'
import type { CheckIn, Goal } from '../../../data/goals'
import { personFor } from '../../../data/people'
import { portfolioFor } from '../../../data/portfolios'
import { projectPath } from '../../project/paths'
import { usePlan } from '../planState'
import { portfolioPath } from '../portfolios/paths'
import { GOAL_HEALTH } from './health'
import { healthOf, measuredBy, progressOf } from './model'

/** "Fri", "Oct 23" — a check-in's age, as the panel's rows write it. */
function checkInAge(checkIn: CheckIn): string {
  return recentDay(checkIn.fresh ? today : day(checkIn.posted), weekdayShort)
}

/**
 * A goal's panel (`Goal Panel`, `40006279:18644`): its title, its percent in
 * Mono with its health, the bar, its properties as view-only Tokens — the
 * project and the portfolio go somewhere — then its check-ins and Check in.
 */
export function GoalPanel({
  goal,
  open,
  onClose,
  onCheckIn,
}: {
  goal?: Goal
  open: boolean
  onClose: () => void
  onCheckIn: () => void
}) {
  const plan = usePlan()
  return (
    <Panel
      aria-label="Goal"
      open={open && goal !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      {goal ? (
        <GoalBody
          goal={goal}
          onCheckIn={onCheckIn}
          progress={progressOf(goal, plan.goals, plan.projects)}
          health={healthOf(goal, plan.goals, plan.projects, plan.said)}
          measure={measuredBy(goal, plan.goals, plan.projects)}
          checkIns={plan.checkIns.filter((c) => c.goalId === goal.id)}
        />
      ) : null}
    </Panel>
  )
}

function GoalBody({
  goal,
  progress,
  health,
  measure,
  checkIns,
  onCheckIn,
}: {
  goal: Goal
  progress: number
  health: keyof typeof GOAL_HEALTH
  measure: string
  checkIns: CheckIn[]
  onCheckIn: () => void
}) {
  const owner = personFor(goal.ownerId)
  const portfolio = portfolioFor(goal.portfolioId)
  const badge = GOAL_HEALTH[health]
  return (
    <>
      <Panel.Header icon={goal.parentId ? Target : Flag}>Goal</Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <Heading level={2} size="lg" weight="semibold">
          {goal.title}
        </Heading>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Text
              render={<span />}
              size="xl"
              weight="bold"
              color="emphasized"
              mono
              className="flex-1"
            >
              {progress}%
            </Text>
            <Badge color={badge.color}>{badge.label}</Badge>
          </div>
          <ProgressBar value={progress} label={`${goal.title} progress`} labelHidden />
        </div>
        <dl aria-label="Properties" className="flex flex-col">
          <PropertyRow icon={CircleUser} label="Owner">
            <Token avatar={<Avatar name={owner.name} src={owner.avatar} alt="" size="x-small" />}>
              {owner.name}
            </Token>
          </PropertyRow>
          <PropertyRow icon={Calendar} label="Due">
            <Token>{shortDate.format(day(goal.due))}</Token>
          </PropertyRow>
          <PropertyRow icon={Gauge} label="Measured by">
            {goal.projectId ? (
              <Token href={`#${projectPath(goal.projectId)}`}>{measure}</Token>
            ) : (
              <Token>{measure}</Token>
            )}
          </PropertyRow>
          <PropertyRow icon={Repeat} label="Check-in">
            <Token>{goal.checkIn}</Token>
          </PropertyRow>
          {portfolio ? (
            <PropertyRow icon={Folders} label="Portfolio">
              <Token href={`#${portfolioPath(portfolio.id)}`}>{portfolio.name}</Token>
            </PropertyRow>
          ) : null}
        </dl>
        <section aria-labelledby="check-ins" className="flex flex-col gap-2">
          <Heading id="check-ins" level={3} size="base" weight="semibold">
            Check-ins
          </Heading>
          {checkIns.length > 0 ? (
            <ol className="flex flex-col">
              {checkIns.map((entry) => {
                const author = personFor(entry.authorId)
                return (
                  <li key={entry.id} className="flex items-center gap-2 py-1.5">
                    <Avatar name={author.name} src={author.avatar} alt="" size="x-small" />
                    <Text size="sm" className="min-w-0 flex-1">
                      {entry.text}
                    </Text>
                    <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                      {checkInAge(entry)}
                    </Text>
                  </li>
                )
              })}
            </ol>
          ) : (
            <Text size="sm" color="subtle">
              No check-ins yet. {owner.name.split(' ')[0]} checks in {goal.checkIn.toLowerCase()}.
            </Text>
          )}
        </section>
        <Button
          appearance="secondary"
          startIcon={SquarePen}
          className="self-start"
          onClick={onCheckIn}
        >
          Check in
        </Button>
      </Panel.Body>
    </>
  )
}
