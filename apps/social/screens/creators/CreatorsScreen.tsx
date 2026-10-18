import { useSearchParams } from 'react-router'
import { Ellipsis, LayoutGrid, List, ListFilter, Radar } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Select } from '../../../../src/components/Select'
import { Table, type TableColumn } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { TopBar } from '../../../../src/components/TopBar'
import { CreatorCard } from '../../components/CreatorCard'
import { YakSearchBar } from '../../components/YakSearchBar'
import {
  brandCreators,
  CATEGORY_ICON,
  creatorSuggestions,
  fitColor,
  type BrandCreator,
} from '../../data/creators'
import { useShell } from '../../shell/ShellContext'
import { formatCount } from '../reports/model'

type CreatorsView = 'grid' | 'list'
type CreatorSort = 'audience' | 'fit' | 'name'

const SORTS: { value: CreatorSort; label: string }[] = [
  { value: 'audience', label: 'Audience size' },
  { value: 'fit', label: 'Brand fit' },
  { value: 'name', label: 'Name' },
]

const compare: Record<CreatorSort, (a: BrandCreator, b: BrandCreator) => number> = {
  audience: (a, b) => b.followers - a.followers,
  fit: (a, b) => b.fit - a.fit,
  name: (a, b) => a.name.localeCompare(b.name),
}

const columns: TableColumn<BrandCreator>[] = [
  {
    key: 'name',
    header: 'Creator',
    renderCell: (c) => (
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={c.name} src={c.avatar} alt="" />
        <span className="flex min-w-0 flex-col">
          <Text render={<span />} weight="semibold" truncate>
            {c.name}
          </Text>
          <Text render={<span />} size="sm" color="subtle" truncate>
            @{c.handle}
          </Text>
        </span>
      </span>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    renderCell: (c) => <Token startIcon={CATEGORY_ICON[c.category]}>{c.category}</Token>,
  },
  {
    key: 'fit',
    header: 'Brand fit',
    align: 'right',
    renderCell: (c) => (
      <Badge color={fitColor(c.fit)} startIcon={Radar}>
        {c.fit}%
      </Badge>
    ),
  },
  {
    key: 'followers',
    header: 'Audience',
    numeric: true,
    align: 'right',
    renderCell: (c) => formatCount(c.followers),
  },
]

/**
 * Plan › Creators (`40005911:35697`): creators worth working with. A search
 * block on top hands its words to Yak's full view, which answers with the
 * matching creators; under it, every creator as Figma's `_Creator Card
 * Content` in a grid, or as a table in List view. View and sort are in the
 * URL (`?view=list&sort=fit`).
 */
export function CreatorsScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const view: CreatorsView = params.get('view') === 'list' ? 'list' : 'grid'
  const sort = (SORTS.find((s) => s.value === params.get('sort'))?.value ??
    'audience') as CreatorSort
  const sorted = [...brandCreators].sort(compare[sort])

  const update = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params)
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
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
      <AppShell.Content className="gap-3">
        <YakSearchBar
          label="Find the best creators for your brand"
          placeholder="Find the best creators for your brand"
          suggestions={creatorSuggestions}
          suggestionsLabel="Suggested searches"
        />
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Text render={<span />} size="sm" color="subtle">
              Sort by
            </Text>
            <Select
              size="small"
              hug
              aria-label="Sort creators"
              value={sort}
              onValueChange={(value) => update('sort', String(value), 'audience')}
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
                <CreatorCard creator={creator} onClick={() => shell.notBuilt('Creator details')} />
              </li>
            ))}
          </ul>
        ) : (
          <Table
            label="Creators"
            columns={columns}
            data={sorted}
            idKey="id"
            textOverflow="truncate"
          />
        )}
      </AppShell.Content>
    </>
  )
}
