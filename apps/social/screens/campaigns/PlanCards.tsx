import { Lightbulb, Plus, Tag } from 'lucide-react'

import { Badge } from '../../../../src/components/Badge'
import { ClickableCard } from '../../../../src/components/Card'
import { Icon } from '../../../../src/components/Icon'
import { Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { focusRing } from '../../../../src/lib/focus'
import { cn } from '../../../../src/lib/cn'
import { NetworkIcon } from '../../components/NetworkIcon'
import type { Draft } from '../../data/drafts'
import { formatTime } from '../../data/dates'
import { profiles } from '../../data/posts'
import type { CreatorWork, Idea, Network } from '../../data/types'

// The Plan tab's cards (`40006158:66912`), each `_Calendar Post Content` in a
// `Clickable Card` as the week view's are. A scheduled post is the calendar's
// own `CalendarPostCard`; these are the kinds only a campaign's plan has. The
// file's `_Plan Cell` set (`40006136:38900`) names all five.

/** Network, account, time: `_Calendar Post Content`'s header. */
function Header({ network, account, time }: { network: Network; account: string; time?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <NetworkIcon network={network} />
      <Text
        render={<span />}
        size="sm"
        weight="semibold"
        color="emphasized"
        truncate
        className="min-w-0 flex-1"
      >
        {account}
      </Text>
      {time && (
        <Text render={<span />} size="sm" color="subtle" className="shrink-0">
          {formatTime(time)}
        </Text>
      )}
    </div>
  )
}

function Body({ children }: { children: string }) {
  return (
    <Text size="sm" truncate={2}>
      {children}
    </Text>
  )
}

function Thumbnail({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null
  return <img src={src} alt={alt ?? ''} className="size-12 rounded-md object-cover" />
}

/** A draft pencilled onto a day: dashed, because it isn't scheduled (Kind=Draft). */
export function PlanDraftCard({ draft, onOpen }: { draft: Draft; onOpen: () => void }) {
  const profile = profiles.find((p) => p.id === draft.profileId)!
  return (
    <ClickableCard
      onClick={onOpen}
      className="w-full border-dashed"
      aria-label={`Draft, ${profile.name}: ${draft.body}`}
    >
      <div className="flex w-full min-w-0 flex-col items-start gap-2 text-left">
        <Badge color="neutral">Draft</Badge>
        <div className="w-full">
          <Header network={profile.network} account={profile.name} />
        </div>
        <Body>{draft.body}</Body>
        <Thumbnail src={draft.photo} alt={draft.photoAlt} />
        {draft.tagNames && draft.tagNames.length > 0 && (
          <Token startIcon={Tag} aria-label={`${draft.tagNames.length} tags`}>
            {draft.tagNames.length}
          </Token>
        )}
      </div>
    </ClickableCard>
  )
}

/** An idea pencilled onto a channel's day (Kind=Idea). */
export function PlanIdeaCard({ idea, onOpen }: { idea: Idea; onOpen: () => void }) {
  return (
    <ClickableCard
      onClick={onOpen}
      className="w-full border-dashed"
      aria-label={`Idea: ${idea.title}`}
    >
      <div className="flex w-full min-w-0 flex-col gap-2 text-left">
        <div className="flex items-center gap-1">
          <Icon icon={Lightbulb} size="base" />
          <Text render={<span />} size="sm" weight="semibold" color="emphasized">
            Idea
          </Text>
        </div>
        <Body>{idea.title}</Body>
      </div>
    </ClickableCard>
  )
}

/**
 * A creator's work on their own row: a post that's gone out, or a deliverable
 * that's due (Kind=Deliverable, a purple "Draft due" badge).
 */
export function PlanCreatorCard({
  work,
  network,
  handle,
  onOpen,
}: {
  work: CreatorWork
  network: Network
  handle: string
  onOpen: () => void
}) {
  const due = work.status === 'due'
  return (
    <ClickableCard
      onClick={onOpen}
      className="w-full"
      aria-label={`${due ? 'Draft due' : 'Posted'}, ${handle}: ${work.title}`}
    >
      <div className="flex w-full min-w-0 flex-col items-start gap-2 text-left">
        {due && <Badge color="purple">Draft due</Badge>}
        <div className="w-full">
          <Header network={network} account={handle} time={work.time} />
        </div>
        <Body>{work.title}</Body>
        <Thumbnail src={work.photo} alt={work.photoAlt} />
      </div>
    </ClickableCard>
  )
}

/**
 * An empty day inside the run. A gap — the day a channel skips between two of
 * its own (Kind=Gap) — always shows its dashed cell and its +; any other empty
 * day shows them only under the pointer or the keyboard, so the plan isn't a
 * wall of dashes.
 */
export function PlanAddCell({
  gap,
  label,
  onAdd,
}: {
  gap: boolean
  label: string
  onAdd: () => void
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={label}
      className={cn(
        'flex min-h-20 w-full flex-1 items-center justify-center rounded-lg border border-dashed border-surface-border text-content-primary',
        'hover:bg-action-ghost-background-hover',
        !gap && 'opacity-0 hover:opacity-100 focus-visible:opacity-100',
        focusRing,
      )}
    >
      <Icon icon={Plus} size="small" />
    </button>
  )
}
