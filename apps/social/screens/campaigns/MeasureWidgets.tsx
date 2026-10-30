import { ArrowRight, ArrowUpRight, Hash, Tag } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Card } from '../../../../src/components/Card'
import { Icon } from '../../../../src/components/Icon'
import { MetricGrid } from '../../../../src/components/Metric'
import { pixel, Table, type TableColumn } from '../../../../src/components/Table'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { NetworkIcon } from '../../components/NetworkIcon'
import { creatorById } from '../../data/creators'
import { monthDay } from '../../data/dates'
import { engagementsOf, statsFor } from '../../data/performance'
import { profileFor } from '../../data/posts'
import { postTypeLabel } from '../../data/postTypes'
import type { Campaign, Report } from '../../data/types'
import { NETWORK_NAMES } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useSchedule } from '../calendar/scheduleState'
import { formatChange, formatCount } from '../reports/model'
import { useCampaigns } from './campaignsState'
import { activeCreators, campaignPosts, compactCount, type PlannedPost } from './model'

// The four widgets only a campaign's report has (`40006187:44493`). Each reads
// the campaign live, from `useCampaigns`, and its posts from the schedule, so
// the Measure tab agrees with Overview.

function useCampaignOf(report: Report): Campaign | undefined {
  return useCampaigns().campaign(report.campaignId)
}

function Empty({ children }: { children: string }) {
  return (
    <Text color="subtle" className="py-2">
      {children}
    </Text>
  )
}

/** One result: the number, and a Badge saying how it stands against its target. */
function ResultTile({
  label,
  value,
  note,
  met,
}: {
  label: string
  value: string
  note: string
  met: boolean
}) {
  return (
    <Card emphasis="subtle" padding={3} className="h-full">
      <div className="flex min-w-0 flex-col gap-1">
        <Text render={<span />} color="subtle" truncate>
          {label}
        </Text>
        <span className="flex flex-wrap items-center gap-2">
          <Text
            render={<span />}
            size="xl"
            weight="bold"
            color="emphasized"
            mono
            className="tabular-nums"
          >
            {value}
          </Text>
          <Badge color={met ? 'green' : 'neutral'} startIcon={met ? ArrowUpRight : ArrowRight}>
            {note}
          </Badge>
        </span>
      </div>
    </Card>
  )
}

/** `Results vs targets`: Reach, Engagements, Link clicks, and the hashtags' week. */
export function TargetsWidget({ report, columns }: { report: Report; columns: 2 | 4 }) {
  const campaign = useCampaignOf(report)
  if (!campaign) return null
  const { reach, engagements, linkClicks } = campaign.targets ?? {}
  const share = (actual: number, target: number) =>
    actual >= target
      ? { note: 'Target met', met: true }
      : { note: `${Math.round((actual / target) * 100)}% of ${compactCount(target)}`, met: false }
  const tiles: { label: string; value: string; note: string; met: boolean }[] = []
  if (reach)
    tiles.push({
      label: 'Reach',
      value: compactCount(reach.actual),
      ...share(reach.actual, reach.target),
    })
  if (engagements !== undefined) {
    const actual = campaign.engagements?.total ?? 0
    tiles.push({ label: 'Engagements', value: compactCount(actual), ...share(actual, engagements) })
  }
  if (linkClicks)
    tiles.push({
      label: 'Link clicks',
      value: compactCount(linkClicks.actual),
      ...share(linkClicks.actual, linkClicks.target),
    })
  const hashtags = (campaign.mentions ?? []).filter((m) => m.kind === 'hashtag')
  if (hashtags.length > 0) {
    const change = hashtags[0]!.change ?? 0
    tiles.push({
      label: 'Hashtag mentions',
      value: compactCount(hashtags.reduce((n, m) => n + m.count, 0)),
      note: `${Math.abs(change)}% this week`,
      met: change > 0,
    })
  }
  if (tiles.length === 0) return <Empty>No targets set for this campaign.</Empty>
  return (
    <MetricGrid columns={columns}>
      {tiles.map((t) => (
        <ResultTile key={t.label} {...t} />
      ))}
    </MetricGrid>
  )
}

/** `Hashtag mentions`: the campaign's hashtags and products, each with how it's moving. */
export function HashtagsWidget({ report }: { report: Report }) {
  const campaign = useCampaignOf(report)
  const mentions = campaign?.mentions ?? []
  if (mentions.length === 0) return <Empty>No hashtags counted for this campaign yet.</Empty>
  return (
    <ul className="flex flex-col divide-y divide-surface-border">
      {mentions.map((m) => (
        <li key={m.label} className="flex items-center gap-3 py-2.5">
          <Icon icon={m.kind === 'hashtag' ? Hash : Tag} size="base" className="shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <Text render={<span />} weight="semibold" truncate>
              {m.label}
            </Text>
            <Text render={<span />} size="sm" color="subtle" truncate>
              {m.detail}
            </Text>
          </span>
          {m.change === undefined ? (
            <Badge color="neutral">New</Badge>
          ) : (
            <Badge color={m.change > 0 ? 'green' : m.change < 0 ? 'red' : 'neutral'}>
              {formatChange(m.change)}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  )
}

type Sentiment = 'Positive' | 'Neutral' | 'Negative'
const SENTIMENT_COLOR = { Positive: 'green', Neutral: 'neutral', Negative: 'red' } as const

/** A post's sentiment, from the share of positive replies its stats are seeded with. */
function sentimentOf(positive: number): Sentiment {
  if (positive >= 82) return 'Positive'
  return positive >= 76 ? 'Neutral' : 'Negative'
}

interface PostRow {
  id: string
  planned: PlannedPost
  engagements: number
  reach: number
  sentiment: Sentiment
}

/** `Top posts`: the campaign's published posts, most engaged first. A row opens the post. */
export function CampaignPostsWidget({ report }: { report: Report }) {
  const campaign = useCampaignOf(report)
  const { posts } = useSchedule()
  const shell = useShell()
  if (!campaign) return null
  const rows: PostRow[] = campaignPosts(campaign, posts)
    .filter((p) => p.published)
    .map((p) => {
      const stats = statsFor(p.post)
      return {
        id: p.post.id,
        planned: p,
        engagements: engagementsOf(stats),
        reach: stats.reach,
        sentiment: sentimentOf(stats.positive),
      }
    })
    .sort((a, b) => b.engagements - a.engagements)
  if (rows.length === 0) return <Empty>Nothing has gone out yet.</Empty>

  const columns: TableColumn<PostRow>[] = [
    {
      key: 'post',
      header: 'Post',
      rowTarget: true,
      renderCell: (r) => {
        const profile = profileFor(r.planned.post)
        return (
          <span className="flex min-w-0 flex-col gap-0.5">
            <button
              type="button"
              onClick={() => shell.setPanel({ type: 'post', postId: r.id })}
              className={cn(
                'truncate rounded-xs text-left font-semibold text-content-primary hover:underline',
                focusRing,
              )}
            >
              {r.planned.post.body}
            </button>
            <span className="flex items-center gap-1 text-content-subtle">
              <NetworkIcon network={profile.network} size="small" />
              <Text render={<span />} size="sm" color="subtle" truncate>
                {profile.network === 'facebook' ? profile.name : `@${profile.name}`} ·{' '}
                {NETWORK_NAMES[profile.network]}{' '}
                {postTypeLabel(profile.network, r.planned.post.format)}
              </Text>
            </span>
          </span>
        )
      },
    },
    {
      key: 'published',
      header: 'Published',
      width: pixel(120),
      sortValue: (r) => r.planned.date.getTime(),
      renderCell: (r) => monthDay.format(r.planned.date),
    },
    {
      key: 'engagements',
      header: 'Engagements',
      width: pixel(150),
      numeric: true,
      sortValue: (r) => r.engagements,
      renderCell: (r) => formatCount(r.engagements),
    },
    {
      key: 'reach',
      header: 'Reach',
      width: pixel(120),
      numeric: true,
      sortValue: (r) => r.reach,
      renderCell: (r) => formatCount(r.reach),
    },
    {
      key: 'sentiment',
      header: 'Sentiment',
      width: pixel(120),
      sortable: false,
      renderCell: (r) => <Badge color={SENTIMENT_COLOR[r.sentiment]}>{r.sentiment}</Badge>,
    },
  ]
  return (
    <Table
      label={`${campaign.name} top posts`}
      columns={columns}
      data={rows}
      idKey="id"
      sortable
      textOverflow="truncate"
      hasHover
    />
  )
}

const STATUS_WORDS = {
  invited: 'Invited',
  confirmed: 'Confirmed',
  live: 'Live',
  withdrawn: 'Withdrawn',
}

interface CreatorRow {
  id: string
  name: string
  avatar?: string
  detail: string
  network: Campaign['channels'][number]
  posts: number
  reach: number
}

/** `Creator posts`: each creator on the campaign, what they've posted, and its reach. */
export function CreatorPostsWidget({ report }: { report: Report }) {
  const campaign = useCampaignOf(report)
  const shell = useShell()
  if (!campaign) return null
  const rows: CreatorRow[] = activeCreators(campaign).flatMap((c) => {
    const creator = creatorById(c.creatorId)
    if (!creator) return []
    const posted = (c.work ?? []).filter((w) => w.status === 'posted')
    return [
      {
        id: c.creatorId,
        name: creator.name,
        avatar: creator.avatar,
        detail: `@${creator.handle} · ${NETWORK_NAMES[c.network]} · ${STATUS_WORDS[c.status]}`,
        network: c.network,
        posts: posted.length,
        reach: posted.reduce((n, w) => n + (w.reach ?? 0), 0),
      },
    ]
  })
  if (rows.length === 0) return <Empty>No creators on this campaign yet.</Empty>

  const columns: TableColumn<CreatorRow>[] = [
    {
      key: 'creator',
      header: 'Creator',
      rowTarget: true,
      renderCell: (r) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={r.name} src={r.avatar} size="small" alt="" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <button
              type="button"
              onClick={() => shell.setPanel({ type: 'creator', creatorId: r.id })}
              className={cn(
                'truncate rounded-xs text-left font-semibold text-content-primary hover:underline',
                focusRing,
              )}
            >
              {r.name}
            </button>
            <span className="flex items-center gap-1 text-content-subtle">
              <NetworkIcon network={r.network} size="small" />
              <Text render={<span />} size="sm" color="subtle" truncate>
                {r.detail}
              </Text>
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'posts',
      header: 'Posts',
      width: pixel(120),
      numeric: true,
      sortValue: (r) => r.posts,
      renderCell: (r) => String(r.posts),
    },
    {
      key: 'reach',
      header: 'Reach',
      width: pixel(120),
      numeric: true,
      sortValue: (r) => r.reach,
      renderCell: (r) => (r.reach ? formatCount(r.reach) : <span aria-label="None">–</span>),
    },
  ]
  return (
    <Table
      label={`${campaign.name} creator posts`}
      columns={columns}
      data={rows}
      idKey="id"
      sortable
      textOverflow="truncate"
      hasHover
    />
  )
}
