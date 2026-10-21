import { FilePenLine } from 'lucide-react'

import { ClickableCard } from '../../../../src/components/Card'
import { Panel } from '../../../../src/components/Panel'
import { Text } from '../../../../src/components/Text'
import { NetworkIcon } from '../../components/NetworkIcon'
import { drafts, type Draft } from '../../data/drafts'
import { personFor } from '../../data/people'
import { profiles } from '../../data/posts'
import { useShell } from '../../shell/ShellContext'

/**
 * The calendar's Drafts button: posts saved as drafts, most recent first, in a
 * `Panel`. Code-first — Figma draws the button but no panel behind it. A draft
 * opens in the composer, which the mock does not have yet.
 */
export function DraftsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const shell = useShell()
  return (
    <Panel
      aria-label="Drafts"
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      resizable
    >
      <Panel.Header icon={FilePenLine}>Drafts</Panel.Header>
      <Panel.Body className="flex flex-col gap-2">
        {drafts.length > 0 ? (
          drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onOpen={() => shell.notBuilt('The post composer')}
            />
          ))
        ) : (
          <Text size="sm" color="subtle">
            No drafts. Save a post as a draft and it waits here.
          </Text>
        )}
      </Panel.Body>
    </Panel>
  )
}

/**
 * One draft, on the day view's agenda card: account, the copy beside its
 * thumbnail, then who saved it and when — a draft has no time to show.
 */
function DraftCard({ draft, onOpen }: { draft: Draft; onOpen: () => void }) {
  const profile = profiles.find((p) => p.id === draft.profileId)!
  const author = personFor(draft.authorId)
  return (
    <ClickableCard
      onClick={onOpen}
      className="w-full"
      aria-label={`Draft for ${profile.name}: ${draft.body}`}
    >
      <div className="flex w-full min-w-0 flex-col gap-2 text-left">
        <div className="flex min-w-0 items-center gap-2">
          <NetworkIcon network={profile.network} />
          <Text
            render={<span />}
            weight="semibold"
            color="emphasized"
            truncate
            className="min-w-0 flex-1"
          >
            {profile.name}
          </Text>
        </div>
        <div className="flex items-start gap-3">
          <Text truncate={2} className="min-w-0 flex-1">
            {draft.body}
          </Text>
          {draft.photo ? (
            <img
              src={draft.photo}
              alt={draft.photoAlt ?? ''}
              className="size-10 shrink-0 rounded-md object-cover"
            />
          ) : null}
        </div>
        <Text size="sm" color="subtle">
          {author.name} · {draft.edited}
        </Text>
      </div>
    </ClickableCard>
  )
}
