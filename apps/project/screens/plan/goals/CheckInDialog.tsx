import { useState } from 'react'
import { Repeat, Target } from 'lucide-react'

import { Badge } from '../../../../../src/components/Badge'
import { Button } from '../../../../../src/components/Button'
import { Dialog } from '../../../../../src/components/Dialog'
import { Icon } from '../../../../../src/components/Icon'
import { ProgressBar } from '../../../../../src/components/ProgressBar'
import { SegmentedControl } from '../../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../../src/components/Text'
import { TextArea } from '../../../../../src/components/TextArea'
import { Toast } from '../../../../../src/components/Toast'
import { PropertyRow } from '../../../components/PropertyRow'
import { addDays, day, shortDate, today, weekdayLong } from '../../../data/dates'
import type { Goal, GoalHealth } from '../../../data/goals'
import type { Project } from '../../../data/types'
import { YakMark } from '../../../yak/YakMark'
import { usePlan } from '../planState'
import { rangeFor } from '../roadmap/model'
import { CONFIDENCE, GOAL_HEALTH } from './health'
import { childrenOf, healthOf, progressOf } from './model'

/** "Friday, Nov 13": the Friday after this one, since this week's check-in is the one being posted. */
function nextCheckIn(): string {
  const friday = addDays(today, ((5 - today.getDay() + 7) % 7) + 7)
  return `${weekdayLong.format(friday)}, ${shortDate.format(friday)}`
}

const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' })

/**
 * What Yak drafts for "What changed?" (`Plan - Goals / Check-in`,
 * `40006298:28745`). For Open 3 Texas stores it reads the Roadmap: the
 * Dallas move, staged or made, and what it does to the goal's date.
 */
function yakDraft(
  goal: Goal,
  goals: Goal[],
  projects: Project[],
  dallasMove: 'staged' | 'made' | null,
): string {
  const due = shortDate.format(day(goal.due))
  const january = monthName.format(rangeFor('months').columns[2].start)
  if (goal.id === 'texas') {
    if (dallasMove === 'staged')
      return `Austin’s permit is now the main risk, and Dallas may move three weeks to free up Ops in ${january}. That would take this goal past ${due}.`
    if (dallasMove === 'made')
      return `Dallas moved three weeks to free up Ops in ${january}, which takes this goal past ${due}. Austin’s permit is still the main risk.`
    return `Austin’s permit is now the main risk. Dallas and Houston are on plan for ${due}.`
  }
  const children = childrenOf(goal, goals)
  if (children.length > 0) {
    const lowest = [...children].sort(
      (a, b) => progressOf(a, goals, projects) - progressOf(b, goals, projects),
    )[0]
    return `${lowest.title} is furthest behind, at ${progressOf(lowest, goals, projects)}%.`
  }
  return `${progressOf(goal, goals, projects)}% of the way there, with ${due} to go.`
}

export function CheckInDialog({
  goal,
  open,
  onClose,
}: {
  goal?: Goal
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog
      open={open && goal !== undefined}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Popup>
        {goal ? <CheckInForm key={goal.id} goal={goal} onClose={onClose} /> : null}
      </Dialog.Popup>
    </Dialog>
  )
}

/**
 * The goal's percent and what it is calculated from, its subgoals with
 * theirs, How confident are you as a Segment Control, What changed with
 * Yak's draft in it, and when the next check-in is. Post check-in adds it to
 * the goal's list and sets the goal's health to the answer; Skip this week
 * says when the next one is.
 */
function CheckInForm({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const toast = Toast.useToast()
  const plan = usePlan()
  const progress = progressOf(goal, plan.goals, plan.projects)
  const current = healthOf(goal, plan.goals, plan.projects, plan.said)
  const children = childrenOf(goal, plan.goals)
  const dallas = plan.staged.some((c) => c.projectId === 'dallas' && c.kind === 'move')
    ? 'staged'
    : plan.projects.find((p) => p.id === 'dallas')?.due !== '2027-03-29'
      ? 'made'
      : null
  const [confidence, setConfidence] = useState<GoalHealth>(
    CONFIDENCE.includes(current) ? current : 'on-track',
  )
  const [note, setNote] = useState(() => yakDraft(goal, plan.goals, plan.projects, dallas))
  const next = nextCheckIn()

  const post = () => {
    const undo = plan.checkIn(goal.id, note.trim() || GOAL_HEALTH[confidence].label, confidence)
    onClose()
    toast.add({
      title: `Checked in on ${goal.title}`,
      description: `${GOAL_HEALTH[confidence].label}. Next check-in ${next}.`,
      action: { label: 'Undo', onClick: undo },
    })
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <Dialog.Title>Check in on {goal.title}</Dialog.Title>
        <Dialog.Close />
      </div>
      <Dialog.Body className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-2">
            <Text render={<span />} size="xl" weight="bold" color="emphasized" mono>
              {progress}%
            </Text>
            <Text render={<span />} size="sm" color="subtle">
              {children.length > 0
                ? `Calculated from ${children.length} subgoals`
                : goal.manual
                  ? 'Set by hand'
                  : 'Calculated from its project'}
            </Text>
          </div>
          <ProgressBar value={progress} label={`${goal.title} progress`} labelHidden />
          {children.length > 0 ? (
            <ul aria-label="Subgoals" className="flex flex-col gap-2">
              {children.map((child) => {
                const health = GOAL_HEALTH[healthOf(child, plan.goals, plan.projects, plan.said)]
                return (
                  <li key={child.id} className="flex items-center gap-2">
                    <Icon icon={Target} />
                    <Text render={<span />} className="min-w-0 flex-1" truncate>
                      {child.title}
                    </Text>
                    <Text render={<span />} size="sm" color="subtle">
                      {progressOf(child, plan.goals, plan.projects)}%
                    </Text>
                    <Badge color={health.color}>{health.label}</Badge>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
        <Heading id="confidence" level={3} size="base" weight="semibold">
          How confident are you?
        </Heading>
        <SegmentedControl
          aria-labelledby="confidence"
          appearance="secondary"
          value={confidence}
          onValueChange={(value) => setConfidence(value as GoalHealth)}
          className="self-start"
        >
          {CONFIDENCE.map((h) => (
            <SegmentedControl.Item key={h} value={h}>
              {GOAL_HEALTH[h].label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
        <div className="flex items-center gap-2">
          <Heading id="what-changed" level={3} size="base" weight="semibold" className="flex-1">
            What changed?
          </Heading>
          <YakMark className="size-4" />
          <Text render={<span />} size="sm" color="subtle">
            Drafted by Yak
          </Text>
        </div>
        <TextArea
          aria-labelledby="what-changed"
          value={note}
          onValueChange={(value) => setNote(String(value))}
        />
        <dl className="flex flex-col">
          <PropertyRow icon={Repeat} label="Next check-in">
            {next}
          </PropertyRow>
        </dl>
      </Dialog.Body>
      <div className="flex justify-end gap-2 pt-4">
        <Button
          appearance="ghost"
          onClick={() => {
            onClose()
            toast.add({
              title: 'Skipped this week’s check-in',
              description: `The next one is ${next}.`,
            })
          }}
        >
          Skip this week
        </Button>
        <Button appearance="primary" onClick={post}>
          Post check-in
        </Button>
      </div>
    </>
  )
}
