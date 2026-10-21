import { CalendarClock, Ellipsis, FilePenLine } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ClickableCard } from '../../../../src/components/Card'
import { Menu } from '../../../../src/components/Menu'
import { Panel } from '../../../../src/components/Panel'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { NetworkIcon } from '../../components/NetworkIcon'
import type { Draft } from '../../data/drafts'
import { personFor } from '../../data/people'
import { profiles } from '../../data/posts'
import { useShell } from '../../shell/ShellContext'
import { draftDragId } from './drag'
import { useCardDrag } from './dragHooks'
import { useSchedule } from './scheduleState'

/**
 * The calendar's Drafts button: posts saved as drafts, most recent first, in a
 * `Panel`. Code-first — Figma draws the button but no panel behind it. A draft
 * opens in the composer, which the mock does not have yet.
 *
 * A draft goes on the calendar two ways. **Drag it** onto an hour or a day,
 * or **Schedule…** from its ⋯ menu for a date and time — the keyboard's way.
 * Either way it leaves this list and becomes a scheduled post.
 *
 * The calendar renders this panel, not the shell, and portals it after the
 * Page (`ShellState.screenPanelHost`): a drag only reaches the drop targets
 * inside its own `DragAndDrop`, and the calendar's is inside the page.
 */
export function DraftsPanel({
  open,
  onClose,
  onSchedule,
}: {
  open: boolean
  onClose: () => void
  onSchedule: (draft: Draft) => void
}) {
  const shell = useShell()
  const { drafts } = useSchedule()
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
              onSchedule={() => onSchedule(draft)}
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
 *
 * The card lifts on a pointer drag; only the pointer listener is spread, so it
 * is still a plain button (`useCardDrag`). The ⋯ menu sits over the card's
 * corner as a sibling, never inside it — a button in a button is invalid.
 */
function DraftCard({
  draft,
  onOpen,
  onSchedule,
}: {
  draft: Draft
  onOpen: () => void
  onSchedule: () => void
}) {
  const profile = profiles.find((p) => p.id === draft.profileId)!
  const drag = useCardDrag(draftDragId(draft), {
    source: 'draft',
    draft,
    label: `Draft for ${profile.name}`,
  })
  return (
    <div className="relative">
      <ClickableCard
        ref={drag.ref}
        onPointerDown={drag.onPointerDown}
        onClick={onOpen}
        className={cn('w-full cursor-grab', drag.dragging && 'opacity-40')}
        aria-label={`Draft for ${profile.name}: ${draft.body}`}
      >
        <DraftFace draft={draft} />
      </ClickableCard>
      <div className="absolute top-1.5 right-1.5">
        <Menu>
          <Menu.Trigger
            render={
              <Button
                appearance="ghost"
                startIcon={Ellipsis}
                aria-label={`Actions for the draft for ${profile.name}`}
              />
            }
          />
          <Menu.Popup aria-label={`Actions for the draft for ${profile.name}`}>
            <Menu.Group>
              <Menu.Item startIcon={CalendarClock} onClick={onSchedule}>
                Schedule…
              </Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu>
      </div>
    </div>
  )
}

/** The draft card's contents, shared with the copy carried under the pointer. */
export function DraftFace({ draft }: { draft: Draft }) {
  const profile = profiles.find((p) => p.id === draft.profileId)!
  const author = personFor(draft.authorId)
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 text-left">
      {/* Clear of the ⋯ button that sits over this corner. */}
      <div className="flex min-w-0 items-center gap-2 pr-8">
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
            // Natively draggable, and the browser's own drag would take the pointer.
            draggable={false}
            className="size-10 shrink-0 rounded-md object-cover"
          />
        ) : null}
      </div>
      <Text size="sm" color="subtle">
        {author.name} · {draft.edited}
      </Text>
    </div>
  )
}
