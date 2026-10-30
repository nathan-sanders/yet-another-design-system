import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, CalendarClock, Lightbulb } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Switch } from '../../../../src/components/Switch'
import { Heading, Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { DetailsFields } from '../../components/DetailsFields'
import { floatingYakClearance } from '../../components/FloatingYak'
import { PostPreview } from '../../components/PostPreview'
import { toISODate } from '../../data/dates'
import { campaignFor } from '../../data/campaigns'
import { profiles } from '../../data/posts'
import { NETWORK_NAMES, type Network } from '../../data/types'
import { NetworkIcon } from '../../components/NetworkIcon'
import { useIdeas } from '../ideas/ideasState'
import { useYakChat } from '../../yak/chat'
import { firstOffer } from '../calendar/model'
import { scheduleLabel } from '../calendar/scheduleCommit'
import { momentOf, useSchedule, type ScheduleAt } from '../calendar/scheduleState'
import { CaptionBlock } from './CaptionBlock'
import { ChannelRow } from './ChannelRow'
import {
  captionFor,
  emptyFields,
  formatFor,
  networkOf,
  toDraftInput,
  toDraftPatch,
  toPostInput,
  useComposeForm,
  type CaptionTab,
  type ComposeFields,
} from './composeForm'
import { NetworkOptionsBlock } from './NetworkOptionsBlock'
import { composeFrom, parseCompose } from './paths'
import { prefillFromDraft, prefillFromIdea, prefillFromPost } from './prefill'

/**
 * The post composer, full view (`Plan - Composer / Full View`,
 * `40006009:29479`): the same shell as a creator's full view — Back and the
 * title in the top bar, the actions at its end — with the editor in the wide
 * column and the post as its network will show it in a 384 column beside it.
 *
 * It opens on a draft, a scheduled post, an idea, or a day from a calendar's
 * +, and the query says which (`paths.ts`). An idea is the one that keeps a
 * link: "From Ideas" at the top, and the post it becomes carries `ideaId` so
 * the Ideas board can follow it. Posts stay one channel each, so picking
 * several channels saves one draft or post per channel with the caption and
 * media shared; a network tab writes that network's own caption instead
 * (FINDINGS 143).
 *
 * Yak's bar floats over it and opens the panel rather than Yak's page, so the
 * post stays in view while Yak works on it (FINDINGS 145).
 */
export function ComposeScreen() {
  const [params] = useSearchParams()
  const location = useLocation()
  const source = useMemo(() => parseCompose(params), [params])
  const from = composeFrom(params)
  const { drafts, posts } = useSchedule()
  const { ideas } = useIdeas()

  const draft = source.kind === 'draft' ? drafts.find((d) => d.id === source.draftId) : undefined
  const post = source.kind === 'post' ? posts.find((p) => p.id === source.postId) : undefined
  const idea = source.kind === 'idea' ? ideas[source.ideaId] : undefined
  const missing =
    (source.kind === 'draft' && !draft) ||
    (source.kind === 'post' && !post) ||
    (source.kind === 'idea' && !idea)
  if (missing) return <Navigate to={from} replace />

  const base = draft
    ? prefillFromDraft(draft)
    : post
      ? prefillFromPost(post)
      : idea
        ? prefillFromIdea(idea)
        : emptyFields(source.kind === 'new' ? source.at : null)
  // What Yak sends along when it opens the composer from a reply — not URL
  // state, because the text is Yak's, not a view anyone would link to.
  const prefill = (location.state as { prefill?: Partial<ComposeFields> } | null)?.prefill
  const initial: ComposeFields = prefill
    ? { ...base, ...prefill, captions: { ...base.captions, ...prefill.captions } }
    : base

  return (
    <Composer
      // A different source is a different form.
      key={params.toString()}
      initial={initial}
      from={from}
      editing={draft ? { kind: 'draft', id: draft.id } : post ? { kind: 'post', id: post.id } : null}
    />
  )
}

type Editing = { kind: 'draft'; id: string } | { kind: 'post'; id: string } | null

function Composer({ initial, from, editing }: { initial: ComposeFields; from: string; editing: Editing }) {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = Toast.useToast()
  const schedule = useSchedule()
  const { ideas, detachIdea } = useIdeas()
  const chat = useYakChat()
  const { fields, set, patch, setFields } = useComposeForm(initial)
  const [tab, setTab] = useState<CaptionTab>('all')
  const [previewNetwork, setPreviewNetwork] = useState<Network | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const networks = Array.from(
    new Set(fields.profileIds.map(networkOf).filter((n): n is Network => n !== undefined)),
  )

  // Yak beside the composer: tell the chat what the post is, and take what a
  // reply applies — a network's caption, a preview switch — keeping the
  // caption it replaces so an Undo (the entry going away) can put it back.
  const networkKey = networks.join(',')
  const { setComposeTarget } = chat
  useEffect(() => {
    setComposeTarget({
      networks: networkKey ? (networkKey.split(',') as Network[]) : [],
      caption: fields.caption,
    })
  }, [setComposeTarget, networkKey, fields.caption])
  useEffect(() => () => setComposeTarget(null), [setComposeTarget])
  const taken = useRef(
    new Map<string, { kind: 'caption' | 'preview'; network: Network; before: string | undefined }>(),
  )
  useEffect(() => {
    // Undos first: "Shorten more" is an undo and an apply in one tick, and the
    // apply has to land on the caption as it was before either.
    for (const [id, was] of taken.current) {
      if (chat.applied.some((action) => action.id === id)) continue
      taken.current.delete(id)
      if (was.kind !== 'caption') continue
      setFields((current) => {
        const captions = { ...current.captions }
        if (was.before === undefined) delete captions[was.network]
        else captions[was.network] = was.before
        return { ...current, captions }
      })
    }
    for (const action of chat.applied) {
      if (taken.current.has(action.id)) continue
      if (action.kind === 'caption') {
        setFields((current) => {
          if (!taken.current.has(action.id)) {
            taken.current.set(action.id, {
              kind: 'caption',
              network: action.network,
              before: current.captions[action.network],
            })
          }
          return { ...current, captions: { ...current.captions, [action.network]: action.text } }
        })
        setTab(action.network)
      } else {
        taken.current.set(action.id, { kind: 'preview', network: action.network, before: undefined })
        setPreviewNetwork(action.network)
      }
    }
  }, [chat.applied, setFields])
  const shownTab: CaptionTab = tab !== 'all' && !networks.includes(tab) ? 'all' : tab
  const tabNetwork = shownTab === 'all' ? null : shownTab
  const overridden = (Object.keys(fields.captions) as Network[]).filter((n) => fields.captions[n])
  const previewOn = previewNetwork && networks.includes(previewNetwork) ? previewNetwork : (networks[0] ?? 'instagram')
  const previewProfile = profiles.find((p) => p.network === previewOn && fields.profileIds.includes(p.id)) ?? profiles[0]!

  const captionShown = tabNetwork ? (fields.captions[tabNetwork] ?? fields.caption) : fields.caption
  const setCaption = (value: string) => {
    if (tabNetwork) set('captions', { ...fields.captions, [tabNetwork]: value })
    else set('caption', value)
  }

  const noChannel = fields.profileIds.length === 0
  const noCaption = fields.caption.trim() === '' && overridden.length === 0
  const fromIdea = fields.ideaId ? ideas[fields.ideaId] : undefined

  const toggleProfile = (id: string) =>
    set(
      'profileIds',
      fields.profileIds.includes(id)
        ? fields.profileIds.filter((each) => each !== id)
        : [...fields.profileIds, id],
    )

  const pickTime = (then?: (at: ScheduleAt) => void) =>
    schedule.requestSchedule({
      source: 'pick',
      title: editing?.kind === 'post' ? 'Reschedule post' : 'Schedule post',
      initial: fields.at ?? firstOffer(),
      onPick: (at) => {
        set('at', at)
        then?.(at)
      },
    })

  const leave = () => {
    if (editing?.kind === 'post') {
      navigate(from, { state: { panel: { type: 'post', postId: editing.id } } })
    } else {
      navigate(from)
    }
  }

  const saveDraft = () => {
    setSubmitted(true)
    if (noChannel) return
    if (editing?.kind === 'draft') {
      schedule.updateDraft(editing.id, toDraftPatch(fields, { ...initial, id: editing.id, profileId: fields.profileIds[0]!, authorId: '', edited: '', body: '' }))
      toast.add({ title: 'Draft saved' })
    } else if (editing?.kind === 'post') {
      schedule.updatePost(editing.id, toPostInput(fields, fields.profileIds[0]!))
      toast.add({ title: 'Post updated' })
    } else {
      for (const profileId of fields.profileIds) schedule.addDraft(toDraftInput(fields, profileId))
      // The idea has moved on: it leaves its group, and Drafting takes it.
      if (fields.ideaId) detachIdea(fields.ideaId)
      const n = fields.profileIds.length
      toast.add({ title: n > 1 ? `Saved to Drafts · ${n} channels` : 'Saved to Drafts' })
    }
    leave()
  }

  const schedulePost = (at = fields.at) => {
    setSubmitted(true)
    if (noChannel || noCaption) return
    if (!at) {
      pickTime((picked) => schedulePost(picked))
      return
    }
    if (momentOf(at) <= new Date()) {
      toast.add({ title: 'That time has already gone. Pick a later one.' })
      pickTime((picked) => schedulePost(picked))
      return
    }
    const label = scheduleLabel(at)
    if (editing?.kind === 'post') {
      schedule.updatePost(editing.id, { ...toPostInput(fields, fields.profileIds[0]!), at })
      toast.add({ title: `Updated · ${label}` })
    } else {
      const undos = fields.profileIds.map((profileId) => {
        if (editing?.kind === 'draft') schedule.removeDraft(editing.id)
        return schedule.addPost(toPostInput(fields, profileId), at).undo
      })
      if (fields.ideaId && !editing) undos.push(detachIdea(fields.ideaId))
      toast.add({
        title: `${fields.needsApproval ? 'Sent for review · ' : 'Scheduled for '}${label}`,
        action: { label: 'Undo', onClick: () => undos.forEach((undo) => undo()) },
      })
    }
    const calendar = `/plan/calendar?date=${toISODate(at.date)}`
    navigate(from.startsWith('/plan/calendar') ? calendar : from)
  }

  const title = editing ? 'Edit post' : 'New post'
  const primary = fields.needsApproval ? 'Send for review' : editing?.kind === 'post' ? 'Save' : 'Schedule'

  return (
    <>
      <TopBar
        start={
          <div className="flex items-center gap-2">
            <Button appearance="ghost" startIcon={ArrowLeft} aria-label="Back" onClick={leave} />
            <Heading level={1} size="base" weight="semibold">
              {title}
            </Heading>
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            {editing?.kind === 'post' ? null : (
              <Button appearance="ghost" onClick={saveDraft}>
                Save draft
              </Button>
            )}
            <Button appearance="secondary" startIcon={CalendarClock} onClick={() => pickTime()}>
              <span className="sr-only @min-[640px]/page:not-sr-only">
                {fields.at ? scheduleLabel(fields.at) : 'Pick a time'}
              </span>
            </Button>
            <Button onClick={() => schedulePost()}>{primary}</Button>
          </div>
        }
      />
      <AppShell.Content className="gap-0 p-0 @min-[1024px]/page:flex-row @min-[1024px]/page:overflow-hidden">
        <section
          aria-label="Post"
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-4 p-4 @min-[1024px]/page:overflow-y-auto',
            floatingYakClearance,
          )}
        >
          {fromIdea ? (
            <Card emphasis="subtle" padding={3}>
              <div className="flex items-center gap-2">
                <Lightbulb aria-hidden className="size-4 shrink-0 text-content-primary" />
                <Text size="sm" color="subtle" truncate className="min-w-0 flex-1">
                  <b className="font-semibold text-content-primary">From Ideas</b> · {fromIdea.title}
                  {fromIdea.campaignId ? ` · ${campaignFor(fromIdea.campaignId)?.name}` : ''}
                </Text>
                <Button
                  appearance="ghost"
                  size="small"
                  onClick={() =>
                    navigate(
                      `/plan/ideas/${fromIdea.id}?from=${encodeURIComponent(location.pathname + location.search)}`,
                    )
                  }
                >
                  Open idea
                </Button>
              </div>
            </Card>
          ) : null}
          <ChannelRow
            profileIds={fields.profileIds}
            locked={editing !== null}
            onToggle={toggleProfile}
            tab={shownTab}
            onTabChange={setTab}
            overridden={overridden}
            error={submitted && noChannel ? 'Pick at least one channel.' : undefined}
          />
          <CaptionBlock
            network={tabNetwork}
            format={tabNetwork ? formatFor(fields, tabNetwork) : null}
            onFormatChange={(format) => {
              if (tabNetwork) set('formats', { ...fields.formats, [tabNetwork]: format })
            }}
            caption={captionShown}
            onCaptionChange={setCaption}
            media={fields.media}
            onMediaChange={(media) => set('media', media)}
            error={submitted && noCaption ? 'Write a caption before scheduling.' : undefined}
          />
          <NetworkOptionsBlock
            network={tabNetwork}
            firstComment={fields.firstComment}
            onFirstCommentChange={(value) => set('firstComment', value)}
          />
          <ContentBlock>
            <ContentBlock.Header>Details</ContentBlock.Header>
            <ContentBlock.Content className="flex flex-col gap-4">
              <DetailsFields
                campaignId={fields.campaignId}
                tagNames={fields.tagNames}
                assigneeId={fields.assigneeId}
                onChange={patch}
              />
              <Switch
                label="Needs approval"
                description="Goes out for review instead of straight to the calendar."
                checked={fields.needsApproval}
                onCheckedChange={(checked) => set('needsApproval', checked)}
              />
            </ContentBlock.Content>
          </ContentBlock>
        </section>
        <aside
          aria-label="Preview"
          className={cn(
            'flex shrink-0 flex-col gap-3 border-t border-surface-border p-4',
            '@min-[1024px]/page:w-96 @min-[1024px]/page:overflow-y-auto @min-[1024px]/page:border-t-0 @min-[1024px]/page:border-l',
            floatingYakClearance,
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Heading level={2} size="base" weight="semibold">
              Preview
            </Heading>
            {networks.length > 1 ? (
              <SegmentedControl
                aria-label="Preview on"
                value={previewOn}
                onValueChange={(value) => setPreviewNetwork(value as Network)}
              >
                {networks.map((network) => (
                  // The mark alone, named for a screen reader: the segment's
                  // `startIcon` wants a Lucide glyph, so the mark is the label.
                  <SegmentedControl.Item key={network} value={network} aria-label={NETWORK_NAMES[network]}>
                    <NetworkIcon network={network} />
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl>
            ) : null}
          </div>
          <PostPreview
            network={previewOn}
            profile={previewProfile}
            caption={captionFor(fields, previewOn)}
            media={fields.media}
            format={formatFor(fields, previewOn)}
            at={fields.at}
          />
        </aside>
      </AppShell.Content>
    </>
  )
}
