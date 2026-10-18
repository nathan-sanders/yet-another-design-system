import { useState } from 'react'
import {
  CalendarClock,
  CircleCheck,
  FilePlus,
  Heart,
  MessageCircle,
  MessageSquare,
  Reply,
  Send,
  Smile,
  Tag,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

import { AreaSeries } from '../../../../src/components/AreaSeries'
import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { formatCompactNumber } from '../../../../src/components/Chart'
import { Heading } from '../../../../src/components/Text'
import { HorizontalBar } from '../../../../src/components/HorizontalBar'
import { Icon } from '../../../../src/components/Icon'
import { MetricCard, MetricGrid } from '../../../../src/components/Metric'
import { Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { InboxComment } from '../../components/InboxComment'
import { AssigneeMenu, TicketMeta } from '../../components/TicketMeta'
import { personFor } from '../../data/people'
import { profileFor } from '../../data/posts'
import {
  engagementsOf,
  firstDayImpressions,
  flatten,
  statsFor,
  trendFor,
} from '../../data/performance'
import type { Post, PostEvent, PostReply, PostStats, Ticket, TicketEdit } from '../../data/types'
import { useShell } from '../../shell/ShellContext'

/**
 * The numbers under a published post's copy, as Tokens — the same row the
 * inbox's public thread draws over a brand post: sentiment, comments, likes,
 * shares, and how many comments nobody has opened.
 */
export function PostStatsRow({ stats }: { stats: PostStats }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Token startIcon={Smile}>{stats.positive}% Positive</Token>
      <Token startIcon={MessageSquare}>{stats.comments} Comments</Token>
      <Token startIcon={Heart}>{formatCompactNumber(stats.likes)} Likes</Token>
      <Token startIcon={Send}>{stats.shares} Shares</Token>
      {stats.unread ? <Token startIcon={MessageCircle}>{stats.unread} Unread</Token> : null}
    </div>
  )
}

// Comments

/**
 * The public comments under the post. Every comment is a ticket, as in the
 * inbox, so each carries `TicketMeta` and the inbox's toolbar: reply, like,
 * assign, tag, complete. Replies hang under their parent on a rule.
 */
export function CommentsTab({ post, thread }: { post: Post; thread: PostReply[] }) {
  const shell = useShell()
  const stats = statsFor(post)
  // Edits from the meta menus, per ticket, for the session.
  const [edits, setEdits] = useState<Record<string, TicketEdit>>({})
  const network = profileFor(post).network
  const shown = flatten(thread).length

  const ticketFor = (comment: PostReply): Ticket => ({
    number: comment.ticket,
    customerId: comment.authorId,
    network,
    subject: comment.body,
    body: comment.body,
    ago: comment.ago,
    status: 'new',
    priority: 'low',
    sentiment: comment.sentiment,
    postId: post.id,
    ...edits[comment.ticket],
  })

  const renderComment = (comment: PostReply) => {
    const ticket = ticketFor(comment)
    const onChange = (edit: TicketEdit) =>
      setEdits((current) => ({
        ...current,
        [ticket.number]: { ...current[ticket.number], ...edit },
      }))
    return (
      <div key={comment.id} className="flex flex-col gap-2">
        <InboxComment
          authorId={comment.authorId}
          ago={comment.ago}
          onMore={() => shell.notBuilt('Comment actions')}
        >
          {comment.body}
        </InboxComment>
        <TicketMeta ticket={ticket} onChange={onChange} className="pl-8" />
        <div className="flex items-center gap-1 pl-6">
          <Button
            appearance="ghost"
            startIcon={Reply}
            aria-label={comment.replies?.length ? undefined : 'Reply'}
            onClick={() => shell.notBuilt('Replying')}
          >
            {comment.replies?.length ? String(comment.replies.length) : undefined}
          </Button>
          <Button
            appearance="ghost"
            startIcon={Heart}
            aria-label="Like"
            onClick={() => shell.notBuilt('Likes')}
          />
          <div className="flex-1" />
          <AssigneeMenu
            ticket={ticket}
            onChange={onChange}
            trigger={<Button appearance="ghost" startIcon={UserPlus} aria-label="Assign" />}
          />
          <Button
            appearance="ghost"
            startIcon={Tag}
            aria-label="Tag"
            onClick={() => shell.notBuilt('Tagging')}
          />
          <Button
            appearance="ghost"
            startIcon={CircleCheck}
            aria-label={ticket.status === 'complete' ? 'Completed' : 'Complete'}
            aria-pressed={ticket.status === 'complete'}
            onClick={() =>
              onChange({
                status: ticket.status === 'complete' ? 'new' : 'complete',
              })
            }
          />
        </div>
        {comment.replies?.length ? (
          <div className="ml-3 flex flex-col gap-4 border-l border-surface-border pt-2 pl-4">
            {comment.replies.map(renderComment)}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Text size="sm" color="subtle">
          Showing {shown} of {stats.comments} comments
        </Text>
        <Button appearance="ghost" size="small" onClick={() => shell.notBuilt('Bulk edit')}>
          Bulk edit
        </Button>
      </div>
      {thread.length ? (
        <div role="log" aria-label="Comments" className="flex flex-col gap-6">
          {thread.map(renderComment)}
        </div>
      ) : (
        <Text size="sm" color="subtle" className="text-center">
          No comments yet.
        </Text>
      )}
    </div>
  )
}

// Activity

const EVENT_ICON: Record<PostEvent['kind'], LucideIcon> = {
  created: FilePlus,
  note: MessageSquare,
  approved: CircleCheck,
  scheduled: CalendarClock,
  published: Send,
  comment: MessageCircle,
  milestone: TrendingUp,
  assigned: UserPlus,
}

const eventTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/**
 * Everything that happened to the post, oldest first, on a rule: the team's
 * steps carry the person's face, the system's and the audience's an icon.
 */
export function ActivityTab({ events }: { events: PostEvent[] }) {
  return (
    <ol aria-label="Activity" className="flex flex-col">
      {events.map((event, i) => {
        const actor = event.actorId ? personFor(event.actorId) : undefined
        const last = i === events.length - 1
        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {actor ? (
                <Avatar name={actor.name} src={actor.avatar} alt="" size="small" />
              ) : (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-background-emphasized text-content-inverse">
                  <Icon icon={EVENT_ICON[event.kind]} size="small" />
                </span>
              )}
              {last ? null : <span aria-hidden className="w-px flex-1 bg-surface-border" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-5">
              <Text>
                {actor ? (
                  <Text render={<span />} weight="semibold" color="emphasized">
                    {actor.name}{' '}
                  </Text>
                ) : null}
                {event.text}
              </Text>
              <Text size="sm" color="subtle">
                {eventTime.format(event.at)}
              </Text>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// Measure

/** The charts default to UTC; the calendar is in local time, so the axis is too. */
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const percent = (value: number) => `${value.toFixed(1)}%`

/**
 * What the post did, on the library's data viz: a two-up grid of
 * `MetricCard`s against the account's average post, impressions over its
 * first day, and where the engagements came from.
 */
export function MeasureTab({ post }: { post: Post }) {
  const stats = statsFor(post)
  const engagements = engagementsOf(stats)
  const breakdown = [
    { kind: 'Likes', count: stats.likes },
    { kind: 'Saves', count: stats.saves },
    { kind: 'Shares', count: stats.shares },
    { kind: 'Comments', count: stats.comments },
    { kind: 'Link clicks', count: stats.clicks },
  ].sort((a, b) => b.count - a.count)

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="perf-overview" className="flex flex-col gap-3">
        <Heading level={3} size="base" id="perf-overview">
          Compared with your average post
        </Heading>
        <MetricGrid columns={2}>
          <MetricCard
            label="Impressions"
            value={stats.impressions.toLocaleString('en-US')}
            trend={trendFor(post, 'impressions')}
          />
          <MetricCard
            label="Reach"
            value={stats.reach.toLocaleString('en-US')}
            trend={trendFor(post, 'reach')}
          />
          <MetricCard
            label="Engagements"
            value={engagements.toLocaleString('en-US')}
            trend={trendFor(post, 'engagements')}
          />
          <MetricCard
            label="Engagement rate"
            value={percent((engagements / stats.impressions) * 100)}
            trend={trendFor(post, 'rate')}
          />
          <MetricCard
            label="Link clicks"
            value={stats.clicks.toLocaleString('en-US')}
            trend={trendFor(post, 'clicks')}
          />
          <MetricCard label="Positive sentiment" value={`${stats.positive}%`} />
        </MetricGrid>
      </section>

      <section aria-labelledby="perf-first-day" className="flex flex-col gap-3">
        <Heading level={3} size="base" id="perf-first-day">
          Impressions, first 24 hours
        </Heading>
        <AreaSeries
          data={firstDayImpressions(post)}
          xKey="date"
          series={[{ key: 'impressions', label: 'Impressions' }]}
          label="Impressions per hour over the post's first 24 hours"
          height={180}
          legend={false}
          xPreset="hours"
          timeZone={localZone}
          yLines={4}
        />
      </section>

      <section aria-labelledby="perf-breakdown" className="flex flex-col gap-3">
        <Heading level={3} size="base" id="perf-breakdown">
          Engagement breakdown
        </Heading>
        <HorizontalBar
          data={breakdown}
          yKey="kind"
          series={[{ key: 'count', label: 'Engagements' }]}
          label="Engagements by kind"
          legend={false}
        />
      </section>
    </div>
  )
}
