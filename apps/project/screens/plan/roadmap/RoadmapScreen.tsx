import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Check, Ellipsis, ListFilter, Rows3 } from 'lucide-react'

import { AppShell } from '../../../../../src/components/AppShell'
import { Button } from '../../../../../src/components/Button'
import { SegmentedControl } from '../../../../../src/components/SegmentedControl'
import { Heading, Text } from '../../../../../src/components/Text'
import { Toast } from '../../../../../src/components/Toast'
import { TopBar } from '../../../../../src/components/TopBar'
import { YakLine } from '../../../components/YakLine'
import { portfolios } from '../../../data/portfolios'
import { personFor } from '../../../data/people'
import { useShell } from '../../../shell/ShellContext'
import { floatingYakClearance } from '../../../yak/floating'
import { usePlan } from '../planState'
import { ApplyChangesDialog } from './ApplyChangesDialog'
import {
  applyChanges,
  capacityRows,
  ownersToNotify,
  rangeFor,
  stagedSummary,
  yakCapacityLine,
  YAK_CHANGE,
  type RoadmapScale,
} from './model'
import { RoadmapChart } from './RoadmapChart'

/**
 * Plan › Roadmap (`Plan - Roadmap / Unsaved changes`, `40006278:14156`):
 * every project on one time axis, a lane a portfolio, months or quarters.
 * It opens with the three changes the file draws staged, which only you see
 * until you apply them — Discard drops them, Apply changes opens the dialog
 * that says what they do and who hears. With nothing staged, Yak's line
 * says where the plan is tight (`Plan - Roadmap / Capacity`,
 * `40006297:28703`) and offers its fix. Capacity adds each team's booked
 * share a month under the lanes.
 *
 * The scale and Capacity are in the URL (`?scale=quarters&capacity=1`).
 * Group and Filter are drawn and not built; bars are not dragged here.
 */
export function RoadmapScreen() {
  const shell = useShell()
  const toast = Toast.useToast()
  const plan = usePlan()
  const [params, setParams] = useSearchParams()
  const scale: RoadmapScale = params.get('scale') === 'quarters' ? 'quarters' : 'months'
  const capacity = params.get('capacity') === '1'
  const [applying, setApplying] = useState(false)

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

  const range = rangeFor(scale)
  const lanes = portfolios.map((portfolio) => ({
    id: portfolio.id,
    label: portfolio.name,
    projects: portfolio.projectIds.map((id) => plan.projects.find((p) => p.id === id)!),
  }))
  // Capacity is a month a column; the quarters scale has no rows to show it in.
  // The rows follow the bars, so a staged move shows what it would ease.
  const shownCapacity =
    capacity && scale === 'months'
      ? capacityRows(applyChanges(plan.projects, plan.staged))
      : undefined
  const count = plan.staged.length
  const yak = yakCapacityLine(plan.projects)

  const discard = () => {
    const before = plan.snapshot()
    plan.discard()
    toast.add({
      title: `Discarded ${count} change${count === 1 ? '' : 's'}`,
      action: { label: 'Undo', onClick: () => plan.restore(before) },
    })
  }

  const apply = () => {
    const before = plan.snapshot()
    const owners = ownersToNotify(plan.projects, plan.staged).map((id) => personFor(id).name)
    plan.apply()
    setApplying(false)
    toast.add({
      title: `Applied ${count} change${count === 1 ? '' : 's'}`,
      description: `${owners.join(' and ')} ${owners.length === 1 ? 'was' : 'were'} notified.`,
      action: { label: 'Undo', onClick: () => plan.restore(before) },
    })
  }

  return (
    <>
      <TopBar
        start={
          <div className="flex min-w-0 items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0">
              Roadmap
            </Heading>
            <SegmentedControl
              aria-label="Scale"
              appearance="secondary"
              value={scale}
              onValueChange={(next) => setParam('scale', next === 'quarters' ? 'quarters' : null)}
            >
              <SegmentedControl.Item value="quarters">Quarters</SegmentedControl.Item>
              <SegmentedControl.Item value="months">Months</SegmentedControl.Item>
            </SegmentedControl>
          </div>
        }
        end={
          <>
            {/* The file's ✓ is the pressed look: YADS Button has none of its own (FINDINGS 71). */}
            <Button
              appearance="ghost"
              startIcon={capacity ? Check : undefined}
              aria-pressed={capacity}
              className="max-md:hidden"
              onClick={() => {
                if (capacity) setParam('capacity', null)
                else
                  setParams(
                    (current) => {
                      const copy = new URLSearchParams(current)
                      copy.set('capacity', '1')
                      copy.delete('scale')
                      return copy
                    },
                    { replace: true },
                  )
              }}
            >
              Capacity
            </Button>
            <Button
              appearance="ghost"
              startIcon={Rows3}
              className="max-lg:hidden"
              onClick={() => shell.notBuilt('Grouping the roadmap')}
            >
              Group: Portfolio
            </Button>
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              className="max-md:hidden"
              onClick={() => shell.notBuilt('Filtering the roadmap')}
            >
              Filter
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('Roadmap actions')}
            />
          </>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        {count > 0 ? (
          <section
            aria-label="Unsaved changes"
            className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg bg-surface-background-subtle py-2 pr-2 pl-4"
          >
            <Text render={<span />} weight="semibold" color="emphasized">
              {count} unsaved change{count === 1 ? '' : 's'}
            </Text>
            <Text
              render={<span />}
              size="sm"
              color="subtle"
              className="min-w-0 flex-1 max-md:order-last max-md:basis-full"
            >
              {stagedSummary(plan.projects, plan.staged)}
            </Text>
            <Button appearance="ghost" onClick={discard}>
              Discard
            </Button>
            <Button appearance="primary" onClick={() => setApplying(true)}>
              Apply changes
            </Button>
          </section>
        ) : (
          <YakLine
            actions={
              yak.offer ? (
                <Button appearance="secondary" size="small" onClick={() => plan.stage(YAK_CHANGE)}>
                  Try it
                </Button>
              ) : undefined
            }
          >
            {yak.text}
          </YakLine>
        )}
        <RoadmapChart range={range} lanes={lanes} staged={plan.staged} capacity={shownCapacity} />
      </AppShell.Content>
      <ApplyChangesDialog
        open={applying && count > 0}
        projects={plan.projects}
        staged={plan.staged}
        onClose={() => setApplying(false)}
        onApply={apply}
      />
    </>
  )
}
