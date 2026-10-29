import { useSearchParams } from 'react-router'
import { Ellipsis, ListFilter, Plus } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import type { TableSort } from '../../../../src/components/Table'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { floatingYakClearance } from '../../components/FloatingYak'
import { campaigns } from '../../data/campaigns'
import { useShell } from '../../shell/ShellContext'
import { CampaignsTable } from './CampaignsTable'
import { CampaignsTimeline } from './CampaignsTimeline'
import type { CampaignsView } from './model'

/**
 * Plan › Campaigns: every campaign as a table (`40006170:39473`) or across
 * the weeks (`40006178:41785`), switched in the top bar. The view and the
 * table's sort are in the URL (`?view=timeline`, `?sort=dates&dir=desc`), so
 * each has a link.
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

  const sort: TableSort | null =
    params.get('sort') === 'dates'
      ? { key: 'dates', direction: params.get('dir') === 'desc' ? 'descending' : 'ascending' }
      : null

  const update = (change: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    change(next)
    setParams(next, { replace: true })
  }

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
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              aria-label="Filter"
              onClick={() => shell.notBuilt('Filtering')}
            />
            {/* Below 768 the phone bar's + is New, and there is no room for both. */}
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
          <CampaignsTimeline campaigns={campaigns} />
        ) : (
          <CampaignsTable campaigns={campaigns} sort={sort} onSortChange={onSortChange} />
        )}
      </AppShell.Content>
    </>
  )
}
