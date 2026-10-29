import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { MessageCircle, RefreshCw } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Divider } from '../../../../src/components/Divider'
import { Metric, MetricGrid } from '../../../../src/components/Metric'
import { ProgressBar } from '../../../../src/components/ProgressBar'
import { Skeleton } from '../../../../src/components/Skeleton'
import { Heading, Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { focusRing } from '../../../../src/lib/focus'
import { cn } from '../../../../src/lib/cn'
import { folders } from '../../data/assets'
import { creatorById } from '../../data/creators'
import type { Campaign, CampaignTarget } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useYakChat } from '../../yak/chat'
import { YakMark } from '../../yak/YakMark'
import { assetsIn } from '../assets/model'
import { useAssets } from '../assets/assetsState'
import { useSchedule } from '../calendar/scheduleState'
import {
  askAbout,
  campaignPosts,
  compactCount,
  NEXT_UP_TOKEN,
  nextUpFor,
  progressFor,
  summaryFor,
  type NextUpItem,
} from './model'

const nextUpDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

/**
 * A campaign's Overview tab (`40006129:38303`): Yak's summary, then Progress,
 * Targets, Next up and the Brief, each a Content Block. Every number is
 * counted from the schedule, the campaign and its asset folder, so a post
 * moved on the calendar moves here too. The blocks a campaign has nothing for
 * say so rather than disappear, so every campaign's page has the same shape.
 */
export function CampaignOverview({
  campaign,
  onShowPlan,
}: {
  campaign: Campaign
  /** Next up's gap rows open the Plan tab, where the gap is. */
  onShowPlan: () => void
}) {
  const shell = useShell()
  const { posts } = useSchedule()
  const { assets } = useAssets()
  const planned = campaignPosts(campaign, posts)
  const progress = progressFor(campaign, planned)
  const folder = folders.find((f) => f.campaignId === campaign.id)
  const assetsReady = folder
    ? assetsIn({ folderId: folder.id }, assets, folders, new Map(), new Date()).filter(
        (a) => !a.upload,
      ).length
    : 0
  const next = nextUpFor(campaign, planned, (id) => creatorById(id)?.name ?? id)

  const open = (item: NextUpItem) => {
    if (item.kind === 'post') shell.setPanel({ type: 'post', postId: item.postId })
    else if (item.kind === 'deliverable')
      shell.setPanel({ type: 'creator', creatorId: item.creatorId })
    else onShowPlan()
  }

  return (
    <div className="flex flex-col gap-3">
      <YakSummary campaign={campaign} lines={summaryFor(campaign, planned)} />

      <Block title="Progress">
        <MetricGrid columns={3}>
          <MetricTile label="Posts planned" value={progress.planned} />
          <MetricTile
            label="Creators confirmed"
            value={
              progress.creators === 0
                ? 'None yet'
                : `${progress.creatorsOnBoard} of ${progress.creators}`
            }
          />
          <MetricTile label="Scheduled" value={progress.scheduled} />
          <MetricTile label="Assets ready" value={assetsReady} />
          <MetricTile label="Published" value={progress.published} />
          <MetricTile label="Gaps this week" value={progress.gaps} />
        </MetricGrid>
      </Block>

      <Block title="Targets">
        <Targets campaign={campaign} />
      </Block>

      <Block title="Next up" flush>
        {next.length === 0 ? (
          <Empty>
            {campaign.status === 'cancelled'
              ? 'Nothing is coming up: the campaign is cancelled.'
              : 'Nothing is on the plan for the days ahead.'}
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-surface-border">
            {next.map((item) => (
              <li
                key={`${item.kind}-${item.date.getTime()}`}
                className="flex items-center gap-3 py-2.5"
              >
                <Text size="sm" color="subtle" className="w-19 shrink-0">
                  {nextUpDate.format(item.date)}
                </Text>
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <button
                    type="button"
                    onClick={() => open(item)}
                    className={cn(
                      'max-w-full truncate rounded-xs text-left text-base text-content-primary hover:underline',
                      focusRing,
                    )}
                  >
                    {item.title}
                  </button>
                  <Text size="sm" color="subtle" truncate>
                    {item.meta}
                  </Text>
                </span>
                <Token size="small">{NEXT_UP_TOKEN[item.kind]}</Token>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Brief">
        <Brief campaign={campaign} />
      </Block>
    </div>
  )
}

/** A block on the page: `Content Block` with `_Content Block Header`, no actions. */
function Block({
  title,
  flush = false,
  children,
}: {
  title: string
  /** Next up: rows run on their own 10px, so no gap under the header. */
  flush?: boolean
  children: ReactNode
}) {
  return (
    <ContentBlock headingLevel={2} className="h-auto shrink-0">
      <ContentBlock.Header>{title}</ContentBlock.Header>
      <ContentBlock.Content className={flush ? 'gap-0' : undefined}>
        {children}
      </ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * The file's `Metric Card` here is a Default card, not MetricCard's Subtle one
 * (FINDINGS 187): on a white block a subtle tile would read as a well.
 */
function MetricTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card padding={3} className="h-full">
      <Metric label={label} value={value} />
    </Card>
  )
}

function TargetTile({ label, target }: { label: string; target: CampaignTarget }) {
  const share = target.actual / target.target
  return (
    <Card padding={3} className="h-full">
      <div className="flex flex-col gap-1">
        <Metric
          label={label}
          value={`${compactCount(target.actual)} of ${compactCount(target.target)}`}
        />
        <ProgressBar
          aria-label={`${label}: ${Math.round(share * 100)}% of target`}
          value={Math.min(share, 1) * 100}
          type={share >= 1 ? 'success' : 'default'}
        />
      </div>
    </Card>
  )
}

/** Reach, Engagements, Link clicks — the ones a campaign set. */
function Targets({ campaign }: { campaign: Campaign }) {
  const { reach, engagements, linkClicks } = campaign.targets ?? {}
  const tiles: { label: string; target: CampaignTarget }[] = []
  if (reach) tiles.push({ label: 'Reach', target: reach })
  if (engagements !== undefined)
    tiles.push({
      label: 'Engagements',
      target: { actual: campaign.engagements?.total ?? 0, target: engagements },
    })
  if (linkClicks) tiles.push({ label: 'Link clicks', target: linkClicks })
  if (tiles.length === 0) return <Empty>No targets set for this campaign.</Empty>
  return (
    <MetricGrid columns={3}>
      {tiles.map((t) => (
        <TargetTile key={t.label} label={t.label} target={t.target} />
      ))}
    </MetricGrid>
  )
}

function Brief({ campaign }: { campaign: Campaign }) {
  const brief = campaign.brief
  if (!brief) return <Empty>No brief written yet.</Empty>
  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-4">
        <Field label="Goal">{brief.goal}</Field>
        <Field label="Audience">{brief.audience}</Field>
        <Field label="Key message">{brief.keyMessage}</Field>
        <Field label="Hashtags">
          <Tokens values={brief.hashtags} />
        </Field>
        <Field label="Tags">
          <Tokens values={brief.tags} />
        </Field>
      </dl>
      <Divider />
      <div className="grid gap-4 sm:grid-cols-2">
        <Rules title="Do" items={brief.do} />
        <Rules title="Don't" items={brief.dont} />
      </div>
    </div>
  )
}

/** A label/value row: the 112 label column, the value beside it; stacked on a phone. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <Text render={<dt />} color="subtle" className="shrink-0 sm:w-28">
        {label}
      </Text>
      <Text render={<dd />} className="min-w-0 flex-1">
        {children}
      </Text>
    </div>
  )
}

function Tokens({ values }: { values: string[] }) {
  return (
    <span className="flex flex-wrap items-center gap-2 py-0.5">
      {values.map((v) => (
        <Token key={v} size="small">
          {v}
        </Token>
      ))}
    </span>
  )
}

function Rules({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Heading level={3} size="base" weight="semibold" color="subtle">
        {title}
      </Heading>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <Text key={item} render={<li />}>
            • {item}
          </Text>
        ))}
      </ul>
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <Text color="subtle">{children}</Text>
}

/**
 * Yak's read of the campaign (`Yak Summary`, a Subtle Card). Ask opens Yak
 * with the campaign as the question. Regenerate reads the numbers again: a
 * second of the library's Skeleton, then the same three lines unless the
 * schedule moved — honest about what a mock can do.
 */
function YakSummary({ campaign, lines }: { campaign: Campaign; lines: string[] }) {
  const shell = useShell()
  const chat = useYakChat()
  const { pathname } = useLocation()
  const [regenerating, setRegenerating] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const regenerate = () => {
    setRegenerating(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setRegenerating(false), 900)
  }

  const ask = () => {
    chat.start(askAbout(campaign), pathname)
    shell.setPanel({ type: 'yak' })
  }

  return (
    <Card emphasis="subtle" padding={3} className="shrink-0">
      <section
        aria-labelledby="yak-summary"
        aria-busy={regenerating}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <YakMark className="size-4 shrink-0 text-content-emphasized" />
          <Heading
            id="yak-summary"
            level={2}
            size="sm"
            weight="semibold"
            color="subtle"
            className="flex-1"
          >
            Yak summary
          </Heading>
          <Button
            appearance="secondary"
            size="small"
            startIcon={RefreshCw}
            disabled={regenerating}
            onClick={regenerate}
          >
            Regenerate
          </Button>
          <Button appearance="secondary" size="small" startIcon={MessageCircle} onClick={ask}>
            Ask
          </Button>
        </div>
        {regenerating
          ? lines.map((line) => <Skeleton.Text key={line} className="w-full" />)
          : lines.map((line) => <Text key={line}>{line}</Text>)}
      </section>
    </Card>
  )
}
