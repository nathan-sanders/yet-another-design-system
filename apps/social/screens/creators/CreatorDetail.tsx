import { useState, type CSSProperties, type ReactNode } from 'react'
import {
  ExternalLink,
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
import { HorizontalBar } from '../../../../src/components/HorizontalBar'
import { Metric } from '../../../../src/components/Metric'
import { Panel } from '../../../../src/components/Panel'
import { Tabs } from '../../../../src/components/Tabs'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { CreatorCard } from '../../components/CreatorCard'
import { NetworkIcon } from '../../components/NetworkIcon'
import {
  audienceFor,
  creatorById,
  fitColor,
  fitLabel,
  similarCreators,
  type Creator,
} from '../../data/creators'
import { seeded } from '../../data/performance'
import { useShell } from '../../shell/ShellContext'
import { formatCount } from '../reports/model'

type DetailTab = 'overview' | 'audience' | 'content' | 'similar'

/**
 * One of Overview's cards: a 12px-padded `Card` with a small subtle label over
 * its value, as every card in the file is drawn. The label is an `h3` under
 * the creator's name, so a screen reader can walk the cards.
 */
function DetailCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card className="gap-2">
      <Heading level={3} size="sm" weight="normal" color="subtle">
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

function OverviewTab({ creator }: { creator: Creator }) {
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

/** Code-first: Figma draws no Audience tab. */
function AudienceTab({ creator }: { creator: Creator }) {
  const audience = audienceFor(creator)
  return (
    <div className="flex flex-col gap-4">
      <DetailCard label="Gender">
        <div className="flex gap-6">
          <Metric label="Women" value={`${audience.women}%`} />
          <Metric label="Men" value={`${audience.men}%`} />
        </div>
      </DetailCard>
      <DetailCard label="Age">
        <HorizontalBar
          data={audience.ages}
          yKey="band"
          series={[{ key: 'share', label: 'Share of followers (%)' }]}
          label={`${creator.name}'s followers by age`}
          legend={false}
        />
      </DetailCard>
      <DetailCard label="Top cities">
        <ul className="flex flex-col gap-2">
          {audience.cities.map((city) => (
            <li key={city.city} className="flex items-center gap-2">
              <Text render={<span />} size="sm" className="min-w-0 flex-1" truncate>
                {city.city}
              </Text>
              <Text render={<span />} size="sm" mono>
                {city.share}%
              </Text>
            </li>
          ))}
        </ul>
      </DetailCard>
    </div>
  )
}

/**
 * Code-first: Figma draws no Content tab. The same four posts the card scrolls
 * through, newest first, with seeded likes and comments.
 */
function ContentTab({ creator }: { creator: Creator }) {
  const random = seeded(`${creator.id}-content`)
  const photos = creator.posts
  const reach = creator.followers * (creator.engagement / 100)
  return (
    <ul aria-label="Recent posts" className="grid grid-cols-2 gap-3">
      {photos.map((photo, i) => {
        const likes = Math.round(reach * (0.6 + random() * 0.8))
        const comments = Math.round(likes * (0.02 + random() * 0.03))
        return (
          <li key={photo} className="flex flex-col gap-1">
            <img
              src={photo}
              alt={`Recent post ${i + 1}`}
              className="aspect-square w-full rounded-sm object-cover"
            />
            <span className="flex items-center gap-3 text-content-subtle">
              <span className="flex items-center gap-1">
                <Heart aria-hidden size={14} strokeWidth={1.5} />
                <Text render={<span />} size="sm" mono color="subtle">
                  <span className="sr-only">Likes </span>
                  {formatCount(likes)}
                </Text>
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle aria-hidden size={14} strokeWidth={1.5} />
                <Text render={<span />} size="sm" mono color="subtle">
                  <span className="sr-only">Comments </span>
                  {formatCount(comments)}
                </Text>
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** Code-first: the three nearest creators, as the grid's cards. One swaps the panel to them. */
function SimilarTab({ creator }: { creator: Creator }) {
  const shell = useShell()
  return (
    <ul aria-label={`Creators like ${creator.name}`} className="flex flex-col gap-3">
      {similarCreators(creator).map((other) => (
        <li key={other.id} className="flex">
          <CreatorCard
            creator={other}
            onClick={() => shell.setPanel({ type: 'creator', creatorId: other.id })}
          />
        </li>
      ))}
    </ul>
  )
}

/**
 * Creator details (`40005911:35788`, the `Creator Details Panel`): who the
 * creator is, how well they fit the brand, and what they post about. A
 * `Panel`, as post detail is, because the grid stays live beside it and the
 * next card opens in its place. Only Overview is drawn; Audience, Content and
 * Similar are code-first (FINDINGS).
 */
export function CreatorDetailPanel({
  creatorId,
  open,
  onClose,
}: {
  /** Kept after closing so the panel slides out with its content. */
  creatorId?: string
  open: boolean
  onClose: () => void
}) {
  const shell = useShell()
  const [tab, setTab] = useState<DetailTab>('overview')

  const creator = creatorId ? creatorById(creatorId) : undefined
  if (!creator) return null

  return (
    <Panel
      aria-label="Creator details"
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      <Panel.Header closeButton>Creator details</Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
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
            <SimilarTab creator={creator} />
          </Tabs.Panel>
        </Tabs>
      </Panel.Body>
      <Panel.Footer className="flex items-center justify-between pt-4">
        <Button
          appearance="ghost"
          startIcon={ExternalLink}
          aria-label="Open profile"
          onClick={() => shell.notBuilt('Creator profiles')}
        />
        <Button appearance="primary" onClick={() => shell.notBuilt('Campaigns')}>
          Add to campaign
        </Button>
      </Panel.Footer>
    </Panel>
  )
}
