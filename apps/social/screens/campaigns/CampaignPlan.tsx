import { Fragment, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'

import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import { CalendarPostCard } from '../../components/PostCards'
import { NetworkIcon } from '../../components/NetworkIcon'
import { creatorById } from '../../data/creators'
import { addDays, sameDay, weekdayShort } from '../../data/dates'
import { profiles } from '../../data/posts'
import { NETWORK_NAMES, type Campaign, type Network } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { composePath } from '../compose/paths'
import { isPast, pastDayPattern, today } from '../calendar/model'
import { useSchedule } from '../calendar/scheduleState'
import { useIdeas } from '../ideas/ideasState'
import { ideaPath, newIdeaPath } from '../ideas/paths'
import {
  activeCreators,
  campaignDate,
  campaignPencilled,
  campaignPosts,
  campaignWeeks,
  currentWeekIndex,
  gapsFor,
  inRun,
  isOnBoard,
  weekLabel,
} from './model'
import { PlanAddCell, PlanCreatorCard, PlanDraftCard, PlanIdeaCard } from './PlanCards'

const weekdayLong = new Intl.DateTimeFormat('en-US', { weekday: 'long' })

const STATUS_WORDS = {
  invited: 'Invited',
  confirmed: 'Confirmed',
  live: 'Live',
  withdrawn: 'Withdrawn',
}

/**
 * A campaign's Plan tab (`40006158:66912`): its channels down the side and the
 * days across, with everything on the campaign in its cell — scheduled posts,
 * and the drafts and ideas pencilled in (dashed, because they aren't
 * scheduled). Below them, a row for each creator who said yes, with what
 * they've posted and what they owe.
 *
 * Week steps through the calendar weeks the run touches, in `?week=`; Whole
 * run, which the file names and doesn't draw, stacks them (FINDINGS 193).
 * Empty days inside the run take a +, which opens the composer on that
 * channel and day with the campaign set; a gap shows its + without being
 * asked. Nothing drags here yet (FINDINGS 194).
 */
export function CampaignPlan({ campaign }: { campaign: Campaign }) {
  const [params, setParams] = useSearchParams()
  const weeks = campaignWeeks(campaign)
  const wholeRun = params.get('plan') === 'run'
  const asked = Number(params.get('week'))
  const index =
    Number.isInteger(asked) && asked >= 1 && asked <= weeks.length
      ? asked - 1
      : currentWeekIndex(weeks)
  const week = weeks[index]!

  const update = (change: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    change(next)
    setParams(next, { replace: true })
  }
  const goTo = (i: number) =>
    update((p) => {
      if (i === currentWeekIndex(weeks)) p.delete('week')
      else p.set('week', String(i + 1))
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          aria-label="Plan range"
          value={wholeRun ? 'run' : 'week'}
          onValueChange={(value) =>
            update((p) => {
              if (value === 'run') p.set('plan', 'run')
              else p.delete('plan')
            })
          }
        >
          <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
          <SegmentedControl.Item value="run">Whole run</SegmentedControl.Item>
        </SegmentedControl>
        {!wholeRun && (
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Previous week"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            />
            <Text render={<span />} weight="semibold" aria-live="polite">
              {weekLabel(week)} · week {index + 1} of {weeks.length}
            </Text>
            <Button
              appearance="ghost"
              startIcon={ArrowRight}
              aria-label="Next week"
              disabled={index === weeks.length - 1}
              onClick={() => goTo(index + 1)}
            />
          </div>
        )}
        <span className="flex-1" />
        <AddMenu campaign={campaign} />
      </div>
      {wholeRun ? (
        weeks.map((w, i) => (
          <PlanWeek key={w.getTime()} campaign={campaign} week={w} label={`Week ${i + 1}`} />
        ))
      ) : (
        <PlanWeek campaign={campaign} week={week} />
      )}
    </div>
  )
}

/** The file's primary Add: a post or an idea, on the campaign. */
function AddMenu({ campaign }: { campaign: Campaign }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const from = pathname + search
  return (
    <Menu>
      <Menu.Trigger
        render={
          <Button appearance="primary" endIcon={ChevronDown}>
            Add
          </Button>
        }
      />
      <Menu.Popup aria-label={`Add to ${campaign.name}`} align="end">
        <Menu.Group>
          <Menu.Item
            onClick={() =>
              navigate(composePath({ from }), {
                state: { prefill: { campaignId: campaign.id } },
              })
            }
          >
            Post
          </Menu.Item>
          <Menu.Item
            onClick={() =>
              navigate(newIdeaPath(from), { state: { prefill: { campaignId: campaign.id } } })
            }
          >
            Idea
          </Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  )
}

/** One week of the plan: the grid, with a creators group under the channels. */
function PlanWeek({ campaign, week, label }: { campaign: Campaign; week: Date; label?: string }) {
  const shell = useShell()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const from = pathname + search
  const { posts, drafts } = useSchedule()
  const { ideas } = useIdeas()
  const [creatorsOpen, setCreatorsOpen] = useState(true)

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i))
  const planned = campaignPosts(campaign, posts)
  const pencilled = campaignPencilled(campaign, drafts, Object.values(ideas))
  const gaps = gapsFor(campaign, [...planned, ...pencilled])
  const creators = activeCreators(campaign).filter(isOnBoard)

  const add = (network: Network, date: Date) => {
    const profile = profiles.find((p) => p.id.startsWith('vv-') && p.network === network)
    navigate(composePath({ date, time: '12:00', from }), {
      state: {
        prefill: { campaignId: campaign.id, profileIds: profile ? [profile.id] : undefined },
      },
    })
  }

  const cellFor = (network: Network, date: Date): ReactNode => {
    const items: ReactNode[] = []
    for (const p of planned) {
      if (p.network !== network || !sameDay(p.date, date)) continue
      items.push(
        <CalendarPostCard
          key={p.post.id}
          post={p.post}
          onOpen={() => shell.setPanel({ type: 'post', postId: p.post.id })}
        />,
      )
    }
    for (const entry of pencilled) {
      if (entry.network !== network || !sameDay(entry.date, date)) continue
      items.push(
        entry.kind === 'draft' ? (
          <PlanDraftCard
            key={entry.draft.id}
            draft={entry.draft}
            onOpen={() => navigate(composePath({ draft: entry.draft.id, from }))}
          />
        ) : (
          <PlanIdeaCard
            key={entry.idea.id}
            idea={entry.idea}
            onOpen={() => navigate(ideaPath(entry.idea.id, from))}
          />
        ),
      )
    }
    if (items.length === 0 && !isPast(date) && inRun(campaign, date)) {
      const gap = gaps.some((g) => g.network === network && sameDay(g.date, date))
      const when = `${NETWORK_NAMES[network]} on ${weekdayLong.format(date)}`
      items.push(
        <PlanAddCell
          key="add"
          gap={gap}
          label={gap ? `Gap: nothing on ${when}. Add a post` : `Add a post to ${when}`}
          onAdd={() => add(network, date)}
        />,
      )
    }
    return items
  }

  return (
    <section
      aria-label={label ?? `Week of ${weekLabel(week)}`}
      // The grid scrolls rather than squash: a 1000px plan on a phone (FINDINGS 192).
      className="overflow-x-auto rounded-lg border border-surface-border"
    >
      <div className="grid min-w-240 grid-cols-[10rem_repeat(7,minmax(0,1fr))]">
        <div className="flex h-10 items-center border-b border-surface-border pl-3">
          <Text render={<span />} size="sm" color="subtle">
            Channels
          </Text>
        </div>
        {days.map((day) => {
          const isToday = sameDay(day, today)
          return (
            <div
              key={day.getTime()}
              className={cn(
                'relative flex h-10 items-center border-b border-l border-surface-border py-2 pr-1 pl-3',
                isPast(day) && pastDayPattern,
                // The file's 2px Highlight under today's name.
                isToday && 'shadow-[inset_0_-2px_0_var(--surface-border-emphasized)]',
              )}
            >
              <Text
                render={<span />}
                size="sm"
                weight={isToday ? 'semibold' : 'normal'}
                color={isToday ? 'emphasized' : isPast(day) ? 'subtle' : 'primary'}
              >
                {weekdayShort.format(day)} {day.getDate()}
              </Text>
            </div>
          )
        })}

        {campaign.channels.map((network) => {
          const profile = profiles.find((p) => p.id.startsWith('vv-') && p.network === network)
          const handle = profile?.network === 'facebook' ? profile.name : `@${profile?.name ?? ''}`
          return (
            <Row
              key={network}
              head={
                <>
                  <NetworkIcon network={network} className="size-5" />
                  <RowName name={NETWORK_NAMES[network]} detail={handle} />
                </>
              }
              days={days}
              cell={(date) => cellFor(network, date)}
            />
          )
        })}

        {creators.length > 0 && (
          <>
            <button
              type="button"
              aria-expanded={creatorsOpen}
              onClick={() => setCreatorsOpen((open) => !open)}
              className={cn(
                'col-span-full flex items-center gap-2 border-b border-surface-border bg-surface-background-subtle px-3 py-2 text-left',
                focusRing,
              )}
            >
              <Icon icon={creatorsOpen ? ChevronDown : ChevronRight} size="small" />
              <Text render={<span />} size="sm" weight="semibold">
                Creators · {creators.length} confirmed
              </Text>
            </button>
            {creatorsOpen &&
              creators.map((c) => {
                const creator = creatorById(c.creatorId)
                if (!creator) return null
                return (
                  <Row
                    key={c.creatorId}
                    head={
                      <>
                        <Avatar name={creator.name} src={creator.avatar} size="x-small" alt="" />
                        <RowName
                          name={creator.name}
                          detail={`${NETWORK_NAMES[c.network]} · ${STATUS_WORDS[c.status]}`}
                        />
                      </>
                    }
                    days={days}
                    cell={(date) =>
                      (c.work ?? [])
                        .filter((w) => sameDay(campaignDate(w.day), date))
                        .map((w) => (
                          <PlanCreatorCard
                            key={w.id}
                            work={w}
                            network={c.network}
                            handle={creator.handle}
                            onOpen={() =>
                              shell.setPanel({ type: 'creator', creatorId: c.creatorId })
                            }
                          />
                        ))
                    }
                  />
                )
              })}
          </>
        )}
      </div>
    </section>
  )
}

/** One row: the 160 header column, then a cell per day. The last row's rule is the frame's. */
function Row({
  head,
  days,
  cell,
}: {
  head: ReactNode
  days: Date[]
  cell: (date: Date) => ReactNode
}) {
  return (
    <Fragment>
      <div className="flex min-h-40 items-start gap-2 border-b border-surface-border pt-3 pr-2 pl-3 [&:nth-last-child(8)]:border-b-0">
        {head}
      </div>
      {days.map((day) => (
        <div
          key={day.getTime()}
          className={cn(
            'flex min-w-0 flex-col gap-1 border-b border-l border-surface-border p-1',
            '[&:nth-last-child(-n+7)]:border-b-0',
            isPast(day) && pastDayPattern,
          )}
        >
          {cell(day)}
        </div>
      ))}
    </Fragment>
  )
}

function RowName({ name, detail }: { name: string; detail: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <Text render={<span />} size="sm" weight="semibold" truncate>
        {name}
      </Text>
      {/* Wraps rather than truncates: "Instagram · Confirmed" is wider than the
          column, and the file lets it run past the edge. */}
      <Text render={<span />} size="sm" color="subtle">
        {detail}
      </Text>
    </span>
  )
}
