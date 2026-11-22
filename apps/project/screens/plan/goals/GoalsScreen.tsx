import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router'
import { Calendar, ChevronDown, ChevronRight, Ellipsis, Flag, Target } from 'lucide-react'

import { AppShell } from '../../../../../src/components/AppShell'
import { Badge } from '../../../../../src/components/Badge'
import { Button } from '../../../../../src/components/Button'
import { Icon } from '../../../../../src/components/Icon'
import { ProgressBar } from '../../../../../src/components/ProgressBar'
import { SegmentedControl } from '../../../../../src/components/SegmentedControl'
import { pixel, Table, type TableColumn } from '../../../../../src/components/Table'
import { Heading } from '../../../../../src/components/Text'
import { TopBar } from '../../../../../src/components/TopBar'
import { cn } from '../../../../../src/lib/cn'
import { focusRing } from '../../../../../src/lib/focus'
import { OwnerCell } from '../../../components/ProjectCells'
import { day, shortDate } from '../../../data/dates'
import type { Goal } from '../../../data/goals'
import { useShell } from '../../../shell/ShellContext'
import { floatingYakClearance } from '../../../yak/floating'
import { usePlan } from '../planState'
import { CheckInDialog } from './CheckInDialog'
import { GoalPanel } from './GoalPanel'
import { GoalsMap } from './GoalsMap'
import { GOAL_HEALTH } from './health'
import { goalRows, healthOf, inScope, progressOf, type GoalScope } from './model'
import { NewGoalDialog } from './NewGoalDialog'

const SCOPES: { value: GoalScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'company', label: 'Company' },
  { value: 'team', label: 'My team' },
]

type Row = ReturnType<typeof goalRows>[number]

/**
 * Plan › Goals (`Plan - Goals`, `40006279:15314`): the company goals for H2
 * 2026, each opening onto its subgoals, with progress, health, owner and due
 * date. All, Company and My team scope it; List and Map (`Plan - Goals /
 * Map`, `40006298:26717`) are two views of it. A goal opens its panel
 * (`?goal=texas`, `40006279:18644`), and with it open the table drops Owner
 * and Due, as drawn. Check in opens the check-in (`40006298:28745`); New ›
 * Goal opens New goal here (`?new=1`, `40006298:29382`).
 */
export function GoalsScreen() {
  const shell = useShell()
  const plan = usePlan()
  const [params, setParams] = useSearchParams()
  const scope = (SCOPES.find((s) => s.value === params.get('scope'))?.value ?? 'all') as GoalScope
  const view = params.get('view') === 'map' ? 'map' : 'list'
  const goals = inScope(plan.goals, scope)
  const openGoal = plan.goals.find((g) => g.id === params.get('goal'))
  const creating = params.get('new') === '1'
  const [checkingIn, setCheckingIn] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(plan.goals.filter((g) => !g.parentId).map((g) => g.id)),
  )

  const setParam = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current)
        if (value === null) copy.delete(key)
        else copy.set(key, value)
        return copy
      },
      { replace: true },
    )

  // The panel keeps its goal while it slides closed; a goal opening closes Yak.
  const [shownId, setShownId] = useState(openGoal?.id)
  if (openGoal && openGoal.id !== shownId) setShownId(openGoal.id)
  const shown = plan.goals.find((g) => g.id === shownId)
  const { yakOpen, closeYak } = shell
  const lastId = useRef(openGoal?.id)
  useEffect(() => {
    if (openGoal && openGoal.id !== lastId.current && yakOpen) closeYak()
    lastId.current = openGoal?.id
  }, [openGoal, yakOpen, closeYak])

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const panelOpen = Boolean(openGoal)
  const columns: TableColumn<Row>[] = [
    {
      key: 'goal',
      header: 'Goal',
      rowTarget: true,
      renderCell: ({ goal, depth, hasChildren }) => (
        <span className={cn('flex min-w-0 items-center gap-2', depth === 1 && 'pl-6')}>
          {hasChildren ? (
            <button
              type="button"
              aria-expanded={expanded.has(goal.id)}
              aria-label={`${expanded.has(goal.id) ? 'Fold' : 'Open'} ${goal.title}’s subgoals`}
              onClick={() => toggle(goal.id)}
              className={cn('flex rounded-xs text-content-primary', focusRing)}
            >
              <Icon icon={expanded.has(goal.id) ? ChevronDown : ChevronRight} />
            </button>
          ) : null}
          <Icon icon={depth === 0 ? Flag : Target} />
          <button
            type="button"
            aria-expanded={goal.id === openGoal?.id}
            onClick={() => setParam('goal', goal.id)}
            className={cn(
              'truncate rounded-xs text-left hover:underline',
              depth === 0 ? 'font-semibold text-content-emphasized' : 'text-content-primary',
              focusRing,
            )}
          >
            {goal.title}
          </button>
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      width: pixel(190),
      layout: 'fill',
      renderCell: ({ goal }) => {
        const progress = progressOf(goal, plan.goals, plan.projects)
        return (
          <span className="flex min-w-0 items-center gap-2">
            <ProgressBar
              value={progress}
              label={`${goal.title} progress`}
              labelHidden
              className="min-w-0 flex-1"
            />
            <span aria-hidden className="shrink-0 text-sm text-content-subtle">
              {progress}%
            </span>
          </span>
        )
      },
    },
    {
      key: 'health',
      header: 'Health',
      width: pixel(120),
      renderCell: ({ goal }) => {
        const health = GOAL_HEALTH[healthOf(goal, plan.goals, plan.projects, plan.said)]
        return <Badge color={health.color}>{health.label}</Badge>
      },
    },
    ...(panelOpen
      ? []
      : ([
          {
            key: 'owner',
            header: 'Owner',
            width: pixel(170),
            renderCell: ({ goal }) => <OwnerCell id={goal.ownerId} />,
          },
          {
            key: 'due',
            header: 'Due',
            width: pixel(96),
            renderCell: ({ goal }) => (
              <span className="text-content-subtle">{shortDate.format(day(goal.due))}</span>
            ),
          },
        ] satisfies TableColumn<Row>[])),
  ]

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              Goals
            </Heading>
            <SegmentedControl
              aria-label="Scope"
              appearance="secondary"
              value={scope}
              onValueChange={(next) => setParam('scope', next === 'all' ? null : String(next))}
            >
              {SCOPES.map((s) => (
                <SegmentedControl.Item key={s.value} value={s.value}>
                  {s.label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        }
        end={
          <>
            <SegmentedControl
              aria-label="View"
              appearance="secondary"
              value={view}
              className="max-md:hidden"
              onValueChange={(next) => setParam('view', next === 'map' ? 'map' : null)}
            >
              <SegmentedControl.Item value="list">List</SegmentedControl.Item>
              <SegmentedControl.Item value="map">Map</SegmentedControl.Item>
            </SegmentedControl>
            <Button
              appearance="ghost"
              startIcon={Calendar}
              endIcon={ChevronDown}
              className="max-lg:hidden"
              onClick={() => shell.notBuilt('Choosing a period')}
            >
              H2 2026
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('Goal actions')}
            />
          </>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        {view === 'map' ? (
          <GoalsMap goals={goals} openId={openGoal?.id} onOpen={(id) => setParam('goal', id)} />
        ) : (
          <div className="shrink-0">
            <Table
              label="Goals"
              columns={columns}
              data={goalRows(goals, expanded)}
              idKey="id"
              rowLabel={(row) => row.goal.title}
              selectedKeys={openGoal ? [openGoal.id] : []}
            />
          </div>
        )}
      </AppShell.Content>
      {shell.screenPanelHost
        ? createPortal(
            <GoalPanel
              goal={shown}
              open={panelOpen}
              onClose={() => setParam('goal', null)}
              onCheckIn={() => setCheckingIn(true)}
            />,
            shell.screenPanelHost,
          )
        : null}
      <CheckInDialog goal={openGoal} open={checkingIn} onClose={() => setCheckingIn(false)} />
      <NewGoalDialog
        open={creating}
        onClose={() => setParam('new', null)}
        onCreated={(goal: Goal) =>
          setParams(
            (current) => {
              const copy = new URLSearchParams(current)
              copy.delete('new')
              copy.set('goal', goal.id)
              return copy
            },
            { replace: true },
          )
        }
      />
    </>
  )
}
