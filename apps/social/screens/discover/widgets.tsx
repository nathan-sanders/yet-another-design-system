import { type CSSProperties, type ReactNode } from 'react'
import {
  Ellipsis,
  Flame,
  Hash,
  Radar,
  Reply,
  Share,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card, ClickableCard } from '../../../../src/components/Card'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Gauge } from '../../../../src/components/Gauge'
import { Icon } from '../../../../src/components/Icon'
import { TrendBadge } from '../../../../src/components/Metric'
import { Table, pixel, type TableColumn } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { NetworkIcon } from '../../components/NetworkIcon'
import {
  creators,
  criticizedFor,
  opportunities,
  praisedFor,
  sentimentSplit,
  trends,
  visualTrends,
  type Creator,
  type Theme,
  type Trend,
} from '../../data/discover'
import { engagementsOf, statsFor } from '../../data/performance'
import { profileFor } from '../../data/posts'
import type { Post } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { formatCount, peakDay } from '../reports/model'
import { TwoLineCell } from '../reports/widgets/ListWidgets'
import { postDate } from '../calendar/model'

/** Every widget's header `⋯`, which the mock does not fill. */
function WidgetActions({ title }: { title: string }) {
  const shell = useShell()
  return (
    <Button
      appearance="ghost"
      startIcon={Ellipsis}
      aria-label={`${title} actions`}
      onClick={() => shell.notBuilt('Widget actions')}
    />
  )
}

/**
 * A Discover widget: a `ContentBlock` with the file's header and its `⋯`. One
 * standing alone in the page column passes `h-auto shrink-0`: the column is a
 * flex column that would otherwise squash it to fit the window and let its
 * content spill over the next widget (FINDINGS 43's `h-full`, plus the shrink).
 */
function Widget({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <ContentBlock headingLevel={2} className={className}>
      <ContentBlock.Header actions={<WidgetActions title={title} />}>{title}</ContentBlock.Header>
      <ContentBlock.Content>{children}</ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * A label and its number, the stat rows under every card on this page. A
 * `<dl>`, except inside a clickable card: that is a `<button>`, which may only
 * hold phrasing content, so there the rows are spans.
 */
function Stats({
  rows,
  inButton = false,
}: {
  rows: [label: string, value: string][]
  inButton?: boolean
}) {
  const [List, Row, Term, Value] = inButton
    ? (['span', 'span', 'span', 'span'] as const)
    : (['dl', 'div', 'dt', 'dd'] as const)
  return (
    <List className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
      {rows.map(([label, value]) => (
        <Row key={label} className="contents">
          <Text render={<Term />} color="subtle">
            {label}
          </Text>
          <Text render={<Value />} mono className="text-right">
            {value}
          </Text>
        </Row>
      ))}
    </List>
  )
}

// ---------------------------------------------------------------------------
// Trending near your brand
// ---------------------------------------------------------------------------

const TREND_ICON: Record<Trend['icon'], LucideIcon> = {
  flame: Flame,
  up: TrendingUp,
  hash: Hash,
  radar: Radar,
  zap: Zap,
}

/** Topics climbing among the brand's audience (`40005911:35267`). */
export function TrendingWidget({ scale }: { scale: number }) {
  return (
    <Widget title="Trending near your brand">
      <ul className="flex flex-col divide-y divide-surface-border">
        {trends.map((trend) => {
          const meta = [
            `${formatCount(Math.round(trend.posts * scale))} posts`,
            trend.overlap !== undefined && trend.note === 'with your audience'
              ? `${trend.overlap}% overlap with your audience`
              : trend.overlap !== undefined
                ? `${trend.overlap}% overlap`
                : undefined,
            trend.note && trend.note !== 'with your audience' ? trend.note : undefined,
          ].filter(Boolean)
          return (
            <li key={trend.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
              <Icon icon={TREND_ICON[trend.icon]} className="shrink-0" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Text render={<span />} weight="semibold" truncate>
                  {trend.title}
                </Text>
                <Text render={<span />} size="sm" color="subtle" truncate>
                  {meta.join(' · ')}
                </Text>
              </span>
              <Badge color={trend.tone} className="shrink-0">
                {trend.change}
              </Badge>
            </li>
          )
        })}
      </ul>
    </Widget>
  )
}

// ---------------------------------------------------------------------------
// Creators your audience follows
// ---------------------------------------------------------------------------

const creatorColumns: TableColumn<Creator>[] = [
  {
    key: 'name',
    header: 'Author',
    renderCell: (c) => (
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={c.name} src={c.avatar} alt="" />
        <TwoLineCell title={c.name} source={c.network} meta={c.handle} />
      </span>
    ),
  },
  {
    key: 'overlap',
    header: 'Overlap',
    width: pixel(110),
    numeric: true,
    align: 'right',
    renderCell: (c) => `${c.overlap}%`,
    sortValue: (c) => c.overlap,
  },
  {
    key: 'followers',
    header: 'Followers',
    width: pixel(120),
    numeric: true,
    align: 'right',
    renderCell: (c) => formatCount(c.followers),
    sortValue: (c) => c.followers,
  },
]

/** Creators the brand's followers also follow, by overlap (`40005911:35324`). */
export function CreatorsWidget() {
  return (
    <Widget title="Creators your audience follows">
      <Table
        label="Creators your audience follows"
        columns={creatorColumns}
        data={creators}
        idKey="id"
        sortable
        textOverflow="truncate"
      />
    </Widget>
  )
}

// ---------------------------------------------------------------------------
// Visual trends in your space
// ---------------------------------------------------------------------------

/** What the space's posts look like, four styles with a photo each (`40005911:35339`). */
export function VisualTrendsWidget() {
  return (
    <Widget title="Visual trends in your space" className="h-auto shrink-0">
      <ul className="grid grid-cols-1 gap-3 @min-[560px]/page:grid-cols-2 @min-[1000px]/page:grid-cols-4">
        {visualTrends.map((trend) => (
          <li key={trend.id} className="contents">
            <Card className="flex flex-col gap-3">
              {/* Four examples of the look; the title names it, so they are decoration. */}
              <div className="grid grid-cols-2 gap-1">
                {trend.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt=""
                    className="aspect-[10/9] w-full rounded-sm object-cover"
                  />
                ))}
              </div>
              <Heading level={3} size="base" weight="semibold">
                {trend.title}
              </Heading>
              <Stats
                rows={[
                  ['% of posts', `${trend.share}%`],
                  ['Avg. engagements', trend.engagements.toLocaleString('en-US')],
                  ['Positive sentiment', `${trend.positive}%`],
                ]}
              />
              <Badge color={trend.yours ? 'neutral' : 'blue'} className="self-start">
                {trend.yours ? 'You post this' : 'Untapped for you'}
              </Badge>
            </Card>
          </li>
        ))}
      </ul>
    </Widget>
  )
}

// ---------------------------------------------------------------------------
// Opportunities to engage
// ---------------------------------------------------------------------------

/** Posts worth a reply or a share, and why (`40005911:35352`). */
export function OpportunitiesWidget() {
  const shell = useShell()
  return (
    <Widget title="Opportunities to engage">
      <ul className="flex flex-col divide-y divide-surface-border">
        {opportunities.map((o) => {
          const creator = creators.find((c) => c.id === o.creatorId)
          return (
            <li key={o.id} className="flex gap-3 py-4 first:pt-1 last:pb-0">
              <Avatar name={creator?.name ?? o.handle} src={creator?.avatar} alt="" size="small" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-2">
                  <NetworkIcon network={o.network} />
                  <Text render={<span />} weight="semibold" truncate>
                    {o.handle}
                  </Text>
                  <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                    · {o.ago}
                  </Text>
                  <Button
                    appearance="secondary"
                    size="small"
                    startIcon={o.action === 'reply' ? Reply : Share}
                    className="ml-auto shrink-0"
                    aria-label={`${o.action === 'reply' ? 'Reply to' : 'Share'} ${o.handle}`}
                    onClick={() =>
                      shell.notBuilt(
                        o.action === 'reply' ? 'Replying from Discover' : 'Sharing a post',
                      )
                    }
                  >
                    {o.action === 'reply' ? 'Reply' : 'Share'}
                  </Button>
                </div>
                <Text truncate>{o.body}</Text>
                <Text size="sm" color="subtle" truncate>
                  {o.why}
                </Text>
              </div>
            </li>
          )
        })}
      </ul>
    </Widget>
  )
}

// ---------------------------------------------------------------------------
// Brand sentiment
// ---------------------------------------------------------------------------

/**
 * Gauge colors its slices from the categorical scale and takes no color of its
 * own (FINDINGS 51), so this scope points the first three categories at the
 * sentiment tokens: Positive is green, Neutral gray, Negative red, in the arc
 * and in its legend alike.
 */
const SENTIMENT_SCOPE =
  '[--data-viz-categorical-01:var(--data-viz-sentiment-positive)] [--data-viz-categorical-02:var(--data-viz-sentiment-neutral)] [--data-viz-categorical-03:var(--data-viz-sentiment-negative)]'

/**
 * One theme and its mentions, over a bar scaled to the widget's busiest theme
 * across both columns, so criticism reads smaller than praise when it is —
 * `_Discover Theme Row` (`40005896:28371`).
 */
function ThemeList({
  title,
  themes,
  tone,
  max,
  scale,
}: {
  title: string
  themes: Theme[]
  tone: 'positive' | 'negative'
  max: number
  scale: number
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <Heading level={3} size="base" weight="semibold">
        {title}
      </Heading>
      <ul className="flex flex-col gap-3">
        {themes.map((theme) => (
          <li key={theme.name} className="flex flex-col gap-1">
            <span className="flex items-baseline gap-2">
              <Text render={<span />} truncate className="min-w-0 flex-1">
                {theme.name}
              </Text>
              <Text render={<span />} mono>
                {formatCount(Math.round(theme.mentions * scale))}
              </Text>
            </span>
            {/* Decorative: the number beside the name says it. */}
            <span aria-hidden className="h-1 w-full rounded-full bg-surface-border">
              <span
                className={`block h-full w-(--share) rounded-full ${tone === 'positive' ? 'bg-data-viz-sentiment-positive' : 'bg-data-viz-sentiment-negative'}`}
                style={{ '--share': `${(theme.mentions / max) * 100}%` } as CSSProperties}
              />
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** How people feel about the brand, and what for (`40005911:35368`). */
export function SentimentWidget({ scale }: { scale: number }) {
  const max = Math.max(
    ...praisedFor.map((t) => t.mentions),
    ...criticizedFor.map((t) => t.mentions),
  )
  return (
    <Widget title="Brand sentiment">
      <div className="flex flex-col gap-6">
        <div className={SENTIMENT_SCOPE}>
          <Gauge
            data={[
              { name: 'Positive', value: sentimentSplit.positive },
              { name: 'Neutral', value: sentimentSplit.neutral },
              { name: 'Negative', value: sentimentSplit.negative },
            ]}
            nameKey="name"
            valueKey="value"
            label="Share of mentions by sentiment, last 7 days"
            height={170}
            center={
              <span className="flex flex-col items-center gap-1">
                <Text render={<span />} color="subtle">
                  Positive
                </Text>
                <span className="flex items-center gap-2">
                  <Text render={<span />} size="lg" weight="semibold">
                    {sentimentSplit.positive}%
                  </Text>
                  <TrendBadge
                    trend={sentimentSplit.change}
                    format={(value) => `${Math.abs(value)} pts`}
                  />
                </span>
              </span>
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <ThemeList
            title="Praised for"
            themes={praisedFor}
            tone="positive"
            max={max}
            scale={scale}
          />
          <ThemeList
            title="Criticized for"
            themes={criticizedFor}
            tone="negative"
            max={max}
            scale={scale}
          />
        </div>
      </div>
    </Widget>
  )
}

// ---------------------------------------------------------------------------
// Your top posts
// ---------------------------------------------------------------------------

/**
 * The brand's best posts in the range (`40005911:35383`). They are the
 * calendar's own published posts, ranked by impressions, so a card opens the
 * same post detail Plan › Calendar does.
 */
export function TopPostsWidget({ posts }: { posts: Post[] }) {
  const shell = useShell()
  const open = shell.panel?.type === 'post' ? shell.panel.postId : undefined
  return (
    <Widget title="Your top posts" className="h-auto shrink-0">
      {posts.length === 0 ? (
        <Text color="subtle">Nothing published in this range yet.</Text>
      ) : (
        <ul className="grid grid-cols-1 gap-3 @min-[560px]/page:grid-cols-2 @min-[1000px]/page:grid-cols-4">
          {posts.map((post) => {
            const profile = profileFor(post)
            const stats = statsFor(post)
            const engagements = engagementsOf(stats)
            return (
              <li key={post.id} className="contents">
                <ClickableCard
                  selected={open === post.id}
                  onClick={() =>
                    shell.setPanel(open === post.id ? null : { type: 'post', postId: post.id })
                  }
                  className="flex flex-col gap-3"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <NetworkIcon network={profile.network} />
                    <Text render={<span />} weight="semibold" truncate className="min-w-0 flex-1">
                      {profile.name}
                    </Text>
                    <Text render={<span />} size="sm" color="subtle" className="shrink-0">
                      {peakDay.format(postDate(post))}
                    </Text>
                  </span>
                  {/* Always two lines tall, so the four cards' photos and stats line up. */}
                  <Text render={<span />} truncate={2} className="min-h-12">
                    {post.body}
                  </Text>
                  {post.photo ? (
                    <img
                      src={post.photo}
                      alt={post.photoAlt ?? ''}
                      className="aspect-[3/2] w-full rounded-md object-cover"
                    />
                  ) : null}
                  <Stats
                    inButton
                    rows={[
                      ['Impressions', formatCount(stats.impressions)],
                      ['Engagements', formatCount(engagements)],
                      [
                        'Engagement rate',
                        `${((engagements / stats.impressions) * 100).toFixed(1)}%`,
                      ],
                    ]}
                  />
                </ClickableCard>
              </li>
            )
          })}
        </ul>
      )}
    </Widget>
  )
}
