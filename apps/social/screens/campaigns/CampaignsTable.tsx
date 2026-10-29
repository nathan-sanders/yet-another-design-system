import { Spark } from '../../../../src/components/Spark'
import {
  Table,
  pixel,
  proportional,
  type TableColumn,
  type TableSort,
} from '../../../../src/components/Table'
import { Token } from '../../../../src/components/Token'
import { CampaignNameCell } from '../../components/CampaignNameCell'
import { CAMPAIGN_STATUS } from '../../components/campaignStatus'
import { NetworkIcon } from '../../components/NetworkIcon'
import { OwnerCell } from '../../components/OwnerCell'
import type { Campaign } from '../../data/types'
import { compactCount, dateRangeLabel } from './model'
import { campaignPath } from './paths'

const NONE = <span aria-label="None">—</span>

const columns: TableColumn<Campaign>[] = [
  {
    key: 'name',
    header: 'Campaign',
    width: proportional(1, 240),
    sortable: false,
    rowTarget: true,
    renderCell: (campaign) => (
      <CampaignNameCell campaign={campaign} href={`#${campaignPath(campaign.id)}`} />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    // 20 wider than the file's 130, where "Wrapping up" overflows its cell by
    // 12; Engagements gives the 20 back (FINDINGS 179).
    width: pixel(150),
    sortable: false,
    renderCell: (campaign) => {
      const status = CAMPAIGN_STATUS[campaign.status]
      return (
        <Token size="small" startIcon={status.icon}>
          {status.label}
        </Token>
      )
    },
  },
  {
    key: 'dates',
    header: 'Dates',
    width: pixel(160),
    renderCell: (campaign) => dateRangeLabel(campaign),
    sortValue: (campaign) => campaign.start,
  },
  {
    key: 'channels',
    header: 'Channels',
    width: pixel(130),
    sortable: false,
    renderCell: (campaign) => (
      <span className="flex items-center gap-2">
        {campaign.channels.map((network) => (
          <NetworkIcon key={network} network={network} />
        ))}
      </span>
    ),
  },
  {
    key: 'owner',
    header: 'Owner',
    width: pixel(180),
    sortable: false,
    renderCell: (campaign) => <OwnerCell id={campaign.ownerId} />,
  },
  {
    key: 'posts',
    header: 'Scheduled / planned',
    width: pixel(150),
    sortable: false,
    renderCell: (campaign) => (
      <span aria-label={`${campaign.scheduled} of ${campaign.planned} scheduled`}>
        {campaign.scheduled} / {campaign.planned}
      </span>
    ),
  },
  {
    key: 'engagements',
    header: 'Engagements',
    width: pixel(146),
    sortable: false,
    renderCell: (campaign) =>
      campaign.engagements ? (
        <span className="flex items-center gap-2">
          {/* The number beside it says what the shape is a shape of. */}
          <Spark
            decorative
            type="line"
            data={campaign.engagements.series.map((value) => ({ value }))}
            dataKey="value"
            height={24}
            className="w-17 shrink-0"
          />
          {compactCount(campaign.engagements.total)}
        </span>
      ) : (
        NONE
      ),
  },
]

/**
 * The Table view of Plan › Campaigns (`40006170:39473`): one Spacious row a
 * campaign. Only Dates sorts, as the file has it; the sort lives in the URL.
 */
export function CampaignsTable({
  campaigns,
  sort,
  onSortChange,
}: {
  campaigns: Campaign[]
  sort: TableSort | null
  onSortChange: (next: TableSort | null) => void
}) {
  return (
    <Table
      label="Campaigns"
      columns={columns}
      data={campaigns}
      idKey="id"
      density="spacious"
      sortable
      sort={sort}
      onSortChange={onSortChange}
      textOverflow="truncate"
      hasHover
    />
  )
}
