import type { MouseEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Ellipsis, LayoutGrid, List, ListFilter, Radar } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Select } from '../../../../src/components/Select'
import {
  pixel,
  proportional,
  Table,
  type TableColumn,
  type TableSort,
  type TableSortDirection,
} from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { TopBar } from '../../../../src/components/TopBar'
import { CreatorCard } from '../../components/CreatorCard'
import { floatingYakClearance } from '../../components/FloatingYak'
import { NetworkIcon } from '../../components/NetworkIcon'
import { brandCreators, CATEGORY_ICON, fitColor, type Creator } from '../../data/creators'
import { useShell } from '../../shell/ShellContext'
import { formatCount } from '../reports/model'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { clickableRows } from '../../components/clickableRows'

type CreatorsView = 'grid' | 'list'

/** The Sort by menu: each option is a column key and the direction it starts in. */
const SORTS: { value: string; label: string; direction: TableSortDirection }[] = [
  { value: 'fit', label: 'Brand fit', direction: 'descending' },
  { value: 'followers', label: 'Audience size', direction: 'descending' },
  { value: 'engagement', label: 'Engagement', direction: 'descending' },
  { value: 'name', label: 'Name', direction: 'ascending' },
]

/**
 * The order the page opens in: best brand fit first, because the question this
 * page answers is who to work with. Every other order is a column's.
 */
const DEFAULT_SORT: TableSort = { key: 'fit', direction: 'descending' }

// The short columns are fixed so their headers and sort arrows never truncate
// when the details panel takes 384px; the name and Top topic give way instead.
const columns: TableColumn<Creator>[] = [
  {
    key: 'name',
    header: 'Creator',
    sortable: false,
    width: proportional(),
    renderCell: (c) => (
      <span className="flex min-w-0 items-center gap-2">
        <Avatar size="large" name={c.name} src={c.avatar} alt="" />
        <span className="flex min-w-0 flex-col">
          {/* The row's control: a click anywhere on the row forwards here (`openRow`). */}
          <button
            type="button"
            data-creator={c.id}
            className={cn(
              'truncate rounded-xs text-left font-semibold text-content-emphasized hover:underline',
              focusRing,
            )}
          >
            {c.name}
          </button>
          <span className="flex min-w-0 items-center gap-1 text-content-subtle">
            <NetworkIcon network={c.network} size="small" />
            <Text render={<span />} size="sm" color="subtle" truncate>
              @{c.handle}
            </Text>
          </span>
        </span>
      </span>
    ),
  },
  {
    key: 'fit',
    header: 'Brand fit',
    width: pixel(120),
    renderCell: (c) => (
      <Badge color={fitColor(c.fit)} startIcon={Radar}>
        {c.fit}%
      </Badge>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    sortable: false,
    width: pixel(144),
    renderCell: (c) => <Token startIcon={CATEGORY_ICON[c.category]}>{c.category}</Token>,
  },
  {
    key: 'topTopic',
    header: 'Top topic',
    sortable: false,
    renderCell: (c) => c.topTopic,
  },
  {
    key: 'followers',
    header: 'Audience',
    numeric: true,
    width: pixel(120),
    renderCell: (c) => formatCount(c.followers),
  },
  {
    key: 'engagement',
    header: 'Engagement',
    numeric: true,
    width: pixel(152),
    renderCell: (c) => `${c.engagement.toFixed(1)}%`,
  },
]

/** The grid sorts the way the table would, so both views agree on one order. */
function sortCreators(creators: readonly Creator[], sort: TableSort): Creator[] {
  const direction = sort.direction === 'ascending' ? 1 : -1
  return [...creators].sort((a, b) => {
    const left = a[sort.key as keyof Creator]
    const right = b[sort.key as keyof Creator]
    return typeof left === 'number' && typeof right === 'number'
      ? direction * (left - right)
      : direction * String(left).localeCompare(String(right))
  })
}

/**
 * Plan › Creators (`40005911:35697`, List `40005911:35964`): creators worth
 * working with, as Figma's `_Creator Card Content` in a grid or as a table in
 * List view. Either one opens Creator details (`40005911:35788`) in the
 * shell's panel. View and sort are in the URL (`?view=list&sort=fit&dir=asc`);
 * the Sort by menu and the table's column headers are the same sort.
 */
export function CreatorsScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const view: CreatorsView = params.get('view') === 'list' ? 'list' : 'grid'
  const option = SORTS.find((s) => s.value === params.get('sort'))
  const sort: TableSort = option
    ? {
        key: option.value,
        direction:
          params.get('dir') === 'asc'
            ? 'ascending'
            : params.get('dir') === 'desc'
              ? 'descending'
              : option.direction,
      }
    : DEFAULT_SORT
  const sorted = sortCreators(brandCreators, sort)
  const openId = shell.panel?.type === 'creator' ? shell.panel.creatorId : undefined

  const update = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params)
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  // A header click cycles ascending → descending → the page's own order.
  const setSort = (next: TableSort | null) => {
    const nextParams = new URLSearchParams(params)
    const chosen = next ?? DEFAULT_SORT
    const start = SORTS.find((s) => s.value === chosen.key)?.direction
    if (chosen.key === DEFAULT_SORT.key && chosen.direction === DEFAULT_SORT.direction) {
      nextParams.delete('sort')
      nextParams.delete('dir')
    } else {
      nextParams.set('sort', chosen.key)
      if (chosen.direction === start) nextParams.delete('dir')
      else nextParams.set('dir', chosen.direction === 'ascending' ? 'asc' : 'desc')
    }
    setParams(nextParams, { replace: true })
  }

  // Clicking the open creator again closes the panel, as a calendar post does.
  const openCreator = (id: string) =>
    shell.setPanel(openId === id ? null : { type: 'creator', creatorId: id })

  // Table has no `onRowClick` on purpose (a <tr> has no keyboard equivalent),
  // so the row forwards to the name button, which stays the keyboard path —
  // the Reports table's pattern (FINDINGS 48).
  const openRow = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const button = target.closest('tbody tr')?.querySelector<HTMLElement>('[data-creator]')
    if (!button || (target.closest('a, button') && target.closest('a, button') !== button)) return
    openCreator(button.dataset.creator!)
  }

  return (
    <>
      <TopBar
        start={
          <div className="flex items-center gap-3">
            <Heading level={1} size="base" weight="semibold">
              Creators
            </Heading>
            <SegmentedControl
              aria-label="View"
              value={view}
              onValueChange={(value) => update('view', String(value), 'grid')}
            >
              <SegmentedControl.Item value="grid" startIcon={LayoutGrid}>
                Grid
              </SegmentedControl.Item>
              <SegmentedControl.Item value="list" startIcon={List}>
                List
              </SegmentedControl.Item>
            </SegmentedControl>
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              onClick={() => shell.notBuilt('Filtering creators')}
            >
              Filter
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
      <AppShell.Content className={cn('gap-3', floatingYakClearance)}>
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Text render={<span />} size="sm" color="subtle">
              Sort by
            </Text>
            <Select
              size="small"
              hug
              aria-label="Sort creators"
              value={sort.key}
              onValueChange={(value) => {
                const picked = SORTS.find((s) => s.value === value)
                if (picked) setSort({ key: picked.value, direction: picked.direction })
              }}
              items={SORTS}
            >
              {SORTS.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select>
          </div>
          <Text render={<span />} size="sm" color="subtle">
            {brandCreators.length} creators
          </Text>
        </div>
        {view === 'grid' ? (
          <ul
            aria-label="Creators"
            className="grid shrink-0 grid-cols-1 gap-3 @min-[560px]/page:grid-cols-2 @min-[860px]/page:grid-cols-3 @min-[1080px]/page:grid-cols-4"
          >
            {sorted.map((creator) => (
              <li key={creator.id} className="flex">
                <CreatorCard
                  creator={creator}
                  selected={creator.id === openId}
                  onClick={() => openCreator(creator.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          // A pointer convenience over the name buttons; see `openRow`.
          <div onClick={openRow} className={cn('shrink-0', clickableRows)}>
            <Table
              label="Creators"
              columns={columns}
              data={sorted}
              idKey="id"
              density="spacious"
              sortable
              sort={sort}
              onSortChange={setSort}
              textOverflow="truncate"
              hasHover
            />
          </div>
        )}
      </AppShell.Content>
    </>
  )
}
