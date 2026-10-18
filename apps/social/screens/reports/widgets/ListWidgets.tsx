import {
  Flame,
  Globe,
  Megaphone,
  Newspaper,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../../../src/components/Avatar'
import { Badge } from '../../../../../src/components/Badge'
import { Icon } from '../../../../../src/components/Icon'
import { Table, pixel, type TableColumn } from '../../../../../src/components/Table'
import { Text } from '../../../../../src/components/Text'
import { NetworkIcon } from '../../../components/NetworkIcon'
import { spikes, stories, voices } from '../../../data/reports'
import type { Network, Spike, Story, Voice } from '../../../data/types'
import { agoLabel, formatCount, formatVelocity } from '../model'

/** A network's mark, or a glyph for an outlet that has none. */
export function SourceMark({ source }: { source: Network | 'news' | 'web' }) {
  if (source === 'news') return <Icon icon={Newspaper} size="small" aria-hidden />
  if (source === 'web') return <Icon icon={Globe} size="small" aria-hidden />
  return <NetworkIcon network={source} size="small" />
}

/** A title over the line saying where it came from — `_Pulse Story Cell` (`40005869:21505`). */
export function TwoLineCell({
  title,
  source,
  meta,
}: {
  title: string
  source: Network | 'news' | 'web'
  meta: string
}) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <Text render={<span />} weight="semibold" truncate>
        {title}
      </Text>
      <span className="flex items-center gap-1 text-content-subtle">
        <SourceMark source={source} />
        <Text render={<span />} size="sm" color="subtle" truncate>
          {meta}
        </Text>
      </span>
    </span>
  )
}

const SENTIMENT_COLOR = { Positive: 'green', Neutral: 'neutral', Negative: 'red' } as const

const storyColumns: TableColumn<Story>[] = [
  {
    key: 'title',
    header: 'Story',
    renderCell: (s) => (
      <TwoLineCell title={s.title} source={s.source} meta={`${s.outlet} · ${s.sourceLabel}`} />
    ),
  },
  {
    key: 'hoursAgo',
    header: 'Published',
    width: pixel(120),
    renderCell: (s) => agoLabel(s.hoursAgo),
    sortValue: (s) => -s.hoursAgo,
  },
  {
    key: 'engagements',
    header: 'Engagements',
    // Wide enough for the header and its sort button, not just the number.
    width: pixel(150),
    numeric: true,
    align: 'right',
    renderCell: (s) => formatCount(s.engagements),
    sortValue: (s) => s.engagements,
  },
  {
    key: 'velocity',
    header: 'Velocity',
    // Mono is wider than the file's sans: 12.1K/hr clipped at 110 (the file
    // widened this column to 130 for the same reason).
    width: pixel(130),
    numeric: true,
    align: 'right',
    renderCell: (s) => formatVelocity(s.velocity),
    sortValue: (s) => s.velocity,
  },
  {
    key: 'sentiment',
    header: 'Sentiment',
    width: pixel(120),
    sortable: false,
    renderCell: (s) => <Badge color={SENTIMENT_COLOR[s.sentiment]}>{s.sentiment}</Badge>,
  },
]

/** Brand Pulse's top stories, newest first, as the file lists them. */
export function StoriesWidget() {
  return (
    <Table
      label="Top stories"
      columns={storyColumns}
      data={stories}
      idKey="id"
      sortable
      textOverflow="truncate"
    />
  )
}

const voiceColumns: TableColumn<Voice>[] = [
  {
    key: 'name',
    header: 'Author',
    renderCell: (v) => (
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={v.name} alt="" />
        <TwoLineCell title={v.name} source={v.source} meta={v.handle} />
      </span>
    ),
  },
  {
    key: 'mentions',
    header: 'Mentions',
    width: pixel(130),
    numeric: true,
    align: 'right',
    renderCell: (v) => String(v.mentions),
    sortValue: (v) => v.mentions,
  },
  {
    key: 'reach',
    header: 'Reach',
    width: pixel(100),
    numeric: true,
    align: 'right',
    renderCell: (v) => formatCount(v.reach),
    sortValue: (v) => v.reach,
  },
]

/** The accounts talking about the brand most — `_Pulse Author Cell` (`40005871:24336`). */
export function VoicesWidget() {
  return (
    <Table
      label="Top voices"
      columns={voiceColumns}
      data={voices}
      idKey="id"
      sortable
      textOverflow="truncate"
    />
  )
}

const SPIKE_ICON: Record<Spike['icon'], LucideIcon> = {
  zap: Zap,
  up: TrendingUp,
  flame: Flame,
  megaphone: Megaphone,
  down: TrendingDown,
}

/** What moved unusually fast — `_Pulse Spike Row` (`40005870:21980`), one per alert. */
export function SpikesWidget() {
  return (
    <ul className="flex flex-col divide-y divide-surface-border">
      {spikes.map((spike) => (
        <li key={spike.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <Icon icon={SPIKE_ICON[spike.icon]} className="shrink-0" aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Text render={<span />} weight="semibold" truncate>
              {spike.title}
            </Text>
            <Text render={<span />} size="sm" color="subtle" truncate>
              {spike.detail}
            </Text>
          </span>
          <Badge color={spike.tone} className="shrink-0">
            {spike.change}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
