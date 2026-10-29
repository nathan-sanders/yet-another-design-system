import type { ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Ellipsis, Plus, Sparkles } from 'lucide-react'

import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { IdeaCard } from '../../components/IdeaCard'
import { NetworkIcon } from '../../components/NetworkIcon'
import { formatTime, weekdayShort } from '../../data/dates'
import { profiles } from '../../data/posts'
import type { Campaign, Idea } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { useYakChat } from '../../yak/chat'
import { useSchedule } from '../calendar/scheduleState'
import { composePath } from '../compose/paths'
import { UNASSIGNED, useIdeas } from '../ideas/ideasState'
import { ideaPath, newIdeaPath } from '../ideas/paths'
import { campaignPosts } from './model'

/** One card on the board: an idea, or a draft or post standing in for the idea it became. */
interface BoardCard {
  key: string
  idea: Idea
  /** The channel and day a draft or post carries, as Tokens under it. */
  end?: ReactNode
  open: () => void
}

interface BoardColumn {
  id: string
  name: string
  cards: BoardCard[]
  /** A column the team adds to; the derived ones fill themselves. */
  add?: () => void
  menu?: { label: string; onClick: () => void }
}

/**
 * A campaign's Ideas tab (`40006187:42177`): every idea on the campaign, on
 * its way to being a post. The first columns are the Ideas board's own —
 * Unassigned and In Progress, holding this campaign's ideas — and the last
 * three follow the work after it leaves the board: Drafting (its drafts),
 * Scheduled and Published (its posts). An idea leaves the board when it
 * becomes a draft (`detachIdea`), so here it keeps going.
 *
 * Cards don't drag here: moving between the board's columns is the Ideas
 * board's job, and the derived columns move when the work does
 * (FINDINGS 199). Gallery is the same cards in a grid.
 */
export function CampaignIdeas({ campaign }: { campaign: Campaign }) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const shell = useShell()
  const chat = useYakChat()
  const { pathname, search } = useLocation()
  const from = pathname + search
  const { ideas, groups, board } = useIdeas()
  const { posts, drafts } = useSchedule()
  const gallery = params.get('view') === 'gallery'

  const newIdea = () =>
    navigate(newIdeaPath(from), { state: { prefill: { campaignId: campaign.id } } })

  const asCard = (id: string): BoardCard | null => {
    const idea = ideas[id]
    if (!idea || idea.campaignId !== campaign.id || idea.archived) return null
    return { key: id, idea, open: () => navigate(ideaPath(id, from)) }
  }

  const boardColumns: BoardColumn[] = groups
    .filter((g) => g.id === UNASSIGNED || g.id === 'in-progress')
    .map((group) => ({
      id: group.id,
      name: group.name,
      cards: (board[group.id] ?? []).map(asCard).filter((c): c is BoardCard => c !== null),
      add: group.id === UNASSIGNED ? newIdea : undefined,
      menu:
        group.id === UNASSIGNED
          ? undefined
          : { label: 'Open the Ideas board', onClick: () => navigate('/plan/ideas') },
    }))

  const channelToken = (profileId: string, when?: string) => {
    const profile = profiles.find((p) => p.id === profileId)
    return (
      <>
        {profile && (
          <Token startIcon={<NetworkIcon network={profile.network} size="small" />}>
            {profile.name}
          </Token>
        )}
        {when && <Token>{when}</Token>}
      </>
    )
  }

  const drafting: BoardCard[] = drafts
    .filter((d) => d.campaignId === campaign.id)
    .map((d) => {
      const from_ = d.ideaId ? ideas[d.ideaId] : undefined
      return {
        key: d.id,
        idea: {
          id: d.id,
          title: from_?.title ?? d.body,
          body: from_ ? from_.body : '',
          image: d.photo ?? from_?.image,
        },
        end: channelToken(d.profileId),
        open: () => navigate(composePath({ draft: d.id, from })),
      }
    })

  const planned = campaignPosts(campaign, posts)
  const postCard = (p: (typeof planned)[number]): BoardCard => {
    const idea = p.post.ideaId ? ideas[p.post.ideaId] : undefined
    return {
      key: p.post.id,
      idea: {
        id: p.post.id,
        title: idea?.title ?? p.post.body,
        body: idea ? idea.body : '',
        image: p.post.photo ?? idea?.image,
      },
      end: channelToken(
        p.post.profileId,
        `${weekdayShort.format(p.date)} ${formatTime(p.post.time)}`,
      ),
      open: () => shell.setPanel({ type: 'post', postId: p.post.id }),
    }
  }

  const columns: BoardColumn[] = [
    ...boardColumns,
    {
      id: 'drafting',
      name: 'Drafting',
      cards: drafting,
      menu: { label: 'Open the calendar', onClick: () => navigate('/plan/calendar') },
    },
    {
      id: 'scheduled',
      name: 'Scheduled',
      cards: planned.filter((p) => !p.published).map(postCard),
      menu: { label: 'Open the calendar', onClick: () => navigate('/plan/calendar') },
    },
    {
      id: 'published',
      name: 'Published',
      // Newest first: the one that just went out is the one to look at.
      cards: planned
        .filter((p) => p.published)
        .reverse()
        .map(postCard),
      menu: { label: 'Open Measure', onClick: () => navigate('/measure/reports') },
    },
  ]
  const count = columns.reduce((n, c) => n + c.cards.length, 0)

  const generate = () => {
    chat.start(`Suggest three post ideas for ${campaign.name}.`, pathname)
    shell.setPanel({ type: 'yak' })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          aria-label="Ideas view"
          value={gallery ? 'gallery' : 'board'}
          onValueChange={(value) => {
            const next = new URLSearchParams(params)
            if (value === 'gallery') next.set('view', 'gallery')
            else next.delete('view')
            setParams(next, { replace: true })
          }}
        >
          <SegmentedControl.Item value="board">Board</SegmentedControl.Item>
          <SegmentedControl.Item value="gallery">Gallery</SegmentedControl.Item>
        </SegmentedControl>
        <span className="flex-1" />
        <Text render={<span />} size="sm" color="subtle">
          {count} {count === 1 ? 'idea' : 'ideas'}
        </Text>
        <Button appearance="secondary" startIcon={Sparkles} onClick={generate}>
          Generate ideas
        </Button>
        <Button appearance="primary" startIcon={Plus} onClick={newIdea}>
          New idea
        </Button>
      </div>

      {gallery ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3">
          {columns.flatMap((column) =>
            column.cards.map((card) => (
              <IdeaCard
                key={card.key}
                idea={card.idea}
                status={column.name}
                end={card.end}
                onClick={card.open}
                showCampaign={false}
              />
            )),
          )}
        </div>
      ) : (
        // The columns keep the file's 267, run as tall as the longest, as the file's
        // do, and the board scrolls sideways past them.
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {columns.map((column) => (
            <Column key={column.id} column={column} />
          ))}
        </div>
      )}
    </div>
  )
}

/** A column: the Ideas board's subtle Content Block, with its count beside the name. */
function Column({ column }: { column: BoardColumn }) {
  return (
    <ContentBlock emphasis="subtle" headingLevel={2} className="h-auto w-67 shrink-0">
      <ContentBlock.Header
        titleSlot={<Badge color="neutral">{column.cards.length}</Badge>}
        actions={
          <>
            {column.add && (
              <Button
                appearance="ghost"
                startIcon={Plus}
                aria-label={`New idea in ${column.name}`}
                onClick={column.add}
              />
            )}
            {column.menu && (
              <Menu>
                <Menu.Trigger
                  render={
                    <Button
                      appearance="ghost"
                      startIcon={Ellipsis}
                      aria-label={`${column.name} actions`}
                    />
                  }
                />
                <Menu.Popup aria-label={`${column.name} actions`}>
                  <Menu.Group>
                    <Menu.Item onClick={column.menu.onClick}>{column.menu.label}</Menu.Item>
                  </Menu.Group>
                </Menu.Popup>
              </Menu>
            )}
          </>
        }
      >
        {column.name}
      </ContentBlock.Header>
      <ContentBlock.Content className="gap-2 px-2 pb-4">
        {column.cards.map((card) => (
          <IdeaCard
            key={card.key}
            idea={card.idea}
            end={card.end}
            onClick={card.open}
            showCampaign={false}
          />
        ))}
        {column.add && (
          <div className="px-2">
            <Button appearance="ghost" startIcon={Plus} onClick={column.add}>
              New idea
            </Button>
          </div>
        )}
      </ContentBlock.Content>
    </ContentBlock>
  )
}
