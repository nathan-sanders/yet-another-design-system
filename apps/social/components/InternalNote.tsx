import { useState, type ReactNode } from 'react'
import { Ellipsis, Heart, Reply } from 'lucide-react'

import { Avatar } from '../../../src/components/Avatar'
import { Badge } from '../../../src/components/Badge'
import { Button } from '../../../src/components/Button'
import { Text } from '../../../src/components/Text'
import { cn } from '../../../src/lib/cn'
import { personFor } from '../data/people'
import type { PostComment } from '../data/types'
import { useShell } from '../shell/ShellContext'

/**
 * The team's internal notes, in one style wherever they show: Plan's post
 * detail and Engage's conversation. Each note is a sticky note — a pale yellow
 * slip with its bottom-right corner folded — under the author's face, name, an
 * `Internal` badge, the age and a `⋯`, with Reply and Like beneath. Replies
 * sit one step in, joined to the note they answer by an elbow from its face.
 *
 * Not a `ChatMessage`: a note is a slip pinned to a post or a conversation for
 * the team, not a turn in a chat, so it gets no bubble alignment and no
 * sender/recipient sides.
 */
export function NoteThread({
  notes,
  label = 'Team notes',
  className,
}: {
  notes: PostComment[]
  label?: string
  className?: string
}) {
  return (
    // The log is a wrapper: on the <ul> itself the role would replace the
    // list's, and every <li> would be an item with no list.
    <div role="log" aria-label={label} className={className}>
      <ul className="flex flex-col gap-4">
        {notes.map((note) => (
          <li key={note.id}>
            <InternalNote note={note} threaded={Boolean(note.replies?.length)} />
            {note.replies?.length ? (
              // 12px in is the center of the 24px face above, where the line
              // starts; each reply's face sits a further 20px in, under the name.
              <ul aria-label={`Replies to ${personFor(note.authorId).name}`} className="ml-3">
                {note.replies.map((reply, i) => (
                  <li
                    key={reply.id}
                    className={cn(
                      'relative pt-4 pl-5',
                      // The elbow: down from the line and across into the face.
                      'before:absolute before:top-0 before:left-0 before:h-7 before:w-4 before:rounded-bl-lg before:border-b before:border-l before:border-surface-border',
                      // The line carries on past this reply to the next one.
                      i < note.replies!.length - 1 &&
                        'after:absolute after:top-0 after:bottom-0 after:left-0 after:border-l after:border-surface-border',
                    )}
                  >
                    <InternalNote note={reply} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** One note. `threaded` runs a line down from the face to its replies. */
export function InternalNote({ note, threaded }: { note: PostComment; threaded?: boolean }) {
  const shell = useShell()
  const author = personFor(note.authorId)
  const [liked, setLiked] = useState(false)
  const replies = note.replies?.length ?? 0

  return (
    <article aria-label={`${author.name}, internal note, ${note.ago}`} className="flex gap-2">
      <div className="flex shrink-0 flex-col items-center">
        <Avatar
          name={author.name}
          src={author.avatar}
          alt=""
          size="small"
          status={author.status}
          className="mt-1"
        />
        {threaded ? (
          <span aria-hidden="true" className="mt-1 w-px flex-1 bg-surface-border" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <Text
            render={<span />}
            weight="semibold"
            color="emphasized"
            truncate
            className="min-w-0 flex-1"
          >
            {author.name}
          </Text>
          <InternalBadge />
          <Text render={<span />} size="sm" color="subtle" className="shrink-0">
            {note.ago}
          </Text>
          <Button
            appearance="ghost"
            startIcon={Ellipsis}
            aria-label={`More for ${author.name}'s note`}
            onClick={() => shell.notBuilt('Note actions')}
          />
        </div>
        <StickyNote>{note.body}</StickyNote>
        <div className="flex items-center gap-1">
          <Button appearance="ghost" startIcon={Reply} onClick={() => shell.notBuilt('Replies')}>
            {replies ? `${replies} ${replies === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
          </Button>
          <Button
            appearance="ghost"
            startIcon={Heart}
            aria-pressed={liked}
            className={cn(liked && '[&_svg]:fill-current')}
            onClick={() => setLiked((l) => !l)}
          >
            Like
          </Button>
        </div>
      </div>
    </article>
  )
}

/**
 * The dark `Internal` pill. Badge has no inverse color, so the emphasized
 * surface and inverse content are put on a neutral one (FINDINGS 36).
 */
export function InternalBadge() {
  return (
    <Badge className="shrink-0 bg-surface-background-emphasized text-content-inverse">
      Internal
    </Badge>
  )
}

/**
 * The slip: the decorative yellow at 30% over the surface, its bottom-right
 * corner cut off and a flap in the yellow's foreground folded over the cut.
 * Both are alphas of theme-aware tokens, so one class serves both themes.
 */
function StickyNote({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-lg bg-decorative-yellow-background/30 px-3 py-2.5',
          '[clip-path:polygon(0_0,100%_0,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%)]',
        )}
      >
        <Text className="whitespace-pre-line">{children}</Text>
      </div>
      <span
        aria-hidden="true"
        className="absolute right-0 bottom-0 size-4 rounded-tl-sm bg-decorative-yellow-foreground/30 [clip-path:polygon(0_0,100%_0,0_100%)]"
      />
    </div>
  )
}
