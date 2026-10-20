import { useState, type CSSProperties, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  ExternalLink,
  Eye,
  Fullscreen,
  Heart,
  MessageCircle,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { AvatarGroup } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { MetricCard, MetricGrid } from '../../../../src/components/Metric'
import { Panel } from '../../../../src/components/Panel'
import { Select } from '../../../../src/components/Select'
import { Tabs } from '../../../../src/components/Tabs'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { CreatorCard } from '../../components/CreatorCard'
import { NetworkIcon } from '../../components/NetworkIcon'
import {
  audienceFor,
  audienceOverlap,
  contentFor,
  creatorById,
  fitColor,
  fitLabel,
  similarCreators,
  type Creator,
  type CreatorPost,
  type Share,
} from '../../data/creators'
import { useShell } from '../../shell/ShellContext'
import { formatCount } from '../reports/model'
import { creatorPath, type DetailTab } from './paths'

/**
 * One of Overview's cards: a 12px-padded `Card` with a body-size subtle label
 * over its value, as every Overview card in the file is drawn. The label is an
 * `h3` under the creator's name, so a screen reader can walk the cards.
 */
function DetailCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card className="gap-2">
      <Heading level={3} size="base" weight="normal" color="subtle">
        {label}
      </Heading>
      {children}
    </Card>
  )
}

/**
 * "Engagement rate vs similar creators": two rows sharing one scale, the
 * bigger rate filling its track. Figma draws them as plain 8px bars, not a
 * `ProgressBar` (which has a track and no categorical color) and not a chart.
 * The bars are decoration; the mono number beside each says it.
 */
function EngagementBars({ creator }: { creator: Creator }) {
  const rows = [
    { label: creator.name, value: creator.engagement, fill: 'bg-data-viz-categorical-01' },
    {
      label: 'Similar creators',
      value: creator.peerEngagement,
      fill: 'bg-decorative-neutral-highlight',
    },
  ]
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3">
          <Text render={<span />} truncate className="w-26 shrink-0">
            {row.label}
          </Text>
          <span aria-hidden className="flex min-w-0 flex-1">
            <span
              className={cn('block h-2 w-(--share) rounded-full', row.fill)}
              style={{ '--share': `${(row.value / max) * 100}%` } as CSSProperties}
            />
          </span>
          <Text render={<span />} mono className="shrink-0">
            {row.value.toFixed(1)}%
          </Text>
        </li>
      ))}
    </ul>
  )
}

export function OverviewTab({ creator }: { creator: Creator }) {
  const { collaborations } = creator
  const shown = collaborations.brands.length
  return (
    <div className="flex flex-col gap-4">
      <DetailCard label="Brand fit score">
        <div className="flex items-center gap-2">
          <Badge color={fitColor(creator.fit)} startIcon={Radar}>
            {creator.fit}%
          </Badge>
          <Text render={<span />} weight="semibold" color="emphasized">
            {fitLabel(creator.fit)}
          </Text>
        </div>
      </DetailCard>

      <DetailCard label="Brand safety">
        <div className="flex items-center gap-2">
          {creator.flaggedPosts ? (
            <>
              <Badge color="amber" startIcon={ShieldAlert}>
                {creator.flaggedPosts}
              </Badge>
              <Text render={<span />} weight="semibold" color="emphasized">
                {creator.flaggedPosts === 1 ? 'Sensitive post' : 'Sensitive posts'}
              </Text>
            </>
          ) : (
            <>
              <Badge color="green" startIcon={ShieldCheck}>
                0
              </Badge>
              <Text render={<span />} weight="semibold" color="emphasized">
                No sensitive posts
              </Text>
            </>
          )}
        </div>
      </DetailCard>

      <DetailCard label="Collaborations">
        <div className="flex items-center gap-2">
          <Text render={<span />} weight="semibold" color="emphasized">
            {collaborations.count} brands
          </Text>
          <AvatarGroup
            size="small"
            surface="card-primary"
            aria-label="Brands they have worked with"
          >
            {collaborations.brands.map((brand) => (
              <Avatar key={brand} name={brand} />
            ))}
            {collaborations.count > shown ? (
              <AvatarGroup.Overflow count={collaborations.count - shown} />
            ) : null}
          </AvatarGroup>
        </div>
      </DetailCard>

      <DetailCard label="Topics they talk about">
        <ul className="flex flex-wrap gap-2">
          {creator.talkingPoints.map((topic) => (
            <li key={topic} className="flex">
              <Token startIcon={Sparkles}>{topic}</Token>
            </li>
          ))}
        </ul>
      </DetailCard>

      <DetailCard label="Engagement rate vs similar creators">
        <EngagementBars creator={creator} />
      </DetailCard>

      <DetailCard label="Channels">
        <ul className="flex flex-col gap-2">
          {creator.channels.map((channel) => (
            <li key={channel.network} className="flex items-center gap-2">
              <NetworkIcon network={channel.network} />
              <Text render={<span />} truncate className="min-w-0 flex-1">
                {channel.handle}
              </Text>
              <Text render={<span />} mono>
                {formatCount(channel.followers)}
              </Text>
            </li>
          ))}
        </ul>
      </DetailCard>
    </div>
  )
}

/**
 * A row of labelled shares on one 0–100 scale: Figma's plain 8px bars in the
 * first categorical color, the Engagement card's drawing at the full view's
 * width (`40005952:23519`). The bars are decoration; the mono number beside
 * each says it, and the list is the structure a screen reader walks.
 */
function ShareBars({ rows, label }: { rows: Share[]; label: string }) {
  return (
    <ul aria-label={label} className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3">
          <Text render={<span />} truncate className="w-32 shrink-0">
            {row.label}
          </Text>
          <span aria-hidden className="flex min-w-0 flex-1">
            <span
              className="block h-2 w-(--share) min-w-1 rounded-full bg-data-viz-categorical-01"
              style={{ '--share': `${row.share}%` } as CSSProperties}
            />
          </span>
          <Text render={<span />} mono className="shrink-0">
            {row.share}%
          </Text>
        </li>
      ))}
    </ul>
  )
}

/**
 * A titled block for the Audience and Content tabs: the file's `Content Block`
 * with a header (`Widget / Opportunities` in `40005952:23519`), as Discover's
 * and Home's widgets are drawn, so the full view reads like the rest of the
 * app. The title is an `h3` under the creator's name.
 */
function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ContentBlock headingLevel={3} className="h-auto">
      <ContentBlock.Header>{title}</ContentBlock.Header>
      <ContentBlock.Content>{children}</ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * The tab bodies lay out by the room they are given, not the window: one
 * column in the 384 panel, the file's grid in the full view's right column.
 * `@container/creator` is that room; the 560 breakpoint sits between the
 * panel at its widest (640) less padding and the full view at its narrowest.
 * The KPIs are `MetricCard`s two to a row at every width, as the file's
 * `KPIs` grid is.
 */
const tabBody = '@container/creator flex flex-col gap-3'
const cardPair = 'grid grid-cols-1 items-stretch gap-3 @min-[560px]/creator:grid-cols-2'

/** Audience (`Full View`, `40005952:23519`): who follows them. */
export function AudienceTab({ creator }: { creator: Creator }) {
  const audience = audienceFor(creator)
  const growth = `${audience.growth > 0 ? '+' : ''}${audience.growth.toFixed(1)}%`
  return (
    <div className={tabBody}>
      <MetricGrid columns={2}>
        <MetricCard label="Followers" value={formatCount(creator.followers)} />
        <MetricCard label="Audience growth (30 days)" value={growth} />
        <MetricCard label="Avg. engagement rate" value={`${creator.engagement.toFixed(1)}%`} />
        <MetricCard label="Authentic followers" value={`${audience.authentic}%`} />
      </MetricGrid>
      <div className={cardPair}>
        <DetailBlock title="Age range">
          <ShareBars rows={audience.ages} label="Followers by age" />
        </DetailBlock>
        <DetailBlock title="Gender">
          <ShareBars rows={audience.genders} label="Followers by gender" />
        </DetailBlock>
      </div>
      <div className={cardPair}>
        <DetailBlock title="Top locations">
          <ShareBars rows={audience.locations} label="Followers by country" />
        </DetailBlock>
        <DetailBlock title="Audience interests">
          <ul className="flex flex-wrap gap-2">
            {audience.interests.map((interest) => (
              <li key={interest} className="flex">
                <Token startIcon={Sparkles}>{interest}</Token>
              </li>
            ))}
          </ul>
        </DetailBlock>
      </div>
    </div>
  )
}

const postDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/**
 * `_Creator Post Card Content` (`40005955:24023`) in a Card: the photo, a
 * two-line caption, network and format, and likes, comments and views. A plain
 * Card rather than the file's Clickable Card, because a creator's post has
 * nowhere to open to yet (FINDINGS 88).
 */
function PostCard({ post }: { post: CreatorPost }) {
  const day = new Date()
  day.setDate(day.getDate() - post.daysAgo)
  const stats = [
    { icon: Heart, label: 'Likes', value: post.likes },
    { icon: MessageCircle, label: 'Comments', value: post.comments },
    { icon: Eye, label: 'Views', value: post.views },
  ]
  return (
    <Card className="h-full gap-2">
      <img src={post.photo} alt="" className="h-40 w-full rounded-sm object-cover" />
      <div className="flex flex-col gap-2 px-2 pt-1">
        <Text weight="semibold" color="emphasized" className="line-clamp-2">
          {post.caption}
        </Text>
        <span className="flex items-center gap-1.5 text-content-subtle">
          <NetworkIcon network={post.network} size="small" />
          <Text render={<span />} size="sm" color="subtle">
            {post.format} · {postDay.format(day)}
          </Text>
        </span>
        <span className="flex flex-wrap items-center gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <span key={label} className="flex items-center gap-1">
              <Icon aria-hidden size={14} strokeWidth={1.5} className="text-content-primary" />
              <Text render={<span />} mono color="subtle">
                <span className="sr-only">{label} </span>
                {formatCount(value)}
              </Text>
            </span>
          ))}
        </span>
      </div>
    </Card>
  )
}

/** Content (`Full View / Content`, `40005955:24767`): what they post, and how it does. */
export function ContentTab({ creator }: { creator: Creator }) {
  const content = contentFor(creator)
  return (
    <div className={tabBody}>
      <MetricGrid columns={2}>
        <MetricCard label="Posts (30 days)" value={String(content.posts)} />
        <MetricCard label="Avg. likes" value={formatCount(content.likes)} />
        <MetricCard label="Avg. comments" value={formatCount(content.comments)} />
        <MetricCard label="Avg. views" value={formatCount(content.views)} />
      </MetricGrid>
      <DetailBlock title="Top posts (30 days)">
        <ul className="grid grid-cols-1 gap-3 @min-[560px]/creator:grid-cols-3">
          {content.top.map((post) => (
            <li key={post.caption} className="flex">
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </DetailBlock>
      <div className={cardPair}>
        <DetailBlock title="Content format">
          <ShareBars rows={content.formats} label="Posts by format" />
        </DetailBlock>
        <DetailBlock title="Posts by channel">
          <ShareBars rows={content.channels} label="Posts by channel" />
        </DetailBlock>
      </div>
    </div>
  )
}

const SIMILAR_SORTS = [
  { value: 'overlap', label: 'Audience overlap' },
  { value: 'fit', label: 'Brand fit' },
  { value: 'followers', label: 'Audience size' },
]

/**
 * Similar (`Full View / Similar`, `40005955:75412`): the six creators whose
 * audiences overlap most, as the grid's cards, under Creators' own Sort by row.
 * Opening one is the caller's: the panel swaps to them, the full view goes to
 * theirs.
 */
export function SimilarTab({
  creator,
  onOpen,
}: {
  creator: Creator
  onOpen: (creatorId: string) => void
}) {
  const [sort, setSort] = useState('overlap')
  const similar = similarCreators(creator)
  const sorted =
    sort === 'overlap'
      ? similar
      : [...similar].sort((a, b) => (sort === 'fit' ? b.fit - a.fit : b.followers - a.followers))
  return (
    <div className={tabBody}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Text render={<span />} size="sm" color="subtle">
            Sort by
          </Text>
          <Select
            size="small"
            hug
            aria-label="Sort similar creators"
            value={sort}
            onValueChange={(value) => setSort(String(value))}
            items={SIMILAR_SORTS}
          >
            {SIMILAR_SORTS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select>
        </div>
        <Text render={<span />} size="sm" color="subtle">
          {similar.length} creators
        </Text>
      </div>
      <ul
        aria-label={`Creators like ${creator.name}`}
        className="grid grid-cols-1 gap-3 @min-[480px]/creator:grid-cols-2 @min-[720px]/creator:grid-cols-3"
      >
        {sorted.map((other) => (
          <li
            key={other.id}
            className="flex"
            title={`${audienceOverlap(creator, other)}% audience overlap`}
          >
            <CreatorCard creator={other} onClick={() => onOpen(other.id)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The creator's portrait, name, location and handle: the top of the panel and of the full view's Overview column. */
export function CreatorHeading({ creator }: { creator: Creator }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="large" name={creator.name} src={creator.avatar} alt="" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Heading level={2} size="lg" weight="semibold" color="emphasized" truncate>
          {creator.name}
        </Heading>
        <Text size="sm" color="subtle" truncate>
          {creator.location} · @{creator.handle}
        </Text>
      </div>
    </div>
  )
}

/**
 * Creator details (`40005911:35788`, the `Creator Details Panel`): who the
 * creator is, how well they fit the brand, and what they post about. A
 * `Panel`, as post detail is, because the grid stays live beside it and the
 * next card opens in its place. Expand opens the same creator in the full view
 * (`40005952:23519`) on the tab you were reading, or Audience from Overview,
 * which the full view always shows.
 */
export function CreatorDetailPanel({
  creatorId,
  tab: requestedTab,
  open,
  onClose,
}: {
  /** Kept after closing so the panel slides out with its content. */
  creatorId?: string
  /** The tab to open on, when the full view collapses back to the panel. */
  tab?: DetailTab
  open: boolean
  onClose: () => void
}) {
  const shell = useShell()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState<DetailTab>('overview')
  // Each opening starts on the requested tab, or Overview. Switching creators
  // while it is open keeps the tab, so Similar can walk from one to the next.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setTab(requestedTab ?? 'overview')
  }

  const creator = creatorId ? creatorById(creatorId) : undefined
  if (!creator) return null

  const expand = () => {
    navigate(
      creatorPath(
        creator.id,
        tab === 'overview' ? 'audience' : tab,
        location.pathname + location.search,
      ),
    )
  }

  return (
    <Panel
      aria-label="Creator details"
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      <Panel.Header
        closeButton
        actions={
          <Button appearance="ghost" startIcon={Fullscreen} aria-label="Expand" onClick={expand} />
        }
      >
        Creator details
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <CreatorHeading creator={creator} />

        <Tabs value={tab} onValueChange={(value) => setTab(value as DetailTab)} layout="hug">
          <Tabs.List
            aria-label="Creator detail sections"
            className="sticky top-0 z-1 bg-surface-background-primary py-1"
          >
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="audience">Audience</Tabs.Tab>
            <Tabs.Tab value="content">Content</Tabs.Tab>
            <Tabs.Tab value="similar">Similar</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="overview" className="pt-4">
            <OverviewTab creator={creator} />
          </Tabs.Panel>
          <Tabs.Panel value="audience" className="pt-4">
            <AudienceTab creator={creator} />
          </Tabs.Panel>
          <Tabs.Panel value="content" className="pt-4">
            <ContentTab creator={creator} />
          </Tabs.Panel>
          <Tabs.Panel value="similar" className="pt-4">
            <SimilarTab
              creator={creator}
              onOpen={(id) => shell.setPanel({ type: 'creator', creatorId: id })}
            />
          </Tabs.Panel>
        </Tabs>
      </Panel.Body>
      <Panel.Footer className="flex items-center justify-between pt-4">
        <CreatorActions />
      </Panel.Footer>
    </Panel>
  )
}

/**
 * Open profile and Add to campaign: the panel's footer, and the full view's
 * top bar, where the file moved them. Both are toasts — profiles and Campaigns
 * have no design.
 */
export function CreatorActions() {
  const shell = useShell()
  return (
    <>
      <Button
        appearance="ghost"
        startIcon={ExternalLink}
        aria-label="Open profile"
        onClick={() => shell.notBuilt('Creator profiles')}
      />
      <Button appearance="primary" onClick={() => shell.notBuilt('Campaigns')}>
        Add to campaign
      </Button>
    </>
  )
}
