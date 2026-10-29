import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ChevronDown, Plus, Send } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { pixel, proportional, Table, type TableColumn } from '../../../../src/components/Table'
import { Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { BudgetBar } from '../../components/BudgetBar'
import { CreatorCard } from '../../components/CreatorCard'
import { NetworkIcon } from '../../components/NetworkIcon'
import { creatorById, type Creator } from '../../data/creators'
import type { Campaign, CampaignCreator, CampaignCreatorStatus } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useCampaigns } from './campaignsState'
import { activeCreators, campaignDate } from './model'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const dueDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const STATUSES: { value: Exclude<CampaignCreatorStatus, 'withdrawn'>; label: string }[] = [
  { value: 'invited', label: 'Invited' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'live', label: 'Live' },
]

interface Row {
  id: string
  entry: CampaignCreator
  creator: Creator
  /** The first deliverable still due, as a campaign day. */
  due: number | null
}

/**
 * A campaign's Creators tab (`40006187:42949`): the budget, then the roster —
 * who, in what role, how many deliverables, for what fee, due when, and where
 * they stand. Status is a menu on its Token (the file's Interactive Token with
 * a chevron), and it writes to the campaign, so the Plan tab's creator rows
 * and Overview's "2 of 3" follow.
 *
 * Paid is the fees of creators whose work is live; allocated is every fee on
 * the roster. Gallery is the Creators page's cards. Invite selected and Add
 * creator are the file's; inviting is a toast, and adding goes to Plan ›
 * Creators to find one (FINDINGS 203).
 */
export function CampaignCreators({ campaign }: { campaign: Campaign }) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const shell = useShell()
  const toast = Toast.useToast()
  const { setCreatorStatus } = useCampaigns()
  const [selected, setSelected] = useState<string[]>([])
  const gallery = params.get('view') === 'gallery'

  const rows: Row[] = activeCreators(campaign).flatMap((entry) => {
    const creator = creatorById(entry.creatorId)
    if (!creator) return []
    const due = entry.work?.find((w) => w.status === 'due')?.day ?? null
    return [{ id: entry.creatorId, entry, creator, due }]
  })
  const allocated = rows.reduce((sum, r) => sum + r.entry.fee, 0)
  const paid = rows.filter((r) => r.entry.status === 'live').reduce((s, r) => s + r.entry.fee, 0)
  const total = campaign.budget ?? allocated

  const open = (id: string) => shell.setPanel({ type: 'creator', creatorId: id })

  const columns: TableColumn<Row>[] = [
    {
      key: 'creator',
      header: 'Creator',
      // The file's widths: 320 for the creator, the rest fixed (`40006187:42949`).
      width: proportional(1, 240),
      sortable: false,
      renderCell: (r) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={r.creator.name} src={r.creator.avatar} alt="" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <button
              type="button"
              onClick={() => open(r.id)}
              className={cn(
                'truncate rounded-xs text-left text-base font-semibold text-content-emphasized hover:underline',
                focusRing,
              )}
            >
              {r.creator.name}
            </button>
            <span className="flex items-center gap-1 text-content-subtle">
              <NetworkIcon network={r.entry.network} size="small" />
              <Text render={<span />} size="sm" color="subtle" truncate>
                @{r.creator.handle}
              </Text>
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: pixel(180),
      sortable: false,
      renderCell: (r) => r.entry.role,
    },
    {
      key: 'deliverables',
      header: 'Deliverables',
      width: pixel(140),
      numeric: true,
      sortValue: (r) => r.entry.deliverables,
      renderCell: (r) => String(r.entry.deliverables),
    },
    {
      key: 'fee',
      header: 'Fee',
      width: pixel(120),
      numeric: true,
      sortValue: (r) => r.entry.fee,
      renderCell: (r) => money.format(r.entry.fee),
    },
    {
      key: 'due',
      header: 'Due',
      width: pixel(160),
      sortValue: (r) => r.due ?? Number.POSITIVE_INFINITY,
      renderCell: (r) =>
        r.due === null ? (
          <span aria-label="Nothing due">—</span>
        ) : (
          dueDate.format(campaignDate(r.due))
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: pixel(182),
      sortValue: (r) => STATUSES.findIndex((s) => s.value === r.entry.status),
      renderCell: (r) => (
        <StatusMenu
          name={r.creator.name}
          value={r.entry.status}
          onChange={(status) => setCreatorStatus(campaign.id, r.id, status)}
        />
      ),
    },
  ]

  const invite = () => {
    const names = rows.filter((r) => selected.includes(r.id)).map((r) => r.creator.name)
    toast.add({
      title: `Invite sent to ${names.length === 1 ? names[0] : `${names.length} creators`}`,
    })
    setSelected([])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          aria-label="Creators view"
          value={gallery ? 'gallery' : 'table'}
          onValueChange={(value) => {
            const next = new URLSearchParams(params)
            if (value === 'gallery') next.set('view', 'gallery')
            else next.delete('view')
            setParams(next, { replace: true })
          }}
        >
          <SegmentedControl.Item value="table">Table</SegmentedControl.Item>
          <SegmentedControl.Item value="gallery">Gallery</SegmentedControl.Item>
        </SegmentedControl>
        <span className="flex-1" />
        <Text render={<span />} size="sm" color="subtle">
          {rows.length} {rows.length === 1 ? 'creator' : 'creators'}
        </Text>
        <Button
          appearance="secondary"
          startIcon={Send}
          disabled={selected.length === 0}
          onClick={invite}
        >
          Invite selected
        </Button>
        <Button appearance="primary" startIcon={Plus} onClick={() => navigate('/plan/creators')}>
          Add creator
        </Button>
      </div>

      <ContentBlock headingLevel={2} className="h-auto shrink-0">
        <ContentBlock.Header>Budget</ContentBlock.Header>
        <ContentBlock.Content>
          {rows.length === 0 && campaign.budget === undefined ? (
            <Text color="subtle">No creators or budget yet.</Text>
          ) : (
            <BudgetBar paid={paid} allocated={allocated} total={total} />
          )}
        </ContentBlock.Content>
      </ContentBlock>

      {rows.length === 0 ? (
        <Text color="subtle">No creators on this campaign yet.</Text>
      ) : gallery ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3">
          {rows.map((r) => (
            <CreatorCard key={r.id} creator={r.creator} onClick={() => open(r.id)} />
          ))}
        </div>
      ) : (
        <Table
          label={`${campaign.name} creators`}
          columns={columns}
          data={rows}
          idKey="id"
          density="spacious"
          sortable
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          hasHover
        />
      )}
    </div>
  )
}

/**
 * The status Token as a menu. A Token can't be the trigger itself (FINDINGS
 * 24), so it sits inside the trigger's own button, as the inbox's are.
 */
function StatusMenu({
  name,
  value,
  onChange,
}: {
  name: string
  value: CampaignCreatorStatus
  onChange: (value: CampaignCreatorStatus) => void
}) {
  const label = STATUSES.find((s) => s.value === value)?.label ?? 'Withdrawn'
  return (
    <Menu>
      <Menu.Trigger
        render={
          <button
            type="button"
            aria-label={`${name}: ${label}. Change status`}
            className={cn('flex cursor-pointer rounded-md', focusRing)}
          >
            <Token interactive endSlot={<ChevronDown aria-hidden className="size-3.5" />}>
              {label}
            </Token>
          </button>
        }
      />
      <Menu.Popup aria-label={`${name}’s status`}>
        <Menu.Group>
          <Menu.RadioGroup
            value={value}
            onValueChange={(next) => onChange(next as CampaignCreatorStatus)}
          >
            {STATUSES.map((s) => (
              <Menu.RadioItem key={s.value} value={s.value} closeOnClick>
                {s.label}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}
