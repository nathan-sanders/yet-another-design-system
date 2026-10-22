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
import { ClickableCard } from '../../../../src/components/Card'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { ChartSwatch } from '../../../../src/components/Chart'
import { Gauge } from '../../../../src/components/Gauge'
import { Icon } from '../../../../src/components/Icon'
import { TrendBadge } from '../../../../src/components/Metric'
import { Table, pixel, type TableColumn } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { NetworkIcon } from '../../components/NetworkIcon'
import { ViewMessagesButton } from '../../components/ViewMessagesButton'
import {
  creators,
  criticizedFor,
  opportunities,
  praisedFor,
  rangeScale,
  sentimentSplit,
  trends,
  visualTrends,
  type Creator,
  type DiscoverRange,
  type Theme,
  type Trend,
} from '../../data/discover'
import type { MentionQuery } from '../../data/mentions'
import { engagementsOf, statsFor } from '../../data/performance'
import { profileFor } from '../../data/posts'
import type { MentionSentiment, Post } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useMentions } from '../mentions/useMentions'
import { formatCount, peakDay } from '../reports/model'
import { TwoLineCell } from '../reports/widgets/ListWidgets'
import { postDate } from '../calendar/model'
import {
  brandSentimentQuery,
  creatorQuery,
  creatorsQuery,
  opportunitiesQuery,
  sentimentQuery,
  themeQuery,
  trendQuery,
  trendsQuery,
  visualQuery,
  visualsQuery,
} from './mentions'

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
 * A Discover widget: a `ContentBlock` with the file's header and its `⋯`,
 * and before it View messages when the widget counts posts (`messages`). One
 * standing alone in the page column passes `h-auto shrink-0`: the column is a
 * flex column that would otherwise squash it to fit the window and let its
 * content spill over the next widget (FINDINGS 43's `h-full`, plus the shrink).
 */
function Widget({
  title,
  messages,
  children,
  className,
}: {
  title: string
  /** The posts behind the whole widget. */
  messages?: MentionQuery
  children: ReactNode
  className?: string
}) {
  return (
    <ContentBlock headingLevel={2} className={className}>
      <ContentBlock.Header
        actions={
          <>
            {messages ? <ViewMessagesButton title={title} query={messages} /> : null}
            <WidgetActions title={title} />
          </>
        }
      >
        {title}
      </ContentBlock.Header>
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

/**
 * Topics climbing among the brand's audience (`40005911:35267`). Each row is
 * a ghost `ClickableCard` that opens the posts in the trend.
 */
export function TrendingWidget({ range }: { range: DiscoverRange }) {
  return (
    <Widget title="Trending near your brand" messages={trendsQuery(range)}>
      <TrendingList range={range} />
    </Widget>
  )
}

/** The trending rows on their own, for a widget that has its own frame (a report board's). */
export function TrendingList({ range }: { range: DiscoverRange }) {
  const scale = rangeScale(range)
  const mentions = useMentions()
  return (
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
        const query = trendQuery(trend, range)
        return (
          <li key={trend.id} className="flex py-1 first:pt-0 last:pb-0">
            <ClickableCard
              emphasis="ghost"
              padding={2}
              selected={mentions.isOpen(query.key)}
              onClick={() => mentions.toggle(query)}
              className="w-full"
            >
              <span className="flex w-full min-w-0 items-center gap-3 text-left">
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
              </span>
            </ClickableCard>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Creators your audience follows
// ---------------------------------------------------------------------------

/**
 * The columns, given what a name does when pressed. The Author cell is the
 * button that opens the creator's mentions: the keyboard and screen-reader
 * path. A pointer can press anywhere on the row (see `CreatorsWidget`).
 */
const creatorColumns = (
  open: (creator: Creator) => void,
  isOpen: (creator: Creator) => boolean,
): TableColumn<Creator>[] => [
  {
    key: 'name',
    header: 'Author',
    // The row's own control: a press anywhere on the row presses it (FINDINGS 77).
    rowTarget: true,
    renderCell: (c) => (
      <button
        type="button"
        aria-pressed={isOpen(c)}
        aria-label={`${c.name}, view mentions`}
        onClick={() => open(c)}
        className={cn('flex w-full min-w-0 items-center gap-3 rounded-xs text-left', focusRing)}
      >
        <Avatar name={c.name} src={c.avatar} alt="" />
        <TwoLineCell title={c.name} source={c.network} meta={c.handle} />
      </button>
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

/**
 * Creators the brand's followers also follow, by overlap (`40005911:35324`).
 * The whole row opens the creator's mentions, as a row on Measure › Reports
 * opens its report.
 */
export function CreatorsWidget({ range }: { range: DiscoverRange }) {
  const mentions = useMentions()
  const query = (c: Creator) => creatorQuery(c, range, 'Creators your audience follows')

  return (
    <Widget title="Creators your audience follows" messages={creatorsQuery(range)}>
      <Table
        label="Creators your audience follows"
        columns={creatorColumns(
          (c) => mentions.toggle(query(c)),
          (c) => mentions.isOpen(query(c).key),
        )}
        data={creators}
        idKey="id"
        sortable
        textOverflow="truncate"
        hasHover
      />
    </Widget>
  )
}

// ---------------------------------------------------------------------------
// Visual trends in your space
// ---------------------------------------------------------------------------

/**
 * What the space's posts look like, four styles with a photo each
 * (`40005911:35339`). Each is a `ClickableCard` that opens the posts in it.
 */
export function VisualTrendsWidget({ range }: { range: DiscoverRange }) {
  const mentions = useMentions()
  return (
    <Widget
      title="Visual trends in your space"
      messages={visualsQuery(range)}
      className="h-auto shrink-0"
    >
      <ul className="grid grid-cols-1 gap-3 @min-[560px]/page:grid-cols-2 @min-[1000px]/page:grid-cols-4">
        {visualTrends.map((trend) => {
          const query = visualQuery(trend, range)
          return (
            <li key={trend.id} className="contents">
              <ClickableCard
                selected={mentions.isOpen(query.key)}
                onClick={() => mentions.toggle(query)}
                className="flex flex-col gap-3"
              >
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
                {/* A span, not a heading: the card is a button, which holds phrasing content only. */}
                <Text render={<span />} weight="semibold" className="text-left">
                  {trend.title}
                </Text>
                <Stats
                  inButton
                  rows={[
                    ['% of posts', `${trend.share}%`],
                    ['Avg. engagements', trend.engagements.toLocaleString('en-US')],
                    ['Positive sentiment', `${trend.positive}%`],
                  ]}
                />
                <Badge color={trend.yours ? 'neutral' : 'blue'} className="self-start">
                  {trend.yours ? 'You post this' : 'Untapped for you'}
                </Badge>
              </ClickableCard>
            </li>
          )
        })}
      </ul>
    </Widget>
  )
}

// ---------------------------------------------------------------------------
// Opportunities to engage
// ---------------------------------------------------------------------------

/**
 * Posts worth a reply or a share, and why (`40005911:35352`). A row opens the
 * poster's mentions of the brand: the post is the button, and a pointer
 * anywhere on the row but Reply / Share does the same.
 */
export function OpportunitiesWidget({ range }: { range: DiscoverRange }) {
  const shell = useShell()
  const mentions = useMentions()
  return (
    <Widget title="Opportunities to engage" messages={opportunitiesQuery(range)}>
      <ul className="flex flex-col divide-y divide-surface-border">
        {opportunities.map((o) => {
          const creator = creators.find((c) => c.id === o.creatorId)
          const query = creator
            ? creatorQuery(creator, range, 'Opportunities to engage')
            : undefined
          const open = query && mentions.isOpen(query.key)
          return (
            <li
              key={o.id}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('button') || !query) return
                mentions.toggle(query)
              }}
              className="flex py-1 first:pt-0 last:pb-0"
            >
              {/* The hover and open fills of a ghost `ClickableCard`, which the
                  trend rows are, inset from the dividers the same way: one
                  color for every clickable thing on the page. */}
              <div
                className={cn(
                  'flex w-full gap-3 rounded-md px-2 py-3',
                  'transition-colors duration-fast-min ease-standard',
                  query && 'cursor-pointer hover:bg-surface-background-subtle',
                  open && 'bg-surface-background-subtle',
                )}
              >
                <Avatar
                  name={creator?.name ?? o.handle}
                  src={creator?.avatar}
                  alt=""
                  size="small"
                />
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
                  {query ? (
                    <button
                      type="button"
                      aria-pressed={open}
                      aria-label={`${o.handle}: ${o.body} View their mentions`}
                      onClick={() => mentions.toggle(query)}
                      className={cn('flex min-w-0 flex-col gap-1 rounded-xs text-left', focusRing)}
                    >
                      <Text render={<span />} truncate>
                        {o.body}
                      </Text>
                      <Text render={<span />} size="sm" color="subtle" truncate>
                        {o.why}
                      </Text>
                    </button>
                  ) : (
                    <>
                      <Text truncate>{o.body}</Text>
                      <Text size="sm" color="subtle" truncate>
                        {o.why}
                      </Text>
                    </>
                  )}
                </div>
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
 * One theme and its mentions, over a bar scaled to the widget's busiest theme
 * across both columns, so criticism reads smaller than praise when it is —
 * `_Discover Theme Row` (`40005896:28371`).
 */
function ThemeList({
  title,
  themes,
  tone,
  max,
  range,
}: {
  title: string
  themes: Theme[]
  tone: 'positive' | 'negative'
  max: number
  range: DiscoverRange
}) {
  const scale = rangeScale(range)
  const mentions = useMentions()
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <Heading level={3} size="base" weight="semibold">
        {title}
      </Heading>
      <ul className="flex flex-col gap-3">
        {themes.map((theme) => {
          const query = themeQuery(theme, tone, range)
          const open = mentions.isOpen(query.key)
          return (
            <li key={theme.name} className="flex">
              {/* A row button with the hover and selected fills of a ghost card,
                but none of its padding: the bar has to reach the column's edge. */}
              <button
                type="button"
                aria-pressed={open}
                onClick={() => mentions.toggle(query)}
                className={cn(
                  '-m-1 flex w-full flex-col gap-1 rounded-sm p-1 text-left',
                  'hover:bg-surface-background-subtle',
                  open && 'bg-surface-background-subtle',
                  focusRing,
                )}
              >
                <span className="flex w-full items-baseline gap-2">
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
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const SENTIMENTS: { value: MentionSentiment; label: string; color: string }[] = [
  { value: 'positive', label: 'Positive', color: 'var(--data-viz-sentiment-positive)' },
  { value: 'neutral', label: 'Neutral', color: 'var(--data-viz-sentiment-neutral)' },
  { value: 'negative', label: 'Negative', color: 'var(--data-viz-sentiment-negative)' },
]

/**
 * The gauge's legend, as buttons: each opens that sentiment's mentions, as a
 * click on its slice does. The legend stays because it is the only place the
 * open sentiment can show as pressed — a slice has no selected state
 * (FINDINGS 87) — and the gauge draws none of its own.
 */
function SentimentLegend({ range }: { range: DiscoverRange }) {
  const mentions = useMentions()
  return (
    <ul aria-label="Mentions by sentiment" className="flex flex-wrap justify-center gap-1">
      {SENTIMENTS.map((s) => {
        const query = sentimentQuery(s.value, range)
        const open = mentions.isOpen(query.key)
        return (
          <li key={s.value}>
            <button
              type="button"
              aria-pressed={open}
              aria-label={`${s.label}, ${sentimentSplit[s.value]}%, view mentions`}
              onClick={() => mentions.toggle(query)}
              className={cn(
                'flex h-8 items-center gap-1 rounded-sm pr-2',
                'hover:bg-surface-background-subtle',
                open && 'bg-surface-background-subtle',
                focusRing,
              )}
            >
              <ChartSwatch shape="colorSwatch" color={s.color} aria-hidden />
              <Text render={<span />}>{s.label}</Text>
              <Text render={<span />} mono color="subtle">
                {sentimentSplit[s.value]}%
              </Text>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** How people feel about the brand, and what for (`40005911:35368`). */
export function SentimentWidget({ range }: { range: DiscoverRange }) {
  return (
    <Widget title="Brand sentiment" messages={brandSentimentQuery(range)}>
      <SentimentBody range={range} />
    </Widget>
  )
}

/** The gauge and the two theme lists on their own, for a report board's frame. */
export function SentimentBody({ range }: { range: DiscoverRange }) {
  const mentions = useMentions()
  const max = Math.max(
    ...praisedFor.map((t) => t.mentions),
    ...criticizedFor.map((t) => t.mentions),
  )
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SentimentLegend range={range} />
        <Gauge
          // In SENTIMENTS' order, so a slice's index is its sentiment.
          // Each slice wears its sentiment's token, in the arc and the legend.
          data={SENTIMENTS.map((s) => ({
            name: s.label,
            value: sentimentSplit[s.value],
            color: s.color,
          }))}
          nameKey="name"
          valueKey="value"
          colorKey="color"
          label="Share of mentions by sentiment, last 7 days"
          legend={false}
          height={170}
          onSliceClick={({ index }) =>
            mentions.toggle(sentimentQuery(SENTIMENTS[index]!.value, range))
          }
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
          range={range}
        />
        <ThemeList
          title="Criticized for"
          themes={criticizedFor}
          tone="negative"
          max={max}
          range={range}
        />
      </div>
    </div>
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
  return (
    <Widget title="Your top posts" className="h-auto shrink-0">
      <TopPostsGrid posts={posts} />
    </Widget>
  )
}

/** The post cards on their own, for a report board's frame. */
export function TopPostsGrid({ posts }: { posts: Post[] }) {
  const shell = useShell()
  const open = shell.panel?.type === 'post' ? shell.panel.postId : undefined
  return posts.length === 0 ? (
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
                  ['Engagement rate', `${((engagements / stats.impressions) * 100).toFixed(1)}%`],
                ]}
              />
            </ClickableCard>
          </li>
        )
      })}
    </ul>
  )
}
