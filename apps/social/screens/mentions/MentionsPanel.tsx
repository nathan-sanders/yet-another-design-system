import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Heart, Inbox, MessageCircle, MessagesSquare, Repeat2, UserRound } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Divider } from '../../../../src/components/Divider'
import { Icon } from '../../../../src/components/Icon'
import { Panel } from '../../../../src/components/Panel'
import { Select } from '../../../../src/components/Select'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { InboxComment } from '../../components/InboxComment'
import { MentionCard, MentionReplyForm } from '../../components/MentionCard'
import { NetworkIcon } from '../../components/NetworkIcon'
import { SentimentGlyph } from '../../components/TicketMeta'
import { creatorById } from '../../data/creators'
import { customerFor } from '../../data/inbox'
import { mentionAge, mentionEngagement, mentionsFor, type MentionQuery } from '../../data/mentions'
import { profiles } from '../../data/posts'
import type { Mention, MentionReply, MentionSentiment, Network } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useInbox } from '../inbox/inboxState'
import { formatCount } from '../reports/model'

/** How many rows a page of the list shows; Load more adds as many again. */
const PAGE = 20

type SortKey = 'recent' | 'engagement'

const SENTIMENT_LABEL: Record<MentionSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

const NETWORK_LABEL: Record<Network, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  threads: 'Threads',
  reddit: 'Reddit',
  tiktok: 'TikTok',
  bluesky: 'Bluesky',
}

const SORT_ITEMS = [
  { value: 'recent', label: 'Newest' },
  { value: 'engagement', label: 'Most engagement' },
]

/** Yak's one-line summary for a ticket opened from a mention, as the inbox's are written. */
function subjectFor(mention: Mention): string {
  if (mention.sentiment === 'positive') return `Praises ${mention.topic}`
  if (mention.sentiment === 'negative') return `Criticizes ${mention.topic}`
  return `Mentions ${mention.topic}`
}

/** The brand account a reply goes out from: the one on the mention's network, else the first. */
function replyAccountFor(mention: Mention): string {
  return (profiles.find((p) => p.network === mention.network) ?? profiles[0]!).id
}

/**
 * The messages behind a number on Measure: every Discover data point and
 * every report widget's "View messages" opens it (Nathan, 2026-10-19). A list
 * of `MentionCard`s you can filter by sentiment and network and sort, with a
 * page at a time; a card opens its detail as a `Panel` written inside this
 * one, so it stacks 12px in, as Yak's History does.
 *
 * Likes and replies made here are held by this panel, which the shell always
 * renders: they survive a filter change, closing the detail, and opening
 * another list. "Open in Engage" makes the mention a ticket — once — and goes
 * to it. Code-first; nothing in the file draws this panel.
 */
export function MentionsPanel({
  open,
  query,
  onClose,
}: {
  open: boolean
  /** The last query opened, kept while the panel slides shut. */
  query?: MentionQuery
  onClose: () => void
}) {
  const shell = useShell()
  const inbox = useInbox()
  const navigate = useNavigate()
  const toast = Toast.useToast()

  const [liked, setLiked] = useState<ReadonlySet<string>>(new Set())
  const [sent, setSent] = useState<Record<string, MentionReply[]>>({})
  const [sentiment, setSentiment] = useState<MentionSentiment | 'all'>('all')
  const [network, setNetwork] = useState<Network | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('recent')
  const [shown, setShown] = useState(PAGE)
  const [detailId, setDetailId] = useState<string>()
  const [detailOpen, setDetailOpen] = useState(false)

  // A new list starts unfiltered, at the top, with no detail open.
  const [lastKey, setLastKey] = useState(query?.key)
  if (query?.key !== lastKey) {
    setLastKey(query?.key)
    setSentiment('all')
    setNetwork('all')
    setSort('recent')
    setShown(PAGE)
    setDetailOpen(false)
  }

  if (!query) return null

  const sample = mentionsFor(query)
  const networks = [...new Set(sample.map((m) => m.network))].sort()
  const filtered = sample
    .filter((m) => sentiment === 'all' || m.sentiment === sentiment)
    .filter((m) => network === 'all' || m.network === network)
  const sorted =
    sort === 'engagement'
      ? [...filtered].sort((a, b) => mentionEngagement(b) - mentionEngagement(a))
      : filtered
  const visible = sorted.slice(0, shown)
  const filtering = sentiment !== 'all' || network !== 'all'
  const creator = query.creatorId ? creatorById(query.creatorId) : undefined
  const detail = sample.find((m) => m.id === detailId)

  const toggleLike = (id: string) =>
    setLiked((all) => {
      const next = new Set(all)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const reply = (mention: Mention, body: string) =>
    setSent((all) => ({
      ...all,
      [mention.id]: [
        ...(all[mention.id] ?? []),
        {
          id: `${mention.id}-sent-${Date.now()}`,
          authorId: replyAccountFor(mention),
          body,
          hoursAgo: 0,
        },
      ],
    }))

  const ticketFor = (mention: Mention) => inbox.tickets.find((t) => t.mentionId === mention.id)

  const openInEngage = (mention: Mention) => {
    let number = ticketFor(mention)?.number
    if (!number) {
      number = inbox.addTicket({
        customerId: mention.authorId,
        network: mention.network,
        subject: subjectFor(mention),
        body: mention.body,
        ago: mentionAge(mention.hoursAgo),
        status: 'new',
        priority: mention.sentiment === 'negative' ? 'medium' : 'low',
        sentiment: mention.sentiment,
        photo: mention.photo,
        mentionId: mention.id,
        note: `Opened from Measure · ${query.title}`,
      })
      toast.add({ title: `Added to Engage as #${number}` })
    }
    // Leaving Measure closes the panel, as leaving any screen closes its panel.
    navigate(`/engage/all?message=${number}`)
  }

  const openDetail = (mention: Mention) => {
    if (detailOpen && detailId === mention.id) {
      setDetailOpen(false)
      return
    }
    setDetailId(mention.id)
    setDetailOpen(true)
  }

  const countLine = filtering
    ? `Showing ${visible.length} of ${filtered.length} matching${
        sample.length < query.total ? `, from the latest ${sample.length}` : ''
      }`
    : visible.length < sample.length
      ? `Showing ${visible.length} of ${formatCount(query.total)} ${query.noun}`
      : sample.length < query.total
        ? `Showing the latest ${sample.length} of ${formatCount(query.total)} ${query.noun}`
        : `Showing all ${sample.length} ${query.noun}`

  return (
    <Panel
      aria-label={`Messages: ${query.title}`}
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      <Panel.Header
        icon={MessagesSquare}
        closeButton
        actions={
          creator ? (
            <Button
              appearance="ghost"
              startIcon={UserRound}
              aria-label={`View ${creator.name}'s profile`}
              onClick={() => shell.setPanel({ type: 'creator', creatorId: creator.id })}
            />
          ) : undefined
        }
      >
        {query.title}
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <Text size="sm" color="subtle">
          {formatCount(query.total)} {query.noun} · {query.context}
        </Text>

        <div className="flex flex-wrap items-center gap-2">
          {query.sentiment ? null : (
            <Select
              size="small"
              hug
              aria-label="Sentiment"
              value={sentiment}
              onValueChange={(value) => {
                setSentiment(value as MentionSentiment | 'all')
                setShown(PAGE)
              }}
              items={[
                { value: 'all', label: 'All sentiment' },
                ...Object.entries(SENTIMENT_LABEL).map(([value, label]) => ({ value, label })),
              ]}
            >
              <Select.Item value="all">All sentiment</Select.Item>
              {Object.entries(SENTIMENT_LABEL).map(([value, label]) => (
                <Select.Item key={value} value={value}>
                  {label}
                </Select.Item>
              ))}
            </Select>
          )}
          <Select
            size="small"
            hug
            aria-label="Network"
            value={network}
            onValueChange={(value) => {
              setNetwork(value as Network | 'all')
              setShown(PAGE)
            }}
            items={[
              { value: 'all', label: 'All networks' },
              ...networks.map((n) => ({ value: n, label: NETWORK_LABEL[n] })),
            ]}
          >
            <Select.Item value="all">All networks</Select.Item>
            {networks.map((n) => (
              <Select.Item key={n} value={n}>
                {NETWORK_LABEL[n]}
              </Select.Item>
            ))}
          </Select>
          <Select
            size="small"
            hug
            aria-label="Sort by"
            value={sort}
            onValueChange={(value) => setSort(value as SortKey)}
            items={SORT_ITEMS}
          >
            {SORT_ITEMS.map((item) => (
              <Select.Item key={item.value} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select>
        </div>

        {visible.length === 0 ? (
          <Text color="subtle">Nothing matches these filters.</Text>
        ) : (
          <ul aria-label={query.title} className="flex flex-col gap-2">
            {visible.map((mention) => (
              <li key={mention.id}>
                <MentionCard
                  mention={mention}
                  liked={liked.has(mention.id)}
                  sent={sent[mention.id] ?? []}
                  selected={detailOpen && detailId === mention.id}
                  inEngage={!!ticketFor(mention)}
                  onToggleLike={() => toggleLike(mention.id)}
                  onReply={(body) => reply(mention, body)}
                  onOpen={() => openDetail(mention)}
                  onOpenInEngage={() => openInEngage(mention)}
                  onNotBuilt={shell.notBuilt}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col items-center gap-2 pb-2">
          <Text size="sm" color="subtle" aria-live="polite">
            {countLine}
          </Text>
          {visible.length < sorted.length ? (
            <Button appearance="secondary" onClick={() => setShown((n) => n + PAGE)}>
              Load more
            </Button>
          ) : null}
        </div>

        {detail ? (
          <MentionDetail
            mention={detail}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            liked={liked.has(detail.id)}
            sent={sent[detail.id] ?? []}
            inEngage={!!ticketFor(detail)}
            onToggleLike={() => toggleLike(detail.id)}
            onReply={(body) => reply(detail, body)}
            onOpenInEngage={() => openInEngage(detail)}
            onNotBuilt={shell.notBuilt}
          />
        ) : null}
      </Panel.Body>
    </Panel>
  )
}

/**
 * One mention, whole: the post and its photo, Yak's read, what it counts
 * toward, its numbers, and every reply under it with a field to add yours.
 * A `Panel` inside the list's, so it stacks over it.
 */
function MentionDetail({
  mention,
  open,
  onOpenChange,
  liked,
  sent,
  inEngage,
  onToggleLike,
  onReply,
  onOpenInEngage,
  onNotBuilt,
}: {
  mention: Mention
  open: boolean
  onOpenChange: (open: boolean) => void
  liked: boolean
  sent: MentionReply[]
  inEngage: boolean
  onToggleLike: () => void
  onReply: (body: string) => void
  onOpenInEngage: () => void
  onNotBuilt: (what: string) => void
}) {
  const author = customerFor(mention.authorId)
  const replies = [...mention.thread, ...sent]
  const likes = mention.likes + (liked ? 1 : 0)
  return (
    <Panel aria-label="Message" open={open} onOpenChange={onOpenChange}>
      <Panel.Header
        closeButton
        actions={
          <>
            <Button
              appearance="ghost"
              startIcon={Heart}
              aria-pressed={liked}
              aria-label={liked ? 'Unlike' : 'Like'}
              onClick={onToggleLike}
              className={
                liked ? '[&_svg]:fill-current [&_svg]:text-decorative-red-highlight' : undefined
              }
            />
            <Button
              appearance="ghost"
              startIcon={Inbox}
              aria-label={inEngage ? 'View in Engage' : 'Open in Engage'}
              onClick={onOpenInEngage}
            />
          </>
        }
      >
        Message
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={author.name ?? author.handle} src={author.avatar} alt="" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Text weight="semibold" color="emphasized" truncate>
              {author.name ?? author.handle}
            </Text>
            <span className="flex min-w-0 items-center gap-1">
              <NetworkIcon network={mention.network} />
              <Text render={<span />} size="sm" color="subtle" truncate>
                {author.handle} · {mentionAge(mention.hoursAgo)} ago
              </Text>
            </span>
          </div>
        </div>

        <Text className="whitespace-pre-line">{mention.body}</Text>
        {mention.photo ? (
          <img src={mention.photo} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1">
            <SentimentGlyph sentiment={mention.sentiment} />
            <Text render={<span />}>{SENTIMENT_LABEL[mention.sentiment]}</Text>
          </span>
          <Badge>{mention.topic}</Badge>
        </div>

        <dl className="flex items-center gap-4">
          {(
            [
              [Heart, 'Likes', likes],
              [MessageCircle, 'Replies', replies.length],
              [Repeat2, 'Shares', mention.shares],
            ] as const
          ).map(([icon, label, value]) => (
            <div key={label} className="flex items-center gap-1 text-content-subtle">
              <dt>
                <Icon icon={icon} size="small" label={label} />
              </dt>
              <Text render={<dd />} mono>
                {formatCount(value)}
              </Text>
            </div>
          ))}
        </dl>

        <Divider />

        <section aria-label="Replies" className="flex flex-col gap-3">
          <Heading level={3} size="base" weight="semibold">
            Replies
          </Heading>
          {replies.length === 0 ? (
            <Text color="subtle">No replies yet.</Text>
          ) : (
            <ul className="flex flex-col gap-3">
              {replies.map((r) => (
                <li key={r.id}>
                  <InboxComment
                    authorId={r.authorId}
                    ago={mentionAge(r.hoursAgo)}
                    onMore={() => onNotBuilt('Reply actions')}
                  >
                    {r.body}
                  </InboxComment>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Panel.Body>
      <Panel.Footer>
        <MentionReplyForm handle={author.handle} onSend={onReply} />
      </Panel.Footer>
    </Panel>
  )
}
