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
import { Token } from '../../../../src/components/Token'
import { NetworkIcon } from '../../components/NetworkIcon'
import { formatTime } from '../../data/dates'
import { me, personFor } from '../../data/people'
import { posts, profileFor } from '../../data/posts'
import type { PostComment } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { postDate } from './model'

const headerDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

/**
 * The post detail panel (`40005911:33082`): the post as it will go out, then
 * the team's internal thread about it and a composer to add to it. A `Panel`,
 * because the calendar stays live beside it — click another post and the panel
 * follows.
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

  if (!post) return null
  const profile = profileFor(post)
  const thread = [...(post.thread ?? []), ...(added[post.id] ?? [])]

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
      <Panel.Body className="relative flex flex-col gap-4">
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
          <div className="flex items-center justify-between gap-2">
            <Button appearance="ghost" startIcon={Pencil} onClick={() => shell.notBuilt('Editing')}>
              Edit
            </Button>
            <Button appearance="ghost" startIcon={Eye} onClick={() => shell.notBuilt('Preview')}>
              Preview
            </Button>
          </div>
        </div>

        <Divider />

        <section aria-label="Activity" className="flex flex-col gap-4">
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
                  sender={`${author.name}, internal note`}
                  metadata={
                    <ChatMessage.Metadata
                      timestamp={comment.ago}
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
                  {/* ChatMessage's `sender` is screen-reader text only; the file
                      draws the name and an Internal badge over a team note, so
                      the visible row is drawn here and hidden from the
                      accessibility tree to avoid reading the name twice.
                      See FINDINGS.md. */}
                  <span aria-hidden className="flex items-center gap-2">
                    <Text render={<span />} size="sm" weight="semibold" color="emphasized">
                      {author.name}
                    </Text>
                    <Badge>Internal</Badge>
                  </span>
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
      </Panel.Body>
      {/* Panel has no footer part; this sits under the scrolling body so the
          composer stays put while the thread scrolls. See FINDINGS.md. */}
      <div className="px-4 pb-4">
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
                { id: `local-${Date.now()}`, authorId: me.id, body, ago: 'now' },
              ],
            }))
          }
        />
      </div>
    </Panel>
  )
}
