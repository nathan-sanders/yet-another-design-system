import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Image, Link } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { Tabs } from '../../../../src/components/Tabs'
import { TextArea } from '../../../../src/components/TextArea'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { DetailsFields } from '../../components/DetailsFields'
import { NoteThread } from '../../components/InternalNote'
import { MediaTiles } from '../../components/MediaTiles'
import { profileFor, profiles } from '../../data/posts'
import { NETWORK_NAMES, type Idea, type PostEvent } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NoteComposer } from '../calendar/PostDetail'
import { ActivityTab } from '../calendar/PublishedPost'
import { postMoment } from '../calendar/model'
import { useSchedule } from '../calendar/scheduleState'
import { composePath } from '../compose/paths'
import { useIdeas } from './ideasState'
import { isLinked } from './lifecycle'
import { ideaFrom, ideaPath, NEW_IDEA } from './paths'

/**
 * The notes column's foot lifts clear of the floating Yak bar only while the
 * bar is under it. The bar is Figma's 700, centered on the page
 * (`FloatingYak`), so its right edge is `page / 2 + 350`; the composer starts
 * 16 inside the 384 column, at `page - 368`. They overlap below a 1436 page —
 * the 1440 frame's 1192 page included, which is why Figma draws the composer
 * lifted — and from there up the composer sits at the column's foot. Stacked
 * (under 1024) the column is the end of the page's scroll, under the bar, so
 * it lifts there too. `md:` because the bar is hidden on a phone; the 96 is
 * `floatingYakClearance`'s.
 */
const besideYakBar = 'md:@max-[1436px]/page:pb-24'

type IdeaFields = Pick<Idea, 'title' | 'body' | 'image' | 'campaignId' | 'tagNames' | 'assigneeId'>

/**
 * An idea's page (`Plan - Ideas / Idea / Full View`, `40006058:33896`): where
 * an idea is written and edited, on the composer's shell — Back and the title
 * in the top bar, Archive, Make a post and Save at its end, the fields in the
 * wide column and the team's notes in the 384 column beside them. `new` is a
 * blank one, so writing and editing are one screen.
 *
 * An idea is intent: a title, notes, maybe a photo, the campaign it belongs
 * to. No channel and no caption — that is what Make a post adds, in the
 * composer, which opens prefilled and keeps the link (FINDINGS 146). Yak's bar
 * floats over it and opens the panel, as on the composer.
 */
export function IdeaFullView() {
  const { ideaId = NEW_IDEA } = useParams()
  const [params] = useSearchParams()
  const { ideas } = useIdeas()
  const from = ideaFrom(params)
  const isNew = ideaId === NEW_IDEA
  const idea = isNew ? undefined : ideas[ideaId]
  if (!isNew && !idea) return <Navigate to="/plan/ideas" replace />
  return <IdeaEditor key={ideaId} idea={idea} from={from} />
}

function IdeaEditor({ idea, from }: { idea: Idea | undefined; from: string }) {
  const navigate = useNavigate()
  const shell = useShell()
  const toast = Toast.useToast()
  const { createIdea, updateIdea, archiveIdea, attachIdea, notes, addIdeaNote, board } = useIdeas()
  // The bar is gone while Yak is in the panel, and then nothing needs lifting.
  const yakBar = shell.panel?.type !== 'yak' && shell.panel?.type !== 'yak-history'
  const { drafts, posts } = useSchedule()
  // A campaign's Add › Idea opens a new idea with the campaign already set.
  const prefill = (useLocation().state as { prefill?: Partial<IdeaFields> } | null)?.prefill
  const [fields, setFields] = useState<IdeaFields>({
    title: idea?.title ?? '',
    body: idea?.body ?? '',
    image: idea?.image,
    campaignId: idea?.campaignId ?? prefill?.campaignId,
    tagNames: idea?.tagNames ?? [],
    assigneeId: idea?.assigneeId,
  })
  const [submitted, setSubmitted] = useState(false)
  const [tab, setTab] = useState<'notes' | 'activity'>('notes')
  const patch = (change: Partial<IdeaFields>) => setFields((current) => ({ ...current, ...change }))

  const titleMissing = fields.title.trim() === ''
  const linked = idea ? isLinked(idea.id, drafts, posts) : false
  const onBoard = idea ? Object.values(board).some((ids) => ids.includes(idea.id)) : false
  const thread = idea ? (notes[idea.id] ?? []) : []
  const showComposer = Boolean(idea) && tab === 'notes'

  /** Saves what is here; returns the id, or nothing when the title is missing. */
  const save = (): string | undefined => {
    setSubmitted(true)
    if (titleMissing) return undefined
    const clean = { ...fields, title: fields.title.trim(), body: fields.body.trim() }
    if (idea) {
      updateIdea(idea.id, clean)
      return idea.id
    }
    return createIdea(clean)
  }

  const onSave = () => {
    const id = save()
    if (!id) return
    toast.add({ title: idea ? 'Idea saved' : 'Idea added' })
    if (idea) navigate(from)
    else navigate(ideaPath(id, from), { replace: true })
  }

  const onMakePost = () => {
    const id = save()
    if (!id) return
    navigate(composePath({ idea: id, from: ideaPath(id, from) }))
  }

  const onArchive = () => {
    if (!idea) {
      navigate(from)
      return
    }
    const undo = archiveIdea(idea.id)
    toast.add({ title: `Archived “${idea.title}”`, action: { label: 'Undo', onClick: undo } })
    navigate(from)
  }

  // What the Activity tab lists: the idea's own events, then what its posts did.
  const events: PostEvent[] = idea
    ? [
        {
          id: 'created',
          kind: 'created',
          actorId: idea.createdBy,
          text: 'saved the idea',
          at: new Date(0),
        },
        ...thread.map<PostEvent>((note) => ({
          id: note.id,
          kind: 'note',
          actorId: note.authorId,
          text: 'left a note',
          at: new Date(0),
        })),
        ...drafts
          .filter((d) => d.ideaId === idea.id)
          .map<PostEvent>((d) => ({
            id: d.id,
            kind: 'created',
            actorId: d.authorId,
            text: `made a post for ${NETWORK_NAMES[profiles.find((p) => p.id === d.profileId)?.network ?? 'instagram']}`,
            at: new Date(0),
          })),
        ...posts
          .filter((p) => p.ideaId === idea.id)
          .map<PostEvent>((p) => ({
            id: p.id,
            kind: postMoment(p) <= new Date() ? 'published' : 'scheduled',
            text: `${postMoment(p) <= new Date() ? 'published' : 'scheduled'} on ${NETWORK_NAMES[profileFor(p).network]}`,
            at: postMoment(p),
          })),
      ]
    : []

  return (
    <>
      <TopBar
        start={
          <div className="flex items-center gap-2">
            <Button appearance="ghost" startIcon={ArrowLeft} aria-label="Back" onClick={() => navigate(from)} />
            <Heading level={1} size="base" weight="bold">
              {idea ? 'Idea' : 'New idea'}
            </Heading>
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            {/* Not drawn: an idea whose post was deleted is on no column, and
              this is the one way back. It only shows in that state. */}
            {idea && !onBoard && !linked && !idea.archived ? (
              <Button appearance="ghost" onClick={() => attachIdea(idea.id)}>
                Add back to board
              </Button>
            ) : null}
            <Button appearance="ghost" onClick={onArchive}>
              {idea ? 'Archive' : 'Discard'}
            </Button>
            <Button appearance="secondary" onClick={onMakePost}>
              Make a post
            </Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        }
      />
      <AppShell.Content className="gap-0 p-0 @min-[1024px]/page:flex-row @min-[1024px]/page:overflow-hidden">
        <section
          aria-label="Idea"
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-3 p-4 @min-[1024px]/page:overflow-y-auto',
            // Side by side the bar always sits over this column; stacked, the
            // notes come after it and take the clearance instead.
            yakBar && 'md:@min-[1024px]/page:pb-24',
          )}
        >
          {/* Figma's `Block / Idea` has no header, and fills the column: the
            Notes box takes whatever height the other two blocks leave. */}
          <ContentBlock className="h-auto min-h-fit flex-1">
            <ContentBlock.Content className="flex-1 gap-4">
              <Field
                label="Title"
                invalid={submitted && titleMissing}
                error={submitted && titleMissing ? 'Give the idea a title.' : undefined}
              >
                <Input
                  value={fields.title}
                  onChange={(event) => patch({ title: event.target.value })}
                  placeholder="Pineapple Sunrise smoothie launch"
                  autoFocus={!idea}
                />
              </Field>
              <Field label="Notes" className="flex-1">
                <TextArea
                  rows={5}
                  // `items-stretch` lets the textarea take the box's height,
                  // which `flex-1` takes from the Field; `rows` is the floor.
                  className="flex-1 items-stretch"
                  value={fields.body}
                  onValueChange={(value) => patch({ body: value })}
                  placeholder="What the post would be: the shot, the line, the moment."
                />
              </Field>
            </ContentBlock.Content>
          </ContentBlock>
          <ContentBlock className="h-auto shrink-0">
            <ContentBlock.Header>Media</ContentBlock.Header>
            <ContentBlock.Content className="gap-4">
              <MediaTiles
                media={fields.image ? [fields.image] : []}
                onChange={(media) => patch({ image: media[media.length - 1] })}
              />
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  appearance="ghost"
                  startIcon={Image}
                  onClick={() => shell.notBuilt('The Asset library')}
                >
                  Asset library
                </Button>
                <Button
                  appearance="ghost"
                  startIcon={Link}
                  onClick={() => shell.notBuilt('Saving a link')}
                >
                  Paste a link
                </Button>
              </div>
            </ContentBlock.Content>
          </ContentBlock>
          <ContentBlock className="h-auto shrink-0">
            <ContentBlock.Header>Details</ContentBlock.Header>
            <ContentBlock.Content>
              <DetailsFields
                campaignId={fields.campaignId}
                tagNames={fields.tagNames ?? []}
                assigneeId={fields.assigneeId}
                onChange={patch}
              />
            </ContentBlock.Content>
          </ContentBlock>
        </section>
        <aside
          aria-label="Notes"
          className={cn(
            'flex shrink-0 flex-col border-t border-surface-border',
            '@min-[1024px]/page:w-96 @min-[1024px]/page:border-t-0 @min-[1024px]/page:border-l',
          )}
        >
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as 'notes' | 'activity')}
            layout="hug"
            className={cn(
              'flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0 @min-[1024px]/page:overflow-y-auto',
              // With no composer under it (Activity, or an unsaved idea) this
              // is the column's foot, and lifts off the bar the same way.
              !showComposer && yakBar && besideYakBar,
            )}
          >
            <Tabs.List aria-label="Idea sections" className="sticky top-0 z-1 bg-surface-background-primary pt-4">
              <Tabs.Tab value="notes">Notes</Tabs.Tab>
              <Tabs.Tab value="activity">Activity</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="notes">
              {thread.length ? (
                <NoteThread notes={thread} />
              ) : (
                <Text size="sm" color="subtle">
                  {idea ? 'No notes yet. Leave the first one below.' : 'Save the idea to leave notes.'}
                </Text>
              )}
            </Tabs.Panel>
            <Tabs.Panel value="activity">
              {events.length ? (
                <ActivityTab events={events} />
              ) : (
                <Text size="sm" color="subtle">
                  Nothing yet.
                </Text>
              )}
            </Tabs.Panel>
          </Tabs>
          {idea && showComposer ? (
            <div className={cn('shrink-0 p-4 pt-0', yakBar && besideYakBar)}>
              <NoteComposer onSubmit={(body) => addIdeaNote(idea.id, body)} />
            </div>
          ) : null}
        </aside>
      </AppShell.Content>
    </>
  )
}
