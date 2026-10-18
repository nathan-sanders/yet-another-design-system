import { useState } from 'react'
import {
  AtSign,
  Ellipsis,
  Eye,
  FileText,
  Heart,
  Paperclip,
  Pencil,
  Reply,
  Smile,
  Tag,
} from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { ChatComposer, ChatMessage } from '../../../../src/components/Chat'
import { Divider } from '../../../../src/components/Divider'
import { Panel } from '../../../../src/components/Panel'
import { Text } from '../../../../src/components/Text'
import { Tabs } from '../../../../src/components/Tabs'
import { Token } from '../../../../src/components/Token'
import { NetworkIcon } from '../../components/NetworkIcon'
import { formatTime } from '../../data/dates'
import { me, personFor } from '../../data/people'
import { commentsFor, eventsFor, statsFor } from '../../data/performance'
import { posts, profileFor } from '../../data/posts'
import type { Post, PostComment, PostEvent } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { isPublished, postDate, postMoment } from './model'
import { ActivityTab, CommentsTab, MeasureTab, PostStatsRow } from './PublishedPost'

const headerDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

type PublishedTab = 'comments' | 'notes' | 'activity' | 'measure'

/**
 * The post detail panel (`40005911:33082`): the post as it will go out, then
 * the team's internal thread about it and a composer to add to it. A `Panel`,
 * because the calendar stays live beside it — click another post and the panel
 * follows.
 *
 * **A published post gets tabs.** Once it has gone out there is more to it
 * than the team's notes: its numbers under the copy, then Comments (the public
 * thread, each comment a ticket as in the inbox), Notes (the same internal
 * thread and composer), Activity (everything that happened to it) and
 * Measure (what it earned). The composer shows only on Notes.
 */
export function PostDetailPanel({
  postId,
  open,
  onClose,
}: {
  /** The post to show — kept after closing so the panel slides out with it. */
  postId?: string
  open: boolean
  onClose: () => void
}) {
  const shell = useShell()
  const post = posts.find((p) => p.id === postId)
  // Notes added here live for the session, per post — enough to show the
  // composer working without a backend.
  const [added, setAdded] = useState<Record<string, PostComment[]>>({})
  const [tab, setTab] = useState<PublishedTab>('comments')

  if (!post) return null
  const profile = profileFor(post)
  const thread = [...(post.thread ?? []), ...(added[post.id] ?? [])]
  const published = isPublished(post)
  const showComposer = !published || tab === 'notes'

  const notes = (
    <section aria-label="Notes" className="flex flex-col gap-4">
      <Text size="sm" color="subtle" className="text-center">
        Post created by {me.name}
      </Text>
      <div role="log" aria-label="Team notes" className="flex flex-col gap-4">
        {thread.map((comment) => {
          const author = personFor(comment.authorId)
          return (
            <ChatMessage
              key={comment.id}
              layout="fill"
              avatar={<Avatar name={author.name} src={author.avatar} size="small" />}
              header={
                <ChatMessage.Header
                  name={author.name}
                  badge={<Badge>Internal</Badge>}
                  timestamp={comment.ago}
                />
              }
              metadata={
                <ChatMessage.Metadata
                  actions={
                    <>
                      <Button
                        appearance="ghost"
                        size="small"
                        startIcon={Reply}
                        onClick={() => shell.notBuilt('Replies')}
                      >
                        Reply
                      </Button>
                      <Button
                        appearance="ghost"
                        size="small"
                        startIcon={Heart}
                        onClick={() => shell.notBuilt('Likes')}
                      >
                        Like
                      </Button>
                    </>
                  }
                />
              }
            >
              <ChatMessage.Bubble>{comment.body}</ChatMessage.Bubble>
            </ChatMessage>
          )
        })}
      </div>
      {thread.length === 0 ? (
        <Text size="sm" color="subtle" className="text-center">
          No notes yet. Leave one for the team below.
        </Text>
      ) : null}
    </section>
  )

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
      <Panel.Body className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
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
            <Text render={<span />} size="sm" color="subtle" className="shrink-0">
              {headerDate.format(postDate(post))} · {formatTime(post.time)}
            </Text>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="Post actions"
              onClick={() => shell.notBuilt('Post actions')}
            />
          </div>
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
          {published ? (
            <PostStatsRow stats={statsFor(post)} />
          ) : (
            <div className="flex items-center justify-between gap-2">
              <Button
                appearance="ghost"
                startIcon={Pencil}
                onClick={() => shell.notBuilt('Editing')}
              >
                Edit
              </Button>
              <Button appearance="ghost" startIcon={Eye} onClick={() => shell.notBuilt('Preview')}>
                Preview
              </Button>
            </div>
          )}
        </div>

        {published ? (
          <Tabs value={tab} onValueChange={(value) => setTab(value as PublishedTab)} layout="fill">
            <Tabs.List aria-label="Post detail sections">
              <Tabs.Tab value="comments">Comments</Tabs.Tab>
              <Tabs.Tab value="notes">Notes</Tabs.Tab>
              <Tabs.Tab value="activity">Activity</Tabs.Tab>
              <Tabs.Tab value="measure">Measure</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="comments" className="pt-4">
              <CommentsTab key={post.id} post={post} thread={commentsFor(post)} />
            </Tabs.Panel>
            <Tabs.Panel value="notes" className="pt-4">
              {notes}
            </Tabs.Panel>
            <Tabs.Panel value="activity" className="pt-4">
              <ActivityTab events={withNotes(post, eventsFor(post), thread)} />
            </Tabs.Panel>
            <Tabs.Panel value="measure" className="pt-4">
              <MeasureTab post={post} />
            </Tabs.Panel>
          </Tabs>
        ) : (
          <>
            <Divider />
            {notes}
          </>
        )}
      </Panel.Body>
      {showComposer ? (
        <Panel.Footer>
          <ChatComposer
            aria-label="Leave a note for your team"
            placeholder="Leave a note for your team. @mention to notify"
            rows={2}
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
            onSubmit={(body) =>
              setAdded((current) => ({
                ...current,
                [post.id]: [
                  ...(current[post.id] ?? []),
                  {
                    id: `local-${Date.now()}`,
                    authorId: me.id,
                    body,
                    ago: 'now',
                  },
                ],
              }))
            }
          />
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
  const noteEvents = notes.map((note, i): PostEvent => ({
    id: `note-${note.id}`,
    kind: 'note',
    actorId: note.authorId,
    text: `left a note: “${note.body}”`,
    at: note.ago === 'now' ? new Date() : new Date(created.getTime() + (i + 1) * 60 * 60 * 1000),
  }))
  return [...events, ...noteEvents].sort((a, b) => a.at.getTime() - b.at.getTime())
}
