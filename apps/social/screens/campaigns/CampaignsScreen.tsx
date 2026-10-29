import { useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Ellipsis, ListFilter, Plus } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import type { TableSort } from '../../../../src/components/Table'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { floatingYakClearance } from '../../components/FloatingYak'
import { campaigns } from '../../data/campaigns'
import { useShell } from '../../shell/ShellContext'
import { today } from '../calendar/model'
import { CampaignsTable } from './CampaignsTable'
import { CampaignsTimeline } from './CampaignsTimeline'
import { shiftYears, type CampaignsView } from './model'

/**
 * Plan › Campaigns: every campaign as a table (`40006170:39473`) or across
 * the weeks (`40006178:41785`), switched in the top bar. The view and the
 * table's sort are in the URL (`?view=timeline`, `?sort=dates&dir=desc`), so
 * each has a link.
 *
 * The timeline's year navigation (`Year Navigation` in `40006178:41785`)
 * steps the same twelve weeks a whole year at a time, in `?year=`; the year
 * between the arrows is the one on screen, and pressing it comes back to
 * today, the calendar's Today button in the file's own layer name.
 *
 * **New campaign stays in the top bar**, the one exception to the rule that
 * the rail's New is a page's only create button (#313): Nathan drew it there
 * and kept it. Filter is not designed yet — how a filter is applied is still
 * open — so it says so, like the rail's New › Campaign does.
 */
export function CampaignsScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const view: CampaignsView = params.get('view') === 'timeline' ? 'timeline' : 'table'
  const thisYear = today.getFullYear()
  const yearParam = Number(params.get('year'))
  const year = Number.isInteger(yearParam) && yearParam > 0 ? yearParam : thisYear

  const sort: TableSort | null =
    params.get('sort') === 'dates'
      ? { key: 'dates', direction: params.get('dir') === 'desc' ? 'descending' : 'ascending' }
      : null

  const update = (change: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    change(next)
    setParams(next, { replace: true })
  }

  const goToYear = (next: number) =>
    update((p) => {
      if (next === thisYear) p.delete('year')
      else p.set('year', String(next))
    })

  const onSortChange = (next: TableSort | null) =>
    update((p) => {
      if (next) {
        p.set('sort', next.key)
        p.set('dir', next.direction === 'descending' ? 'desc' : 'asc')
      } else {
        p.delete('sort')
        p.delete('dir')
      }
    })

  return (
    <>
      <TopBar
        start={
          // One child: TopBar's start slot stretches each child to `flex-1`. On a
          // phone the title is the nav's, as the calendar's is.
          <div className="flex items-center gap-2">
            <Heading level={1} size="base" weight="bold" className="shrink-0 max-md:sr-only">
              Campaigns
            </Heading>
            <SegmentedControl
              aria-label="Campaigns view"
              value={view}
              onValueChange={(value) =>
                update((p) => {
                  if (value === 'timeline') p.set('view', 'timeline')
                  else p.delete('view')
                })
              }
            >
              <SegmentedControl.Item value="table">Table</SegmentedControl.Item>
              <SegmentedControl.Item value="timeline">Timeline</SegmentedControl.Item>
            </SegmentedControl>
            {view === 'timeline' && (
              <div className="flex items-center">
                <Button
                  appearance="ghost"
                  startIcon={ArrowLeft}
                  aria-label="Previous year"
                  onClick={() => goToYear(year - 1)}
                />
                <Button
                  appearance="ghost"
                  aria-label={year === thisYear ? String(year) : `${year}, back to ${thisYear}`}
                  onClick={() => goToYear(thisYear)}
                >
                  {year}
                </Button>
                <Button
                  appearance="ghost"
                  startIcon={ArrowRight}
                  aria-label="Next year"
                  onClick={() => goToYear(year + 1)}
                />
              </div>
            )}
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            {/* Below 768 the phone bar's + is New, and there is no room for both;
                Filter goes too, as the calendar's does, to leave the year
                navigation room. */}
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              aria-label="Filter"
              className="max-md:hidden"
              onClick={() => shell.notBuilt('Filtering')}
            />
            <Button
              startIcon={Plus}
              className="max-md:hidden"
              onClick={() => shell.notBuilt('Creating campaigns')}
            >
              New campaign
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
          </div>
        }
      />
      <AppShell.Content className={floatingYakClearance}>
        {view === 'timeline' ? (
          <CampaignsTimeline campaigns={campaigns} anchor={shiftYears(today, year - thisYear)} />
        ) : (
          <CampaignsTable campaigns={campaigns} sort={sort} onSortChange={onSortChange} />
        )}
      </AppShell.Content>
    </>
  )
}
