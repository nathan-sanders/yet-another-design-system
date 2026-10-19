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
import { ClickableCard } from '../../../../../src/components/Card'
import { Badge } from '../../../../../src/components/Badge'
import { Icon } from '../../../../../src/components/Icon'
import { Table, pixel, type TableColumn } from '../../../../../src/components/Table'
import { Text } from '../../../../../src/components/Text'
import { NetworkIcon } from '../../../components/NetworkIcon'
import { spikes, stories, voices, type ReportRange } from '../../../data/reports'
import type { Network, Report, Spike, Story, Voice, Widget } from '../../../data/types'
import { useMentions } from '../../mentions/useMentions'
import { spikeMentionQuery, storyMentionQuery, voiceMentionQuery } from '../mentions'
import { agoLabel, formatCount, formatVelocity } from '../model'
import { MentionRows, RowButton } from './clickable'
import { rowMentions, type RowMentions } from './rowMentions'

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

const storyColumns = ({ open, isOpen }: RowMentions<Story>): TableColumn<Story>[] => [
  {
    key: 'title',
    header: 'Story',
    renderCell: (s) => (
      <RowButton label={`${s.title}, view mentions`} pressed={isOpen(s)} onClick={() => open(s)}>
        <TwoLineCell title={s.title} source={s.source} meta={`${s.outlet} · ${s.sourceLabel}`} />
      </RowButton>
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

/** The props every list widget takes: which board, which widget, which range. */
interface ListProps {
  report: Report
  widget: Widget
  range: ReportRange
}

/** Brand Pulse's top stories, newest first, as the file lists them. A row opens its shares. */
export function StoriesWidget({ report, widget, range }: ListProps) {
  const mentions = useMentions()
  const query = (s: Story) => storyMentionQuery(report, widget, range, s)
  return (
    <MentionRows>
      <Table
        label={widget.title}
        columns={storyColumns(rowMentions(mentions, query))}
        data={stories}
        idKey="id"
        sortable
        textOverflow="truncate"
        hasHover
      />
    </MentionRows>
  )
}

const voiceColumns = ({ open, isOpen }: RowMentions<Voice>): TableColumn<Voice>[] => [
  {
    key: 'name',
    header: 'Author',
    renderCell: (v) => (
      <RowButton label={`${v.name}, view mentions`} pressed={isOpen(v)} onClick={() => open(v)}>
        <Avatar name={v.name} alt="" />
        <TwoLineCell title={v.name} source={v.source} meta={v.handle} />
      </RowButton>
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
export function VoicesWidget({ report, widget, range }: ListProps) {
  const mentions = useMentions()
  const query = (v: Voice) => voiceMentionQuery(report, widget, range, v)
  return (
    <MentionRows>
      <Table
        label={widget.title}
        columns={voiceColumns(rowMentions(mentions, query))}
        data={voices}
        idKey="id"
        sortable
        textOverflow="truncate"
        hasHover
      />
    </MentionRows>
  )
}

const SPIKE_ICON: Record<Spike['icon'], LucideIcon> = {
  zap: Zap,
  up: TrendingUp,
  flame: Flame,
  megaphone: Megaphone,
  down: TrendingDown,
}

/**
 * What moved unusually fast — `_Pulse Spike Row` (`40005870:21980`), one per
 * alert. Each row is a ghost `ClickableCard`, as Discover's trending rows are,
 * that opens the mentions which set it off.
 */
export function SpikesWidget({ report, widget, range }: ListProps) {
  const mentions = useMentions()
  return (
    <ul data-opens-mentions className="flex flex-col divide-y divide-surface-border">
      {spikes.map((spike, index) => {
        const query = spikeMentionQuery(report, widget, range, spike, index)
        return (
          <li key={spike.id} className="flex py-1 first:pt-0 last:pb-0">
            <ClickableCard
              emphasis="ghost"
              padding={2}
              selected={query ? mentions.isOpen(query.key) : false}
              onClick={() => query && mentions.toggle(query)}
              className="w-full"
            >
              <span className="flex w-full min-w-0 items-center gap-3 text-left">
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
              </span>
            </ClickableCard>
          </li>
        )
      })}
    </ul>
  )
}
