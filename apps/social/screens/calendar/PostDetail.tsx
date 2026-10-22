import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AtSign,
  CalendarClock,
  Ellipsis,
  Eye,
  FileText,
  Paperclip,
  Pencil,
  Smile,
  Tag,
} from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ChatComposer } from '../../../../src/components/Chat'
import { Menu } from '../../../../src/components/Menu'
import { Panel } from '../../../../src/components/Panel'
import { Heading, Text } from '../../../../src/components/Text'
import { Tabs } from '../../../../src/components/Tabs'
import { Token } from '../../../../src/components/Token'
import { cn } from '../../../../src/lib/cn'
import { NoteThread } from '../../components/InternalNote'
import { NetworkIcon } from '../../components/NetworkIcon'
import { formatTime } from '../../data/dates'
import { me } from '../../data/people'
import { commentsFor, eventsFor, statsFor } from '../../data/performance'
import { profileFor } from '../../data/posts'
import type { Post, PostComment, PostEvent } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useUnreadComments } from '../inbox/inboxState'
import { canMove, isPublished, postDate, postMoment } from './model'
import { useSchedule } from './scheduleState'
import { currentTab, usePostThread, type DetailTab } from './postDetailState'
import { ActivityTab, CommentsTab, MeasureTab, PostStatsRow } from './PublishedPost'

// The post detail, in pieces. The calendar shows it in a `Panel`; Engage ›
// Comments by post shows the same pieces as a column beside its list
// (`screens/comments/PostColumn.tsx`). One implementation, two frames.

const headerDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

/**
 * Network, account, date and time, and the post's actions: the row over the
 * copy. `heading` makes the account name the column's heading, where the row is
 * the column's header bar; `start` and `end` take that bar's extra controls.
 */
export function PostByline({
  post,
  heading,
  start,
  end,
}: {
  post: Post
  heading?: boolean
  start?: ReactNode
  end?: ReactNode
}) {
  const shell = useShell()
  const { requestSchedule } = useSchedule()
  const profile = profileFor(post)
  const when = (
    <Text render={<span />} size="sm" color="subtle" className="shrink-0">
      {headerDate.format(postDate(post))} · {formatTime(post.time)}
    </Text>
  )
  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      {start}
      <NetworkIcon network={profile.network} />
      {heading ? (
        // In a header bar the name and the date share the row until a phone,
        // where four buttons leave the name a few letters; there the date
        // drops under it, which the bar's 56px has room for.
        <div className="flex min-w-0 flex-1 items-center gap-2 max-md:flex-col max-md:items-start max-md:gap-0">
          <Heading level={2} size="base" truncate className="max-w-full min-w-0 md:flex-1">
            {profile.name}
          </Heading>
          {when}
        </div>
      ) : (
        <>
          <Text
            render={<span />}
            weight="semibold"
            color="emphasized"
            truncate
            className="min-w-0 flex-1"
          >
            {profile.name}
          </Text>
          {when}
        </>
      )}
      {end}
      {canMove(post) ? (
        // A scheduled post can be moved: Reschedule… is the keyboard's way
        // to do what dragging its card on the calendar does.
        <Menu>
          <Menu.Trigger
            render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Post actions" />}
          />
          <Menu.Popup aria-label="Post actions">
            <Menu.Group>
              <Menu.Item
                startIcon={CalendarClock}
                onClick={() => requestSchedule({ source: 'post', post })}
              >
                Reschedule…
              </Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu>
      ) : (
        <Button
          appearance="ghost"
          startIcon={Ellipsis}
          aria-label="Post actions"
          onClick={() => shell.notBuilt('Post actions')}
        />
      )}
    </div>
  )
}

/**
 * The post as it went (or will go) out: copy, photo, tags and owner, then its
 * numbers once published, or Edit and Preview while it is still scheduled.
 */
export function PostBody({ post }: { post: Post }) {
  const shell = useShell()
  // Read once opened in Comments by post, here as in that list's card.
  const unread = useUnreadComments(post)
  return (
    <div className="flex flex-col gap-3">
      <Text>{post.body}</Text>
      {post.photo ? (
        <img
          src={post.photo}
          alt={post.photoAlt ?? ''}
          className="aspect-video w-full max-w-60 rounded-lg object-cover"
        />
      ) : null}
      <div className="flex flex-wrap gap-1">
        {post.tags ? (
          <Token startIcon={Tag} aria-label={`${post.tags} tags`}>
            {post.tags}
          </Token>
        ) : null}
        <Token avatar={<Token.Avatar name={me.name} src={me.avatar} />}>{me.name}</Token>
      </div>
      {isPublished(post) ? (
        <PostStatsRow stats={{ ...statsFor(post), unread }} />
      ) : (
        // Edit on its own at the start; Preview and the tag count together at
        // the end (`40005911:33236`).
        <div className="flex items-center gap-1">
          <Button appearance="ghost" startIcon={Pencil} onClick={() => shell.notBuilt('Editing')}>
            Edit
          </Button>
          <span className="flex-1" />
          <Button appearance="ghost" startIcon={Eye} onClick={() => shell.notBuilt('Preview')}>
            Preview
          </Button>
          {post.tags ? (
            <Button
              appearance="ghost"
              startIcon={Tag}
              aria-label={`${post.tags} tags`}
              onClick={() => shell.notBuilt('Tags')}
            >
              {post.tags}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}

/**
 * **The thread and the log are tabs.** A scheduled post has two: Notes (the
 * internal thread) and Activity (who made, approved and scheduled it). Once it
 * has gone out there is more to it: Comments first (the public thread, each
 * comment a ticket as in the inbox), Activity carrying on past publishing, and
 * Measure (what it earned).
 *
 * `pinned` is the panel's layout: the tabs pad themselves to the scroller's
 * 16px gutter and the strip sticks to its top, so the way to Activity is
 * still there halfway down a long thread.
 */
export function PostDetailTabs({
  post,
  thread,
  tab,
  onTabChange,
  pinned,
}: {
  post: Post
  thread: PostComment[]
  tab: DetailTab
  onTabChange: (tab: DetailTab) => void
  pinned?: boolean
}) {
  const published = isPublished(post)
  const panel = pinned ? 'py-4' : 'pt-4'
  return (
    <Tabs
      value={currentTab(post, tab)}
      onValueChange={(value) => onTabChange(value as DetailTab)}
      className={cn(pinned && 'px-4 pt-2')}
    >
      <Tabs.List
        aria-label="Post detail sections"
        className={cn(pinned && 'sticky top-0 z-10 bg-surface-background-primary')}
      >
        {published ? <Tabs.Tab value="comments">Comments</Tabs.Tab> : null}
        <Tabs.Tab value="notes">Notes</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        {published ? <Tabs.Tab value="measure">Measure</Tabs.Tab> : null}
      </Tabs.List>
      {published ? (
        <Tabs.Panel value="comments" className={panel}>
          <CommentsTab key={post.id} post={post} thread={commentsFor(post)} />
        </Tabs.Panel>
      ) : null}
      <Tabs.Panel value="notes" className={panel}>
        <section aria-label="Notes" className="flex flex-col gap-4">
          <NoteThread notes={thread} />
          {thread.length === 0 ? (
            <Text size="sm" color="subtle" className="text-center">
              No notes yet. Leave one for the team below.
            </Text>
          ) : null}
        </section>
      </Tabs.Panel>
      <Tabs.Panel value="activity" className={panel}>
        <ActivityTab events={withNotes(post, eventsFor(post), thread)} />
      </Tabs.Panel>
      {published ? (
        <Tabs.Panel value="measure" className={panel}>
          <MeasureTab post={post} />
        </Tabs.Panel>
      ) : null}
    </Tabs>
  )
}

/** The composer under the Notes tab: a note for the team, never a public reply. */
export function NoteComposer({ onSubmit }: { onSubmit: (body: string) => void }) {
  const shell = useShell()
  return (
    <ChatComposer
      aria-label="Leave a note for your team"
      placeholder="Leave a note for your team. @mention to notify"
      rows={2}
      // The Yak composer's 16px corners (`YakComposer`), lifted off the thread
      // that scrolls under it on the medium shadow.
      className="rounded-xl shadow-medium"
      actions={
        <>
          <Button
            appearance="ghost"
            startIcon={AtSign}
            aria-label="Mention"
            onClick={() => shell.notBuilt('Mentions')}
          />
          <Button
            appearance="ghost"
            startIcon={Paperclip}
            aria-label="Attach"
            onClick={() => shell.notBuilt('Attachments')}
          />
          <Button
            appearance="ghost"
            startIcon={Smile}
            aria-label="Emoji"
            onClick={() => shell.notBuilt('Emoji')}
          />
        </>
      }
      onSubmit={onSubmit}
    />
  )
}

/**
 * The post detail panel (`40005911:33285`): the post as it will go out in a
 * section of its own, ruled off from the tabs under it, and on Notes a
 * composer to add to the team's thread. The Body scrolls edge to edge so the
 * rule and the pinned tab strip run the panel's width. A `Panel`, because the
 * calendar stays live beside it — click another post and the panel follows.
 */
export function PostDetailPanel({
  postId,
  tab: requestedTab,
  noteId,
  open,
  onClose,
}: {
  /** The post to show — kept after closing so the panel slides out with it. */
  postId?: string
  /**
   * The tab to open on, when whoever opened the panel asked for one — a
   * notification about a note. Without it the panel keeps the tab you were on.
   */
  tab?: DetailTab
  /** A note to scroll to once the panel is on `tab`: the one a notification quotes. */
  noteId?: string
  open: boolean
  onClose: () => void
}) {
  const { posts } = useSchedule()
  const post = posts.find((p) => p.id === postId)
  const { thread, add } = usePostThread(post)
  const [tab, setTab] = useState<DetailTab>('comments')
  // A request lands when the panel opens with it, or when another post is
  // opened in place with one; clicking around afterwards is yours.
  const [seen, setSeen] = useState({ open, postId, requestedTab })
  if (open !== seen.open || postId !== seen.postId || requestedTab !== seen.requestedTab) {
    setSeen({ open, postId, requestedTab })
    if (open && requestedTab) setTab(requestedTab)
  }
  const content = useRef<HTMLDivElement>(null)
  // A reply sits under its note and can start below the fold, so the note a
  // notification quotes is scrolled into the Body once the tab has rendered.
  useEffect(() => {
    if (!open || !noteId) return
    content.current
      ?.querySelector(`[data-note-id="${noteId}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, postId, noteId])

  if (!post) return null

  return (
    <Panel
      aria-label="Post detail"
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      resizable
    >
      <Panel.Header icon={FileText} closeButton>
        Post detail
      </Panel.Header>
      {/* `scroll-pt-12`: a note scrolled to from above stops under the pinned
          tab strip (8 + 40), not behind it. */}
      <Panel.Body className="scroll-pt-12 p-0">
        <div className="flex flex-col gap-3 border-b border-surface-border p-4">
          <PostByline post={post} />
          <PostBody post={post} />
        </div>
        <div ref={content}>
          <PostDetailTabs post={post} thread={thread} tab={tab} onTabChange={setTab} pinned />
        </div>
      </Panel.Body>
      {currentTab(post, tab) === 'notes' ? (
        <Panel.Footer className="pt-4">
          <NoteComposer onSubmit={add} />
        </Panel.Footer>
      ) : null}
    </Panel>
  )
}

/**
 * The post's events with the team's notes folded in. Notes carry only an age,
 * so the seeded ones sit an hour apart after the post was created, and one
 * added here lands now.
 */
function withNotes(post: Post, events: PostEvent[], notes: PostComment[]): PostEvent[] {
  const created = events.find((e) => e.kind === 'created')?.at ?? postMoment(post)
  const flat = notes.flatMap((note) => [note, ...(note.replies ?? [])])
  const noteEvents = flat.map((note, i): PostEvent => ({
    id: `note-${note.id}`,
    kind: 'note',
    actorId: note.authorId,
    text: `left a note: “${note.body}”`,
    at: note.ago === 'now' ? new Date() : new Date(created.getTime() + (i + 1) * 60 * 60 * 1000),
  }))
  return [...events, ...noteEvents].sort((a, b) => a.at.getTime() - b.at.getTime())
}
